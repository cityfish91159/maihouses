/**
 * NOTIFY-2: Web Push 推播類型定義
 * @see supabase/migrations/20260103_001_push_subscriptions.sql
 */

// =============================================================================
// Push Subscription (推播訂閱)
// =============================================================================

/**
 * 推播訂閱資料（對應 push_subscriptions 表）
 */
export interface PushSubscription {
  id: string; // UUID
  profile_id: string; // 用戶 profile_id
  endpoint: string; // Push Service endpoint URL
  p256dh: string; // Public key for encryption
  auth: string; // Auth secret
  user_agent: string | null; // 訂閱時的瀏覽器資訊
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * 推播訂閱金鑰（用於存入資料庫）
 */
export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// =============================================================================
// Push Notification Payload (推播內容)
// =============================================================================

/**
 * 推播通知內容
 * 發送至 Service Worker 的資料格式
 */
export interface PushNotificationPayload {
  title: string; // 通知標題
  body: string; // 通知內容
  icon?: string; // 圖示 URL
  data?: PushNotificationData; // 附加資料
}

/**
 * 推播通知附加資料（用於點擊導向）
 */
export interface PushNotificationData {
  conversationId?: string; // 對話 ID
  url?: string; // 自定義導向 URL
  type?: 'message' | 'system'; // 通知類型
}

// =============================================================================
// Hook Return Types
// =============================================================================

/**
 * 推播權限狀態
 */
export type PushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

/**
 * usePushNotifications hook 返回值
 */
export interface UsePushNotificationsReturn {
  /** 推播權限狀態 */
  permission: PushPermissionState;
  /** 是否已訂閱 */
  isSubscribed: boolean;
  /** 是否正在處理（訂閱/取消訂閱） */
  isLoading: boolean;
  /** 錯誤訊息 */
  error: Error | null;
  /** 請求推播權限並訂閱 */
  subscribe: () => Promise<boolean>;
  /** 取消訂閱 */
  unsubscribe: () => Promise<boolean>;
}

// =============================================================================
// API Request/Response Types
// =============================================================================

/**
 * 儲存推播訂閱請求
 */
export interface SavePushSubscriptionRequest {
  profile_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent?: string;
}

/**
 * 發送推播通知請求（供 Edge Function 使用）
 */
export interface SendPushNotificationRequest {
  profile_id: string; // 目標用戶
  payload: PushNotificationPayload; // 推播內容
}

// =============================================================================
// Constants
// =============================================================================

/**
 * 推播相關常數
 */
export const PUSH_CONSTANTS = {
  /** Service Worker 路徑 */
  SW_PATH: '/maihouses/sw-maihouses.js',
  /** Service Worker scope */
  SW_SCOPE: '/maihouses/',
  /** 預設通知標題 */
  DEFAULT_TITLE: '邁邁房屋',
  /** 預設通知內容 */
  DEFAULT_BODY: '有房仲想聯繫您，點擊查看',
  /** 預設圖示 */
  DEFAULT_ICON: '/maihouses/logo-192.png',
} as const;
