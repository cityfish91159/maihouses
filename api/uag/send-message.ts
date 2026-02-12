import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { messagingApi } from '@line/bot-sdk';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { verifyAgentAuth, sendAuthError, isDevEnvironment } from '../lib/auth';
import { encryptConnectToken, ConnectTokenPayload } from '../lib/crypto';
import { withSentryHandler, captureError, addBreadcrumb, setUserContext } from '../lib/sentry';
import { enforceCors } from '../lib/cors';
import { logger } from '../lib/logger';

// [NASA TypeScript Safety] Request Body Schema
const SendMessageRequestSchema = z.object({
  agentId: z.string(),
  sessionId: z.string(),
  purchaseId: z.string(),
  propertyId: z.string().optional(),
  message: z.string(),
  agentName: z.string(),
  propertyTitle: z.string().optional(),
  grade: z.enum(['S', 'A', 'B', 'C']).optional(),
});

// [NASA TypeScript Safety] LINE Binding Result Schema
const LineBindingResultSchema = z.object({
  line_user_id: z.string().nullable(),
  line_status: z.enum(['active', 'blocked']),
});

// ============================================================================
// Constants
// ============================================================================

/** LINE 推播最大重試次數 */
const MAX_LINE_RETRY_COUNT = 5;

// ============================================================================
// Type Definitions
// ============================================================================

interface SendMessageRequest {
  agentId: string;
  sessionId: string;
  purchaseId: string;
  propertyId?: string;
  message: string;
  agentName: string;
  propertyTitle?: string;
  grade?: 'S' | 'A' | 'B' | 'C';
}

type LineStatus = 'sent' | 'no_line' | 'unreachable' | 'skipped' | 'error' | 'pending';

interface SendMessageResponse {
  success: boolean;
  conversationId?: string;
  lineStatus: LineStatus;
  error?: string;
}

interface LineBindingResult {
  line_user_id: string | null;
  line_status: 'active' | 'blocked';
}

// ConnectTokenPayload 已從 crypto.ts 導入

interface LineMessageData {
  agentName: string;
  propertyTitle?: string;
  propertyId?: string;
  connectUrl: string;
  grade?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 根據 UAG 等級產生 LINE 訊息前綴
 */
function getGradePrefix(grade?: string): string {
  switch (grade) {
    case 'S':
      return '🚨【邁房子】獨家 S 級推薦！限時 120h';
    case 'A':
      return '🏠【邁房子】A 級房源更新！72h 優先';
    default:
      return '【邁房子】你有一則新訊息';
  }
}

/**
 * 建立 LINE 通知訊息內容
 */
function buildLineMessage(
  agentName: string,
  connectUrl: string,
  propertyTitle?: string,
  propertyId?: string,
  grade?: string
): string {
  const gradePrefix = getGradePrefix(grade);
  const baseUrl = 'https://maihouses.vercel.app/maihouses';
  const propertyUrl = propertyId ? `${baseUrl}/#/property/${propertyId}` : null;

  let message = `${gradePrefix}
房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ''}`;

  if (propertyUrl) {
    message += `\n\n物件詳情：${propertyUrl}`;
  }

  message += `\n\n點此查看並回覆：${connectUrl}`;

  return message;
}

/**
 * 產生 Connect Token（AES-256-GCM 加密）
 * 加密後的 token 包含 conversationId、sessionId、propertyId 和過期時間
 */
function generateConnectToken(
  conversationId: string,
  sessionId: string,
  propertyId?: string
): string {
  const payload: ConnectTokenPayload = {
    conversationId,
    sessionId,
    propertyId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天有效
  };

  // 使用 AES-256-GCM 加密（環境變數 UAG_TOKEN_SECRET 控制密鑰）
  // 開發環境會使用預設密鑰，生產環境需配置
  return encryptConnectToken(payload);
}

/**
 * 更新購買記錄的通知狀態
 */
async function updateNotificationStatus(
  supabase: SupabaseClient,
  purchaseId: string,
  status: string,
  retryKey: string | null
): Promise<void> {
  const { error } = await supabase
    .from('uag_lead_purchases')
    .update({
      notification_status: status,
      notification_retry_key: retryKey,
      last_notification_at: new Date().toISOString(),
    })
    .eq('id', purchaseId);

  if (error) {
    logger.error('[UAG] updateNotificationStatus failed', error, { purchaseId });
  }
}

/**
 * 記錄 LINE 發送審計日誌
 */
async function logLineAudit(
  supabase: SupabaseClient,
  purchaseId: string,
  sessionId: string,
  retryKey: string,
  status: string,
  lineResponse: Record<string, unknown> | null
): Promise<void> {
  const { error } = await supabase.from('uag_line_audit_logs').insert({
    purchase_id: purchaseId,
    session_id: sessionId,
    retry_key: retryKey,
    status,
    line_response: lineResponse,
  });

  if (error) {
    logger.error('[UAG] logLineAudit failed', error, { purchaseId, sessionId });
  }
}

/**
 * 發送 LINE Push Message
 */
async function pushLineMessage(
  lineClient: messagingApi.MessagingApiClient,
  lineUserId: string,
  data: LineMessageData,
  retryKey: string
): Promise<void> {
  const messageText = buildLineMessage(
    data.agentName,
    data.connectUrl,
    data.propertyTitle,
    data.propertyId,
    data.grade
  );

  await lineClient.pushMessage(
    {
      to: lineUserId,
      messages: [{ type: 'text', text: messageText }],
    },
    retryKey // SDK 自動帶 X-Line-Retry-Key
  );
}

/**
 * 驗證請求參數
 * [NASA TypeScript Safety] 使用 Zod safeParse 取代 as 斷言
 */
function validateRequest(body: unknown): SendMessageRequest | null {
  const parseResult = SendMessageRequestSchema.safeParse(body);
  if (!parseResult.success) {
    return null;
  }
  return parseResult.data;
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(req: VercelRequest, res: VercelResponse): Promise<VercelResponse> {
  if (!enforceCors(req, res)) return res;

  // 只允許 POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      lineStatus: 'error',
      error: '僅支援 POST 請求',
    } satisfies SendMessageResponse);
  }

  // 驗證環境變數
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const lineChannelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.error('[UAG] Missing Supabase configuration');
    return res.status(500).json({
      success: false,
      lineStatus: 'error',
      error: '伺服器配置錯誤，請稍後再試',
    } satisfies SendMessageResponse);
  }

  // 生產環境 LINE Token 驗證（警告但不阻斷，允許僅使用站內訊息）
  if (!isDevEnvironment() && !lineChannelToken) {
    logger.warn(
      '[UAG] LINE_CHANNEL_ACCESS_TOKEN not configured. LINE notifications will be skipped.'
    );
  }

  // 驗證請求參數
  const validatedBody = validateRequest(req.body);
  if (!validatedBody) {
    return res.status(400).json({
      success: false,
      lineStatus: 'error',
      error: '請求參數錯誤，缺少必要欄位',
    } satisfies SendMessageResponse);
  }

  const { agentId, sessionId, purchaseId, propertyId, message, agentName, propertyTitle, grade } =
    validatedBody;

  // ========== 認證檢查（生產環境強制）==========
  // 開發環境允許跳過認證以便測試
  if (!isDevEnvironment()) {
    const authResult = await verifyAgentAuth(req, agentId);
    if (!authResult.success) {
      return sendAuthError(res, authResult);
    }
  }

  // 設置 Sentry 用戶上下文（用於錯誤追蹤）
  setUserContext(agentId);
  addBreadcrumb('Starting message send', 'api', {
    agentId,
    sessionId,
    purchaseId,
    propertyId,
  });

  // 初始化 Supabase Admin Client
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  // 初始化 LINE Client（如果有 token）
  let lineClient: messagingApi.MessagingApiClient | null = null;
  if (lineChannelToken) {
    lineClient = new messagingApi.MessagingApiClient({
      channelAccessToken: lineChannelToken,
    });
  }

  try {
    // ========== 1. 建立對話 + 發送站內訊息 ==========
    const { data: conversationId, error: convError } = await supabaseAdmin.rpc(
      'fn_create_conversation',
      {
        p_agent_id: agentId,
        p_consumer_session_id: sessionId,
        p_property_id: propertyId ?? null,
        p_lead_id: purchaseId,
      }
    );

    if (convError) {
      logger.error('[UAG] fn_create_conversation failed', convError, {
        agentId,
        sessionId,
      });
      return res.status(500).json({
        success: false,
        lineStatus: 'error',
        error: '建立對話失敗，請稍後再試',
      } satisfies SendMessageResponse);
    }

    const { data: messageId, error: msgError } = await supabaseAdmin.rpc('fn_send_message', {
      p_conversation_id: conversationId,
      p_sender_type: 'agent',
      p_sender_id: agentId,
      p_content: message,
    });

    if (msgError) {
      logger.error('[UAG] fn_send_message failed', msgError, {
        conversationId,
        agentId,
      });
      // 站內訊息失敗是嚴重錯誤
      return res.status(500).json({
        success: false,
        conversationId,
        lineStatus: 'error',
        error: '訊息發送失敗，請稍後再試',
      } satisfies SendMessageResponse);
    }

    // ========== 2. 查詢 LINE 綁定狀態（使用增強版 RPC，驗證 agent_id）==========
    const { data: binding, error: bindError } = await supabaseAdmin.rpc('fn_get_line_binding_v2', {
      p_session_id: sessionId,
      p_agent_id: agentId,
    });

    if (bindError) {
      logger.error('[UAG] fn_get_line_binding failed', bindError, {
        sessionId,
        agentId,
      });
      // LINE 查詢失敗不影響站內訊息成功
      return res.json({
        success: true,
        conversationId,
        lineStatus: 'error',
        error: 'LINE 綁定查詢失敗',
      } satisfies SendMessageResponse);
    }

    // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as LineBindingResult
    const lineBindingResult = LineBindingResultSchema.safeParse(binding);
    const lineBinding = lineBindingResult.success ? lineBindingResult.data : null;

    // 未綁定 LINE
    if (!lineBinding?.line_user_id) {
      await updateNotificationStatus(supabaseAdmin, purchaseId, 'no_line', null);
      return res.json({
        success: true,
        conversationId,
        lineStatus: 'no_line',
      } satisfies SendMessageResponse);
    }

    // 已知被封鎖
    if (lineBinding.line_status === 'blocked') {
      await updateNotificationStatus(supabaseAdmin, purchaseId, 'unreachable', null);
      return res.json({
        success: true,
        conversationId,
        lineStatus: 'unreachable',
      } satisfies SendMessageResponse);
    }

    // 沒有 LINE Token，跳過發送
    if (!lineClient || !lineChannelToken) {
      await updateNotificationStatus(supabaseAdmin, purchaseId, 'skipped', null);
      return res.json({
        success: true,
        conversationId,
        lineStatus: 'skipped',
        error: 'LINE 通知功能未啟用',
      } satisfies SendMessageResponse);
    }

    // ========== 3. 產生 Connect Token ==========
    const connectToken = generateConnectToken(conversationId, sessionId, propertyId);
    const connectUrl = `${baseUrl || 'https://maihouses.vercel.app'}/maihouses/chat/connect?token=${connectToken}`;

    // ========== 4. 寫入通知佇列（防重複 + 支援重試）==========
    const retryKey = uuidv4();

    // 使用 upsert + onConflict 處理重複插入，避免異常處理
    const { error: queueError } = await supabaseAdmin.from('uag_line_notification_queue').upsert(
      {
        message_id: messageId,
        purchase_id: purchaseId,
        line_user_id: lineBinding.line_user_id,
        connect_url: connectUrl,
        agent_name: agentName,
        property_title: propertyTitle ?? null,
        grade: grade ?? null,
        status: 'pending',
      },
      {
        onConflict: 'message_id',
        ignoreDuplicates: true,
      }
    );

    if (queueError) {
      // 記錄非重複相關的錯誤
      logger.error('[UAG] Queue upsert failed', queueError, { messageId, purchaseId });
    }

    // ========== 5. 立即嘗試發送（失敗會由 Cron 重試）==========
    try {
      await pushLineMessage(
        lineClient,
        lineBinding.line_user_id,
        {
          agentName,
          propertyTitle,
          propertyId,
          connectUrl,
          grade,
        },
        retryKey
      );

      // 發送成功，更新佇列狀態
      await supabaseAdmin
        .from('uag_line_notification_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('message_id', messageId);

      await updateNotificationStatus(supabaseAdmin, purchaseId, 'sent', retryKey);
      await logLineAudit(supabaseAdmin, purchaseId, sessionId, retryKey, 'sent', null);

      return res.json({
        success: true,
        conversationId,
        lineStatus: 'sent',
      } satisfies SendMessageResponse);
    } catch (lineError) {
      // 發送失敗，更新錯誤訊息
      const errorMessage = lineError instanceof Error ? lineError.message : String(lineError);

      // 查詢當前重試次數
      const { data: queueItem } = await supabaseAdmin
        .from('uag_line_notification_queue')
        .select('retry_count')
        .eq('message_id', messageId)
        .single();

      const currentRetryCount = queueItem?.retry_count ?? 0;
      const newRetryCount = currentRetryCount + 1;
      const hasExceededRetryLimit = newRetryCount >= MAX_LINE_RETRY_COUNT;

      // 更新佇列狀態（超過上限則標記為 failed）
      await supabaseAdmin
        .from('uag_line_notification_queue')
        .update({
          last_error: errorMessage,
          retry_count: newRetryCount,
          status: hasExceededRetryLimit ? 'failed' : 'pending',
        })
        .eq('message_id', messageId);

      // 如果超過重試上限，更新購買記錄通知狀態為 failed
      if (hasExceededRetryLimit) {
        await updateNotificationStatus(supabaseAdmin, purchaseId, 'failed', retryKey);
      }

      await logLineAudit(
        supabaseAdmin,
        purchaseId,
        sessionId,
        retryKey,
        hasExceededRetryLimit ? 'failed_permanently' : 'failed',
        {
          error: errorMessage,
          retryCount: newRetryCount,
          maxRetries: MAX_LINE_RETRY_COUNT,
        }
      );

      // 站內訊息已成功，LINE 暫時失敗
      return res.json({
        success: true,
        conversationId,
        lineStatus: hasExceededRetryLimit ? 'error' : 'pending',
        error: hasExceededRetryLimit
          ? `LINE send failed after ${MAX_LINE_RETRY_COUNT} retries`
          : 'LINE send failed, will retry',
      } satisfies SendMessageResponse);
    }
  } catch (error) {
    logger.error('[UAG] send-message handler error', error, {
      agentId,
      sessionId,
      purchaseId,
    });

    // 捕獲錯誤到 Sentry
    captureError(error, {
      handler: 'send-message',
      method: req.method,
      body: req.body,
    });

    return res.status(500).json({
      success: false,
      lineStatus: 'error',
      error: '訊息發送失敗，請稍後再試',
    } satisfies SendMessageResponse);
  }
}

// 使用 Sentry wrapper 導出
export default withSentryHandler(handler, 'uag/send-message');
