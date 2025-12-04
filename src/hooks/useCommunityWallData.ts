/**
 * useCommunityWallData
 * 
 * 統一社區牆資料來源 Hook
 * - Mock 模式：使用本地假資料
 * - API 模式：使用真實 API 資料（自動轉換格式）
 * - 統一資料格式：不管來源是 Mock 還是 API，輸出格式一致
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useCommunityWall } from './useCommunityWallQuery';
import { supabase } from '../lib/supabase';
import type { CommunityWallData } from '../services/communityService';
import type { CommunityInfo, Post, Review, Question } from '../pages/Community/types';
import { MOCK_DATA, createMockPost, createMockQuestion, createMockAnswer } from '../pages/Community/mockData';
import { convertApiData } from './communityWallConverters';
import type { UnifiedWallData } from './communityWallConverters';

// ============ 統一輸出型別 ============
export type { Post, Review, Question, CommunityInfo };
export type { UnifiedWallData };


const MOCK_STORAGE_KEY = 'community-wall-mock-state-v1';
const MOCK_LATENCY_MS = 250;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const canUseMockStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const mergeMockState = (
  fallback: UnifiedWallData,
  stored: Partial<UnifiedWallData> | null
): UnifiedWallData => {
  if (!stored) return fallback;
  return {
    ...fallback,
    ...stored,
    communityInfo: {
      ...fallback.communityInfo,
      ...(stored.communityInfo ?? {}),
    },
    posts: {
      public: stored.posts?.public ?? fallback.posts.public,
      private: stored.posts?.private ?? fallback.posts.private,
      publicTotal: stored.posts?.publicTotal ?? fallback.posts.publicTotal,
      privateTotal: stored.posts?.privateTotal ?? fallback.posts.privateTotal,
    },
    reviews: stored.reviews ?? fallback.reviews,
    questions: stored.questions ?? fallback.questions,
  };
};

const loadPersistedMockState = (fallback: UnifiedWallData): UnifiedWallData => {
  if (!canUseMockStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(MOCK_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return mergeMockState(fallback, parsed);
  } catch (err) {
    console.error('Failed to load community wall mock state', err);
    return fallback;
  }
};

const saveMockState = (data: UnifiedWallData) => {
  if (!canUseMockStorage()) return;
  try {
    window.localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to persist community wall mock state', err);
  }
};


// ============ Hook 選項 ============
export interface UseCommunityWallDataOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 測試或客製化可覆寫初始 Mock 資料 */
  initialMockData?: UnifiedWallData;
  /** 是否持久化 Mock 狀態 */
  persistMockState?: boolean;
  /** 初始是否使用 Mock 模式（支援 URL/localStorage 同步） */
  initialUseMock?: boolean;
}

export interface UseCommunityWallDataReturn {
  /** 統一格式資料 */
  data: UnifiedWallData;
  /** 是否使用 Mock */
  useMock: boolean;
  /** 切換 Mock/API */
  setUseMock: (v: boolean) => void;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 手動刷新資料 */
  refresh: () => Promise<void>;
  /** 按讚 */
  toggleLike: (postId: string | number) => Promise<void>;
  /** 發文 */
  createPost: (content: string, visibility?: 'public' | 'private') => Promise<void>;
  /** 發問 */
  askQuestion: (question: string) => Promise<void>;
  /** 回答 */
  answerQuestion: (questionId: string, content: string) => Promise<void>;
}

// ============ Main Hook ============
/**
 * 社區牆統一資料來源 Hook。根據 useMock 旗標自動切換 Mock 與 API 模式，
 * 並提供發文、提問、按讚等操作的單一出入口。
 *
 * @param communityId - 社區 UUID，必須存在才會發出 API 請求
 * @param options.includePrivate - 是否載入私密牆資料
 * @param options.initialMockData - 自訂初始 Mock 資料（測試用）
 * @param options.persistMockState - 是否將 Mock 狀態寫入 localStorage
 * @param options.initialUseMock - 初始是否啟用 Mock 模式（支援 URL / localStorage）
 * @returns 統一資料、操作方法與錯誤/載入狀態
 */
export function useCommunityWallData(
  communityId: string | undefined,
  options: UseCommunityWallDataOptions = {}
): UseCommunityWallDataReturn {
  const {
    includePrivate = false,
    initialMockData = MOCK_DATA,
    persistMockState = true,
    initialUseMock: requestedInitialUseMock,
  } = options;
  const resolvedInitialUseMock = typeof requestedInitialUseMock === 'boolean'
    ? requestedInitialUseMock
    : !communityId;
  const [useMock, setUseMock] = useState(resolvedInitialUseMock);
  useEffect(() => {
    setUseMock(resolvedInitialUseMock);
  }, [resolvedInitialUseMock]);

  // K: 取得當前登入使用者 ID（供樂觀更新使用）
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  useEffect(() => {
    let mounted = true;
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted && user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        // 未登入或取得失敗，維持 undefined
        if (import.meta.env.DEV) {
          console.warn('[useCommunityWallData] 無法取得使用者 ID:', err);
        }
      }
    };
    fetchUserId();

    // 監聽登入狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setCurrentUserId(session?.user?.id);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Mock 模式的本地狀態（使用 immer 會更好，但這裡用簡單的 state）
  const [mockData, setMockData] = useState<UnifiedWallData>(() =>
    persistMockState ? loadPersistedMockState(initialMockData) : initialMockData
  );
  const hasRestoredFromStorage = useRef(false);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(() => new Set());

  // 切換至 API 模式時重置 Mock 按讚狀態，避免污染真實資料
  useEffect(() => {
    if (!useMock) {
      setLikedPosts(new Set());
    }
  }, [useMock]);

  useEffect(() => {
    if (!persistMockState || !useMock) return;
    if (!hasRestoredFromStorage.current) {
      hasRestoredFromStorage.current = true;
      return;
    }
    setMockData(loadPersistedMockState(initialMockData));
  }, [useMock, persistMockState, initialMockData]);

  useEffect(() => {
    if (!persistMockState || !useMock) return;
    saveMockState(mockData);
  }, [mockData, persistMockState, useMock]);

  // API 查詢（傳入 currentUserId 供樂觀更新使用）
  const { 
    data: apiData, 
    isLoading: apiLoading, 
    error: apiError,
    refresh: apiRefresh,
    toggleLike: apiToggleLike,
    createPost: apiCreatePost,
    askQuestion: apiAskQuestion,
    answerQuestion: apiAnswerQuestion,
  } = useCommunityWall(communityId, { 
    enabled: !useMock,
    includePrivate,
    currentUserId,
  });

  // 統一資料來源
  const data = useMemo<UnifiedWallData>(() => {
    if (useMock) {
      return mockData;
    }

    if (!apiData) {
      return initialMockData;
    }

    // API 模式：轉換資料格式，API 有 communityInfo 就用，沒有才 fallback Mock
    return convertApiData(apiData, MOCK_DATA.communityInfo);
  }, [useMock, apiData, mockData, initialMockData]);

  // 封裝操作函數
  const refresh = useCallback(async () => {
    if (useMock) {
      setMockData(prev => ({ ...prev }));
      return;
    }
    await apiRefresh();
  }, [useMock, apiRefresh]);

  const toggleLike = useCallback(async (postId: string | number) => {
    if (useMock) {
      await delay(MOCK_LATENCY_MS);
      // Mock 模式：實際更新本地狀態
      const isLiked = likedPosts.has(postId);
      setMockData(prev => {
        const updatePosts = (posts: Post[]): Post[] => 
          posts.map(post => {
            if (post.id !== postId) return post;
            const currentLikes = post.likes ?? 0;
            return {
              ...post,
              likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            };
          });

        return {
          ...prev,
          posts: {
            ...prev.posts,
            public: updatePosts(prev.posts.public),
            private: updatePosts(prev.posts.private),
          },
        };
      });
      setLikedPosts(prev => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });
      return;
    }
    await apiToggleLike(String(postId));
  }, [useMock, apiToggleLike, likedPosts]);

  const createPost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
    if (useMock) {
      // Mock 模式：新增貼文到本地狀態
      const newPost = createMockPost(content, visibility);

      setMockData(prev => {
        const target = visibility === 'private' ? 'private' : 'public';
        const targetTotal = visibility === 'private' ? 'privateTotal' : 'publicTotal';
        return {
          ...prev,
          posts: {
            ...prev.posts,
            [target]: [newPost, ...prev.posts[target]],
            [targetTotal]: prev.posts[targetTotal] + 1,
          },
        };
      });
      return;
    }
    await apiCreatePost(content, visibility);
  }, [useMock, apiCreatePost]);

  const askQuestion = useCallback(async (question: string) => {
    if (useMock) {
      // Mock 模式：新增問題到本地狀態
      const newQuestion = createMockQuestion(question);

      setMockData(prev => ({
        ...prev,
        questions: {
          ...prev.questions,
          items: [newQuestion, ...prev.questions.items],
          total: prev.questions.total + 1,
        },
      }));
      return;
    }
    await apiAskQuestion(question);
  }, [useMock, apiAskQuestion]);

  const answerQuestion = useCallback(async (questionId: string, content: string) => {
    if (useMock) {
      // Mock 模式：新增回答到本地狀態
      setMockData(prev => ({
        ...prev,
        questions: {
          ...prev.questions,
          items: prev.questions.items.map(q => {
            if (q.id.toString() !== questionId) return q;
            
            const newAnswer = createMockAnswer(content);

            return {
              ...q,
              answers: [...q.answers, newAnswer],
              answersCount: q.answersCount + 1,
            };
          }),
        },
      }));
      return;
    }
    await apiAnswerQuestion(questionId, content);
  }, [useMock, apiAnswerQuestion]);

  return {
    data,
    useMock,
    setUseMock,
    isLoading: !useMock && apiLoading,
    error: useMock ? null : apiError,
    refresh,
    toggleLike,
    createPost,
    askQuestion,
    answerQuestion,
  };
}

export default useCommunityWallData;
