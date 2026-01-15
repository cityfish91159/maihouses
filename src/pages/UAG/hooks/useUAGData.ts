/**
 * UAG 數據獲取 Hook
 *
 * 職責：
 * - 從 Supabase 或 Mock 數據獲取 AppData
 * - 管理 Mock/Live 模式切換
 * - 提供 React Query 快取與刷新
 *
 * @module useUAGData
 */

import { useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { UAGService } from "../services/uagService";
import type { AppData } from "../types/uag.types";
import { MOCK_DB } from "../mockData";
import { notify } from "../../../lib/notify";
import { useAuth } from "../../../hooks/useAuth";
import { useUAGModeStore, selectUseMock } from "../../../stores/uagModeStore";

// ============================================================================
// Constants
// ============================================================================

/** React Query 快取鍵 */
export const UAG_QUERY_KEY = "uagData" as const;

/** Query 配置：staleTime 與 refetchInterval 保持一致避免不必要的 refetch */
const QUERY_CONFIG = {
  staleTime: 1000 * 30, // 30 秒
  refetchInterval: 30000, // 30 秒
} as const;

// ============================================================================
// Types
// ============================================================================

export interface UseUAGDataReturn {
  /** UAG 應用數據 */
  data: AppData | undefined;
  /** 是否載入中 */
  isLoading: boolean;
  /** 錯誤狀態 */
  error: Error | null;
  /** 手動刷新數據 */
  refetch: () => Promise<unknown>;
  /** 是否使用 Mock 模式 */
  useMock: boolean;
  /** 切換 Mock/Live 模式 */
  toggleMode: () => void;
  /** 當前用戶 ID */
  userId: string | undefined;
  /** Query Client（供其他 hooks 使用） */
  queryClient: ReturnType<typeof useQueryClient>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * UAG 數據獲取 Hook
 *
 * @example
 * ```tsx
 * const { data, isLoading, useMock, toggleMode } = useUAGData();
 *
 * if (isLoading) return <Skeleton />;
 * return <RadarCluster leads={data?.leads} />;
 * ```
 */
export function useUAGData(): UseUAGDataReturn {
  const { session } = useAuth();
  const userId = session?.user?.id;

  // Selector 優化：useMock 是狀態，需要訂閱變化觸發 re-render
  const useMock = useUAGModeStore(selectUseMock);
  // 函數引用穩定，用 getState() 取得即可，無需 selector 訂閱
  const { setUseMock, initializeMode } = useUAGModeStore.getState();

  const queryClient = useQueryClient();

  // 初始化模式（根據 URL 參數）
  useEffect(() => {
    initializeMode();
  }, [initializeMode]);

  /**
   * 切換 Mock/Live 模式
   * Live 模式需要已登入
   */
  const toggleMode = useCallback(() => {
    const newMode = !useMock;

    // 切換到 Live 模式時，檢查是否已登入
    if (!newMode && !userId) {
      notify.error("請先登入", "切換到 Live 模式需要登入");
      return;
    }

    setUseMock(newMode);
  }, [useMock, userId, setUseMock]);

  /**
   * React Query：獲取 UAG 數據
   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [UAG_QUERY_KEY, useMock, userId],
    queryFn: async (): Promise<AppData> => {
      if (useMock) {
        return MOCK_DB as unknown as AppData;
      }
      if (!userId) {
        throw new Error("Not authenticated");
      }
      return UAGService.fetchAppData(userId);
    },
    enabled: useMock || !!userId,
    staleTime: QUERY_CONFIG.staleTime,
    refetchInterval: useMock ? false : QUERY_CONFIG.refetchInterval,
  });

  return {
    data,
    isLoading,
    error,
    refetch,
    useMock,
    toggleMode,
    userId,
    queryClient,
  };
}
