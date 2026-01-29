/**
 * Trust Case Query Service
 *
 * 純業務邏輯層：查詢用戶的安心交易案件
 *
 * 設計原則：
 * - 無 HTTP 依賴（可被 API Handler 或 Webhook 直接呼叫）
 * - 呼叫者負責認證（此層不做權限檢查）
 * - 回傳結構化結果，包含 updatedAt 和可轉換為 stepName 的 currentStep
 *
 * 提供三種查詢方式：
 * - queryCasesByIdentity({ userId?, lineUserId? }) - 統一入口，支援雙欄位 OR 查詢
 * - queryCasesByUserId(userId) - 向後兼容，內部呼叫 queryCasesByIdentity
 * - queryMyCases(lineUserId) - 向後兼容，內部呼叫 queryCasesByIdentity
 *
 * 使用者：
 * - api/trust/my-cases.ts (HTTP API - BE-6 雙認證模式)
 * - api/line/webhook.ts (LINE 查詢)
 *
 * 版本控制：
 * - v1.0: 雙認證互斥查詢
 * - v1.1: 統一入口 + OR 查詢 + 去重
 */

// TODO(BE-6-PAGINATION): Add limit/offset when case count > 100
// 目前無分頁功能，當消費者案件數量過多時可能影響效能。
// 建議在 Phase 2 實作 cursor-based pagination。

import { z } from 'zod';
import { supabase } from '../_utils';
import { logger } from '../../lib/logger';
import {
  ACTIVE_STATUSES,
  LineUserIdSchema,
  TRUST_ROOM_BASE_URL,
  TRUST_ROOM_PATH_PREFIX,
} from '../constants/validation';
import { ERR_DB_QUERY_FAILED, ERR_INVALID_LINE_ID, ERR_UNEXPECTED } from '../constants/messages';

// ============================================================================
// Constants
// ============================================================================

/** 步驟名稱對照表（M1-M6） */
export const TRUST_STEP_NAMES: Record<number, string> = {
  1: 'M1 接洽',
  2: 'M2 帶看',
  3: 'M3 出價',
  4: 'M4 斡旋',
  5: 'M5 成交',
  6: 'M6 交屋',
};

// ============================================================================
// Types
// ============================================================================

/** 單一案件資料（業務邏輯層） */
export interface CaseData {
  id: string;
  propertyTitle: string;
  agentName: string;
  currentStep: number;
  status: 'active' | 'dormant';
  updatedAt: string;
}

/** 查詢結果 */
export interface MyCasesResult {
  cases: CaseData[];
  total: number;
}

/** 查詢成功回傳 */
export interface QuerySuccess {
  success: true;
  data: MyCasesResult;
}

/** 查詢失敗回傳 */
export interface QueryFailure {
  success: false;
  error: string;
  code: 'INVALID_LINE_ID' | 'INVALID_USER_ID' | 'DB_ERROR' | 'VALIDATION_ERROR';
}

export type QueryResult = QuerySuccess | QueryFailure;

// ============================================================================
// Zod Schemas（內部使用）
// ============================================================================

const ActiveStatusSchema = z.enum(ACTIVE_STATUSES);

const CaseRowSchema = z.object({
  id: z.string().uuid(),
  property_title: z.string(),
  current_step: z.number().int().min(1).max(6),
  status: ActiveStatusSchema,
  agent_id: z.string().uuid(),
  updated_at: z.string(),
});

const AgentRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 遮蔽 LINE ID（用於日誌）
 */
function maskLineId(lineId: string): string {
  return lineId.length < 5 ? '***' : `${lineId.slice(0, 5)}...`;
}

/**
 * 遮蔽 UUID（用於日誌）
 */
function maskUUID(uuid: string): string {
  return uuid.length < 8 ? '***' : `${uuid.slice(0, 8)}...`;
}

/**
 * 取得步驟名稱
 */
export function getStepName(step: number): string {
  return TRUST_STEP_NAMES[step] ?? `步驟 ${step}`;
}

/**
 * 生成 Trust Room URL
 *
 * @param caseId - 案件 ID（UUID 格式）
 * @returns 完整的 Trust Room URL
 */
export function generateTrustRoomUrl(caseId: string): string {
  return `${TRUST_ROOM_BASE_URL}${TRUST_ROOM_PATH_PREFIX}${caseId}`;
}

// ============================================================================
// Unified Query Function (統一入口)
// ============================================================================

/** User ID Zod Schema */
const UserIdSchema = z.string().uuid({
  message: 'User ID 格式錯誤，應為有效的 UUID',
});

/** 統一查詢參數 */
export interface QueryIdentityParams {
  userId?: string; // UUID 格式，來自 JWT
  lineUserId?: string; // U + 32 hex，來自 LINE
}

/**
 * 統一入口：查詢用戶的進行中案件
 *
 * 支援雙欄位 OR 查詢：
 * - 若同時提供 userId 和 lineUserId，會查詢 buyer_user_id = X OR buyer_line_id = Y
 * - 結果會自動去重（以 case id 為準）
 *
 * @param params - 查詢參數（至少提供一個）
 * @returns 查詢結果（成功/失敗）
 *
 * @example
 * ```typescript
 * // 只用 userId
 * const result = await queryCasesByIdentity({ userId: "550e..." });
 *
 * // 只用 lineUserId
 * const result = await queryCasesByIdentity({ lineUserId: "U123..." });
 *
 * // 雙欄位 OR 查詢
 * const result = await queryCasesByIdentity({ userId: "550e...", lineUserId: "U123..." });
 * ```
 */
export async function queryCasesByIdentity(params: QueryIdentityParams): Promise<QueryResult> {
  const startTime = Date.now();
  const { userId, lineUserId } = params;

  // Step 1: 至少需要一個識別參數
  if (!userId && !lineUserId) {
    return {
      success: false,
      error: '需要提供 userId 或 lineUserId',
      code: 'VALIDATION_ERROR',
    };
  }

  // Step 2: 驗證參數格式
  if (userId) {
    const userIdResult = UserIdSchema.safeParse(userId);
    if (!userIdResult.success) {
      logger.warn('[case-query] Invalid user ID format', {
        userIdMasked: maskUUID(userId),
      });
      return {
        success: false,
        error: 'User ID 格式錯誤',
        code: 'INVALID_USER_ID',
      };
    }
  }

  if (lineUserId) {
    const lineIdResult = LineUserIdSchema.safeParse(lineUserId);
    if (!lineIdResult.success) {
      return {
        success: false,
        error: ERR_INVALID_LINE_ID,
        code: 'INVALID_LINE_ID',
      };
    }
  }

  const maskedUserId = userId ? maskUUID(userId) : undefined;
  const maskedLineId = lineUserId ? maskLineId(lineUserId) : undefined;

  logger.info('[case-query] Query by identity started', {
    userIdMasked: maskedUserId,
    lineIdMasked: maskedLineId,
    queryMode: userId && lineUserId ? 'OR' : 'single',
  });

  try {
    // Step 3: 根據參數決定查詢策略
    let allCases: z.infer<typeof CaseRowSchema>[] = [];

    if (userId && lineUserId) {
      // 雙欄位 OR 查詢：分別查詢後合併去重
      const [userResult, lineResult] = await Promise.all([
        supabase
          .from('trust_cases')
          .select('id, property_title, current_step, status, agent_id, updated_at')
          .eq('buyer_user_id', userId)
          .in('status', ACTIVE_STATUSES),
        supabase
          .from('trust_cases')
          .select('id, property_title, current_step, status, agent_id, updated_at')
          .eq('buyer_line_id', lineUserId)
          .in('status', ACTIVE_STATUSES),
      ]);

      if (userResult.error) {
        logger.error('[case-query] DB query error (userId in OR)', {
          error: userResult.error.message,
          code: userResult.error.code,
        });
        return {
          success: false,
          error: ERR_DB_QUERY_FAILED,
          code: 'DB_ERROR',
        };
      }

      if (lineResult.error) {
        logger.error('[case-query] DB query error (lineId in OR)', {
          error: lineResult.error.message,
          code: lineResult.error.code,
        });
        return {
          success: false,
          error: ERR_DB_QUERY_FAILED,
          code: 'DB_ERROR',
        };
      }

      // 合併並去重：先驗證再去重（防禦性編程，消除 as 斷言）
      const combined = [...(userResult.data ?? []), ...(lineResult.data ?? [])];

      // Step 3a: 先用 Zod 驗證所有資料
      const parseResult = z.array(CaseRowSchema).safeParse(combined);
      if (!parseResult.success) {
        logger.warn('[case-query] Some case rows invalid (OR query)', {
          issues: parseResult.error.issues.slice(0, 3).map((i) => i.message),
        });
        // 降級處理：逐筆驗證，只保留有效資料
        const validCases: z.infer<typeof CaseRowSchema>[] = [];
        for (const c of combined) {
          const singleResult = CaseRowSchema.safeParse(c);
          if (singleResult.success) {
            validCases.push(singleResult.data);
          }
        }
        // Step 3b: 對驗證後的資料去重（類型安全）
        const seenIds = new Set<string>();
        for (const c of validCases) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            allCases.push(c);
          }
        }
      } else {
        // Step 3b: 對驗證後的資料去重（類型安全）
        const seenIds = new Set<string>();
        for (const c of parseResult.data) {
          if (!seenIds.has(c.id)) {
            seenIds.add(c.id);
            allCases.push(c);
          }
        }
      }
    } else if (userId) {
      // 單欄位查詢：buyer_user_id
      const { data, error } = await supabase
        .from('trust_cases')
        .select('id, property_title, current_step, status, agent_id, updated_at')
        .eq('buyer_user_id', userId)
        .in('status', ACTIVE_STATUSES)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('[case-query] DB query error (userId)', {
          error: error.message,
          code: error.code,
        });
        return {
          success: false,
          error: ERR_DB_QUERY_FAILED,
          code: 'DB_ERROR',
        };
      }

      const parseResult = z.array(CaseRowSchema).safeParse(data ?? []);
      if (parseResult.success) {
        allCases = parseResult.data;
      } else {
        // 降級處理：記錄警告，逐筆驗證保留有效資料
        logger.warn('[case-query] Some case rows invalid (userId query)', {
          issues: parseResult.error.issues.slice(0, 3).map((i) => i.message),
          userIdMasked: maskedUserId,
        });
        for (const c of data ?? []) {
          const singleResult = CaseRowSchema.safeParse(c);
          if (singleResult.success) {
            allCases.push(singleResult.data);
          }
        }
      }
    } else if (lineUserId) {
      // 單欄位查詢：buyer_line_id
      const { data, error } = await supabase
        .from('trust_cases')
        .select('id, property_title, current_step, status, agent_id, updated_at')
        .eq('buyer_line_id', lineUserId)
        .in('status', ACTIVE_STATUSES)
        .order('updated_at', { ascending: false });

      if (error) {
        logger.error('[case-query] DB query error (lineId)', {
          error: error.message,
          code: error.code,
        });
        return {
          success: false,
          error: ERR_DB_QUERY_FAILED,
          code: 'DB_ERROR',
        };
      }

      const parseResult = z.array(CaseRowSchema).safeParse(data ?? []);
      if (parseResult.success) {
        allCases = parseResult.data;
      } else {
        // 降級處理：記錄警告，逐筆驗證保留有效資料
        logger.warn('[case-query] Some case rows invalid (lineId query)', {
          issues: parseResult.error.issues.slice(0, 3).map((i) => i.message),
          lineIdMasked: maskedLineId,
        });
        for (const c of data ?? []) {
          const singleResult = CaseRowSchema.safeParse(c);
          if (singleResult.success) {
            allCases.push(singleResult.data);
          }
        }
      }
    }

    // Step 4: 無案件
    if (allCases.length === 0) {
      logger.info('[case-query] No cases found', {
        userIdMasked: maskedUserId,
        lineIdMasked: maskedLineId,
        durationMs: Date.now() - startTime,
      });
      return {
        success: true,
        data: { cases: [], total: 0 },
      };
    }

    // Step 5: 排序（OR 查詢後需要重新排序）
    // 使用字串比較：ISO 8601 格式可直接按字典序比較，避免重複建立 Date 物件
    allCases.sort((a, b) => b.updated_at.localeCompare(a.updated_at));

    // Step 6: 批次查詢房仲名稱（降級處理）
    const agentIds = [...new Set(allCases.map((c) => c.agent_id))];
    const agentNameMap = new Map<string, string>();

    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, name')
      .in('id', agentIds);

    if (agentsError) {
      logger.warn('[case-query] Agents query failed (non-blocking)', {
        error: agentsError.message,
        code: agentsError.code,
      });
    } else if (agents) {
      const agentsParseResult = z.array(AgentRowSchema).safeParse(agents);
      if (agentsParseResult.success) {
        for (const agent of agentsParseResult.data) {
          agentNameMap.set(agent.id, agent.name);
        }
      }
    }

    // Step 7: 組合結果
    const resultCases: CaseData[] = allCases.map((c) => ({
      id: c.id,
      propertyTitle: c.property_title,
      agentName: agentNameMap.get(c.agent_id) ?? '未知房仲',
      currentStep: c.current_step,
      status: c.status,
      updatedAt: c.updated_at,
    }));

    logger.info('[case-query] Success', {
      userIdMasked: maskedUserId,
      lineIdMasked: maskedLineId,
      count: resultCases.length,
      durationMs: Date.now() - startTime,
    });

    return {
      success: true,
      data: {
        cases: resultCases,
        total: resultCases.length,
      },
    };
  } catch (e) {
    logger.error('[case-query] Unexpected error', {
      error: e instanceof Error ? e.message : 'Unknown',
      userIdMasked: maskedUserId,
      lineIdMasked: maskedLineId,
    });
    return {
      success: false,
      error: ERR_UNEXPECTED,
      code: 'DB_ERROR',
    };
  }
}

// ============================================================================
// Legacy Functions (向後兼容，內部呼叫 queryCasesByIdentity)
// ============================================================================

/**
 * 查詢註冊用戶的進行中案件
 *
 * @deprecated 請使用 queryCasesByIdentity({ userId }) 替代
 *
 * @param userId - User ID（UUID 格式，來自 JWT token）
 * @returns 查詢結果（成功/失敗）
 */
export async function queryCasesByUserId(userId: string): Promise<QueryResult> {
  return queryCasesByIdentity({ userId });
}

/**
 * 查詢 LINE 用戶的進行中案件
 *
 * @deprecated 請使用 queryCasesByIdentity({ lineUserId }) 替代
 *
 * @param lineUserId - LINE User ID（U + 32 hex）
 * @returns 查詢結果（成功/失敗）
 */
export async function queryMyCases(lineUserId: string): Promise<QueryResult> {
  return queryCasesByIdentity({ lineUserId });
}
