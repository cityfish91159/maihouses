/**
 * BE-9 | 案件關閉通知 API
 *
 * POST /api/trust/close
 * Body: { caseId: string, reason: CloseReason }
 *
 * 商業邏輯：
 * - 支援三種關閉原因：closed_sold_to_other, closed_property_unlisted, closed_inactive
 * - 只有 active 或 dormant 狀態的案件可以關閉
 * - 支援雙認證：JWT (房仲) 或 x-system-key (系統/Cron)
 * - 關閉後發送通知給消費者
 *
 * Skills Applied:
 * - [Backend Safeguard] 權限驗證 + 雙認證模式
 * - [NASA TypeScript Safety] Zod 驗證 + 完整類型
 * - [Audit Logging] 審計日誌（標記來源）
 * - [No Lazy Implementation] 完整實作
 * - [Security Audit] 防止越權操作
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { supabase, verifyToken, cors, logAudit, SYSTEM_API_KEY, getClientIp, getUserAgent } from "./_utils";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../lib/apiResponse";
import { logger } from "../lib/logger";
import { sendCaseClosedNotification, CLOSE_REASON_TEXTS, type CloseReason } from "./send-notification";

// ============================================================================
// Zod Schemas [NASA TypeScript Safety]
// ============================================================================

/** 關閉原因白名單 - 類型從 send-notification.ts 導入 */
const CloseReasonSchema = z.enum([
  "closed_sold_to_other",
  "closed_property_unlisted",
  "closed_inactive",
] as const satisfies readonly CloseReason[]);

/** 關閉案件請求 Schema */
const CloseCaseRequestSchema = z.object({
  caseId: z.string().uuid("caseId 必須是有效的 UUID"),
  reason: CloseReasonSchema,
});

/** 案件狀態 Schema - 僅包含 BE-9 使用的狀態 */
const CaseStatusSchema = z.enum([
  "active",
  "dormant",
  "closed",
]);

/** trust_cases 查詢結果 Schema */
const TrustCaseRowSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  status: CaseStatusSchema,
  property_title: z.string().nullable(), // 修復 #1: 允許 null
  closed_at: z.string().nullable(),
  closed_reason: CloseReasonSchema.nullable().optional(),
});

// ============================================================================
// Handler
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  // CORS
  cors(req, res);

  // OPTIONS 預檢
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // 僅允許 POST
  if (req.method !== "POST") {
    res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, "只允許 POST 方法"));
    return;
  }

  try {
    // Step 1: 雙認證（JWT 或 System Key）
    const systemKey = req.headers["x-system-key"];
    let authSource: "jwt" | "system" = "jwt";
    let user: ReturnType<typeof verifyToken> | null = null;

    if (systemKey) {
      if (systemKey !== SYSTEM_API_KEY) {
        res
          .status(401)
          .json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, "未授權的存取"));
        return;
      }
      authSource = "system";
    } else {
      try {
        user = verifyToken(req);
      } catch {
        res
          .status(401)
          .json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, "未登入或 Token 已過期"));
        return;
      }

      if (user.role !== "agent") {
        res
          .status(403)
          .json(errorResponse(API_ERROR_CODES.FORBIDDEN, "只有房仲可以操作案件"));
        return;
      }
    }

    // Step 2: 檢查請求 Body
    const bodyResult = CloseCaseRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      res
        .status(400)
        .json(
          errorResponse(
            API_ERROR_CODES.INVALID_INPUT,
            "請求參數格式錯誤",
          ),
        );
      return;
    }

    const { caseId, reason } = bodyResult.data;

    // Step 3: 查詢案件是否存在
    const { data: caseRow, error: caseError } = await supabase
      .from("trust_cases")
      .select("id, agent_id, status, property_title, closed_at, closed_reason")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRow) {
      if (caseError?.code === "PGRST116") {
        res
          .status(404)
          .json(errorResponse(API_ERROR_CODES.NOT_FOUND, "找不到案件"));
        return;
      }

      logger.error("[trust/close] Database error", {
        error: caseError?.message ?? "Unknown",
        caseId,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件載入失敗"));
      return;
    }

    const caseParseResult = TrustCaseRowSchema.safeParse(caseRow);
    if (!caseParseResult.success) {
      logger.error("[trust/close] Case data validation failed", {
        caseId,
        issues: caseParseResult.error.issues,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "資料格式驗證失敗"));
      return;
    }

    const currentCase = caseParseResult.data;

    // Step 4: 驗證權限（僅 JWT 需要）
    if (authSource === "jwt" && user) {
      if (currentCase.agent_id !== user.id) {
        res
          .status(403)
          .json(errorResponse(API_ERROR_CODES.FORBIDDEN, "無權限關閉此案件"));
        return;
      }
    }

    // Step 5: 驗證狀態（僅允許 active / dormant）
    if (currentCase.status !== "active" && currentCase.status !== "dormant") {
      res
        .status(400)
        .json(
          errorResponse(API_ERROR_CODES.INVALID_INPUT, "案件狀態不允許關閉"),
        );
      return;
    }

    // Step 6: 單一更新（原子性）- 修復 #2: 加入 agent_id 防止 TOCTOU
    const closedAt = new Date().toISOString();
    let updateQuery = supabase
      .from("trust_cases")
      .update({
        status: "closed",
        closed_at: closedAt,
        closed_reason: reason,
      })
      .eq("id", caseId)
      .in("status", ["active", "dormant"]);

    // JWT 認證時加入 agent_id 驗證防止競態條件
    if (authSource === "jwt" && user) {
      updateQuery = updateQuery.eq("agent_id", user.id);
    }

    const { data: updatedCase, error: updateError } = await updateQuery
      .select("id, agent_id, status, property_title, closed_at, closed_reason")
      .single();

    // 修復 #3: 區分並發衝突與真正錯誤
    if (updateError || !updatedCase) {
      // PGRST116 = no rows returned，可能是並發狀態變更
      if (updateError?.code === "PGRST116" || !updatedCase) {
        logger.warn("[trust/close] Concurrent update conflict", {
          caseId,
          error: updateError?.message,
        });
        res
          .status(409)
          .json(errorResponse(API_ERROR_CODES.CONFLICT, "案件狀態已變更，請重新操作"));
        return;
      }

      logger.error("[trust/close] Update failed", {
        error: updateError?.message ?? "Unknown",
        caseId,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "案件更新失敗"));
      return;
    }

    const updatedParseResult = TrustCaseRowSchema.safeParse(updatedCase);
    if (!updatedParseResult.success) {
      logger.error("[trust/close] Updated data validation failed", {
        caseId,
        issues: updatedParseResult.error.issues,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "回應格式驗證失敗"));
      return;
    }

    const updated = updatedParseResult.data;

    // Step 7: 寫入審計紀錄（標記來源 jwt/system）
    const auditUser =
      authSource === "jwt" && user
        ? user
        : {
            id: "system",
            role: "system" as const,
            txId: "system",
            ip: getClientIp(req),
            agent: getUserAgent(req),
          };

    void logAudit(
      caseId,
      `CLOSE_TRUST_CASE_${authSource.toUpperCase()}`,
      auditUser,
    ).catch((auditErr) => {
      logger.error("[trust/close] Audit log failed (non-blocking)", {
        case_id: caseId,
        error: auditErr instanceof Error ? auditErr.message : "Unknown",
      });
    });

    logger.info("[trust/close] Case closed", {
      case_id: caseId,
      reason,
      reason_text: CLOSE_REASON_TEXTS[reason],
      source: authSource,
    });

    // Step 8: 非阻塞通知
    void sendCaseClosedNotification(
      caseId,
      reason,
      updated.property_title ?? undefined,
    ).catch((err) =>
      logger.error("[trust/close] Notification failed", {
        case_id: caseId,
        error: err instanceof Error ? err.message : "Unknown",
      }),
    );

    // Step 9: 成功回傳
    res.status(200).json(
      successResponse({
        caseId,
        status: updated.status,
        closedAt: updated.closed_at,
      }),
    );
  } catch (e) {
    logger.error("[trust/close] Unexpected error", {
      error: e instanceof Error ? e.message : "Unknown",
    });
    res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}


