import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockUsePrefersReducedMotion = vi.fn<() => boolean>();

vi.mock('../../../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => mockUsePrefersReducedMotion(),
}));

import { useAnimatedNumber } from './useAnimatedNumber';

describe('useAnimatedNumber', () => {
  let requestAnimationFrameSpy: ReturnType<typeof vi.fn>;
  let cancelAnimationFrameSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    mockUsePrefersReducedMotion.mockReset();
    mockUsePrefersReducedMotion.mockReturnValue(false);

    requestAnimationFrameSpy = vi.fn((callback: FrameRequestCallback) => {
      return setTimeout(() => callback(Date.now()), 16) as unknown as number;
    });
    cancelAnimationFrameSpy = vi.fn((id: number) => {
      clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
    });

    vi.stubGlobal('requestAnimationFrame', requestAnimationFrameSpy);
    vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrameSpy);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('animates from 0 to target value in normal flow', () => {
    const { result } = renderHook(() => useAnimatedNumber(12, { durationMs: 100 }));

    expect(result.current).toBe(0);

    act(() => {
      vi.advanceTimersByTime(32);
    });
    expect(result.current).toBeGreaterThan(0);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(12);
  });

  it('returns target immediately when prefersReducedMotion is true', () => {
    mockUsePrefersReducedMotion.mockReturnValue(true);
    const { result } = renderHook(() => useAnimatedNumber(12, { durationMs: 100 }));

    expect(result.current).toBe(12);
  });

  it('normalizes negative input to 0', () => {
    const { result } = renderHook(() => useAnimatedNumber(-5, { durationMs: 100 }));

    expect(result.current).toBe(0);
  });

  it('normalizes NaN and Infinity input to 0', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, { durationMs: 100 }),
      { initialProps: { target: Number.NaN } }
    );

    expect(result.current).toBe(0);

    rerender({ target: Number.POSITIVE_INFINITY });
    expect(result.current).toBe(0);
  });

  it('re-animates when target value changes', () => {
    const { result, rerender } = renderHook(
      ({ target }) => useAnimatedNumber(target, { durationMs: 100 }),
      { initialProps: { target: 5 } }
    );

    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(result.current).toBe(5);

    rerender({ target: 9 });

    act(() => {
      vi.advanceTimersByTime(32);
    });
    expect(result.current).toBeGreaterThan(5);

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe(9);
  });

  it('cancels requestAnimationFrame on cleanup', () => {
    const { unmount } = renderHook(() => useAnimatedNumber(12, { durationMs: 500 }));

    expect(requestAnimationFrameSpy).toHaveBeenCalled();

    unmount();

    expect(cancelAnimationFrameSpy).toHaveBeenCalled();
  });
});
