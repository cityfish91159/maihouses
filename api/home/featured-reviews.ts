/**
 * Vercel API: /api/home/featured-reviews
 * 
 * 首頁評價聚合 API - 混合動力架構 (Hybrid Reviews System)
 * 
 * 核心邏輯：
 * 1. 優先從 Supabase community_reviews 撈取真實資料
 * 2. 不足 6 筆時用 SERVER_SEEDS 補位
 * 3. 保證永遠回傳 6 筆資料（零天窗）
 * 
 * @author P9-1 Implementation
 * @date 2025-12-15
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 1. 常數定義
// ============================================

const REQUIRED_COUNT = 6;

// 延遲初始化 Supabase client
let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;
  
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  }
  
  supabase = createClient(url, key);
  return supabase;
}

// ============================================
// 2. SERVER_SEEDS - 官方精選示範資料
// ============================================

interface ServerSeed {
  id: string;
  community_id: string;
  name: string;
  rating: number;
  tags: string[];
  content: string;
  source: 'seed';
}

const SERVER_SEEDS: ServerSeed[] = [
  {
    id: 'seed-server-1',
    community_id: 'seed-c1',
    name: '林小姐｜平台精選',
    rating: 5,
    tags: ['#隱私保護', '#管家服務'],
    content: '透過平台不僅看到了真實的成交行情，還能看到鄰居對物業管理的真實評價。',
    source: 'seed'
  },
  {
    id: 'seed-server-2',
    community_id: 'seed-c2',
    name: '陳先生｜已購客',
    rating: 5,
    tags: ['#真實透明', '#省時省力'],
    content: '現在先看過社區牆的評價，避開了很多地雷社區，真的節省很多時間。',
    source: 'seed'
  },
  {
    id: 'seed-server-3',
    community_id: 'seed-c3',
    name: '王太太｜住戶',
    rating: 5,
    tags: ['#公設維護', '#友善社區'],
    content: '很高興能有一個地方分享我們社區的優點，這裡的泳池維護得真的很好。',
    source: 'seed'
  },
  {
    id: 'seed-server-4',
    community_id: 'seed-c4',
    name: '張經理｜投資客',
    rating: 5,
    tags: ['#精準數據', '#趨勢分析'],
    content: '這裡的歷史成交數據整合得很完整，搭配住戶的第一手消息，判斷更精準。',
    source: 'seed'
  },
  {
    id: 'seed-server-5',
    community_id: 'seed-c5',
    name: '李設計師｜裝修觀點',
    rating: 5,
    tags: ['#格局方正', '#採光極佳'],
    content: '看過這麼多案子，這裡的格局規劃真的很人性化，幾乎沒有虛坪浪費。',
    source: 'seed'
  },
  {
    id: 'seed-server-6',
    community_id: 'seed-c6',
    name: '邁房子團隊｜官方推薦',
    rating: 5,
    tags: ['#安心保證', '#專業服務'],
    content: '致力於打造全台最透明的房產社群，讓每一個好評與負評都能成為重要參考。',
    source: 'seed'
  }
];

// ============================================
// 3. 資料適配器 (Adapter Pattern)
// ============================================

interface ReviewForUI {
  id: string;
  displayId: string;
  name: string;
  rating: number;
  tags: string[];
  content: string;
  communityId: string | null;
  source: 'real' | 'seed';
  region: string;
}

interface RealReviewRow {
  id: string;
  community_id: string;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  source: string | null;
  created_at: string;
}

function adaptRealReviewForUI(review: RealReviewRow, index: number): ReviewForUI {
  // 從兩好一公道欄位提取內容
  const tags: string[] = [];
  let content = '詳細評價請點擊查看';
  
  if (review.advantage_1) {
    tags.push(`#${review.advantage_1}`);
  }
  if (review.advantage_2) {
    tags.push(`#${review.advantage_2}`);
  }
  
  // 組合內容
  const advantages = [review.advantage_1, review.advantage_2].filter(Boolean);
  if (advantages.length > 0) {
    content = `推薦優點：${advantages.join('、')}`;
    if (review.disadvantage) {
      content += `。需注意：${review.disadvantage}`;
    }
  }
  
  // 匿名化名稱
  const sourceLabel = review.source === 'agent' ? '房仲' : 
                      review.source === 'resident' ? '住戶' : '用戶';
  
  return {
    id: review.id,
    displayId: String(index + 1).padStart(2, '0'),
    name: `匿名${sourceLabel}｜認證評價`,
    rating: 5, // 預設 5 星（可未來擴充）
    tags: tags.length > 0 ? tags : ['#精選評價'],
    content,
    communityId: review.community_id,
    source: 'real',
    region: 'taiwan'
  };
}

function adaptSeedForUI(seed: ServerSeed, index: number): ReviewForUI {
  return {
    id: seed.id,
    displayId: String(index + 1).padStart(2, '0'),
    name: seed.name,
    rating: seed.rating,
    tags: seed.tags,
    content: seed.content,
    communityId: null, // Mock 沒有真實社區 ID
    source: 'seed',
    region: 'global'
  };
}

// ============================================
// 4. 主處理器
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS 與快取
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  // OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 GET
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const mixedReviews: ReviewForUI[] = [];

  try {
    // 1. 撈取真實資料
    const { data: realData, error } = await getSupabase()
      .from('community_reviews')
      .select('id, community_id, advantage_1, advantage_2, disadvantage, source, created_at')
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT);

    if (error) {
      console.error('[featured-reviews] Supabase error:', error);
      // 不中斷，繼續用 Mock 補位
    }

    // 2. 填充真實資料（去重 by community_id）
    const usedCommunityIds = new Set<string>();
    
    if (realData && realData.length > 0) {
      for (const row of realData) {
        // 去重：同一社區只取一筆
        if (usedCommunityIds.has(row.community_id)) {
          continue;
        }
        
        mixedReviews.push(adaptRealReviewForUI(row, mixedReviews.length));
        usedCommunityIds.add(row.community_id);
        
        // 達到目標數量就停止
        if (mixedReviews.length >= REQUIRED_COUNT) {
          break;
        }
      }
    }

    // 3. 自動補位邏輯（核心）
    const missingCount = REQUIRED_COUNT - mixedReviews.length;
    
    if (missingCount > 0) {
      const seeds = SERVER_SEEDS.slice(0, missingCount);
      for (const seed of seeds) {
        mixedReviews.push(adaptSeedForUI(seed, mixedReviews.length));
      }
    }

    // 4. 回傳結果
    return res.status(200).json({
      success: true,
      data: mixedReviews,
      meta: {
        total: mixedReviews.length,
        realCount: mixedReviews.filter(r => r.source === 'real').length,
        seedCount: mixedReviews.filter(r => r.source === 'seed').length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (err) {
    console.error('[featured-reviews] Unexpected error:', err);
    
    // Level 2 降級：API 異常時仍回傳 Mock 資料
    const fallbackReviews = SERVER_SEEDS.slice(0, REQUIRED_COUNT).map((seed, i) => 
      adaptSeedForUI(seed, i)
    );
    
    return res.status(200).json({
      success: true,
      data: fallbackReviews,
      meta: {
        total: fallbackReviews.length,
        realCount: 0,
        seedCount: fallbackReviews.length,
        timestamp: new Date().toISOString(),
        fallback: true
      }
    });
  }
}
