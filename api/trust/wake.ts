/**
 * BE-10 | 喚醒休眠案件 API
 *
 * POST /api/trust/wake
 * Body: { caseId: string }
 *
 * 商業邏輯：
 * - 僅 dormant 狀態的案件可以被喚醒
 * - 支援三種認證：
 *   - JWT (agent): 只能喚醒自己的案件 (agent_id === user.id)
 *   - JWT (buyer): 只能喚醒自己的案件 (buyer_user_id === user.id)
 *   - x-system-key (system): 可喚醒任意案件（供 Cron 使用）
 * - 喚醒後發送通知給消費者（房仲通知待 Phase 2）
 * - 支援競態條件防護（原子更新 + 狀態驗證）
 *
 * Skills Applied:
 * - [Backend Safeguard] 權限驗證 + 雙認證模式
 * - [NASA TypeScript Safety] Zod 驗證 + 完整類型
 * - [Audit Logging] 審計日誌（標記來源 agent/buyer/system）
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
import { sendCaseWakeNotification } from "./send-notification";

// ============================================================================
// Zod Schemas [NASA TypeScript Safety]
// ============================================================================

/** 喚醒案件請求 Schema */
const WakeCaseRequestSchema = z.object({
  caseId: z.string().uuid("caseId 必須是有效的 UUID"),
});

/** 案件狀態 Schema - 包含所有可能狀態 */
const CaseStatusSchema = z.enum([
  "active",
  "dormant",
  "closed",
  "closed_sold_to_other",
  "closed_property_unlisted",
  "closed_inactive",
  "completed",
]);

/** trust_cases 查詢結果 Schema */
const TrustCaseRowSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  buyer_user_id: z.string().uuid().nullable(),
  status: CaseStatusSchema,
  property_title: z.string().nullable(),
  dormant_at: z.string().nullable(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 遮罩 UUID（只顯示前 8 字元）用於日誌 PII 保護
 * @internal
 */
function maskUUID(uuid: string): string {
  if (uuid.length < 8) return "***";
  return `${uuid.slice(0, 8)}...`;
}

// ============================================================================
// Types
// ============================================================================

/** 認證來源 */
type AuthSource = "agent" | "buyer" | "system";

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
    // Step 1: 雙認證（System Key 或 JWT）
    const systemKey = req.headers["x-system-key"];
    let authSource: AuthSource = "agent";
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

      // 根據 role 設定 authSource
      if (user.role === "agent") {
        authSource = "agent";
      } else if (user.role === "buyer") {
        authSource = "buyer";
      } else {
        // system role 不能透過 JWT 喚醒
        res
          .status(403)
          .json(errorResponse(API_ERROR_CODES.FORBIDDEN, "不支援此角色"));
        return;
      }
    }

    // Step 2: 檢查請求 Body
    const bodyResult = WakeCaseRequestSchema.safeParse(req.body);
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

    const { caseId } = bodyResult.data;

    // Step 3: 查詢案件是否存在
    const { data: caseRow, error: caseError } = await supabase
      .from("trust_cases")
      .select("id, agent_id, buyer_user_id, status, property_title, dormant_at")
      .eq("id", caseId)
      .single();

    if (caseError || !caseRow) {
      if (caseError?.code === "PGRST116") {
        res
          .status(404)
          .json(errorResponse(API_ERROR_CODES.NOT_FOUND, "找不到案件"));
        return;
      }

      logger.error("[trust/wake] Database error", {
        error: caseError?.message ?? "Unknown",
        caseIdMasked: maskUUID(caseId),
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件載入失敗"));
      return;
    }

    const caseParseResult = TrustCaseRowSchema.safeParse(caseRow);
    if (!caseParseResult.success) {
      logger.error("[trust/wake] Case data validation failed", {
        caseIdMasked: maskUUID(caseId),
        issues: caseParseResult.error.issues,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "資料格式驗證失敗"));
      return;
    }

    const currentCase = caseParseResult.data;

    // Step 4: 驗證權限（根據 authSource 和 role 檢查不同欄位）
    if (authSource === "agent" && user) {
      if (currentCase.agent_id !== user.id) {
        res
          .status(403)
          .json(errorResponse(API_ERROR_CODES.FORBIDDEN, "無權限喚醒此案件"));
        return;
      }
    } else if (authSource === "buyer" && user) {
      if (currentCase.buyer_user_id !== user.id) {
        res
          .status(403)
          .json(errorResponse(API_ERROR_CODES.FORBIDDEN, "無權限喚醒此案件"));
        return;
      }
    }
    // system 認證無需擁有權驗證

    // Step 5: 驗證狀態（僅允許 dormant）
    if (currentCase.status !== "dormant") {
      res
        .status(400)
        .json(
          errorResponse(API_ERROR_CODES.INVALID_INPUT, "案件狀態不允許喚醒（必須為休眠狀態）"),
        );
      return;
    }

    // Step 6: 原子更新（狀態 + dormant_at + 擁有權驗證）
    const wokenAt = new Date().toISOString();
    let updateQuery = supabase
      .from("trust_cases")
      .update({
        status: "active",
        dormant_at: null,
        updated_at: wokenAt,
      })
      .eq("id", caseId)
      .eq("status", "dormant");

    // 根據角色加入擁有權驗證防止競態條件
    if (authSource === "agent" && user) {
      updateQuery = updateQuery.eq("agent_id", user.id);
    } else if (authSource === "buyer" && user) {
      updateQuery = updateQuery.eq("buyer_user_id", user.id);
    }

    const { data: updatedCase, error: updateError } = await updateQuery
      .select("id, agent_id, buyer_user_id, status, property_title, dormant_at")
      .single();

    // Step 7: 處理並發衝突
    if (updateError || !updatedCase) {
      // PGRST116 = no rows returned，可能是並發狀態變更
      if (updateError?.code === "PGRST116" || !updatedCase) {
        logger.warn("[trust/wake] Concurrent update conflict", {
          caseIdMasked: maskUUID(caseId),
          error: updateError?.message,
        });
        res
          .status(409)
          .json(errorResponse(API_ERROR_CODES.CONFLICT, "案件狀態已變更，請重新操作"));
        return;
      }

      logger.error("[trust/wake] Update failed", {
        error: updateError instanceof Error ? updateError.message : String(updateError ?? "Unknown"),
        caseIdMasked: maskUUID(caseId),
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "案件更新失敗"));
      return;
    }

    const updatedParseResult = TrustCaseRowSchema.safeParse(updatedCase);
    if (!updatedParseResult.success) {
      logger.error("[trust/wake] Updated data validation failed", {
        caseIdMasked: maskUUID(caseId),
        issues: updatedParseResult.error.issues,
      });
      res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "回應格式驗證失敗"));
      return;
    }

    const updated = updatedParseResult.data;

    // Step 8: 寫入審計紀錄（標記來源 agent/buyer/system）
    const auditUser =
      authSource !== "system" && user
        ? user
        : {
            id: "system",
            role: "system" as const,
            txId: "system",
            ip: getClientIp(req),
            agent: getUserAgent(req),
          };

    // 審計 action 根據來源區分
    const auditAction = `WAKE_TRUST_CASE_${authSource.toUpperCase()}`;

    void logAudit(
      caseId,
      auditAction,
      auditUser,
    ).catch((auditErr) => {
      logger.error("[trust/wake] Audit log failed (non-blocking)", {
        case_id: caseId,
        error: auditErr instanceof Error ? auditErr.message : "Unknown",
      });
    });

    logger.info("[trust/wake] Case woken", {
      case_id: caseId,
      previous_status: "dormant",
      new_status: "active",
      source: authSource,
    });

    // Step 9: 非阻塞通知（Phase 1 僅通知消費者）
    void sendCaseWakeNotification(
      caseId,
      updated.property_title ?? undefined,
    ).catch((err) =>
      logger.error("[trust/wake] Notification failed", {
        case_id: caseId,
        error: err instanceof Error ? err.message : "Unknown",
      }),
    );

    // Step 10: 成功回傳
    res.status(200).json(
      successResponse({
        caseId,
        previousStatus: "dormant",
        status: updated.status,
        wokenAt,
      }),
    );
  } catch (e) {
    logger.error("[trust/wake] Unexpected error", {
      error: e instanceof Error ? e.message : "Unknown",
    });
    res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}
