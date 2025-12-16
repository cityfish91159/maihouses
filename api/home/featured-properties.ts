import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// 使用 Anon Key
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

const REQUIRED_COUNT = 6;

// 1. Seed Data (與前端 constants/data.ts 保持一致)
const SERVER_SEEDS = [
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
    source: 'seed'
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
    source: 'seed'
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
    source: 'seed'
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
    source: 'seed'
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
    source: 'seed'
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
    source: 'seed'
  },
];

// 🔥 正確的 DB Schema 定義 (根據 migrations)
interface RealPropertyRow {
  id: string; // UUID
  public_id: string;
  title: string | null;
  price: number | null;
  address: string | null;          // ✅ 正確: 單一地址欄位
  images: string[] | null;         // ✅ 正確: 圖片陣列
  community_id: string | null;     // ✅ 關聯社區 ID
  community_name: string | null;   // 社區名稱
  size: number | null;             // ✅ 坪數
  rooms: number | null;            // 房數
  halls: number | null;            // 廳數 (選填)
  features: string[] | null;       // 特色標籤
  advantage_1: string | null;      // 兩好一公道
  advantage_2: string | null;
  disadvantage: string | null;
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
  reviews: { avatar: string; name: string; role: string; tag: string; text: string }[];
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
  let imageUrl = (row.images && row.images.length > 0)
     ? row.images[0]
     : 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1600';
  
  if (imageUrl.includes('supabase.co')) {
    imageUrl += '?width=800&height=600&resize=cover';
  }

  // 2. 標籤組合 (Size + Rooms + Feature)
  const area = row.size ? `${Number(row.size).toFixed(1)} 坪` : '';
  // 嘗試組合房廳: "3房2廳" 或 "3房"
  const layout = row.rooms ? `${row.rooms}房${row.halls ? row.halls + '廳' : ''}` : '';
  const featureTag = (row.features && row.features.length > 0) ? row.features[0] : '優質好房';
  
  const tags = [area, layout, featureTag].filter(t => t && t !== '').slice(0, 3);

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
            { avatar: 'M', name: '邁房子', role: '系統', tag: '新上架', text: '此物件剛剛上架，歡迎預約看屋！' },
            { avatar: 'S', name: 'AI估價', role: '推薦', tag: '符合行情', text: '系統分析開價合理，建議把握機會。' }
        ],
        [
            { avatar: 'H', name: '熱度榜', role: '系統', tag: '瀏覽高', text: '本週熱門物件，瀏覽人數眾多。' },
            { avatar: 'A', name: 'AI分析', role: '推薦', tag: '格局方正', text: '空間利用率高，無明顯虛坪浪費。' }
        ],
        [
            { avatar: 'L', name: '區域通', role: '系統', tag: '地段佳', text: '位於精華生活圈，周邊機能完善。' },
            { avatar: 'S', name: 'AI分析', role: '推薦', tag: '交通便利', text: '步行可達大眾運輸，通勤首選。' }
        ]
      ];
      
      displayReviews.push(...defaultSets[seedIndex].slice(0, 2 - displayReviews.length));
  }

  // 5. 評價格式轉換
  const formattedReviews = displayReviews.slice(0, 2).map((r: ReviewData) => ({
    avatar: r.avatar || (r.source === 'agent' ? 'A' : 'U'),
    name: r.name || r.agent?.name || '認證住戶',
    role: r.role || (r.source === 'agent' ? '房仲' : '住戶'),
    tag: r.tag || r.content?.pros?.[0] || '推薦',
    text: r.text || r.content?.cons || r.content?.property_title || '詳細評價請點擊'
  }));

  return {
    id: row.id, // 真實 UUID
    image: imageUrl,
    badge: (row.features && row.features.length > 0) ? row.features[0] : '精選物件',
    title: row.title || '未命名物件',
    tags: tags,
    price: formatPrice(row.price),
    location: location,
    reviews: formattedReviews,
    source: 'real'
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Cache
  const allowedOrigins = ['https://maihouses.vercel.app', 'http://localhost:5173'];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  let mixedProperties: PropertyForUI[] = [];

  try {
    // 1. 撈取真實房源 (使用正確的欄位名稱)
    const { data: realData, error } = await supabase
      .from('properties')
      .select(`
        id, public_id, title, price, address, images, 
        community_id, community_name, 
        size, rooms, halls, features, 
        advantage_1, advantage_2, disadvantage
      `)
      // .eq('status', 'published') // 建議開啟
      .order('created_at', { ascending: false })
      .limit(REQUIRED_COUNT);

    if (error) throw error;

    // 2. 批量撈取評價 (Batch Query)
    let reviewsMap: Record<string, any[]> = {};

    if (realData && realData.length > 0) {
        // 收集不重複的 community_id
        const communityIds = [...new Set(
            realData.map(p => p.community_id).filter(id => id)
        )];

        if (communityIds.length > 0) {
            // 查詢 community_reviews (View)
            const { data: reviewsData } = await supabase
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
        for (const row of realData) {
            // 根據 property 的 community_id 找評價
            const reviews = row.community_id ? (reviewsMap[row.community_id] || []) : [];
            // 呼叫適配器
            mixedProperties.push(adaptRealPropertyForUI(row as RealPropertyRow, reviews));
        }
    }

  } catch (error) {
    console.error('API Error', error);
  }

  // 4. 自動補位 (Auto-fill)
  const missingCount = REQUIRED_COUNT - mixedProperties.length;
  if (missingCount > 0) {
    const seeds = SERVER_SEEDS.slice(0, missingCount);
    mixedProperties = [...mixedProperties, ...seeds];
  }

  return res.status(200).json({
    success: true,
    data: mixedProperties
  });
}
