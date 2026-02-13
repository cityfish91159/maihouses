import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearDemoMode,
  DEMO_STORAGE_KEY,
  DEMO_STORAGE_SYNC_DEBOUNCE_MS,
  DEMO_TTL_MS,
  getDemoRemainingMinutes,
  getDemoTimeRemaining,
  isDemoMode,
  readDemoTimestamp,
  reloadPage,
  resolvePageMode,
  setDemoMode,
  subscribeDemoModeStorageSync,
} from '../pageMode';

describe('pageMode utils (#1a)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('setDemoMode 後應可讀取 timestamp，且模式為 demo', () => {
    const now = new Date('2026-02-12T10:00:00.000Z').getTime();
    vi.setSystemTime(now);

    setDemoMode(now);

    expect(readDemoTimestamp()).toBe(now);
    expect(isDemoMode()).toBe(true);
    expect(resolvePageMode(false)).toBe('demo');
  });

  it('登入優先級高於 demo 狀態，應回傳 live', () => {
    setDemoMode();
    expect(resolvePageMode(true)).toBe('live');
  });

  it('demo 過期後應回傳 visitor', () => {
    const now = new Date('2026-02-12T10:00:00.000Z').getTime();
    vi.setSystemTime(now);
    setDemoMode(now);

    vi.setSystemTime(now + DEMO_TTL_MS + 1);

    expect(isDemoMode()).toBe(false);
    expect(resolvePageMode(false)).toBe('visitor');
    expect(getDemoTimeRemaining()).toBe(0);
  });

  it('readDemoTimestamp 應清理損壞的 localStorage 資料', () => {
    localStorage.setItem(DEMO_STORAGE_KEY, '{invalid-json');

    expect(readDemoTimestamp()).toBeNull();
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  it('subscribeDemoModeStorageSync 應只監聽 demo key 並 debounce 回調', () => {
    const onSync = vi.fn();
    const unsubscribe = subscribeDemoModeStorageSync(onSync);

    window.dispatchEvent(new StorageEvent('storage', { key: 'other-key', newValue: '1' }));
    vi.advanceTimersByTime(DEMO_STORAGE_SYNC_DEBOUNCE_MS + 10);
    expect(onSync).not.toHaveBeenCalled();

    window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: '{}' }));
    vi.advanceTimersByTime(DEMO_STORAGE_SYNC_DEBOUNCE_MS - 1);
    expect(onSync).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSync).toHaveBeenCalledTimes(1);

    unsubscribe();
  });

  it('clearDemoMode 應移除 demo storage', () => {
    setDemoMode();
    clearDemoMode();
    expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
  });

  describe('getDemoRemainingMinutes 邊界值', () => {
    it('remaining = 0 → 回傳 0', () => {
      expect(getDemoRemainingMinutes(Date.now())).toBe(0);
    });

    it('remaining = 1ms → 回傳 1（無條件進位）', () => {
      const now = new Date('2026-02-12T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      setDemoMode(now);

      const almostExpired = now + DEMO_TTL_MS - 1;
      expect(getDemoRemainingMinutes(almostExpired)).toBe(1);
    });

    it('remaining = 59999ms → 回傳 1', () => {
      const now = new Date('2026-02-12T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      setDemoMode(now);

      const target = now + DEMO_TTL_MS - 59_999;
      expect(getDemoRemainingMinutes(target)).toBe(1);
    });

    it('remaining = 60001ms → 回傳 2', () => {
      const now = new Date('2026-02-12T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      setDemoMode(now);

      const target = now + DEMO_TTL_MS - 60_001;
      expect(getDemoRemainingMinutes(target)).toBe(2);
    });

    it('remaining = 60000ms → 回傳 1', () => {
      const now = new Date('2026-02-12T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      setDemoMode(now);

      const target = now + DEMO_TTL_MS - 60_000;
      expect(getDemoRemainingMinutes(target)).toBe(1);
    });
  });

  describe('resolvePageMode now 參數注入', () => {
    it('透過 now 參數可控制 demo 判斷', () => {
      const now = new Date('2026-02-12T10:00:00.000Z').getTime();
      setDemoMode(now);

      expect(resolvePageMode(false, now)).toBe('demo');
      expect(resolvePageMode(false, now + DEMO_TTL_MS + 1)).toBe('visitor');
    });
  });

  describe('reloadPage SSR 安全', () => {
    it('在 browser 環境呼叫不拋錯', () => {
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { ...window.location, reload: reloadMock },
        writable: true,
        configurable: true,
      });

      expect(() => reloadPage()).not.toThrow();
      expect(reloadMock).toHaveBeenCalledTimes(1);
    });
  });
});
