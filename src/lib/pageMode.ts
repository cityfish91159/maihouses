import { z } from 'zod';
import { safeLocalStorage } from './safeStorage';

export type PageMode = 'visitor' | 'demo' | 'live';

export const DEMO_STORAGE_KEY = 'mai-demo-verified';
export const DEMO_TTL_MS = 2 * 60 * 60 * 1000; // 2 小時
export const DEMO_WARN_BEFORE_MS = 5 * 60 * 1000; // 5 分鐘
export const DEMO_STORAGE_SYNC_DEBOUNCE_MS = 120;

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
