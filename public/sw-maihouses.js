/**
 * MaiHouses Service Worker
 * NOTIFY-2: Web Push 推播通知
 *
 * 處理瀏覽器推播通知的接收與顯示
 */

const SW_VERSION = 'maihouses-v1';
const DEFAULT_NOTIFICATION_OPTIONS = {
  badge: '/maihouses/logo-72.png',
  icon: '/maihouses/logo-192.png',
  vibrate: [100, 50, 100],
  requireInteraction: false,
  tag: 'maihouses-notification',
};

// ============ 安裝與啟動 ============

self.addEventListener('install', (event) => {
  // 立即啟用新版 Service Worker
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  // 立即接管所有頁面
  event.waitUntil(self.clients.claim());
});

// ============ 推播通知 ============

/**
 * 處理推播事件
 *
 * 推播資料格式:
 * {
 *   title: string;           // 通知標題
 *   body: string;            // 通知內容
 *   icon?: string;           // 圖示 URL
 *   data?: {
 *     conversationId?: string;  // 對話 ID（用於點擊導向）
 *     url?: string;             // 自定義導向 URL
 *   }
 * }
 */
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // 無法解析 JSON，使用純文字
    payload = {
      title: '邁邁房屋',
      body: event.data.text() || '您有新的通知',
    };
  }

  const title = payload.title || '邁邁房屋';
  const options = {
    ...DEFAULT_NOTIFICATION_OPTIONS,
    body: payload.body || '有房仲想聯繫您，點擊查看',
    icon: payload.icon || DEFAULT_NOTIFICATION_OPTIONS.icon,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * 處理通知點擊事件
 * 導向至對應的對話頁面或首頁
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let targetUrl = '/maihouses/';

  // 優先使用 conversationId 導向對話頁面
  if (data.conversationId) {
    targetUrl = `/maihouses/chat/${data.conversationId}`;
  } else if (data.url) {
    targetUrl = data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 尋找已開啟的視窗
      for (const client of clientList) {
        if (client.url.includes('/maihouses') && 'focus' in client) {
          // 導向目標頁面
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // 沒有已開啟的視窗，開新視窗
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

/**
 * 處理通知關閉事件（可用於統計）
 */
self.addEventListener('notificationclose', (event) => {
  // 可在此處發送統計資料
  // 例如：用戶忽略通知的次數
});

// ============ 訊息處理 ============

/**
 * 與主頁面通訊
 *
 * 支援的訊息類型:
 * - SKIP_WAITING: 立即啟用新版 SW
 * - GET_VERSION: 返回 SW 版本
 */
self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;
  }
});
