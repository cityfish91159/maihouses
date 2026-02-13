import { useEffect, useReducer } from 'react';
import { useAuth } from './useAuth';
import {
  clearDemoMode,
  isDemoMode,
  resolvePageMode,
  subscribeDemoModeStorageSync,
  type PageMode,
} from '../lib/pageMode';

export type { PageMode };

export function usePageMode(): PageMode {
  const { isAuthenticated } = useAuth();
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const mode = resolvePageMode(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isDemoMode()) return;

    // clearDemoMode 只清 localStorage，不影響本次 mode 計算
    // 因為 resolvePageMode 中 isAuthenticated 優先，已回傳 'live'
    // 清除是為了防止登出後殘留 demo 狀態
    clearDemoMode();
  }, [isAuthenticated]);

  useEffect(() => {
    // 跨分頁同步：其他分頁變更 demo 狀態時，觸發 re-render 重新計算 mode
    // 使用 forceUpdate 而非 reloadPage，避免中斷用戶正在進行的操作
    return subscribeDemoModeStorageSync(() => {
      forceUpdate();
    });
  }, []);

  return mode;
}
