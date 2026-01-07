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

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { mhEnv } from "../lib/mhEnv";
import { safeLocalStorage } from "../lib/safeStorage";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";
import type { Post, Role } from "../types/community";
import { useAuth } from "./useAuth";
import { getCommunityName, isValidCommunityId } from "../constants";

import { MOCK_SALE_ITEMS } from "../services/mock/feed";
import { STRINGS } from "../constants/strings";
import type { FeedComment } from "../types/comment";
import {
  getConsumerFeedData,
  createMockPost as createMockPostFromFactory,
} from "../pages/Feed/mockData";
import { usePermission } from "./usePermission";
import { PERMISSIONS } from "../types/permissions";
import { uploadService } from "../services/uploadService";
import type { FeedPost, UnifiedFeedData, SidebarData } from "../types/feed";
const S = STRINGS.FEED;

// Re-export types for backward compatibility
export type { FeedPost, UnifiedFeedData, SidebarData };

// ============ 常數 ============
const FEED_MOCK_STORAGE_KEY = "feed-mock-data-v1";
const MOCK_LATENCY_MS = 250;
const HOT_POSTS_LIMIT = 3;

// Helper to derive Sidebar Data
const deriveSidebarData = (posts: FeedPost[]): SidebarData => {
  const hotPosts = [...posts]
    .sort((a, b) => (b.likes || 0) - (a.likes || 0))
    .slice(0, HOT_POSTS_LIMIT)
    .map((p) => ({
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

// ============ Default Mock Data (from external mockData module) ============
// P6-REFACTOR: Mock data moved to src/pages/Feed/mockData/
// Using getter function to ensure deep copy and prevent state mutation
const getDefaultMockData = (): UnifiedFeedData => getConsumerFeedData();

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

const getProfilesFromCache = (
  authorIds: string[],
): {
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

const filterMockData = (
  source: UnifiedFeedData,
  targetCommunityId?: string,
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

// ============ 工具函數 ============
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const deriveTitleFromContent = (content: string): string => {
  if (!content) return "（無標題）";
  return content.length > 40 ? `${content.slice(0, 40)}...` : content;
};

const loadPersistedFeedMockState = (
  fallback: UnifiedFeedData,
): UnifiedFeedData => {
  const raw = safeLocalStorage.getItem(FEED_MOCK_STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw) as Partial<UnifiedFeedData>;
    const posts = parsed.posts ?? fallback.posts;
    return {
      posts,
      totalPosts: parsed.totalPosts ?? fallback.totalPosts,
      sidebarData: deriveSidebarData(posts),
    };
  } catch (err) {
    logger.error("[useFeedData] Failed to load mock state", { error: err });
    return fallback;
  }
};

const saveFeedMockState = (data: UnifiedFeedData): void => {
  try {
    safeLocalStorage.setItem(FEED_MOCK_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    logger.error("[useFeedData] Failed to persist mock state", { error: err });
  }
};

const buildProfileMap = async (
  authorIds: string[],
): Promise<Map<string, ProfileRow>> => {
  if (!authorIds.length) return new Map();

  const { cached, uncached } = getProfilesFromCache(authorIds);
  if (uncached.length === 0) {
    return cached;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, floor, role")
    .in("id", uncached);

  if (error) {
    logger.error("[useFeedData] Fetch profiles failed", { error });
    return cached;
  }

  const fetchedProfiles = (data ?? []).map((profile) => profile as ProfileRow);
  setProfilesToCache(fetchedProfiles);

  const result = new Map(cached);
  for (const profile of fetchedProfiles) {
    result.set(profile.id, profile);
  }

  return result;
};

const mapSupabasePostsToFeed = async (
  rows: SupabasePostRow[],
): Promise<UnifiedFeedData> => {
  const authorIds = Array.from(
    new Set(
      rows.map((r) => r.author_id).filter((id): id is string => Boolean(id)),
    ),
  );
  const profileMap = await buildProfileMap(authorIds);

  const posts: FeedPost[] = rows.map((row) => {
    const profile = row.author_id ? profileMap.get(row.author_id) : undefined;
    const likedBy = row.liked_by ?? [];
    const normalizedRole: FeedPost["type"] =
      profile?.role === "agent"
        ? "agent"
        : profile?.role === "resident"
          ? "resident"
          : "member";

    const base: FeedPost = {
      id: row.id,
      author: profile?.name ?? "住戶",
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
      private: row.visibility === "private",
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
  communityName?: string,
): FeedPost => ({
  id: Date.now(),
  author: "測試用戶",
  type: "resident",
  time: new Date().toISOString(),
  title: content.substring(0, 20) + (content.length > 20 ? "..." : ""),
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
  createPost: (
    content: string,
    communityId?: string,
    images?: File[],
  ) => Promise<void>;
  /** 後端判定的使用者身份 */
  viewerRole: Role;
  /** 是否登入 */
  isAuthenticated: boolean;
  /** 判斷某貼文是否已按讚（P2-C5 修復：暴露給消費者） */
  isLiked: (postId: string | number) => boolean;
  /** 新增留言 */
  addComment: (postId: string | number, content: string) => Promise<void>;
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
  options: UseFeedDataOptions = {},
): UseFeedDataReturn {
  const {
    user: authUser,
    role: authRole,
    isAuthenticated,
    loading: authLoading,
  } = useAuth();
  const { communityId, initialMockData, persistMockState = true } = options;

  const { hasPermission } = usePermission();
  const canViewPrivate = hasPermission(PERMISSIONS.VIEW_PRIVATE_WALL);

  // P6-REFACTOR: Use getter to ensure fresh deep copy of mock data
  const resolvedInitialMockData = initialMockData ?? getDefaultMockData();

  // ============ Mock 控制 ============
  const [useMock, setUseMockState] = useState<boolean>(() =>
    mhEnv.isMockEnabled(),
  );

  useEffect(() => {
    const unsubscribe = mhEnv.subscribe(setUseMockState);
    return unsubscribe;
  }, []);

  const currentUserId = authUser?.id;

  // ============ Mock 狀態 ============
  const [mockData, setMockData] = useState<UnifiedFeedData>(() => {
    const rawData = persistMockState
      ? loadPersistedFeedMockState(resolvedInitialMockData)
      : resolvedInitialMockData;
    const securePosts = rawData.posts.filter((p) => {
      if (p.private && !canViewPrivate) return false;
      return true;
    });
    return {
      ...rawData,
      posts: securePosts,
      totalPosts: securePosts.length,
      sidebarData: deriveSidebarData(securePosts),
    };
  });
  const hasRestoredFromStorage = useRef(false);
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(
    () => new Set(),
  );

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
    const loadedData = loadPersistedFeedMockState(resolvedInitialMockData);

    // P7-6 OPTIMIZATION: State Level Security for Mock Data
    const securePosts = loadedData.posts.filter((p) => {
      if (p.private && !canViewPrivate) return false;
      return true;
    });

    setMockData({
      ...loadedData,
      posts: securePosts,
      totalPosts: securePosts.length,
      sidebarData: deriveSidebarData(securePosts),
    });
  }, [useMock, persistMockState, resolvedInitialMockData, canViewPrivate]);

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

  // P2-C2/C4 修復：API 按讚狀態（用於樂觀更新）
  const [apiLikedPosts, setApiLikedPosts] = useState<Set<string | number>>(
    () => new Set(),
  );

  // P2-C3 更新：API 模式使用 Supabase 真實資料
  const fetchApiData = useCallback(async () => {
    if (useMock) return;
    setApiLoading(true);
    setApiError(null);

    try {
      const query = supabase
        .from("community_posts")
        .select(
          "id, community_id, author_id, content, visibility, likes_count, comments_count, liked_by, is_pinned, created_at, post_type",
        )
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50);

      if (communityId) {
        query.eq("community_id", communityId);
      }

      // P7-Audit-B4: API Level Security (Prevent data leakage over wire)
      if (!canViewPrivate) {
        query.eq("visibility", "public");
      }

      const { data, error } = await query;
      if (error) {
        throw error;
      }

      const mapped = await mapSupabasePostsToFeed(
        (data ?? []) as SupabasePostRow[],
      );

      // Security Filter
      const securePosts = mapped.posts.filter((p) => {
        if (p.private && !canViewPrivate) return false;
        return true;
      });

      const secureData = {
        ...mapped,
        posts: securePosts,
        totalPosts: securePosts.length,
        sidebarData: deriveSidebarData(securePosts),
      };

      setApiData(secureData);
      lastApiDataRef.current = secureData;

      if (currentUserId) {
        const initialLiked = new Set<string | number>();
        (data ?? []).forEach((row) => {
          const likedBy = (row as SupabasePostRow).liked_by ?? [];
          if (likedBy.includes(currentUserId)) {
            initialLiked.add((row as SupabasePostRow).id);
          }
        });
        setApiLikedPosts(initialLiked);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("載入信息流失敗");
      setApiError(error);
      if (import.meta.env.DEV) {
        logger.error("[useFeedData] API error", { error: err });
      }
    } finally {
      setApiLoading(false);
    }
  }, [useMock, communityId, currentUserId, canViewPrivate]);

  // 初始載入
  useEffect(() => {
    if (!useMock) {
      fetchApiData();
    }
  }, [useMock, fetchApiData]);

  // ============ 統一資料來源 ============
  const data = useMemo<UnifiedFeedData>(() => {
    if (useMock) {
      return filterMockData(mockData, communityId);
    }

    if (apiData) {
      lastApiDataRef.current = apiData;
      return apiData;
    }

    const rawData = lastApiDataRef.current ?? EMPTY_FEED_DATA;

    if (!canViewPrivate) {
      return {
        ...rawData,
        posts: rawData.posts.filter((p) => !p.private),
      };
    }
    return rawData;
  }, [useMock, apiData, mockData, communityId, canViewPrivate]);

  // ============ viewerRole ============
  const viewerRole = useMemo<Role>(() => authRole ?? "guest", [authRole]);

  // P2-C1 修復：Mock likedPosts 初始化（加 ref 保護，只執行一次）
  useEffect(() => {
    if (!useMock || !currentUserId) return;

    if (hasInitializedLikedPosts.current) return;
    hasInitializedLikedPosts.current = true;

    const initialLiked = new Set<string | number>();
    mockData.posts.forEach((p) => {
      if (p.liked_by?.includes(currentUserId)) {
        initialLiked.add(p.id);
      }
    });
    setLikedPosts(initialLiked);
  }, [useMock, currentUserId, mockData]);

  // ============ Mock 模式 userId ============
  const getMockUserId = useCallback((): string => {
    if (currentUserId) return currentUserId;
    const storageKey = "mock_user_id";
    let mockId = safeLocalStorage.getItem(storageKey);
    if (!mockId) {
      mockId = `mock-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      safeLocalStorage.setItem(storageKey, mockId);
    }
    return mockId;
  }, [currentUserId]);

  // P2-C5 修復：暴露 isLiked helper
  const isLiked = useCallback(
    (postId: string | number): boolean => {
      if (useMock) {
        return likedPosts.has(postId);
      }
      return apiLikedPosts.has(postId);
    },
    [useMock, likedPosts, apiLikedPosts],
  );

  // ============ 操作方法 ============
  const refresh = useCallback(async () => {
    if (useMock) {
      setMockData((prev) => ({ ...prev }));
      return;
    }
    await fetchApiData();
  }, [useMock, fetchApiData]);

  // P2-C2 修復：API 模式加入樂觀更新
  const toggleLike = useCallback(
    async (postId: string | number) => {
      if (!useMock && !isAuthenticated) {
        throw new Error("請先登入後再按讚");
      }

      if (useMock) {
        const mockUserId = getMockUserId();
        const currentlyLiked = likedPosts.has(postId);

        setMockData((prev) => ({
          ...prev,
          posts: prev.posts.map((post) => {
            if (post.id !== postId) return post;
            const currentLikes = post.likes ?? 0;
            const currentLikedBy = post.liked_by ?? [];
            return {
              ...post,
              likes: currentlyLiked
                ? Math.max(0, currentLikes - 1)
                : currentLikes + 1,
              liked_by: currentlyLiked
                ? currentLikedBy.filter((id) => id !== mockUserId)
                : [...currentLikedBy, mockUserId],
            };
          }),
        }));

        setLikedPosts((prev) => {
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

      const actingUserId = currentUserId;
      if (!actingUserId) {
        throw new Error("缺少使用者身份");
      }

      const postIdStr = String(postId);
      const currentlyLiked = apiLikedPosts.has(postId);
      const previousApiData = apiData;
      const previousApiLikedPosts = new Set(apiLikedPosts);

      setApiData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map((post) => {
            if (post.id !== postId) return post;
            const currentLikes = post.likes ?? 0;
            const currentLikedBy = post.liked_by ?? [];
            const nextLikedBy = currentlyLiked
              ? currentLikedBy.filter((id) => id !== actingUserId)
              : [...currentLikedBy, actingUserId];
            return {
              ...post,
              likes: currentlyLiked
                ? Math.max(0, currentLikes - 1)
                : currentLikes + 1,
              liked_by: nextLikedBy,
            };
          }),
        };
      });

      setApiLikedPosts((prev) => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      });

      try {
        const { data, error } = await supabase.rpc("toggle_like", {
          post_id: postIdStr,
        });
        if (error) {
          throw error;
        }

        setApiData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            posts: prev.posts.map((post) => {
              if (post.id !== postId) return post;
              const newLikes =
                typeof data?.likes_count === "number"
                  ? data.likes_count
                  : (post.likes ?? 0);
              const likedBy = post.liked_by ?? [];
              const nextLikedBy =
                data && "liked" in data
                  ? data.liked
                    ? [...new Set([...likedBy, actingUserId])]
                    : likedBy.filter((id) => id !== actingUserId)
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
        setApiData(previousApiData);
        setApiLikedPosts(previousApiLikedPosts);
        throw err instanceof Error ? err : new Error("按讚失敗，請稍後再試");
      }
    },
    [
      useMock,
      likedPosts,
      apiLikedPosts,
      apiData,
      getMockUserId,
      isAuthenticated,
      currentUserId,
    ],
  );

  // P2-C4 修復：API 模式加入樂觀更新 (Updated for P0 Image Upload)
  const createPost = useCallback(
    async (content: string, communityId?: string, images?: File[]) => {
      if (!useMock && !isAuthenticated) {
        throw new Error("請先登入後再發文");
      }

      const resolvedCommunityId = communityId ?? options.communityId;
      if (resolvedCommunityId && !isValidCommunityId(resolvedCommunityId)) {
        logger.warn(
          "[useFeedData] Invalid communityId provided, fallback to undefined",
        );
      }
      const safeCommunityId =
        resolvedCommunityId && isValidCommunityId(resolvedCommunityId)
          ? resolvedCommunityId
          : undefined;

      if (!useMock && !safeCommunityId) {
        throw new Error("請先選擇社區後再發文");
      }
      const resolvedCommunityName = getCommunityName(safeCommunityId);

      // Mock Mode
      if (useMock) {
        const newPost = createFeedMockPost(
          content,
          safeCommunityId,
          resolvedCommunityName,
        );

        // Mock Images
        if (images && images.length > 0) {
          newPost.images = images.map((_, i) => ({
            src: `https://picsum.photos/seed/${Date.now() + i}/400/300`,
            alt: "Mock Image",
          }));
        }

        setMockData((prev) => ({
          ...prev,
          posts: [newPost, ...prev.posts],
          totalPosts: prev.totalPosts + 1,
          sidebarData: deriveSidebarData([newPost, ...prev.posts]),
        }));
        return;
      }

      // API Mode
      const tempId = -Date.now();
      const tempPost: FeedPost = {
        id: tempId,
        author: authUser?.user_metadata?.name || authUser?.email || "我",
        type: (["agent", "resident", "official"].includes(authRole || "")
          ? authRole
          : "member") as FeedPost["type"],
        time: new Date().toISOString(),
        title: content.substring(0, 20),
        content: content,
        likes: 0,
        comments: 0,
        pinned: false,
        communityId: safeCommunityId,
        communityName: resolvedCommunityName,
        commentList: [],
        ...(images && images.length > 0
          ? {
              images: images.map((f) => ({
                src: URL.createObjectURL(f),
                alt: f.name,
              })),
            }
          : {}),
      };

      // 1. 樂觀插入
      setApiData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: [tempPost, ...prev.posts],
          totalPosts: prev.totalPosts + 1,
          sidebarData: deriveSidebarData([tempPost, ...prev.posts]),
        };
      });

      try {
        // 2. Upload Images First (D2: Use Batch Upload)
        let uploadedImages: { src: string; alt: string }[] = [];
        if (images && images.length > 0) {
          const results = await uploadService.uploadFiles(images);
          uploadedImages = results.map((res) => ({
            src: res.url,
            alt: "Post Image",
          }));
        }

        // 3. Insert Post
        const { error } = await supabase.from("community_posts").insert({
          content,
          community_id: safeCommunityId,
          author_id: currentUserId,
          post_type: "general",
          images: uploadedImages,
        });

        if (error) throw error;

        // 4. Refresh
        await fetchApiData();
      } catch (err) {
        logger.error("[useFeedData] Create post failed", { error: err });
        // Rollback
        setApiData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            posts: prev.posts.filter((p) => p.id !== tempId),
            totalPosts: prev.totalPosts - 1,
            sidebarData: deriveSidebarData(
              prev.posts.filter((p) => p.id !== tempId),
            ),
          };
        });
        throw err;
      }
    },
    [
      useMock,
      isAuthenticated,
      options.communityId,
      authUser,
      authRole,
      currentUserId,
      fetchApiData,
    ],
  ); // E2: Added fetchApiData dependency

  const addComment = useCallback(
    async (postId: string | number, content: string) => {
      if (!useMock && !isAuthenticated) {
        throw new Error("請先登入後再留言");
      }

      // Prepare Comment Object (Shared for Mock and Optimistic UI)
      const tempId = useMock ? Date.now() : -Date.now();
      const commentObj: FeedComment = {
        id: tempId,
        postId: postId,
        author: authUser?.user_metadata?.name || "測試用戶",
        role: (["agent", "resident", "official"].includes(authRole || "")
          ? authRole
          : "member") as FeedComment["role"],
        content,
        time: new Date().toISOString(),
        likes: 0,
        isLiked: false,
      };

      // Mock Mode
      if (useMock) {
        setMockData((prev) => ({
          ...prev,
          posts: prev.posts.map((post) => {
            if (post.id !== postId) return post;
            const updatedComments = [...(post.commentList || []), commentObj];
            return {
              ...post,
              comments: updatedComments.length,
              commentList: updatedComments,
            };
          }),
        }));
        return;
      }

      // API Mode (E1 Best Practice: Optimistic + Real DB)
      const previousApiData = apiData;

      // 1. Optimistic Update
      setApiData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          posts: prev.posts.map((post) => {
            if (post.id !== postId) return post;
            const updatedComments = [...(post.commentList || []), commentObj];
            return {
              ...post,
              comments: updatedComments.length,
              commentList: updatedComments,
            };
          }),
        };
      });

      try {
        setApiLoading(true);

        // 2. Real API Call
        const { error } = await supabase.from("community_comments").insert({
          post_id: postId,
          community_id: options.communityId,
          user_id: currentUserId,
          content: content,
        });

        if (error) throw error;

        // 3. Refresh data to get Real ID
        await fetchApiData();
      } catch (err) {
        // F2 Fix: Removed console.error for production safety
        // Only log in DEV mode for debugging
        if (import.meta.env.DEV) {
          logger.warn(
            "[useFeedData] Add comment failed (Check Schema: community_comments?)",
            { error: err },
          );
        }
        setApiData(previousApiData);
        setApiError(err as Error);
        throw err;
      } finally {
        setApiLoading(false);
      }
    },
    [
      useMock,
      isAuthenticated,
      authUser,
      authRole,
      currentUserId,
      options.communityId,
      apiData,
      fetchApiData,
    ],
  );

  return {
    data,
    useMock,
    setUseMock: setUseMockState,
    isLoading: useMock ? false : apiLoading,
    error: useMock ? null : apiError,
    refresh,
    toggleLike,
    createPost,
    addComment,
    viewerRole,
    isAuthenticated,
    isLiked,
  };
}
