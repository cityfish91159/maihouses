/**
 * BE-7 | 查詢通知目標 API
 *
 * 提供查詢案件通知目標的功能，供 BE-5（進度更新推播）、
 * BE-8（推播失敗處理）、BE-9（案件關閉通知）使用
 *
 * 優先順序：buyer_user_id > buyer_line_id
 *
 * Skills Applied:
 * - [NASA TypeScript Safety] Zod Schema 驗證 + 函數入口驗證
 * - [Backend Safeguard] 權限驗證與錯誤處理
 * - [Audit Logging] 結構化日誌（PII 遮罩）
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { supabase, SYSTEM_API_KEY } from './_utils';
import { cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { LineUserIdSchema } from './constants/validation';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';

// ============================================================================
// Types
// ============================================================================

/**
 * 通知目標類型 - Web Push
 * 使用已註冊用戶的 user_id
 */
export interface NotifyTargetPush {
  type: 'push';
  userId: string;
}

/**
 * 通知目標類型 - LINE
 * 使用未註冊用戶的 LINE ID
 */
export interface NotifyTargetLine {
  type: 'line';
  lineId: string;
}

/**
 * 通知目標聯合類型
 * - NotifyTargetPush: 使用 Web Push
 * - NotifyTargetLine: 使用 LINE
 * - null: 無可用通知目標
 */
export type NotifyTarget = NotifyTargetPush | NotifyTargetLine | null;

// ============================================================================
// Zod Schemas
// ============================================================================

/**
 * UUID Schema - 共用
 */
const UUIDSchema = z.string().uuid();

/**
 * 案件通知欄位 Schema
 * 從 trust_cases 表查詢 buyer_user_id 和 buyer_line_id
 */
const CaseNotifyFieldsSchema = z.object({
  buyer_user_id: UUIDSchema.nullable(),
  buyer_line_id: LineUserIdSchema.nullable().or(z.literal(null)),
});

type CaseNotifyFields = z.infer<typeof CaseNotifyFieldsSchema>;

/**
 * API 查詢參數 Schema
 */
const QuerySchema = z.object({
  caseId: UUIDSchema.describe('caseId 必須是有效的 UUID'),
});

/**
 * getNotifyTarget 函數參數 Schema
 */
const GetNotifyTargetParamSchema = UUIDSchema;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 遮罩 UUID（只顯示前 8 字元）
 * @internal
 */
function maskUUID(uuid: string): string {
  return `${uuid.slice(0, 8)}...`;
}

/**
 * 遮罩 LINE User ID（只顯示前 5 字元）
 * @internal
 */
function maskLineId(lineId: string): string {
  return `${lineId.slice(0, 5)}...`;
}

// ============================================================================
// Core Function
// ============================================================================

/**
 * 取得案件的通知目標
 *
 * 優先順序：buyer_user_id > buyer_line_id
 *
 * @param caseId - 案件 UUID（必須是有效格式）
 * @returns NotifyTarget | null
 * @throws Error 當 caseId 格式無效或案件不存在時
 *
 * @example
 * ```typescript
 * const target = await getNotifyTarget("550e8400-e29b-41d4-a716-446655440000");
 * if (target?.type === "push") {
 *   // 發送 Web Push
 * } else if (target?.type === "line") {
 *   // 發送 LINE 訊息
 * } else {
 *   // 無可用通知目標
 * }
 * ```
 */
export async function getNotifyTarget(caseId: string): Promise<NotifyTarget> {
  // [NASA TypeScript Safety] 函數入口驗證 - 不信任任何輸入
  const paramResult = GetNotifyTargetParamSchema.safeParse(caseId);
  if (!paramResult.success) {
    logger.warn('[notify] Invalid caseId format', { caseId: maskUUID(caseId) });
    throw new Error(`Invalid caseId format: ${caseId}`);
  }

  logger.info('[notify] getNotifyTarget called', { caseId: maskUUID(caseId) });

  // 查詢 trust_cases 表
  const { data, error } = await supabase
    .from('trust_cases')
    .select('buyer_user_id, buyer_line_id')
    .eq('id', caseId)
    .single();

  // 處理 DB 錯誤
  if (error) {
    // PGRST116 表示找不到資料
    if (error.code === 'PGRST116') {
      logger.warn('[notify] Case not found', { caseId: maskUUID(caseId) });
      throw new Error(`Case not found: ${caseId}`);
    }
    logger.error('[notify] Database error', error, { caseId: maskUUID(caseId) });
    throw new Error(`Database error: ${error.message}`);
  }

  // 驗證資料結構
  const parseResult = CaseNotifyFieldsSchema.safeParse(data);
  if (!parseResult.success) {
    logger.error('[notify] Invalid data structure', parseResult.error, {
      caseId: maskUUID(caseId),
    });
    throw new Error('Invalid case data structure');
  }

  const caseData: CaseNotifyFields = parseResult.data;

  // 優先順序：buyer_user_id > buyer_line_id
  if (caseData.buyer_user_id) {
    logger.info('[notify] Found push target', {
      caseId: maskUUID(caseId),
      userIdMasked: maskUUID(caseData.buyer_user_id),
    });
    return { type: 'push', userId: caseData.buyer_user_id };
  }

  if (caseData.buyer_line_id) {
    logger.info('[notify] Found LINE target', {
      caseId: maskUUID(caseId),
      lineIdMasked: maskLineId(caseData.buyer_line_id),
    });
    return { type: 'line', lineId: caseData.buyer_line_id };
  }

  // 無可用通知目標
  logger.info('[notify] No notify target available', { caseId: maskUUID(caseId) });
  return null;
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * GET /api/trust/notify?caseId=xxx
 *
 * 查詢案件的通知目標（供調試和測試用）
 *
 * 需要 System API Key 認證（x-system-key header）
 *
 * @returns
 * - 200: { success: true, data: { caseId, target } }
 * - 400: 無效的查詢參數
 * - 401: 未授權
 * - 404: 案件不存在
 * - 405: 不支援的 HTTP 方法
 * - 500: 伺服器錯誤
 */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS
  cors(req, res);
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允許 GET
  if (req.method !== 'GET') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, '只允許 GET 方法'));
    return;
  }

  // 驗證 System API Key
  const systemKey = req.headers['x-system-key'];
  if (systemKey !== SYSTEM_API_KEY) {
    logger.warn('[notify] Unauthorized access attempt');
    res.status(401).json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, '未授權的存取'));
    return;
  }

  // 驗證查詢參數
  const queryResult = QuerySchema.safeParse(req.query);
  if (!queryResult.success) {
    const zodErrors = queryResult.error?.issues ?? [];
    const errorMessage =
      zodErrors.length > 0
        ? zodErrors.map((e: { message: string }) => e.message).join(', ')
        : 'Invalid query parameters';
    res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_QUERY, errorMessage));
    return;
  }

  const { caseId } = queryResult.data;

  try {
    const target = await getNotifyTarget(caseId);

    res.status(200).json(
      successResponse({
        caseId,
        target,
      })
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    // caseId 格式無效
    if (errorMessage.startsWith('Invalid caseId format')) {
      res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, errorMessage));
      return;
    }

    // 案件不存在
    if (errorMessage.startsWith('Case not found')) {
      res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, errorMessage));
      return;
    }

    // 資料結構無效
    if (errorMessage === 'Invalid case data structure') {
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '資料結構錯誤'));
      return;
    }

    // 其他錯誤
    logger.error('[notify] Handler error', err);
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器錯誤'));
  }
}
