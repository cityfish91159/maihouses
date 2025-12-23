import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMaiMaiMood, useMascotCelebrateEvent } from '../useMaiMaiMood';

describe('useMaiMaiMood', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================
  // 優先級測試
  // ============================================
  describe('優先級順序', () => {
    it('externalMood 優先於所有其他狀態', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          externalMood: 'sleep',
          isSuccess: true,      // 應該被覆蓋
          hasError: true,       // 應該被覆蓋
          isLoading: true,      // 應該被覆蓋
          isHovered: true,      // 應該被覆蓋
        })
      );

      expect(result.current.mood).toBe('sleep');
    });

    it('isCelebrating 優先於 isSuccess', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isCelebrating: true,
          isSuccess: true,
        })
      );

      // 兩者都觸發 celebrate，但 isCelebrating 在優先級順序中先判斷
      expect(result.current.mood).toBe('celebrate');
    });

    it('isSuccess 觸發 celebrate 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isSuccess: true,
        })
      );

      expect(result.current.mood).toBe('celebrate');
    });

    it('hasError 觸發 shy 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          hasError: true,
        })
      );

      expect(result.current.mood).toBe('shy');
    });

    it('isLoading 觸發 thinking 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isLoading: true,
        })
      );

      expect(result.current.mood).toBe('thinking');
    });

    it('isTypingPassword 觸發 peek 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isTypingPassword: true,
        })
      );

      expect(result.current.mood).toBe('peek');
    });

    it('isTypingEmail 觸發 happy 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isTypingEmail: true,
        })
      );

      expect(result.current.mood).toBe('happy');
    });

    it('isHovered 觸發 wave 心情', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isHovered: true,
        })
      );

      expect(result.current.mood).toBe('wave');
    });

    it('預設返回 idle', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      expect(result.current.mood).toBe('idle');
    });

    it('空選項時預設返回 idle', () => {
      const { result } = renderHook(() => useMaiMaiMood({}));

      expect(result.current.mood).toBe('idle');
    });
  });

  // ============================================
  // 優先級覆蓋測試
  // ============================================
  describe('優先級覆蓋', () => {
    it('hasError 優先於 isLoading', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          hasError: true,
          isLoading: true,
        })
      );

      expect(result.current.mood).toBe('shy');
    });

    it('isLoading 優先於 isTypingPassword', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isLoading: true,
          isTypingPassword: true,
        })
      );

      expect(result.current.mood).toBe('thinking');
    });

    it('isTypingPassword 優先於 isTypingEmail', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isTypingPassword: true,
          isTypingEmail: true,
        })
      );

      expect(result.current.mood).toBe('peek');
    });

    it('isTypingEmail 優先於 isHovered', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isTypingEmail: true,
          isHovered: true,
        })
      );

      expect(result.current.mood).toBe('happy');
    });
  });

  // ============================================
  // 點擊 5 次測試
  // ============================================
  describe('點擊慶祝機制', () => {
    it('初始 clickCount 為 0', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      expect(result.current.clickCount).toBe(0);
    });

    it('點擊增加 clickCount', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      act(() => {
        result.current.handleClick();
      });

      expect(result.current.clickCount).toBe(1);
    });

    it('點擊 4 次不觸發 celebrate', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      act(() => {
        for (let i = 0; i < 4; i++) {
          result.current.handleClick();
        }
      });

      expect(result.current.clickCount).toBe(4);
      expect(result.current.mood).toBe('idle');
    });

    it('點擊 5 次後 mood 變為 celebrate', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.handleClick();
        }
      });

      expect(result.current.clickCount).toBe(5);
      expect(result.current.mood).toBe('celebrate');
    });

    it('celebrate 狀態 2 秒後自動重置', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      // 點擊 5 次觸發慶祝
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.handleClick();
        }
      });

      expect(result.current.mood).toBe('celebrate');
      expect(result.current.clickCount).toBe(5);

      // 快轉 2 秒
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.mood).toBe('idle');
      expect(result.current.clickCount).toBe(0);
    });

    it('resetCelebration 立即重置狀態', () => {
      const { result } = renderHook(() => useMaiMaiMood());

      // 點擊 5 次觸發慶祝
      act(() => {
        for (let i = 0; i < 5; i++) {
          result.current.handleClick();
        }
      });

      expect(result.current.mood).toBe('celebrate');

      // 手動重置
      act(() => {
        result.current.resetCelebration();
      });

      expect(result.current.mood).toBe('idle');
      expect(result.current.clickCount).toBe(0);
    });
  });

  // ============================================
  // 外部慶祝狀態測試
  // ============================================
  describe('外部慶祝狀態', () => {
    it('外部 isCelebrating 觸發 celebrate', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isCelebrating: true,
        })
      );

      expect(result.current.mood).toBe('celebrate');
    });

    it('外部 isCelebrating 為 false 時不影響其他狀態', () => {
      const { result } = renderHook(() =>
        useMaiMaiMood({
          isCelebrating: false,
          isHovered: true,
        })
      );

      expect(result.current.mood).toBe('wave');
    });
  });
});

// ============================================
// useMascotCelebrateEvent 測試
// ============================================
describe('useMascotCelebrateEvent', () => {
  it('監聽 mascot:celebrate 事件', () => {
    const callback = vi.fn();

    renderHook(() => useMascotCelebrateEvent(callback));

    // 觸發事件
    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('多次觸發事件多次呼叫 callback', () => {
    const callback = vi.fn();

    renderHook(() => useMascotCelebrateEvent(callback));

    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });

    expect(callback).toHaveBeenCalledTimes(3);
  });

  it('unmount 後不再監聽', () => {
    const callback = vi.fn();

    const { unmount } = renderHook(() => useMascotCelebrateEvent(callback));

    // unmount
    unmount();

    // 觸發事件
    act(() => {
      window.dispatchEvent(new CustomEvent('mascot:celebrate'));
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
