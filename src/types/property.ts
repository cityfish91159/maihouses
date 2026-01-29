/**
 * 🏠 Property Types - 單一真理來源
 *
 * P10 Phase 3 審查修正 #2: 型別定義集中化
 * 所有 property 相關的型別定義都在此檔案
 *
 * @see docs/COMMUNITY_WALL_TODO.md - P3 審查報告
 */

/**
 * 房源評價
 */
export interface PropertyReview {
  avatar: string;
  name: string;
  role: string;
  tag: string;
  text: string;
}

/**
 * 首頁房源卡片資料
 *
 * 用於：
 * - PropertyCard 組件
 * - PropertyGrid 組件
 * - getFeaturedProperties() Service
 * - /api/home/featured-properties API
 */
export interface FeaturedProperty {
  /** ID: UUID (真實房源) 或 number (Seed) */
  id: string | number;
  /** 封面圖片 URL (強制 4:3 裁切) */
  image: string;
  /** 左上角標籤 (如 "捷運 5 分鐘") */
  badge: string;
  /** 標題 (如 "新板特區｜三房含車位") */
  title: string;
  /** 特色標籤 (如 ["34.2 坪", "3 房 2 廳"]) */
  tags: string[];
  /** 價格 (已格式化，如 "1,288") */
  price: string;
  /** 地點 (如 "新北市板橋區 · 中山路一段") */
  location: string;
  /** 評價列表 */
  reviews: PropertyReview[];
  /** 資料來源: 'real' (真實) | 'seed' (Seed/Mock) */
  source: 'real' | 'seed';
}

/**
 * Seed 房源資料 (前端靜態 Mock)
 *
 * 與 FeaturedProperty 相同，但 source 固定為 'seed'
 * 用於 src/constants/data.ts 的 PROPERTIES 常數
 */
export type SeedProperty = Omit<FeaturedProperty, 'source'> & {
  source: 'seed';
};
