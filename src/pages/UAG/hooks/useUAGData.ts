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

import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UAGService } from '../services/uagService';
import { AppDataSchema, type AppData } from '../types/uag.types';
import { MOCK_DB } from '../mockData';
import { logger } from '../../../lib/logger';
import { notify } from '../../../lib/notify';
import { useAuth } from '../../../hooks/useAuth';
import { usePageMode, type PageMode } from '../../../hooks/usePageMode';
import { useUAGModeStore, selectUseMock } from '../../../stores/uagModeStore';
import { uagDataQueryKey } from './queryKeys';

// ============================================================================
// Constants
// ============================================================================

export { UAG_QUERY_KEY } from './queryKeys';

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
  const pageMode = usePageMode();
  const userId = session?.user?.id;

  // #5b 遷移前兼容：以 pageMode 為主，舊 store 僅在 visitor 時作 fallback。
  const storeUseMock = useUAGModeStore(selectUseMock);
  const useMock = pageMode === 'demo' || (pageMode === 'visitor' && storeUseMock);
  // 函數引用穩定，用 getState() 取得即可，無需 selector 訂閱
  const { setUseMock, initializeMode } = useUAGModeStore.getState();

  const queryClient = useQueryClient();
  const mode: PageMode = useMock ? 'demo' : pageMode;

  // 初始化模式（根據 URL 參數）
  useEffect(() => {
    initializeMode();
  }, [initializeMode]);

  /**
   * 切換 Mock/Live 模式
   * Live 模式需要已登入
   */
  const toggleMode = useCallback(() => {
    if (pageMode === 'live') {
      notify.info('目前為 Live 模式', '登入狀態下不支援切換到 Mock 模式');
      return;
    }

    const newMode = !useMock;

    // 切換到 Live 模式時，檢查是否已登入
    if (!newMode && !userId) {
      notify.error('請先登入', '切換到 Live 模式需要登入');
      return;
    }

    setUseMock(newMode);
  }, [pageMode, useMock, userId, setUseMock]);

  /**
   * React Query：獲取 UAG 數據
   */
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: uagDataQueryKey(mode, userId),
    queryFn: async (): Promise<AppData> => {
      if (useMock) {
        // [NASA TypeScript Safety] 使用 Zod safeParse 取代 as unknown as AppData
        const parseResult = AppDataSchema.safeParse(MOCK_DB);
        if (!parseResult.success) {
          logger.error('[useUAGData] Mock data validation failed', {
            error: parseResult.error.message,
          });
          throw new Error('Invalid mock data structure');
        }
        return parseResult.data;
      }
      if (!userId) {
        throw new Error('Not authenticated');
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
