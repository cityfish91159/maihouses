/**
 * Feed 工具函數
 *
 * 職責：
 * - 提供 Feed 模組共用的工具函數
 * - Profile 快取管理（含 LRU 淘汰、容量限制、TTL）
 * - 資料轉換函數（含 Zod 驗證）
 *
 * Phase 4 重構 (2026-01-15):
 * - 從 useFeedData.ts 抽取純函數，避免職責過重
 * - 不包含 React hooks 或 effects，僅純函數
 *
 * Phase 4 審核修復 (2026-01-15):
 * - B1: 移除 `as` 類型轉型，改用 Zod Schema 驗證
 * - B2: 新增 Cache 清理機制與容量限制 (LRU)
 * - I1: 統一 `??` 運算子處理 nullish
 * - I2: 補齊完整 JSDoc 文檔
 * - I3: 導出 Cache 清理函數
 * - I4: 改善錯誤降級策略
 * - N1-N3: 修復 Magic Number、delay 檢查、readonly
 *
 * @module feedUtils
 */

import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { safeLocalStorage } from '../../lib/safeStorage';
import { getCommunityName } from '../../constants';
import { MOCK_SALE_ITEMS } from '../../constants/mockData';
import { STRINGS } from '../../constants/strings';
import type { FeedPost, UnifiedFeedData, SidebarData, HotPost, SaleItem } from '../../types/feed';

const S = STRINGS.FEED;

// [NASA TypeScript Safety] Zod Schema 用於驗證從 localStorage 載入的 Mock Feed 資料
// 只驗證最小必要欄位，其他欄位允許通過
const PersistedFeedDataSchema = z
  .object({
    posts: z.array(
      z
        .object({
          id: z.union([z.string(), z.number()]),
          author: z.string(),
          type: z.enum(['resident', 'member', 'agent', 'official']),
          time: z.string(),
          title: z.string(),
          content: z.string(),
          comments: z.number(),
        })
        .passthrough()
    ),
    totalPosts: z.number().optional(),
  })
  .passthrough();

// ============================================================================
// Constants
// ============================================================================

/** localStorage 儲存 Mock 資料的 key */
export const FEED_MOCK_STORAGE_KEY = 'feed-mock-data-v1';

/** Mock 模式模擬的網路延遲（毫秒） */
export const MOCK_LATENCY_MS = 250;

/** 側邊欄熱門貼文數量上限 */
export const HOT_POSTS_LIMIT = 3;

/** Profile Cache TTL（毫秒）- 5 分鐘 */
export const PROFILE_CACHE_TTL_MS = 5 * 60 * 1000;

/** Profile Cache 最大容量 */
export const PROFILE_CACHE_MAX_SIZE = 500;

/** delay 函數最大允許延遲（毫秒）- 防止誤用 */
export const MAX_DELAY_MS = 30_000;

/** 標題截斷長度 */
export const TITLE_TRUNCATE_LENGTH = 40;

// ============================================================================
// Zod Schemas (B1 修復：運行時類型驗證)
// ============================================================================

/**
 * Profile 資料 Zod Schema
 * 用於驗證 Supabase 返回的 profile 資料
 */
export const ProfileRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  floor: z.string().nullable(),
  role: z.enum(['guest', 'member', 'resident', 'agent', 'official', 'admin']).nullable(),
});

/** Profile 資料類型（從 Schema 推導） */
export type ProfileRow = z.infer<typeof ProfileRowSchema>;

/**
 * 貼文可見性枚舉
 * P2 修復：使用 enum 而非 string 提升類型安全
 */
export const PostVisibilitySchema = z.enum(['public', 'private']);
export type PostVisibility = z.infer<typeof PostVisibilitySchema>;

/**
 * 貼文類型枚舉
 * P3 修復：使用 enum 而非 string 提升類型安全
 */
export const PostTypeSchema = z.enum(['general', 'qa', 'review', 'announcement']);
export type PostType = z.infer<typeof PostTypeSchema>;

/**
 * Supabase 貼文資料 Zod Schema
 * P2/P3 修復：visibility 和 post_type 改用 enum 驗證
 */
export const SupabasePostRowSchema = z.object({
  id: z.string(),
  community_id: z.string(),
  author_id: z.string().nullable(),
  content: z.string(),
  // P2 修復：使用 enum 驗證，允許 null 或有效值
  visibility: PostVisibilitySchema.nullable(),
  likes_count: z.number().nullable(),
  comments_count: z.number().nullable(),
  liked_by: z.array(z.string()).nullable(),
  is_pinned: z.boolean().nullable(),
  created_at: z.string(),
  // P3 修復：使用 enum 驗證，允許 null 或有效值
  post_type: PostTypeSchema.nullable(),
});

/** Supabase 貼文資料類型（從 Schema 推導） */
export type SupabasePostRow = z.infer<typeof SupabasePostRowSchema>;

// ============================================================================
// Profile Cache (B2 修復：LRU + 容量限制 + 清理機制)
// ============================================================================

interface ProfileCacheEntry {
  profile: ProfileRow;
  timestamp: number;
  /** LRU: 最後存取時間 */
  lastAccess: number;
}

/** Profile 快取（模組級別，含 LRU 淘汰機制） */
const profileCache = new Map<string, ProfileCacheEntry>();

/**
 * 檢查快取項目是否有效（未過期）
 * @param entry - 快取項目
 * @returns 是否有效
 */
const isProfileCacheValid = (entry: ProfileCacheEntry): boolean => {
  return Date.now() - entry.timestamp < PROFILE_CACHE_TTL_MS;
};

/**
 * 從快取取得 Profile（同時更新 LRU 時間戳）
 * @param authorIds - 作者 ID 陣列
 * @returns cached: 快取中的 Profile，uncached: 需要從 API 取得的 ID
 */
const getProfilesFromCache = (
  authorIds: string[]
): {
  cached: Map<string, ProfileRow>;
  uncached: string[];
} => {
  const cached = new Map<string, ProfileRow>();
  const uncached: string[] = [];
  const now = Date.now();

  for (const id of authorIds) {
    const entry = profileCache.get(id);
    if (entry && isProfileCacheValid(entry)) {
      // LRU: 更新最後存取時間
      entry.lastAccess = now;
      cached.set(id, entry.profile);
    } else {
      uncached.push(id);
      // 清理過期項目
      if (entry) {
        profileCache.delete(id);
      }
    }
  }

  return { cached, uncached };
};

/**
 * 將 Profile 存入快取（含 LRU 淘汰與容量保護）
 * @param profiles - Profile 資料陣列
 *
 * P4 修復：
 * - 若單次新增數量超過容量上限，只取前 N 項
 * - 確保不會溢出 PROFILE_CACHE_MAX_SIZE
 */
const setProfilesToCache = (profiles: ProfileRow[]): void => {
  const now = Date.now();

  // P4 修復：限制單次新增數量，防止溢出
  // 若傳入超過容量上限的資料，只保留前 PROFILE_CACHE_MAX_SIZE 項
  const safeProfiles =
    profiles.length > PROFILE_CACHE_MAX_SIZE ? profiles.slice(0, PROFILE_CACHE_MAX_SIZE) : profiles;

  if (safeProfiles.length < profiles.length) {
    logger.warn('[feedUtils] Profile batch exceeds cache limit, truncating', {
      original: profiles.length,
      truncated: safeProfiles.length,
      maxSize: PROFILE_CACHE_MAX_SIZE,
    });
  }

  // B2 修復：超過容量上限時，清理最久未使用的項目
  // 計算需要清理的數量：確保新增後不超過容量上限
  const spaceNeeded = profileCache.size + safeProfiles.length - PROFILE_CACHE_MAX_SIZE;

  if (spaceNeeded > 0) {
    const entries = [...profileCache.entries()].sort((a, b) => a[1].lastAccess - b[1].lastAccess);
    // 至少清理 20%，但若需要更多空間則清理更多
    const minEvict = Math.ceil(entries.length * 0.2);
    const toDelete = Math.max(minEvict, spaceNeeded);

    for (let i = 0; i < toDelete && i < entries.length; i++) {
      const entry = entries[i];
      if (entry) {
        profileCache.delete(entry[0]);
      }
    }
    logger.debug('[feedUtils] Profile cache LRU eviction', {
      evicted: Math.min(toDelete, entries.length),
      remaining: profileCache.size,
      spaceNeeded,
    });
  }

  for (const profile of safeProfiles) {
    profileCache.set(profile.id, {
      profile,
      timestamp: now,
      lastAccess: now,
    });
  }
};

/**
 * 清空 Profile 快取
 * @remarks 用於登出、測試清理等場景
 *
 * @example
 * ```ts
 * // 登出時清理敏感資料
 * clearProfileCache();
 * ```
 */
export const clearProfileCache = (): void => {
  const size = profileCache.size;
  profileCache.clear();
  logger.debug('[feedUtils] Profile cache cleared', { previousSize: size });
};

/**
 * 取得 Profile 快取目前大小
 * @returns 快取項目數量
 *
 * @example
 * ```ts
 * const cacheSize = getProfileCacheSize();
 * // cacheSize: number
 * ```
 */
export const getProfileCacheSize = (): number => {
  return profileCache.size;
};

/**
 * 取得 Profile 快取統計資訊
 * @returns 快取統計
 */
export const getProfileCacheStats = (): {
  size: number;
  maxSize: number;
  ttlMs: number;
} => {
  return {
    size: profileCache.size,
    maxSize: PROFILE_CACHE_MAX_SIZE,
    ttlMs: PROFILE_CACHE_TTL_MS,
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * 延遲函數（用於 Mock 模擬網路延遲）
 *
 * @param ms - 延遲毫秒數（0 到 MAX_DELAY_MS 之間）
 * @returns Promise，在指定時間後 resolve
 * @throws 當 ms 為負數或超過 MAX_DELAY_MS 時拋出錯誤
 *
 * @example
 * ```ts
 * await delay(250); // 延遲 250ms
 * ```
 */
export const delay = (ms: number): Promise<void> => {
  // N2 修復：參數檢查
  if (ms < 0 || ms > MAX_DELAY_MS) {
    throw new RangeError(`delay ms must be between 0 and ${MAX_DELAY_MS}, got ${ms}`);
  }
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * 從貼文內容衍生標題
 *
 * @param content - 貼文內容
 * @returns 標題（超過 40 字會截斷並加 ...）
 *
 * @example
 * ```ts
 * deriveTitleFromContent(""); // "（無標題）"
 * deriveTitleFromContent("   "); // "（無標題）" - whitespace-only 也視為空
 * deriveTitleFromContent("短內容"); // "短內容"
 * deriveTitleFromContent("很長很長...（超過40字）"); // "很長很長...（前40字）..."
 * ```
 */
export const deriveTitleFromContent = (content: string): string => {
  // P1 修復：使用 trim() 處理 whitespace-only 字串
  const trimmed = content.trim();
  if (!trimmed) return '（無標題）';
  return trimmed.length > TITLE_TRUNCATE_LENGTH
    ? `${trimmed.slice(0, TITLE_TRUNCATE_LENGTH)}...`
    : trimmed;
};

/**
 * 從貼文列表衍生側邊欄資料
 *
 * @param posts - 貼文列表
 * @returns 側邊欄資料（熱門貼文 + 待售物件）
 *
 * @example
 * ```ts
 * const sidebar = deriveSidebarData(posts);
 * // sidebar.hotPosts: 前 3 個按讚數最多的貼文
 * ```
 */
export const deriveSidebarData = (posts: FeedPost[]): SidebarData => {
  const hotPosts = [...posts]
    // I1 修復：使用 ?? 處理 nullish（保留 0 值）
    .sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0))
    .slice(0, HOT_POSTS_LIMIT)
    .map((p) => ({
      id: p.id,
      title: p.title,
      communityName: p.communityName ?? S.DEFAULT_COMMUNITY_LABEL,
      likes: p.likes ?? 0,
    }));

  return {
    hotPosts,
    saleItems: MOCK_SALE_ITEMS,
  };
};

/**
 * 空的 Feed 資料常數
 * @remarks N3 修復：語意上為不可變資料
 */
export const EMPTY_FEED_DATA: UnifiedFeedData = {
  posts: [],
  totalPosts: 0,
  sidebarData: { hotPosts: [], saleItems: [] },
};

// ============================================================================
// Storage Functions
// ============================================================================

/**
 * 從 localStorage 載入持久化的 Mock 狀態
 *
 * @param fallback - 載入失敗時的預設值
 * @returns Feed 資料（優先使用持久化資料，失敗則用 fallback）
 *
 * @example
 * ```ts
 * const data = loadPersistedFeedMockState(getDefaultMockData());
 * ```
 */
export const loadPersistedFeedMockState = (fallback: UnifiedFeedData): UnifiedFeedData => {
  const raw = safeLocalStorage.getItem(FEED_MOCK_STORAGE_KEY);
  if (!raw) return fallback;

  try {
    const jsonParsed = JSON.parse(raw);

    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as 類型斷言
    const parseResult = PersistedFeedDataSchema.safeParse(jsonParsed);
    if (!parseResult.success) {
      logger.warn('[feedUtils] Mock state validation failed, using fallback', {
        error: parseResult.error.flatten(),
      });
      return fallback;
    }

    const parsed = parseResult.data;
    // I1 修復：使用 ?? 處理 nullish
    // [NASA TypeScript Safety] 此處 as 斷言是安全的：
    // - Zod Schema 已驗證基本結構（id, author, type, time, title, content, comments）
    // - passthrough() 允許 FeedPost 的其他可選屬性通過
    // - TypeScript 需要此斷言因為 Zod 推導的型別與 FeedPost 不完全相同
    const posts: FeedPost[] = parsed.posts.map((p) => ({
      ...p,
      // 確保必要欄位存在，填入預設值
      likes: typeof p.likes === 'number' ? p.likes : 0,
      views: typeof p.views === 'number' ? p.views : undefined,
      pinned: typeof p.pinned === 'boolean' ? p.pinned : false,
    })) as FeedPost[];
    return {
      posts,
      totalPosts: parsed.totalPosts ?? fallback.totalPosts,
      sidebarData: deriveSidebarData(posts),
    };
  } catch (err) {
    logger.error('[feedUtils] Failed to load mock state', { error: err });
    return fallback;
  }
};

/**
 * 儲存 Mock 狀態到 localStorage
 *
 * @param data - 要儲存的 Feed 資料
 *
 * @example
 * ```ts
 * saveFeedMockState(currentData);
 * ```
 */
export const saveFeedMockState = (data: UnifiedFeedData): void => {
  try {
    safeLocalStorage.setItem(FEED_MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    logger.error('[feedUtils] Failed to persist mock state', { error: err });
  }
};

// ============================================================================
// Profile Functions
// ============================================================================

/**
 * Profile 取得結果
 */
export interface BuildProfileMapResult {
  /** Profile Map */
  profiles: Map<string, ProfileRow>;
  /** 是否有 API 錯誤（用於 UI 顯示） */
  hadError: boolean;
  /** 錯誤訊息（如果有） */
  errorMessage?: string;
}

/**
 * 建立作者 Profile Map（含快取與 Zod 驗證）
 *
 * @param authorIds - 作者 ID 陣列
 * @returns Profile Map 與錯誤狀態
 *
 * @example
 * ```ts
 * const { profiles, hadError } = await buildProfileMap(['user-1', 'user-2']);
 * if (hadError) {
 *   // 顯示部分資料警告
 * }
 * const profile = profiles.get('user-1');
 * ```
 */
export const buildProfileMap = async (authorIds: string[]): Promise<BuildProfileMapResult> => {
  if (!authorIds.length) {
    return { profiles: new Map(), hadError: false };
  }

  const { cached, uncached } = getProfilesFromCache(authorIds);

  // 全部命中快取
  if (uncached.length === 0) {
    return { profiles: cached, hadError: false };
  }

  // 從 API 取得未快取的 Profile
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, floor, role')
    .in('id', uncached);

  // I4 修復：明確的錯誤處理策略
  if (error) {
    logger.error('[feedUtils] Fetch profiles failed', {
      error,
      uncachedCount: uncached.length,
      cachedCount: cached.size,
    });
    return {
      profiles: cached,
      hadError: true,
      errorMessage: `Failed to fetch ${uncached.length} profiles: ${error.message}`,
    };
  }

  // B1 修復：使用 Zod Schema 驗證，不使用 `as` 轉型
  const parseResult = ProfileRowSchema.array().safeParse(data ?? []);

  if (!parseResult.success) {
    logger.warn('[feedUtils] Profile schema validation failed', {
      error: parseResult.error.flatten(),
      rawDataCount: data?.length ?? 0,
    });
    // 驗證失敗時返回快取，標記有錯誤
    return {
      profiles: cached,
      hadError: true,
      errorMessage: 'Profile data validation failed',
    };
  }

  const fetchedProfiles = parseResult.data;
  setProfilesToCache(fetchedProfiles);

  // 合併快取與新取得的資料
  const result = new Map(cached);
  for (const profile of fetchedProfiles) {
    result.set(profile.id, profile);
  }

  return { profiles: result, hadError: false };
};

// ============================================================================
// Data Transformation
// ============================================================================

/**
 * 將 Supabase 貼文資料轉換為 FeedPost 格式
 *
 * @param rows - Supabase 返回的原始貼文資料
 * @returns 統一格式的 Feed 資料
 *
 * @example
 * ```ts
 * const { data } = await supabase.from('posts').select('*');
 * const feedData = await mapSupabasePostsToFeed(data);
 * ```
 */
export const mapSupabasePostsToFeed = async (rows: SupabasePostRow[]): Promise<UnifiedFeedData> => {
  // 提取唯一的作者 ID
  const authorIds = Array.from(
    new Set(rows.map((r) => r.author_id).filter((id): id is string => Boolean(id)))
  );

  const { profiles: profileMap } = await buildProfileMap(authorIds);

  const posts: FeedPost[] = rows.map((row) => {
    const profile = row.author_id ? profileMap.get(row.author_id) : undefined;
    // I1 修復：使用 ?? 處理 nullish
    const likedBy = row.liked_by ?? [];

    // 角色正規化
    const normalizedRole: FeedPost['type'] =
      profile?.role === 'agent' ? 'agent' : profile?.role === 'resident' ? 'resident' : 'member';

    const base: FeedPost = {
      id: row.id,
      author: profile?.name ?? '住戶',
      type: normalizedRole,
      time: row.created_at || new Date().toISOString(),
      title: deriveTitleFromContent(row.content),
      content: row.content,
      // I1 修復：使用 ?? 保留 0 值
      likes: row.likes_count ?? likedBy.length,
      comments: row.comments_count ?? 0,
      pinned: row.is_pinned ?? false,
      communityId: row.community_id,
      communityName: getCommunityName(row.community_id),
      liked_by: likedBy,
      private: row.visibility === 'private',
    };

    return profile?.floor ? { ...base, floor: profile.floor } : base;
  });

  return {
    posts,
    totalPosts: posts.length,
    sidebarData: deriveSidebarData(posts),
  };
};

// ============================================================================
// Filter Functions
// ============================================================================

/**
 * 過濾 Mock 資料（按社區 ID）
 *
 * @param source - 原始 Feed 資料
 * @param targetCommunityId - 目標社區 ID（不指定則返回全部）
 * @returns 過濾後的 Feed 資料
 *
 * @example
 * ```ts
 * const filtered = filterMockData(allData, 'community-1');
 * ```
 */
export const filterMockData = (
  source: UnifiedFeedData,
  targetCommunityId?: string
): UnifiedFeedData => {
  const filteredPosts = targetCommunityId
    ? source.posts.filter((p) => p.communityId === targetCommunityId)
    : source.posts;

  return {
    posts: filteredPosts,
    totalPosts: filteredPosts.length,
    sidebarData: deriveSidebarData(filteredPosts),
  };
};

/**
 * 安全過濾貼文（權限檢查）
 *
 * @param posts - 貼文列表
 * @param canViewPrivate - 是否有權限查看私密貼文
 * @returns 過濾後的貼文列表
 *
 * @example
 * ```ts
 * // 訪客只能看公開貼文
 * const publicPosts = filterSecurePosts(allPosts, false);
 *
 * // 住戶可以看全部
 * const allPosts = filterSecurePosts(allPosts, true);
 * ```
 */
export const filterSecurePosts = (posts: FeedPost[], canViewPrivate: boolean): FeedPost[] => {
  return posts.filter((p) => !p.private || canViewPrivate);
};

/**
 * 建立安全的 Feed 資料（套用權限過濾）
 *
 * @param data - 原始 Feed 資料
 * @param canViewPrivate - 是否有權限查看私密貼文
 * @returns 權限過濾後的 Feed 資料
 *
 * @example
 * ```ts
 * const secureData = createSecureFeedData(rawData, user.canViewPrivate);
 * ```
 */
export const createSecureFeedData = (
  data: UnifiedFeedData,
  canViewPrivate: boolean
): UnifiedFeedData => {
  const securePosts = filterSecurePosts(data.posts, canViewPrivate);
  return {
    ...data,
    posts: securePosts,
    totalPosts: securePosts.length,
    sidebarData: deriveSidebarData(securePosts),
  };
};
