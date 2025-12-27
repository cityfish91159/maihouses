/**
 * Shadow Service Worker - 精簡版
 * 只保留必要功能
 */

const CACHE_NAME = 'muse-shadow-v3';
const API_ENDPOINT = '/api/shadow-beacon';

// ============ 安裝與啟動 ============

self.addEventListener('install', (event) => {
  console.log('[SW] Shadow Service Worker v3 installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Shadow Service Worker v3 activated');
  event.waitUntil(clients.claim());
});

// ============ 離線處理 ============

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/offline.html');
      })
    );
  }
});

// ============ 背景同步 ============

self.addEventListener('sync', (event) => {
  if (event.tag === 'shadow-sync') {
    event.waitUntil(syncOfflineData());
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'shadow-heartbeat') {
    event.waitUntil(sendHeartbeat());
  }
});

// ============ 推播通知 ============

self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'MUSE 想你了',
    icon: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: data,
    requireInteraction: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'MUSE', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
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

// ============ 訊息處理 ============

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  switch (type) {
    case 'LOCATION_UPDATE':
      handleLocationUpdate(data);
      break;
    case 'SET_USER_ID':
      setToCache('userId', data.userId);
      break;
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// ============ 輔助函數 ============

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
        signal_type: 'system',
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: new Date().toISOString()
      }
    })
  }).catch(() => {});
}

async function syncOfflineData() {
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
      }).catch(() => {});
      await cache.delete(request);
    }
  }
}

async function sendHeartbeat() {
  const userId = await getFromCache('userId') || 'sw-unknown';
  await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      content: '[SW_HEARTBEAT]',
      hesitation_count: 0,
      mode: 'night',
      metadata: { type: 'sw_heartbeat', signal_type: 'system', timestamp: new Date().toISOString() }
    })
  }).catch(() => {});
}

async function getFromCache(key) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    return response ? await response.text() : null;
  } catch { return null; }
}

async function setToCache(key, value) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(key, new Response(value));
  } catch {}
}
