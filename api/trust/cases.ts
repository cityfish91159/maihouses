/**
 * Trust Cases API - 安心交易案件管理
 *
 * GET  /api/trust/cases - 取得房仲的案件列表
 * POST /api/trust/cases - 建立新案件
 *
 * Skills Applied:
 * - [Backend Safeguard] RLS + 權限驗證
 * - [NASA TypeScript Safety] 完整類型定義 + Zod 驗證
 * - [Audit Logging] 審計日誌
 * - [No Lazy Implementation] 完整實作
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase, verifyToken, cors, logAudit } from './_utils';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { logger } from '../lib/logger';

// ============================================================================
// Types & Schemas [NASA TypeScript Safety]
// ============================================================================

/** 案件狀態 */
const CaseStatusSchema = z.enum(['active', 'pending', 'completed', 'cancelled', 'expired']);
type CaseStatus = z.infer<typeof CaseStatusSchema>;

/** 執行者類型 */
const ActorTypeSchema = z.enum(['agent', 'buyer', 'system']);

/** 建立案件請求 Schema */
const CreateCaseRequestSchema = z.object({
  buyer_name: z.string().min(1, '買方名稱不可為空').max(100),
  property_title: z.string().min(1, '物件標題不可為空').max(200),
  buyer_session_id: z.string().optional(),
  buyer_contact: z.string().max(50).optional(),
  property_id: z.string().optional(),
});
type CreateCaseRequest = z.infer<typeof CreateCaseRequestSchema>;

/** 查詢參數 Schema */
const GetCasesQuerySchema = z.object({
  status: CaseStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

/** RPC 回應類型 [NASA TypeScript Safety] - 使用 Zod 驗證取代 type assertion */
const TrustCaseRowSchema = z.object({
  id: z.string().uuid(),
  buyer_session_id: z.string().nullable(),
  buyer_name: z.string(),
  property_id: z.string().nullable(),
  property_title: z.string(),
  transaction_id: z.string().nullable(),
  current_step: z.number().int().min(1).max(6),
  status: CaseStatusSchema,
  offer_price: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  events_count: z.number(),
  latest_event_at: z.string().nullable(),
});
type TrustCaseRow = z.infer<typeof TrustCaseRowSchema>;

const CreateCaseResultSchema = z.object({
  success: z.boolean(),
  case_id: z.string().uuid().optional(),
  event_hash: z.string().optional(),
  error: z.string().optional(),
});
type CreateCaseResult = z.infer<typeof CreateCaseResultSchema>;

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
    if (user.role !== 'agent') {
      return {
        success: false,
        status: 403,
        code: API_ERROR_CODES.FORBIDDEN,
        message: '只有房仲可以操作案件',
      };
    }
    return { success: true, user };
  } catch {
    return {
      success: false,
      status: 401,
      code: API_ERROR_CODES.UNAUTHORIZED,
      message: '未登入或 Token 已過期',
    };
  }
}

// ============================================================================
// Handler [NASA TypeScript Safety - 21 行]
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  switch (req.method) {
    case 'GET':
      return handleGetCases(req, res);
    case 'POST':
      return handleCreateCase(req, res);
    default:
      res.status(405).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'Method not allowed'));
  }
}

// ============================================================================
// RPC Response Schema [NASA TypeScript Safety - 定義提取]
// ============================================================================

const RpcResponseSchema = z.object({
  cases: z.array(TrustCaseRowSchema),
  total: z.number().int().min(0),
  limit: z.number().int(),
  offset: z.number().int(),
});

// ============================================================================
// GET /api/trust/cases [NASA TypeScript Safety - 50 行]
// ============================================================================

async function handleGetCases(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = validateAgentAuth(req);
  if (!authResult.success)
    return void res
      .status(authResult.status)
      .json(errorResponse(authResult.code, authResult.message));

  const queryResult = GetCasesQuerySchema.safeParse(req.query);
  if (!queryResult.success)
    return void res
      .status(400)
      .json(
        errorResponse(API_ERROR_CODES.INVALID_QUERY, '查詢參數格式錯誤', queryResult.error.issues)
      );

  const { user } = authResult;
  const { status, limit, offset } = queryResult.data;

  try {
    const { data, error } = await supabase.rpc('fn_get_trust_cases', {
      p_agent_id: user.id,
      p_status: status ?? null,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) {
      logger.error('[trust/cases] RPC error', { error: error.message });
      return void res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '案件列表載入失敗'));
    }

    const rpcParseResult = RpcResponseSchema.safeParse(data);
    if (!rpcParseResult.success) {
      logger.error('[trust/cases] Validation failed', { error: rpcParseResult.error.message });
      return void res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '資料格式驗證失敗'));
    }

    const { cases, total } = rpcParseResult.data;

    if (cases.length > 0) {
      logger.info('[trust/cases] GET success', {
        agent_id: user.id,
        count: cases.length,
        total,
        status_filter: status ?? 'all',
      });
    }

    res.status(200).json(successResponse({ cases, total, limit, offset }));
  } catch (e) {
    logger.error('[trust/cases] GET error', { error: e instanceof Error ? e.message : 'Unknown' });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}

// ============================================================================
// POST /api/trust/cases [NASA TypeScript Safety - 50 行]
// ============================================================================

async function handleCreateCase(req: VercelRequest, res: VercelResponse): Promise<void> {
  const authResult = validateAgentAuth(req);
  if (!authResult.success)
    return void res
      .status(authResult.status)
      .json(errorResponse(authResult.code, authResult.message));

  const bodyResult = CreateCaseRequestSchema.safeParse(req.body);
  if (!bodyResult.success)
    return void res
      .status(400)
      .json(
        errorResponse(API_ERROR_CODES.INVALID_INPUT, '請求參數格式錯誤', bodyResult.error.issues)
      );

  const { user } = authResult;
  const { buyer_name, property_title, buyer_session_id, buyer_contact, property_id } =
    bodyResult.data;

  try {
    const { data, error } = await supabase.rpc('fn_create_trust_case', {
      p_agent_id: user.id,
      p_buyer_name: buyer_name,
      p_property_title: property_title,
      p_buyer_session_id: buyer_session_id ?? null,
      p_buyer_contact: buyer_contact ?? null,
      p_property_id: property_id ?? null,
    });

    if (error) {
      logger.error('[trust/cases] RPC error', { error: error.message, agent_id: user.id });
      return void res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '案件建立失敗'));
    }

    const resultParseResult = CreateCaseResultSchema.safeParse(data);
    if (!resultParseResult.success) {
      logger.error('[trust/cases] Validation failed', { error: resultParseResult.error.message });
      return void res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '回應格式驗證失敗'));
    }

    const result = resultParseResult.data;
    if (!result.success) {
      return void res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, result.error ?? '案件建立失敗'));
    }

    await logAudit(result.case_id ?? 'unknown', 'CREATE_TRUST_CASE', user);
    logger.info('[trust/cases] POST success', {
      agent_id: user.id,
      case_id: result.case_id,
      buyer_name,
      property_title,
    });
    res
      .status(201)
      .json(successResponse({ case_id: result.case_id, event_hash: result.event_hash }));
  } catch (e) {
    logger.error('[trust/cases] POST error', { error: e instanceof Error ? e.message : 'Unknown' });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}
