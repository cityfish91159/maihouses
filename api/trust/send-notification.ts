/**
 * BE-8 | 推播失敗處理
 *
 * 提供 Trust Flow 通知發送功能，含重試和降級機制
 * 供 BE-5（進度更新推播）、BE-9（案件關閉通知）使用
 *
 * 流程：
 * 1. 取得通知目標（BE-7 getNotifyTarget）
 * 2. 根據 target.type 選擇 Push 或 LINE
 * 3. 失敗時重試一次（1 秒延遲）
 * 4. 仍失敗時記錄日誌
 * 5. 降級：Push 失敗且有 LINE ID 時嘗試 LINE
 *
 * Skills Applied:
 * - [NASA TypeScript Safety] Zod Schema 驗證 + 函數入口驗證
 * - [Backend Safeguard] 完整錯誤處理 + 重試機制
 * - [Audit Logging] 結構化日誌（PII 遮罩）
 */

import { messagingApi } from "@line/bot-sdk";
import webpush from "web-push";
import { z } from "zod";
import { supabase } from "./_utils";
import {
  getNotifyTarget,
  type NotifyTarget,
  type NotifyTargetPush,
  type NotifyTargetLine,
} from "./notify";
import { logger } from "../lib/logger";
import { captureError, addBreadcrumb } from "../lib/sentry";

// ============================================================================
// Constants
// ============================================================================

/** 重試延遲時間（毫秒） */
const RETRY_DELAY_MS = 1000;

/** LINE User ID 格式驗證 */
const LINE_USER_ID_REGEX = /^U[a-f0-9]{32}$/;

/** Trust Room 基礎 URL */
const TRUST_ROOM_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://maihouses.vercel.app";

/** Max payload bytes for Web Push (keep margin below 4KB limit) */
const MAX_PUSH_PAYLOAD_BYTES = 3800;

/** Expired subscription status codes from Push Services */
const EXPIRED_SUBSCRIPTION_STATUS_CODES = new Set([410, 404, 403]);

// ============================================================================
// Types
// ============================================================================

/**
 * 通知訊息結構
 */
export interface NotificationMessage {
  /** 訊息類型（用於日誌分類） */
  type: "step_update" | "case_closed" | "case_wake" | "custom";
  /** 標題（例：「交易進度更新」） */
  title: string;
  /** 內容（例：「M2 帶看 → M3 出價」） */
  body: string;
}

/**
 * 發送通道類型
 */
export type SendChannel =
  | "push"
  | "line"
  | "fallback_line"
  | "none"
  | "skipped";

/**
 * 發送結果
 */
export interface SendResult {
  /** 是否成功發送 */
  success: boolean;
  /** 使用的發送通道 */
  channel: SendChannel;
  /** 錯誤訊息（僅失敗時） */
  error?: string;
  /** 是否經過重試 */
  retried?: boolean;
  /** 是否使用降級機制 */
  fallback?: boolean;
}

/**
 * 完整通知目標（含降級 LINE ID）
 * 用於降級機制：Push 失敗時嘗試 LINE
 */
interface FullNotifyTarget {
  primary: NotifyTarget;
  fallbackLineId: string | null;
}

// ============================================================================
// Zod Schemas
// ============================================================================

/** UUID Schema */
const UUIDSchema = z.string().uuid();

/** LINE User ID Schema */
const LineUserIdSchema = z.string().regex(LINE_USER_ID_REGEX, {
  message: "LINE User ID 格式錯誤，應為 U + 32 個十六進位字元",
});

/** 通知訊息 Schema */
const NotificationMessageSchema = z.object({
  type: z.enum(["step_update", "case_closed", "case_wake", "custom"]),
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(500),
});

/** sendNotification 參數 Schema */
const SendNotificationParamsSchema = z.object({
  caseId: UUIDSchema,
  message: NotificationMessageSchema,
});

/** 案件降級查詢結果 Schema */
const CaseFallbackFieldsSchema = z.object({
  buyer_user_id: UUIDSchema.nullable(),
  buyer_line_id: LineUserIdSchema.nullable().or(z.literal(null)),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 遮罩 UUID（只顯示前 8 字元）
 * @internal
 */
function maskUUID(uuid: string): string {
  if (uuid.length < 8) return "***";
  return `${uuid.slice(0, 8)}...`;
}

/**
 * 遮罩 LINE User ID（只顯示前 5 字元）
 * @internal
 */
function maskLineId(lineId: string): string {
  if (lineId.length < 5) return "***";
  return `${lineId.slice(0, 5)}...`;
}

/**
 * 延遲函數
 * @internal
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 生成 Trust Room URL
 * @internal
 */
function generateTrustRoomUrl(caseId: string): string {
  return `${TRUST_ROOM_BASE_URL}/maihouses/#/trust-room/${caseId}`;
}

/**
 * 建構 LINE 訊息內容
 * @internal
 */
function buildLineMessageText(
  message: NotificationMessage,
  trustRoomUrl: string,
): string {
  const emoji = getMessageEmoji(message.type);
  return `${emoji} ${message.title}\n\n${message.body}\n\n📱 查看詳情：${trustRoomUrl}`;
}

/**
 * 根據訊息類型取得 Emoji
 * @internal
 */
function getMessageEmoji(type: NotificationMessage["type"]): string {
  switch (type) {
    case "step_update":
      return "🔔";
    case "case_closed":
      return "📋";
    case "case_wake":
      return "⏰";
    case "custom":
      return "💬";
  }
}

// ============================================================================
// LINE Client Management
// ============================================================================

/** LINE Client 單例 */
let lineClientInstance: messagingApi.MessagingApiClient | null = null;

/**
 * 取得 LINE Client（懶載入單例）
 * @internal
 */
function getLineClient(): messagingApi.MessagingApiClient | null {
  if (lineClientInstance) return lineClientInstance;

  const lineChannelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!lineChannelToken) {
    logger.warn("[send-notification] LINE_CHANNEL_ACCESS_TOKEN not configured");
    return null;
  }

  lineClientInstance = new messagingApi.MessagingApiClient({
    channelAccessToken: lineChannelToken,
  });

  return lineClientInstance;
}

// ============================================================================
// Core Send Functions
// ============================================================================

/**
 * Push 發送函數類型
 */
export type PushSender = (
  userId: string,
  message: NotificationMessage,
  trustRoomUrl: string,
) => Promise<void>;

// ============================================================================
// VAPID Configuration
// ============================================================================

/** VAPID 設定 Promise（用於避免競態條件） */
let vapidConfigPromise: Promise<void> | null = null;

/**
 * 實際執行 VAPID 設定
 * @internal
 */
async function configureVapid(): Promise<void> {

  // 從 Supabase Vault 讀取私鑰（使用 service_role client）
  const { data: privateKey, error: privateKeyError } = await supabase.rpc(
    "fn_get_vapid_private_key",
  );

  if (privateKeyError || !privateKey) {
    const errMsg = privateKeyError?.message ?? "No data returned";
    logger.error("[send-notification] Failed to get VAPID_PRIVATE_KEY from Vault", {
      error: errMsg,
    });
    throw new Error(`Failed to get VAPID_PRIVATE_KEY from Vault: ${errMsg}`);
  }

  // 公鑰從 Vercel 環境變數讀取（與前端共用 VITE_VAPID_PUBLIC_KEY）
  // 注意：雖然 VITE_ 前綴通常是前端用，但 Vercel Serverless 也能讀取
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    logger.error("[send-notification] VITE_VAPID_PUBLIC_KEY not configured");
    throw new Error("VITE_VAPID_PUBLIC_KEY not configured");
  }

  webpush.setVapidDetails(
    "mailto:support@maihouses.com",
    publicKey,
    privateKey,
  );

  logger.info("[send-notification] VAPID configured successfully");
}

/**
 * 確保 VAPID 已設定（從 Supabase Vault 讀取私鑰）
 *
 * 使用 Promise 鎖避免競態條件：多個請求同時進入時只會執行一次
 * @internal
 */
async function ensureVapidConfigured(): Promise<void> {
  if (vapidConfigPromise) return vapidConfigPromise;
  vapidConfigPromise = configureVapid().catch((error) => {
    vapidConfigPromise = null;
    throw error;
  });
  return vapidConfigPromise;
}

/**
 * 重設 VAPID 設定狀態（供測試使用）
 * @internal
 */
export function resetVapidConfig(): void {
  vapidConfigPromise = null;
}

/** Push 訂閱資料結構（從 fn_get_push_subscriptions 回傳） */
interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/** fn_get_push_subscriptions 回傳結果 Zod Schema */
const PushSubscriptionRowSchema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string().min(1),
  auth: z.string().min(1),
});

const PushSubscriptionsArraySchema = z.array(PushSubscriptionRowSchema);

/**
 * 查詢用戶的 Push 訂閱
 * @internal
 */
async function fetchSubscriptions(userId: string): Promise<PushSubscriptionRow[]> {
  const { data: subscriptionsRaw, error: subsError } = await supabase.rpc(
    "fn_get_push_subscriptions",
    { p_profile_id: userId },
  );

  if (subsError) {
    logger.error("[send-notification] Failed to get push subscriptions", {
      error: subsError.message,
      userIdMasked: maskUUID(userId),
    });
    throw new Error(`Failed to get push subscriptions: ${subsError.message}`);
  }

  const parseResult = PushSubscriptionsArraySchema.safeParse(subscriptionsRaw);
  if (!parseResult.success) {
    logger.error("[send-notification] Invalid subscriptions data format", {
      error: parseResult.error.message,
      userIdMasked: maskUUID(userId),
    });
    throw new Error("Invalid subscriptions data format");
  }

  return parseResult.data;
}

/**
 * 從錯誤物件安全取得 statusCode
 * @internal
 */
function getErrorStatusCode(error: unknown): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  ) {
    return (error as { statusCode: number }).statusCode;
  }
  return undefined;
}

/**
 * 從錯誤物件安全取得 message
 * @internal
 */
function getErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return "Unknown error";
}

/**
 * Trim string to max byte length (UTF-8)
 * @internal
 */
function trimToByteLength(value: string, maxBytes: number): string {
  if (maxBytes <= 0) return "";
  if (Buffer.byteLength(value, "utf8") <= maxBytes) return value;

  let low = 0;
  let high = value.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const slice = value.slice(0, mid);
    if (Buffer.byteLength(slice, "utf8") <= maxBytes) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return value.slice(0, Math.max(0, low - 1));
}

/**
 * Build push payload with size protection
 * @internal
 */
function buildPushPayload(
  message: NotificationMessage,
  trustRoomUrl: string,
): { payload: string; trimmed: boolean } {
  const basePayload = {
    title: message.title,
    body: message.body,
    data: { url: trustRoomUrl },
  };

  let payload = JSON.stringify(basePayload);
  if (Buffer.byteLength(payload, "utf8") <= MAX_PUSH_PAYLOAD_BYTES) {
    return { payload, trimmed: false };
  }

  const emptyBodyPayload = JSON.stringify({
    title: message.title,
    body: "",
    data: { url: trustRoomUrl },
  });
  const emptyBodyBytes = Buffer.byteLength(emptyBodyPayload, "utf8");
  const availableBytes = Math.max(0, MAX_PUSH_PAYLOAD_BYTES - emptyBodyBytes - 3);
  const trimmedBody = trimToByteLength(message.body, availableBytes);
  const finalBody =
    trimmedBody.length < message.body.length ? `${trimmedBody}...` : trimmedBody;

  payload = JSON.stringify({
    title: message.title,
    body: finalBody,
    data: { url: trustRoomUrl },
  });

  if (Buffer.byteLength(payload, "utf8") > MAX_PUSH_PAYLOAD_BYTES) {
    payload = emptyBodyPayload;
  }

  return { payload, trimmed: true };
}

/**
 * Build Web Push options (TTL / urgency / topic)
 * @internal
 */
function buildPushOptions(message: NotificationMessage): {
  TTL: number;
  urgency: "very-low" | "low" | "normal" | "high";
  topic: string;
} {
  switch (message.type) {
    case "case_closed":
      return { TTL: 24 * 60 * 60, urgency: "high", topic: "trust-case-closed" };
    case "case_wake":
      return { TTL: 24 * 60 * 60, urgency: "normal", topic: "trust-case-wake" };
    case "step_update":
      return { TTL: 60 * 60, urgency: "normal", topic: "trust-step-update" };
    case "custom":
      return { TTL: 60 * 60, urgency: "low", topic: "trust-custom" };
  }
}

/**
 * 處理 Push 發送結果（包含 410 Gone 刪除）
 * @internal
 */
async function processSendResults(
  results: PromiseSettledResult<unknown>[],
  subscriptions: PushSubscriptionRow[],
  userId: string,
): Promise<{ successCount: number; failCount: number }> {
  let successCount = 0;
  let failCount = 0;
  const expiredEndpoints = new Set<string>();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const sub = subscriptions[i];

    if (!sub) continue; // 安全檢查

    if (result.status === "fulfilled") {
      successCount++;
      logger.info("[send-notification] Push sent successfully", {
        endpoint: sub.endpoint.slice(0, 50) + "...",
      });
    } else {
      failCount++;
      const statusCode = getErrorStatusCode(result.reason);
      const errorMessage = getErrorMessage(result.reason);

      if (statusCode && EXPIRED_SUBSCRIPTION_STATUS_CODES.has(statusCode)) {
        logger.info("[send-notification] Subscription expired, queue delete", {
          endpoint: sub.endpoint.slice(0, 50) + "...",
          statusCode,
        });
        expiredEndpoints.add(sub.endpoint);
      } else {
        logger.error("[send-notification] Push send failed", {
          endpoint: sub.endpoint.slice(0, 50) + "...",
          statusCode,
          message: errorMessage,
        });
      }
    }
  }

  if (expiredEndpoints.size > 0) {
    const endpoints = Array.from(expiredEndpoints);
    const { error: deleteError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("profile_id", userId)
      .in("endpoint", endpoints);

    if (deleteError) {
      logger.error("[send-notification] Failed to delete expired subscriptions", {
        error: deleteError.message,
        count: endpoints.length,
      });
    } else {
      logger.info("[send-notification] Deleted expired subscriptions", {
        count: endpoints.length,
      });
    }
  }

  logger.info("[send-notification] Push send summary", {
    userIdMasked: maskUUID(userId),
    successCount,
    failCount,
    total: subscriptions.length,
  });

  return { successCount, failCount };
}

/**
 * 預設的 Web Push 發送函數
 *
 * 真正的實作：
 * 1. 從 Supabase Vault 讀取 VAPID_PRIVATE_KEY（首次呼叫時）
 * 2. 查詢用戶的 push_subscriptions
 * 3. 使用 web-push 套件發送到所有訂閱
 * 4. 處理 410 Gone（刪除失效訂閱）
 *
 * @param userId - 用戶 UUID
 * @param message - 通知訊息
 * @param trustRoomUrl - Trust Room 連結
 * @throws Error 當所有訂閱都發送失敗時
 */
export async function defaultSendPush(
  userId: string,
  message: NotificationMessage,
  trustRoomUrl: string,
): Promise<void> {
  // [NASA TypeScript Safety] 驗證 userId 格式
  const userIdResult = UUIDSchema.safeParse(userId);
  if (!userIdResult.success) {
    throw new Error(`Invalid userId format: ${userId}`);
  }

  logger.info("[send-notification] sendPush called", {
    userIdMasked: maskUUID(userId),
    messageType: message.type,
  });

  // Step 1: 確保 VAPID 已設定
  await ensureVapidConfigured();

  // Step 2: 查詢訂閱
  const subscriptions = await fetchSubscriptions(userId);

  if (subscriptions.length === 0) {
    logger.warn("[send-notification] No push subscriptions found", {
      userIdMasked: maskUUID(userId),
    });
    throw new Error("No push subscriptions found");
  }

  logger.info("[send-notification] Found subscriptions", {
    userIdMasked: maskUUID(userId),
    count: subscriptions.length,
  });

  // Step 3: 準備 payload
  const { payload, trimmed } = buildPushPayload(message, trustRoomUrl);
  if (trimmed) {
    logger.warn("[send-notification] Push payload trimmed due to size limit", {
      userIdMasked: maskUUID(userId),
      messageType: message.type,
    });
  }
  const pushOptions = buildPushOptions(message);

  // Step 4: 發送到每個訂閱
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload,
        pushOptions,
      ),
    ),
  );

  // Step 5: 處理結果
  const { successCount, failCount } = await processSendResults(results, subscriptions, userId);

  // 全部失敗時拋出錯誤
  if (successCount === 0) {
    throw new Error(`All ${failCount} push subscriptions failed`);
  }
}

/**
 * 可注入的 Push 發送函數（供測試 mock 使用）
 * @internal
 */
export let pushSender: PushSender = defaultSendPush;

/**
 * 設定 Push 發送函數（供測試使用）
 * @internal
 */
export function setPushSender(sender: PushSender): void {
  pushSender = sender;
}

/**
 * 重設 Push 發送函數為預設值（供測試使用）
 * @internal
 */
export function resetPushSender(): void {
  pushSender = defaultSendPush;
}

/**
 * 發送 LINE 推播
 *
 * @param lineId - LINE User ID (U + 32 hex chars)
 * @param message - 通知訊息
 * @param trustRoomUrl - Trust Room 連結
 * @throws Error 當 LINE 發送失敗時
 * @internal
 */
async function sendLine(
  lineId: string,
  message: NotificationMessage,
  trustRoomUrl: string,
): Promise<void> {
  // [NASA TypeScript Safety] 驗證 lineId 格式
  const lineIdResult = LineUserIdSchema.safeParse(lineId);
  if (!lineIdResult.success) {
    throw new Error(`Invalid LINE User ID format: ${lineId}`);
  }

  const lineClient = getLineClient();
  if (!lineClient) {
    throw new Error("LINE client not available");
  }

  const messageText = buildLineMessageText(message, trustRoomUrl);

  logger.info("[send-notification] sendLine called", {
    lineIdMasked: maskLineId(lineId),
    messageType: message.type,
  });

  await lineClient.pushMessage({
    to: lineId,
    messages: [{ type: "text", text: messageText }],
  });

  logger.info("[send-notification] LINE push succeeded", {
    lineIdMasked: maskLineId(lineId),
  });
}

/**
 * 記錄通知失敗日誌
 *
 * @param caseId - 案件 UUID
 * @param target - 通知目標
 * @param message - 通知訊息
 * @param error - 錯誤訊息
 * @param channel - 發送通道
 * @param retried - 是否已重試
 * @internal
 */
async function logNotificationFailure(
  caseId: string,
  target: NotifyTarget,
  message: NotificationMessage,
  error: string,
  channel: SendChannel,
  retried: boolean,
): Promise<void> {
  const targetId = target
    ? target.type === "push"
      ? maskUUID(target.userId)
      : maskLineId(target.lineId)
    : "none";

  const targetType = target?.type ?? "none";

  logger.error("[send-notification] Notification failed", new Error(error), {
    caseIdMasked: maskUUID(caseId),
    targetType,
    targetIdMasked: targetId,
    messageType: message.type,
    channel,
    retried,
  });

  // 發送到 Sentry
  captureError(new Error(`Notification failed: ${error}`), {
    caseId: maskUUID(caseId),
    targetType,
    messageType: message.type,
    channel,
    retried,
  });

  // 寫入 DB 日誌（使用 trust_case_events 表記錄系統事件）
  try {
    await supabase.from("trust_case_events").insert({
      case_id: caseId,
      step: 0, // 系統事件
      step_name: "系統通知",
      action: `通知失敗：${message.type}`,
      actor: "system",
      detail: `${channel} 發送失敗${retried ? "（已重試）" : ""}：${error}`,
    });
  } catch (dbError) {
    logger.error("[send-notification] Failed to log to DB", dbError);
  }
}

/**
 * 查詢降級用的 LINE ID
 *
 * 當 Push 失敗時，需要知道是否有 LINE ID 可以降級
 *
 * @param caseId - 案件 UUID
 * @returns LINE ID 或 null
 * @internal
 */
async function getFallbackLineId(caseId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("trust_cases")
    .select("buyer_user_id, buyer_line_id")
    .eq("id", caseId)
    .single();

  if (error || !data) {
    return null;
  }

  const parseResult = CaseFallbackFieldsSchema.safeParse(data);
  if (!parseResult.success) {
    return null;
  }

  return parseResult.data.buyer_line_id;
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * 發送通知（含重試 + 降級）
 *
 * 完整流程：
 * 1. 驗證參數
 * 2. 取得通知目標（BE-7 getNotifyTarget）
 * 3. 根據 target.type 選擇 Push 或 LINE
 * 4. 失敗時重試一次（1 秒延遲）
 * 5. 仍失敗時記錄日誌
 * 6. 降級：Push 失敗且有 LINE ID 時嘗試 LINE
 *
 * @param caseId - 案件 UUID
 * @param message - 通知訊息
 * @returns SendResult
 *
 * @example
 * ```typescript
 * const result = await sendNotification(
 *   "550e8400-e29b-41d4-a716-446655440000",
 *   {
 *     type: "step_update",
 *     title: "交易進度更新",
 *     body: "M2 帶看 → M3 出價"
 *   }
 * );
 *
 * if (result.success) {
 *   console.log(`通知已透過 ${result.channel} 發送`);
 * } else {
 *   console.error(`通知失敗：${result.error}`);
 * }
 * ```
 */
export async function sendNotification(
  caseId: string,
  message: NotificationMessage,
): Promise<SendResult> {
  // [NASA TypeScript Safety] 函數入口驗證
  const paramsResult = SendNotificationParamsSchema.safeParse({
    caseId,
    message,
  });
  if (!paramsResult.success) {
    const zodErrors = paramsResult.error?.issues ?? [];
    const errorMsg =
      zodErrors.length > 0
        ? zodErrors.map((e: { message: string }) => e.message).join(", ")
        : "Invalid parameters";
    logger.warn("[send-notification] Invalid params", {
      error: errorMsg,
    });
    return {
      success: false,
      channel: "none",
      error: `Invalid parameters: ${errorMsg}`,
    };
  }

  // 添加 Sentry breadcrumb
  addBreadcrumb("sendNotification called", "trust.notification", {
    caseId: maskUUID(caseId),
    messageType: message.type,
  });

  logger.info("[send-notification] Starting notification", {
    caseIdMasked: maskUUID(caseId),
    messageType: message.type,
  });

  // Step 1: 取得通知目標
  let target: NotifyTarget;
  try {
    target = await getNotifyTarget(caseId);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    logger.error("[send-notification] getNotifyTarget failed", err, {
      caseIdMasked: maskUUID(caseId),
    });
    return {
      success: false,
      channel: "none",
      error: errorMsg,
    };
  }

  // Step 2: 無通知目標
  if (!target) {
    logger.info("[send-notification] No notify target", {
      caseIdMasked: maskUUID(caseId),
    });
    return {
      success: false,
      channel: "none",
      error: "No notification target available",
    };
  }

  const trustRoomUrl = generateTrustRoomUrl(caseId);

  // Step 3: 根據類型發送
  if (target.type === "push") {
    return sendWithPushAndFallback(caseId, target, message, trustRoomUrl);
  } else {
    return sendWithLineAndRetry(caseId, target, message, trustRoomUrl);
  }
}

/**
 * Push 發送（含重試 + LINE 降級）
 * @internal
 */
async function sendWithPushAndFallback(
  caseId: string,
  target: NotifyTargetPush,
  message: NotificationMessage,
  trustRoomUrl: string,
): Promise<SendResult> {
  // 第一次嘗試
  try {
    await pushSender(target.userId, message, trustRoomUrl);
    return { success: true, channel: "push" };
  } catch (firstError) {
    const firstErrorMsg =
      firstError instanceof Error ? firstError.message : "Unknown error";
    logger.warn("[send-notification] Push failed, retrying", {
      error: firstErrorMsg,
    });

    // 重試一次
    await delay(RETRY_DELAY_MS);

    try {
      await pushSender(target.userId, message, trustRoomUrl);
      return { success: true, channel: "push", retried: true };
    } catch (retryError) {
      const retryErrorMsg =
        retryError instanceof Error ? retryError.message : "Unknown error";

      // Push 重試失敗，嘗試降級到 LINE
      const fallbackLineId = await getFallbackLineId(caseId);

      if (fallbackLineId) {
        logger.info("[send-notification] Attempting LINE fallback", {
          caseIdMasked: maskUUID(caseId),
        });

        try {
          await sendLine(fallbackLineId, message, trustRoomUrl);
          logger.info("[send-notification] LINE fallback succeeded");
          return {
            success: true,
            channel: "fallback_line",
            retried: true,
            fallback: true,
          };
        } catch (fallbackError) {
          const fallbackErrorMsg =
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error";

          // 所有方式都失敗
          await logNotificationFailure(
            caseId,
            target,
            message,
            `Push failed: ${retryErrorMsg}, LINE fallback failed: ${fallbackErrorMsg}`,
            "fallback_line",
            true,
          );

          return {
            success: false,
            channel: "fallback_line",
            error: fallbackErrorMsg,
            retried: true,
            fallback: true,
          };
        }
      } else {
        // 無 LINE ID 可降級
        await logNotificationFailure(
          caseId,
          target,
          message,
          retryErrorMsg,
          "push",
          true,
        );

        return {
          success: false,
          channel: "push",
          error: retryErrorMsg,
          retried: true,
        };
      }
    }
  }
}

/**
 * LINE 發送（含重試）
 * @internal
 */
async function sendWithLineAndRetry(
  caseId: string,
  target: NotifyTargetLine,
  message: NotificationMessage,
  trustRoomUrl: string,
): Promise<SendResult> {
  // 檢查 LINE Client 是否可用
  const lineClient = getLineClient();
  if (!lineClient) {
    logger.warn("[send-notification] LINE not available, skipping", {
      caseIdMasked: maskUUID(caseId),
    });
    return {
      success: false,
      channel: "skipped",
      error: "LINE client not configured",
    };
  }

  // 第一次嘗試
  try {
    await sendLine(target.lineId, message, trustRoomUrl);
    return { success: true, channel: "line" };
  } catch (firstError) {
    const firstErrorMsg =
      firstError instanceof Error ? firstError.message : "Unknown error";
    logger.warn("[send-notification] LINE failed, retrying", {
      error: firstErrorMsg,
    });

    // 重試一次
    await delay(RETRY_DELAY_MS);

    try {
      await sendLine(target.lineId, message, trustRoomUrl);
      return { success: true, channel: "line", retried: true };
    } catch (retryError) {
      const retryErrorMsg =
        retryError instanceof Error ? retryError.message : "Unknown error";

      // LINE 重試失敗
      await logNotificationFailure(
        caseId,
        target,
        message,
        retryErrorMsg,
        "line",
        true,
      );

      return {
        success: false,
        channel: "line",
        error: retryErrorMsg,
        retried: true,
      };
    }
  }
}

// ============================================================================
// Convenience Functions (供 BE-5, BE-9 使用)
// ============================================================================

/**
 * 發送步驟更新通知
 *
 * @param caseId - 案件 UUID
 * @param fromStep - 原步驟（1-6）
 * @param toStep - 新步驟（1-6）
 * @param propertyTitle - 物件標題（可選）
 */
export async function sendStepUpdateNotification(
  caseId: string,
  fromStep: number,
  toStep: number,
  propertyTitle?: string,
): Promise<SendResult> {
  const stepNames: Record<number, string> = {
    1: "M1 接洽",
    2: "M2 帶看",
    3: "M3 出價",
    4: "M4 斡旋",
    5: "M5 成交",
    6: "M6 交屋",
  };

  const fromName = stepNames[fromStep] ?? `步驟 ${fromStep}`;
  const toName = stepNames[toStep] ?? `步驟 ${toStep}`;

  const message: NotificationMessage = {
    type: "step_update",
    title: propertyTitle ? `${propertyTitle} 進度更新` : "交易進度更新",
    body: `${fromName} → ${toName}`,
  };

  return sendNotification(caseId, message);
}

/**
 * 發送案件關閉通知
 *
 * @param caseId - 案件 UUID
 * @param reason - 關閉原因
 * @param propertyTitle - 物件標題（可選）
 */
export async function sendCaseClosedNotification(
  caseId: string,
  reason:
    | "closed_sold_to_other"
    | "closed_property_unlisted"
    | "closed_inactive",
  propertyTitle?: string,
): Promise<SendResult> {
  const reasonTexts: Record<string, string> = {
    closed_sold_to_other: "此物件已由其他買方成交，感謝您的關注",
    closed_property_unlisted: "此物件已下架，案件已關閉",
    closed_inactive: "案件因長期無互動已自動關閉",
  };

  const message: NotificationMessage = {
    type: "case_closed",
    title: propertyTitle ? `${propertyTitle} 案件已關閉` : "案件已關閉",
    body: reasonTexts[reason] ?? "案件已關閉",
  };

  return sendNotification(caseId, message);
}

/**
 * 發送案件喚醒通知
 *
 * @param caseId - 案件 UUID
 * @param propertyTitle - 物件標題（可選）
 */
export async function sendCaseWakeNotification(
  caseId: string,
  propertyTitle?: string,
): Promise<SendResult> {
  const message: NotificationMessage = {
    type: "case_wake",
    title: propertyTitle ? `${propertyTitle} 交易已恢復` : "交易已恢復",
    body: "您的交易已恢復進行中，歡迎繼續追蹤進度",
  };

  return sendNotification(caseId, message);
}
