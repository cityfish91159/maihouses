/**
 * Auto-Create Case Helpers - 輔助函數
 *
 * Team Delta: Q-01 + Q-02 重構
 * - 將 handleAutoCreateCase 拆分為多個小函數
 * - 降低循環複雜度（從 18 降至 < 5）
 * - 提升可測試性和可維護性
 *
 * Skills Applied:
 * - [No Lazy Implementation] 完整重構
 * - [NASA TypeScript Safety] 完整類型定義
 */

import type { VercelRequest } from '@vercel/node';
import { z } from 'zod';
import { supabase } from './_utils';
import { logger } from '../lib/logger';
import { API_ERROR_CODES } from '../lib/apiResponse';

// ============================================================================
// Types
// ============================================================================

const PropertyRowSchema = z.object({
  public_id: z.string(),
  title: z.string(),
  trust_enabled: z.boolean(),
  agent_id: z.string(),
});
type PropertyRow = z.infer<typeof PropertyRowSchema>;

const UserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
});
type UserRow = z.infer<typeof UserRowSchema>;

export interface BuyerInfo {
  buyerName: string;
  buyerUserId: string | null;
}

export interface PropertyValidationResult {
  success: boolean;
  property?: PropertyRow;
  errorCode?: string;
  errorMessage?: string;
}

// ============================================================================
// Property Validation
// ============================================================================

/**
 * 驗證物件是否存在且已開啟 Trust 服務
 *
 * @param propertyId - 物件 ID (MH-XXXXX)
 * @returns 驗證結果
 */
export async function validateProperty(propertyId: string): Promise<PropertyValidationResult> {
  const { data: propertyData, error: propertyError } = await supabase
    .from('properties')
    .select('public_id, title, trust_enabled, agent_id')
    .eq('public_id', propertyId)
    .single();

  if (propertyError || !propertyData) {
    logger.error('[trust/auto-create-case] Property not found', {
      propertyId,
      error: propertyError?.message,
    });
    return {
      success: false,
      errorCode: API_ERROR_CODES.NOT_FOUND,
      errorMessage: '找不到對應的物件',
    };
  }

  const propertyParseResult = PropertyRowSchema.safeParse(propertyData);
  if (!propertyParseResult.success) {
    logger.error('[trust/auto-create-case] Property data validation failed', {
      propertyId,
      error: propertyParseResult.error.message,
    });
    return {
      success: false,
      errorCode: API_ERROR_CODES.INTERNAL_ERROR,
      errorMessage: '物件資料格式驗證失敗',
    };
  }

  const property = propertyParseResult.data;

  if (!property.trust_enabled) {
    logger.warn('[trust/auto-create-case] Trust not enabled', {
      propertyId,
    });
    return {
      success: false,
      errorCode: API_ERROR_CODES.INVALID_INPUT,
      errorMessage: '此物件未開啟安心留痕服務',
    };
  }

  return {
    success: true,
    property,
  };
}

// ============================================================================
// Buyer Info Resolution
// ============================================================================

/**
 * 決定買方資訊（已註冊用戶或匿名用戶）
 *
 * @param userId - 用戶 ID（可選）
 * @param userName - 用戶名稱（可選）
 * @returns 買方資訊
 */
export async function resolveBuyerInfo(userId?: string, userName?: string): Promise<BuyerInfo> {
  // 情況 1: 已註冊用戶（提供 userId 和 userName）
  if (userId && userName) {
    return {
      buyerName: userName,
      buyerUserId: userId,
    };
  }

  // 情況 2: 僅提供 userId，查詢用戶名稱
  if (userId) {
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      logger.error('[trust/auto-create-case] User not found', {
        userId,
        error: userError?.message,
      });
      throw new Error('找不到對應的用戶');
    }

    const userParseResult = UserRowSchema.safeParse(userData);
    if (!userParseResult.success) {
      logger.error('[trust/auto-create-case] User data validation failed', {
        userId,
        error: userParseResult.error.message,
      });
      throw new Error('用戶資料格式驗證失敗');
    }

    const user = userParseResult.data;
    return {
      buyerName: user.name ?? generateAnonymousBuyerName(),
      buyerUserId: user.id,
    };
  }

  // 情況 3: 未註冊用戶，生成匿名買方名稱
  return {
    buyerName: generateAnonymousBuyerName(),
    buyerUserId: null,
  };
}

// ============================================================================
// Anonymous Name Generation
// ============================================================================

/**
 * 生成匿名買方名稱（使用密碼學安全隨機數）
 *
 * 格式：買方-XXXXXXXX（8 碼字母+數字組合）
 *
 * @returns 匿名買方名稱
 */
export function generateAnonymousBuyerName(): string {
  // [Team Delta - Q-03] 使用 ES6 import（但 Node.js 環境需 require）
  // 注意：crypto 是 Node.js 內建模組，在 Vercel Edge Runtime 中需使用 require
  const { randomBytes } = require('crypto');

  // 去除易混淆字元：I, O, 0, 1, L
  const charset = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const length = 8;

  const bytes = randomBytes(length);
  let code = '';

  for (let i = 0; i < length; i++) {
    const byteValue = bytes[i];
    if (byteValue !== undefined) {
      code += charset[byteValue % charset.length];
    }
  }

  return `買方-${code}`;
}

// ============================================================================
// Client Info Extraction
// ============================================================================

/**
 * 取得 Client IP（用於稽核紀錄）
 *
 * @param req - Vercel Request
 * @returns IP 地址
 */
export function getClientIp(req: VercelRequest): string {
  const value = req.headers['x-forwarded-for'];
  if (typeof value === 'string') return value.split(',')[0].trim();
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0];
    return typeof first === 'string' ? first : 'unknown';
  }
  return 'unknown';
}

/**
 * 取得 User-Agent（用於稽核紀錄）
 *
 * @param req - Vercel Request
 * @returns User-Agent 字串
 */
export function getUserAgent(req: VercelRequest): string {
  return req.headers['user-agent'] ?? 'unknown';
}
