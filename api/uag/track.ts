/**
 * UAG 事件追蹤 API
 *
 * 追蹤用戶在物件頁面的行為，計算意向分數
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { withSentryHandler, captureError, addBreadcrumb } from '../lib/sentry';
import { logger } from '../lib/logger';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';

// [NASA TypeScript Safety] Track Result Schema
const TrackResultSchema = z.object({
  success: z.boolean().optional(),
  grade: z.string(),
  score: z.number().optional(),
  reason: z.string().optional().nullable(),
});

// ============================================================================
// Types
// ============================================================================

interface TrackEvent {
  property_id: string;
  duration?: number;
  scroll_depth?: number;
  clicked_contact?: boolean;
  clicked_share?: boolean;
  clicked_favorite?: boolean;
}

interface TrackRequest {
  session_id: string;
  agent_id?: string;
  fingerprint?: string;
  event: TrackEvent;
}

interface TrackResult {
  grade: string;
  score?: number;
  reason?: string | null;
}

// ============================================================================
// Configuration
// ============================================================================

// RPC 版本選擇 (可透過環境變數切換)
const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || 'v8_2';

function safeCaptureError(error: Error | unknown, context?: Record<string, unknown>): void {
  try {
    captureError(error, context);
  } catch (captureErr) {
    logger.warn('[UAG] Sentry capture skipped due to env validation error', {
      captureError: captureErr instanceof Error ? captureErr.message : String(captureErr),
      context,
    });
  }
}

function safeAddBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  try {
    addBreadcrumb(message, category, data);
  } catch (breadcrumbErr) {
    logger.warn('[UAG] Sentry breadcrumb skipped due to env validation error', {
      error: breadcrumbErr instanceof Error ? breadcrumbErr.message : String(breadcrumbErr),
      message,
      category,
    });
  }
}

function isTrackRequest(value: unknown): value is TrackRequest {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// ============================================================================
// Handler
// ============================================================================

async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  // CORS Headers
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', '僅支援 POST 請求'));
  }

  // 驗證環境變數
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const isDev = process.env.NODE_ENV !== 'production';
    logger.error('[UAG] Missing required environment variables', null, {
      hasUrl: Boolean(supabaseUrl),
      hasKey: Boolean(supabaseKey),
      env: process.env.NODE_ENV,
    });

    return res
      .status(503)
      .json(
        errorResponse(
          API_ERROR_CODES.SERVICE_UNAVAILABLE,
          isDev
            ? 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY'
            : '服務暫時無法使用，請稍後再試'
        )
      );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 解析請求體
    let data: unknown = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'JSON 格式錯誤'));
      }
    }

    if (Array.isArray(data)) {
      return res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤：不支援批次陣列 payload'));
    }

    if (!isTrackRequest(data)) {
      return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤'));
    }

    const { session_id, agent_id, event, fingerprint } = data;

    if (!session_id || !event) {
      return res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '缺少必要欄位：session_id 或 event'));
    }

    // Basic Event Validation - 放寬驗證，duration 可以是 0 (page_view)
    if (typeof event !== 'object' || !event.property_id) {
      return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤'));
    }

    // 添加追蹤
    safeAddBreadcrumb('UAG track event', 'uag', {
      session_id,
      property_id: event.property_id,
    });

    // 選擇 RPC 版本
    const rpcName = UAG_RPC_VERSION === 'v8_2' ? 'track_uag_event_v8_2' : 'track_uag_event_v8';

    // Call RPC for atomic incremental update
    const { data: result, error } = await supabase.rpc(rpcName, {
      p_session_id: session_id,
      p_agent_id: agent_id || 'unknown',
      p_fingerprint: fingerprint || null,
      p_event_data: event,
    });

    if (error) {
      logger.error('[UAG] Supabase RPC failed', error, { rpcName, session_id });

      // Fallback 到舊版 RPC
      if (UAG_RPC_VERSION === 'v8_2') {
        const { data: fallbackResult, error: fallbackError } = await supabase.rpc(
          'track_uag_event_v8',
          {
            p_session_id: session_id,
            p_agent_id: agent_id || 'unknown',
            p_fingerprint: fingerprint || null,
            p_event_data: event,
          }
        );

        if (!fallbackError) {
          return res.status(200).json(fallbackResult);
        }
      }

      safeCaptureError(error, { rpcName, session_id });
      return res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
    }

    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as TrackResult
    const trackParseResult = TrackResultSchema.safeParse(result);
    if (!trackParseResult.success) {
      logger.error('[UAG] Track result validation failed', null, {
        error: trackParseResult.error.message,
        result,
      });
      return res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '追蹤結果格式錯誤'));
    }
    const trackResult = trackParseResult.data;

    // Realtime Trigger - S-Grade Alert
    if (trackResult.grade === 'S') {
      logger.info('[UAG] S-Grade Lead detected', {
        session_id,
        score: trackResult.score,
        reason: trackResult.reason,
      });
      safeAddBreadcrumb('S-Grade lead detected', 'uag', {
        session_id,
        score: trackResult.score,
      });
    }

    return res.status(200).json(successResponse(trackResult));
  } catch (err) {
    logger.error('[UAG] Track handler error', err, { handler: 'uag/track' });
    safeCaptureError(err, { handler: 'uag/track' });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
  }
}

const sentryWrappedHandler = withSentryHandler(handler, 'uag/track');

function isSentryEnvValidationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Environment validation failed') ||
    message.includes('SUPABASE_URL') ||
    message.includes('SUPABASE_SERVICE_ROLE_KEY') ||
    message.includes('UAG_TOKEN_SECRET')
  );
}

export default async function uagTrackHandler(
  req: VercelRequest,
  res: VercelResponse
): Promise<VercelResponse | void> {
  try {
    return await sentryWrappedHandler(req, res);
  } catch (error) {
    setCorsHeaders(res);
    const isDev = process.env.NODE_ENV !== 'production';

    if (isSentryEnvValidationError(error)) {
      logger.error('[UAG] Track unavailable due to strict env validation', error, {
        handler: 'uag/track',
      });
      return res
        .status(503)
        .json(
          errorResponse(
            API_ERROR_CODES.SERVICE_UNAVAILABLE,
            isDev ? 'Environment validation failed for uag/track' : '服務暫時無法使用，請稍後再試'
          )
        );
    }

    logger.error('[UAG] Track wrapper error', error, { handler: 'uag/track' });
    safeCaptureError(error, { handler: 'uag/track', wrapper: true });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
  }
}
