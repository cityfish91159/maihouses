/**
 * Community Wall Service
 * 
 * 社區牆 API 封裝 - 統一處理所有社區牆相關請求
 * 包含快取策略與錯誤處理
 */

import { supabase } from '../lib/supabase';

// API 基礎路徑
const API_BASE = '/api/community';

// 快取時間（毫秒）
const CACHE_TTL = {
  posts: 5 * 60 * 1000,     // 5 分鐘
  reviews: 10 * 60 * 1000,  // 10 分鐘
  questions: 5 * 60 * 1000, // 5 分鐘
};

// 簡易記憶體快取
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCachedData<T>(key: string, ttl: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

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
  author?: {
    name: string;
    avatar_url?: string;
    role?: 'resident' | 'agent' | 'member';
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
  }[];
  created_at: string;
}

export interface CommunityWallData {
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
    const error = await response.json().catch(() => ({ error: '請求失敗' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * 取得社區牆完整資料
 */
export async function getCommunityWall(
  communityId: string,
  options: { 
    forceRefresh?: boolean;
    includePrivate?: boolean;
  } = {}
): Promise<CommunityWallData> {
  const cacheKey = `wall:${communityId}:${options.includePrivate}`;
  
  if (!options.forceRefresh) {
    const cached = getCachedData<CommunityWallData>(cacheKey, CACHE_TTL.posts);
    if (cached) return cached;
  }

  const data = await fetchAPI<CommunityWallData>(
    `/wall?communityId=${communityId}&type=all`
  );
  
  setCachedData(cacheKey, data);
  return data;
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
 */
export async function getReviews(
  communityId: string
): Promise<{ items: CommunityReview[]; total: number }> {
  const cacheKey = `reviews:${communityId}`;
  const cached = getCachedData<{ items: CommunityReview[]; total: number }>(cacheKey, CACHE_TTL.reviews);
  if (cached) return cached;

  const data = await fetchAPI<{ items: CommunityReview[]; total: number }>(
    `/wall?communityId=${communityId}&type=reviews`
  );
  
  setCachedData(cacheKey, data);
  return data;
}

/**
 * 取得問答
 */
export async function getQuestions(
  communityId: string
): Promise<{ items: CommunityQuestion[]; total: number }> {
  const cacheKey = `questions:${communityId}`;
  const cached = getCachedData<{ items: CommunityQuestion[]; total: number }>(cacheKey, CACHE_TTL.questions);
  if (cached) return cached;

  const data = await fetchAPI<{ items: CommunityQuestion[]; total: number }>(
    `/wall?communityId=${communityId}&type=questions`
  );
  
  setCachedData(cacheKey, data);
  return data;
}

/**
 * 發布貼文
 */
export async function createPost(
  communityId: string,
  content: string,
  visibility: 'public' | 'private' = 'public'
): Promise<CommunityPost> {
  // 清除快取
  cache.delete(`wall:${communityId}:false`);
  cache.delete(`wall:${communityId}:true`);

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
 */
export async function askQuestion(
  communityId: string,
  question: string
): Promise<CommunityQuestion> {
  // 清除快取
  cache.delete(`questions:${communityId}`);

  return fetchAPI('/question', {
    method: 'POST',
    body: JSON.stringify({ communityId, question }),
  });
}

/**
 * 回答問題
 */
export async function answerQuestion(
  questionId: string,
  content: string
): Promise<{ id: string; content: string }> {
  return fetchAPI('/question', {
    method: 'PUT',
    body: JSON.stringify({ questionId, content }),
  });
}

/**
 * 清除快取（例如發文後強制刷新）
 */
export function clearCommunityCache(communityId?: string): void {
  if (communityId) {
    // 清除特定社區的快取
    for (const key of cache.keys()) {
      if (key.includes(communityId)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有快取
    cache.clear();
  }
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
