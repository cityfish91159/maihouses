/**
 * Community Wall Types
 * 
 * 社區牆共用型別定義
 */

// ============ Role Types ============
export type Role = 'guest' | 'member' | 'resident' | 'agent';
export type WallTab = 'public' | 'private';

// ============ Data Types ============
export interface Post {
  id: number | string;
  author: string;
  floor?: string;
  type: 'resident' | 'agent' | 'official';
  time: string;
  title: string;
  content: string;
  likes?: number;
  views?: number;
  comments: number;
  pinned?: boolean;
  private?: boolean;
}

export interface Review {
  id: number | string;
  author: string;
  company: string;
  visits: number;
  deals: number;
  pros: string[];
  cons: string | string[];  // 支援 string 或 array
}

export interface Question {
  id: number | string;
  question: string;
  time: string;
  answersCount: number;
  answers: {
    author: string;
    type: 'resident' | 'agent' | 'official';
    content: string;
    expert?: boolean;
  }[];
}

export interface CommunityInfo {
  name: string;
  year: number;
  units: number;
  managementFee: number;
  builder: string;
  members: number;
  avgRating: number;
  monthlyInteractions: number;
  forSale: number;
}

export interface MockData {
  communityInfo: CommunityInfo;
  posts: {
    public: Post[];
    private: Post[];
  };
  reviews: Review[];
  questions: Question[];
}

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
