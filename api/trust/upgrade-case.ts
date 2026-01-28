/**
 * Trust Upgrade Case API - Token 升級為已註冊用戶
 *
 * POST /api/trust/upgrade-case - 將案件從匿名 token 升級為已註冊用戶
 *
 * 使用情境：
 * - 消費者初次透過 token 進入 Trust Room（未登入）
 * - 消費者註冊/登入後，將案件綁定到自己的帳號
 *
 * Skills Applied:
 * - [Backend Safeguard] Token 驗證 + RLS 權限
 * - [NASA TypeScript Safety] 完整類型定義 + Zod 驗證
 * - [Audit Logging] 審計日誌
 * - [No Lazy Implementation] 完整錯誤處理
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { supabase, cors, logAudit, getClientIp, getUserAgent } from "./_utils";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../lib/apiResponse";
import { logger } from "../lib/logger";
import { rateLimitMiddleware } from "../lib/rateLimiter";

// ============================================================================
// Types & Schemas [NASA TypeScript Safety]
// ============================================================================

/**
 * 升級案件請求 Schema
 *
 * 必填欄位：
 * - token: 案件 token (UUID)
 * - userId: 已註冊用戶 ID
 * - userName: 用戶名稱（用於更新 buyer_name）
 */
const UpgradeCaseRequestSchema = z.object({
  token: z.string().uuid("Token 格式錯誤，必須是有效的 UUID"),
  userId: z.string().uuid("用戶 ID 格式錯誤"),
  userName: z
    .string()
    .min(1, "用戶名稱不可為空")
    .max(50, "用戶名稱不可超過 50 字")
    .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, "用戶名稱僅能包含中英文"),
});
type UpgradeCaseRequest = z.infer<typeof UpgradeCaseRequestSchema>;

/**
 * RPC 函數回應 Schema
 */
const UpgradeCaseResultSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  error: z.string().optional(),
});
type UpgradeCaseResult = z.infer<typeof UpgradeCaseResultSchema>;

// ============================================================================
// Handler [NASA TypeScript Safety]
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res
      .status(405)
      .json(
        errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, "只允許 POST 請求")
      );
    return;
  }

  // [Team 2 修復] Rate Limiting (5 requests per minute)
  const rateLimitError = rateLimitMiddleware(req, 5, 60000);
  if (rateLimitError) {
    res.setHeader("X-RateLimit-Remaining", rateLimitError.remaining.toString());
    res.setHeader("Retry-After", rateLimitError.retryAfter?.toString() || "60");
    return void res.status(429).json(
      errorResponse(
        API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
        "請求過於頻繁，請稍後再試",
        { retryAfter: rateLimitError.retryAfter }
      )
    );
  }

  // 1. 驗證請求參數
  const bodyResult = UpgradeCaseRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
    logger.warn("[trust/upgrade-case] Invalid request body", {
      error: bodyResult.error.message,
    });
    return void res
      .status(400)
      .json(
        errorResponse(
          API_ERROR_CODES.INVALID_INPUT,
          "請求參數格式錯誤",
          bodyResult.error.issues
        )
      );
  }

  const { token, userId, userName } = bodyResult.data;

  try {
    // 2. 呼叫 RPC 函數升級案件
    const { data, error } = await supabase.rpc("fn_upgrade_trust_case", {
      p_token: token,
      p_user_id: userId,
      p_user_name: userName,
    });

    if (error) {
      logger.error("[trust/upgrade-case] RPC error", error, {
        token,
        userId,
      });
      return void res
        .status(500)
        .json(
          errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件升級失敗")
        );
    }

    // 3. 驗證 RPC 回應格式
    const resultParseResult = UpgradeCaseResultSchema.safeParse(data);
    if (!resultParseResult.success) {
      logger.error("[trust/upgrade-case] Validation failed", {
        error: resultParseResult.error.message,
      });
      return void res
        .status(500)
        .json(
          errorResponse(
            API_ERROR_CODES.INTERNAL_ERROR,
            "回應格式驗證失敗"
          )
        );
    }

    const result = resultParseResult.data;
    if (!result.success) {
      // 業務邏輯錯誤（token 無效、已過期、已撤銷、已綁定等）
      logger.warn("[trust/upgrade-case] Business logic error", {
        error: result.error,
        token,
        userId,
      });
      return void res
        .status(400)
        .json(
          errorResponse(
            API_ERROR_CODES.INVALID_INPUT,
            result.error ?? "案件升級失敗"
          )
        );
    }

    // [Team 5 修復] 驗證 case_id 不可為 null
    if (!result.case_id) {
      logger.error("[trust/upgrade-case] RPC returned null case_id", {
        result,
        userId,
      });
      return void res
        .status(500)
        .json(
          errorResponse(
            API_ERROR_CODES.INTERNAL_ERROR,
            "Database error: missing case_id"
          )
        );
    }

    // 4. [Team 5 修復] 記錄審計日誌（阻塞模式）
    try {
      await logAudit(result.case_id, "UPGRADE_TRUST_CASE", {
        id: userId,
        role: "buyer",
        txId: result.case_id,
        ip: getClientIp(req),
        agent: getUserAgent(req),
      });
    } catch (auditErr) {
      logger.error("[trust/upgrade-case] Audit log failed", {
        auditErr: auditErr instanceof Error ? auditErr.message : "Unknown",
        case_id: result.case_id,
      });
      return void res
        .status(500)
        .json(
          errorResponse(
            API_ERROR_CODES.INTERNAL_ERROR,
            "Audit logging failed"
          )
        );
    }

    // 5. 返回成功結果
    logger.info("[trust/upgrade-case] POST success", {
      case_id: result.case_id,
      userId,
      userName,
    });
    res.status(200).json(
      successResponse({
        case_id: result.case_id,
        message: "案件已成功升級為已註冊用戶",
      })
    );
  } catch (e) {
    logger.error(
      "[trust/upgrade-case] Unexpected error",
      e instanceof Error ? e : new Error("Unknown error"),
      { token, userId }
    );
    res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}
