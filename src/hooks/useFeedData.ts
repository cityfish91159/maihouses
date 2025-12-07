/**
 * useFeedData
 * 
 * 信息流統一資料來源 Hook（不綁定特定社區）
 * - Mock 模式：使用本地假資料
 * - API 模式：使用真實 API 資料
 * - 統一資料格式：不管來源是 Mock 還是 API，輸出格式一致
 * 
 * 與 useCommunityWallData 差異：
 * - 移除 reviews / questions 邏輯（信息流不需要）
 * - communityId 為 optional（信息流可能跨社區）
 * - 資料結構簡化為 posts only
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { mhEnv } from '../lib/mhEnv';
import type { Post, Role } from '../types/community';
import { useAuth } from './useAuth';

// ============ Feed 專用型別 ============
export interface FeedPost extends Post {
  /** 貼文所屬社區（信息流可能跨社區） */
  communityId?: string | undefined;
  communityName?: string | undefined;
}

export interface UnifiedFeedData {
  posts: FeedPost[];
  totalPosts: number;
}

// ============ 常數 ============
const FEED_MOCK_STORAGE_KEY = 'feed-mock-data-v1';
const MOCK_LATENCY_MS = 250;

const EMPTY_FEED_DATA: UnifiedFeedData = {
  posts: [],
  totalPosts: 0,
};

const COMMUNITY_NAME_MAP: Record<string, string> = {
  'test-uuid': '惠宇上晴',
  'community-2': '遠雄中央公園',
  'community-3': '國泰建設',
};

// ============ Mock 資料 ============
const FEED_MOCK_POSTS: FeedPost[] = [
  {
    id: 1001,
    author: '陳小姐',
    floor: '12F',
    type: 'resident',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2小時前
    title: '有人要團購掃地機嗎？🤖',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    likes: 31,
    comments: 14,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
  },
  {
    id: 1002,
    author: '游杰倫',
    type: 'agent',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1天前
    title: '🏡 惠宇上晴 12F｜雙陽台視野戶',
    content: '客廳光線很好，上週屋主剛降價 50 萬，有興趣可私訊。',
    views: 89,
    likes: 0,
    comments: 5,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
  },
  {
    id: 1003,
    author: '李先生',
    floor: '8F',
    type: 'resident',
    time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
    title: '停車位交流 🚗',
    content: '我有 B2-128 想與 B1 交換，方便接送小孩',
    likes: 12,
    comments: 8,
    communityId: 'community-2',
    communityName: '遠雄中央公園',
  },
  {
    id: 1004,
    author: '王太太',
    floor: '5F',
    type: 'resident',
    time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天前
    title: '推薦水電師傅',
    content: '上次找的師傅很專業，價格公道，需要的鄰居私訊我',
    likes: 25,
    comments: 6,
    communityId: 'community-3',
    communityName: '國泰建設',
  },
  {
    id: 1005,
    author: '林經理',
    type: 'agent',
    time: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8天前
    title: '🏡 惠宇上晴 8F｜三房車位',
    content: '屋況極新，前屋主自住保養好',
    views: 156,
    likes: 0,
    comments: 12,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
  },
];

const FEED_MOCK_DATA: UnifiedFeedData = {
  posts: FEED_MOCK_POSTS,
  totalPosts: FEED_MOCK_POSTS.length,
};

const filterMockData = (source: UnifiedFeedData, targetCommunityId?: string): UnifiedFeedData => {
  const filteredPosts = targetCommunityId
    ? source.posts.filter(p => p.communityId === targetCommunityId)
    : source.posts;

  return {
    posts: filteredPosts,
    totalPosts: filteredPosts.length,
  };
};

// ============ 工具函數 ============
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const canUseMockStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const loadPersistedFeedMockState = (fallback: UnifiedFeedData): UnifiedFeedData => {
  if (!canUseMockStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(FEED_MOCK_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<UnifiedFeedData>;
    return {
      posts: parsed.posts ?? fallback.posts,
      totalPosts: parsed.totalPosts ?? fallback.totalPosts,
    };
  } catch (err) {
    console.error('[useFeedData] Failed to load mock state', err);
    return fallback;
  }
};

const saveFeedMockState = (data: UnifiedFeedData): void => {
  if (!canUseMockStorage()) return;
  try {
    window.localStorage.setItem(FEED_MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('[useFeedData] Failed to persist mock state', err);
  }
};


// ============ Mock Factory ============
export const createFeedMockPost = (
  content: string,
  communityId?: string,
  communityName?: string
): FeedPost => ({
  id: Date.now(),
  author: '測試用戶',
  type: 'resident',
  time: new Date().toISOString(),
  title: content.substring(0, 20) + (content.length > 20 ? '...' : ''),
  content,
  likes: 0,
  comments: 0,
  pinned: false,
  communityId,
  communityName,
});

// ============ Hook 選項 ============
export interface UseFeedDataOptions {
  /** 篩選特定社區（不填則載入所有） */
  communityId?: string;
  /** 測試或客製化可覆寫初始 Mock 資料 */
  initialMockData?: UnifiedFeedData;
  /** 是否持久化 Mock 狀態 */
  persistMockState?: boolean;
}

export interface UseFeedDataReturn {
  /** 統一格式資料 */
  data: UnifiedFeedData;
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
  createPost: (content: string, communityId?: string) => Promise<void>;
  /** 後端判定的使用者身份 */
  viewerRole: Role;
  /** 是否登入 */
  isAuthenticated: boolean;
}

// ============ Main Hook ============
/**
 * 信息流統一資料來源 Hook。根據 useMock 旗標自動切換 Mock 與 API 模式，
 * 並提供發文、按讚等操作的單一出入口。
 *
 * @param options.communityId - 篩選特定社區（不填則載入所有）
 * @param options.initialMockData - 自訂初始 Mock 資料（測試用）
 * @param options.persistMockState - 是否將 Mock 狀態寫入 localStorage
 * @returns 統一資料、操作方法與錯誤/載入狀態
 */
export function useFeedData(
  options: UseFeedDataOptions = {}
): UseFeedDataReturn {
  const { user: authUser, role: authRole, isAuthenticated, loading: authLoading } = useAuth();
  const {
    communityId,
    initialMockData = FEED_MOCK_DATA,
    persistMockState = true,
  } = options;

  // ============ Mock 控制 ============
  const [useMock, setUseMockState] = useState<boolean>(() => mhEnv.isMockEnabled());

  useEffect(() => {
    const unsubscribe = mhEnv.subscribe(setUseMockState);
    return unsubscribe;
  }, []);

  const currentUserId = authUser?.id;

  // ============ Mock 狀態 ============
  const [mockData, setMockData] = useState<UnifiedFeedData>(() =>
    persistMockState ? loadPersistedFeedMockState(initialMockData) : initialMockData
  );
  const hasRestoredFromStorage = useRef(false);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(() => new Set());

  // 切換至 API 模式時重置 Mock 按讚狀態
  useEffect(() => {
    if (!useMock) {
      setLikedPosts(new Set());
    }
  }, [useMock]);

  // 切換模式時重新載入 Mock 資料
  useEffect(() => {
    if (!persistMockState || !useMock) return;
    if (!hasRestoredFromStorage.current) {
      hasRestoredFromStorage.current = true;
      return;
    }
    setMockData(loadPersistedFeedMockState(initialMockData));
  }, [useMock, persistMockState, initialMockData]);

  // 持久化 Mock 資料
  useEffect(() => {
    if (!persistMockState || !useMock) return;
    saveFeedMockState(mockData);
  }, [mockData, persistMockState, useMock]);

  // ============ API 狀態 ============
  const [apiData, setApiData] = useState<UnifiedFeedData | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const lastApiDataRef = useRef<UnifiedFeedData | null>(null);

  // API 載入（目前為 placeholder，P5 時串接真實 API）
  const fetchApiData = useCallback(async () => {
    if (useMock) return;
    
    setApiLoading(true);
    setApiError(null);
    
    try {
      // TODO: P5 時替換為真實 API 呼叫
      // const response = await fetch(`/api/feed?communityId=${communityId ?? ''}`);
      // const result = await response.json();

      // 暫時使用 Mock 資料作為 API fallback，避免空資料誤導
      await delay(MOCK_LATENCY_MS);
      const result = filterMockData(mockData, communityId);

      setApiData(result);
      lastApiDataRef.current = result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('載入信息流失敗');
      setApiError(error);
      if (import.meta.env.DEV) {
        console.error('[useFeedData] API error:', err);
      }
    } finally {
      setApiLoading(false);
    }
  }, [useMock, communityId, mockData]);

  // 初始載入
  useEffect(() => {
    if (!useMock) {
      fetchApiData();
    }
  }, [useMock, fetchApiData]);

  // ============ 統一資料來源 ============
  const data = useMemo<UnifiedFeedData>(() => {
    if (useMock) {
      // Mock 模式：根據 communityId 篩選
      return filterMockData(mockData, communityId);
    }

    if (apiData) {
      lastApiDataRef.current = apiData;
      return apiData;
    }

    // API 尚未返回時使用上次成功資料或空資料
    return lastApiDataRef.current ?? EMPTY_FEED_DATA;
  }, [useMock, apiData, mockData, communityId]);

  // ============ viewerRole ============
  const viewerRole = useMemo<Role>(() => authRole ?? 'guest', [authRole]);

  // ============ Mock likedPosts 初始化同步 ============
  useEffect(() => {
    if (!useMock || !currentUserId) return;
    const initialLiked = new Set<string | number>();
    mockData.posts.forEach(p => {
      if (p.liked_by?.includes(currentUserId)) {
        initialLiked.add(p.id);
      }
    });
    setLikedPosts(initialLiked);
  }, [useMock, currentUserId, mockData]);

  // ============ Mock 模式 userId ============
  const getMockUserId = useCallback((): string => {
    if (currentUserId) return currentUserId;
    const storageKey = 'mock_user_id';
    let mockId = localStorage.getItem(storageKey);
    if (!mockId) {
      mockId = `mock-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem(storageKey, mockId);
    }
    return mockId;
  }, [currentUserId]);

  // ============ 操作方法 ============
  const refresh = useCallback(async () => {
    if (useMock) {
      // Mock 模式：觸發重新渲染
      setMockData(prev => ({ ...prev }));
      return;
    }
    await fetchApiData();
  }, [useMock, fetchApiData]);

  const toggleLike = useCallback(async (postId: string | number) => {
    if (!useMock && !isAuthenticated) {
      throw new Error('請先登入後再按讚');
    }

    if (useMock) {
      await delay(MOCK_LATENCY_MS);
      const mockUserId = getMockUserId();
      const isLiked = likedPosts.has(postId);
      
      setMockData(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id !== postId) return post;
          const currentLikes = post.likes ?? 0;
          const currentLikedBy = post.liked_by ?? [];
          return {
            ...post,
            likes: isLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            liked_by: isLiked
              ? currentLikedBy.filter(id => id !== mockUserId)
              : [...currentLikedBy, mockUserId],
          };
        }),
      }));
      
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
    
    // TODO: P5 時串接真實 API
    // await apiToggleLike(String(postId));
    await fetchApiData(); // 暫時重新載入
  }, [useMock, likedPosts, getMockUserId, fetchApiData, isAuthenticated]);

  const createPost = useCallback(async (content: string, targetCommunityId?: string) => {
    if (!useMock && !isAuthenticated) {
      throw new Error('請先登入後再發文');
    }

    if (useMock) {
      const newPost = createFeedMockPost(
        content,
        targetCommunityId ?? communityId,
        COMMUNITY_NAME_MAP[targetCommunityId ?? communityId ?? '']
          ?? targetCommunityId
          ?? communityId
          ?? '我的社區'
      );

      setMockData(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts],
        totalPosts: prev.totalPosts + 1,
      }));
      return;
    }
    
    // TODO: P5 時串接真實 API
    // await apiCreatePost(content, targetCommunityId);
    await fetchApiData(); // 暫時重新載入
  }, [useMock, communityId, fetchApiData, isAuthenticated]);

  const setUseMock = useCallback((value: boolean) => {
    const next = mhEnv.setMock(value);
    setUseMockState(next);
  }, []);

  // ============ 回傳 ============
  return {
    data,
    useMock,
    setUseMock,
    isLoading: authLoading || (!useMock && apiLoading),
    error: useMock ? null : apiError,
    refresh,
    toggleLike,
    createPost,
    viewerRole,
    isAuthenticated,
  };
}

export default useFeedData;
