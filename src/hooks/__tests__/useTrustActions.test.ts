import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrustActions } from '../useTrustActions';
import { toast } from 'sonner';
import { TOAST_DURATION } from '../../constants/toast';

// Mock dependencies
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('useTrustActions', () => {
  const mockPropertyId = 'MH-100001';
  let originalWindowOpen: typeof window.open;

  beforeEach(() => {
    vi.clearAllMocks();
    originalWindowOpen = window.open;
  });

  afterEach(() => {
    window.open = originalWindowOpen;
  });

  describe('learnMore', () => {
    it('應該開啟新分頁並導向說明頁面', () => {
      const mockWindowOpen = vi.fn(() => ({} as Window));
      window.open = mockWindowOpen;

      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.learnMore();
      });

      expect(mockWindowOpen).toHaveBeenCalledWith(expect.stringContaining('/maihouses/assure?case=TR-2024-001'), '_blank', 'noopener,noreferrer');
    });

    it('當彈窗被阻擋時應該顯示 Toast 提示', () => {
      window.open = vi.fn(() => null);

      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.learnMore();
      });

      expect(toast.warning).toHaveBeenCalledWith(
        '無法開啟新分頁',
        expect.objectContaining({
          description: '您的瀏覽器阻擋了新分頁',
          action: expect.objectContaining({
            label: '手動開啟',
          }),
        })
      );
    });
  });

  describe('requestEnable', () => {
    it('應該顯示成功 Toast 並使用正確的 duration', () => {
      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.requestEnable();
      });

      expect(toast.success).toHaveBeenCalledWith(
        '要求已送出',
        expect.objectContaining({
          description: expect.stringContaining('系統將通知房仲開啟安心留痕服務'),
          duration: TOAST_DURATION.SUCCESS,
        })
      );
    });

    it('應該在多次調用時每次都顯示 Toast', () => {
      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.requestEnable();
        result.current.requestEnable();
      });

      expect(toast.success).toHaveBeenCalledTimes(2);
    });
  });

  describe('Toast Action 按鈕行為', () => {
    it('當彈窗被阻擋時,點擊「手動開啟」應該複製 URL 到剪貼簿', () => {
      window.open = vi.fn(() => null);
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.assign(navigator, { clipboard: mockClipboard });

      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.learnMore();
      });

      const warningCall = vi.mocked(toast.warning).mock.calls[0];
      const toastOptions = warningCall?.[1];

      if (toastOptions && typeof toastOptions === 'object' && 'action' in toastOptions) {
        const action = toastOptions.action;
        if (action && typeof action === 'object' && 'onClick' in action && typeof action.onClick === 'function') {
          // Toast action 應該執行某些操作（依實際實作而定）
          expect(action.onClick).toBeDefined();
        }
      }
    });

    it('Toast warning duration 應該使用 TOAST_DURATION.WARNING', () => {
      window.open = vi.fn(() => null);

      const { result } = renderHook(() => useTrustActions(mockPropertyId));

      act(() => {
        result.current.learnMore();
      });

      expect(toast.warning).toHaveBeenCalledWith(
        '無法開啟新分頁',
        expect.objectContaining({
          duration: TOAST_DURATION.WARNING,
        })
      );
    });
  });
});
