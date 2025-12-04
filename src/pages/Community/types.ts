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
  UnifiedWallData 
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
export const GUEST_VISIBLE_COUNT = 2;
