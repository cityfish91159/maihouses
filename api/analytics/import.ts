/**
 * IM-5: 591 匯入品質追蹤 API
 * POST /api/analytics/import
 *
 * @description 記錄 591 解析結果，用於優化 Regex 與偵測格式變更
 * @version 1.0.0 - 2025-12-30
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger';

// ============ Supabase Client ============

let supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabase) return supabase;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY 環境變數');
  }

  supabase = createClient(url, key);
  return supabase;
}

// ============ Schema Validation ============

const ImportAnalyticsSchema = z.object({
  // 基本資訊
  textLength: z.number().int().min(0).max(50000),
  confidence: z.number().int().min(0).max(100),
  fieldsFound: z.number().int().min(0).max(10),

  // 詳細欄位狀態
  fieldStatus: z.object({
    title: z.boolean(),
    price: z.boolean(),
    size: z.boolean(),
    layout: z.boolean(),
    address: z.boolean(),
    listingId: z.boolean(),
  }),

  // 缺失欄位
  missingFields: z.array(z.string()).max(10),

  // 來源資訊
  source: z.enum(['paste', 'url', 'button']).default('paste'),
  userAgent: z.string().max(500).optional(),

  // 時間戳
  timestamp: z.string().datetime().optional(),
});

type ImportAnalyticsPayload = z.infer<typeof ImportAnalyticsSchema>;

// ============ Main Handler ============

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // 1. 驗證 Payload
    const rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const validation = ImportAnalyticsSchema.safeParse(rawBody);

    if (!validation.success) {
      logger.warn('[analytics/import] Validation failed', {
        error: validation.error.issues,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid payload',
        details: validation.error.issues,
      });
    }

    const payload = validation.data;

    // 2. 準備寫入資料
    const record = {
      text_length: payload.textLength,
      confidence: payload.confidence,
      fields_found: payload.fieldsFound,
      field_status: payload.fieldStatus,
      missing_fields: payload.missingFields,
      source: payload.source,
      user_agent: payload.userAgent || null,
      created_at: payload.timestamp || new Date().toISOString(),
    };

    // 3. 寫入 Supabase
    const client = getSupabase();
    const { error, data } = await client
      .from('import_analytics')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      logger.error('[analytics/import] Supabase insert failed', error);

      // 如果是 table 不存在,返回友善錯誤
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        return res.status(503).json({
          success: false,
          error: 'Analytics table not initialized',
          hint: 'Run migration: CREATE TABLE import_analytics',
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Database insert failed',
        details: error.message,
      });
    }

    // 4. 成功回應
    logger.info('[analytics/import] Recorded', {
      id: data?.id,
      confidence: payload.confidence,
      fieldsFound: payload.fieldsFound,
    });

    return res.status(200).json({
      success: true,
      id: data?.id,
      recordedAt: record.created_at,
    });
  } catch (error) {
    logger.error('[analytics/import] Unexpected error', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
