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
import { getErrorMessage } from '../lib/error';

// [NASA TypeScript Safety] Track Schemas
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

const TrackResultSchema = z.object({
  success: z.boolean().optional(),
  grade: z.string(),
  score: z.number().optional(),
  reason: z.string().optional().nullable(),
});

type TrackRequest = z.infer<typeof TrackRequestSchema>;

// ============================================================================
// Configuration
// ============================================================================

// RPC 版本選擇 (可透過環境變數切換)
const UAG_RPC_VERSION = process.env.UAG_RPC_VERSION || 'v8_2';
const MODULE_TAG = '[UAG]';

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasMissingRequiredTrackFields(value: unknown): boolean {
  if (!isObjectRecord(value)) {
    return false;
  }

  const sessionId = value.session_id;
  const event = value.event;
  return (
    typeof sessionId !== 'string' ||
    sessionId.trim().length === 0 ||
    !isObjectRecord(event)
  );
}

function safeCaptureError(error: unknown, context?: Record<string, unknown>): void {
  try {
    captureError(error, context);
  } catch (captureErr) {
    logger.warn(`${MODULE_TAG} Sentry 錯誤上報略過（環境驗證未通過）`, {
      error: getErrorMessage(captureErr),
      context,
    });
  }
}

function safeAddBreadcrumb(message: string, category: string, data?: Record<string, unknown>): void {
  try {
    addBreadcrumb(message, category, data);
  } catch (breadcrumbErr) {
    logger.warn(`${MODULE_TAG} Sentry breadcrumb 略過（環境驗證未通過）`, {
      error: getErrorMessage(breadcrumbErr),
      message,
      category,
    });
  }
}

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
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    const isDev = process.env.NODE_ENV !== 'production';
    logger.error(`${MODULE_TAG} 缺少必要環境變數`, null, {
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
            ? '缺少 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY'
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
        logger.warn(`${MODULE_TAG} 解析請求 JSON 失敗`, {
          error: getErrorMessage(parseError),
        });
        return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, 'JSON 格式錯誤'));
      }
    }

    if (Array.isArray(data)) {
      return res
        .status(400)
        .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤：不支援批次陣列 payload'));
    }

    const missingRequiredFields = hasMissingRequiredTrackFields(data);
    const trackRequestParseResult = TrackRequestSchema.safeParse(data);

    if (!trackRequestParseResult.success) {
      if (missingRequiredFields) {
        return res
          .status(400)
          .json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '缺少必要欄位：session_id 或 event'));
      }
      return res.status(400).json(errorResponse(API_ERROR_CODES.INVALID_INPUT, '事件格式錯誤'));
    }

    const { session_id, agent_id, event, fingerprint }: TrackRequest = trackRequestParseResult.data;

    // 添加追蹤
    safeAddBreadcrumb('UAG 追蹤事件', 'uag', {
      session_id,
      property_id: event.property_id,
    });

    // 選擇 RPC 版本
    const rpcName = UAG_RPC_VERSION === 'v8_2' ? 'track_uag_event_v8_2' : 'track_uag_event_v8';

    // 呼叫 RPC 進行原子化增量更新
    const { data: result, error } = await supabase.rpc(rpcName, {
      p_session_id: session_id,
      p_agent_id: agent_id || 'unknown',
      p_fingerprint: fingerprint || null,
      p_event_data: event,
    });

    if (error) {
      logger.error(`${MODULE_TAG} Supabase RPC 呼叫失敗`, error, { rpcName, session_id });

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

          logger.error(`${MODULE_TAG} 備援追蹤結果驗證失敗`, null, {
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
      logger.error(`${MODULE_TAG} 追蹤結果驗證失敗`, null, {
        error: trackParseResult.error.message,
        result,
      });
      return res
        .status(500)
        .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '追蹤結果格式錯誤'));
    }
    const trackResult = trackParseResult.data;

    // 即時觸發：S 級潛在客戶告警
    if (trackResult.grade === 'S') {
      logger.info(`${MODULE_TAG} 偵測到 S 級潛在客戶`, {
        session_id,
        score: trackResult.score,
        reason: trackResult.reason,
      });
      safeAddBreadcrumb('偵測到 S 級潛在客戶', 'uag', {
        session_id,
        score: trackResult.score,
      });
    }

    return res.status(200).json(successResponse(trackResult));
  } catch (err) {
    logger.error(`${MODULE_TAG} 追蹤處理器錯誤`, err, {
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
  const message = getErrorMessage(error);
  return (
    message.includes('Environment validation failed') ||
    message.includes('環境驗證失敗') ||
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
      logger.error(`${MODULE_TAG} 追蹤服務因環境驗證失敗暫時不可用`, error, {
        handler: 'uag/track',
      });
      return res
        .status(503)
        .json(
          errorResponse(
            API_ERROR_CODES.SERVICE_UNAVAILABLE,
            isDev ? 'uag/track 環境驗證失敗' : '服務暫時無法使用，請稍後再試'
          )
        );
    }

    logger.error(`${MODULE_TAG} 追蹤封裝層發生錯誤`, error, {
      handler: 'uag/track',
    });
    safeCaptureError(error, { handler: 'uag/track', wrapper: true });
    return res
      .status(500)
      .json(errorResponse(API_ERROR_CODES.INTERNAL_ERROR, '事件追蹤失敗，請稍後再試'));
  }
}
