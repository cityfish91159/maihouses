/**
 * 共用 CORS 設定模組
 *
 * 統一管理所有 API 端點的 CORS 設定
 * 避免重複定義，確保行為一致
 *
 * @example
 * ```typescript
 * import { cors } from "../lib/cors";
 *
 * export default async function handler(req, res) {
 *   cors(req, res);
 *   if (req.method === "OPTIONS") {
 *     res.status(200).end();
 *     return;
 *   }
 *   // ...
 * }
 * ```
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

// ============================================================================
// Constants
// ============================================================================

/**
 * 允許的 Origin 列表
 * - 生產環境：maihouses.com, maihouses.vercel.app
 * - 開發環境：localhost:5173, 127.0.0.1:5173
 */
const ALLOWED_ORIGINS = [
  "https://maihouses.com",
  "https://maihouses.vercel.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
] as const;

/**
 * 預設 Origin（當請求來源不在白名單時使用）
 */
const DEFAULT_ORIGIN = "https://maihouses.com";

/**
 * 允許的 HTTP 方法
 */
const ALLOWED_METHODS = "GET, POST, PUT, PATCH, DELETE, OPTIONS";

/**
 * 允許的 Headers
 */
const ALLOWED_HEADERS = "Content-Type, Authorization, x-system-key";

// ============================================================================
// CORS Function
// ============================================================================

/**
 * 設定 CORS Headers
 *
 * 使用類型守衛確保類型安全（NASA TypeScript Safety）
 *
 * @param req - Vercel 請求物件
 * @param res - Vercel 回應物件
 */
export function cors(req: VercelRequest, res: VercelResponse): void {
  // [NASA TypeScript Safety] 使用類型守衛取代 as string
  const rawOrigin = req?.headers?.origin;
  const origin = typeof rawOrigin === "string" ? rawOrigin : undefined;

  // 設定 Access-Control-Allow-Origin
  if (origin && (ALLOWED_ORIGINS as readonly string[]).includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader("Access-Control-Allow-Origin", DEFAULT_ORIGIN);
  }

  // 設定其他 CORS Headers
  res.setHeader("Access-Control-Allow-Methods", ALLOWED_METHODS);
  res.setHeader("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  res.setHeader("Access-Control-Allow-Credentials", "true");
}

// ============================================================================
// Export
// ============================================================================

export default cors;
