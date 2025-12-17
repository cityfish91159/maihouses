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
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  type FeaturedPropertyCard,
  type ListingPropertyCard,
  type PropertyPageData,
  type FeaturedReview,
  type ListingReview,
  normalizeFeaturedReview,
  normalizeListingReview
} from '../../src/types/property-page';

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
// Seed Data Loader
// ============================================

let _seedData: PropertyPageData | null = null;
function getSeedData(): PropertyPageData {
  if (!_seedData) {
    try {
      const seedPath = resolve(__dirname, '../../public/data/seed-property-page.json');
      const raw = readFileSync(seedPath, 'utf8');
      const parsed = JSON.parse(raw);
      _seedData = parsed.default as PropertyPageData;
    } catch {
      // Fallback: 如果檔案讀取失敗，使用最小 Mock
      _seedData = createMinimalSeed();
    }
  }
  return _seedData;
}

// 最小 Seed (檔案讀取失敗時的保底)
function createMinimalSeed(): PropertyPageData {
  const minimalFeaturedReview: FeaturedReview = {
    stars: '★★★★☆',
    author: '系統',
    content: '資料載入中...'
  };
  
  const minimalCard: FeaturedPropertyCard = {
    badge: '載入中',
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    title: '資料載入中...',
    location: '請稍候',
    details: ['載入中...'],
    rating: '- 分',
    reviews: [minimalFeaturedReview],
    lockCount: 0,
    price: '- 萬',
    size: '- 坪'
  };

  const minimalListing: ListingPropertyCard = {
    image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    title: '載入中...',
    tag: '-',
    price: '- 萬',
    size: '- 坪',
    rating: '- 分',
    reviews: [{ badge: '載入中', content: '資料載入中...' }],
    note: '請稍候',
    lockLabel: '-',
    lockCount: 0
  };

  return {
    featured: {
      main: minimalCard,
      sideTop: minimalCard,
      sideBottom: minimalCard
    },
    listings: [minimalListing]
  };
}

// ============================================
// DB Types
// ============================================

interface DBProperty {
  id: string;
  public_id: string;
  title: string | null;
  price: number | null;
  address: string | null;
  images: string[] | null;
  community_id: string | null;
  community_name: string | null;
  size: number | null;
  rooms: number | null;
  halls: number | null;
  baths: number | null;
  features: string[] | null;
  advantage_1: string | null;
  advantage_2: string | null;
  disadvantage: string | null;
  year_built: number | null;
  total_units: number | null;
}

interface DBReview {
  id: string;
  community_id: string;
  content: string | null;
  rating: number | null;
  author_name: string | null;
  source: string | null;
  tags: string[] | null;
  created_at: string;
}

// ============================================
// Adapter Functions
// ============================================

/**
 * 將 DB 房源轉為 Featured Card 格式
 */
function adaptToFeaturedCard(
  property: DBProperty,
  reviews: DBReview[],
  seed: FeaturedPropertyCard
): FeaturedPropertyCard {
  // 圖片處理
  const image = property.images?.[0] || seed.image;
  
  // 詳細資訊
  const details: string[] = [];
  if (property.rooms || property.halls || property.baths) {
    const layout = [
      property.rooms ? `${property.rooms}房` : '',
      property.halls ? `${property.halls}廳` : '',
      property.baths ? `${property.baths}衛` : ''
    ].filter(Boolean).join('');
    const sizeInfo = property.size ? `室內 ${property.size}坪` : '';
    details.push([layout, sizeInfo].filter(Boolean).join(' + '));
  }
  if (property.year_built) {
    details.push(`🏢 ${property.year_built}年完工${property.total_units ? `・${property.total_units}戶` : ''}`);
  }
  if (property.advantage_1) {
    details.push(property.advantage_1);
  }
  if (property.advantage_2) {
    details.push(property.advantage_2);
  }

  // 評價轉換 - 使用 adapter
  const adaptedReviews: FeaturedReview[] = reviews.slice(0, 2).map(r => ({
    stars: r.rating ? '★'.repeat(Math.min(5, Math.round(r.rating))) + '☆'.repeat(5 - Math.min(5, Math.round(r.rating))) : '★★★★☆',
    author: r.author_name || '匿名用戶',
    tags: r.tags || undefined,
    content: r.content || '好評推薦'
  }));

  // 補位：如果評價不足，用 Seed 補
  while (adaptedReviews.length < 2 && seed.reviews.length > adaptedReviews.length) {
    adaptedReviews.push(seed.reviews[adaptedReviews.length]);
  }

  // 驗證 adapter 輸出
  adaptedReviews.forEach(r => {
    const normalized = normalizeFeaturedReview(r);
    // FeaturedReview 必須有 author 和 content
    if (!normalized.author || !normalized.content) {
      console.warn('[API] normalizeFeaturedReview 缺少必要欄位:', { author: normalized.author, content: normalized.content });
    }
  });

  return {
    badge: property.features?.[0] || seed.badge,
    image,
    title: property.title || seed.title,
    location: property.address ? `📍 ${property.address}` : seed.location,
    details: details.length > 0 ? details : seed.details,
    highlights: seed.highlights, // 保留 Seed 的 highlights
    rating: reviews.length > 0 
      ? `${(reviews.reduce((sum, r) => sum + (r.rating || 4), 0) / reviews.length).toFixed(1)} 分(${reviews.length} 則評價)`
      : seed.rating,
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

  // 評價轉換 - 使用 adapter
  const adaptedReviews: ListingReview[] = reviews.slice(0, 2).map((r, i) => ({
    badge: r.tags?.[0] || (i === 0 ? '真實評價' : '住戶推薦'),
    content: r.content 
      ? `「${r.content}」— ${r.author_name || '匿名'}`
      : seed.reviews[i]?.content || '好評推薦'
  }));

  // 補位
  while (adaptedReviews.length < 2 && seed.reviews.length > adaptedReviews.length) {
    adaptedReviews.push(seed.reviews[adaptedReviews.length]);
  }

  // 驗證 adapter 輸出
  adaptedReviews.forEach(r => {
    const normalized = normalizeListingReview(r);
    // ListingReview 的 author 從 content 解析，若格式不對會是 '匿名'
    // content 若格式不對會是原始 content
    if (normalized.author === '匿名' && r.content.includes('「')) {
      console.warn('[API] normalizeListingReview 解析失敗，content 格式可能不符:', r.content);
    }
  });

  // 房型標籤
  const roomLabel = property.rooms ? `${property.rooms} 房` : '';
  const priceLabel = property.price ? `${Math.round(property.price / 10000).toLocaleString()} 萬` : seed.price;

  return {
    image,
    title: property.title 
      ? `${property.title}・${property.address?.split('區')[0]}區` 
      : seed.title,
    tag: property.community_name || property.features?.[0] || seed.tag,
    price: roomLabel ? `${roomLabel} ${priceLabel}` : priceLabel,
    size: property.size ? `約 ${property.size} 坪` : seed.size,
    rating: reviews.length > 0
      ? `${(reviews.reduce((sum, r) => sum + (r.rating || 4), 0) / reviews.length).toFixed(1)} 分(${reviews.length} 則評價)`
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
  // CORS
  const allowedOrigins = [
    'https://maihouses.vercel.app',
    'https://cityfish91159.github.io',
    'http://localhost:5173',
    'http://localhost:4173'
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  // Cache: 60秒 CDN 快取 + 5分鐘 stale-while-revalidate
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const seed = getSeedData();

  try {
    // 1. 撈取房源 (11筆: 3 featured + 8 listings)
    const { data: properties, error: propError } = await getSupabase()
      .from('properties')
      .select(`
        id, public_id, title, price, address, images,
        community_id, community_name, size, rooms, halls, baths,
        features, advantage_1, advantage_2, disadvantage,
        year_built, total_units
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
      const { data: reviews, error: revError } = await getSupabase()
        .from('community_reviews')
        .select('id, community_id, content, rating, author_name, source, tags, created_at')
        .in('community_id', communityIds)
        .order('created_at', { ascending: false });

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
    // 錯誤時回傳 Seed (不回 500)
    console.error('[API] Error, falling back to seed:', error);
    
    return res.status(200).json({
      success: false,
      data: seed,
      error: error instanceof Error ? error.message : 'Unknown error',
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
  adaptToListingCard,
  createMinimalSeed
};

export type { DBProperty, DBReview };
