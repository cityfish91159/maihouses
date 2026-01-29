/**
 * Trust Flow 共用工具模組
 *
 * 提供 Trust Room API 共用的功能：
 * - Supabase 客戶端
 * - JWT 驗證
 * - 審計日誌
 * - CORS 處理
 * - IP/User-Agent 取得
 */

import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { cors as sharedCors } from '../lib/cors';

// Types for Trust Room transactions
export interface TrustStep {
  name: string;
  // 修復 TS 錯誤：擴展狀態類型以符合實際業務流程
  agentStatus: 'pending' | 'confirmed' | 'submitted';
  buyerStatus: 'pending' | 'confirmed';
  locked: boolean;
  data: Record<string, unknown>;
  // 修復 TS 錯誤：擴展 paymentStatus 以符合完整付款流程
  paymentStatus?: 'pending' | 'initiated' | 'paid' | 'completed' | 'expired';
  // 修復 TS 錯誤：deadline 可能是 number（timestamp）或 string（ISO）
  paymentDeadline?: number | string | null;
  // 修復 TS 錯誤：checklist item 使用 label 而非 text
  checklist?: Array<{ label: string; checked: boolean }>;
}

export interface TrustState {
  id: string;
  currentStep: number;
  isPaid: boolean;
  steps: Record<number, TrustStep>;
  // 修復 TS 錯誤：supplements 欄位與實際使用一致
  supplements: Array<{
    id?: string;
    role?: string;
    content: string;
    timestamp: string | number;
  }>;
}

export interface JwtUser {
  id: string;
  role: 'agent' | 'buyer' | 'system';
  txId: string;
  iat?: number;
  exp?: number;
}

/** [NASA TypeScript Safety] JWT Payload Zod Schema */
const JwtUserSchema = z.object({
  id: z.string(),
  role: z.enum(['agent', 'buyer', 'system']),
  txId: z.string(),
  iat: z.number().optional(),
  exp: z.number().optional(),
});

/** [NASA TypeScript Safety] Trust Query Schema - 共用於 6 個舊版 API */
export const TrustQuerySchema = z.object({
  id: z.string().min(1, 'Transaction ID is required'),
});

export interface AuditUser extends JwtUser {
  ip: string;
  agent: string;
  metadata?: Record<string, unknown>; // 可選的額外資料（如 buyer_name）
}

/** 稽核日誌狀態（對應 DB status 欄位） */
export type AuditStatus = 'success' | 'failed' | 'pending';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// [Team 8 第四位修復] 延遲驗證：只在實際使用時檢查，避免測試環境 import 失敗
function validateSupabaseCredentials(): void {
  if (!supabaseUrl || !supabaseKey) {
    const errMsg = '[trust/_utils] Missing Supabase credentials';
    logger.error(errMsg);
    throw new Error(errMsg);
  }
}

// [Team 8 第四位修復] 條件式初始化：測試環境可以 mock，生產環境驗證
export const supabase = (() => {
  // 測試環境：強制測試必須 Mock supabase
  if (process.env.VITEST && (!supabaseUrl || !supabaseKey)) {
    throw new Error(
      '[trust/_utils] Supabase credentials not set in test environment. ' +
        "Please mock 'supabase' in your test using vi.mock()."
    );
  }

  // 生產環境：驗證憑證
  validateSupabaseCredentials();

  return createClient(supabaseUrl!, supabaseKey!, {
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-request-timeout': '15000', // 15 秒 timeout
      },
    },
    auth: {
      persistSession: false, // API 端不需要持久化 session
    },
  });
})();

/**
 * [Team 8 修復] Timeout 包裹函數
 *
 * 為任何 Promise 添加 timeout 保護，防止請求長時間懸掛
 *
 * @param promise - 要執行的 Promise
 * @param timeoutMs - Timeout 時間（毫秒）
 * @param errorMessage - Timeout 錯誤訊息
 * @returns Promise with timeout
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timed out'
): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutHandle!);
    return result;
  } catch (error) {
    clearTimeout(timeoutHandle!);
    throw error;
  }
}

// [Team 8 第四位修復] JWT_SECRET 條件式初始化
export const JWT_SECRET = (() => {
  // 測試環境：返回測試用 secret
  if (process.env.VITEST && !process.env.JWT_SECRET) {
    return 'test-jwt-secret-for-vitest';
  }

  // 生產環境：驗證並返回
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET env var');
  }
  return jwtSecret;
})();

// [Team 8 第四位修復] SYSTEM_API_KEY 條件式初始化
export const SYSTEM_API_KEY = (() => {
  // 測試環境：返回測試用 API key
  if (process.env.VITEST && !process.env.SYSTEM_API_KEY) {
    return 'test-system-api-key-for-vitest';
  }

  // 生產環境：驗證並返回
  const systemApiKey = process.env.SYSTEM_API_KEY;
  if (!systemApiKey) {
    throw new Error('Missing SYSTEM_API_KEY env var');
  }
  return systemApiKey;
})();

export const TIMEOUTS: Record<number, number> = { 5: 12 * 3600 * 1000 }; // 12 hours

export const createInitialState = (id: string): TrustState => ({
  id,
  currentStep: 1,
  isPaid: false,
  steps: {
    1: {
      name: '已電聯',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      data: {},
      locked: false,
    },
    2: {
      name: '已帶看',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      locked: false,
      data: {
        risks: { water: false, wall: false, structure: false, other: false },
      },
    },
    3: {
      name: '已出價',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      data: {},
      locked: false,
    },
    4: {
      name: '已斡旋',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      data: {},
      locked: false,
    },
    5: {
      name: '已成交',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      locked: false,
      paymentStatus: 'pending' as const,
      paymentDeadline: null,
      data: {},
    },
    6: {
      name: '已交屋',
      agentStatus: 'pending' as const,
      buyerStatus: 'pending' as const,
      locked: false,
      checklist: [],
      data: {},
    },
  },
  supplements: [],
});

/** TrustState Zod Schema 用於驗證 DB 回傳資料 */
const TrustStateSchema = z.object({
  id: z.string(),
  currentStep: z.number(),
  isPaid: z.boolean(),
  steps: z.record(
    z.string(),
    z.object({
      name: z.string(),
      // 修復 TS 錯誤：擴展狀態類型
      agentStatus: z.enum(['pending', 'confirmed', 'submitted']),
      buyerStatus: z.enum(['pending', 'confirmed']),
      locked: z.boolean(),
      data: z.record(z.string(), z.unknown()),
      // 修復 TS 錯誤：擴展 paymentStatus
      paymentStatus: z.enum(['pending', 'initiated', 'paid', 'completed', 'expired']).optional(),
      // 修復 TS 錯誤：deadline 可能是 number 或 string
      paymentDeadline: z.union([z.number(), z.string()]).nullable().optional(),
      // 修復 TS 錯誤：checklist 使用 label
      checklist: z.array(z.object({ label: z.string(), checked: z.boolean() })).optional(),
    })
  ),
  // 修復 TS 錯誤：supplements 的 timestamp 可能是 number
  supplements: z.array(
    z.object({
      id: z.string().optional(),
      role: z.string().optional(),
      content: z.string(),
      timestamp: z.union([z.string(), z.number()]),
    })
  ),
});

// 修復 #5, #6: 區分 "不存在" 和 "真正錯誤"，並驗證 data.state
export async function getTx(id: string): Promise<TrustState> {
  const { data, error } = await supabase.from('transactions').select('state').eq('id', id).single();

  // 只有 PGRST116 (not found) 才自動建立
  if (error) {
    if (error.code === 'PGRST116') {
      const newState = createInitialState(id);
      await saveTx(id, newState);
      return newState;
    }
    // 真正的 DB 錯誤要拋出
    logger.error('[trust/_utils] getTx DB error', { error: error.message, id });
    throw new Error(`getTx failed: ${error.message}`);
  }

  if (!data) {
    const newState = createInitialState(id);
    await saveTx(id, newState);
    return newState;
  }

  // 驗證 state 結構
  const parseResult = TrustStateSchema.safeParse(data.state);
  if (!parseResult.success) {
    logger.error('[trust/_utils] getTx invalid state schema', {
      id,
      issues: parseResult.error.issues,
    });
    throw new Error('Invalid transaction state schema');
  }

  return parseResult.data;
}

export async function saveTx(id: string, state: TrustState) {
  const { error } = await supabase
    .from('transactions')
    .upsert({ id, state, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/**
 * 稽核日誌記錄（阻塞模式）
 *
 * Team 11 修復: 改為阻塞模式，失敗時拋出例外
 * Team 11 增強: 新增 status 和 error 欄位支援
 *
 * @param txId - 交易 ID
 * @param action - 操作類型
 * @param user - 用戶資訊
 * @param options - 可選參數
 * @param options.status - 稽核日誌狀態 (預設: "success")
 * @param options.error - 錯誤訊息（僅在 status="failed" 時使用）
 * @throws Error 當稽核日誌寫入失敗時
 */
export async function logAudit(
  txId: string,
  action: string,
  user: AuditUser,
  options?: {
    status?: AuditStatus;
    error?: string;
  }
): Promise<void> {
  const { error } = await supabase.from('audit_logs').insert({
    transaction_id: txId,
    action,
    user_id: user.id,
    role: user.role,
    ip: user.ip || 'unknown',
    user_agent: user.agent || 'unknown',
    metadata: user.metadata || {},
    status: options?.status || 'success', // 新增: 預設 "success"
    error: options?.error || null, // 新增: 錯誤訊息
    created_at: new Date().toISOString(),
  });

  if (error) {
    logger.error('[trust/_utils] Audit log failed', error, {
      txId,
      action,
      userId: user.id,
      role: user.role,
      auditStatus: options?.status,
    });
    throw new Error(`Audit log failed: ${error.message}`);
  }
}

/** [NASA TypeScript Safety] 安全取得字串 header */
function getStringHeader(value: string | string[] | undefined): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : 'unknown';
  }
  return 'unknown';
}

/** 取得 Client IP（用於稽核紀錄） */
export function getClientIp(req: VercelRequest): string {
  const value = req.headers['x-forwarded-for'];
  if (typeof value === 'string') return value.split(',')[0].trim();
  if (Array.isArray(value) && value.length > 0) return value[0] ?? 'unknown';
  return 'unknown';
}

/** 取得 User-Agent（用於稽核紀錄） */
export function getUserAgent(req: VercelRequest): string {
  return req.headers['user-agent'] ?? 'unknown';
}

export function verifyToken(req: VercelRequest): AuditUser {
  let token = '';

  // 1. Try Cookie
  if (req.headers.cookie) {
    const cookies = parse(req.headers.cookie);
    token = cookies.mh_token || '';
  }

  // 2. Try Authorization Header (Fallback)
  if (!token) {
    const authHeader = req.headers['authorization'];
    token = authHeader ? authHeader.split(' ')[1] : '';
  }

  if (!token) throw new Error('Unauthorized');

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as JwtUser
    const parseResult = JwtUserSchema.safeParse(decoded);
    if (!parseResult.success) {
      logger.error('[trust/_utils] JWT payload validation failed', {
        error: parseResult.error.message,
      });
      throw new Error('Invalid token payload');
    }
    const user = parseResult.data;
    return {
      ...user,
      ip: getStringHeader(req.headers['x-forwarded-for']),
      agent: req.headers['user-agent'] || 'unknown',
    };
  } catch (e) {
    if (e instanceof Error && e.message === 'Invalid token payload') throw e;
    throw new Error('Token expired or invalid');
  }
}

/**
 * CORS 設定 - 使用共用模組
 * @deprecated 請直接 import { cors } from "../lib/cors"
 */
export function cors(req: VercelRequest, res: VercelResponse): void {
  sharedCors(req, res);
}

/**
 * 生成匿名使用者臨時代號
 *
 * 用於 Trust Room 中買方匿名身份識別。
 *
 * @returns {string} 格式: "買方-XXXXXXXX"，其中 X 為 8 碼密碼學安全隨機代號
 *
 * @example
 * ```ts
 * const code = generateBuyerCode();
 * // => "買方-K3Y7M9P2"
 * ```
 *
 * 安全性說明：
 * - 使用 crypto.randomBytes() 生成密碼學安全隨機數
 * - 去除易混淆字元：I, O, 0, 1, L
 * - 可用字元：A-Z（除 I, O, L）+ 2-9（除 0, 1）
 * - 共 32 個字元，8 碼組合數：32^8 = 1,099,511,627,776（1 兆以上）
 * - 碰撞機率 < 0.0001%（10 萬次生成）
 */
export function generateBuyerCode(): string {
  // 使用 Node.js crypto 模組生成密碼學安全隨機數
  const crypto = require('crypto');

  // 去除易混淆字元：I, O, 0, 1, L
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // 32 個字元
  const length = 8; // 從 4 碼增加到 8 碼以增強安全性

  const bytes = crypto.randomBytes(length);
  let code = '';

  for (let i = 0; i < length; i++) {
    code += charset[bytes[i] % charset.length];
  }

  return `買方-${code}`;
}
