/**
 * UAG 主 Hook（整合層）
 *
 * 此 Hook 作為 facade，整合以下子 Hooks：
 * - useUAGData: 數據獲取與 Mock/Live 模式管理
 * - useLeadPurchase: Lead 購買邏輯與樂觀更新
 * - useRealtimeUpdates: S 級升級 Realtime 訂閱
 *
 * @module useUAG
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   isLoading,
 *   buyLead,
 *   isBuying,
 *   useMock,
 *   toggleMode,
 *   refetch,
 * } = useUAG();
 * ```
 */

import { useUAGData } from "./useUAGData";
import { useLeadPurchase, type BuyLeadResult } from "./useLeadPurchase";
import { useRealtimeUpdates } from "./useRealtimeUpdates";
import type { AppData } from "../types/uag.types";

// ============================================================================
// Re-exports
// ============================================================================

// 重新導出類型，保持向後兼容
export type { BuyLeadResult } from "./useLeadPurchase";
export { UAG_QUERY_KEY } from "./useUAGData";

// ============================================================================
// Types
// ============================================================================

/** useUAG 返回值類型 */
export interface UseUAGReturn {
  /** UAG 應用數據 */
  data: AppData | undefined;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤狀態 */
  error: Error | null;
  /** 購買 Lead */
  buyLead: (leadId: string) => Promise<BuyLeadResult>;
  /** 是否購買中 */
  isBuying: boolean;
  /** 是否使用 Mock 模式 */
  useMock: boolean;
  /** 切換 Mock/Live 模式 */
  toggleMode: () => void;
  /** 手動刷新數據 */
  refetch: () => Promise<unknown>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * UAG 主 Hook
 *
 * 整合所有 UAG 相關功能：
 * 1. 數據獲取與快取管理
 * 2. Lead 購買與樂觀更新
 * 3. S 級升級 Realtime 訂閱
 */
export function useUAG(): UseUAGReturn {
  // 1. 數據獲取
  const { data, isLoading, error, refetch, useMock, toggleMode, userId } =
    useUAGData();

  // 2. 購買邏輯
  const { buyLead, isBuying } = useLeadPurchase({
    data,
    useMock,
    userId,
  });

  // 3. Realtime 訂閱
  useRealtimeUpdates({
    useMock,
    userId,
    refetch,
  });

  return {
    data,
    isLoading,
    error,
    buyLead,
    isBuying,
    useMock,
    toggleMode,
    refetch,
  };
}
