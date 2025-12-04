/**
 * Community Domain Types
 * 
 * 社區牆領域模型定義 (Single Source of Truth)
 * 整合 UI 與 API 共用的型別
 */

export type Role = 'guest' | 'member' | 'resident' | 'agent';
export type WallTab = 'public' | 'private';

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
  liked_by?: string[];
}

export interface Review {
  id: number | string;
  author: string;
  company: string;
  visits: number;
  deals: number;
  pros: string[];
  cons: string | string[];
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
  members?: number;
  avgRating?: number;
  monthlyInteractions?: number;
  forSale?: number;
}

export interface UnifiedWallData {
  communityInfo: CommunityInfo;
  posts: {
    public: Post[];
    private: Post[];
    publicTotal: number;
    privateTotal: number;
  };
  reviews: {
    items: Review[];
    total: number;
  };
  questions: {
    items: Question[];
    total: number;
  };
}
