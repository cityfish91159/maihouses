/**
 * P11 Phase 2: Property Page Data API
 * 
 * 混合動力架構：
 * 1. 撈取真實房源 (11筆: 1大 + 2小 + 8列表)
 * 2. 批量撈取評價 (避免 N+1)
 * 3. 使用 adapters 統一格式
 * 4. 混合組裝 (真實 + Seed 補位)
 * 5. 錯誤時回傳 Seed (不回 500)
 * 
 * @see src/types/property-page.ts - Schema & Types
 * @see public/data/seed-property-page.json - Seed Data
 * 
 * D22/D23 修正：使用 import JSON 取代 readFileSync + __dirname
 * - 不再使用同步 I/O (readFileSync)
 * - 不再依賴 __dirname (ESM 不存在)
 * - JSON 在 build time 打包成 JS 物件
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// D22/D23 修正：移除 fs 和 path import，改用 JSON import
import seedJson from '../../public/data/seed-property-page.json';
import {
  type FeaturedPropertyCard,
  type ListingPropertyCard,
  type PropertyPageData,
  type FeaturedReview,
  type ListingReview,
  normalizeFeaturedReview,
  normalizeListingReview
} from '../../src/types/property-page';
import { buildKeyCapsuleTags, formatArea, formatLayout } from '../../src/utils/keyCapsules';

// ============================================
// Supabase Client
// ============================================

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

// ============================================
// Seed Data Loader (D22/D23 修正版)
// ============================================

/**
 * 取得 Seed 資料
 * D22/D23 修正：直接使用 import 的 JSON，不再用 readFileSync
 * - 零 I/O 阻塞
 * - 無 __dirname 依賴
 * - Build time 就打包好
 */
function getSeedData(): PropertyPageData {
  // seedJson 結構是 { default: PropertyPageData, test?: PropertyPageData }
  return (seedJson as { default: PropertyPageData }).default;
}

// ============================================
// DB Types (D26 修正：與 Supabase schema 對齊)
// ============================================

/**
 * DBProperty - 與 properties 表 schema 對齊
 * 
 * @see src/types/supabase-schema.ts - 完整型別定義
 * @see supabase/migrations/20251127_properties_schema.sql - 基本欄位
 * @see supabase/migrations/20251127_property_upload_schema.sql - 詳細規格欄位
 * @see supabase/migrations/20241201_property_community_link.sql - 社區關聯
 * 
 * ⚠️ 注意：
 * - title, price, address 在 DB 是 NOT NULL，但查詢可能回傳 null
 * - rooms, halls, bathrooms 有 DEFAULT 0，但仍標記為 nullable 以防萬一
 * - year_built 在 DB 是 age（房齡），不是蓋好的年份
 * - baths 在 DB 是 bathrooms
 */
interface DBProperty {
  // 主鍵與識別
  id: string;
  public_id: string;
  
  // 基本資訊
  title: string | null;
  price: number | null;
  address: string | null;
  images: string[] | null;
  
  // 社區關聯 (20241201_property_community_link.sql)
  community_id: string | null;
  community_name: string | null;
  
  // 詳細規格 (20251127_property_upload_schema.sql)
  size: number | null;
  rooms: number | null;             // DB: rooms NUMERIC DEFAULT 0
  halls: number | null;             // DB: halls NUMERIC DEFAULT 0
  bathrooms: number | null;         // DB: bathrooms NUMERIC DEFAULT 0 (原本寫 baths)
  floor_current: string | null;      // DB: floor_current TEXT
  floor_total: number | null;        // DB: floor_total NUMERIC
  features: string[] | null;        // DB: features TEXT[] DEFAULT '{}'
  
  // 兩好一公道 (properties 表直接有這些欄位)
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  
  // 房齡相關 (DB 是 age，不是 year_built)
  age: number | null;               // DB: age NUMERIC (房齡年數)
  
  // ❌ 已移除不存在的欄位:
  // - year_built (DB 用 age 表示房齡)
  // - total_units (在 communities 表，不在 properties)
  // - baths (正確名稱是 bathrooms)
}

/**
 * DBReview - 與 community_reviews VIEW schema 對齊
 * 
 * @see src/types/supabase-schema.ts - 完整型別定義
 * @see supabase/migrations/20251206_fix_community_reviews_view.sql - VIEW 定義
 * 
 * ⚠️ 重要：community_reviews 是 VIEW 不是 TABLE
 * 它從 properties 表生成，所以欄位名稱與一般 reviews 表不同
 * 
 * ❌ 原本的錯誤欄位：content, rating, author_name, tags
 * ✅ 正確欄位：advantage_1, advantage_2, disadvantage, source, content (jsonb)
 */
interface DBReview {
  id: string;
  community_id: string;
  property_id: string;              // VIEW: p.id AS property_id
  author_id: string | null;         // VIEW: p.agent_id AS author_id
  
  // 兩好一公道 (來自 properties 表)
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  
  // 來源
  source_platform: string | null;
  source: string | null;            // VIEW: p.source_external_id AS source
  
  // JSONB 內容 (VIEW 組裝的)
  content: {
    pros: (string | null)[];        // [advantage_1, advantage_2]
    cons: string | null;            // disadvantage
    property_title: string;
  } | null;
  
  created_at: string;
  
  // ❌ 已移除不存在的欄位:
  // - rating (VIEW 沒有)
  // - author_name (VIEW 用 author_id)
  // - tags (VIEW 沒有)
}

// ============================================
// Adapter Functions
// D28: 拆分成小函數，符合單一職責原則
// ============================================

/**
 * D28: 建構房屋詳細資訊列表
 */
function buildPropertyDetails(property: DBProperty): string[] {
  const details: string[] = [];
  
  // 房型格局
  if (property.rooms || property.halls || property.bathrooms) {
    const layout = [
      property.rooms ? `${property.rooms}房` : '',
      property.halls ? `${property.halls}廳` : '',
      property.bathrooms ? `${property.bathrooms}衛` : ''
    ].filter(Boolean).join('');
    const sizeInfo = property.size ? `室內 ${property.size}坪` : '';
    details.push([layout, sizeInfo].filter(Boolean).join(' + '));
  }
  
  // 屋齡
  if (property.age) {
    details.push(`🏢 屋齡 ${property.age} 年`);
  }
  
  // 優勢
  if (property.advantage_1) details.push(property.advantage_1);
  if (property.advantage_2) details.push(property.advantage_2);
  
  return details;
}

/**
 * D28: 建構評價列表 (Featured Card 用)
 */
function buildFeaturedReviews(
  reviews: DBReview[],
  seedReviews: FeaturedReview[]
): FeaturedReview[] {
  // 轉換 DB 評價
  let adaptedReviews: FeaturedReview[] = reviews.slice(0, 2).map(r => ({
    stars: '★★★★☆',  // D26: VIEW 沒有 rating，給預設
    author: '匿名用戶',  // D26: VIEW 沒有 author_name
    tags: [r.advantage_1, r.advantage_2].filter(Boolean) as string[] | undefined,
    content: r.content 
      ? `${r.content.property_title || '好物件'} - 優點：${r.content.pros?.filter(Boolean).join('、') || '無'}` 
      : (r.advantage_1 || '好評推薦')
  }));

  // D25: 過濾無效評價
  adaptedReviews = adaptedReviews.filter(r => {
    const normalized = normalizeFeaturedReview(r);
    if (!normalized.author || !normalized.content) {
      console.warn('[API] 無效評價已過濾，將使用 Seed 替換');
      return false;
    }
    return true;
  });

  // 補位
  while (adaptedReviews.length < 2 && seedReviews.length > adaptedReviews.length) {
    adaptedReviews.push(seedReviews[adaptedReviews.length]);
  }
  
  return adaptedReviews;
}

/**
 * 將 DB 房源轉為 Featured Card 格式
 * D28: 重構後約 30 行（原本 80+ 行）
 */
function adaptToFeaturedCard(
  property: DBProperty,
  reviews: DBReview[],
  seed: FeaturedPropertyCard
): FeaturedPropertyCard {
  const details = buildPropertyDetails(property);
  const adaptedReviews = buildFeaturedReviews(reviews, seed.reviews);

  return {
    badge: property.features?.[0] || seed.badge,
    image: property.images?.[0] || seed.image,
    title: property.title || seed.title,
    location: property.address ? `📍 ${property.address}` : seed.location,
    details: details.length > 0 ? details : seed.details,
    highlights: seed.highlights,
    rating: reviews.length > 0 ? `${reviews.length} 則評價` : seed.rating,
    reviews: adaptedReviews,
    lockCount: reviews.length || seed.lockCount,
    price: property.price ? `${Math.round(property.price / 10000).toLocaleString()} 萬` : seed.price,
    size: property.size ? `約 ${property.size} 坪` : seed.size
  };
}

/**
 * 將 DB 房源轉為 Listing Card 格式
 */
function adaptToListingCard(
  property: DBProperty,
  reviews: DBReview[],
  seed: ListingPropertyCard
): ListingPropertyCard {
  // 圖片處理
  const image = property.images?.[0] || seed.image;

  // D26 修正：評價轉換 - 使用正確的 DBReview 結構
  let adaptedReviews: ListingReview[] = reviews.slice(0, 2).map((r, i) => ({
    // D26: tags 不存在，用 advantage_1 作為 badge
    badge: r.advantage_1 || (i === 0 ? '真實評價' : '住戶推薦'),
    // D26: content 是 JSONB 物件，author_name 不存在
    content: r.content 
      ? `「${r.content.property_title || '好物件'}」— ${r.content.pros?.filter(Boolean).join('、') || '好評'}`
      : (r.advantage_1 || seed.reviews[i]?.content || '好評推薦')
  }));

  // D25 修正：驗證失敗時過濾掉格式錯誤的評價
  adaptedReviews = adaptedReviews.filter(r => {
    const normalized = normalizeListingReview(r);
    // 如果 content 包含「」但解析出匿名，表示格式有問題
    if (normalized.author === '匿名' && r.content.includes('「') && r.content.includes('—')) {
      console.warn('[API] 無效 Listing 評價已過濾，將使用 Seed 替換:', r.content);
      return false;
    }
    return true;
  });

  // 補位
  while (adaptedReviews.length < 2 && seed.reviews.length > adaptedReviews.length) {
    adaptedReviews.push(seed.reviews[adaptedReviews.length]);
  }

  // 房型標籤
  const roomLabel = property.rooms ? `${property.rooms} 房` : '';
  const priceLabel = property.price ? `${Math.round(property.price / 10000).toLocaleString()} 萬` : seed.price;

  const tags = buildKeyCapsuleTags({
    advantage1: property.advantage_1 ?? undefined,
    advantage2: property.advantage_2 ?? undefined,
    features: property.features ?? undefined,
    floorCurrent: property.floor_current ?? undefined,
    floorTotal: property.floor_total ?? undefined,
    size: property.size ?? undefined,
    rooms: property.rooms ?? undefined,
    halls: property.halls ?? undefined
  });

  // P11-S1: 補齊規格標籤（坪數、房廳）
  const specTags: string[] = [];
  const sizeTag = formatArea(property.size ?? null);
  const layoutTag = formatLayout(property.rooms ?? null, property.halls ?? null);

  if (sizeTag && !tags.includes(sizeTag)) specTags.push(sizeTag);
  if (layoutTag && !tags.includes(layoutTag)) specTags.push(layoutTag);

  const finalTags = [...tags, ...specTags];

  return {
    image,
    title: property.title 
      ? `${property.title}・${property.address?.split('區')[0]}區` 
      : seed.title,
    // 修正 Legacy Tag (P1 缺失修正)：改為由 SSOT tags[0] 產出，不再獨立 fallback
    tag: finalTags[0] || seed.tag,
    tags: finalTags,
    price: roomLabel ? `${roomLabel} ${priceLabel}` : priceLabel,
    size: property.size ? `約 ${property.size} 坪` : seed.size,
    // D26 修正：rating 不存在，用評價數量作為替代
    rating: reviews.length > 0
      ? `${reviews.length} 則評價`
      : seed.rating,
    reviews: adaptedReviews,
    note: property.advantage_1 || seed.note,
    lockLabel: seed.lockLabel,
    lockCount: reviews.length || seed.lockCount
  };
}

// ============================================
// Main Handler
// ============================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // D29: CORS 改用環境變數，支援動態設定
  const defaultOrigins = [
    'https://maihouses.vercel.app',
    'https://cityfish91159.github.io',
    'http://localhost:5173',
    'http://localhost:4173'
  ];
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultOrigins;
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Cache: 60秒 CDN 快取 + 5分鐘 stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const seed = getSeedData();

  try {
    // D26 修正：1. 撈取房源 (11筆: 3 featured + 8 listings)
    // 欄位對齊 Supabase schema：baths → bathrooms, year_built → age, 移除 total_units
    const { data: properties, error: propError } = await getSupabase()
      .from('properties')
      .select(`
        id, public_id, title, price, address, images,
        community_id, community_name, size, rooms, halls, bathrooms,
        floor_current, floor_total,
        features, advantage_1, advantage_2, disadvantage,
        age
      `)
      .order('created_at', { ascending: false })
      .limit(11);

    if (propError) {
      console.error('[API] Properties query error:', propError);
      throw propError;
    }

    // 2. 批量撈取評價 (避免 N+1)
    const communityIds = Array.from(new Set(
      (properties || [])
        .map(p => p.community_id)
        .filter((id): id is string => !!id)
    ));

    let reviewsMap: Record<string, DBReview[]> = {};
    
    if (communityIds.length > 0) {
      // D26 修正：使用正確的 community_reviews VIEW 欄位
      // VIEW 沒有 rating, author_name, tags，改用正確欄位
      // D27 修正：加入 limit 防止大社區撈回數千筆評價
      // 每個社區只需要 2 筆（reviews.slice(0, 2)），給 3 筆 buffer
      const maxReviews = communityIds.length * 3;
      const { data: reviews, error: revError } = await getSupabase()
        .from('community_reviews')
        .select(`
          id, community_id, property_id, author_id,
          advantage_1, advantage_2, disadvantage,
          source_platform, source, content, created_at
        `)
        .in('community_id', communityIds)
        .order('created_at', { ascending: false })
        .limit(maxReviews);  // D27: 防止記憶體爆炸

      if (revError) {
        console.warn('[API] Reviews query error (non-fatal):', revError);
      } else if (reviews) {
        // 按 community_id 分組
        reviews.forEach(r => {
          if (!reviewsMap[r.community_id]) {
            reviewsMap[r.community_id] = [];
          }
          reviewsMap[r.community_id].push(r as DBReview);
        });
      }
    }

    // 3. 組裝資料
    const realProperties = properties || [];
    
    // Featured: 取前 3 筆
    const featuredProps = realProperties.slice(0, 3);
    const featured = {
      main: featuredProps[0]
        ? adaptToFeaturedCard(
            featuredProps[0] as DBProperty,
            reviewsMap[featuredProps[0].community_id || ''] || [],
            seed.featured.main
          )
        : seed.featured.main,
      sideTop: featuredProps[1]
        ? adaptToFeaturedCard(
            featuredProps[1] as DBProperty,
            reviewsMap[featuredProps[1].community_id || ''] || [],
            seed.featured.sideTop
          )
        : seed.featured.sideTop,
      sideBottom: featuredProps[2]
        ? adaptToFeaturedCard(
            featuredProps[2] as DBProperty,
            reviewsMap[featuredProps[2].community_id || ''] || [],
            seed.featured.sideBottom
          )
        : seed.featured.sideBottom
    };

    // Listings: 取第 4-11 筆
    const listingProps = realProperties.slice(3, 11);
    const listings: ListingPropertyCard[] = [];
    
    for (let i = 0; i < 8; i++) {
      if (listingProps[i]) {
        listings.push(adaptToListingCard(
          listingProps[i] as DBProperty,
          reviewsMap[listingProps[i].community_id || ''] || [],
          seed.listings[i] || seed.listings[0]
        ));
      } else if (seed.listings[i]) {
        listings.push(seed.listings[i]);
      }
    }

    // 確保至少有 1 個 listing
    if (listings.length === 0) {
      listings.push(seed.listings[0]);
    }

    const responseData: PropertyPageData = {
      featured,
      listings
    };

    console.log(`[API] Success: ${realProperties.length} properties, ${Object.keys(reviewsMap).length} communities with reviews`);

    return res.status(200).json({
      success: true,
      data: responseData,
      meta: {
        realCount: realProperties.length,
        seedCount: 11 - realProperties.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    // D30: 錯誤時回傳 Seed，不暴露內部錯誤訊息給前端
    console.error('[API] Error, falling back to seed:', error);
    
    return res.status(200).json({
      success: false,
      data: seed,
      // D30: 只給通用錯誤訊息，不暴露 error.message
      error: '伺服器暫時無法取得資料，已使用預設內容',
      meta: {
        realCount: 0,
        seedCount: 11,
        fallback: true,
        timestamp: new Date().toISOString()
      }
    });
  }
}

// ============================================
// Test Helpers
// ============================================

export const __testHelpers = {
  getSeedData,
  adaptToFeaturedCard,
  adaptToListingCard
  // D22/D23: 移除 createMinimalSeed（不再需要，JSON import 不會失敗）
};

export type { DBProperty, DBReview };
