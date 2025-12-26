/**
 * 時間工具函數 - 統一使用台灣時間（UTC+8）
 */

/**
 * 獲取台灣時間（UTC+8）的小時數
 */
export function getTaiwanHour(): number {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const taiwanTime = new Date(utc + (8 * 3600000));
  return taiwanTime.getHours();
}

/**
 * 獲取台灣時間的 Date 物件
 */
export function getTaiwanDate(): Date {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (8 * 3600000));
}
