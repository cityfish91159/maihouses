import { useEffect, useReducer, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import {
  clearDemoArtifacts,
  exitDemoMode,
  isDemoMode,
  resolvePageMode,
  subscribeDemoModeStorageSync,
  type PageMode,
} from '../lib/pageMode';

export type { PageMode };

export function usePageModeWithAuthState(isAuthenticated: boolean): PageMode {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  const queryClient = useQueryClient();
  // ref 追蹤最新 queryClient，避免 subscribeDemoModeStorageSync callback 閉包捕獲過時實例
  const queryClientRef = useRef(queryClient);

  const mode = resolvePageMode(isAuthenticated);
  const modeRef = useRef(mode);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isDemoMode()) return;

    // 清理 demo cache/storage 殘留，不影響本次 mode 計算
    // 因為 resolvePageMode 中 isAuthenticated 優先，已回傳 'live'
    // 清除是為了防止登出後殘留 demo 狀態
    clearDemoArtifacts(queryClientRef.current);
  }, [isAuthenticated]);

  useEffect(() => {
    // 跨分頁同步：其他分頁退出/到期後，本分頁若仍在 demo，需同步清 cache 並導回首頁
    return subscribeDemoModeStorageSync(() => {
      const nextMode = resolvePageMode(isAuthenticated);
      const isDemoToVisitorTransition = modeRef.current === 'demo' && nextMode === 'visitor';
      if (isDemoToVisitorTransition) {
        const isAlreadyExpiring =
          typeof window !== 'undefined' && window.__DEMO_EXPIRING === true;
        if (!isAlreadyExpiring) {
          exitDemoMode(queryClientRef.current);
        }
        return;
      }

      forceUpdate();
    });
  }, [isAuthenticated]);

  return mode;
}

export function usePageMode(): PageMode {
  const { isAuthenticated } = useAuth();
  return usePageModeWithAuthState(isAuthenticated);
}
