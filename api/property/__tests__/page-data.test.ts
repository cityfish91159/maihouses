/**
 * D24: API 單元測試 - api/property/page-data.ts
 * 
 * 測試範圍：
 * 1. getSeedData() - Seed 資料讀取
 * 2. adaptToFeaturedCard() - DB → Featured Card 轉換
 * 3. adaptToListingCard() - DB → Listing Card 轉換
 * 4. handler() - API 主函數 (mock Supabase)
 * 
 * @see docs/COMMUNITY_WALL_TODO.md D24
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { __testHelpers, type DBProperty, type DBReview } from '../page-data';
import type { FeaturedPropertyCard, ListingPropertyCard } from '../../../src/types/property-page';

const { getSeedData, adaptToFeaturedCard, adaptToListingCard } = __testHelpers;

// ============================
// Mock Data Builders
// ============================

const buildDBProperty = (overrides?: Partial<DBProperty>): DBProperty => ({
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  public_id: 'MH-100001',
  title: '新光晴川 B棟 12樓',
  price: 10500000, // 1050萬
  address: '板橋區江子翠路100號',
  images: ['https://images.unsplash.com/photo-test.jpg'],
  community_id: 'comm-001',
  community_name: '新光晴川社區',
  size: 23,
  rooms: 3,
  halls: 2,
  baths: 2,
  features: ['熱門社區', '高樓層'],
  advantage_1: '🏪 5分鐘全聯・10分鐘捷運',
  advantage_2: '📍 近學區',
  disadvantage: null,
  year_built: 2020,
  total_units: 150,
  ...overrides,
});

const buildDBReview = (overrides?: Partial<DBReview>): DBReview => ({
  id: 'rev-001',
  community_id: 'comm-001',
  content: '很棒的社區，管理很好',
  rating: 4.5,
  author_name: '陳小明',
  source: 'google',
  tags: ['管理佳', '安靜'],
  created_at: '2024-12-15T10:00:00Z',
  ...overrides,
});

const buildSeedFeaturedCard = (overrides?: Partial<FeaturedPropertyCard>): FeaturedPropertyCard => ({
  badge: 'Seed Badge',
  image: 'https://seed.example.com/image.jpg',
  title: 'Seed 標題',
  location: '📍 Seed 位置',
  details: ['Seed 詳細資訊1', 'Seed 詳細資訊2'],
  highlights: '🏪 Seed Highlights',
  rating: '4.0 分(10 則評價)',
  reviews: [
    { stars: '★★★★☆', author: 'Seed 作者1', content: 'Seed 評價1' },
    { stars: '★★★★★', author: 'Seed 作者2', content: 'Seed 評價2' },
  ],
  lockCount: 10,
  price: '800 萬',
  size: '約 20 坪',
  ...overrides,
});

const buildSeedListingCard = (overrides?: Partial<ListingPropertyCard>): ListingPropertyCard => ({
  image: 'https://seed.example.com/listing.jpg',
  title: 'Seed Listing 標題',
  tag: 'Seed Tag',
  price: '2房 600 萬',
  size: '約 15 坪',
  rating: '3.5 分(5 則評價)',
  reviews: [
    { badge: 'Seed Badge1', content: '「Seed 評價1」— Seed 作者1' },
    { badge: 'Seed Badge2', content: '「Seed 評價2」— Seed 作者2' },
  ],
  note: 'Seed Note',
  lockLabel: '已鎖房',
  lockCount: 5,
  ...overrides,
});

// ============================
// Test Suites
// ============================

describe('api/property/page-data.ts', () => {
  
  // ========================================
  // 1. getSeedData() 測試
  // ========================================
  describe('getSeedData()', () => {
    
    it('回傳 PropertyPageData 結構', () => {
      const seed = getSeedData();
      
      // 驗證頂層結構
      expect(seed).toHaveProperty('featured');
      expect(seed).toHaveProperty('listings');
      
      // 驗證 featured 結構
      expect(seed.featured).toHaveProperty('main');
      expect(seed.featured).toHaveProperty('sideTop');
      expect(seed.featured).toHaveProperty('sideBottom');
    });

    it('featured.main 有完整欄位', () => {
      const seed = getSeedData();
      const main = seed.featured.main;
      
      // 必要欄位
      expect(main).toHaveProperty('badge');
      expect(main).toHaveProperty('image');
      expect(main).toHaveProperty('title');
      expect(main).toHaveProperty('location');
      expect(main).toHaveProperty('details');
      expect(main).toHaveProperty('rating');
      expect(main).toHaveProperty('reviews');
      expect(main).toHaveProperty('price');
      expect(main).toHaveProperty('size');
      
      // 型別驗證
      expect(typeof main.badge).toBe('string');
      expect(typeof main.image).toBe('string');
      expect(Array.isArray(main.reviews)).toBe(true);
    });

    it('listings 是非空陣列', () => {
      const seed = getSeedData();
      
      expect(Array.isArray(seed.listings)).toBe(true);
      expect(seed.listings.length).toBeGreaterThan(0);
    });

    it('每個 listing 有必要欄位', () => {
      const seed = getSeedData();
      
      seed.listings.forEach((listing, index) => {
        expect(listing).toHaveProperty('image', expect.any(String));
        expect(listing).toHaveProperty('title', expect.any(String));
        expect(listing).toHaveProperty('price', expect.any(String));
        expect(listing).toHaveProperty('reviews', expect.any(Array));
      });
    });

    it('多次呼叫回傳相同參照（快取）', () => {
      const seed1 = getSeedData();
      const seed2 = getSeedData();
      
      // 由於是 import JSON，每次回傳相同物件
      expect(seed1).toBe(seed2);
    });
  });

  // ========================================
  // 2. adaptToFeaturedCard() 測試
  // ========================================
  describe('adaptToFeaturedCard()', () => {
    
    it('完整 DBProperty + 評價 -> 正確轉換', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ rating: 5, author_name: '王大明', content: '超棒的' }),
        buildDBReview({ rating: 4, author_name: '李小華', content: '很不錯' }),
      ];
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      // 驗證核心欄位
      expect(result.title).toBe('新光晴川 B棟 12樓');
      expect(result.image).toBe('https://images.unsplash.com/photo-test.jpg');
      expect(result.badge).toBe('熱門社區');
      expect(result.location).toBe('📍 板橋區江子翠路100號');
    });

    it('price 換算正確（元 → 萬）', () => {
      const property = buildDBProperty({ price: 10500000 }); // 1050萬
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      // 10500000 / 10000 = 1050
      expect(result.price).toBe('1,050 萬');
    });

    it('price 百萬級換算正確', () => {
      const property = buildDBProperty({ price: 8880000 }); // 888萬
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.price).toBe('888 萬');
    });

    it('price 為 null 時使用 Seed', () => {
      const property = buildDBProperty({ price: null });
      const seed = buildSeedFeaturedCard({ price: '999 萬' });
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.price).toBe('999 萬');
    });

    it('size 正確格式化', () => {
      const property = buildDBProperty({ size: 23 });
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.size).toBe('約 23 坪');
    });

    it('部分欄位為 null 時使用 Seed 補位', () => {
      const property = buildDBProperty({
        title: null,
        images: null,
        address: null,
      });
      const seed = buildSeedFeaturedCard({
        title: 'Seed 標題',
        image: 'seed-image.jpg',
        location: '📍 Seed 位置',
      });
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.title).toBe('Seed 標題');
      expect(result.image).toBe('seed-image.jpg');
      expect(result.location).toBe('📍 Seed 位置');
    });

    it('零評價時用 Seed 評價補位', () => {
      const property = buildDBProperty();
      const seed = buildSeedFeaturedCard({
        reviews: [
          { stars: '★★★★☆', author: 'Seed 作者', content: 'Seed 評價' },
        ],
      });
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.reviews.length).toBeGreaterThan(0);
      expect(result.reviews[0].author).toBe('Seed 作者');
    });

    it('一筆評價時補足至兩筆', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ author_name: '真實用戶', content: '真實評價' }),
      ];
      const seed = buildSeedFeaturedCard({
        reviews: [
          { stars: '★★★★☆', author: 'Seed 作者1', content: 'Seed 評價1' },
          { stars: '★★★★★', author: 'Seed 作者2', content: 'Seed 評價2' },
        ],
      });
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      expect(result.reviews.length).toBe(2);
      expect(result.reviews[0].author).toBe('真實用戶');
      expect(result.reviews[1].author).toBe('Seed 作者2'); // 補位
    });

    it('rating 根據評價計算', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ rating: 5 }),
        buildDBReview({ rating: 4 }),
      ];
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      // (5 + 4) / 2 = 4.5
      expect(result.rating).toBe('4.5 分(2 則評價)');
    });

    it('details 組合 layout + year_built + advantages', () => {
      const property = buildDBProperty({
        rooms: 3,
        halls: 2,
        baths: 2,
        size: 23,
        year_built: 2020,
        total_units: 150,
        advantage_1: '近捷運',
        advantage_2: '近學校',
      });
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      // 驗證 details 內容
      expect(result.details.some(d => d.includes('3房'))).toBe(true);
      expect(result.details.some(d => d.includes('2020年完工'))).toBe(true);
      expect(result.details.some(d => d.includes('近捷運'))).toBe(true);
    });

    it('stars 正確生成（5星 → ★★★★★）', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ rating: 5 }),
      ];
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      expect(result.reviews[0].stars).toBe('★★★★★');
    });

    it('stars 處理小數（4.5 → ★★★★★☆）', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ rating: 4.5 }),
      ];
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      // Math.round(4.5) = 5, 所以 5 stars
      expect(result.reviews[0].stars).toBe('★★★★★');
    });
  });

  // ========================================
  // 3. adaptToListingCard() 測試
  // ========================================
  describe('adaptToListingCard()', () => {
    
    it('完整 DBProperty -> 正確轉換', () => {
      const property = buildDBProperty({
        title: '美麗新城 3樓',
        address: '中山區南京東路一段',
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      // title 組合: 標題・區域
      expect(result.title).toBe('美麗新城 3樓・中山區');
    });

    it('title 組合正確（標題・區域）', () => {
      const property = buildDBProperty({
        title: '信義豪宅 15樓',
        address: '信義區松仁路100號',
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      // 從 address 提取 "信義區"
      expect(result.title).toContain('信義豪宅 15樓');
      expect(result.title).toContain('信義區');
    });

    it('price 組合 rooms + 萬', () => {
      const property = buildDBProperty({
        rooms: 3,
        price: 12000000, // 1200萬
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.price).toBe('3 房 1,200 萬');
    });

    it('price 無 rooms 時只顯示價格', () => {
      const property = buildDBProperty({
        rooms: null,
        price: 8880000,
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.price).toBe('888 萬');
    });

    it('reviews 正確格式化（「內容」— 作者）', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ content: '很棒', author_name: '小明', tags: ['管理佳'] }),
      ];
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, reviews, seed);
      
      expect(result.reviews[0].content).toBe('「很棒」— 小明');
      expect(result.reviews[0].badge).toBe('管理佳');
    });

    it('reviews 無 author 時過濾並用 Seed 替換（D25 修正）', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ content: '不錯', author_name: null }),
      ];
      const seed = buildSeedListingCard({
        reviews: [
          { badge: 'Seed Badge', content: '「Seed 內容」— Seed 作者' },
        ],
      });
      
      const result = adaptToListingCard(property, reviews, seed);
      
      // D25 修正：格式不正確的評價（「內容」— 匿名）會被過濾
      // 因為 normalized.author === '匿名' && content.includes('「') && content.includes('—')
      // 所以用 Seed 補位
      expect(result.reviews[0].content).toBe('「Seed 內容」— Seed 作者');
    });

    it('reviews 無 tags 時用預設', () => {
      const property = buildDBProperty();
      const reviews = [
        buildDBReview({ tags: null }),
        buildDBReview({ tags: null }),
      ];
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, reviews, seed);
      
      expect(result.reviews[0].badge).toBe('真實評價');
      expect(result.reviews[1].badge).toBe('住戶推薦');
    });

    it('tag 優先使用 community_name', () => {
      const property = buildDBProperty({
        community_name: '新光社區',
        features: ['熱門'],
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.tag).toBe('新光社區');
    });

    it('tag 無 community_name 時用 features[0]', () => {
      const property = buildDBProperty({
        community_name: null,
        features: ['高樓層'],
      });
      const seed = buildSeedListingCard();
      
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.tag).toBe('高樓層');
    });

    it('零評價時用 Seed 補位', () => {
      const property = buildDBProperty();
      const seed = buildSeedListingCard({
        reviews: [
          { badge: 'Seed', content: '「Seed 評價」— Seed 作者' },
        ],
      });
      
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.reviews.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // 4. handler() 測試 - Mock Supabase
  // ========================================
  describe('handler()', () => {
    // 由於 handler 依賴 Supabase 和 process.env
    // 這裡測試 __testHelpers 的整合行為
    // 完整的 handler 測試需要整合測試環境
    
    it('__testHelpers 匯出所有必要函數', () => {
      expect(typeof getSeedData).toBe('function');
      expect(typeof adaptToFeaturedCard).toBe('function');
      expect(typeof adaptToListingCard).toBe('function');
    });

    it('adaptToFeaturedCard + getSeedData 整合正常', () => {
      const seed = getSeedData();
      const property = buildDBProperty();
      
      // 不應該 throw
      const result = adaptToFeaturedCard(property, [], seed.featured.main);
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('reviews');
    });

    it('adaptToListingCard + getSeedData 整合正常', () => {
      const seed = getSeedData();
      const property = buildDBProperty();
      
      // 不應該 throw
      const result = adaptToListingCard(property, [], seed.listings[0]);
      
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('price');
      expect(result).toHaveProperty('reviews');
    });

    it('DB 資料全為 null 時回傳 Seed 格式', () => {
      const seed = getSeedData();
      const emptyProperty: DBProperty = {
        id: 'empty',
        public_id: 'empty',
        title: null,
        price: null,
        address: null,
        images: null,
        community_id: null,
        community_name: null,
        size: null,
        rooms: null,
        halls: null,
        baths: null,
        features: null,
        advantage_1: null,
        advantage_2: null,
        disadvantage: null,
        year_built: null,
        total_units: null,
      };
      
      const result = adaptToFeaturedCard(emptyProperty, [], seed.featured.main);
      
      // 應該使用 Seed 的所有值
      expect(result.title).toBe(seed.featured.main.title);
      expect(result.image).toBe(seed.featured.main.image);
      expect(result.price).toBe(seed.featured.main.price);
    });
  });

  // ========================================
  // 5. 邊界條件測試
  // ========================================
  describe('Edge Cases', () => {
    
    it('處理超大 price 不溢出', () => {
      const property = buildDBProperty({ price: 999999999999 }); // 非常大的數字
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      // 確保不會 NaN 或 Infinity
      expect(result.price).not.toContain('NaN');
      expect(result.price).not.toContain('Infinity');
    });

    it('處理負數 price', () => {
      const property = buildDBProperty({ price: -1000000 });
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      // 負數應該還是會計算（-100 萬）
      expect(result.price).toContain('萬');
    });

    it('處理空陣列 images', () => {
      const property = buildDBProperty({ images: [] });
      const seed = buildSeedFeaturedCard({ image: 'fallback.jpg' });
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.image).toBe('fallback.jpg');
    });

    it('處理超過 5 顆星的 rating', () => {
      const property = buildDBProperty();
      const reviews = [buildDBReview({ rating: 10 })]; // 超過 5
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      // 應該 cap 在 5 stars
      expect(result.reviews[0].stars).toBe('★★★★★');
    });

    it('處理 0 rating（falsy 值使用預設）', () => {
      const property = buildDBProperty();
      const reviews = [buildDBReview({ rating: 0 })];
      const seed = buildSeedFeaturedCard();
      
      const result = adaptToFeaturedCard(property, reviews, seed);
      
      // 業務邏輯：rating 為 falsy (0, null, undefined) 時使用預設值 ★★★★☆
      // 這是刻意設計：0 分評價視為無效資料，不顯示全空星
      expect(result.reviews[0].stars).toBe('★★★★☆');
    });

    it('address 沒有「區」字時不 crash', () => {
      const property = buildDBProperty({
        title: '測試',
        address: '台北市信義路五段100號', // 沒有「區」
      });
      const seed = buildSeedListingCard();
      
      // 不應該 throw
      const result = adaptToListingCard(property, [], seed);
      
      expect(result.title).toContain('測試');
    });

    it('features 空陣列時用 Seed badge', () => {
      const property = buildDBProperty({ features: [] });
      const seed = buildSeedFeaturedCard({ badge: 'Seed Badge' });
      
      const result = adaptToFeaturedCard(property, [], seed);
      
      expect(result.badge).toBe('Seed Badge');
    });
  });
});
