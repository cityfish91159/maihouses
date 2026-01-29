/**
 * Feed 工具模組入口
 *
 * 匯出 Feed 相關的純函數與常數
 * 注意：此模組不包含 React hooks，僅純函數
 *
 * Phase 4 審核修復 (2026-01-15):
 * - 新增 Cache 管理函數導出
 * - 新增 Zod Schema 導出
 * - 新增常數導出
 *
 * @module feed
 */

export {
  // Constants
  FEED_MOCK_STORAGE_KEY,
  MOCK_LATENCY_MS,
  HOT_POSTS_LIMIT,
  EMPTY_FEED_DATA,
  // Phase 4 審核修復：新增常數導出
  PROFILE_CACHE_TTL_MS,
  PROFILE_CACHE_MAX_SIZE,
  MAX_DELAY_MS,
  TITLE_TRUNCATE_LENGTH,
  // Zod Schemas (B1 修復)
  ProfileRowSchema,
  SupabasePostRowSchema,
  // P2/P3 修復：新增 enum Schemas
  PostVisibilitySchema,
  PostTypeSchema,
  // Types
  type SupabasePostRow,
  type ProfileRow,
  type BuildProfileMapResult,
  // P2/P3 修復：新增 enum Types
  type PostVisibility,
  type PostType,
  // Utility Functions
  delay,
  deriveTitleFromContent,
  deriveSidebarData,
  // Storage Functions
  loadPersistedFeedMockState,
  saveFeedMockState,
  // Profile Functions
  buildProfileMap,
  // Phase 4 審核修復：Cache 管理函數 (I3 修復)
  clearProfileCache,
  getProfileCacheSize,
  getProfileCacheStats,
  // Data Transformation
  mapSupabasePostsToFeed,
  // Filter Functions
  filterMockData,
  filterSecurePosts,
  createSecureFeedData,
} from './feedUtils';
