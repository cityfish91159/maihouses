import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { enforceCors } from '../lib/cors';
// ============================================
// Inlined Utils (Fix Vercel Import Issue)
// ============================================

export interface KeyCapsuleInput {
  advantage1?: string | null | undefined;
  advantage2?: string | null | undefined;
  features?: Array<string | null | undefined> | null | undefined;
  size?: number | null | undefined;
  rooms?: number | null | undefined;
  halls?: number | null | undefined;
  floorCurrent?: string | null | undefined;
  floorTotal?: number | null | undefined;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ');

const isNonEmpty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

function pushUnique(target: string[], value: string | null) {
  if (!value) return;
  const normalized = normalize(value);
  if (!normalized) return;
  if (target.includes(normalized)) return;
  target.push(normalized);
}

export function buildKeyCapsuleTags(input: KeyCapsuleInput): string[] {
  const tags: string[] = [];

  const highlightCandidates: string[] = [];
  if (isNonEmpty(input.advantage1)) highlightCandidates.push(input.advantage1);
  if (isNonEmpty(input.advantage2)) highlightCandidates.push(input.advantage2);
  if (Array.isArray(input.features)) {
    for (const feature of input.features) {
      if (isNonEmpty(feature)) highlightCandidates.push(feature);
    }
  }

  for (const candidate of highlightCandidates) {
    if (tags.length >= 2) break;
    if (!isNonEmpty(candidate)) continue;
    pushUnique(tags, candidate);
  }

  return tags.slice(0, 4);
}

// 延遲初始化 Supabase Client (避免測試時因環境變數不存在而失敗)
let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE key');
    }

    _supabase = createClient(supabaseUrl, supabaseKey);
  }
  return _supabase;
}

const REQUIRED_COUNT = 6;

// 1. Seed Data (與前端 constants/data.ts 的 PROPERTIES 完全一致)
const SERVER_SEEDS = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運3分鐘',
    title: '新板特區｜三房雙衛，捷運步行3分鐘',
    tags: ['34.2 坪', '3 房 2 廳', '高樓層'],
    price: '1,288',
    location: '新北市板橋區 · 中山路一段',
    reviews: [
      {
        avatar: 'A',
        name: '王小姐',
        role: '3年住戶',
        tag: '管理到位',
        text: '管委反應快，公設打理乾淨，晚上也安靜好睡。',
      },
      {
        avatar: 'B',
        name: '林先生',
        role: '屋主',
        tag: '車位好停',
        text: '坡道寬、指示清楚，下班回家不太需要繞圈找位。',
      },
    ],
    source: 'seed',
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?q=80&w=1600&auto=format&fit=crop',
    badge: '社區中庭',
    title: '民生社區｜邊間大兩房，綠蔭中庭',
    tags: ['28.6 坪', '2 房 2 廳', '可寵物'],
    price: '1,052',
    location: '台北市松山區 · 民生東路五段',
    reviews: [
      {
        avatar: 'C',
        name: '陳太太',
        role: '5年住戶',
        tag: '鄰里友善',
        text: '警衛熱心、包裹代收確實，社區群組很活躍。',
      },
      {
        avatar: 'D',
        name: '賴先生',
        role: '上班族',
        tag: '生活便利',
        text: '走路3分鐘有超市與市場，下班買菜很方便。',
      },
    ],
    source: 'seed',
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
    badge: '學區首選',
    title: '七張站旁｜電梯兩房，近學區',
    tags: ['22.1 坪', '2 房 1 廳', '低公設比'],
    price: '838',
    location: '新北市新店區 · 北新路二段',
    reviews: [
      {
        avatar: 'E',
        name: '張小姐',
        role: '上班族',
        tag: '通勤方便',
        text: '步行到捷運七張站約6分鐘，雨天也有騎樓遮蔽。',
      },
      {
        avatar: 'F',
        name: '李先生',
        role: '家長',
        tag: '學區完整',
        text: '附近幼兒園到國中選擇多，放學接送動線順。',
      },
    ],
    source: 'seed',
  },
  {
    id: 4,
    image:
      'https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1600&auto=format&fit=crop',
    badge: '河岸景觀',
    title: '大直水岸｜景觀三房，高樓層邊間',
    tags: ['36.8 坪', '3 房 2 廳', '邊間'],
    price: '1,560',
    location: '台北市中山區 · 明水路',
    reviews: [
      {
        avatar: 'G',
        name: '蘇先生',
        role: '住戶',
        tag: '景觀佳',
        text: '客廳看河景很放鬆，夏天自然風就很涼。',
      },
      {
        avatar: 'H',
        name: '高小姐',
        role: '通勤族',
        tag: '交通便利',
        text: '離公車站2分鐘，轉乘捷運時間可控。',
      },
    ],
    source: 'seed',
  },
  {
    id: 5,
    image:
      'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?q=80&w=1600&auto=format&fit=crop',
    badge: '公園第一排',
    title: '東湖站旁｜雙面採光，小家庭首選',
    tags: ['27.4 坪', '2 房 2 廳', '含機車位'],
    price: '968',
    location: '台北市內湖區 · 康寧路三段',
    reviews: [
      {
        avatar: 'I',
        name: '許太太',
        role: '家長',
        tag: '公園多',
        text: '社區旁邊就有親子公園，假日散步很方便。',
      },
      {
        avatar: 'J',
        name: '黃先生',
        role: '工程師',
        tag: '環境安靜',
        text: '臨巷內，夜間車流少，對面鄰居素質也不錯。',
      },
    ],
    source: 'seed',
  },
  {
    id: 6,
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1600&auto=format&fit=crop',
    badge: '捷運生活圈',
    title: '橋和站旁｜採光兩房，新成屋低管理費',
    tags: ['24.9 坪', '2 房 1 廳', '社區新'],
    price: '898',
    location: '新北市中和區 · 中和路',
    reviews: [
      {
        avatar: 'K',
        name: '簡小姐',
        role: '新婚',
        tag: '費用透明',
        text: '管委會公告清楚，管理費與車位費用都公開透明。',
      },
      {
        avatar: 'L',
        name: '羅先生',
        role: '通勤族',
        tag: '通勤穩定',
        text: '尖峰等車可控，公車轉乘動線順，延誤較少。',
      },
    ],
    source: 'seed',
  },
];

// 🔥 正確的 DB Schema 定義 (根據 migrations)
interface RealPropertyRow {
  id: string; // UUID
  public_id: string;
  title: string | null;
  price: number | null;
  address: string | null; // ✅ 正確: 單一地址欄位
  images: string[] | null; // ✅ 正確: 圖片陣列
  community_id: string | null; // ✅ 關聯社區 ID
  community_name: string | null; // 社區名稱
  size: number | null; // ✅ 坪數
  rooms: number | null; // 房數
  halls: number | null; // 廳數 (選填)
  floor_current: string | null; // ✅ 樓層 (P0 缺失修正)
  floor_total: number | null; // ✅ 總樓層 (P0 缺失修正)
  features: string[] | null; // 特色標籤
  advantage_1: string | null; // 兩好一公道
  advantage_2: string | null;
  disadvantage: string | null;
}

// [NASA TypeScript Safety] Zod Schema for RealPropertyRow
const RealPropertyRowSchema = z.object({
  id: z.string(),
  public_id: z.string(),
  title: z.string().nullable(),
  price: z.number().nullable(),
  address: z.string().nullable(),
  images: z.array(z.string()).nullable(),
  community_id: z.string().nullable(),
  community_name: z.string().nullable(),
  size: z.number().nullable(),
  rooms: z.number().nullable(),
  halls: z.number().nullable(),
  floor_current: z.string().nullable(),
  floor_total: z.number().nullable(),
  features: z.array(z.string()).nullable(),
  advantage_1: z.string().nullable(),
  advantage_2: z.string().nullable(),
  disadvantage: z.string().nullable(),
});

/**
 * [NASA TypeScript Safety] 類型守衛：驗證是否為有效的 RealPropertyRow
 */
function isValidRealPropertyRow(item: unknown): item is RealPropertyRow {
  return RealPropertyRowSchema.safeParse(item).success;
}

// Supabase 回傳的評價資料型別
interface SupabaseReviewRow {
  community_id: string;
  content: { pros?: string[]; cons?: string; property_title?: string } | null;
  agent: { name: string }[] | null; // Supabase join 回傳陣列
  source: string | null;
}

// 評價資料型別 (轉換後)
interface ReviewData {
  avatar?: string;
  name?: string;
  role?: string;
  tag?: string;
  text?: string;
  source?: string;
  community_id?: string;
  content?: { pros?: string[]; cons?: string; property_title?: string };
  agent?: { name?: string };
}

// UI 輸出型別
interface PropertyForUI {
  id: string | number;
  image: string;
  badge: string;
  title: string;
  tags: string[];
  price: string;
  location: string;
  reviews: {
    avatar: string;
    name: string;
    role: string;
    tag: string;
    text: string;
  }[];
  source: string;
}

// 價格格式化
function formatPrice(price: number | null): string {
  if (!price) return '洽詢';
  const val = price > 10000 ? Math.round(price / 10000) : price;
  return new Intl.NumberFormat('en-US').format(val);
}

// 適配層：將 DB Row 轉為 UI Props
function adaptRealPropertyForUI(row: RealPropertyRow, reviews: ReviewData[]): PropertyForUI {
  // 1. 圖片處理 (取第一張 + 強制裁切)
  let imageUrl =
    row.images && row.images.length > 0
      ? row.images[0]
      : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600';

  if (imageUrl.includes('supabase.co')) {
    imageUrl += '?width=800&height=600&resize=cover';
  }

  // 2. 標籤組合 (SSOT Key Capsules)
  // index 語意：tags[0..1] highlights、tags[2..3] specs
  const tags = buildKeyCapsuleTags({
    advantage1: row.advantage_1,
    advantage2: row.advantage_2,
    features: row.features,
    size: row.size,
    rooms: row.rooms,
    halls: row.halls,
    floorCurrent: row.floor_current,
    floorTotal: row.floor_total,
  });

  // 確保必備的規格標籤存在（測試期望：坪數 + 房廳資訊）
  // 確保必備的規格標籤存在（測試期望：坪數 + 房廳資訊）
  const tagSet = new Set(tags.filter(Boolean));
  // [UP-4.1 Fix] Source Cleaning: 絕不將規格 (30坪/3房) 混入 tags (亮點)
  // 這些資訊應由 Frontend 直接從 property.size / property.rooms 讀取並顯示在規格欄
  /* Removed for Strict Separation
  if (row.size) {
    tagSet.add(`${row.size} 坪`);
  }
  if (row.rooms) {
    const hallsLabel = typeof row.halls === 'number' ? `${row.halls} 廳` : '0 廳';
    tagSet.add(`${row.rooms} 房 ${hallsLabel}`);
  }
  */
  const finalTags = Array.from(tagSet);

  // 3. 地址處理 (DB 只有 address，沒有 city/district 欄位，簡單截取或直接顯示)
  // Mock 格式: "新北市板橋區 · 中山路一段"
  // 嘗試簡單模擬: 取前6個字 (縣市區) + " · " + 後面
  let location = row.address || '地址詳洽';
  if (location.length > 6) {
    // 簡單的視覺優化，讓長地址看起來跟 Mock 比較像
    // 例如 "台北市信義區信義路五段" -> "台北市信義區 · 信義路五段"
    // 注意：這只是簡單切分，不保證精確行政區劃分，但視覺上足夠
    const districtEnd = location.indexOf('區');
    if (districtEnd > -1 && districtEnd < location.length - 1) {
      location = `${location.substring(0, districtEnd + 1)} · ${location.substring(districtEnd + 1)}`;
    }
  }

  // 4. 評價處理 (多樣化補位)
  const displayReviews = [...reviews];
  if (displayReviews.length < 2) {
    // 根據 UUID 最後一碼決定預設文案
    const lastChar = row.id.slice(-1);
    const seedIndex = parseInt(lastChar, 16) % 3;

    const defaultSets = [
      [
        {
          avatar: 'M',
          name: '邁房子',
          role: '系統',
          tag: '新上架',
          text: '此物件剛剛上架，歡迎預約看屋！',
        },
        {
          avatar: 'S',
          name: 'AI估價',
          role: '推薦',
          tag: '符合行情',
          text: '系統分析開價合理，建議把握機會。',
        },
      ],
      [
        {
          avatar: 'H',
          name: '熱度榜',
          role: '系統',
          tag: '瀏覽高',
          text: '本週熱門物件，瀏覽人數眾多。',
        },
        {
          avatar: 'A',
          name: 'AI分析',
          role: '推薦',
          tag: '格局方正',
          text: '空間利用率高，無明顯虛坪浪費。',
        },
      ],
      [
        {
          avatar: 'L',
          name: '區域通',
          role: '系統',
          tag: '地段佳',
          text: '位於精華生活圈，周邊機能完善。',
        },
        {
          avatar: 'S',
          name: 'AI分析',
          role: '推薦',
          tag: '交通便利',
          text: '步行可達大眾運輸，通勤首選。',
        },
      ],
    ];

    displayReviews.push(...defaultSets[seedIndex].slice(0, 2 - displayReviews.length));
  }

  // 5. 評價格式轉換
  const formattedReviews = displayReviews.slice(0, 2).map((r: ReviewData) => ({
    avatar: r.avatar || (r.source === 'agent' ? 'A' : 'U'),
    name: r.name || r.agent?.name || '認證住戶',
    role: r.role || (r.source === 'agent' ? '房仲' : '住戶'),
    tag: r.tag || r.content?.pros?.[0] || '推薦',
    text: r.text || r.content?.cons || r.content?.property_title || '詳細評價請點擊',
  }));

  return {
    id: row.id, // 真實 UUID
    image: imageUrl,
    // 修正 Badge (P2 缺失修正)：不再從 features 隨機抓，統一為「精選物件」或社區名
    badge: row.community_name || '精選物件',
    title: row.title || '未命名物件',
    tags: finalTags,
    price: formatPrice(row.price),
    location: location,
    reviews: formattedReviews,
    source: 'real',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!enforceCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  // Cache
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  let mixedProperties: PropertyForUI[] = [];

  try {
    // 1. 撈取真實房源 (使用正確的欄位名稱)
    const { data: realData, error } = await getSupabase()
      .from('properties')
      .select(
        `
        id, public_id, title, price, address, images, 
        community_id, community_name, 
        size, rooms, halls, features, 
        floor_current, floor_total,
        advantage_1, advantage_2, disadvantage
      `
      )
      // .eq('status', 'published') // 建議開啟
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT);

    if (error) throw error;

    // 2. 批量撈取評價 (Batch Query)
    let reviewsMap: Record<string, any[]> = {};

    if (realData && realData.length > 0) {
      // 收集不重複的 community_id
      const communityIds = [...new Set(realData.map((p) => p.community_id).filter((id) => id))];

      if (communityIds.length > 0) {
        // 查詢 community_reviews (View)
        const { data: reviewsData } = await getSupabase()
          .from('community_reviews')
          .select('community_id, content, agent(name), source')
          .in('community_id', communityIds)
          .order('created_at', { ascending: false });

        // 分組
        if (reviewsData) {
          reviewsData.forEach((r: SupabaseReviewRow) => {
            const cid = r.community_id;
            if (!cid) return;
            if (!reviewsMap[cid]) {
              reviewsMap[cid] = [];
            }
            // 轉換為 ReviewData
            const review: ReviewData = {
              community_id: cid,
              content: r.content || undefined,
              agent: r.agent?.[0] ? { name: r.agent[0].name } : undefined,
              source: r.source || undefined,
            };
            reviewsMap[cid].push(review);
          });
        }
      }

      // 3. 填充與適配
      // [NASA TypeScript Safety] 使用類型守衛取代 as RealPropertyRow
      for (const row of realData) {
        if (!isValidRealPropertyRow(row)) {
          logger.debug('[featured-properties] Invalid row skipped', { id: row?.id });
          continue;
        }
        // 根據 property 的 community_id 找評價
        const reviews = row.community_id ? reviewsMap[row.community_id] || [] : [];
        // 呼叫適配器
        mixedProperties.push(adaptRealPropertyForUI(row, reviews));
      }
    }
  } catch (error) {
    // 防禦：記錄失敗不可影響 fallback 回應（避免 logger/Sentry 二次拋錯導致 500）
    try {
      logger.error('[featured-properties] API Error', error);
    } catch {
      // no-op
    }
  }

  // 4. 自動補位 (Auto-fill)
  const missingCount = REQUIRED_COUNT - mixedProperties.length;
  if (missingCount > 0) {
    const seeds = SERVER_SEEDS.slice(0, missingCount);
    mixedProperties = [...mixedProperties, ...seeds];
  }

  return res.status(200).json({
    success: true,
    data: mixedProperties,
  });
}

// 🧪 測試用導出 (僅導出純函數，不導出 handler)
export const __testHelpers = {
  formatPrice,
  adaptRealPropertyForUI,
  SERVER_SEEDS,
  REQUIRED_COUNT,
};

// 導出型別供測試使用
export type { RealPropertyRow, ReviewData, PropertyForUI };
