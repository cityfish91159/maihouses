/**
 * Vercel API: /api/home/featured-properties
 * 
 * 首頁房源聚合 API - 混合動力架構 (Hybrid Properties System)
 * 
 * 核心邏輯：
 * 1. 優先從 Supabase properties 撈取真實資料
 * 2. 不足 6 筆時用 SERVER_SEEDS 補位
 * 3. 保證永遠回傳 6 筆資料（零天窗）
 * 
 * @author P10 Phase 1
 * @date 2025-12-16
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================
// 1. 型別定義
// ============================================

interface PropertyReview {
  avatar: string;
  name: string;
  role: string;
  tag: string;
  text: string;
}

interface PropertyForUI {
  id: number;
  image: string;
  badge: string;
  title: string;
  tags: string[];
  price: string;
  location: string;
  reviews: PropertyReview[];
  source: 'real' | 'seed';
}

// ============================================
// 2. 常數定義
// ============================================

const REQUIRED_COUNT = 6;

// SERVER_SEEDS: 與 src/constants/data.ts PROPERTIES 完全一致
const SERVER_SEEDS: Omit<PropertyForUI, 'source'>[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運 5 分鐘',
    title: '新板特區｜三房含車位，採光面中庭',
    tags: ['34.2 坪', '3 房 2 廳', '高樓層'],
    price: '1,288',
    location: '新北市板橋區 · 中山路一段',
    reviews: [
      { avatar: 'A', name: '王小姐', role: '3年住戶', tag: '管理到位', text: '管委反應快，公設打理乾淨，晚上也安靜好睡。' },
      { avatar: 'B', name: '林先生', role: '屋主', tag: '車位好停', text: '坡道寬、指示清楚，下班回家不太需要繞圈找位。' },
    ],
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1575517111478-7f6afd0973db?q=80&w=1600&auto=format&fit=crop',
    badge: '社區中庭',
    title: '松山民生社區｜邊間大兩房，採光佳',
    tags: ['28.6 坪', '2 房 2 廳', '可寵物'],
    price: '1,052',
    location: '台北市松山區 · 民生東路五段',
    reviews: [
      { avatar: 'C', name: '陳太太', role: '5年住戶', tag: '鄰里友善', text: '警衛熱心、包裹代收確實，社區群組很活躍。' },
      { avatar: 'D', name: '賴先生', role: '上班族', tag: '生活便利', text: '走路 3 分鐘有超市與市場，下班買菜很方便。' },
    ],
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1515263487990-61b07816b324?q=80&w=1600&auto=format&fit=crop',
    badge: '學區宅',
    title: '新店七張｜電梯二房，附機車位',
    tags: ['22.1 坪', '2 房 1 廳', '低公設比'],
    price: '838',
    location: '新北市新店區 · 北新路二段',
    reviews: [
      { avatar: 'E', name: '張小姐', role: '上班族', tag: '通勤方便', text: '步行到捷運七張站約 6 分鐘，雨天也有騎樓遮蔽。' },
      { avatar: 'F', name: '李先生', role: '家長', tag: '學區完整', text: '附近幼兒園到國中選擇多，放學接送動線順。' },
    ],
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=1600&auto=format&fit=crop',
    badge: '河岸景觀',
    title: '大直美堤｜景觀三房，沁涼通風',
    tags: ['36.8 坪', '3 房 2 廳', '邊間'],
    price: '1,560',
    location: '台北市中山區 · 敦化北路',
    reviews: [
      { avatar: 'G', name: '蘇先生', role: '住戶', tag: '景觀佳', text: '客廳看河景很放鬆，夏天自然風就很涼。' },
      { avatar: 'H', name: '高小姐', role: '通勤族', tag: '交通便利', text: '離公車站 2 分鐘，轉乘捷運時間可控。' },
    ],
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
    badge: '社區花園',
    title: '內湖東湖｜雙面採光，小家庭首選',
    tags: ['27.4 坪', '2 房 2 廳', '含機車位'],
    price: '968',
    location: '台北市內湖區 · 康寧路三段',
    reviews: [
      { avatar: 'I', name: '許太太', role: '家長', tag: '公園多', text: '社區旁邊就有親子公園，假日散步很方便。' },
      { avatar: 'J', name: '黃先生', role: '工程師', tag: '環境安靜', text: '臨巷內，夜間車流少，對面鄰居素質也不錯。' },
    ],
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運生活圈',
    title: '中和橋和站｜採光兩房，低管理費',
    tags: ['24.9 坪', '2 房 1 廳', '社區新'],
    price: '898',
    location: '新北市中和區 · 中和路',
    reviews: [
      { avatar: 'K', name: '簡小姐', role: '新婚', tag: '費用透明', text: '管委會公告清楚，管理費與車位費用都公開透明。' },
      { avatar: 'L', name: '羅先生', role: '通勤族', tag: '通勤穩定', text: '尖峰等車可控，公車轉乘動線順，延誤較少。' },
    ],
  },
];

// ============================================
// 3. Supabase 初始化
// ============================================

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
// 4. 工具函數
// ============================================

/**
 * 格式化價格：12880000 -> "1,288"
 */
function formatPrice(price: number | null): string {
  if (!price || price <= 0) return '洽詢';
  const inWan = Math.round(price / 10000);
  return inWan.toLocaleString('en-US');
}

/**
 * 強制圖片為 4:3 裁切
 */
function forceImageRatio(url: string | null): string {
  if (!url) {
    return 'https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=1600&auto=format&fit=crop';
  }
  // 如果已有 Unsplash 或 imgix 參數，保留；否則加上裁切參數
  if (url.includes('unsplash.com') || url.includes('imgix.net')) {
    return url;
  }
  return url;
}

/**
 * 多樣化預設評價 (A/B/C 組)
 */
function getDefaultReviews(propertyId: number): PropertyReview[] {
  const group = propertyId % 3;
  
  const reviewSets: PropertyReview[][] = [
    // A 組：新上架感
    [
      { avatar: 'N', name: '新住戶', role: '剛入住', tag: '新上架', text: '社區環境整潔，管理員服務親切。' },
      { avatar: 'M', name: '看房者', role: '近期參觀', tag: '印象佳', text: '採光通風都不錯，值得考慮。' },
    ],
    // B 組：熱門感
    [
      { avatar: 'P', name: '住戶', role: '2年住戶', tag: '高人氣', text: '社區氛圍好，鄰居互動頻繁。' },
      { avatar: 'Q', name: '房仲', role: '專業顧問', tag: '熱門物件', text: '詢問度高，地段優良。' },
    ],
    // C 組：地段感
    [
      { avatar: 'R', name: '老住戶', role: '5年住戶', tag: '地段優', text: '生活機能完善，交通便利。' },
      { avatar: 'S', name: '通勤族', role: '上班族', tag: '交通便', text: '捷運公車都方便，通勤省時。' },
    ],
  ];
  
  return reviewSets[group];
}

// ============================================
// 5. 資料適配器
// ============================================

interface RealPropertyRow {
  id: number;
  title: string | null;
  price: number | null;
  area: number | null;
  rooms: number | null;
  city: string | null;
  district: string | null;
  road: string | null;
  image_url: string | null;
  features: string[] | null;
}

function adaptRealPropertyForUI(row: RealPropertyRow): PropertyForUI {
  // 組合標題
  const title = row.title || `${row.city || ''}${row.district || ''}優質房源`;
  
  // 組合地址
  const location = [row.city, row.district, row.road].filter(Boolean).join(' · ') || '詳情請洽詢';
  
  // 組合標籤 (最多 3 個)
  const tags: string[] = [];
  if (row.area) tags.push(`${row.area} 坪`);
  if (row.rooms) tags.push(`${row.rooms} 房`);
  if (row.features && row.features.length > 0) {
    tags.push(row.features[0]);
  }
  if (tags.length === 0) tags.push('精選物件');
  
  // 生成 badge
  const badge = row.features?.[0] || '精選推薦';
  
  return {
    id: row.id,
    image: forceImageRatio(row.image_url),
    badge,
    title,
    tags: tags.slice(0, 3),
    price: formatPrice(row.price),
    location,
    reviews: getDefaultReviews(row.id),
    source: 'real',
  };
}

function adaptSeedForUI(seed: Omit<PropertyForUI, 'source'>): PropertyForUI {
  return {
    ...seed,
    source: 'seed',
  };
}

// ============================================
// 6. 錯誤記錄
// ============================================

async function logError(context: string, error: unknown): Promise<void> {
  console.error(`[featured-properties] ${context}`, error instanceof Error ? error.message : error);
}

// ============================================
// 7. 主處理器
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const mixedProperties: PropertyForUI[] = [];

  try {
    // 1. 撈取真實資料
    const { data: realData, error } = await getSupabase()
      .from('properties')
      .select('id, title, price, area, rooms, city, district, road, image_url, features')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT);

    if (error) {
      await logError('Supabase query failed', error);
      // 繼續用 Mock 補位
    }

    // 2. 填充真實資料
    if (realData && realData.length > 0) {
      for (const row of realData) {
        mixedProperties.push(adaptRealPropertyForUI(row as RealPropertyRow));
        if (mixedProperties.length >= REQUIRED_COUNT) break;
      }
    }

    // 3. 自動補位
    const missingCount = REQUIRED_COUNT - mixedProperties.length;
    if (missingCount > 0) {
      const seeds = SERVER_SEEDS.slice(0, missingCount);
      for (const seed of seeds) {
        mixedProperties.push(adaptSeedForUI(seed));
      }
    }

    // 4. 回傳結果
    return res.status(200).json({
      success: true,
      data: mixedProperties,
      meta: {
        total: mixedProperties.length,
        realCount: mixedProperties.filter(p => p.source === 'real').length,
        seedCount: mixedProperties.filter(p => p.source === 'seed').length,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (err) {
    await logError('Unexpected error', err);
    
    // Level 2 降級：全 Mock
    const fallbackProperties = SERVER_SEEDS.slice(0, REQUIRED_COUNT).map(adaptSeedForUI);
    
    return res.status(200).json({
      success: true,
      data: fallbackProperties,
      meta: {
        total: fallbackProperties.length,
        realCount: 0,
        seedCount: fallbackProperties.length,
        timestamp: new Date().toISOString(),
        fallback: true,
      },
    });
  }
}
