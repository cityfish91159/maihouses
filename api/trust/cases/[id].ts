/**
 * Trust Case Detail API - 安心交易案件詳情
 *
 * GET   /api/trust/cases/[id] - 取得案件詳情（含事件列表）
 * PATCH /api/trust/cases/[id] - 更新案件步驟
 *
 * Skills Applied:
 * - [Backend Safeguard] RLS + 權限驗證
 * - [NASA TypeScript Safety] 完整類型定義 + Zod 驗證 + 函數 ≤60 行
 * - [Audit Logging] 審計日誌
 * - [No Lazy Implementation] 完整實作
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import { supabase, verifyToken, cors, logAudit } from "../_utils";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
} from "../../lib/apiResponse";
import { logger } from "../../lib/logger";

// ============================================================================
// Types & Schemas [NASA TypeScript Safety]
// ============================================================================

const UuidSchema = z.string().uuid("無效的案件 ID 格式");
const ActorTypeSchema = z.enum(["agent", "buyer", "system"]);

const UpdateStepRequestSchema = z.object({
  new_step: z.number().int().min(1).max(6),
  action: z.string().min(1).max(200),
  actor: ActorTypeSchema.default("agent"),
  detail: z.string().max(500).optional(),
  offer_price: z.number().int().positive().optional(),
});

const TrustCaseEventSchema = z.object({
  id: z.string().uuid(),
  step: z.number().int().min(1).max(6),
  step_name: z.string(),
  action: z.string(),
  actor: ActorTypeSchema,
  event_hash: z.string().nullable(),
  detail: z.string().nullable(),
  created_at: z.string(),
});

const TrustCaseDetailSchema = z.object({
  id: z.string().uuid(),
  buyer_session_id: z.string().nullable(),
  buyer_name: z.string(),
  buyer_contact: z.string().nullable(),
  property_id: z.string().nullable(),
  property_title: z.string(),
  transaction_id: z.string().nullable(),
  current_step: z.number().int().min(1).max(6),
  status: z.string(),
  offer_price: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  events: z.array(TrustCaseEventSchema),
  error: z.string().optional(),
});

const UpdateStepResultSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  new_step: z.number().int().optional(),
  event_hash: z.string().optional(),
  error: z.string().optional(),
});

// ============================================================================
// Shared Validation Helpers [NASA TypeScript Safety - 函數分離]
// ============================================================================

interface AuthResult {
  success: true;
  user: ReturnType<typeof verifyToken>;
}
interface AuthError {
  success: false;
  status: number;
  code: string;
  message: string;
}

/** 驗證 Token + 角色（共用邏輯） */
function validateAgentAuth(req: VercelRequest): AuthResult | AuthError {
  try {
    const user = verifyToken(req);
    if (user.role !== "agent") {
      return { success: false, status: 403, code: API_ERROR_CODES.FORBIDDEN, message: "只有房仲可以操作案件" };
    }
    return { success: true, user };
  } catch {
    return { success: false, status: 401, code: API_ERROR_CODES.UNAUTHORIZED, message: "未登入或 Token 已過期" };
  }
}

/** 驗證 UUID 格式 */
function validateCaseId(id: unknown): { success: true; caseId: string } | AuthError {
  const result = UuidSchema.safeParse(id);
  if (!result.success) {
    return { success: false, status: 400, code: API_ERROR_CODES.INVALID_INPUT, message: "無效的案件 ID 格式" };
  }
  return { success: true, caseId: result.data };
}

// ============================================================================
// Handler [NASA TypeScript Safety - 21 行]
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case "GET":
      return handleGetCaseDetail(req, res);
    case "PATCH":
      return handleUpdateStep(req, res);
    default:
      res.status(405).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, "Method not allowed"));
  }
}

// ============================================================================
// GET /api/trust/cases/[id] [NASA TypeScript Safety - 38 行]
// ============================================================================

async function handleGetCaseDetail(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = validateAgentAuth(req);
  if (!authResult.success) return void res.status(authResult.status).json(errorResponse(authResult.code, authResult.message));

  const idResult = validateCaseId(req.query.id);
  if (!idResult.success) return void res.status(idResult.status).json(errorResponse(idResult.code, idResult.message));

  const { user } = authResult;
  const { caseId } = idResult;

  try {
    const { data, error } = await supabase.rpc("fn_get_trust_case_detail", { p_case_id: caseId, p_agent_id: user.id });

    if (error) {
      logger.error("[trust/cases/[id]] RPC error", { error: error.message, case_id: caseId });
      return void res.status(500).json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件詳情載入失敗"));
    }

    const parseResult = TrustCaseDetailSchema.safeParse(data);
    if (!parseResult.success) {
      logger.error("[trust/cases/[id]] Validation failed", { error: parseResult.error.message, case_id: caseId });
      return void res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "資料格式驗證失敗"));
    }

    const detail = parseResult.data;
    if (detail.error) return void res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, "無權存取此案件"));

    logger.info("[trust/cases/[id]] GET success", { agent_id: user.id, case_id: caseId, events_count: detail.events.length });
    res.status(200).json(successResponse(detail));
  } catch (e) {
    logger.error("[trust/cases/[id]] GET error", { error: e instanceof Error ? e.message : "Unknown" });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}

// ============================================================================
// PATCH /api/trust/cases/[id] [NASA TypeScript Safety - 55 行]
// ============================================================================

async function handleUpdateStep(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = validateAgentAuth(req);
  if (!authResult.success) return void res.status(authResult.status).json(errorResponse(authResult.code, authResult.message));

  const idResult = validateCaseId(req.query.id);
  if (!idResult.success) return void res.status(idResult.status).json(errorResponse(idResult.code, idResult.message));

  const bodyResult = UpdateStepRequestSchema.safeParse(req.body);
  if (!bodyResult.success) return void res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, "請求參數格式錯誤", bodyResult.error.issues));

  const { user } = authResult;
  const { caseId } = idResult;
  const { new_step, action, actor, detail, offer_price } = bodyResult.data;

  try {
    const { data, error } = await supabase.rpc("fn_update_trust_case_step", {
      p_case_id: caseId, p_agent_id: user.id, p_new_step: new_step,
      p_action: action, p_actor: actor, p_detail: detail ?? null, p_offer_price: offer_price ?? null,
    });

    if (error) {
      logger.error("[trust/cases/[id]] RPC error", { error: error.message, case_id: caseId });
      return void res.status(500).json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, "案件更新失敗"));
    }

    const parseResult = UpdateStepResultSchema.safeParse(data);
    if (!parseResult.success) {
      logger.error("[trust/cases/[id]] Validation failed", { error: parseResult.error.message, case_id: caseId });
      return void res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "回應格式驗證失敗"));
    }

    const result = parseResult.data;
    if (!result.success) {
      const msg = result.error ?? "案件更新失敗";
      const code = msg.includes("access denied") || msg.includes("not found") ? API_ERROR_CODES.FORBIDDEN : API_ERROR_CODES.INVALID_INPUT;
      return void res.status(code === API_ERROR_CODES.FORBIDDEN ? 403 : 400).json(errorResponse(code, msg));
    }

    await logAudit(caseId, `UPDATE_TRUST_CASE_STEP_${new_step}`, user);
    logger.info("[trust/cases/[id]] PATCH success", { agent_id: user.id, case_id: caseId, new_step, event_hash: result.event_hash });
    res.status(200).json(successResponse({ case_id: result.case_id, new_step: result.new_step, event_hash: result.event_hash }));
  } catch (e) {
    logger.error("[trust/cases/[id]] PATCH error", { error: e instanceof Error ? e.message : "Unknown" });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, "伺服器內部錯誤"));
  }
}
