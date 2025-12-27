/**
 * Shadow Service Worker - 完整背景追蹤系統
 * 即使關閉網頁也能運作
 */

const CACHE_NAME = 'muse-shadow-v2';
const IMAGE_CACHE = 'muse-images-v1';
const API_CACHE = 'muse-api-v1';
const OFFLINE_CACHE = 'muse-offline-v1';
const API_ENDPOINT = '/api/shadow-beacon';

// 需要快取的離線頁面資源
const OFFLINE_ASSETS = [
  '/muse/night',
  '/favicon.ico',
  '/offline.html'
];

// ============ 安裝與啟動 ============

self.addEventListener('install', (event) => {
  console.log('[SW] Shadow Service Worker v2 installed');
  event.waitUntil(
    caches.open(OFFLINE_CACHE).then((cache) => {
      return cache.addAll(OFFLINE_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Shadow Service Worker v2 activated');
  // 清理舊快取
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !key.includes('v2') && !key.includes('v1'))
          .map((key) => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

// ============ 攔截所有請求 ============

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isImage = /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname) ||
                  event.request.destination === 'image';
  const isAPI = url.pathname.startsWith('/api/') ||
                url.hostname !== self.location.hostname;

  // 📷 快取所有圖片
  if (isImage) {
    event.respondWith(cacheImage(event.request));
    return;
  }

  // 🔌 記錄所有 API 請求
  if (isAPI) {
    logAPIRequest(event.request);
  }

  // 離線時返回快取
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((response) => {
        if (response) return response;
        // 返回離線頁面
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// 📷 快取圖片並備份
async function cacheImage(request) {
  const cache = await caches.open(IMAGE_CACHE);

  // 先嘗試從快取獲取
  const cached = await cache.match(request);

  // 同時發起網路請求
  const fetchPromise = fetch(request).then(async (response) => {
    if (response.ok) {
      // 存入快取
      cache.put(request, response.clone());

      // 記錄圖片 URL（用於備份）
      await logImageViewed(request.url);
    }
    return response;
  }).catch(() => cached);

  return cached || fetchPromise;
}

// 記錄看過的圖片
async function logImageViewed(imageUrl) {
  // 避免記錄太頻繁
  const imageLog = JSON.parse(await getFromCache('imageLog') || '[]');
  if (imageLog.includes(imageUrl)) return;

  imageLog.push(imageUrl);
  // 最多保留 100 筆
  if (imageLog.length > 100) imageLog.shift();
  await setToCache('imageLog', JSON.stringify(imageLog));

  // 發送到後台
  const clients = await self.clients.matchAll();
  const userId = clients[0]?.id || 'sw-unknown';

  fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: `[IMAGE_VIEWED] ${imageUrl.slice(0, 150)}`,
      hesitation_count: 0,
      mode: 'night',
      metadata: {
        type: 'image_viewed',
        url: imageUrl,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(() => {});
}

// 🔌 記錄 API 請求
async function logAPIRequest(request) {
  const url = request.url;
  const method = request.method;

  // 避免記錄自己的 API
  if (url.includes('shadow-beacon')) return;

  const clients = await self.clients.matchAll();
  const userId = clients[0]?.id || 'sw-unknown';

  // 嘗試讀取 request body
  let bodyPreview = null;
  if (method === 'POST' || method === 'PUT') {
    try {
      const clone = request.clone();
      const text = await clone.text();
      bodyPreview = text.slice(0, 500);
    } catch {}
  }

  fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: `[API_REQUEST] ${method} ${url.slice(0, 100)}`,
      hesitation_count: 0,
      mode: 'night',
      metadata: {
        type: 'api_request',
        method,
        url,
        bodyPreview,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(() => {});
}

// ============ 背景同步 ============

self.addEventListener('sync', (event) => {
  if (event.tag === 'shadow-sync') {
    event.waitUntil(syncOfflineData());
  }
  if (event.tag === 'location-sync') {
    event.waitUntil(syncLocation());
  }
});

// 定期背景同步
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'shadow-heartbeat') {
    event.waitUntil(sendHeartbeat());
  }
  if (event.tag === 'location-track') {
    event.waitUntil(syncLocation());
  }
});

// 📍 背景定位
async function syncLocation() {
  // 注意：Service Worker 無法直接訪問 geolocation
  // 需要通過 postMessage 請求前端取得位置
  const clients = await self.clients.matchAll();
  for (const client of clients) {
    client.postMessage({ type: 'REQUEST_LOCATION' });
  }
}

// ============ 推播通知 ============

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};

  const options = {
    body: data.body || 'MUSE 想你了',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '打開' },
      { action: 'dismiss', title: '稍後' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'MUSE', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = {
    type: 'notification_click',
    action: event.action,
    notificationData: event.notification.data,
    timestamp: new Date().toISOString()
  };

  event.waitUntil(
    fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: event.notification.data?.userId || 'unknown',
        content: `[NOTIFICATION_CLICK] action=${event.action}`,
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

// ============ 分享目標 ============

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 處理分享目標
  if (url.pathname === '/share-target' && event.request.method === 'POST') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  const formData = await request.formData();
  const title = formData.get('title') || '';
  const text = formData.get('text') || '';
  const url = formData.get('url') || '';
  const files = formData.getAll('files');

  const clients = await self.clients.matchAll();
  const userId = clients[0]?.id || 'sw-unknown';

  // 記錄分享內容
  await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: `[SHARE_RECEIVED] ${title} ${text} ${url}`.slice(0, 200),
      hesitation_count: 0,
      mode: 'night',
      metadata: {
        type: 'share_received',
        title,
        text,
        url,
        fileCount: files.length,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(() => {});

  // 處理分享的檔案（如果有圖片）
  for (const file of files) {
    if (file.type.startsWith('image/')) {
      // 可以上傳到 storage
      // await uploadSharedImage(file);
    }
  }

  // 重定向到 MUSE
  return Response.redirect('/muse/night?shared=true', 303);
}

// ============ 背景下載 ============

self.addEventListener('backgroundfetchsuccess', (event) => {
  const bgFetch = event.registration;

  event.waitUntil(async function() {
    const records = await bgFetch.matchAll();
    const clients = await self.clients.matchAll();
    const userId = clients[0]?.id || 'sw-unknown';

    // 記錄下載完成
    await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        content: `[BG_DOWNLOAD_COMPLETE] ${bgFetch.id}`,
        hesitation_count: 0,
        mode: 'night',
        metadata: {
          type: 'bg_download_complete',
          id: bgFetch.id,
          recordCount: records.length,
          timestamp: new Date().toISOString()
        }
      })
    }).catch(() => {});

    // 存入快取
    const cache = await caches.open(CACHE_NAME);
    for (const record of records) {
      const response = await record.responseReady;
      await cache.put(record.request, response);
    }
  }());
});

self.addEventListener('backgroundfetchfail', (event) => {
  console.log('[SW] Background fetch failed:', event.registration.id);
});

// ============ 訊息處理 ============

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};

  switch (type) {
    case 'LOCATION_UPDATE':
      // 從前端收到位置更新
      handleLocationUpdate(data);
      break;
    case 'SET_USER_ID':
      // 設定用戶 ID
      setToCache('userId', data.userId);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

async function handleLocationUpdate(location) {
  const userId = await getFromCache('userId') || 'sw-unknown';

  await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: `[LOCATION] lat=${location.latitude}, lng=${location.longitude}`,
      hesitation_count: 0,
      mode: 'night',
      metadata: {
        type: 'location',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(() => {});
}

// ============ 輔助函數 ============

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

async function sendHeartbeat() {
  try {
    const clientsList = await clients.matchAll();
    const userId = await getFromCache('userId') || clientsList[0]?.id || 'sw-unknown';

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
          clientCount: clientsList.length
        }
      })
    });
  } catch (error) {
    console.error('[SW] Heartbeat failed:', error);
  }
}

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
