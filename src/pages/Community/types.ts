/**
 * Community Wall Types
 *
 * 社區牆共用型別定義
 * (Re-export from domain types)
 */

import {
  Role,
  WallTab,
  Post,
  Review,
  Question,
  CommunityInfo,
  UnifiedWallData,
} from '../../types/community';

export type { Role, WallTab, Post, Review, Question, CommunityInfo };
export type MockData = UnifiedWallData;

// ============ Permission Types ============
export interface Permissions {
  isGuest: boolean;
  isMember: boolean;
  isResident: boolean;
  isAgent: boolean;
  isLoggedIn: boolean;
  canSeeAllReviews: boolean;
  canSeeAllPosts: boolean;
  canAccessPrivate: boolean;
  canPostPublic: boolean;
  canPostPrivate: boolean;
  canAskQuestion: boolean;
  canAnswer: boolean;
  showExpertBadge: boolean;
}

// ============ Permission Helper ============
export function getPermissions(role: Role): Permissions {
  const isGuest = role === 'guest';
  const isMember = role === 'member';
  const isResident = role === 'resident';
  const isAgent = role === 'agent';

  return {
    isGuest,
    isMember,
    isResident,
    isAgent,
    isLoggedIn: !isGuest,
    canSeeAllReviews: !isGuest,
    canSeeAllPosts: !isGuest,
    canAccessPrivate: isResident || isAgent,
    canPostPublic: isResident || isAgent,
    canPostPrivate: isResident,
    canAskQuestion: !isGuest,
    canAnswer: isResident || isAgent,
    showExpertBadge: isAgent,
  };
}

// ============ Constants ============
/** 訪客（未登入）可見的項目數，以「完整物件」為單位（review/post/question） */
export const GUEST_VISIBLE_COUNT = 2;

/** 側邊欄顯示的問答數量 */
export const SIDEBAR_QUESTIONS_COUNT = 3;

/** 側邊欄顯示的熱門貼文數量 */
export const SIDEBAR_HOT_POSTS_COUNT = 2;
