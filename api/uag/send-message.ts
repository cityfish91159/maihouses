import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { messagingApi } from "@line/bot-sdk";
import { v4 as uuidv4 } from "uuid";

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
  grade?: "S" | "A" | "B" | "C";
}

type LineStatus =
  | "sent"
  | "no_line"
  | "unreachable"
  | "skipped"
  | "error"
  | "pending";

interface SendMessageResponse {
  success: boolean;
  conversationId?: string;
  lineStatus: LineStatus;
  error?: string;
}

interface LineBindingResult {
  line_user_id: string | null;
  line_status: "active" | "blocked";
}

interface ConnectTokenPayload {
  conversationId: string;
  sessionId: string;
  exp: number;
}

interface LineMessageData {
  agentName: string;
  propertyTitle?: string;
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
    case "S":
      return "🚨【邁房子】獨家 S 級推薦！限時 120h";
    case "A":
      return "🏠【邁房子】A 級房源更新！72h 優先";
    default:
      return "【邁房子】你有一則新訊息";
  }
}

/**
 * 建立 LINE 通知訊息內容
 */
function buildLineMessage(
  agentName: string,
  connectUrl: string,
  propertyTitle?: string,
  grade?: string,
): string {
  const gradePrefix = getGradePrefix(grade);

  return `${gradePrefix}
房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ""}

點此查看並回覆：${connectUrl}`;
}

/**
 * 產生 Connect Token（base64url 編碼的 JSON）
 */
function generateConnectToken(
  conversationId: string,
  sessionId: string,
): string {
  const payload: ConnectTokenPayload = {
    conversationId,
    sessionId,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 天有效
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

/**
 * 更新購買記錄的通知狀態
 */
async function updateNotificationStatus(
  supabase: SupabaseClient,
  purchaseId: string,
  status: string,
  retryKey: string | null,
): Promise<void> {
  const { error } = await supabase
    .from("uag_lead_purchases")
    .update({
      notification_status: status,
      notification_retry_key: retryKey,
      last_notification_at: new Date().toISOString(),
    })
    .eq("id", purchaseId);

  if (error) {
    console.error("updateNotificationStatus error:", error);
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
  lineResponse: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await supabase.from("uag_line_audit_logs").insert({
    purchase_id: purchaseId,
    session_id: sessionId,
    retry_key: retryKey,
    status,
    line_response: lineResponse,
  });

  if (error) {
    console.error("logLineAudit error:", error);
  }
}

/**
 * 發送 LINE Push Message
 */
async function pushLineMessage(
  lineClient: messagingApi.MessagingApiClient,
  lineUserId: string,
  data: LineMessageData,
  retryKey: string,
): Promise<void> {
  const messageText = buildLineMessage(
    data.agentName,
    data.connectUrl,
    data.propertyTitle,
    data.grade,
  );

  await lineClient.pushMessage(
    {
      to: lineUserId,
      messages: [{ type: "text", text: messageText }],
    },
    retryKey, // SDK 自動帶 X-Line-Retry-Key
  );
}

/**
 * 驗證請求參數
 */
function validateRequest(body: unknown): SendMessageRequest | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const { agentId, sessionId, purchaseId, message, agentName } = body as Record<
    string,
    unknown
  >;

  if (
    typeof agentId !== "string" ||
    typeof sessionId !== "string" ||
    typeof purchaseId !== "string" ||
    typeof message !== "string" ||
    typeof agentName !== "string"
  ) {
    return null;
  }

  return body as SendMessageRequest;
}

// ============================================================================
// Main Handler
// ============================================================================

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  // CORS 設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // 處理 preflight request
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // 只允許 POST
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      lineStatus: "error",
      error: "Method not allowed",
    } satisfies SendMessageResponse);
  }

  // 驗證環境變數
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const lineChannelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase configuration");
    return res.status(500).json({
      success: false,
      lineStatus: "error",
      error: "Server configuration error",
    } satisfies SendMessageResponse);
  }

  // 驗證請求參數
  const validatedBody = validateRequest(req.body);
  if (!validatedBody) {
    return res.status(400).json({
      success: false,
      lineStatus: "error",
      error:
        "Invalid request body. Required: agentId, sessionId, purchaseId, message, agentName",
    } satisfies SendMessageResponse);
  }

  const {
    agentId,
    sessionId,
    purchaseId,
    propertyId,
    message,
    agentName,
    propertyTitle,
    grade,
  } = validatedBody;

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
      "fn_create_conversation",
      {
        p_agent_id: agentId,
        p_consumer_session_id: sessionId,
        p_property_id: propertyId ?? null,
        p_lead_id: purchaseId,
      },
    );

    if (convError) {
      console.error("fn_create_conversation error:", convError);
      return res.status(500).json({
        success: false,
        lineStatus: "error",
        error: "Failed to create conversation",
      } satisfies SendMessageResponse);
    }

    const { data: messageId, error: msgError } = await supabaseAdmin.rpc(
      "fn_send_message",
      {
        p_conversation_id: conversationId,
        p_sender_type: "agent",
        p_sender_id: agentId,
        p_content: message,
      },
    );

    if (msgError) {
      console.error("fn_send_message error:", msgError);
      // 站內訊息失敗是嚴重錯誤
      return res.status(500).json({
        success: false,
        conversationId,
        lineStatus: "error",
        error: "Failed to send in-app message",
      } satisfies SendMessageResponse);
    }

    // ========== 2. 查詢 LINE 綁定狀態 ==========
    const { data: binding, error: bindError } = await supabaseAdmin.rpc(
      "fn_get_line_binding",
      { p_session_id: sessionId },
    );

    if (bindError) {
      console.error("fn_get_line_binding error:", bindError);
      // LINE 查詢失敗不影響站內訊息成功
      return res.json({
        success: true,
        conversationId,
        lineStatus: "error",
        error: "Failed to query LINE binding",
      } satisfies SendMessageResponse);
    }

    const lineBinding = binding as LineBindingResult | null;

    // 未綁定 LINE
    if (!lineBinding?.line_user_id) {
      await updateNotificationStatus(
        supabaseAdmin,
        purchaseId,
        "no_line",
        null,
      );
      return res.json({
        success: true,
        conversationId,
        lineStatus: "no_line",
      } satisfies SendMessageResponse);
    }

    // 已知被封鎖
    if (lineBinding.line_status === "blocked") {
      await updateNotificationStatus(
        supabaseAdmin,
        purchaseId,
        "unreachable",
        null,
      );
      return res.json({
        success: true,
        conversationId,
        lineStatus: "unreachable",
      } satisfies SendMessageResponse);
    }

    // 沒有 LINE Token，跳過發送
    if (!lineClient || !lineChannelToken) {
      await updateNotificationStatus(
        supabaseAdmin,
        purchaseId,
        "skipped",
        null,
      );
      return res.json({
        success: true,
        conversationId,
        lineStatus: "skipped",
        error: "LINE not configured",
      } satisfies SendMessageResponse);
    }

    // ========== 3. 產生 Connect Token ==========
    const connectToken = generateConnectToken(conversationId, sessionId);
    const connectUrl = `${baseUrl || "https://maihouses.vercel.app"}/maihouses/chat/connect?token=${connectToken}`;

    // ========== 4. 寫入通知佇列（防重複 + 支援重試）==========
    const retryKey = uuidv4();

    try {
      await supabaseAdmin.from("uag_line_notification_queue").insert({
        message_id: messageId,
        purchase_id: purchaseId,
        line_user_id: lineBinding.line_user_id,
        connect_url: connectUrl,
        agent_name: agentName,
        property_title: propertyTitle ?? null,
        grade: grade ?? null,
        status: "pending",
      });
    } catch (queueError) {
      // 重複插入會因 UNIQUE 失敗，忽略
      const errorMessage =
        queueError instanceof Error ? queueError.message : "";
      if (!errorMessage.includes("duplicate")) {
        console.error("Queue insert error:", queueError);
      }
    }

    // ========== 5. 立即嘗試發送（失敗會由 Cron 重試）==========
    try {
      await pushLineMessage(
        lineClient,
        lineBinding.line_user_id,
        {
          agentName,
          propertyTitle,
          connectUrl,
          grade,
        },
        retryKey,
      );

      // 發送成功，更新佇列狀態
      await supabaseAdmin
        .from("uag_line_notification_queue")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("message_id", messageId);

      await updateNotificationStatus(
        supabaseAdmin,
        purchaseId,
        "sent",
        retryKey,
      );
      await logLineAudit(
        supabaseAdmin,
        purchaseId,
        sessionId,
        retryKey,
        "sent",
        null,
      );

      return res.json({
        success: true,
        conversationId,
        lineStatus: "sent",
      } satisfies SendMessageResponse);
    } catch (lineError) {
      // 發送失敗，更新錯誤訊息（Cron 會重試）
      const errorMessage =
        lineError instanceof Error ? lineError.message : String(lineError);

      await supabaseAdmin
        .from("uag_line_notification_queue")
        .update({
          last_error: errorMessage,
          retry_count: 1,
        })
        .eq("message_id", messageId);

      await logLineAudit(
        supabaseAdmin,
        purchaseId,
        sessionId,
        retryKey,
        "failed",
        {
          error: errorMessage,
        },
      );

      // 站內訊息已成功，LINE 暫時失敗（會重試）
      return res.json({
        success: true,
        conversationId,
        lineStatus: "pending",
        error: "LINE send failed, will retry",
      } satisfies SendMessageResponse);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("send-message handler error:", error);

    return res.status(500).json({
      success: false,
      lineStatus: "error",
      error: errorMessage,
    } satisfies SendMessageResponse);
  }
}
