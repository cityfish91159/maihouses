/**
 * Community Wall Service
 * 
 * 社區牆 API 封裝 - 統一處理所有社區牆相關請求
 * 包含快取策略與錯誤處理
 */

import { supabase } from '../lib/supabase';
import { communityApiBase } from '../config/env';
import type { Role } from '../types/community';

// API 基礎路徑
const API_BASE = communityApiBase;

// 註：快取已移除，改由 React Query 統一管理

// Types
export interface CommunityPost {
  id: string;
  community_id: string;
  author_id: string;
  content: string;
  visibility: 'public' | 'private';
  likes_count: number;
  liked_by: string[];
  created_at: string;
  comments_count?: number;  // 新增：留言數
  is_pinned?: boolean;      // 新增：是否置頂
  author?: {
    name: string;
    avatar_url?: string;
    role?: 'resident' | 'agent' | 'member' | 'official';
    floor?: string;         // 新增：樓層資訊
  };
}

export interface CommunityReview {
  id: string;
  community_id: string;
  author_id: string;
  content: {
    pros: string[];
    cons: string;
    property_title?: string;
  };
  created_at: string;
  agent?: {                   // 新增：房仲資訊
    name: string;
    company?: string;
    stats?: {
      visits: number;         // 帶看次數
      deals: number;          // 成交數
    };
  };
}

export interface CommunityQuestion {
  id: string;
  community_id: string;
  author_id: string;
  question: string;
  answers: {
    id: string;
    author_id: string;
    content: string;
    is_expert: boolean;
    created_at: string;
    author?: {                // 新增：回答者資訊
      name: string;
      role?: 'resident' | 'agent' | 'official';
    };
  }[];
  created_at: string;
  /** API 回傳：是否還有更多回答（非會員限流時） */
  hasMoreAnswers?: boolean;
  /** API 回傳：回答總數 */
  totalAnswers?: number;
  /** 資料庫欄位：回答數（冗餘，用於顯示） */
  answers_count?: number;
}

export interface CommunityWallData {
  communityInfo?: {           // 新增：社區資訊
    name: string;
    year: number;
    units: number;
    managementFee: number;
    builder: string;
    members?: number;
    avgRating?: number;
    monthlyInteractions?: number;
    forSale?: number;
  };
  posts: {
    public: CommunityPost[];
    private: CommunityPost[];
    publicTotal: number;
    privateTotal: number;
  };
  reviews: {
    items: CommunityReview[];
    total: number;
  };
  questions: {
    items: CommunityQuestion[];
    total: number;
  };
  isAuthenticated?: boolean;
  viewerRole?: Role;
}

// 取得 auth token
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

// 通用 fetch 包裝
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '請求失敗' }));
    // 處理各種錯誤格式
    let errorMessage = '請求失敗';
    if (typeof errorData.error === 'string') {
      errorMessage = errorData.error;
    } else if (errorData.error?.message) {
      errorMessage = errorData.error.message;
    } else if (errorData.message) {
      errorMessage = errorData.message;
    } else if (Array.isArray(errorData.error)) {
      // Zod 錯誤是 array
      errorMessage = errorData.error.map((e: any) => e.message || e).join(', ');
    }
    
    const error = new Error(errorMessage || `HTTP ${response.status}`);
    (error as any).status = response.status;
    (error as any).code = errorData.code;
    throw error;
  }

  return response.json();
}

/**
 * 取得社區牆完整資料
 * 註：快取由 React Query 管理，此處直接 fetch
 */
export async function getCommunityWall(
  communityId: string,
  options: { 
    includePrivate?: boolean;
  } = {}
): Promise<CommunityWallData> {
  const { includePrivate = false } = options;
  const includePrivateParam = includePrivate ? '1' : '0';
  return fetchAPI<CommunityWallData>(
    `/wall?communityId=${communityId}&type=all&includePrivate=${includePrivateParam}`
  );
}

/**
 * 取得公開貼文
 */
export async function getPublicPosts(
  communityId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ items: CommunityPost[]; total: number }> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  return fetchAPI(`/wall?communityId=${communityId}&type=posts&visibility=public&offset=${offset}&limit=${limit}`);
}

/**
 * 取得私密貼文（需登入）
 */
export async function getPrivatePosts(
  communityId: string,
  options: { page?: number; limit?: number } = {}
): Promise<{ items: CommunityPost[]; total: number }> {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;
  
  return fetchAPI(`/wall?communityId=${communityId}&type=posts&visibility=private&offset=${offset}&limit=${limit}`);
}

/**
 * 取得評價（來自 properties 的兩好一公道）
 * 註：快取由 React Query 管理
 */
export async function getReviews(
  communityId: string
): Promise<{ items: CommunityReview[]; total: number }> {
  return fetchAPI<{ items: CommunityReview[]; total: number }>(
    `/wall?communityId=${communityId}&type=reviews`
  );
}

/**
 * 取得問答
 */
export async function getQuestions(
  communityId: string
): Promise<{ items: CommunityQuestion[]; total: number }> {
  return fetchAPI<{ items: CommunityQuestion[]; total: number }>(
    `/wall?communityId=${communityId}&type=questions`
  );
}

/**
 * 發布貼文
 * 註：快取由 React Query invalidateQueries 處理
 */
export async function createPost(
  communityId: string,
  content: string,
  visibility: 'public' | 'private' = 'public'
): Promise<CommunityPost> {
  return fetchAPI('/post', {
    method: 'POST',
    body: JSON.stringify({ communityId, content, visibility }),
  });
}

/**
 * 按讚/取消按讚
 */
export async function toggleLike(
  postId: string
): Promise<{ liked: boolean; likes_count: number }> {
  return fetchAPI('/like', {
    method: 'POST',
    body: JSON.stringify({ postId }),
  });
}

/**
 * 提問
 * 註：快取由 React Query invalidateQueries 處理
 */
export async function askQuestion(
  communityId: string,
  question: string
): Promise<CommunityQuestion> {
  return fetchAPI('/question', {
    method: 'POST',
    body: JSON.stringify({ communityId, question }),
  });
}

/**
 * 回答問題
 * 注意：API 使用 POST + action=answer，而非 PUT
 */
export async function answerQuestion(
  questionId: string,
  content: string
): Promise<{ id: string; content: string }> {
  return fetchAPI('/question', {
    method: 'POST',
    body: JSON.stringify({ action: 'answer', questionId, content }),
  });
}

/**
 * 清除快取（已棄用，保留函數簽名以相容現有代碼）
 * 實際快取由 React Query 管理，使用 invalidateQueries
 */
export function clearCommunityCache(_communityId?: string): void {
  // 空實作 - 快取已改由 React Query 管理
}

export default {
  getCommunityWall,
  getPublicPosts,
  getPrivatePosts,
  getReviews,
  getQuestions,
  createPost,
  toggleLike,
  askQuestion,
  answerQuestion,
  clearCommunityCache,
};
