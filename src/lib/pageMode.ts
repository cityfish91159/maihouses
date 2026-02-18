import { z } from 'zod';
import { safeLocalStorage } from './safeStorage';
import { safeSessionStorage } from './safeStorage';
import { ROUTES } from '../constants/routes';

export type PageMode = 'visitor' | 'demo' | 'live';

export const DEMO_STORAGE_KEY = 'mai-demo-verified';
export const DEMO_TTL_MS = 2 * 60 * 60 * 1000; // 2 小時
export const DEMO_WARN_BEFORE_MS = 5 * 60 * 1000; // 5 分鐘
export const DEMO_STORAGE_SYNC_DEBOUNCE_MS = 120;
export const DEMO_UAG_MODE_STORAGE_KEY = 'mai-uag-mode';
export const FEED_DEMO_ROLE_STORAGE_KEY = 'feed-demo-role';

interface QueryClientLike {
  clear: () => void;
}

declare global {
  interface Window {
    __DEMO_EXPIRING?: boolean;
  }
}

const DemoStorageSchema = z.object({
  t: z.number().finite().positive(),
});

const parseDemoTimestamp = (raw: string | null): number | null => {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    const validated = DemoStorageSchema.safeParse(parsed);
    return validated.success ? validated.data.t : null;
  } catch {
    return null;
  }
};

export function readDemoTimestamp(): number | null {
  const raw = safeLocalStorage.getItem(DEMO_STORAGE_KEY);
  if (raw === null) {
    return null;
  }

  const timestamp = parseDemoTimestamp(raw);
  if (timestamp !== null) {
    return timestamp;
  }

  // 防禦：清除損壞資料，避免每次重複解析失敗
  safeLocalStorage.removeItem(DEMO_STORAGE_KEY);
  return null;
}

/**
 * 寫入演示模式時間戳
 * @returns true 寫入成功，false 寫入失敗（iOS 私隱模式配額超限）
 */
export function setDemoMode(timestamp = Date.now()): boolean {
  const payload = JSON.stringify({ t: timestamp });
  safeLocalStorage.setItem(DEMO_STORAGE_KEY, payload);
  // 回讀驗證：防止 iOS 私隱模式靜默失敗
  const readBack = safeLocalStorage.getItem(DEMO_STORAGE_KEY);
  return readBack === payload;
}

export function clearDemoMode(): void {
  safeLocalStorage.removeItem(DEMO_STORAGE_KEY);
}

/**
 * 清理 demo 相關快取與 storage 殘留（不導頁）
 * 順序：先清 query cache，再清 storage，避免 race condition。
 */
export function clearDemoArtifacts(queryClient: QueryClientLike): void {
  queryClient.clear();
  clearDemoMode();
  safeLocalStorage.removeItem(DEMO_UAG_MODE_STORAGE_KEY);
  safeSessionStorage.removeItem(FEED_DEMO_ROLE_STORAGE_KEY);
}

/**
 * 完整退出 demo：清理殘留後導回首頁（replace 避免返回鍵回失效頁）。
 */
export function exitDemoMode(queryClient: QueryClientLike): void {
  clearDemoArtifacts(queryClient);

  if (typeof window === 'undefined') {
    return;
  }

  window.__DEMO_EXPIRING = true;
  window.location.replace(ROUTES.HOME);
}

export function getDemoTimeRemaining(now = Date.now()): number {
  const timestamp = readDemoTimestamp();
  if (timestamp === null) return 0;
  return Math.max(0, DEMO_TTL_MS - (now - timestamp));
}

export function getDemoRemainingMinutes(now = Date.now()): number {
  const remaining = getDemoTimeRemaining(now);
  return Math.max(0, Math.ceil(remaining / (60 * 1000)));
}

export function isDemoMode(now = Date.now()): boolean {
  return getDemoTimeRemaining(now) > 0;
}

export function resolvePageMode(isAuthenticated: boolean, now = Date.now()): PageMode {
  if (isAuthenticated) return 'live';
  if (isDemoMode(now)) return 'demo';
  return 'visitor';
}

export function subscribeDemoModeStorageSync(onSync: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  let reloadTimer: ReturnType<typeof setTimeout> | null = null;

  const handler = (event: StorageEvent) => {
    if (event.key !== DEMO_STORAGE_KEY) return;

    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }

    reloadTimer = setTimeout(() => {
      onSync();
    }, DEMO_STORAGE_SYNC_DEBOUNCE_MS);
  };

  // iOS Safari 背景回前景時 StorageEvent 不一定觸發
  // 用 visibilitychange 作為補充：回前景時主動重算
  const visibilityHandler = () => {
    if (document.visibilityState === 'visible') {
      onSync();
    }
  };

  window.addEventListener('storage', handler);
  document.addEventListener('visibilitychange', visibilityHandler);

  return () => {
    if (reloadTimer) {
      clearTimeout(reloadTimer);
    }
    window.removeEventListener('storage', handler);
    document.removeEventListener('visibilitychange', visibilityHandler);
  };
}

export function reloadPage(): void {
  if (typeof window === 'undefined') return;
  window.location.reload();
}
