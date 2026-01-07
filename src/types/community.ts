/**
 * Community Domain Types
 *
 * 社區牆領域模型定義 (Single Source of Truth)
 * 整合 UI 與 API 共用的型別
 */

// P7-Audit-C9: Admin role enabled
export type Role =
  | "guest"
  | "member"
  | "resident"
  | "agent"
  | "official"
  | "admin";
export type WallTab = "public" | "private";

export interface Post {
  id: number | string;
  author: string;
  floor?: string;
  type: "resident" | "member" | "agent" | "official";
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
    type: "resident" | "member" | "agent" | "official";
    content: string;
    expert?: boolean;
  }[];
  /** 非會員限流時，是否還有更多回答未顯示 */
  hasMoreAnswers?: boolean;
  /** 回答總數（包含未顯示的） */
  totalAnswers?: number;
}

export interface CommunityInfo {
  name: string;
  year: number | null; // null = 尚未知道，前端顯示「未知」
  units: number | null; // null = 尚未知道，前端顯示「-」
  managementFee: number | null; // null = 尚未知道，前端顯示「-」
  builder: string | null; // null = 尚未知道，前端顯示「未知建商」
  members?: number | null;
  avgRating?: number | null;
  monthlyInteractions?: number | null;
  forSale?: number | null;
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
