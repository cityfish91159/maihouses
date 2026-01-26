/**
 * LINE Webhook Handler
 *
 * 用途：
 * 1. 捕獲用戶加好友時的 User ID
 * 2. 處理 follow/unfollow 事件
 * 3. BE-4: 處理「我的交易」查詢
 *
 * 設定步驟：
 * 1. 去 LINE Developers Console
 * 2. 選擇你的 Messaging API Channel
 * 3. 設定 Webhook URL: https://maihouses.vercel.app/api/line/webhook
 * 4. 開啟 Use webhook
 * 5. 加好友後查看 Vercel Function Logs 取得 User ID
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";
import { messagingApi } from "@line/bot-sdk";
import { createClient } from "@supabase/supabase-js";
import { withSentryHandler, captureError, addBreadcrumb } from "../lib/sentry";
import { logger } from "../lib/logger";
import { z } from "zod";

// BE-4: 導入查詢服務和格式化器
import { queryMyCases } from "../trust/services/case-query";
import {
  formatMyCasesReply,
  formatErrorReply,
  isMyTransactionQuery,
} from "./formatters/my-cases-formatter";

// ============================================================================
// Zod Schemas
// ============================================================================

/** LINE 文字訊息 Schema */
const LineTextMessageSchema = z.object({
  type: z.literal("text"),
  text: z.string(),
});

/** LINE 事件 Schema（擴充支援 message 欄位） */
const LineEventSchema = z.object({
  type: z.string(),
  source: z.object({
    type: z.string(),
    userId: z.string().optional(),
  }),
  timestamp: z.number(),
  replyToken: z.string().optional(),
  message: LineTextMessageSchema.optional(),
});

const LineWebhookBodySchema = z.object({
  events: z.array(LineEventSchema),
});

type LineEvent = z.infer<typeof LineEventSchema>;

// ============================================================================
// Signature Verification
// ============================================================================

/**
 * 驗證 LINE Webhook 簽章
 */
function verifySignature(
  body: string,
  signature: string,
  channelSecret: string,
): boolean {
  const hash = crypto
    .createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");
  return hash === signature;
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * 處理 follow 事件（用戶加好友）
 */
async function handleFollowEvent(
  lineClient: messagingApi.MessagingApiClient,
  event: LineEvent,
  userId: string,
): Promise<void> {
  logger.info(`[LINE] 新用戶加好友: ${userId}`);

  if (!event.replyToken) return;

  try {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `🎉 歡迎使用邁房子！

你的 LINE User ID：
${userId}

📋 複製這串 ID 給開發者進行測試`,
        },
      ],
    });
  } catch (err) {
    logger.error("[LINE] Reply failed", err, { event: "follow", userId });
    captureError(err, { event: "follow", userId });
  }
}

/**
 * 處理 unfollow 事件（用戶取消好友）
 */
async function handleUnfollowEvent(userId: string): Promise<void> {
  logger.info(`[LINE] 用戶取消好友: ${userId}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    logger.warn("[LINE] Missing Supabase config for unfollow update");
    return;
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { error } = await supabaseAdmin
      .from("uag_line_bindings")
      .update({
        line_status: "blocked",
        updated_at: new Date().toISOString(),
      })
      .eq("line_user_id", userId);

    if (error) {
      logger.error("[LINE] Failed to update blocked status", error, { userId });
      captureError(error, { event: "unfollow", userId });
    } else {
      logger.info(`[LINE] Updated status to blocked: ${userId}`);
    }
  } catch (err) {
    logger.error("[LINE] Update error", err, { userId });
    captureError(err, { event: "unfollow", userId });
  }
}

/**
 * BE-4: 處理「我的交易」查詢
 *
 * 回傳 Flex Message（有案件時）或純文字（無案件/錯誤時）
 */
async function handleMyCasesQuery(
  lineClient: messagingApi.MessagingApiClient,
  event: LineEvent,
  userId: string,
): Promise<void> {
  if (!event.replyToken) return;

  logger.info("[LINE] My cases query", { userId: userId.slice(0, 8) + "..." });

  try {
    // 呼叫業務邏輯層查詢
    const result = await queryMyCases(userId);

    // 格式化回覆（可能是 Flex Message 或純文字）
    const replyMessage = result.success
      ? formatMyCasesReply(result.data.cases)
      : formatErrorReply();

    // 修復 TS2322: 使用 as unknown as 轉換 LINE SDK 類型
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [replyMessage as unknown as messagingApi.Message],
    });

    if (result.success) {
      logger.info("[LINE] My cases reply sent", {
        userId: userId.slice(0, 8) + "...",
        caseCount: result.data.total,
        messageType: replyMessage.type,
      });
    }
  } catch (err) {
    logger.error("[LINE] My cases query failed", err, { userId: userId.slice(0, 8) + "..." });
    captureError(err, { event: "my_cases_query", userId });

    // 嘗試回覆錯誤訊息
    try {
      await lineClient.replyMessage({
        replyToken: event.replyToken,
        messages: [formatErrorReply()],
      });
    } catch (replyErr) {
      logger.error("[LINE] Error reply failed", replyErr);
    }
  }
}

/**
 * 處理一般訊息（回覆 User ID）
 */
async function handleDefaultMessage(
  lineClient: messagingApi.MessagingApiClient,
  event: LineEvent,
  userId: string,
): Promise<void> {
  if (!event.replyToken) return;

  try {
    await lineClient.replyMessage({
      replyToken: event.replyToken,
      messages: [
        {
          type: "text",
          text: `你的 LINE User ID：\n${userId}`,
        },
      ],
    });
  } catch (err) {
    logger.error("[LINE] Reply failed", err, { event: "message", userId });
    captureError(err, { event: "message", userId });
  }
}

// ============================================================================
// Main Handler
// ============================================================================

async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  // LINE Webhook 驗證（GET 請求）
  if (req.method === "GET") {
    return res.status(200).send("LINE Webhook is active");
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  // 可選：驗證簽章（建議生產環境開啟）
  if (channelSecret) {
    const signature = req.headers["x-line-signature"] as string;
    const body = JSON.stringify(req.body);

    if (!verifySignature(body, signature, channelSecret)) {
      logger.warn("[LINE Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  // 驗證請求格式
  const bodyParseResult = LineWebhookBodySchema.safeParse(req.body);
  if (!bodyParseResult.success) {
    logger.warn("[LINE Webhook] Invalid request body format");
    return res.status(400).json({ error: "Invalid request body" });
  }
  const { events } = bodyParseResult.data;

  if (!events || events.length === 0) {
    // LINE 會發送空 events 來驗證 webhook
    return res.status(200).json({ message: "OK" });
  }

  // 初始化 LINE Client（用於回覆）
  const lineChannelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  let lineClient: messagingApi.MessagingApiClient | null = null;
  if (lineChannelToken) {
    lineClient = new messagingApi.MessagingApiClient({
      channelAccessToken: lineChannelToken,
    });
  }

  // 處理事件
  for (const event of events) {
    const userId = event.source.userId;

    // 添加事件追蹤
    addBreadcrumb(`LINE event: ${event.type}`, "line", { userId });

    switch (event.type) {
      case "follow":
        if (lineClient && userId) {
          await handleFollowEvent(lineClient, event, userId);
        }
        break;

      case "unfollow":
        if (userId) {
          await handleUnfollowEvent(userId);
        }
        break;

      case "message":
        if (lineClient && userId) {
          // 取得訊息內容
          const messageText = event.message?.type === "text" ? event.message.text : null;

          // BE-4: 檢查是否為「我的交易」查詢
          if (isMyTransactionQuery(messageText)) {
            await handleMyCasesQuery(lineClient, event, userId);
          } else {
            await handleDefaultMessage(lineClient, event, userId);
          }
        }
        break;

      default:
        logger.debug(`[LINE] 未處理的事件類型: ${event.type}`);
    }
  }

  return res.status(200).json({ message: "OK" });
}

// 使用 Sentry wrapper 導出
export default withSentryHandler(handler, "line/webhook");
