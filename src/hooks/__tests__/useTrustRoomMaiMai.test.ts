import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrustRoomMaiMai } from '../useTrustRoomMaiMai';

describe('useTrustRoomMaiMai', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('初始化時顯示 wave 招呼動畫', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    await act(async () => {});

    expect(result.current.maiMaiState.visible).toBe(true);
    expect(result.current.maiMaiState.mood).toBe('wave');
    expect(result.current.maiMaiState.showConfetti).toBe(false);
  });

  it('wave 動畫在 3 秒後自動隱藏', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    await act(async () => {});
    expect(result.current.maiMaiState.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.maiMaiState.visible).toBe(false);
  });

  it('triggerWave 觸發揮手招呼', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    act(() => {
      result.current.triggerWave();
    });

    await act(async () => {});

    expect(result.current.maiMaiState.visible).toBe(true);
    expect(result.current.maiMaiState.mood).toBe('wave');
  });

  it('triggerHappy 觸發開心提示', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerHappy();
    });

    await act(async () => {});
    expect(result.current.maiMaiState.mood).toBe('happy');
  });

  it('triggerCelebrate 顯示 confetti', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerCelebrate();
    });

    await act(async () => {});
    expect(result.current.maiMaiState.showConfetti).toBe(true);
  });

  it('triggerShyOnce 觸發羞澀提示', async () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerShyOnce();
    });

    await act(async () => {});
    expect(result.current.maiMaiState.mood).toBe('shy');
    expect(result.current.maiMaiState.visible).toBe(true);
  });

  it('卸載時會清除計時器', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useTrustRoomMaiMai());

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});
