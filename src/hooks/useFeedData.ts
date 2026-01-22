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
 *
 * Phase 4 重構 (2026-01-15):
 * - 純函數抽取至 ./feed/feedUtils.ts
 * - 保留 React hooks 邏輯於此檔案
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { mhEnv } from "../lib/mhEnv";
import { safeLocalStorage } from "../lib/safeStorage";
import { logger } from "../lib/logger";
import { supabase } from "../lib/supabase";
import type { Role } from "../types/community";
import { useAuth } from "./useAuth";
import { getCommunityName, isValidCommunityId } from "../constants";

import type { FeedComment, FeedCommentAuthorRole } from "../types/comment";
import { getConsumerFeedData } from "../pages/Feed/mockData";
import { usePermission } from "./usePermission";
import { PERMISSIONS } from "../types/permissions";
import { uploadService } from "../services/uploadService";
import type { FeedPost, UnifiedFeedData, SidebarData } from "../types/feed";

// [NASA TypeScript Safety] 定義有效的 FeedPost type 值
const VALID_POST_TYPES = ["agent", "resident", "official", "member"] as const;
type ValidPostType = (typeof VALID_POST_TYPES)[number];

/**
 * [NASA TypeScript Safety] 類型守衛：驗證角色是否為有效的 FeedPost type
 */
function isValidPostType(value: unknown): value is ValidPostType {
  return (
    typeof value === "string" &&
    VALID_POST_TYPES.includes(value as ValidPostType)
  );
}

/**
 * [NASA TypeScript Safety] 安全轉換角色為 FeedPost type
 */
function toFeedPostType(role: string | undefined | null): FeedPost["type"] {
  if (isValidPostType(role)) {
    return role;
  }
  return "member";
}

/**
 * [NASA TypeScript Safety] 安全轉換角色為 FeedComment author role
 */
function toCommentAuthorRole(
  role: string | undefined | null,
): FeedCommentAuthorRole {
  if (
    role === "agent" ||
    role === "resident" ||
    role === "official" ||
    role === "member"
  ) {
    return role;
  }
  return "member";
}

// Phase 4: 從 feedUtils 導入純函數
import {
  FEED_MOCK_STORAGE_KEY,
  EMPTY_FEED_DATA,
  type SupabasePostRow,
  type ProfileRow,
  SupabasePostRowSchema,
  deriveSidebarData,
  deriveTitleFromContent,
  loadPersistedFeedMockState,
  saveFeedMockState,
  buildProfileMap,
  mapSupabasePostsToFeed,
  filterMockData,
  filterSecurePosts,
  createSecureFeedData,
} from "./feed";

// Re-export types for backward compatibility
export type { FeedPost, UnifiedFeedData, SidebarData };

// ============ Default Mock Data (from external mockData module) ============
// P6-REFACTOR: Mock data moved to src/pages/Feed/mockData/
// Using getter function to ensure deep copy and prevent state mutation
const getDefaultMockData = (): UnifiedFeedData => getConsumerFeedData();

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

      // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as 類型斷言
      const parseResult = SupabasePostRowSchema.array().safeParse(data ?? []);
      if (!parseResult.success) {
        logger.warn("[useFeedData] Supabase post data validation failed", {
          error: parseResult.error.flatten(),
        });
        // 降級處理：使用空陣列
        const mapped = await mapSupabasePostsToFeed([]);
        setApiData(mapped);
        return;
      }

      const mapped = await mapSupabasePostsToFeed(parseResult.data);

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

  /**
   * 按讚貼文
   *
   * AUDIT-01 Phase 6: 競態條件修復
   * - API 模式：使用「反向操作」回滾，而非「捕獲舊狀態」
   * - 避免快速連擊時丟失中間操作
   * - Mock 模式：保持原有邏輯（本地操作無競態問題）
   */
  const toggleLike = useCallback(
    async (postId: string | number) => {
      if (!useMock && !isAuthenticated) {
        throw new Error("請先登入後再按讚");
      }

      // Mock 模式：本地操作，無競態問題
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

      // API 模式：需要處理競態條件
      const actingUserId = currentUserId;
      if (!actingUserId) {
        throw new Error("缺少使用者身份");
      }

      const postIdStr = String(postId);

      /**
       * 輔助函數：套用按讚切換（可用於樂觀更新和回滾）
       * 反向操作 = 再次調用同一函數
       */
      const applyLikeToggle = (
        data: UnifiedFeedData | null,
        userId: string,
      ): UnifiedFeedData | null => {
        if (!data) return data;
        return {
          ...data,
          posts: data.posts.map((post) => {
            if (post.id !== postId) return post;
            const currentLikes = post.likes ?? 0;
            const currentLikedBy = post.liked_by ?? [];
            const isCurrentlyLiked = currentLikedBy.includes(userId);
            const nextLikedBy = isCurrentlyLiked
              ? currentLikedBy.filter((id) => id !== userId)
              : [...currentLikedBy, userId];
            return {
              ...post,
              likes: isCurrentlyLiked
                ? Math.max(0, currentLikes - 1)
                : currentLikes + 1,
              liked_by: nextLikedBy,
            };
          }),
        };
      };

      const toggleLikedPostsSet = (
        prev: Set<string | number>,
      ): Set<string | number> => {
        const next = new Set(prev);
        if (next.has(postId)) {
          next.delete(postId);
        } else {
          next.add(postId);
        }
        return next;
      };

      // 1. 樂觀更新
      setApiData((prev) => applyLikeToggle(prev, actingUserId));
      setApiLikedPosts(toggleLikedPostsSet);

      try {
        const { data, error } = await supabase.rpc("toggle_like", {
          post_id: postIdStr,
        });
        if (error) {
          throw error;
        }

        // 2. 使用伺服器值同步（確保數據一致性）
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
        // 3. 回滾：使用反向操作（再次 toggle = 還原）
        // 這種方式不依賴閉包捕獲的舊狀態，避免競態條件
        setApiData((prev) => applyLikeToggle(prev, actingUserId));
        setApiLikedPosts(toggleLikedPostsSet);
        logger.warn("[useFeedData] toggleLike rollback", {
          postId,
          error: err instanceof Error ? err.message : String(err),
          reason: "API_FAILURE",
        });
        throw err instanceof Error ? err : new Error("按讚失敗，請稍後再試");
      }
    },
    [useMock, likedPosts, getMockUserId, isAuthenticated, currentUserId],
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
        // [NASA TypeScript Safety] 使用類型守衛取代 as 類型斷言
        type: toFeedPostType(authRole),
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
        id: String(tempId),
        postId: String(postId),
        author: {
          id: authUser?.id || "",
          name: authUser?.user_metadata?.name || "測試用戶",
          // [NASA TypeScript Safety] 使用類型守衛取代 as 類型斷言
          role: toCommentAuthorRole(authRole),
        },
        content,
        createdAt: new Date().toISOString(),
        likesCount: 0,
        isLiked: false,
        repliesCount: 0,
        // 相容舊欄位
        time: new Date().toISOString(),
        likes: 0,
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
          author_id: currentUserId,
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
        // [NASA TypeScript Safety] 使用 instanceof 取代 as Error
        setApiError(err instanceof Error ? err : new Error(String(err)));
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
