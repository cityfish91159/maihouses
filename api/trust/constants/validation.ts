/**
 * Trust Flow 共用驗證常數
 *
 * 集中管理 LINE User ID、案件狀態、URL 等常數定義
 * 確保所有 API Handler 和 Service 使用一致的驗證邏輯
 *
 * 被引用：
 * - api/trust/my-cases.ts
 * - api/trust/services/case-query.ts
 * - api/trust/notify.ts
 * - api/trust/send-notification.ts
 */

import { z } from "zod";

// ============================================================================
// LINE User ID 驗證
// ============================================================================

/**
 * LINE User ID 格式：U + 32 個十六進位字元（支援大小寫）
 *
 * LINE 官方文檔指出 User ID 使用十六進位字元，實務上可能出現大寫字母。
 * @see https://developers.line.biz/en/docs/messaging-api/getting-user-ids/
 *
 * 範例：U1234567890abcdef1234567890ABCDEF
 */
export const LINE_USER_ID_REGEX = /^U[a-fA-F0-9]{32}$/;

/**
 * LINE User ID Zod Schema
 *
 * 用於 API 參數驗證
 */
export const LineUserIdSchema = z.string().regex(LINE_USER_ID_REGEX, {
  message: "LINE User ID 格式錯誤，應為 U + 32 個十六進位字元",
});

// ============================================================================
// Trust Room URL
// ============================================================================

/**
 * Trust Room 基礎 URL
 *
 * 用於生成案件詳情頁面連結
 */
export const TRUST_ROOM_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://maihouses.vercel.app";

/**
 * Trust Room 路徑模板
 *
 * 用於組合完整 Trust Room URL
 * 完整 URL = TRUST_ROOM_BASE_URL + TRUST_ROOM_PATH_PREFIX + caseId
 */
export const TRUST_ROOM_PATH_PREFIX = "/maihouses/#/trust-room/";

// ============================================================================
// 案件狀態
// ============================================================================

/**
 * 可查詢的案件狀態（active/dormant，不含 closed）
 *
 * - active: 進行中的案件
 * - dormant: 暫停中的案件
 */
export const ACTIVE_STATUSES = ["active", "dormant"] as const;

/**
 * 案件狀態類型
 */
export type ActiveStatus = (typeof ACTIVE_STATUSES)[number];
