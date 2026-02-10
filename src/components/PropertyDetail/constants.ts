// LINE 官方品牌色（不可替換為通用 token）
export const LINE_BRAND_GREEN = '#06C755';
export const LINE_BRAND_GREEN_HOVER = '#05B04A';

// LINE ID 驗證規則（可選 @ 前綴；英數、底線、連字號、點；3-64 字元）
export const LINE_ID_PATTERN = /^@?[a-zA-Z0-9._-]{3,64}$/;

// 電話號碼數字長度邊界（E.164 範圍內的保守值）
export const PHONE_DIGITS_MIN = 7;
export const PHONE_DIGITS_MAX = 15;
