/**
 * MaiHouses Service Worker
 * NOTIFY-2: Web Push 推播通知
 *
 * 處理瀏覽器推播通知的接收與顯示
 */

const SW_VERSION = "maihouses-v1";
const DEFAULT_NOTIFICATION_OPTIONS = {
  badge: "/maihouses/logo-72.png",
  icon: "/maihouses/logo-192.png",
  vibrate: [100, 50, 100],
  requireInteraction: false,
  tag: "maihouses-notification",
};

// ============ 安裝與啟動 ============

self.addEventListener("install", (event) => {
  // 立即啟用新版 Service Worker
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
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
self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload;
  try {
    payload = event.data.json();
  } catch {
    // 無法解析 JSON，使用純文字
    payload = {
      title: "邁邁房屋",
      body: event.data.text() || "您有新的通知",
    };
  }

  const title = payload.title || "邁邁房屋";
  const options = {
    ...DEFAULT_NOTIFICATION_OPTIONS,
    body: payload.body || "有房仲想聯繫您，點擊查看",
    icon: payload.icon || DEFAULT_NOTIFICATION_OPTIONS.icon,
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

function resolveTargetUrl(data) {
  if (data.conversationId) {
    return `/maihouses/chat/${data.conversationId}`;
  }

  if (data.url) {
    try {
      const url = new URL(data.url, self.location.origin);
      if (
        url.origin === self.location.origin &&
        url.pathname.startsWith("/maihouses/")
      ) {
        return `${url.pathname}${url.search}${url.hash}`;
      }
    } catch {
      // fallback to default
    }
  }

  return "/maihouses/";
}

/**
 * 處理通知點擊事件
 * 導向至對應的對話頁面或首頁
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = resolveTargetUrl(data);

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 尋找已開啟的視窗
        for (const client of clientList) {
          if (client.url.includes("/maihouses") && "focus" in client) {
            // 導向目標頁面
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // 沒有已開啟的視窗，開新視窗
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});

/**
 * 處理訂閱過期或撤銷事件
 * 當瀏覽器的 push subscription 過期時，嘗試重新訂閱
 */
self.addEventListener("pushsubscriptionchange", (event) => {
  const resubscribe = async () => {
    try {
      // 取得新的訂閱
      const newSubscription = await self.registration.pushManager.subscribe(
        event.oldSubscription?.options ?? { userVisibleOnly: true },
      );

      // 通知主頁面更新訂閱
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.postMessage({
          type: "SUBSCRIPTION_CHANGED",
          subscription: newSubscription.toJSON(),
        });
      }
    } catch (err) {
      // 重新訂閱失敗，用戶需要手動重新訂閱
      // eslint-disable-next-line no-console
      console.warn("[SW] Failed to resubscribe:", err);
    }
  };

  event.waitUntil(resubscribe());
});

// ============ 訊息處理 ============

/**
 * 與主頁面通訊
 *
 * 支援的訊息類型:
 * - SKIP_WAITING: 立即啟用新版 SW
 * - GET_VERSION: 返回 SW 版本
 */
self.addEventListener("message", (event) => {
  const { type } = event.data || {};

  switch (type) {
    case "SKIP_WAITING":
      self.skipWaiting();
      break;
    case "GET_VERSION":
      event.ports[0]?.postMessage({ version: SW_VERSION });
      break;
  }
});
