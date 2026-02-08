/**
 * Property Public Stats API
 *
 * GET /api/property/public-stats?id=MH-XXXXXX
 *
 * 功能：提供房源公開統計資料給未登入消費者
 * - 瀏覽人數（uag_events unique session count）
 * - 安心留痕案件數（trust_cases active + completed count）
 *
 * 權限：公開 API，不需認證
 * 資料來源：Supabase RPC fn_get_property_public_stats
 *
 * @see supabase/migrations/20260208134146_property_public_stats.sql
 * @see .claude/tickets/AGENT PROFILE.md #8
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { API_ERROR_CODES, errorResponse, successResponse } from '../lib/apiResponse';
import { cors } from '../lib/cors';

// ============================================
// Supabase Client
// ============================================

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ============================================
// Validation Schema
// ============================================

const QuerySchema = z.object({
  id: z.string().min(1, 'property id is required'),
});

// ============================================
// Response Types
// ============================================

interface PublicStatsData {
  view_count: number;
  trust_cases_count: number;
}

// ============================================
// Main Handler
// ============================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // CORS
  cors(req, res);
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 只接受 GET
  if (req.method !== 'GET') {
    return res
      .status(405)
      .json(errorResponse(API_ERROR_CODES.METHOD_NOT_ALLOWED, 'Method not allowed'));
  }

  try {
    // 驗證參數
    const result = QuerySchema.safeParse(req.query);
    if (!result.success) {
      logger.warn('[public-stats] Invalid query params', {
        errors: result.error.errors,
        query: req.query,
      });
      return res
        .status(400)
        .json(
          errorResponse(
            API_ERROR_CODES.INVALID_QUERY,
            'Invalid query parameters',
            result.error.errors
          )
        );
    }

    const { id: propertyId } = result.data;

    // 呼叫 Supabase RPC
    const supabase = getSupabase();
    const { data, error } = await supabase.rpc('fn_get_property_public_stats', {
      p_property_id: propertyId,
    });

    if (error) {
      logger.error('[public-stats] RPC error', {
        propertyId,
        error: error.message,
        code: error.code,
      });
      return res
        .status(500)
        .json(
          errorResponse(
            API_ERROR_CODES.DATA_FETCH_FAILED,
            'Failed to fetch property stats',
            error.message
          )
        );
    }

    // RPC 回傳格式：{ view_count: number, trust_cases_count: number }
    const stats: PublicStatsData = {
      view_count: data?.view_count ?? 0,
      trust_cases_count: data?.trust_cases_count ?? 0,
    };

    logger.info('[public-stats] Success', {
      propertyId,
      stats,
    });

    return res.status(200).json(successResponse(stats));
  } catch (err) {
    logger.error('[public-stats] Unexpected error', { error: err });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error'));
  }
}
