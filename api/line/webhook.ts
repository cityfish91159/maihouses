/**
 * LINE Webhook Handler
 *
 * 用途：
 * 1. 捕獲用戶加好友時的 User ID
 * 2. 處理 follow/unfollow 事件
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

interface LineEvent {
  type: string;
  source: {
    type: string;
    userId?: string;
  };
  timestamp: number;
  replyToken?: string;
}

interface LineWebhookBody {
  events: LineEvent[];
}

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

export default async function handler(
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
      console.error("[LINE Webhook] Invalid signature");
      return res.status(401).json({ error: "Invalid signature" });
    }
  }

  const { events } = req.body as LineWebhookBody;

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

    switch (event.type) {
      case "follow":
        // ⭐ 用戶加好友 - 直接回覆 User ID
        console.log(`[LINE] 新用戶加好友: ${userId}`);

        if (lineClient && event.replyToken && userId) {
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
            console.error("[LINE] Reply failed:", err);
          }
        }
        break;

      case "unfollow":
        console.log(`[LINE] 用戶取消好友: ${userId}`);

        // 更新綁定狀態為 blocked
        if (userId) {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (supabaseUrl && supabaseServiceKey) {
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
                console.error("[LINE] Failed to update blocked status:", error);
              } else {
                console.log(`[LINE] Updated status to blocked: ${userId}`);
              }
            } catch (err) {
              console.error("[LINE] Update error:", err);
            }
          } else {
            console.error("[LINE] Missing Supabase config for unfollow update");
          }
        }
        break;

      case "message":
        // 用戶發訊息時也回覆 User ID（方便測試）
        if (lineClient && event.replyToken && userId) {
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
            console.error("[LINE] Reply failed:", err);
          }
        }
        break;

      default:
        console.log(`[LINE] 未處理的事件類型: ${event.type}`);
    }
  }

  return res.status(200).json({ message: "OK" });
}
