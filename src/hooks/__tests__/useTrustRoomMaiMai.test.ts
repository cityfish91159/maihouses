import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows wave on first mount then hides and returns to idle', () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    expect(result.current.maiMaiState.visible).toBe(true);
    expect(result.current.maiMaiState.mood).toBe('wave');

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.maiMaiState.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(30000);
    });
    expect(result.current.maiMaiState.visible).toBe(true);
    expect(result.current.maiMaiState.mood).toBe('idle');
  });

  it('triggers happy and hides after duration', () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerHappy();
    });
    expect(result.current.maiMaiState.mood).toBe('happy');

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.maiMaiState.visible).toBe(false);
  });

  it('triggers celebrate with confetti', () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerCelebrate();
    });
    expect(result.current.maiMaiState.mood).toBe('celebrate');
    expect(result.current.maiMaiState.showConfetti).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.maiMaiState.visible).toBe(false);
  });

  it('keeps shy visible on error until cleared', () => {
    const { result } = renderHook(() => useTrustRoomMaiMai());

    act(() => {
      result.current.triggerError();
    });
    expect(result.current.maiMaiState.mood).toBe('shy');
    expect(result.current.maiMaiState.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.maiMaiState.visible).toBe(true);

    act(() => {
      result.current.clearError();
    });
    expect(result.current.maiMaiState.visible).toBe(false);
  });
});
