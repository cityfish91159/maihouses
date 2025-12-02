/**
 * useCommunityWall (React Query 版)
 * 
 * 社區牆資料獲取 Hook
 * 使用 @tanstack/react-query 實現 SWR 策略
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { 
  getCommunityWall, 
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  askQuestion as apiAskQuestion,
  answerQuestion as apiAnswerQuestion,
  clearCommunityCache,
  type CommunityWallData,
  type CommunityPost,
} from '../services/communityService';

// Query Keys
export const communityWallKeys = {
  all: ['communityWall'] as const,
  wall: (communityId: string) => [...communityWallKeys.all, 'wall', communityId] as const,
  posts: (communityId: string, visibility: 'public' | 'private') => 
    [...communityWallKeys.all, 'posts', communityId, visibility] as const,
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
  } = options;

  const queryClient = useQueryClient();
  const [isOptimisticUpdating, setIsOptimisticUpdating] = useState(false);

  // 主要查詢
  const { 
    data, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  } = useQuery({
    queryKey: communityWallKeys.wall(communityId || ''),
    queryFn: () => getCommunityWall(communityId!, { includePrivate }),
    enabled: enabled && !!communityId,
    staleTime,
    refetchOnWindowFocus,
    retry: 2,
  });

  // 手動刷新
  const refresh = useCallback(async () => {
    if (communityId) {
      clearCommunityCache(communityId);
      await refetch();
    }
  }, [communityId, refetch]);

  // 按讚 Mutation（樂觀更新）
  const likeMutation = useMutation({
    mutationFn: apiToggleLike,
    onMutate: async (postId: string) => {
      setIsOptimisticUpdating(true);
      
      // 取消任何正在進行的查詢
      await queryClient.cancelQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });

      // 保存舊資料用於回滾
      const previousData = queryClient.getQueryData<CommunityWallData>(
        communityWallKeys.wall(communityId || '')
      );

      // 樂觀更新
      if (previousData) {
        const updatePosts = (posts: CommunityPost[]): CommunityPost[] => 
          posts.map(post => {
            if (post.id !== postId) return post;
            const isLiked = post.liked_by.includes('current-user');
            return {
              ...post,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
              liked_by: isLiked 
                ? post.liked_by.filter(id => id !== 'current-user')
                : [...post.liked_by, 'current-user'],
            };
          });

        queryClient.setQueryData<CommunityWallData>(
          communityWallKeys.wall(communityId || ''),
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
          communityWallKeys.wall(communityId || ''),
          context.previousData
        );
      }
    },
    onSettled: () => {
      setIsOptimisticUpdating(false);
      // 重新驗證資料
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 發文 Mutation
  const createPostMutation = useMutation({
    mutationFn: ({ content, visibility }: { content: string; visibility: 'public' | 'private' }) =>
      apiCreatePost(communityId!, content, visibility),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 發問 Mutation
  const askQuestionMutation = useMutation({
    mutationFn: (question: string) => apiAskQuestion(communityId!, question),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 回答 Mutation
  const answerQuestionMutation = useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      apiAnswerQuestion(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: communityWallKeys.wall(communityId || '') 
      });
    },
  });

  // 封裝操作函數
  const toggleLike = useCallback(async (postId: string) => {
    await likeMutation.mutateAsync(postId);
  }, [likeMutation]);

  const createPost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
    if (!communityId) throw new Error('缺少社區 ID');
    await createPostMutation.mutateAsync({ content, visibility });
  }, [communityId, createPostMutation]);

  const askQuestion = useCallback(async (question: string) => {
    if (!communityId) throw new Error('缺少社區 ID');
    await askQuestionMutation.mutateAsync(question);
  }, [communityId, askQuestionMutation]);

  const answerQuestion = useCallback(async (questionId: string, content: string) => {
    await answerQuestionMutation.mutateAsync({ questionId, content });
  }, [answerQuestionMutation]);

  return {
    data,
    isLoading,
    isFetching,
    error: error as Error | null,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
    isOptimisticUpdating,
  };
}

export default useCommunityWall;
