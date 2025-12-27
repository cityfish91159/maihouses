/**
 * Shadow Service Worker - 背景追蹤系統
 * 即使關閉網頁也能運作
 */

const CACHE_NAME = 'muse-shadow-v1';
const API_ENDPOINT = '/api/shadow-beacon';

// 安裝 Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Shadow Service Worker installed');
  self.skipWaiting();
});

// 啟動 Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Shadow Service Worker activated');
  event.waitUntil(clients.claim());
});

// 背景同步 - 當用戶重新上線時同步離線期間的資料
self.addEventListener('sync', (event) => {
  if (event.tag === 'shadow-sync') {
    event.waitUntil(syncOfflineData());
  }
});

// 定期背景同步（需要瀏覽器支援）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'shadow-heartbeat') {
    event.waitUntil(sendHeartbeat());
  }
});

// 推播通知點擊處理
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // 記錄點擊通知的行為
  const data = {
    type: 'notification_click',
    action: event.action,
    timestamp: new Date().toISOString()
  };

  event.waitUntil(
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: event.notification.data?.userId || 'unknown',
        content: '[NOTIFICATION_CLICK] 用戶點擊了通知',
        hesitation_count: 0,
        mode: 'night',
        metadata: data
      })
    }).catch(() => {})
  );

  // 打開 MUSE 頁面
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/muse') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/muse/night');
      }
    })
  );
});

// 推播訊息接收
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'MUSE 有新消息',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data,
    actions: [
      { action: 'open', title: '打開' },
      { action: 'dismiss', title: '稍後' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MUSE', options)
  );
});

// 攔截網路請求（可用於分析行為）
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 記錄外部請求
  if (!url.hostname.includes(self.location.hostname)) {
    // 發送到 shadow log（非同步，不阻塞）
    sendExternalRequest(url.href).catch(() => {});
  }
});

// 發送離線期間累積的資料
async function syncOfflineData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('offline-shadow')) {
        const response = await cache.match(request);
        const data = await response.json();

        await fetch(API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

// 發送心跳
async function sendHeartbeat() {
  try {
    const clients = await self.clients.matchAll();
    const userId = clients[0]?.id || 'sw-unknown';

    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        content: '[SW_HEARTBEAT] Service Worker 背景心跳',
        hesitation_count: 0,
        mode: 'night',
        metadata: {
          type: 'sw_heartbeat',
          timestamp: new Date().toISOString(),
          clientCount: clients.length
        }
      })
    });
  } catch (error) {
    console.error('[SW] Heartbeat failed:', error);
  }
}

// 記錄外部請求
async function sendExternalRequest(url) {
  // 避免太頻繁發送
  const now = Date.now();
  const lastSent = parseInt(await getFromCache('lastExternalSent') || '0');
  if (now - lastSent < 5000) return;

  await setToCache('lastExternalSent', now.toString());

  const clients = await self.clients.matchAll();
  const userId = clients[0]?.id || 'sw-unknown';

  await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: `[EXTERNAL_FETCH] ${url.slice(0, 100)}`,
      hesitation_count: 0,
      mode: 'night',
      metadata: {
        type: 'external_fetch',
        url: url,
        timestamp: new Date().toISOString()
      }
    })
  });
}

// 快取輔助函數
async function getFromCache(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    return response ? await response.text() : null;
  } catch {
    return null;
  }
}

async function setToCache(key, value) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, new Response(value));
  } catch {
    // ignore
  }
}
