import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_STORAGE_KEY,
  DEMO_STORAGE_SYNC_DEBOUNCE_MS,
  resolvePageMode,
  setDemoMode,
  clearDemoMode,
} from '../../lib/pageMode';
import { ROUTES } from '../../constants/routes';
import { usePageMode } from '../usePageMode';

const mockUseAuth = vi.fn();

vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('usePageMode (#1a)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    delete window.__DEMO_EXPIRING;
    Object.defineProperty(window, 'location', {
      value: { ...window.location, replace: vi.fn() },
      writable: true,
      configurable: true,
    });
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('未登入且非 demo 應回傳 visitor', () => {
    const queryClient = new QueryClient();
    const { result } = renderHook(() => usePageMode(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe('visitor');
  });

  it('未登入且 demo 有效時應回傳 demo', () => {
    const queryClient = new QueryClient();
    setDemoMode();
    const { result } = renderHook(() => usePageMode(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe('demo');
  });

  it('登入時應回傳 live、清除 demo 狀態與 query cache', async () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');
    vi.useRealTimers();
    setDemoMode();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePageMode(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe('live');

    await waitFor(() => {
      expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
    });
    expect(clearSpy).toHaveBeenCalledTimes(1);
  });

  it('跨分頁 StorageEvent：demo -> visitor 時應清 cache 並 replace 首頁', () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    setDemoMode();
    const { result } = renderHook(() => usePageMode(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe('demo');

    // 模擬其他分頁清除 demo 狀態
    clearDemoMode();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: null }));
      vi.advanceTimersByTime(DEMO_STORAGE_SYNC_DEBOUNCE_MS + 10);
    });

    expect(clearSpy).toHaveBeenCalledTimes(1);
    expect(window.location.replace).toHaveBeenCalledWith(ROUTES.HOME);
  });

  it('SSR 環境（window=undefined）resolvePageMode 不應拋錯', () => {
    try {
      vi.stubGlobal('window', undefined);
      expect(() => resolvePageMode(false)).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('跨分頁同步時若已進入 expiring 狀態，不應重複觸發退出流程', () => {
    const queryClient = new QueryClient();
    const clearSpy = vi.spyOn(queryClient, 'clear');

    setDemoMode();
    const { result } = renderHook(() => usePageMode(), {
      wrapper: createWrapper(queryClient),
    });
    expect(result.current).toBe('demo');

    window.__DEMO_EXPIRING = true;
    clearDemoMode();
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: null }));
      vi.advanceTimersByTime(DEMO_STORAGE_SYNC_DEBOUNCE_MS + 10);
    });

    expect(clearSpy).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });
});
