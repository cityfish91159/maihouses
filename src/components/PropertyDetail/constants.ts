// LINE 官方品牌色（不可替換為通用 token）
export const LINE_BRAND_GREEN = 'var(--mh-color-06c755)';
export const LINE_BRAND_GREEN_HOVER = 'var(--mh-color-05b04a)';

// LINE ID 驗證規則（可選 @ 前綴；英數、底線、連字號、點；3-64 字元）
export const LINE_ID_PATTERN = /^@?[a-zA-Z0-9._-]{3,64}$/;

// 電話號碼數字長度邊界（E.164 範圍內的保守值）
export const PHONE_DIGITS_MIN = 7;
export const PHONE_DIGITS_MAX = 15;

// CommunityReviews 相關常數
export const INTERSECTION_THRESHOLD = 0.1;
export const MOCK_TOTAL_REVIEWS = 12;
export const REVIEW_KEY_PREVIEW_LENGTH = 12;

// Panel 相關常數
export const PANEL_SKELETON_DELAY_MS = 300;

// 台灣手機號碼相關常數
export const TAIWAN_MOBILE_PATTERN = /^09\d{8}$/;
export const TW_MOBILE_FORMAT = {
  AREA_CODE_END: 4,
  PREFIX_END: 7,
} as const;
