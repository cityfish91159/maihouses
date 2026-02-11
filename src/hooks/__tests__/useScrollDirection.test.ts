import { renderHook, waitFor, act } from '@testing-library/react';
import { useScrollDirection } from '../useScrollDirection';

describe('useScrollDirection - 功能測試', () => {
  let scrollYValue = 0;

  beforeEach(() => {
    scrollYValue = 0;
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollYValue,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('案例 5-8: Hook 基礎功能', () => {
    it('案例 5: 初始狀態為 up', () => {
      const { result } = renderHook(() => useScrollDirection(10));
      expect(result.current).toBe('up');
    });

    it('案例 6: 向下滾動超過閾值返回 down', async () => {
      const { result } = renderHook(() => useScrollDirection(10));

      act(() => {
        scrollYValue = 50;
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current).toBe('down');
      });
    });

    it('案例 7: 向上滾動超過閾值返回 up', async () => {
      const { result } = renderHook(() => useScrollDirection(10));

      // 先向下
      act(() => {
        scrollYValue = 100;
        window.dispatchEvent(new Event('scroll'));
      });
      await waitFor(() => expect(result.current).toBe('down'));

      // 再向上
      act(() => {
        scrollYValue = 20;
        window.dispatchEvent(new Event('scroll'));
      });
      await waitFor(() => expect(result.current).toBe('up'));
    });

    it('案例 8: 小於閾值不觸發更新', async () => {
      const { result } = renderHook(() => useScrollDirection(50));

      act(() => {
        scrollYValue = 20;
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current).toBe('up'); // 保持初始狀態
      });
    });
  });
});

describe('useScrollDirection - iOS 手機模擬', () => {
  let scrollYValue = 0;

  beforeEach(() => {
    scrollYValue = 0;
    Object.defineProperty(window, 'scrollY', {
      get: () => scrollYValue,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('案例 17-20: iOS 手勢與滾動', () => {
    it('案例 17: iOS 慣性滾動正確觸發 useScrollDirection', async () => {
      const { result } = renderHook(() => useScrollDirection(10));

      // 模擬 iOS 慣性滾動（快速連續觸發）
      act(() => {
        for (let i = 0; i <= 100; i += 20) {
          scrollYValue = i;
          window.dispatchEvent(new Event('scroll'));
        }
      });

      await waitFor(() => {
        expect(result.current).toBe('down');
      });
    });

    it('案例 18: iOS bounce 滾動（負值 scrollY）不觸發錯誤', async () => {
      const { result } = renderHook(() => useScrollDirection(10));

      // iOS 頂部 bounce 產生負值
      act(() => {
        scrollYValue = -50;
        window.dispatchEvent(new Event('scroll'));
      });

      await waitFor(() => {
        expect(result.current).toBe('up'); // 保持初始狀態
      });
    });

    it('案例 23: scroll listener 使用 passive:true 提升效能', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useScrollDirection(10));

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        expect.any(Function),
        { passive: true }
      );
    });

    it('案例 24: unmount 時正確清理 listener 防止 iOS 記憶體洩漏', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useScrollDirection(10));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
    });
  });
});
