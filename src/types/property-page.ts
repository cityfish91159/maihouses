/**
 * Property Page Types - Schema-First (Zod)
 * 
 * 🔥 SSOT 單一真理來源：
 * - Schema 定義在這裡
 * - TypeScript Type 自動推斷
 * - Runtime 驗證自動生成
 * 
 * @see public/data/seed-property-page.json - Seed 資料
 * @see scripts/validate-property-types.ts - 驗證腳本
 */
import { z } from 'zod';

// ============================================
// Featured 區塊 Schema
// ============================================

/**
 * 精選評價 Schema
 * 用於 featured.main / sideTop / sideBottom
 */
export const FeaturedReviewSchema = z.object({
  stars: z.string(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  content: z.string()
});

/**
 * 精選房源卡片 Schema
 * main 卡片有 highlights，side 卡片沒有
 */
export const FeaturedPropertyCardSchema = z.object({
  badge: z.string(),
  image: z.string().url(),
  title: z.string(),
  location: z.string(),
  details: z.array(z.string()).min(1, '至少要有一項 details'),
  highlights: z.string().optional(), // 僅 main 有
  rating: z.string(),
  reviews: z.array(FeaturedReviewSchema).min(1, '至少要有一則評價'),
  lockCount: z.number().int().nonnegative(),
  price: z.string(),
  size: z.string()
});

/**
 * 精選區塊 Schema
 */
export const FeaturedSectionSchema = z.object({
  main: FeaturedPropertyCardSchema,
  sideTop: FeaturedPropertyCardSchema,
  sideBottom: FeaturedPropertyCardSchema
});

// ============================================
// Listings 區塊 Schema
// ============================================

/**
 * 列表評價 Schema
 * 結構與 FeaturedReview 不同（badge vs stars）
 */
export const ListingReviewSchema = z.object({
  badge: z.string(),
  content: z.string()
});

/**
 * 列表房源卡片 Schema
 */
export const ListingPropertyCardSchema = z.object({
  image: z.string().url(),
  title: z.string(),
  tag: z.string(),
  price: z.string(),
  size: z.string(),
  rating: z.string(),
  reviews: z.array(ListingReviewSchema).min(1, '至少要有一則評價'),
  note: z.string(),
  lockLabel: z.string(),
  lockCount: z.number().int().nonnegative()
});

// ============================================
// 完整頁面 Schema
// ============================================

/**
 * 房源列表頁完整資料 Schema
 */
export const PropertyPageDataSchema = z.object({
  featured: FeaturedSectionSchema,
  listings: z.array(ListingPropertyCardSchema).min(1, 'Listings 不能為空')
});

/**
 * Seed 檔案根結構 Schema (包含 default + test)
 */
export const SeedFileSchema = z.object({
  default: PropertyPageDataSchema,
  test: PropertyPageDataSchema.optional()
});

// ============================================
// 自動推斷 TypeScript Types
// ============================================

/** 精選評價 */
export type FeaturedReview = z.infer<typeof FeaturedReviewSchema>;

/** 精選房源卡片 */
export type FeaturedPropertyCard = z.infer<typeof FeaturedPropertyCardSchema>;

/** 精選區塊 */
export type FeaturedSection = z.infer<typeof FeaturedSectionSchema>;

/** 列表評價 */
export type ListingReview = z.infer<typeof ListingReviewSchema>;

/** 列表房源卡片 */
export type ListingPropertyCard = z.infer<typeof ListingPropertyCardSchema>;

/** 房源列表頁完整資料 */
export type PropertyPageData = z.infer<typeof PropertyPageDataSchema>;

/** Seed 檔案根結構 */
export type SeedFile = z.infer<typeof SeedFileSchema>;

// ============================================
// API 回應 Schema
// ============================================

/**
 * API 回應格式 Schema
 */
export const PropertyPageAPIResponseSchema = z.object({
  success: z.boolean(),
  data: PropertyPageDataSchema
});

/** API 回應格式 */
export type PropertyPageAPIResponse = z.infer<typeof PropertyPageAPIResponseSchema>;

// ============================================
// 統一 Review Adapter (D6 修正)
// ============================================

/**
 * 後端統一 Review 格式
 * 用於 API 回傳，前端/資料結構不變
 */
export interface NormalizedReview {
  author: string;
  content: string;
  rating?: string | undefined;
  tags?: string[] | undefined;
  badges?: string[] | undefined;
}

/**
 * Featured → Normalized 轉換
 * 
 * @see scripts/verify-seed-strict.ts (驗證 adapter 可執行並檢查輸出)
 * @see src/types/__tests__/property-page.test.ts (單元測試覆蓋)
 */
export function normalizeFeaturedReview(r: FeaturedReview): NormalizedReview {
  const result: NormalizedReview = {
    author: r.author,
    content: r.content
  };
  if (r.stars) result.rating = r.stars;
  if (r.tags) result.tags = r.tags;
  return result;
}

/**
 * Listing → Normalized 轉換
 * 從 content 解析 author（格式：「內容」— 作者 或 「內容」- 作者）
 * 
 * @see scripts/verify-seed-strict.ts (驗證 adapter 可執行並檢查輸出)
 * @see src/types/__tests__/property-page.test.ts (單元測試覆蓋)
 */
export function normalizeListingReview(r: ListingReview): NormalizedReview {
  // D21 修正：支援全形破折號 — 和半形 dash -
  const match = r.content.match(/「(.+)」[—-]\s*(.+)/);
  return {
    author: match?.[2] ?? '匿名',
    content: match?.[1] ?? r.content,
    badges: [r.badge]
  };
}
