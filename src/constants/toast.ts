/**
 * Toast 通知持續時間規範
 *
 * @remarks
 * - ERROR: 6000ms - 錯誤訊息需要更多時間閱讀
 * - WARNING: 5000ms - 警告需要用戶決策
 * - SUCCESS: 3000ms - 成功通知僅需短時間
 * - INFO: 4000ms - 一般資訊提示
 */
export const TOAST_DURATION = {
  ERROR: 6000,
  WARNING: 5000,
  SUCCESS: 3000,
  INFO: 4000,
} as const;
