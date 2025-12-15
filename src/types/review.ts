/**
 * 共用評價 TypeScript 定義
 * 
 * 供 API 和前端共同使用，確保型別一致性
 * 
 * @author P9-1 修復 P4
 * @date 2025-12-15
 */

/**
 * API 回傳的評價資料格式
 * 給前端 UI 使用
 */
export interface ReviewForUI {
  /** 唯一識別碼 (UUID 或 seed-xxx) */
  id: string;
  
  /** 顯示用編號，從 name 提取首字 (如 "匿" 或 "林") */
  displayId: string;
  
  /** 評價者名稱 (如 "匿名住戶｜認證評價" 或 "林小姐｜平台精選") */
  name: string;
  
  /** 評分 1-5 星 */
  rating: number;
  
  /** 標籤陣列 (如 ["#物業/管理", "#採光/日照"]) */
  tags: string[];
  
  /** 評價內容 */
  content: string;
  
  /** 社區 ID (真實資料有，Mock 為 null) */
  communityId: string | null;
  
  /** 資料來源: 'real' = 真實資料, 'seed' = Mock 補位 */
  source: 'real' | 'seed';
  
  /** 區域標識 */
  region: string;
}

/**
 * API 回應格式
 */
export interface FeaturedReviewsResponse {
  success: boolean;
  data: ReviewForUI[];
  meta: {
    total: number;
    realCount: number;
    seedCount: number;
    timestamp: string;
    fallback?: boolean;
  };
}

/**
 * Supabase community_reviews 表的資料列
 */
export interface RealReviewRow {
  id: string;
  community_id: string;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  source: string | null;
  created_at: string;
}

/**
 * Server-side Mock 資料定義
 */
export interface ServerSeed {
  id: string;
  community_id: string;
  name: string;
  rating: number;
  tags: string[];
  content: string;
  source: 'seed';
}
