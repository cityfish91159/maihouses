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
 * P9-1 修復清單：
 * - P1: displayId 改為從 name 提取首字 (相容 ReviewCard)
 * - P2: 移除編號衝突問題 (用首字取代數字)
 * - P3: rating 根據 disadvantage 決定 (有缺點=4星，無缺點=5星)
 * - P4: 使用共用 TypeScript interface
 * - P6: 加入錯誤上報機制
 *
 * @author P9-1 Implementation + Fix
 * @date 2025-12-15
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../lib/logger';

// ============================================
// Inlined Constants & Types (Fix Vercel Import Issue)
// ============================================

export interface ReviewForUI {
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

export interface RealReviewRow {
  id: string;
  community_id: string;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  source: string | null;
  created_at: string;
  community_name?: string | null;
}

export interface ServerSeed {
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
    source: 'seed',
  },
  {
    id: 'seed-server-2',
    community_id: 'seed-c2',
    name: '陳先生｜已購客',
    rating: 5,
    tags: ['#真實透明', '#省時省力'],
    content: '現在先看過社區牆的評價，避開了很多地雷社區，真的節省很多時間。',
    source: 'seed',
  },
  {
    id: 'seed-server-3',
    community_id: 'seed-c3',
    name: '王太太｜住戶',
    rating: 4,
    tags: ['#公設維護', '#友善社區'],
    content: '很高興能有一個地方分享我們社區的優點，這裡的泳池維護得真的很好。',
    source: 'seed',
  },
  {
    id: 'seed-server-4',
    community_id: 'seed-c4',
    name: '張經理｜投資客',
    rating: 5,
    tags: ['#精準數據', '#趨勢分析'],
    content: '這裡的歷史成交數據整合得很完整，搭配住戶的第一手消息，判斷更精準。',
    source: 'seed',
  },
  {
    id: 'seed-server-5',
    community_id: 'seed-c5',
    name: '李設計師｜裝修觀點',
    rating: 4,
    tags: ['#格局方正', '#採光極佳'],
    content: '看過這麼多案子，這裡的格局規劃真的很人性化，幾乎沒有虛坪浪費。',
    source: 'seed',
  },
  {
    id: 'seed-server-6',
    community_id: 'seed-c6',
    name: '邁房子團隊｜官方推薦',
    rating: 5,
    tags: ['#安心保證', '#專業服務'],
    content: '致力於打造全台最透明的房產社群，讓每一個好評與負評都能成為重要參考。',
    source: 'seed',
  },
];

// ============================================
// 2. 常數定義
// ============================================

const REQUIRED_COUNT = 6;
const DISPLAY_ID_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Fix Lie 12: Extract constant (Exclude I, O)

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
// 3. 錯誤上報機制 (P6 修復)
// ============================================

async function logError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>
): Promise<void> {
  const errorData = {
    context: `[featured-reviews] ${context}`,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    meta,
    timestamp: new Date().toISOString(),
  };

  // 1. Server log (必定執行)
  logger.error(errorData.context, null, errorData);

  // 2. 嘗試上報到 /api/log-error (非阻塞)
  try {
    const logApiUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/log-error`
      : null;

    if (logApiUrl) {
      // Fire and forget - 不等待回應
      fetch(logApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch(() => {
        // 靜默失敗，不影響主流程
      });
    }
  } catch {
    // 靜默失敗
  }
}

// ============================================
// 4. 工具函數
// ============================================

/**
 * 計算評分
 * P3 修復：根據 disadvantage 決定評分，不再硬編碼 5 星
 *
 * @param hasDisadvantage 是否有缺點
 * @returns 4 或 5 星
 */
function calculateRating(hasDisadvantage: boolean): number {
  return hasDisadvantage ? 4 : 5;
}

// ============================================
// 5. SERVER_SEEDS - 官方精選示範資料
// ============================================

// Moved to src/constants/server-seeds.ts

// ============================================
// 6. 資料適配器 (Adapter Pattern)
// ============================================

/**
 * 生成穩定的英文字母作為顯示 ID (H1 修復)
 * 使用 review.id 的 hash 作為種子，確保同一筆評價永遠對應同一個字母
 * 格式：X*** (如 J***, W***, L***)
 *
 * @param reviewId 評價的唯一識別碼，用於產生穩定的 hash
 * @returns 穩定的大寫英文字母
 */
function generateStableLetter(reviewId: string): string {
  // const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Moved to constants

  // 使用 djb2 hash 演算法產生穩定的數字
  let hash = 5381;
  for (let i = 0; i < reviewId.length; i++) {
    hash = (hash << 5) + hash + reviewId.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // 取絕對值並對字母數量取餘數
  const index = Math.abs(hash) % DISPLAY_ID_LETTERS.length;
  return DISPLAY_ID_LETTERS.charAt(index);
}

function adaptRealReviewForUI(review: RealReviewRow): ReviewForUI {
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

  // 正確的名稱格式：X***｜社區名稱 住戶/房仲
  // 例如：J***｜景安和院 住戶
  // H1 修復：使用穩定的字母生成，同一 review.id 永遠對應同一字母
  const letter = generateStableLetter(review.id);
  const roleLabel = review.source === 'agent' ? '房仲' : '住戶';
  // H4 修復：fallback 從「認證社區」改為「已認證」
  // 將測試用社區名稱映射為正常名稱（資料庫測試資料保持不變，顯示時替換）
  let communityLabel = review.community_name || '已認證';

  // Fix Lie 11: Explicitly acknowledge this is a dirty data patch
  // TODO: Clean up test data in database and remove this patch
  if (communityLabel.includes('測試社區') || communityLabel.includes('API 穩定性')) {
    communityLabel = '明湖水岸'; // 正常社區名稱，實際上是測試資料
  }
  const name = `${letter}***｜${communityLabel} ${roleLabel}`;

  // displayId 就是那個字母
  return {
    id: review.id,
    displayId: letter,
    name,
    rating: calculateRating(!!review.disadvantage),
    tags: tags.length > 0 ? tags : ['#精選評價'],
    content,
    communityId: review.community_id,
    source: 'real',
    region: 'taiwan',
  };
}

function adaptSeedForUI(seed: ServerSeed): ReviewForUI {
  // displayId 從 name 提取首字
  const firstChar = seed.name.charAt(0);
  return {
    id: seed.id,
    displayId: firstChar,
    name: seed.name,
    rating: seed.rating,
    tags: seed.tags,
    content: seed.content,
    communityId: null,
    source: 'seed',
    region: 'global',
  };
}

// ============================================
// 7. 主處理器
// ============================================

// 定義 Supabase Join 結果的介面
interface CommunityJoinResult {
  name: string;
}

interface ReviewRowWithJoin {
  id: string;
  community_id: string;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  source: 'resident' | 'agent';
  created_at: string;
  communities: CommunityJoinResult | CommunityJoinResult[] | null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 設定 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // H3 修復：強化快取策略
  // s-maxage=300: CDN 快取 5 分鐘 (確保穩定字母在快取期間不變)
  // stale-while-revalidate=600: 過期後 10 分鐘內仍可使用舊資料，同時背景更新
  // 這確保用戶在短時間內重複訪問會看到相同的字母
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  // OPTIONS 預檢請求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只允許 GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  const mixedReviews: ReviewForUI[] = [];

  try {
    // 1. 撈取真實資料 (JOIN communities 取得社區名稱)
    const { data: realData, error } = await getSupabase()
      .from('community_reviews')
      .select(
        `
        id, 
        community_id, 
        advantage_1, 
        advantage_2, 
        disadvantage, 
        source, 
        created_at,
        communities:community_id (name)
      `
      )
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT)
      .returns<ReviewRowWithJoin[]>(); // 明確指定回傳型別

    if (error) {
      // P6 修復：使用錯誤上報機制
      await logError('Supabase query failed', error, {
        table: 'community_reviews',
        limit: REQUIRED_COUNT,
      });
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

        // 從 JOIN 結果提取社區名稱
        // Supabase 返回可能是物件或陣列，需要處理兩種情況
        const communities = row.communities;
        let communityName: string | null = null;

        if (communities) {
          if (Array.isArray(communities)) {
            if (communities.length > 0) {
              communityName = communities[0].name;
            }
          } else {
            communityName = communities.name;
          }
        }

        const reviewWithCommunity: RealReviewRow = {
          ...row,
          community_name: communityName,
        };

        mixedReviews.push(adaptRealReviewForUI(reviewWithCommunity));
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
        // P1 修復已在 adaptSeedForUI 中處理
        mixedReviews.push(adaptSeedForUI(seed));
      }
    }

    // 4. 回傳結果
    return res.status(200).json({
      success: true,
      data: mixedReviews,
      meta: {
        total: mixedReviews.length,
        realCount: mixedReviews.filter((r) => r.source === 'real').length,
        seedCount: mixedReviews.filter((r) => r.source === 'seed').length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    // P6 修復：使用錯誤上報機制
    await logError('Unexpected error in handler', err);

    // Level 2 降級：API 異常時仍回傳 Mock 資料
    const fallbackReviews = SERVER_SEEDS.slice(0, REQUIRED_COUNT).map((seed) =>
      adaptSeedForUI(seed)
    );

    return res.status(200).json({
      success: true,
      data: fallbackReviews,
      meta: {
        total: fallbackReviews.length,
        realCount: 0,
        seedCount: fallbackReviews.length,
        timestamp: new Date().toISOString(),
        fallback: true,
      },
    });
  }
}
