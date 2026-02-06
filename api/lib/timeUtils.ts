/**
 * 時間工具函數 - 統一使用台灣時間（UTC+8）
 */

/**
 * 獲取台灣時間（UTC+8）的小時數
 * 直接使用 UTC 時間加 8 小時
 */
export function getTaiwanHour(): number {
  const now = new Date();
  const utcHour = now.getUTCHours();
  const taiwanHour = (utcHour + 8) % 24;
  return taiwanHour;
}

/**
 * 獲取台灣時間的 Date 物件
 * 返回表示台灣時間的 Date（但仍然是 UTC timestamp）
 */
export function getTaiwanDate(): Date {
  const now = new Date();
  // 獲取 UTC 毫秒數，加上 8 小時
  const taiwanTimestamp = now.getTime() + 8 * 3600000;
  return new Date(taiwanTimestamp);
}
