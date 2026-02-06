/**
 * Services Barrel Export
 *
 * 統一匯出所有服務層的型別與函數
 * 外部模組應從此入口引入，避免直接 import 來源檔案
 */

// ========== Community Wall ==========
export type {
  CommunityPost,
  CommunityReview,
  CommunityQuestion,
  CommunityWallData,
} from './communityService';

export {
  getCommunityWall,
  getPublicPosts,
  getPrivatePosts,
  getReviews,
  getQuestions,
  toggleLike,
  createPost,
  askQuestion,
  answerQuestion,
  clearCommunityCache,
} from './communityService';

// ========== Lead Service ==========
export type {
  LeadStatus,
  LeadEventType,
  Lead,
  LeadEvent,
  CreateLeadParams,
  CreateLeadResponse,
} from './leadService';

export {
  createLead,
  getLeadsForAgent,
  getLeadsForProperty,
  updateLeadStatus,
  recordFirstResponse,
  addLeadEvent,
} from './leadService';

// 未來可擴充其他服務
// export * from './auth';
// export * from './propertyService';
