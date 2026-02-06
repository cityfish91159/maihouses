import { renderHook, act } from '@testing-library/react';
import { useMaiMaiMood, useMascotCelebrateEvent } from '../useMaiMaiMood';
import type { UseMaiMaiMoodOptions } from '../types';

describe('useMaiMaiMood', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // 優先級鏈完整測試 (從高到低)
  // ============================================
  describe('優先級鏈', () => {
    it('externalMood 壓過所有狀態', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          externalMood: 'sleep',
          isSuccess: true,
          hasError: true,
          isLoading: true,
          isTypingPassword: true,
          isTypingEmail: true,
          isHovered: true,
          isCelebrating: true,
        })
      );
      expect(result.current.mood).toBe('sleep');
    });

    it('internalCelebrating (點5次) 後重置仍保留 isSuccess', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isSuccess: true }));
      expect(result.current.mood).toBe('celebrate');

      act(() => {
        for (let i = 0; i < 5; i++) result.current.handleClick();
      });

      act(() => result.current.resetCelebration());
      expect(result.current.mood).toBe('celebrate'); // isSuccess 還在
    });

    it('isSuccess 壓過 hasError', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isSuccess: true, hasError: true }));
      expect(result.current.mood).toBe('celebrate');
    });

    it('hasError 壓過 isLoading', () => {
      const { result } = renderHook(() => useMaiMaiMood({ hasError: true, isLoading: true }));
      expect(result.current.mood).toBe('shy');
    });

    it('isLoading 壓過 isTypingPassword', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({ isLoading: true, isTypingPassword: true })
      );
      expect(result.current.mood).toBe('thinking');
    });

    it('isTypingPassword 壓過 isTypingEmail', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({ isTypingPassword: true, isTypingEmail: true })
      );
      expect(result.current.mood).toBe('peek');
    });

    it('isTypingEmail 壓過 isHovered', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isTypingEmail: true, isHovered: true }));
      expect(result.current.mood).toBe('happy');
    });

    it('isHovered 壓過 idle', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isHovered: true }));
      expect(result.current.mood).toBe('wave');
    });

    it('無任何狀態時返回 idle', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      expect(result.current.mood).toBe('idle');
    });
  });

  // ============================================
  // 點擊慶祝機制 - 邊界測試
  // ============================================
  describe('點擊慶祝機制', () => {
    it('點擊 4 次不觸發', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      act(() => {
        for (let i = 0; i < 4; i++) result.current.handleClick();
      });
      expect(result.current.mood).toBe('idle');
      expect(result.current.clickCount).toBe(4);
    });

    it('點擊 5 次觸發 celebrate', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      act(() => {
        for (let i = 0; i < 5; i++) result.current.handleClick();
      });
      expect(result.current.mood).toBe('celebrate');
    });

    it('點擊 6+ 次 clickCount 繼續累加', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      act(() => {
        for (let i = 0; i < 10; i++) result.current.handleClick();
      });
      expect(result.current.mood).toBe('celebrate');
      expect(result.current.clickCount).toBe(10);
    });

    it('1999ms 時仍為 celebrate，2000ms 時重置', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      act(() => {
        for (let i = 0; i < 5; i++) result.current.handleClick();
      });

      act(() => vi.advanceTimersByTime(1999));
      expect(result.current.mood).toBe('celebrate');

      act(() => vi.advanceTimersByTime(1));
      expect(result.current.mood).toBe('idle');
      expect(result.current.clickCount).toBe(0);
    });

    it('resetCelebration 立即重置', () => {
      const { result } = renderHook(() => useMaiMaiMood());
      act(() => {
        for (let i = 0; i < 5; i++) result.current.handleClick();
      });
      act(() => result.current.resetCelebration());
      expect(result.current.mood).toBe('idle');
      expect(result.current.clickCount).toBe(0);
    });
  });

  // ============================================
  // Rerender 狀態轉換測試
  // ============================================
  describe('狀態轉換 (rerender)', () => {
    it('loading → success 正確轉換', () => {
      const { result, rerender } = renderHook((props) => useMaiMaiMood(props), {
        initialProps: { isLoading: true, isSuccess: false },
      });
      expect(result.current.mood).toBe('thinking');

      rerender({ isLoading: false, isSuccess: true });
      expect(result.current.mood).toBe('celebrate');
    });

    it('success → error 正確轉換', () => {
      const { result, rerender } = renderHook((props) => useMaiMaiMood(props), {
        initialProps: { isSuccess: true, hasError: false },
      });
      expect(result.current.mood).toBe('celebrate');

      rerender({ isSuccess: false, hasError: true });
      expect(result.current.mood).toBe('shy');
    });

    it('externalMood 動態切換', () => {
      const { result, rerender } = renderHook(
        (props: UseMaiMaiMoodOptions) => useMaiMaiMood(props),
        { initialProps: { externalMood: 'happy' } as UseMaiMaiMoodOptions }
      );
      expect(result.current.mood).toBe('happy');

      rerender({ externalMood: 'thinking' });
      expect(result.current.mood).toBe('thinking');

      rerender({ externalMood: undefined });
      expect(result.current.mood).toBe('idle');
    });

    it('hover 進出正確轉換', () => {
      const { result, rerender } = renderHook((props) => useMaiMaiMood(props), {
        initialProps: { isHovered: false },
      });
      expect(result.current.mood).toBe('idle');

      rerender({ isHovered: true });
      expect(result.current.mood).toBe('wave');

      rerender({ isHovered: false });
      expect(result.current.mood).toBe('idle');
    });
  });

  // ============================================
  // 外部 isCelebrating 測試
  // ============================================
  describe('外部 isCelebrating', () => {
    it('外部觸發不影響 clickCount', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isCelebrating: true }));
      expect(result.current.mood).toBe('celebrate');
      expect(result.current.clickCount).toBe(0);
    });

    it('外部 false 時內部點擊仍可觸發', () => {
      const { result } = renderHook(() => useMaiMaiMood({ isCelebrating: false }));

      act(() => {
        for (let i = 0; i < 5; i++) result.current.handleClick();
      });

      expect(result.current.mood).toBe('celebrate');
    });
  });
});

// ============================================
// useMascotCelebrateEvent
// ============================================
describe('useMascotCelebrateEvent', () => {
  it('監聽 mascot:celebrate 事件', () => {
    const callback = vi.fn();
    renderHook(() => useMascotCelebrateEvent(callback));

    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('unmount 後不再監聯', () => {
    const callback = vi.fn();
    const { unmount } = renderHook(() => useMascotCelebrateEvent(callback));

    unmount();

    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('callback 變化時重新綁定', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    const { rerender } = renderHook(({ cb }) => useMascotCelebrateEvent(cb), {
      initialProps: { cb: callback1 },
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });
    expect(callback1).toHaveBeenCalledTimes(1);

    rerender({ cb: callback2 });

    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });
    expect(callback2).toHaveBeenCalledTimes(1);
  });
});
