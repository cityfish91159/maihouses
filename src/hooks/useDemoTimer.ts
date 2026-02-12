import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '../lib/notify';
import {
  clearDemoMode,
  DEMO_WARN_BEFORE_MS,
  getDemoRemainingMinutes,
  getDemoTimeRemaining,
} from '../lib/pageMode';
import { usePageMode } from './usePageMode';

const handleDemoExpire = (queryClient: ReturnType<typeof useQueryClient>) => {
  clearDemoMode();
  queryClient.clear();
  window.location.reload();
};

export function useDemoTimer(): void {
  const queryClient = useQueryClient();
  const mode = usePageMode();

  useEffect(() => {
    if (mode !== 'demo') return;

    const remaining = getDemoTimeRemaining();
    if (remaining <= 0) {
      handleDemoExpire(queryClient);
      return;
    }

    const warnDelay = Math.max(0, remaining - DEMO_WARN_BEFORE_MS);
    const warnTimer = setTimeout(() => {
      const minutes = Math.max(1, getDemoRemainingMinutes());
      notify.info('演示即將結束', `剩餘 ${minutes} 分鐘`);
    }, warnDelay);

    const expireTimer = setTimeout(() => {
      handleDemoExpire(queryClient);
    }, remaining);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(expireTimer);
    };
  }, [mode, queryClient]);
}
