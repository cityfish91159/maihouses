import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  useConsumerSession,
  getSessionId,
  setSession,
  clearSession,
  isSessionExpired,
} from '../useConsumerSession';

describe('useConsumerSession', () => {
  const SESSION_KEY = 'uag_session';
  const SESSION_CREATED_KEY = 'uag_session_created';

  beforeEach(() => {
    // 清除 localStorage
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('SSR 安全', () => {
    it('在沒有 window 時應該返回 null', () => {
      try {
        vi.stubGlobal('window', undefined);
        expect(typeof window).toBe('undefined');
        expect(getSessionId()).toBe(null);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe('基本功能', () => {
    it('沒有 session 時應該返回 null', () => {
      const { result } = renderHook(() => useConsumerSession());

      expect(result.current.sessionId).toBe(null);
      expect(result.current.hasValidSession).toBe(false);
      expect(result.current.isExpired).toBe(false);
    });

    it('有 session 時應該返回正確值', () => {
      localStorage.setItem(SESSION_KEY, 'test-session-123');
      localStorage.setItem(SESSION_CREATED_KEY, String(Date.now()));

      const { result } = renderHook(() => useConsumerSession());

      expect(result.current.sessionId).toBe('test-session-123');
      expect(result.current.hasValidSession).toBe(true);
      expect(result.current.isExpired).toBe(false);
    });

    it('setSession 應該正確設置 session', () => {
      const { result } = renderHook(() => useConsumerSession());

      act(() => {
        result.current.setSession('new-session-456');
      });

      expect(localStorage.getItem(SESSION_KEY)).toBe('new-session-456');
      expect(localStorage.getItem(SESSION_CREATED_KEY)).not.toBe(null);
    });

    it('clearSession 應該清除 session', () => {
      localStorage.setItem(SESSION_KEY, 'test-session');
      localStorage.setItem(SESSION_CREATED_KEY, String(Date.now()));

      const { result } = renderHook(() => useConsumerSession());

      act(() => {
        result.current.clearSession();
      });

      expect(localStorage.getItem(SESSION_KEY)).toBe(null);
      expect(localStorage.getItem(SESSION_CREATED_KEY)).toBe(null);
    });
  });

  describe('過期檢查', () => {
    it('7 天內的 session 不應該過期', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      localStorage.setItem(SESSION_KEY, 'test-session');
      localStorage.setItem(SESSION_CREATED_KEY, String(now));

      // 前進 6 天
      vi.setSystemTime(now + 6 * 24 * 60 * 60 * 1000);

      expect(isSessionExpired()).toBe(false);
    });

    it('超過 7 天的 session 應該過期', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      localStorage.setItem(SESSION_KEY, 'test-session');
      localStorage.setItem(SESSION_CREATED_KEY, String(now));

      // 前進 8 天
      vi.setSystemTime(now + 8 * 24 * 60 * 60 * 1000);

      expect(isSessionExpired()).toBe(true);
    });

    it('沒有建立時間記錄時應該視為過期', () => {
      localStorage.setItem(SESSION_KEY, 'old-session');
      // 沒有設置 SESSION_CREATED_KEY

      expect(isSessionExpired()).toBe(true);
    });

    it('過期的 session 應該 hasValidSession = false', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      localStorage.setItem(SESSION_KEY, 'test-session');
      localStorage.setItem(SESSION_CREATED_KEY, String(now));

      // 前進 8 天
      vi.setSystemTime(now + 8 * 24 * 60 * 60 * 1000);

      const { result } = renderHook(() => useConsumerSession());

      expect(result.current.sessionId).toBe('test-session');
      expect(result.current.isExpired).toBe(true);
      expect(result.current.hasValidSession).toBe(false);
    });

    it('hook 在長時間停留後應重新同步過期狀態', () => {
      const now = Date.now();
      vi.setSystemTime(now);

      localStorage.setItem(SESSION_KEY, 'test-session');
      localStorage.setItem(SESSION_CREATED_KEY, String(now));

      const { result } = renderHook(() => useConsumerSession());
      expect(result.current.hasValidSession).toBe(true);

      vi.setSystemTime(now + 8 * 24 * 60 * 60 * 1000);
      act(() => {
        vi.advanceTimersByTime(60 * 1000);
      });

      expect(result.current.isExpired).toBe(true);
      expect(result.current.hasValidSession).toBe(false);
    });
  });

  describe('邊界情況', () => {
    it('setSession 不應該覆蓋已有的建立時間', () => {
      const now = new Date('2026-02-21T10:00:00.000Z').getTime();
      vi.setSystemTime(now);
      const originalTime = now - 1000;
      localStorage.setItem(SESSION_CREATED_KEY, String(originalTime));

      setSession('new-session');

      expect(localStorage.getItem(SESSION_CREATED_KEY)).toBe(String(originalTime));
    });

    it('setSession 遇到已過期建立時間時應重設 timestamp', () => {
      const now = new Date('2026-02-21T10:00:00.000Z').getTime();
      const expiredTimestamp = now - 8 * 24 * 60 * 60 * 1000;

      localStorage.setItem(SESSION_CREATED_KEY, String(expiredTimestamp));
      vi.setSystemTime(now);
      setSession('new-session');

      expect(localStorage.getItem(SESSION_CREATED_KEY)).toBe(String(now));
    });

    it('localStorage 錯誤時應該優雅處理', () => {
      // 模擬 localStorage 拋出錯誤
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      expect(getSessionId()).toBe(null);

      localStorage.getItem = originalGetItem;
    });
  });
});
