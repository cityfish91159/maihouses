import { useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import {
  clearDemoMode,
  isDemoMode,
  resolvePageMode,
  subscribeDemoModeStorageSync,
  type PageMode,
} from '../lib/pageMode';

export function usePageMode(): PageMode {
  const { isAuthenticated } = useAuth();

  const mode = useMemo(() => resolvePageMode(isAuthenticated), [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isDemoMode()) return;

    // 規則：登入後強制回到 live，避免 demo 狀態殘留
    clearDemoMode();
  }, [isAuthenticated]);

  useEffect(() => {
    return subscribeDemoModeStorageSync(() => {
      window.location.reload();
    });
  }, []);

  return mode;
}
