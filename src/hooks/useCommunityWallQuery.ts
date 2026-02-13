/**
 * useCommunityWall (React Query 版)
 *
 * 社區牆資料獲取 Hook
 * 使用 @tanstack/react-query 實現 SWR 策略
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';
import {
  getCommunityWall,
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  askQuestion as apiAskQuestion,
  answerQuestion as apiAnswerQuestion,
  type CommunityWallData,
  type CommunityPost,
} from '../services/communityService';
import { usePageMode, type PageMode } from './usePageMode';

// [NASA TypeScript Safety] Zod Schema 用於驗證錯誤物件的 status 屬性
const ErrorWithStatusSchema = z.object({
  status: z.number().optional(),
});

/**
 * [NASA TypeScript Safety] 類型守衛：檢查錯誤物件是否有 status 屬性
 */
function hasErrorStatus(error: unknown): error is { status: number } {
  const result = ErrorWithStatusSchema.safeParse(error);
  return result.success && typeof result.data.status === 'number';
}

// Query Keys
export const communityWallKeys = {
  all: ['communityWall'] as const,
  wall: (mode: PageMode, communityId: string, includePrivate: boolean) =>
    [...communityWallKeys.all, mode, 'wall', communityId, includePrivate] as const,
  posts: (mode: PageMode, communityId: string, visibility: 'public' | 'private') =>
    [...communityWallKeys.all, mode, 'posts', communityId, visibility] as const,
};

export interface UseCommunityWallOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 資料過期時間（毫秒），預設 5 分鐘 */
  staleTime?: number;
  /** 是否在視窗聚焦時刷新 */
  refetchOnWindowFocus?: boolean;
  /** 是否啟用 */
  enabled?: boolean;
  /** 目前使用者 ID（供樂觀更新使用），可為 undefined 表示未登入 */
  currentUserId?: string | undefined;
}

export interface UseCommunityWallReturn {
  /** 社區牆資料 */
  data: CommunityWallData | undefined;
  /** 是否載入中 */
  isLoading: boolean;
  /** 是否正在取得資料 */
  isFetching: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 手動刷新 */
  refresh: () => Promise<void>;
  /** 按讚/取消按讚（樂觀更新） */
  toggleLike: (postId: string) => Promise<void>;
  /** 發布貼文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 發問 */
  askQuestion: (question: string) => Promise<void>;
  /** 回答問題 */
  answerQuestion: (questionId: string, content: string) => Promise<void>;
  /** 是否有樂觀更新中的操作 */
  isOptimisticUpdating: boolean;
}

export function useCommunityWall(
  communityId: string | undefined,
  options: UseCommunityWallOptions = {}
): UseCommunityWallReturn {
  const {
    includePrivate = false,
    staleTime = 5 * 60 * 1000, // 5 分鐘
    refetchOnWindowFocus = true,
    enabled = true,
    currentUserId,
  } = options;

  const queryClient = useQueryClient();
  const mode = usePageMode();
  const [isOptimisticUpdating, setIsOptimisticUpdating] = useState(false);
  const wallQueryKey = useMemo(
    () => communityWallKeys.wall(mode, communityId || '', includePrivate),
    [communityId, includePrivate, mode]
  );
  // K: 若未登入則不使用樂觀更新（避免假成功再回滾的差 UX）
  const canOptimisticUpdate = !!currentUserId;
  const optimisticUserId = currentUserId ?? '';

  // 主要查詢
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: wallQueryKey,
    queryFn: () => getCommunityWall(communityId!, { includePrivate }),
    enabled: enabled && !!communityId,
    staleTime,
    refetchOnWindowFocus,
    // 降低 retry 次數和延遲，避免用戶等待太久
    retry: (failureCount, error) => {
      // [NASA TypeScript Safety] 使用類型守衛驗證錯誤狀態碼
      // 400/401/403/404 錯誤不重試
      if (hasErrorStatus(error)) {
        const nonRetryableStatuses = [400, 401, 403, 404];
        if (nonRetryableStatuses.includes(error.status)) {
          return false;
        }
      }
      return failureCount < 1; // 最多重試 1 次
    },
    retryDelay: 1000, // 1 秒後重試
  });

  // 手動刷新（註：快取由 React Query invalidateQueries 處理）
  const refresh = useCallback(async () => {
    if (communityId) {
      await refetch();
    }
  }, [communityId, refetch]);

  // 按讚 Mutation（樂觀更新）
  const likeMutation = useMutation({
    mutationFn: apiToggleLike,
    onMutate: async (postId: string) => {
      // K: 若未登入則跳過樂觀更新，直接讓 API 回應決定
      if (!canOptimisticUpdate) {
        return { previousData: undefined };
      }

      setIsOptimisticUpdating(true);

      // 取消任何正在進行的查詢
      await queryClient.cancelQueries({
        queryKey: wallQueryKey,
      });

      // 保存舊資料用於回滾
      const previousData = queryClient.getQueryData<CommunityWallData>(wallQueryKey);

      // 樂觀更新
      if (previousData) {
        const updatePosts = (posts: CommunityPost[]): CommunityPost[] =>
          posts.map((post) => {
            if (post.id !== postId) return post;
            const isLiked = post.liked_by.includes(optimisticUserId);
            return {
              ...post,
              likes_count: isLiked ? Math.max(0, post.likes_count - 1) : post.likes_count + 1,
              liked_by: isLiked
                ? post.liked_by.filter((id) => id !== optimisticUserId)
                : [...post.liked_by, optimisticUserId],
            };
          });

        queryClient.setQueryData<CommunityWallData>(
          wallQueryKey,
          {
            ...previousData,
            posts: {
              ...previousData.posts,
              public: updatePosts(previousData.posts.public),
              private: updatePosts(previousData.posts.private),
            },
          }
        );
      }

      return { previousData };
    },
    onError: (_err, _postId, context) => {
      // 失敗時回滾
      if (context?.previousData) {
        queryClient.setQueryData(
          wallQueryKey,
          context.previousData
        );
      }
    },
    onSettled: () => {
      setIsOptimisticUpdating(false);
      // 重新驗證資料
      queryClient.invalidateQueries({
        queryKey: wallQueryKey,
      });
    },
  });

  // 發文 Mutation
  const createPostMutation = useMutation({
    mutationFn: ({ content, visibility }: { content: string; visibility: 'public' | 'private' }) =>
      apiCreatePost(communityId!, content, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wallQueryKey,
      });
    },
  });

  // 發問 Mutation
  const askQuestionMutation = useMutation({
    mutationFn: (question: string) => apiAskQuestion(communityId!, question),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wallQueryKey,
      });
    },
  });

  // 回答 Mutation
  const answerQuestionMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      apiAnswerQuestion(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: wallQueryKey,
      });
    },
  });

  // 封裝操作函數
  const toggleLike = useCallback(
    async (postId: string) => {
      await likeMutation.mutateAsync(postId);
    },
    [likeMutation]
  );

  const createPost = useCallback(
    async (content: string, visibility: 'public' | 'private' = 'public') => {
      if (!communityId) throw new Error('缺少社區 ID');
      await createPostMutation.mutateAsync({ content, visibility });
    },
    [communityId, createPostMutation]
  );

  const askQuestion = useCallback(
    async (question: string) => {
      if (!communityId) throw new Error('缺少社區 ID');
      await askQuestionMutation.mutateAsync(question);
    },
    [communityId, askQuestionMutation]
  );

  const answerQuestion = useCallback(
    async (questionId: string, content: string) => {
      await answerQuestionMutation.mutateAsync({ questionId, content });
    },
    [answerQuestionMutation]
  );

  // [NASA TypeScript Safety] 類型守衛確保 error 為 Error 或 null
  const safeError = error instanceof Error ? error : null;

  return {
    data,
    isLoading,
    isFetching,
    error: safeError,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
    isOptimisticUpdating,
  };
}

export default useCommunityWall;
