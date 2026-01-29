/**
 * BE-8 | 補完買方資訊 API
 *
 * POST /api/trust/complete-buyer-info
 * Body: { caseId: string, name: string, phone: string, email?: string }
 *
 * 商業邏輯：
 * - 驗證案件存在且狀態為 active/dormant
 * - 更新 buyer_name, buyer_phone, buyer_email
 * - 支援雙認證：JWT (房仲) 或 x-system-key (系統)
 * - 審計日誌記錄
 *
 * Skills Applied:
 * - [Backend Safeguard] 權限驗證 + 雙認證模式
 * - [NASA TypeScript Safety] Zod 驗證 + 完整類型
 * - [Audit Logging] 審計日誌（標記來源）
 * - [No Lazy Implementation] 完整實作
 * - [Security Audit] 防止越權操作
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  supabase,
  verifyToken,
  cors,
  logAudit,
  SYSTEM_API_KEY,
  getClientIp,
  getUserAgent,
  withTimeout,
} from './_utils';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { logger } from '../lib/logger';
import { rateLimitMiddleware } from '../lib/rateLimiter';

// ============================================================================
// Zod Schemas [NASA TypeScript Safety]
// ============================================================================

/**
 * 補完買方資訊請求 Schema
 *
 * 必填欄位：
 * - caseId: 案件 ID (UUID)
 * - name: 買方姓名
 * - phone: 買方電話
 *
 * 可選欄位：
 * - email: 買方電子郵件
 */
const CompleteBuyerInfoRequestSchema = z.object({
  caseId: z.string().uuid('案件 ID 格式錯誤'),
  name: z
    .string()
    .min(1, '姓名不可為空')
    .max(50, '姓名不可超過 50 字')
    .regex(/^[\u4e00-\u9fa5a-zA-Z\s]+$/, '姓名僅能包含中英文'),
  phone: z
    .string()
    .min(1, '電話不可為空')
    .regex(/^09\d{8}$/, '請輸入正確的台灣手機號碼（09 開頭 10 碼）'),
  email: z
    .string()
    .email('請輸入正確的 Email 格式')
    .max(100, 'Email 不可超過 100 字')
    .optional()
    .or(z.literal('')),
  note: z.string().max(500, '備註不可超過 500 字').optional(),
});

type CompleteBuyerInfoRequest = z.infer<typeof CompleteBuyerInfoRequestSchema>;

/** 案件狀態 Schema - 僅包含 active/dormant/closed */
const CaseStatusSchema = z.enum([
  'active',
  'dormant',
  'closed',
  'pending',
  'completed',
  'cancelled',
  'expired',
]);

/** trust_cases 查詢結果 Schema */
const TrustCaseRowSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string(),
  status: CaseStatusSchema,
  buyer_name: z.string(),
  token_expires_at: z.string().optional(), // [Team 9 修復] 添加 token 過期檢查
  token_revoked_at: z.string().nullable().optional(), // [Team 9 修復] 添加 token 撤銷檢查
});

// ============================================================================
// Handler
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // CORS
  cors(req, res);

  // OPTIONS 預檢
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 僅允許 POST
  if (req.method !== 'POST') {
    res.status(405).json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, '只允許 POST 方法'));
    return;
  }

  // [Team 2 修復] Rate Limiting (10 requests per minute)
  const rateLimitError = rateLimitMiddleware(req, 10, 60000);
  if (rateLimitError) {
    res.setHeader('X-RateLimit-Remaining', rateLimitError.remaining.toString());
    res.setHeader('Retry-After', rateLimitError.retryAfter?.toString() || '60');
    return void res
      .status(429)
      .json(
        errorResponse(API_ERROR_CODES.RATE_LIMIT_EXCEEDED, '請求過於頻繁，請稍後再試', {
          retryAfter: rateLimitError.retryAfter,
        })
      );
  }

  try {
    // Step 1: 雙認證（JWT 或 System Key）
    const systemKey = req.headers['x-system-key'];
    let authSource: 'jwt' | 'system' = 'jwt';
    let user: ReturnType<typeof verifyToken> | null = null;

    if (systemKey) {
      if (systemKey !== SYSTEM_API_KEY) {
        res.status(401).json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, '未授權的存取'));
        return;
      }
      authSource = 'system';
    } else {
      try {
        user = verifyToken(req);
      } catch {
        res.status(401).json(errorResponse(API_ERROR_CODES.UNAUTHORIZED, '未登入或 Token 已過期'));
        return;
      }

      if (user.role !== 'agent') {
        res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '只有房仲可以操作案件'));
        return;
      }
    }

    // Step 2: 檢查請求 Body
    const bodyResult = CompleteBuyerInfoRequestSchema.safeParse(req.body);
    if (!bodyResult.success) {
      logger.warn('[trust/complete-buyer-info] Invalid request body', {
        error: bodyResult.error.message,
      });
      res
        .status(400)
        .json(
          errorResponse(API_ERROR_CODES.INVALID_INPUT, '請求參數格式錯誤', bodyResult.error.issues)
        );
      return;
    }

    const { caseId, name, phone, email } = bodyResult.data;

    // Step 3: 查詢案件是否存在
    // [Team 8 第三位修復] 添加 15 秒 timeout 保護
    // [Team 9 修復] 添加 token_expires_at 和 token_revoked_at 欄位查詢
    const { data: caseRow, error: caseError } = await withTimeout(
      supabase
        .from('trust_cases')
        .select('id, agent_id, status, buyer_name, token_expires_at, token_revoked_at')
        .eq('id', caseId)
        .single(),
      15000,
      'Database query timed out after 15 seconds'
    );

    if (caseError || !caseRow) {
      if (caseError?.code === 'PGRST116') {
        res.status(404).json(errorResponse(API_ERROR_CODES.NOT_FOUND, '找不到案件'));
        return;
      }

      logger.error('[trust/complete-buyer-info] Database error', {
        error: caseError?.message ?? 'Unknown',
        caseId,
      });
      res.status(500).json(errorResponse(API_ERROR_CODES.DATA_FETCH_FAILED, '案件載入失敗'));
      return;
    }

    const caseParseResult = TrustCaseRowSchema.safeParse(caseRow);
    if (!caseParseResult.success) {
      logger.error('[trust/complete-buyer-info] Case data validation failed', {
        caseId,
        issues: caseParseResult.error.issues,
      });
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '資料格式驗證失敗'));
      return;
    }

    const currentCase = caseParseResult.data;

    // Step 4: 驗證權限（僅 JWT 需要）
    if (authSource === 'jwt' && user) {
      if (currentCase.agent_id !== user.id) {
        res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '無權限操作此案件'));
        return;
      }
    }

    // [Team 9 修復] Step 4.5: 驗證 Token 有效性
    if (currentCase.token_expires_at) {
      const expiresAt = new Date(currentCase.token_expires_at);
      if (expiresAt < new Date()) {
        logger.warn('[trust/complete-buyer-info] Token expired', {
          caseId,
          token_expires_at: currentCase.token_expires_at,
        });
        res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '案件 Token 已過期'));
        return;
      }
    }

    if (currentCase.token_revoked_at) {
      logger.warn('[trust/complete-buyer-info] Token revoked', {
        caseId,
        token_revoked_at: currentCase.token_revoked_at,
      });
      res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '案件 Token 已撤銷'));
      return;
    }

    // Step 5: 驗證狀態（僅允許 active / dormant）
    if (currentCase.status !== 'active' && currentCase.status !== 'dormant') {
      res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '案件狀態不允許更新買方資訊'));
      return;
    }

    // Step 6: 更新買方資訊（原子性）
    // 注意：使用 buyer_phone 和 buyer_email 欄位（見 migration: 20260128_add_buyer_email_phone.sql）
    const updateData: Record<string, string> = {
      buyer_name: name,
      buyer_phone: phone,
    };

    if (email) {
      updateData.buyer_email = email;
    }

    let updateQuery = supabase
      .from('trust_cases')
      .update(updateData)
      .eq('id', caseId)
      .in('status', ['active', 'dormant']);

    // JWT 認證時加入 agent_id 驗證防止競態條件
    if (authSource === 'jwt' && user) {
      updateQuery = updateQuery.eq('agent_id', user.id);
    }

    // [Team 8 第三位修復] 為 update 查詢添加 timeout
    const { data: updatedCase, error: updateError } = await withTimeout(
      updateQuery.select('id, buyer_name, buyer_phone, buyer_email').single(),
      15000,
      'Update operation timed out after 15 seconds'
    );

    // [Team 8 修復] 區分並發衝突與真正錯誤，細分 PGRST 錯誤碼
    if (updateError) {
      // PGRST116 = no rows returned，可能是並發狀態變更
      if (updateError.code === 'PGRST116') {
        logger.warn('[trust/complete-buyer-info] Concurrent update conflict', {
          caseId,
          error: updateError.message,
        });
        res.status(409).json(errorResponse(API_ERROR_CODES.CONFLICT, '案件狀態已變更，請重新操作'));
        return;
      }

      // PGRST301 = 權限不足（RLS 拒絕）
      if (updateError.code === 'PGRST301') {
        logger.warn('[trust/complete-buyer-info] Permission denied by RLS', {
          caseId,
          error: updateError.message,
        });
        res.status(403).json(errorResponse(API_ERROR_CODES.FORBIDDEN, '無權限操作此案件'));
        return;
      }

      // 其他資料庫錯誤
      logger.error('[trust/complete-buyer-info] Update failed', {
        error: updateError.message ?? 'Unknown',
        code: updateError.code,
        caseId,
      });
      res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '案件更新失敗'));
      return;
    }

    if (!updatedCase) {
      logger.warn('[trust/complete-buyer-info] No data returned', { caseId });
      res.status(409).json(errorResponse(API_ERROR_CODES.CONFLICT, '案件狀態已變更，請重新操作'));
      return;
    }

    // Step 7: 寫入審計紀錄（標記來源 jwt/system）
    const auditUser =
      authSource === 'jwt' && user
        ? user
        : {
            id: 'system',
            role: 'system' as const,
            txId: 'system',
            ip: getClientIp(req),
            agent: getUserAgent(req),
          };

    // [Team 5 修復] 改為阻塞模式審計日誌
    // [Team 8 第五位修復] 為 logAudit 添加 timeout 保護
    try {
      await withTimeout(
        logAudit(caseId, `COMPLETE_BUYER_INFO_${authSource.toUpperCase()}`, auditUser),
        5000,
        'Audit log timeout after 5 seconds'
      );
    } catch (auditErr) {
      logger.error('[trust/complete-buyer-info] Audit log failed', {
        case_id: caseId,
        error: auditErr instanceof Error ? auditErr.message : 'Unknown',
      });
      return void res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Audit logging failed'));
    }

    logger.info('[trust/complete-buyer-info] Buyer info updated', {
      case_id: caseId,
      name,
      phone,
      email: email ?? 'N/A',
      source: authSource,
    });

    // Step 8: 成功回傳
    res.status(200).json(
      successResponse({
        success: true,
        caseId,
        buyerName: updatedCase.buyer_name,
      })
    );
  } catch (e) {
    logger.error('[trust/complete-buyer-info] Unexpected error', {
      error: e instanceof Error ? e.message : 'Unknown',
    });
    res.status(500).json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '伺服器內部錯誤'));
  }
}
