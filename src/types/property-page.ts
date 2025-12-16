/**
 * Property Page Types - 單一真理來源
 * 
 * P11 房源列表頁混合動力架構
 * 用於：
 * - public/property.html 前端渲染
 * - api/property/page-data.ts 後端 API
 * - public/data/seed-property-page.json Seed 資料
 * 
 * @see docs/COMMUNITY_WALL_TODO.md - P11 工單
 */

/**
 * 精選房源評價 (Featured Review)
 * 用於精選區塊的詳細評價
 */
export interface FeaturedReview {
  /** 星級評分 (如 "★★★★★") */
  stars: string;
  /** 評價者 (如 "M*** ・ B棟住戶") */
  author: string;
  /** 標籤 (如 ["#物業/管理", "#安靜"]) - 僅 main 卡片有 */
  tags?: string[];
  /** 評價內容 */
  content: string;
}

/**
 * 精選房源卡片 (Featured Property Card)
 * 用於頁面頂部的大卡片 (main) 和側邊卡片 (sideTop, sideBottom)
 */
export interface FeaturedPropertyCard {
  /** 標籤 (如 "熱門社區", "高評價", "新上架") */
  badge: string;
  /** 封面圖片 URL */
  image: string;
  /** 標題 (如 "新光晴川 B棟 12樓") */
  title: string;
  /** 地點 (如 "📍 板橋區・江子翠生活圈") */
  location: string;
  /** 詳細資訊列表 */
  details: string[];
  /** 亮點 (僅 main 卡片有) */
  highlights?: string;
  /** 評分 (如 "4.4 分(63 則評價)") */
  rating: string;
  /** 評價列表 */
  reviews: FeaturedReview[];
  /** 鎖定評價數量 */
  lockCount: number;
  /** 價格 (如 "1,050 萬") */
  price: string;
  /** 坪數 (如 "約 23 坪") */
  size: string;
}

/**
 * 精選房源區塊 (Featured Section)
 */
export interface FeaturedSection {
  /** 主卡片 (大) */
  main: FeaturedPropertyCard;
  /** 側邊上方卡片 */
  sideTop: FeaturedPropertyCard;
  /** 側邊下方卡片 */
  sideBottom: FeaturedPropertyCard;
}

/**
 * 列表房源評價 (Listing Review)
 * 用於列表卡片的簡短評價
 */
export interface ListingReview {
  /** 標籤 (如 "內湖區第1名", "影片房源") */
  badge: string;
  /** 評價內容 */
  content: string;
}

/**
 * 列表房源卡片 (Listing Property Card)
 * 用於頁面下方的房源列表
 */
export interface ListingPropertyCard {
  /** 封面圖片 URL */
  image: string;
  /** 標題 (如 "冠德美麗大直・中山區") */
  title: string;
  /** 標籤 (如 "捷運劍南路站") */
  tag: string;
  /** 價格 (如 "4 房 3,980 萬") */
  price: string;
  /** 坪數 (如 "約 45 坪") */
  size: string;
  /** 評分 (如 "4.5 分(92 則評價)・豪宅精選") */
  rating: string;
  /** 評價列表 */
  reviews: ListingReview[];
  /** 備註 */
  note: string;
  /** 鎖定標籤 (如 "豪宅住戶真實評價") */
  lockLabel: string;
  /** 鎖定評價數量 */
  lockCount: number;
}

/**
 * 房源列表頁完整資料 (Property Page Data)
 * API 回傳格式：{ success: boolean, data: PropertyPageData }
 */
export interface PropertyPageData {
  /** 精選區塊 */
  featured: FeaturedSection;
  /** 列表區塊 */
  listings: ListingPropertyCard[];
}

/**
 * API 回應格式
 */
export interface PropertyPageAPIResponse {
  /** 是否成功 */
  success: boolean;
  /** 資料 (成功或失敗都會有，失敗時為 Seed) */
  data: PropertyPageData;
}
