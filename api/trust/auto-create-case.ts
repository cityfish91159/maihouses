/**
 * Trust Auto-Create Case API - 自動建立安心交易案件
 *
 * POST /api/trust/auto-create-case
 *
 * 功能：消費者點擊「發起交易」後自動建立案件
 * - 已註冊用戶：使用 user.name 和 user.id
 * - 未註冊用戶：生成匿名買方名稱（買方-XXXX）
 * - 自動生成 90 天有效的 Token
 *
 * Skills Applied:
 * - [Backend Safeguard] RLS + 完整驗證
 * - [NASA TypeScript Safety] 完整類型定義 + Zod 驗證
 * - [Audit Logging] 審計日誌
 * - [No Lazy Implementation] 完整實作
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { supabase, cors, logAudit, withTimeout } from "./_utils";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../lib/apiResponse";
import { logger } from "../lib/logger";
import { rateLimitMiddleware } from "../lib/rateLimiter";
import {
  validateProperty,
  resolveBuyerInfo,
  getClientIp,
  getUserAgent,
} from "./_auto-create-helpers";

// ============================================================================
// Types & Schemas [NASA TypeScript Safety]
// ============================================================================

/** 請求 Body Schema [Team 6 增強] */
const AutoCreateCaseRequestSchema = z.object({
  propertyId: z
    .string()
    .min(1, "propertyId 不可為空")
    .regex(/^MH-\d+$/, "propertyId 格式錯誤（應為 MH-XXXXX）"),
  userId: z.string().uuid("userId 格式錯誤").optional(),
  userName: z
    .string()
    .min(1, "userName 不可為空")
    .max(50, "userName 不可超過 50 字")
    .optional(),
});
type AutoCreateCaseRequest = z.infer<typeof AutoCreateCaseRequestSchema>;

// [Team Delta - Q-01] 移除重複類型定義，改用 _auto-create-helpers.ts

/** RPC 建立案件結果 */
const CreateCaseResultSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  token: z.string().uuid().optional(),
  token_expires_at: z.string().optional(),
  event_hash: z.string().optional(),
  error: z.string().optional(),
});
type CreateCaseResult = z.infer<typeof CreateCaseResultSchema>;

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
        errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, "Method not allowed")
      );
    return;
  }

  await handleAutoCreateCase(req, res);
}

// ============================================================================
// POST /api/trust/auto-create-case [NASA TypeScript Safety]
// ============================================================================

async function handleAutoCreateCase(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // [Team 2 修復] Rate Limiting (10 requests per minute)
  const rateLimitError = rateLimitMiddleware(req, 10, 60000);
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
  const bodyResult = AutoCreateCaseRequestSchema.safeParse(req.body);
  if (!bodyResult.success) {
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

  const { propertyId, userId, userName } = bodyResult.data;

  try {
    // [Team Delta - Q-01] 重構：拆分為小函數，降低複雜度

    // 2. 驗證物件
    const propertyValidation = await validateProperty(propertyId);
    if (!propertyValidation.success) {
      const statusCode =
        propertyValidation.errorCode === API_ERROR_CODES.NOT_FOUND ? 404 :
        propertyValidation.errorCode === API_ERROR_CODES.INVALID_INPUT ? 400 : 500;

      return void res
        .status(statusCode)
        .json(errorResponse(
          propertyValidation.errorCode!,
          propertyValidation.errorMessage!
        ));
    }

    const property = propertyValidation.property!;

    // 3. 決定買方資訊
    const buyerInfo = await resolveBuyerInfo(userId, userName);
    const { buyerName, buyerUserId } = buyerInfo;

    // 4. 呼叫 RPC 建立案件（自動生成 token）
    // [Team 8 修復] 添加 15 秒 timeout 保護
    const { data: rpcData, error: rpcError } = await withTimeout(
      supabase.rpc("fn_create_trust_case", {
        p_agent_id: property.agent_id,
        p_buyer_name: buyerName,
        p_property_title: property.title,
        p_buyer_session_id: null, // Phase 1.5 不需要 UAG session
        p_buyer_contact: null,
        p_property_id: propertyId,
      }),
      15000,
      "RPC call timed out after 15 seconds",
    );

    if (rpcError) {
      logger.error("[trust/auto-create-case] RPC error", {
        error: rpcError.message,
        propertyId,
      });
      return void res
        .status(500)
        .json(
          errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件建立失敗")
        );
    }

    const resultParseResult = CreateCaseResultSchema.safeParse(rpcData);
    if (!resultParseResult.success) {
      logger.error(
        "[trust/auto-create-case] RPC response validation failed",
        {
          error: resultParseResult.error.message,
        }
      );
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
      return void res
        .status(400)
        .json(
          errorResponse(
            API_ERROR_CODES.INVALID_INPUT,
            result.error ?? "案件建立失敗"
          )
        );
    }

    // 5. [Team Bravo - P-02] 並行執行非阻塞操作（效能優化）
    // 將 buyer_user_id 更新和審計日誌並行執行，減少總響應時間
    const parallelTasks: Promise<void>[] = [];

    // Task 1: 更新 buyer_user_id（若有）
    if (buyerUserId && result.case_id) {
      parallelTasks.push(
        (async () => {
          const { error } = await supabase
            .from("trust_cases")
            .update({ buyer_user_id: buyerUserId })
            .eq("id", result.case_id);

          if (error) {
            logger.error(
              "[trust/auto-create-case] Failed to update buyer_user_id",
              {
                error: error.message,
                case_id: result.case_id,
              }
            );
          }
        })()
      );
    }

    // Task 2: 審計日誌
    parallelTasks.push(
      logAudit(result.case_id ?? "unknown", "AUTO_CREATE_CASE", {
        id: buyerUserId ?? "anonymous",
        role: "buyer" as const,
        txId: result.case_id ?? "unknown",
        ip: getClientIp(req),
        agent: getUserAgent(req),
      })
    );

    // 等待所有並行任務完成（使用 Promise.allSettled 避免單一失敗影響整體）
    await Promise.allSettled(parallelTasks);

    logger.info("[trust/auto-create-case] Success", {
      case_id: result.case_id,
      buyer_name: buyerName,
      property_id: propertyId,
      is_registered: Boolean(buyerUserId),
    });

    res.status(201).json(
      successResponse({
        case_id: result.case_id,
        token: result.token,
        buyer_name: buyerName,
      })
    );
  } catch (e) {
    logger.error("[trust/auto-create-case] Unexpected error", {
      error: e instanceof Error ? e.message : "Unknown",
    });
    res
      .status(500)
      .json(
        errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤")
      );
  }
}

// [Team Delta - Q-01] Helper Functions 已移至 _auto-create-helpers.ts
