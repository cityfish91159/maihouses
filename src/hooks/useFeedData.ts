/**
 * useFeedData
 * 
 * 信息流統一資料來源 Hook（不綁定特定社區）
 * - Mock 模式：使用本地假資料
 * - API 模式：使用真實 API 資料（含樂觀更新）
 * - 統一資料格式：不管來源是 Mock 還是 API，輸出格式一致
 * 
 * 與 useCommunityWallData 差異：
 * - 移除 reviews / questions 邏輯（信息流不需要）
 * - communityId 為 optional（信息流可能跨社區）
 * - 資料結構簡化為 posts only
 * 
 * P2-AUDIT-3 修復紀錄（2025-12-07）：
 * - P2-C1: likedPosts 初始化加 ref 保護，避免 mockData 變化導致重複執行
 * - P2-C2: API toggleLike 加入樂觀更新，立即顯示變化
 * - P2-C3: fetchApiData 改用 initialMockData，移除 mockData 依賴
 * - P2-C4: API createPost 加入樂觀更新，立即顯示新貼文
 * - P2-C5: 暴露 isLiked helper 函數，方便 UI 判斷按讚狀態
 * - P2-C6: COMMUNITY_NAME_MAP 抽到 src/constants/communities.ts
 * 
 * P6-AUDIT Phase 1 (2025-12-11):
 * - Extract Magic Numbers (HOT_POSTS_LIMIT)
 * - Dynamic Sidebar Data (deriveSidebarData)
 * - Comment Types & Mock Data (FeedComment)
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { mhEnv } from '../lib/mhEnv';
import { supabase } from '../lib/supabase';
import type { Post, Role } from '../types/community';
import { useAuth } from './useAuth';
import { getCommunityName, isValidCommunityId } from '../constants';

import { MOCK_SALE_ITEMS } from '../services/mock/feed';
import { STRINGS } from '../constants/strings';
import type { FeedComment } from '../types/comment';
const S = STRINGS.FEED;

// ============ Feed 專用型別 ============
export interface FeedPost extends Post {
  /** 貼文所屬社區（信息流可能跨社區） */
  communityId?: string | undefined;
  communityName?: string | undefined;
  /** 貼文留言列表 */
  commentList?: FeedComment[];
  /** 貼文圖片 */
  images?: { src: string; alt: string; width: number; height: number }[];
}

export interface SidebarData {
  hotPosts: { id: string | number; title: string; communityName: string; likes: number }[];
  saleItems: typeof MOCK_SALE_ITEMS;
}

export interface UnifiedFeedData {
  posts: FeedPost[];
  totalPosts: number;
  sidebarData: SidebarData;
}

// ============ 常數 ============
const FEED_MOCK_STORAGE_KEY = 'feed-mock-data-v1';
const MOCK_LATENCY_MS = 250;
const HOT_POSTS_LIMIT = 3;

// Helper to derive Sidebar Data
const deriveSidebarData = (posts: FeedPost[]): SidebarData => {
  const hotPosts = [...posts]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, HOT_POSTS_LIMIT)
    .map(p => ({
      id: p.id,
      title: p.title,
      communityName: p.communityName || S.DEFAULT_COMMUNITY_LABEL,
      likes: p.likes || 0,
    }));

  return {
    hotPosts,
    saleItems: MOCK_SALE_ITEMS,
  };
};

const EMPTY_FEED_DATA: UnifiedFeedData = {
  posts: [],
  totalPosts: 0,
  sidebarData: { hotPosts: [], saleItems: [] },
};

// ============ Mock 資料 Helper ============
const createMockComments = (postId: number): FeedComment[] => [
  {
    id: `c-${postId}-1`,
    postId,
    author: '王太太',
    role: 'resident',
    content: '真的嗎？我也想參加團購！',
    time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    likes: 2,
  },
  {
    id: `c-${postId}-2`,
    postId,
    author: '李先生',
    role: 'resident',
    content: '+1',
    time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    likes: 0,
  }
];

// ============ Strict Parity Mock Data (No Images) ============

// 1. Consumer Mock Data (Matches public/feed-consumer.html text)
const MOCK_CONSUMER_POSTS: FeedPost[] = [
  // Official
  {
    id: 'c-1001',
    author: '社區管理委員會',
    type: 'official',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    title: '年度消防演練通知',
    content: '12/15（日）上午 10:00 將進行全社區消防演練，届時會有警報聲響，請勿驚慌。',
    likes: 0,
    comments: 0,
    pinned: true,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // Agent Wang
  {
    id: 'c-1002',
    author: '王仲 · 在地房仲',
    type: 'agent',
    time: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    title: '惠宇上晴 12F 雙陽台戶',
    content: '🏡 分享一下最近帶看的心得：惠宇上晴 12F 雙陽台戶，客廳採光真的很棒！上週屋主剛降價 50 萬，有興趣的鄰居可以私訊我。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // Group Buy
  {
    id: 'c-1003',
    author: '社區熱帖 · 團購',
    type: 'resident',
    time: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    title: '有人要團購掃地機嗎？',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    likes: 31,
    comments: 14,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
    images: [{ src: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800', alt: '掃地機器人', width: 800, height: 600 }],
  },
  // Parking
  {
    id: 'c-1004',
    author: '李先生 · B棟住戶',
    type: 'resident',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    title: '停車位交流',
    content: '我有 B2-128 想與 B1 的位置交換，有意願的鄰居請留言～',
    likes: 16,
    comments: 11,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // AI Insight
  {
    id: 'c-1005',
    author: '邁房子 AI',
    type: 'official',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    title: '每週市況快訊',
    content: '📊 本週「惠宇上晴」社區成交一筆 12F，單價約 38.5 萬/坪，較上月微漲 2%。目前待售 3 戶。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // New Resident
  {
    id: 'c-1006',
    author: '游先生 · 剛入住',
    type: 'resident',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    title: '新住戶心得',
    content: '住了一個月的心得：管理員很親切、公設維護得很好、停車場動線順暢。唯一缺點是面馬路的那側比較吵，建議加裝氣密窗。',
    likes: 42,
    comments: 15,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
    images: [{ src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800', alt: '社區大廳', width: 800, height: 600 }],
  }
];

// 2. Agent Mock Data (Matches public/feed-agent.html text)
const MOCK_AGENT_POSTS: FeedPost[] = [
  // Group Buy (Shared)
  {
    id: 'a-1001',
    author: '社區熱帖 · 團購',
    type: 'resident',
    time: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    title: '有人要團購掃地機嗎？',
    content: '這款 iRobot 打折，滿 5 台有團購價～',
    likes: 31,
    comments: 14,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // Agent Wang
  {
    id: 'a-1002',
    author: '王仲 · 在地房仲',
    type: 'agent',
    time: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    title: '惠宇上晴 12F｜雙陽台視野戶',
    content: '客廳光線很好。上週屋主剛降價 50 萬。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // Parking (Shared)
  {
    id: 'a-1003',
    author: '社區熱帖 · 停車交流',
    type: 'resident',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    title: '停車位交流',
    content: '我有 B2-128 想與 B1 交換，意者留言～',
    likes: 16,
    comments: 11,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // AI Insight (Agent Version)
  {
    id: 'a-1004',
    author: 'AI 體檢快訊',
    type: 'official',
    time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    title: 'AI 體檢快訊',
    content: '台中「單元二」新案公設比平均 33%，最低 27%（近學區）。建議留意朝向與車位動線。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
  },
  // Agent Chen
  {
    id: 'a-1005',
    author: '陳小姐 · 永慶房屋',
    type: 'agent',
    time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    title: '寶輝秋紅谷 15F',
    content: '雙平車，浴室剛整修完畢，通風比想像中好。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '寶輝秋紅谷',
    commentList: [],
    images: [{ src: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800', alt: '現代浴室', width: 800, height: 600 }],
  },
  // Agent Yu
  {
    id: 'a-1006',
    author: '游杰倫 · 社區評價',
    type: 'agent',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    title: '為什麼 12F 視野戶總是熱門？',
    content: '分享帶看心得：動線、採光與周遭噪音的實勘筆記。',
    likes: 23,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇上晴',
    commentList: [],
    images: [{ src: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800', alt: '窗景採光', width: 800, height: 600 }],
  },
  // Agent Lin
  {
    id: 'a-1007',
    author: '林先生 · 社區達人',
    type: 'agent',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    title: '惠宇青鳥 C棟邊間三房',
    content: '稀有釋出，學區步行可達。',
    likes: 0,
    comments: 0,
    communityId: 'test-uuid',
    communityName: '惠宇青鳥',
    commentList: [],
    images: [{ src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', alt: '建築外觀', width: 800, height: 600 }],
  },
];

const FEED_MOCK_DATA_CONSUMER: UnifiedFeedData = {
  posts: MOCK_CONSUMER_POSTS,
  totalPosts: MOCK_CONSUMER_POSTS.length,
  sidebarData: { hotPosts: [], saleItems: MOCK_SALE_ITEMS },
};

const FEED_MOCK_DATA_AGENT: UnifiedFeedData = {
  posts: MOCK_AGENT_POSTS,
  totalPosts: MOCK_AGENT_POSTS.length,
  sidebarData: { hotPosts: [], saleItems: MOCK_SALE_ITEMS },
};

type SupabasePostRow = {
  id: string;
  community_id: string;
  author_id: string | null;
  content: string;
  visibility: string | null;
  likes_count: number | null;
  comments_count: number | null;
  liked_by: string[] | null;
  is_pinned: boolean | null;
  created_at: string;
  post_type: string | null;
};

type ProfileRow = {
  id: string;
  name: string | null;
  floor: string | null;
  role: Role | null;
};

// ============ Profile Cache (P5-5 優化) ============
interface ProfileCacheEntry {
  profile: ProfileRow;
  timestamp: number;
}

const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;
const profileCache = new Map<string, ProfileCacheEntry>();

const isProfileCacheValid = (entry: ProfileCacheEntry): boolean => {
  return Date.now() - entry.timestamp < PROFILE_CACHE_TTL_MS;
};

const getProfilesFromCache = (authorIds: string[]): {
  cached: Map<string, ProfileRow>;
  uncached: string[];
} => {
  const cached = new Map<string, ProfileRow>();
  const uncached: string[] = [];

  for (const id of authorIds) {
    const entry = profileCache.get(id);
    if (entry && isProfileCacheValid(entry)) {
      cached.set(id, entry.profile);
    } else {
      uncached.push(id);
      if (entry) {
        profileCache.delete(id);
      }
    }
  }

  return { cached, uncached };
};

const setProfilesToCache = (profiles: ProfileRow[]): void => {
  const now = Date.now();
  for (const profile of profiles) {
    profileCache.set(profile.id, { profile, timestamp: now });
  }
};

const filterMockData = (source: UnifiedFeedData, targetCommunityId?: string): UnifiedFeedData => {
  const filteredPosts = targetCommunityId
    ? source.posts.filter(p => p.communityId === targetCommunityId)
    : source.posts;

  return {
    posts: filteredPosts,
    totalPosts: filteredPosts.length,
    sidebarData: deriveSidebarData(filteredPosts),
  };
};

// ============ 工具函數 ============
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const deriveTitleFromContent = (content: string): string => {
  if (!content) return '（無標題）';
  return content.length > 40 ? `${content.slice(0, 40)}...` : content;
};

const canUseMockStorage = (): boolean => {
  try {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  } catch {
    return false;
  }
};

const loadPersistedFeedMockState = (fallback: UnifiedFeedData, key: string = FEED_MOCK_STORAGE_KEY): UnifiedFeedData => {
  if (!canUseMockStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<UnifiedFeedData>;
    const posts = parsed.posts ?? fallback.posts;
    return {
      posts,
      totalPosts: parsed.totalPosts ?? fallback.totalPosts,
      sidebarData: deriveSidebarData(posts),
    };
  } catch (err) {
    console.error('[useFeedData] Failed to load mock state', err);
    return fallback;
  }
};

const saveFeedMockState = (data: UnifiedFeedData, key: string = FEED_MOCK_STORAGE_KEY): void => {
  if (!canUseMockStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('[useFeedData] Failed to persist mock state', err);
  }
};

const buildProfileMap = async (authorIds: string[]): Promise<Map<string, ProfileRow>> => {
  if (!authorIds.length) return new Map();

  const { cached, uncached } = getProfilesFromCache(authorIds);
  if (uncached.length === 0) {
    return cached;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, floor, role')
    .in('id', uncached);

  if (error) {
    console.error('[useFeedData] Fetch profiles failed', error);
    return cached;
  }

  const fetchedProfiles = (data ?? []).map(profile => profile as ProfileRow);
  setProfilesToCache(fetchedProfiles);

  const result = new Map(cached);
  for (const profile of fetchedProfiles) {
    result.set(profile.id, profile);
  }

  return result;
};

const mapSupabasePostsToFeed = async (rows: SupabasePostRow[]): Promise<UnifiedFeedData> => {
  const authorIds = Array.from(new Set(rows.map(r => r.author_id).filter((id): id is string => Boolean(id))));
  const profileMap = await buildProfileMap(authorIds);

  const posts: FeedPost[] = rows.map(row => {
    const profile = row.author_id ? profileMap.get(row.author_id) : undefined;
    const likedBy = row.liked_by ?? [];
    const normalizedRole: FeedPost['type'] = profile?.role === 'agent'
      ? 'agent'
      : profile?.role === 'resident'
        ? 'resident'
        : 'member';

    const base: FeedPost = {
      id: row.id,
      author: profile?.name ?? '住戶',
      type: normalizedRole,
      time: row.created_at ?? new Date().toISOString(),
      title: deriveTitleFromContent(row.content),
      content: row.content,
      likes: row.likes_count ?? likedBy.length ?? 0,
      comments: row.comments_count ?? 0,
      pinned: row.is_pinned ?? false,
      communityId: row.community_id,
      communityName: getCommunityName(row.community_id),
      liked_by: likedBy,
    };
    return profile?.floor ? { ...base, floor: profile.floor } : base;
  });

  return {
    posts,
    totalPosts: posts.length,
    sidebarData: deriveSidebarData(posts),
  };
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
  commentList: [],
});

// ============ Hook 選項 ============
export interface UseFeedDataOptions {
  /** 篩選特定社區（不填則載入所有） */
  communityId?: string;
  /** 測試或客製化可覆寫初始 Mock 資料 */
  initialMockData?: UnifiedFeedData;
  /** 是否持久化 Mock 狀態 */
  persistMockState?: boolean;
  /** 角色 (決定預設 MOCK 資料集 與 Storage Key) */
  role?: 'agent' | 'member' | 'consumer';
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
  /** 判斷某貼文是否已按讚（P2-C5 修復：暴露給消費者） */
  isLiked: (postId: string | number) => boolean;
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
    initialMockData: customInitialData,
    persistMockState = true,
    role = 'member',
  } = options;

  // Determine Default Mock Data & Storage Key based on Role
  const effectiveRole = role === 'agent' ? 'agent' : 'consumer';
  const defaultMockData = effectiveRole === 'agent' ? FEED_MOCK_DATA_AGENT : FEED_MOCK_DATA_CONSUMER;
  const initialDataToUse = customInitialData ?? defaultMockData;
  const storageKey = `feed-mock-v5-${effectiveRole}`;

  // ============ Mock 控制 ============
  const [useMock, setUseMockState] = useState<boolean>(() => mhEnv.isMockEnabled());

  useEffect(() => {
    const unsubscribe = mhEnv.subscribe(setUseMockState);
    return unsubscribe;
  }, []);

  const currentUserId = authUser?.id;

  // ============ Mock 狀態 ============
  const [mockData, setMockData] = useState<UnifiedFeedData>(() =>
    persistMockState ? loadPersistedFeedMockState(initialDataToUse) : initialDataToUse
  );
  const hasRestoredFromStorage = useRef(false);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(() => new Set());

  // P2-C1 修復：用 ref 追蹤是否已初始化 likedPosts，避免 mockData 變化重複執行
  const hasInitializedLikedPosts = useRef(false);

  // 切換至 API 模式時重置 Mock 按讚狀態
  useEffect(() => {
    if (!useMock) {
      setLikedPosts(new Set());
      hasInitializedLikedPosts.current = false; // 重置初始化標記
    }
  }, [useMock]);

  // 切換模式時重新載入 Mock 資料
  useEffect(() => {
    if (!persistMockState || !useMock) return;
    if (!hasRestoredFromStorage.current) {
      hasRestoredFromStorage.current = true;
      return;
    }
    setMockData(loadPersistedFeedMockState(initialDataToUse, storageKey));
  }, [useMock, persistMockState, initialDataToUse, storageKey]);

  // 持久化 Mock 資料
  useEffect(() => {
    if (!persistMockState || !useMock) return;
    saveFeedMockState(mockData, storageKey);
  }, [mockData, persistMockState, useMock, storageKey]);

  // ============ API 狀態 ============
  const [apiData, setApiData] = useState<UnifiedFeedData | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<Error | null>(null);
  const lastApiDataRef = useRef<UnifiedFeedData | null>(null);

  // P2-C2/C4 修復：API 按讚狀態（用於樂觀更新）
  const [apiLikedPosts, setApiLikedPosts] = useState<Set<string | number>>(() => new Set());

  // P2-C3 更新：API 模式使用 Supabase 真實資料
  const fetchApiData = useCallback(async () => {
    if (useMock) return;
    setApiLoading(true);
    setApiError(null);

    try {
      const query = supabase
        .from('community_posts')
        .select('id, community_id, author_id, content, visibility, likes_count, comments_count, liked_by, is_pinned, created_at, post_type')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (communityId) {
        query.eq('community_id', communityId);
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      const mapped = await mapSupabasePostsToFeed((data ?? []) as SupabasePostRow[]);
      setApiData(mapped);
      lastApiDataRef.current = mapped;

      if (currentUserId) {
        const initialLiked = new Set<string | number>();
        (data ?? []).forEach(row => {
          const likedBy = (row as SupabasePostRow).liked_by ?? [];
          if (likedBy.includes(currentUserId)) {
            initialLiked.add((row as SupabasePostRow).id);
          }
        });
        setApiLikedPosts(initialLiked);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('載入信息流失敗');
      setApiError(error);
      if (import.meta.env.DEV) {
        console.error('[useFeedData] API error:', err);
      }
    } finally {
      setApiLoading(false);
    }
  }, [useMock, communityId, currentUserId]);

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

  // P2-C1 修復：Mock likedPosts 初始化（加 ref 保護，只執行一次）
  useEffect(() => {
    if (!useMock || !currentUserId) return;

    // 已初始化就跳過，避免 mockData 變化時重複執行
    if (hasInitializedLikedPosts.current) return;
    hasInitializedLikedPosts.current = true;

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

  // P2-C5 修復：暴露 isLiked helper
  const isLiked = useCallback((postId: string | number): boolean => {
    if (useMock) {
      return likedPosts.has(postId);
    }
    return apiLikedPosts.has(postId);
  }, [useMock, likedPosts, apiLikedPosts]);

  // ============ 操作方法 ============
  const refresh = useCallback(async () => {
    if (useMock) {
      // Mock 模式：觸發重新渲染
      setMockData(prev => ({ ...prev }));
      return;
    }
    await fetchApiData();
  }, [useMock, fetchApiData]);

  // P2-C2 修復：API 模式加入樂觀更新
  const toggleLike = useCallback(async (postId: string | number) => {
    if (!useMock && !isAuthenticated) {
      throw new Error('請先登入後再按讚');
    }

    if (useMock) {
      const mockUserId = getMockUserId();
      const currentlyLiked = likedPosts.has(postId);

      setMockData(prev => ({
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id !== postId) return post;
          const currentLikes = post.likes ?? 0;
          const currentLikedBy = post.liked_by ?? [];
          return {
            ...post,
            likes: currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            liked_by: currentlyLiked
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

    // P2-C2 修復：API 模式樂觀更新
    const actingUserId = currentUserId;
    if (!actingUserId) {
      throw new Error('缺少使用者身份');
    }

    const postIdStr = String(postId);
    const currentlyLiked = apiLikedPosts.has(postId);
    const previousApiData = apiData;
    const previousApiLikedPosts = new Set(apiLikedPosts);

    // 1. 樂觀更新本地狀態（立即顯示變化）
    setApiData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: prev.posts.map(post => {
          if (post.id !== postId) return post;
          const currentLikes = post.likes ?? 0;
          const currentLikedBy = post.liked_by ?? [];
          const nextLikedBy = currentlyLiked
            ? currentLikedBy.filter(id => id !== actingUserId)
            : [...currentLikedBy, actingUserId];
          return {
            ...post,
            likes: currentlyLiked ? Math.max(0, currentLikes - 1) : currentLikes + 1,
            liked_by: nextLikedBy,
          };
        }),
      };
    });

    setApiLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });

    try {
      // 2. 呼叫 Supabase RPC（真實 API）
      const { data, error } = await supabase.rpc('toggle_like', { post_id: postIdStr });
      if (error) {
        throw error;
      }

      // 3. 以伺服器結果校正 likes/liked_by（避免快取與伺服器不一致）
      setApiData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map(post => {
            if (post.id !== postId) return post;
            const newLikes = typeof data?.likes_count === 'number' ? data.likes_count : post.likes ?? 0;
            const likedBy = post.liked_by ?? [];
            const nextLikedBy = data && 'liked' in data
              ? (data.liked ? [...new Set([...likedBy, actingUserId])] : likedBy.filter(id => id !== actingUserId))
              : likedBy;
            return {
              ...post,
              likes: newLikes,
              liked_by: nextLikedBy,
            };
          }),
        };
      });
    } catch (err) {
      // 4. 失敗時回滾
      setApiData(previousApiData);
      setApiLikedPosts(previousApiLikedPosts);
      throw err instanceof Error ? err : new Error('按讚失敗，請稍後再試');
    }
  }, [useMock, likedPosts, apiLikedPosts, apiData, getMockUserId, isAuthenticated, currentUserId]);

  // P2-C4 修復：API 模式加入樂觀更新
  const createPost = useCallback(async (content: string, targetCommunityId?: string) => {
    if (!useMock && !isAuthenticated) {
      throw new Error('請先登入後再發文');
    }

    const resolvedCommunityId = targetCommunityId ?? communityId;
    if (resolvedCommunityId && !isValidCommunityId(resolvedCommunityId)) {
      console.warn('[useFeedData] Invalid communityId provided, fallback to undefined');
    }
    const safeCommunityId = resolvedCommunityId && isValidCommunityId(resolvedCommunityId)
      ? resolvedCommunityId
      : undefined;
    if (!useMock && !safeCommunityId) {
      throw new Error('請先選擇社區後再發文');
    }
    const resolvedCommunityName = getCommunityName(safeCommunityId); // P2-C6：使用共用函數

    if (useMock) {
      const newPost = createFeedMockPost(
        content,
        safeCommunityId,
        resolvedCommunityName
      );

      setMockData(prev => ({
        ...prev,
        posts: [newPost, ...prev.posts],
        totalPosts: prev.totalPosts + 1,
        sidebarData: deriveSidebarData([newPost, ...prev.posts]), // Re-calculate sidebar data
      }));
      return;
    }

    // P2-C4 修復：API 模式樂觀更新
    const tempId = -Date.now();
    const tempPost: FeedPost = {
      id: tempId,
      author: authUser?.user_metadata?.name || authUser?.email || '我',
      type: ((authRole as string) === 'agent' || (authRole as string) === 'resident' || (authRole as string) === 'official') ? (authRole as any) : 'member',
      time: new Date().toISOString(),
      title: content.substring(0, 20),
      content: content,
      likes: 0,
      comments: 0,
      pinned: false,
      communityId: safeCommunityId,
      communityName: resolvedCommunityName,
      commentList: [],
    };

    // 1. 樂觀插入本地 API Data
    setApiData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        posts: [tempPost, ...prev.posts],
        totalPosts: prev.totalPosts + 1,
        sidebarData: deriveSidebarData([tempPost, ...prev.posts]), // Re-calculate sidebar data
      };
    });

    try {
      // 2. 呼叫真實 API
      const { error } = await supabase.from('community_posts').insert({
        content,
        community_id: safeCommunityId,
        author_id: currentUserId,
        post_type: 'general',
      });

      if (error) throw error;

      // 3. 成功後刷新主要數據（取得真實 ID 與時間）
      await fetchApiData();
    } catch (err) {
      console.error('[useFeedData] Create post failed', err);
      // 4. 失敗時回滾（移除樂觀貼文）
      setApiData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.filter(p => p.id !== tempId),
          totalPosts: prev.totalPosts - 1,
          sidebarData: deriveSidebarData(prev.posts.filter(p => p.id !== tempId)),
        };
      });
      throw err;
    }
  }, [useMock, isAuthenticated, communityId, authUser, authRole, currentUserId, fetchApiData]);

  return {
    data,
    useMock,
    setUseMock: setUseMockState,
    isLoading: useMock ? false : apiLoading,
    error: apiError,
    refresh,
    toggleLike,
    createPost,
    viewerRole,
    isAuthenticated,
    isLiked,
  };
}
