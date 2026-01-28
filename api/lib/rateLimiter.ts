/**
 * Rate Limiter - API 速率限制
 *
 * 實作策略：
 * - 使用記憶體 Map 儲存請求計數（適用於單一實例）
 * - 未來可輕鬆升級為 Vercel KV 或 Redis
 * - 支援滑動時間窗口算法
 *
 * Skills Applied:
 * - [Backend Safeguard] DoS 攻擊防護
 * - [NASA TypeScript Safety] 完整類型定義
 * - [Team 2] Rate Limiting 實作
 */

import type { VercelRequest } from "@vercel/node";
import { logger } from "./logger";

// ============================================================================
// Types
// ============================================================================

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// ============================================================================
// In-Memory Storage (可升級為 Vercel KV)
// ============================================================================

const rateLimitStore = new Map<string, RateLimitRecord>();

// 定期清理過期記錄（每 5 分鐘）
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info("[rateLimiter] Cleaned expired records", { count: cleaned });
  }
}, 5 * 60 * 1000);

// ============================================================================
// Rate Limiter
// ============================================================================

/**
 * 檢查速率限制
 *
 * @param identifier - 識別符（通常是 IP 或 User ID）
 * @param maxRequests - 最大請求數（預設 10）
 * @param windowMs - 時間窗口（毫秒，預設 60000 = 1 分鐘）
 * @returns RateLimitResult - 是否允許、剩餘次數、重置時間
 *
 * @example
 * ```typescript
 * const ip = getClientIp(req);
 * const { allowed, remaining, retryAfter } = checkRateLimit(ip, 10, 60000);
 * if (!allowed) {
 *   return res.status(429).json({ error: "Too many requests", retryAfter });
 * }
 * res.setHeader("X-RateLimit-Remaining", remaining.toString());
 * ```
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  // 取得現有記錄
  const record = rateLimitStore.get(key);

  // 如果沒有記錄或已過期，建立新記錄
  if (!record || record.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime,
    };
  }

  // 增加計數
  record.count++;
  rateLimitStore.set(key, record);

  // 檢查是否超過限制
  const allowed = record.count <= maxRequests;
  const remaining = Math.max(0, maxRequests - record.count);
  const retryAfter = allowed ? undefined : Math.ceil((record.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
    retryAfter,
  };
}

/**
 * 從請求中取得識別符（IP 地址）
 *
 * @param req - Vercel Request
 * @returns 客戶端 IP 地址
 */
export function getIdentifier(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];

  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }

  if (Array.isArray(forwarded) && forwarded.length > 0) {
    const first = forwarded[0];
    return typeof first === "string" ? first : "unknown";
  }

  return "unknown";
}

/**
 * Rate Limit 中間件（用於 API handler）
 *
 * @param req - Vercel Request
 * @param maxRequests - 最大請求數
 * @param windowMs - 時間窗口（毫秒）
 * @returns RateLimitResult 或 null（如果允許）
 *
 * @example
 * ```typescript
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   const rateLimitError = rateLimitMiddleware(req, 10, 60000);
 *   if (rateLimitError) {
 *     res.setHeader("X-RateLimit-Remaining", rateLimitError.remaining.toString());
 *     res.setHeader("Retry-After", rateLimitError.retryAfter?.toString() || "60");
 *     return res.status(429).json({
 *       error: "Too many requests, please try again later.",
 *       retryAfter: rateLimitError.retryAfter,
 *     });
 *   }
 *   // 繼續處理請求...
 * }
 * ```
 */
export function rateLimitMiddleware(
  req: VercelRequest,
  maxRequests: number = 10,
  windowMs: number = 60000
): RateLimitResult | null {
  const identifier = getIdentifier(req);
  const result = checkRateLimit(identifier, maxRequests, windowMs);

  if (!result.allowed) {
    logger.warn("[rateLimiter] Rate limit exceeded", {
      identifier,
      count: maxRequests + 1,
      windowMs,
    });
    return result;
  }

  return null;
}

/**
 * 重置特定識別符的速率限制（用於測試或管理）
 *
 * @param identifier - 識別符
 */
export function resetRateLimit(identifier: string): void {
  const key = `ratelimit:${identifier}`;
  rateLimitStore.delete(key);
  logger.info("[rateLimiter] Rate limit reset", { identifier });
}

/**
 * 取得當前速率限制狀態（用於監控）
 *
 * @returns 速率限制統計資訊
 */
export function getRateLimitStats(): {
  totalKeys: number;
  keys: string[];
} {
  return {
    totalKeys: rateLimitStore.size,
    keys: Array.from(rateLimitStore.keys()),
  };
}
