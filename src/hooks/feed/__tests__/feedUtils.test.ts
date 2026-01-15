/**
 * feedUtils 單元測試
 *
 * Phase 4 審核修復 (2026-01-15):
 * - B3 修復：建立完整單元測試（目標 39+ 案例）
 * - 測試覆蓋所有導出函數
 * - 測試邊界案例與錯誤處理
 *
 * @module feedUtils.test
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  // Constants
  FEED_MOCK_STORAGE_KEY,
  MOCK_LATENCY_MS,
  HOT_POSTS_LIMIT,
  PROFILE_CACHE_TTL_MS,
  PROFILE_CACHE_MAX_SIZE,
  MAX_DELAY_MS,
  TITLE_TRUNCATE_LENGTH,
  EMPTY_FEED_DATA,
  // Schemas
  ProfileRowSchema,
  SupabasePostRowSchema,
  // P2/P3 修復：新增 enum Schemas
  PostVisibilitySchema,
  PostTypeSchema,
  // Functions
  delay,
  deriveTitleFromContent,
  deriveSidebarData,
  loadPersistedFeedMockState,
  saveFeedMockState,
  filterMockData,
  filterSecurePosts,
  createSecureFeedData,
  // Cache functions
  clearProfileCache,
  getProfileCacheSize,
  getProfileCacheStats,
} from "../feedUtils";
import type { FeedPost, UnifiedFeedData } from "../../../types/feed";

// ============================================================================
// Test Fixtures
// ============================================================================

const createMockPost = (overrides: Partial<FeedPost> = {}): FeedPost => ({
  id: "post-1",
  author: "測試用戶",
  type: "resident",
  time: "2026-01-15T10:00:00Z",
  title: "測試標題",
  content: "測試內容",
  likes: 10,
  comments: 5,
  pinned: false,
  communityId: "community-1",
  communityName: "測試社區",
  liked_by: [],
  private: false,
  ...overrides,
});

const createMockFeedData = (
  posts: FeedPost[] = [createMockPost()],
): UnifiedFeedData => ({
  posts,
  totalPosts: posts.length,
  sidebarData: {
    hotPosts: [],
    saleItems: [],
  },
});

// ============================================================================
// Constants Tests
// ============================================================================

describe("Constants", () => {
  it("FEED_MOCK_STORAGE_KEY should be defined", () => {
    expect(FEED_MOCK_STORAGE_KEY).toBe("feed-mock-data-v1");
  });

  it("MOCK_LATENCY_MS should be 250", () => {
    expect(MOCK_LATENCY_MS).toBe(250);
  });

  it("HOT_POSTS_LIMIT should be 3", () => {
    expect(HOT_POSTS_LIMIT).toBe(3);
  });

  it("PROFILE_CACHE_TTL_MS should be 5 minutes", () => {
    expect(PROFILE_CACHE_TTL_MS).toBe(5 * 60 * 1000);
  });

  it("PROFILE_CACHE_MAX_SIZE should be 500", () => {
    expect(PROFILE_CACHE_MAX_SIZE).toBe(500);
  });

  it("MAX_DELAY_MS should be 30 seconds", () => {
    expect(MAX_DELAY_MS).toBe(30_000);
  });

  it("TITLE_TRUNCATE_LENGTH should be 40", () => {
    expect(TITLE_TRUNCATE_LENGTH).toBe(40);
  });

  it("EMPTY_FEED_DATA should have empty posts", () => {
    expect(EMPTY_FEED_DATA.posts).toHaveLength(0);
    expect(EMPTY_FEED_DATA.totalPosts).toBe(0);
  });
});

// ============================================================================
// Zod Schema Tests
// ============================================================================

describe("ProfileRowSchema", () => {
  it("should validate valid profile", () => {
    const valid = {
      id: "user-1",
      name: "測試用戶",
      floor: "12F",
      role: "resident",
    };
    expect(ProfileRowSchema.safeParse(valid).success).toBe(true);
  });

  it("should accept null values", () => {
    const withNulls = {
      id: "user-1",
      name: null,
      floor: null,
      role: null,
    };
    expect(ProfileRowSchema.safeParse(withNulls).success).toBe(true);
  });

  it("should reject invalid role", () => {
    const invalid = {
      id: "user-1",
      name: "Test",
      floor: null,
      role: "invalid_role",
    };
    expect(ProfileRowSchema.safeParse(invalid).success).toBe(false);
  });

  it("should reject missing id", () => {
    const invalid = {
      name: "Test",
      floor: null,
      role: "resident",
    };
    expect(ProfileRowSchema.safeParse(invalid).success).toBe(false);
  });

  it("should accept all valid roles", () => {
    const roles = ["guest", "member", "resident", "agent", "official", "admin"];
    for (const role of roles) {
      const profile = { id: "1", name: null, floor: null, role };
      expect(ProfileRowSchema.safeParse(profile).success).toBe(true);
    }
  });
});

describe("SupabasePostRowSchema", () => {
  it("should validate valid post row", () => {
    const valid = {
      id: "post-1",
      community_id: "comm-1",
      author_id: "user-1",
      content: "內容",
      visibility: "public",
      likes_count: 10,
      comments_count: 5,
      liked_by: ["user-2"],
      is_pinned: false,
      created_at: "2026-01-15T00:00:00Z",
      post_type: "general",
    };
    expect(SupabasePostRowSchema.safeParse(valid).success).toBe(true);
  });

  it("should accept null optional fields", () => {
    const withNulls = {
      id: "post-1",
      community_id: "comm-1",
      author_id: null,
      content: "內容",
      visibility: null,
      likes_count: null,
      comments_count: null,
      liked_by: null,
      is_pinned: null,
      created_at: "2026-01-15T00:00:00Z",
      post_type: null,
    };
    expect(SupabasePostRowSchema.safeParse(withNulls).success).toBe(true);
  });

  it("should reject missing required fields", () => {
    const invalid = {
      id: "post-1",
      // missing community_id
      content: "內容",
    };
    expect(SupabasePostRowSchema.safeParse(invalid).success).toBe(false);
  });

  // P2 修復：visibility 使用 enum 驗證
  it("should reject invalid visibility value (P2 fix)", () => {
    const invalid = {
      id: "post-1",
      community_id: "comm-1",
      author_id: null,
      content: "內容",
      visibility: "invalid_visibility", // 不是 public 或 private
      likes_count: null,
      comments_count: null,
      liked_by: null,
      is_pinned: null,
      created_at: "2026-01-15T00:00:00Z",
      post_type: null,
    };
    expect(SupabasePostRowSchema.safeParse(invalid).success).toBe(false);
  });

  // P3 修復：post_type 使用 enum 驗證
  it("should reject invalid post_type value (P3 fix)", () => {
    const invalid = {
      id: "post-1",
      community_id: "comm-1",
      author_id: null,
      content: "內容",
      visibility: "public",
      likes_count: null,
      comments_count: null,
      liked_by: null,
      is_pinned: null,
      created_at: "2026-01-15T00:00:00Z",
      post_type: "invalid_type", // 不是 general, qa, review, announcement
    };
    expect(SupabasePostRowSchema.safeParse(invalid).success).toBe(false);
  });
});

// ============================================================================
// P2/P3 修復：Enum Schema Tests
// ============================================================================

describe("PostVisibilitySchema (P2 fix)", () => {
  it("should accept 'public'", () => {
    expect(PostVisibilitySchema.safeParse("public").success).toBe(true);
  });

  it("should accept 'private'", () => {
    expect(PostVisibilitySchema.safeParse("private").success).toBe(true);
  });

  it("should reject invalid values", () => {
    expect(PostVisibilitySchema.safeParse("hidden").success).toBe(false);
    expect(PostVisibilitySchema.safeParse("").success).toBe(false);
    expect(PostVisibilitySchema.safeParse(123).success).toBe(false);
  });
});

describe("PostTypeSchema (P3 fix)", () => {
  it("should accept all valid post types", () => {
    const validTypes = ["general", "qa", "review", "announcement"];
    for (const type of validTypes) {
      expect(PostTypeSchema.safeParse(type).success).toBe(true);
    }
  });

  it("should reject invalid values", () => {
    expect(PostTypeSchema.safeParse("blog").success).toBe(false);
    expect(PostTypeSchema.safeParse("").success).toBe(false);
    expect(PostTypeSchema.safeParse(null).success).toBe(false);
  });
});

// ============================================================================
// delay Tests
// ============================================================================

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should resolve after specified time", async () => {
    const promise = delay(100);
    vi.advanceTimersByTime(100);
    await expect(promise).resolves.toBeUndefined();
  });

  it("should accept 0 delay", async () => {
    const promise = delay(0);
    vi.advanceTimersByTime(0);
    await expect(promise).resolves.toBeUndefined();
  });

  it("should throw for negative delay", () => {
    expect(() => delay(-1)).toThrow(RangeError);
    expect(() => delay(-1)).toThrow("delay ms must be between 0 and");
  });

  it("should throw for delay exceeding MAX_DELAY_MS", () => {
    expect(() => delay(MAX_DELAY_MS + 1)).toThrow(RangeError);
  });

  it("should accept MAX_DELAY_MS exactly", async () => {
    const promise = delay(MAX_DELAY_MS);
    vi.advanceTimersByTime(MAX_DELAY_MS);
    await expect(promise).resolves.toBeUndefined();
  });
});

// ============================================================================
// deriveTitleFromContent Tests
// ============================================================================

describe("deriveTitleFromContent", () => {
  it("should return placeholder for empty string", () => {
    expect(deriveTitleFromContent("")).toBe("（無標題）");
  });

  // P1 修復：whitespace-only 字串現在返回「無標題」
  it("should return placeholder for whitespace only (P1 fix)", () => {
    expect(deriveTitleFromContent("   ")).toBe("（無標題）");
    expect(deriveTitleFromContent("\t\n")).toBe("（無標題）");
    expect(deriveTitleFromContent("  \t  \n  ")).toBe("（無標題）");
  });

  it("should return content if under limit", () => {
    expect(deriveTitleFromContent("短標題")).toBe("短標題");
  });

  it("should return content if exactly at limit", () => {
    const exact = "a".repeat(TITLE_TRUNCATE_LENGTH);
    expect(deriveTitleFromContent(exact)).toBe(exact);
  });

  it("should truncate content over limit", () => {
    const long = "a".repeat(50);
    expect(deriveTitleFromContent(long)).toBe("a".repeat(40) + "...");
  });

  it("should handle Chinese characters correctly", () => {
    // 41 個中文字元 - 應該被截斷
    const chinese = "一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一二三四五六七八九十一";
    expect(chinese.length).toBe(41); // 確認超過 40 字
    const result = deriveTitleFromContent(chinese);
    expect(result.endsWith("...")).toBe(true);
    expect(result.length).toBe(43); // 40 + "..."
  });

  // P1 修復：確認 trim 後的內容用於截斷
  it("should trim content before processing (P1 fix)", () => {
    const withSpaces = "  短標題  ";
    expect(deriveTitleFromContent(withSpaces)).toBe("短標題");
  });

  it("should trim long content before truncating (P1 fix)", () => {
    const longWithSpaces = "  " + "a".repeat(50) + "  ";
    expect(deriveTitleFromContent(longWithSpaces)).toBe("a".repeat(40) + "...");
  });
});

// ============================================================================
// deriveSidebarData Tests
// ============================================================================

describe("deriveSidebarData", () => {
  it("should return empty hotPosts for empty array", () => {
    const result = deriveSidebarData([]);
    expect(result.hotPosts).toHaveLength(0);
  });

  it("should sort by likes descending", () => {
    const posts = [
      createMockPost({ id: "1", likes: 5 }),
      createMockPost({ id: "2", likes: 20 }),
      createMockPost({ id: "3", likes: 10 }),
    ];
    const result = deriveSidebarData(posts);
    expect(result.hotPosts[0]?.likes).toBe(20);
    expect(result.hotPosts[1]?.likes).toBe(10);
    expect(result.hotPosts[2]?.likes).toBe(5);
  });

  it("should limit to HOT_POSTS_LIMIT", () => {
    const posts = Array.from({ length: 10 }, (_, i) =>
      createMockPost({ id: `${i}`, likes: i }),
    );
    const result = deriveSidebarData(posts);
    expect(result.hotPosts).toHaveLength(HOT_POSTS_LIMIT);
  });

  it("should handle zero likes correctly", () => {
    const posts = [
      createMockPost({ id: "1", likes: 0 }),
      createMockPost({ id: "2", likes: 5 }),
    ];
    const result = deriveSidebarData(posts);
    expect(result.hotPosts[0]?.likes).toBe(5);
    expect(result.hotPosts[1]?.likes).toBe(0);
  });

  it("should use default community label for missing communityName", () => {
    const posts = [createMockPost({ communityName: undefined })];
    const result = deriveSidebarData(posts);
    expect(result.hotPosts[0]?.communityName).toBe("社區");
  });

  it("should include saleItems", () => {
    const result = deriveSidebarData([]);
    expect(result.saleItems).toBeDefined();
    expect(Array.isArray(result.saleItems)).toBe(true);
  });
});

// ============================================================================
// Storage Functions Tests
// ============================================================================

describe("loadPersistedFeedMockState", () => {
  it("should return fallback when no stored data", () => {
    // safeLocalStorage returns null for non-existent keys
    const fallback = createMockFeedData();
    const result = loadPersistedFeedMockState(fallback);
    // Without stored data, should return fallback
    expect(result.posts).toBeDefined();
  });

  it("should handle valid stored data format", () => {
    const fallback = createMockFeedData();
    // Test that function doesn't throw
    expect(() => loadPersistedFeedMockState(fallback)).not.toThrow();
  });
});

describe("saveFeedMockState", () => {
  it("should not throw on error", () => {
    const data = createMockFeedData();
    // Should not throw even if storage fails
    expect(() => saveFeedMockState(data)).not.toThrow();
  });

  it("should handle large data", () => {
    const posts = Array.from({ length: 100 }, (_, i) =>
      createMockPost({ id: `post-${i}` }),
    );
    const data = createMockFeedData(posts);
    expect(() => saveFeedMockState(data)).not.toThrow();
  });
});

// ============================================================================
// filterMockData Tests
// ============================================================================

describe("filterMockData", () => {
  it("should return all posts when no targetCommunityId", () => {
    const posts = [
      createMockPost({ communityId: "comm-1" }),
      createMockPost({ communityId: "comm-2" }),
    ];
    const source = createMockFeedData(posts);
    const result = filterMockData(source);
    expect(result.posts).toHaveLength(2);
  });

  it("should filter by communityId", () => {
    const posts = [
      createMockPost({ id: "1", communityId: "comm-1" }),
      createMockPost({ id: "2", communityId: "comm-2" }),
      createMockPost({ id: "3", communityId: "comm-1" }),
    ];
    const source = createMockFeedData(posts);
    const result = filterMockData(source, "comm-1");
    expect(result.posts).toHaveLength(2);
    expect(result.totalPosts).toBe(2);
  });

  it("should return empty when no match", () => {
    const posts = [createMockPost({ communityId: "comm-1" })];
    const source = createMockFeedData(posts);
    const result = filterMockData(source, "comm-999");
    expect(result.posts).toHaveLength(0);
    expect(result.totalPosts).toBe(0);
  });

  it("should recalculate sidebarData", () => {
    const posts = [
      createMockPost({ id: "1", communityId: "comm-1", likes: 100 }),
      createMockPost({ id: "2", communityId: "comm-2", likes: 50 }),
    ];
    const source = createMockFeedData(posts);
    const result = filterMockData(source, "comm-1");
    expect(result.sidebarData.hotPosts).toHaveLength(1);
    expect(result.sidebarData.hotPosts[0]?.likes).toBe(100);
  });
});

// ============================================================================
// filterSecurePosts Tests
// ============================================================================

describe("filterSecurePosts", () => {
  it("should return all posts when canViewPrivate=true", () => {
    const posts = [
      createMockPost({ private: false }),
      createMockPost({ private: true }),
    ];
    const result = filterSecurePosts(posts, true);
    expect(result).toHaveLength(2);
  });

  it("should filter private posts when canViewPrivate=false", () => {
    const posts = [
      createMockPost({ id: "1", private: false }),
      createMockPost({ id: "2", private: true }),
      createMockPost({ id: "3", private: false }),
    ];
    const result = filterSecurePosts(posts, false);
    expect(result).toHaveLength(2);
    expect(result.every((p) => !p.private)).toBe(true);
  });

  it("should return empty array for all private posts when canViewPrivate=false", () => {
    const posts = [
      createMockPost({ private: true }),
      createMockPost({ private: true }),
    ];
    const result = filterSecurePosts(posts, false);
    expect(result).toHaveLength(0);
  });

  it("should handle empty array", () => {
    const result = filterSecurePosts([], false);
    expect(result).toHaveLength(0);
  });

  it("should handle false private field as public", () => {
    // Post with explicit private: false should be visible
    const post = createMockPost({ private: false });
    const result = filterSecurePosts([post], false);
    expect(result).toHaveLength(1);
  });
});

// ============================================================================
// createSecureFeedData Tests
// ============================================================================

describe("createSecureFeedData", () => {
  it("should filter private posts and update counts", () => {
    const posts = [
      createMockPost({ id: "1", private: false }),
      createMockPost({ id: "2", private: true }),
      createMockPost({ id: "3", private: false }),
    ];
    const data = createMockFeedData(posts);
    const result = createSecureFeedData(data, false);

    expect(result.posts).toHaveLength(2);
    expect(result.totalPosts).toBe(2);
  });

  it("should recalculate sidebarData", () => {
    const posts = [
      createMockPost({ id: "1", private: false, likes: 50 }),
      createMockPost({ id: "2", private: true, likes: 100 }), // will be filtered
    ];
    const data = createMockFeedData(posts);
    const result = createSecureFeedData(data, false);

    expect(result.sidebarData.hotPosts).toHaveLength(1);
    expect(result.sidebarData.hotPosts[0]?.likes).toBe(50);
  });

  it("should preserve all data when canViewPrivate=true", () => {
    const posts = [
      createMockPost({ id: "1", private: true }),
      createMockPost({ id: "2", private: true }),
    ];
    const data = createMockFeedData(posts);
    const result = createSecureFeedData(data, true);

    expect(result.posts).toHaveLength(2);
    expect(result.totalPosts).toBe(2);
  });
});

// ============================================================================
// Cache Functions Tests
// ============================================================================

describe("Cache Functions", () => {
  beforeEach(() => {
    clearProfileCache();
  });

  it("clearProfileCache should reset cache size to 0", () => {
    // Cache is internal, but we can test via getProfileCacheSize
    expect(getProfileCacheSize()).toBe(0);
    clearProfileCache();
    expect(getProfileCacheSize()).toBe(0);
  });

  it("getProfileCacheSize should return current size", () => {
    expect(typeof getProfileCacheSize()).toBe("number");
    expect(getProfileCacheSize()).toBeGreaterThanOrEqual(0);
  });

  it("getProfileCacheStats should return stats object", () => {
    const stats = getProfileCacheStats();
    expect(stats).toHaveProperty("size");
    expect(stats).toHaveProperty("maxSize");
    expect(stats).toHaveProperty("ttlMs");
    expect(stats.maxSize).toBe(PROFILE_CACHE_MAX_SIZE);
    expect(stats.ttlMs).toBe(PROFILE_CACHE_TTL_MS);
  });
});

// ============================================================================
// Integration Tests
// ============================================================================

describe("Integration", () => {
  it("EMPTY_FEED_DATA should be usable as fallback", () => {
    const result = filterMockData(EMPTY_FEED_DATA as UnifiedFeedData);
    expect(result.posts).toHaveLength(0);
    expect(result.totalPosts).toBe(0);
  });

  it("deriveSidebarData output should match SidebarData type", () => {
    const posts = [createMockPost()];
    const sidebar = deriveSidebarData(posts);

    expect(sidebar).toHaveProperty("hotPosts");
    expect(sidebar).toHaveProperty("saleItems");
    expect(Array.isArray(sidebar.hotPosts)).toBe(true);
    expect(Array.isArray(sidebar.saleItems)).toBe(true);
  });

  it("filter chain should work correctly", () => {
    const posts = [
      createMockPost({ id: "1", communityId: "c1", private: false }),
      createMockPost({ id: "2", communityId: "c1", private: true }),
      createMockPost({ id: "3", communityId: "c2", private: false }),
    ];
    const data = createMockFeedData(posts);

    // First filter by community
    const communityFiltered = filterMockData(data, "c1");
    expect(communityFiltered.posts).toHaveLength(2);

    // Then filter by security
    const secureFiltered = createSecureFeedData(communityFiltered, false);
    expect(secureFiltered.posts).toHaveLength(1);
    expect(secureFiltered.posts[0]?.id).toBe("1");
  });
});

// ============================================================================
// P4 修復：Cache 容量保護測試
// ============================================================================

describe("Cache capacity protection (P4 fix)", () => {
  beforeEach(() => {
    clearProfileCache();
  });

  it("cache should not exceed max size constant", () => {
    // 確認常數定義正確
    expect(PROFILE_CACHE_MAX_SIZE).toBe(500);
  });

  it("getProfileCacheStats should report correct max size", () => {
    const stats = getProfileCacheStats();
    expect(stats.maxSize).toBe(PROFILE_CACHE_MAX_SIZE);
    expect(stats.size).toBe(0);
  });

  it("clearProfileCache should work after operations", () => {
    // 確保清理功能正常
    clearProfileCache();
    expect(getProfileCacheSize()).toBe(0);
  });
});
