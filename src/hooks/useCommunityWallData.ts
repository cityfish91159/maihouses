/**
 * useCommunityWallData
 *
 * 統一社區牆資料來源 Hook
 * - Mock 模式：使用本地假資料
 * - API 模式：使用真實 API 資料（自動轉換格式）
 * - 統一資料格式：不管來源是 Mock 還是 API，輸出格式一致
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { z } from "zod";
import { safeLocalStorage } from "../lib/safeStorage";
import { useCommunityWall } from "./useCommunityWallQuery";
import { supabase } from "../lib/supabase";
import { mhEnv } from "../lib/mhEnv";
import { logger } from "../lib/logger";
import type { CommunityWallData } from "../services/communityService";
import type {
  CommunityInfo,
  Post,
  Review,
  Question,
  Role,
} from "../pages/Community/types";
import {
  MOCK_DATA,
  createMockPost,
  createMockQuestion,
  createMockAnswer,
} from "../pages/Community/mockData";
import { convertApiData, sortPostsWithPinned } from "./communityWallConverters";
import type { UnifiedWallData } from "./communityWallConverters";

// [NASA TypeScript Safety] Zod Schema 用於驗證 viewerRole
const RoleSchema = z.enum(["guest", "member", "resident", "agent", "official", "admin"]);

/**
 * [NASA TypeScript Safety] 類型守衛：驗證 viewerRole 是否為有效的 Role
 */
function isValidRole(value: unknown): value is Role {
  return RoleSchema.safeParse(value).success;
}

// ============ 統一輸出型別 ============
export type { Post, Review, Question, CommunityInfo };
export type { UnifiedWallData };

const MOCK_DATA_STORAGE_KEY = "community-wall-mock-data-v1";
const MOCK_LATENCY_MS = 250;

const EMPTY_WALL_DATA: UnifiedWallData = {
  communityInfo: {
    name: "載入中...",
    year: null,
    units: null,
    managementFee: null,
    builder: null,
    members: null,
    avgRating: null,
    monthlyInteractions: null,
    forSale: null,
  },
  posts: {
    public: [],
    private: [],
    publicTotal: 0,
    privateTotal: 0,
  },
  reviews: {
    items: [],
    total: 0,
  },
  questions: {
    items: [],
    total: 0,
  },
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mergeMockState = (
  fallback: UnifiedWallData,
  stored: Partial<UnifiedWallData> | null,
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
  try {
    const raw = safeLocalStorage.getItem(MOCK_DATA_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return mergeMockState(fallback, parsed);
  } catch (err) {
    logger.error("[useCommunityWallData] Failed to load mock state", {
      error: err,
    });
    return fallback;
  }
};

const saveMockState = (data: UnifiedWallData) => {
  try {
    safeLocalStorage.setItem(MOCK_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    logger.error("[useCommunityWallData] Failed to persist mock state", {
      error: err,
    });
  }
};

// [NASA TypeScript Safety] 使用 Zod 驗證取代 as 類型斷言
const resolveViewerRole = (
  rawRole: unknown,
  hasAuthenticatedUser: boolean,
): Role => {
  // [NASA TypeScript Safety] 使用類型守衛進行運行時驗證
  if (isValidRole(rawRole)) {
    return rawRole;
  }
  return hasAuthenticatedUser ? "member" : "guest";
};

// ============ Hook 選項 ============
export interface UseCommunityWallDataOptions {
  /** 是否包含私密貼文（需登入） */
  includePrivate?: boolean;
  /** 測試或客製化可覆寫初始 Mock 資料 */
  initialMockData?: UnifiedWallData;
  /** 是否持久化 Mock 狀態 */
  persistMockState?: boolean;
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
  createPost: (
    content: string,
    visibility?: "public" | "private",
  ) => Promise<void>;
  /** 發問 */
  askQuestion: (question: string) => Promise<void>;
  /** 回答 */
  answerQuestion: (questionId: string, content: string) => Promise<void>;
  /** 後端判定的使用者身份（訪客/會員/住戶/房仲） */
  viewerRole: Role;
  /** 是否登入 */
  isAuthenticated: boolean;
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
 * @returns 統一資料、操作方法與錯誤/載入狀態
 */
export function useCommunityWallData(
  communityId: string | undefined,
  options: UseCommunityWallDataOptions = {},
): UseCommunityWallDataReturn {
  const {
    includePrivate = false,
    initialMockData = MOCK_DATA,
    persistMockState = true,
  } = options;
  const [useMock, setUseMockState] = useState<boolean>(() =>
    mhEnv.isMockEnabled(),
  );

  useEffect(() => {
    const unsubscribe = mhEnv.subscribe(setUseMockState);
    return unsubscribe;
  }, []);

  // K: 取得當前登入使用者 ID（供樂觀更新使用）
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(
    undefined,
  );
  useEffect(() => {
    let mounted = true;
    const fetchUserId = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (mounted && user?.id) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        // 未登入或取得失敗，維持 undefined
        if (import.meta.env.DEV) {
          logger.warn("[useCommunityWallData] 無法取得使用者 ID", {
            error: err,
          });
        }
      }
    };
    fetchUserId();

    // 監聽登入狀態變化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
    persistMockState
      ? loadPersistedMockState(initialMockData)
      : initialMockData,
  );
  // likedPosts 只在 Mock 模式有效，切換模式時不需要清除
  // 因為 API 模式使用 apiData 中的 liked_by 資訊
  const [likedPosts, setLikedPosts] = useState<Set<string | number>>(
    () => new Set(),
  );
  const hasAuthenticatedUser = Boolean(currentUserId);

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

  // 統一資料來源（純計算，無副作用）
  // React Query 已提供 stale-while-revalidate，不需要額外快取
  const data = useMemo<UnifiedWallData>(() => {
    if (useMock) {
      // Mock 模式：套用置頂排序
      return {
        ...mockData,
        posts: {
          ...mockData.posts,
          public: sortPostsWithPinned(mockData.posts.public),
          private: sortPostsWithPinned(mockData.posts.private),
        },
      };
    }

    // API 模式：有資料時轉換，否則顯示載入佔位
    if (apiData) {
      const converted = convertApiData(apiData);
      const safeCommunityInfo = converted.communityInfo?.name
        ? converted.communityInfo
        : { ...EMPTY_WALL_DATA.communityInfo, name: "尚無社區資料" };
      return { ...converted, communityInfo: safeCommunityInfo };
    }

    return EMPTY_WALL_DATA;
  }, [useMock, mockData, apiData]);

  // 封裝操作函數
  const refresh = useCallback(async () => {
    if (useMock) {
      setMockData((prev) => ({ ...prev }));
      return;
    }
    await apiRefresh();
  }, [useMock, apiRefresh]);

  const viewerRole = useMemo<Role>(() => {
    if (useMock) {
      return hasAuthenticatedUser ? "member" : "guest";
    }
    return resolveViewerRole(apiData?.viewerRole, hasAuthenticatedUser);
  }, [useMock, apiData?.viewerRole, hasAuthenticatedUser]);
  const isAuthenticated = viewerRole !== "guest";

  // Mock 模式下用於按讚的使用者 ID（若未登入，使用 localStorage 產生假 ID）
  const getMockUserId = useCallback((): string => {
    if (currentUserId) return currentUserId;
    // 未登入時，從 localStorage 取得或建立假 ID
    const storageKey = "mock_user_id";
    let mockId = safeLocalStorage.getItem(storageKey);
    if (!mockId) {
      mockId = `mock-user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      safeLocalStorage.setItem(storageKey, mockId);
    }
    return mockId;
  }, [currentUserId]);

  const toggleLike = useCallback(
    async (postId: string | number) => {
      if (useMock) {
        await delay(MOCK_LATENCY_MS);
        const mockUserId = getMockUserId();
        // Mock 模式：實際更新本地狀態（包含 likes 和 liked_by）
        const isLiked = likedPosts.has(postId);
        setMockData((prev) => {
          const updatePosts = (posts: Post[]): Post[] =>
            posts.map((post) => {
              if (post.id !== postId) return post;
              const currentLikes = post.likes ?? 0;
              const currentLikedBy = post.liked_by ?? [];
              return {
                ...post,
                likes: isLiked
                  ? Math.max(0, currentLikes - 1)
                  : currentLikes + 1,
                liked_by: isLiked
                  ? currentLikedBy.filter((id) => id !== mockUserId)
                  : [...currentLikedBy, mockUserId],
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
      await apiToggleLike(String(postId));
    },
    [useMock, apiToggleLike, likedPosts, getMockUserId],
  );

  const createPost = useCallback(
    async (content: string, visibility: "public" | "private" = "public") => {
      if (useMock) {
        // Mock 模式：新增貼文到本地狀態
        const newPost = createMockPost(content, visibility);

        setMockData((prev) => {
          const target = visibility === "private" ? "private" : "public";
          const targetTotal =
            visibility === "private" ? "privateTotal" : "publicTotal";
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
    },
    [useMock, apiCreatePost],
  );

  const askQuestion = useCallback(
    async (question: string) => {
      if (useMock) {
        // Mock 模式：新增問題到本地狀態
        const newQuestion = createMockQuestion(question);

        setMockData((prev) => ({
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
    },
    [useMock, apiAskQuestion],
  );

  const answerQuestion = useCallback(
    async (questionId: string, content: string) => {
      if (useMock) {
        // Mock 模式：新增回答到本地狀態
        setMockData((prev) => ({
          ...prev,
          questions: {
            ...prev.questions,
            items: prev.questions.items.map((q) => {
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
    },
    [useMock, apiAnswerQuestion],
  );

  const setUseMock = useCallback((value: boolean) => {
    const next = mhEnv.setMock(value);
    setUseMockState(next);
    // 切換模式時重設 likedPosts 追蹤，避免按讚狀態在模式間錯亂
    setLikedPosts(new Set());
  }, []);

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
    viewerRole,
    isAuthenticated,
  };
}

export default useCommunityWallData;
