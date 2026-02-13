/**
 * UAG 事件追蹤 API
 *
 * 追蹤用戶在物件頁面的行為，計算意向分數
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { withSentryHandler, captureError, addBreadcrumb } from '../lib/sentry';
import { enforceCors, cors } from '../lib/cors';
import { logger } from '../lib/logger';
import { successResponse, errorResponse, API_ERROR_CODES } from '../lib/apiResponse';
import { getErrorMessage } from '../../src/lib/error';

// [NASA TypeScript Safety] Track Result Schema
const TrackResultSchema = z.object({
  success: z.boolean().optional(),
  grade: z.string(),
  score: z.number().optional(),
  reason: z.string().optional().nullable(),
});

// ============================================================================
// Configuration
// ============================================================================

// RPC 版本選擇 (可透過環境變數切換)
const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || 'v8_2';
const MODULE_TAG = '[UAG]';

function toErrorDetail(error: unknown): string {
  return getErrorMessage(error);
}

function safeCaptureError(error: unknown, context?: Record<string, unknown>): void {
  try {
    captureError(error, context);
  } catch (captureErr) {
    logger.warn(`${MODULE_TAG} Sentry capture skipped due to env validation error`, {
      error: toErrorDetail(captureErr),
      context,
    });
  }
}

function safeAddBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  try {
    addBreadcrumb(message, category, data);
  } catch (breadcrumbErr) {
    logger.warn(`${MODULE_TAG} Sentry breadcrumb skipped due to env validation error`, {
      error: toErrorDetail(breadcrumbErr),
      message,
      category,
    });
  }
}

const TrackEventSchema = z.object({
  property_id: z.string().min(1),
  duration: z.number().optional(),
  scroll_depth: z.number().optional(),
  clicked_contact: z.boolean().optional(),
  clicked_share: z.boolean().optional(),
  clicked_favorite: z.boolean().optional(),
});

const TrackRequestSchema = z.object({
  session_id: z.string().min(1),
  agent_id: z.string().optional(),
  fingerprint: z.string().optional(),
  event: TrackEventSchema,
});

// ============================================================================
// Handler
// ============================================================================

async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  if (!enforceCors(req, res)) return res;
  if (req.method !== 'POST') {
    return res.status(405).json(errorResponse('METHOD_NOT_ALLOWED', '僅支援 POST 請求'));
  }

  // 驗證環境變數
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const isDev = process.env.NODE_ENV !== 'production';
    logger.error(`${MODULE_TAG} Missing required environment variables`, null, {
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
      } catch (parseError) {
        logger.warn(`${MODULE_TAG} Failed to parse request JSON`, {
          error: toErrorDetail(parseError),
        });
        return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'JSON 格式錯誤'));
      }
    }

    // 使用 Zod safeParse 統一驗證請求結構
    const requestParseResult = TrackRequestSchema.safeParse(data);
    if (!requestParseResult.success) {
      return res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤：' + requestParseResult.error.issues[0]?.message));
    }

    const { session_id, agent_id, event, fingerprint } = requestParseResult.data;

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
      logger.error(`${MODULE_TAG} Supabase RPC failed`, error, { rpcName, session_id });

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
          const fallbackParseResult = TrackResultSchema.safeParse(fallbackResult);
          if (fallbackParseResult.success) {
            return res.status(200).json(successResponse(fallbackParseResult.data));
          }
          logger.error(`${MODULE_TAG} Fallback RPC result validation failed`, null, {
            error: fallbackParseResult.error.message,
            result: fallbackResult,
          });
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
      logger.error(`${MODULE_TAG} Track result validation failed`, null, {
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
      logger.info(`${MODULE_TAG} S-Grade Lead detected`, {
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
    logger.error(`${MODULE_TAG} Track handler error`, err, {
      error: toErrorDetail(err),
      handler: 'uag/track',
    });
    safeCaptureError(err, { handler: 'uag/track' });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
  }
}

const sentryWrappedHandler = withSentryHandler(handler, 'uag/track');

function isSentryEnvValidationError(error: unknown): boolean {
  const message = toErrorDetail(error);
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
    cors(req, res);
    const isDev = process.env.NODE_ENV !== 'production';

    if (isSentryEnvValidationError(error)) {
      logger.error(`${MODULE_TAG} Track unavailable due to strict env validation`, error, {
        error: toErrorDetail(error),
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

    logger.error(`${MODULE_TAG} Track wrapper error`, error, {
      error: toErrorDetail(error),
      handler: 'uag/track',
    });
    safeCaptureError(error, { handler: 'uag/track', wrapper: true });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
  }
}
