/**
 * useUAG Hook 單元測試
 *
 * 測試策略：Shallow Integration
 * - Mock 所有 3 個子 hooks (useUAGData, useLeadPurchase, useRealtimeUpdates)
 * - 測試 facade 層的整合邏輯
 * - 驗證返回值正確映射
 *
 * 遵循 Skills:
 * - test_driven_agent: TDD Red-Green-Refactor 循環
 * - rigorous_testing: 嚴格測試協議
 * - no_lazy_implementation: 禁止任何占位符或 TODO
 * - frontend_mastery: React Hook 測試最佳實踐
 *
 * @see src/pages/UAG/hooks/useUAG.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUAG } from '../useUAG';
import type { AppData } from '../../types/uag.types';

// ============================================================================
// Mocks
// ============================================================================

// Mock 子 hooks
vi.mock('../useUAGData');
vi.mock('../useLeadPurchase');
vi.mock('../useRealtimeUpdates');

// Import mocked modules
import { useUAGData } from '../useUAGData';
import { useLeadPurchase } from '../useLeadPurchase';
import { useRealtimeUpdates } from '../useRealtimeUpdates';

// ============================================================================
// Test Data
// ============================================================================

const mockAppData: AppData = {
  user: {
    points: 100,
    quota: { s: 5, a: 10 },
  },
  leads: [],
  listings: [],
  feed: [],
};

const mockBuyLead = vi.fn();
const mockRefetch = vi.fn();
const mockToggleMode = vi.fn();

// ============================================================================
// Tests
// ============================================================================

describe('useUAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 設置默認 mock 返回值
    vi.mocked(useUAGData).mockReturnValue({
      data: mockAppData,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
      useMock: true,
      toggleMode: mockToggleMode,
      userId: 'test-user-id',
      queryClient: {} as any,
    });

    vi.mocked(useLeadPurchase).mockReturnValue({
      buyLead: mockBuyLead,
      isBuying: false,
    });

    vi.mocked(useRealtimeUpdates).mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 基礎整合測試
  // ==========================================================================

  describe('基礎整合', () => {
    it('應正確整合 useUAGData 的返回值', () => {
      const { result } = renderHook(() => useUAG());

      expect(result.current.data).toEqual(mockAppData);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.useMock).toBe(true);
    });

    it('應正確整合 useLeadPurchase 的返回值', () => {
      const { result } = renderHook(() => useUAG());

      expect(result.current.buyLead).toBe(mockBuyLead);
      expect(result.current.isBuying).toBe(false);
    });

    it('應正確整合 refetch 和 toggleMode 函數', () => {
      const { result } = renderHook(() => useUAG());

      expect(result.current.refetch).toBe(mockRefetch);
      expect(result.current.toggleMode).toBe(mockToggleMode);
    });

    it('應呼叫所有 3 個子 hooks', () => {
      renderHook(() => useUAG());

      expect(useUAGData).toHaveBeenCalledTimes(1);
      expect(useLeadPurchase).toHaveBeenCalledTimes(1);
      expect(useRealtimeUpdates).toHaveBeenCalledTimes(1);
    });

    it('應傳遞正確的參數給 useLeadPurchase', () => {
      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith({
        data: mockAppData,
        useMock: true,
        userId: 'test-user-id',
      });
    });

    it('應傳遞正確的參數給 useRealtimeUpdates', () => {
      renderHook(() => useUAG());

      expect(useRealtimeUpdates).toHaveBeenCalledWith({
        useMock: true,
        userId: 'test-user-id',
        refetch: mockRefetch,
      });
    });
  });

  // ==========================================================================
  // 載入狀態測試
  // ==========================================================================

  describe('載入狀態', () => {
    it('應正確傳遞 isLoading 狀態為 true', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('載入中時 data 應為 undefined', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });

    it('載入完成後 isLoading 應為 false', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockAppData);
    });
  });

  // ==========================================================================
  // 錯誤處理測試
  // ==========================================================================

  describe('錯誤處理', () => {
    it('應正確傳遞錯誤狀態', () => {
      const mockError = new Error('Failed to fetch data');

      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });

    it('錯誤狀態下 data 應為 undefined', () => {
      const mockError = new Error('Network error');

      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(mockError);
    });

    it('應區分不同類型的錯誤', () => {
      const networkError = new Error('Network timeout');

      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: networkError,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.error?.message).toBe('Network timeout');
    });
  });

  // ==========================================================================
  // Mock/Live 模式測試
  // ==========================================================================

  describe('Mock/Live 模式', () => {
    it('Mock 模式下 useMock 應為 true', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.useMock).toBe(true);
    });

    it('Live 模式下 useMock 應為 false', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.useMock).toBe(false);
    });

    it('Mock 模式下 userId 可能為 undefined', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        })
      );
    });

    it('Live 模式下 userId 應為有效 ID', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'authenticated-user',
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'authenticated-user',
        })
      );
    });
  });

  // ==========================================================================
  // 購買功能測試
  // ==========================================================================

  describe('購買功能', () => {
    it('應傳遞正確的 buyLead 函數', () => {
      const { result } = renderHook(() => useUAG());

      expect(result.current.buyLead).toBe(mockBuyLead);
      expect(typeof result.current.buyLead).toBe('function');
    });

    it('應正確傳遞 isBuying 狀態（false）', () => {
      vi.mocked(useLeadPurchase).mockReturnValue({
        buyLead: mockBuyLead,
        isBuying: false,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.isBuying).toBe(false);
    });

    it('應正確傳遞 isBuying 狀態（true）', () => {
      vi.mocked(useLeadPurchase).mockReturnValue({
        buyLead: mockBuyLead,
        isBuying: true,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.isBuying).toBe(true);
    });

    it('購買功能應傳遞正確的 data 和 useMock', () => {
      const customAppData: AppData = {
        user: {
          points: 200,
          quota: { s: 10, a: 20 },
        },
        leads: [],
        listings: [],
        feed: [],
      };

      vi.mocked(useUAGData).mockReturnValue({
        data: customAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'custom-user',
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith({
        data: customAppData,
        useMock: false,
        userId: 'custom-user',
      });
    });
  });

  // ==========================================================================
  // Realtime 訂閱測試
  // ==========================================================================

  describe('Realtime 訂閱', () => {
    it('應呼叫 useRealtimeUpdates 並傳遞正確參數', () => {
      renderHook(() => useUAG());

      expect(useRealtimeUpdates).toHaveBeenCalledWith({
        useMock: true,
        userId: 'test-user-id',
        refetch: mockRefetch,
      });
    });

    it('Mock 模式下應傳遞 useMock: true', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useRealtimeUpdates).toHaveBeenCalledWith(
        expect.objectContaining({
          useMock: true,
        })
      );
    });

    it('Live 模式下應傳遞 useMock: false 和 userId', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'authenticated-user',
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useRealtimeUpdates).toHaveBeenCalledWith(
        expect.objectContaining({
          useMock: false,
          userId: 'authenticated-user',
        })
      );
    });

    it('應傳遞 refetch 函數給 Realtime 訂閱', () => {
      const customRefetch = vi.fn();

      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: customRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useRealtimeUpdates).toHaveBeenCalledWith(
        expect.objectContaining({
          refetch: customRefetch,
        })
      );
    });
  });

  // ==========================================================================
  // 參數傳遞測試
  // ==========================================================================

  describe('參數傳遞', () => {
    it('應傳遞 data 給 useLeadPurchase', () => {
      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockAppData,
        })
      );
    });

    it('應傳遞 useMock 給 useLeadPurchase', () => {
      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          useMock: true,
        })
      );
    });

    it('應傳遞 userId 給 useLeadPurchase', () => {
      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-id',
        })
      );
    });

    it('當 useUAGData 返回值變化時應傳遞更新後的值', () => {
      const { rerender } = renderHook(() => useUAG());

      // 第一次渲染
      expect(useLeadPurchase).toHaveBeenCalledWith({
        data: mockAppData,
        useMock: true,
        userId: 'test-user-id',
      });

      // 更新 mock 返回值
      const newAppData: AppData = {
        user: {
          points: 300,
          quota: { s: 15, a: 30 },
        },
        leads: [],
        listings: [],
        feed: [],
      };

      vi.mocked(useUAGData).mockReturnValue({
        data: newAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'new-user-id',
        queryClient: {} as any,
      });

      // 重新渲染
      rerender();

      // 驗證新值
      expect(useLeadPurchase).toHaveBeenCalledWith({
        data: newAppData,
        useMock: false,
        userId: 'new-user-id',
      });
    });
  });

  // ==========================================================================
  // 邊界條件測試
  // ==========================================================================

  describe('邊界條件', () => {
    it('userId 為 undefined 時應正確傳遞', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        })
      );

      expect(useRealtimeUpdates).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: undefined,
        })
      );
    });

    it('data 為 undefined 時應正確傳遞', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      renderHook(() => useUAG());

      expect(useLeadPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          data: undefined,
        })
      );
    });

    it('error 為 null 時應正確處理', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: mockAppData,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current.error).toBe(null);
    });

    it('所有狀態為 undefined/null 時應能正常運行', () => {
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      const { result } = renderHook(() => useUAG());

      expect(result.current).toMatchObject({
        data: undefined,
        isLoading: false,
        error: null,
        useMock: true,
      });
    });
  });

  // ==========================================================================
  // TypeScript 類型推導測試
  // ==========================================================================

  describe('TypeScript 類型推導', () => {
    it('返回值應包含所有必要屬性', () => {
      const { result } = renderHook(() => useUAG());

      // 驗證返回值結構
      expect(result.current).toHaveProperty('data');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('buyLead');
      expect(result.current).toHaveProperty('isBuying');
      expect(result.current).toHaveProperty('useMock');
      expect(result.current).toHaveProperty('toggleMode');
      expect(result.current).toHaveProperty('refetch');
    });

    it('返回值類型應正確', () => {
      const { result } = renderHook(() => useUAG());

      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.isBuying).toBe('boolean');
      expect(typeof result.current.useMock).toBe('boolean');
      expect(typeof result.current.buyLead).toBe('function');
      expect(typeof result.current.toggleMode).toBe('function');
      expect(typeof result.current.refetch).toBe('function');
    });

    it('data 類型應符合 AppData | undefined', () => {
      const { result } = renderHook(() => useUAG());

      // 有數據時
      expect(result.current.data).toBeDefined();
      expect(result.current.data).toHaveProperty('user');
      expect(result.current.data).toHaveProperty('leads');

      // 無數據時
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: mockRefetch,
        useMock: true,
        toggleMode: mockToggleMode,
        userId: undefined,
        queryClient: {} as any,
      });

      const { result: result2 } = renderHook(() => useUAG());
      expect(result2.current.data).toBeUndefined();
    });

    it('error 類型應符合 Error | null', () => {
      const { result } = renderHook(() => useUAG());

      // null 情況
      expect(result.current.error).toBe(null);

      // Error 情況
      const testError = new Error('Test error');
      vi.mocked(useUAGData).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: testError,
        refetch: mockRefetch,
        useMock: false,
        toggleMode: mockToggleMode,
        userId: 'test-user-id',
        queryClient: {} as any,
      });

      const { result: result2 } = renderHook(() => useUAG());
      expect(result2.current.error).toBeInstanceOf(Error);
      expect(result2.current.error?.message).toBe('Test error');
    });
  });

  // ==========================================================================
  // 函數穩定性測試（React 優化相關）
  // ==========================================================================

  describe('函數穩定性', () => {
    it('buyLead 函數引用應穩定', () => {
      const { result, rerender } = renderHook(() => useUAG());

      const firstBuyLead = result.current.buyLead;

      // 重新渲染
      rerender();

      expect(result.current.buyLead).toBe(firstBuyLead);
    });

    it('toggleMode 函數引用應穩定', () => {
      const { result, rerender } = renderHook(() => useUAG());

      const firstToggleMode = result.current.toggleMode;

      // 重新渲染
      rerender();

      expect(result.current.toggleMode).toBe(firstToggleMode);
    });

    it('refetch 函數引用應穩定', () => {
      const { result, rerender } = renderHook(() => useUAG());

      const firstRefetch = result.current.refetch;

      // 重新渲染
      rerender();

      expect(result.current.refetch).toBe(firstRefetch);
    });
  });
});
