import { renderHook, waitFor, act } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_STORAGE_KEY,
  DEMO_STORAGE_SYNC_DEBOUNCE_MS,
  setDemoMode,
  clearDemoMode,
} from '../../lib/pageMode';
import { usePageMode } from '../usePageMode';

const mockUseAuth = vi.fn();

vi.mock('../useAuth', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('usePageMode (#1a)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    mockUseAuth.mockReset();
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('未登入且非 demo 應回傳 visitor', () => {
    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('visitor');
  });

  it('未登入且 demo 有效時應回傳 demo', () => {
    setDemoMode();
    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('demo');
  });

  it('登入時應回傳 live 並清除 demo 狀態', async () => {
    vi.useRealTimers();
    setDemoMode();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
    });

    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('live');

    await waitFor(() => {
      expect(localStorage.getItem(DEMO_STORAGE_KEY)).toBeNull();
    });
  });

  it('跨分頁 StorageEvent 應觸發 re-render 重新計算 mode', () => {
    setDemoMode();
    const { result } = renderHook(() => usePageMode());
    expect(result.current).toBe('demo');

    // 模擬其他分頁清除 demo 狀態
    clearDemoMode();
    act(() => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: DEMO_STORAGE_KEY, newValue: null })
      );
      vi.advanceTimersByTime(DEMO_STORAGE_SYNC_DEBOUNCE_MS + 10);
    });

    expect(result.current).toBe('visitor');
  });
});
