import { Grade } from './types/uag.types';

// ============================================================================
// UAG 系統配置 (SSOT - Single Source of Truth)
// ============================================================================

/**
 * 響應式斷點
 */
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

/**
 * 客戶等級保護時效（小時）
 * 定義：購買客戶後，其他房仲無法查看聯絡資訊的時間
 *
 * - S 級：72 小時獨家聯絡權（3 天）
 * - A 級：48 小時（2 天）
 * - B 級：24 小時（1 天）
 * - C 級：12 小時
 * - F 級：無保護
 */
export const GRADE_PROTECTION_HOURS: Record<Grade, number> = {
  S: 72,
  A: 48,
  B: 24,
  C: 12,
  F: 0,
} as const;

/**
 * 客戶購買價格（點數）
 * 定義：購買不同等級客戶所需的點數成本
 *
 * - S 級：500 點（最高意願，已點擊 LINE/電話）
 * - A 級：300 點（高度興趣，深度瀏覽 ≥90s + 滾動 ≥80%）
 * - B 級：150 點（中度興趣 ≥60s）
 * - C 級：80 點（輕度興趣 ≥20s）
 * - F 級：20 點（路過）
 */
export const GRADE_PRICE: Record<Grade, number> = {
  S: 500,
  A: 300,
  B: 150,
  C: 80,
  F: 20,
} as const;

/**
 * FEED-01 Phase 8: Feed 貼文標題預覽長度
 * 定義：社區牆貼文在 UAG 信息流中顯示的標題截取字數
 */
export const FEED_TITLE_PREVIEW_LENGTH = 40;

/**
 * 客戶等級保護時效預設值（小時）
 * 當 grade 不在 GRADE_PROTECTION_HOURS 中時使用
 */
export const DEFAULT_PROTECTION_HOURS = 336;
