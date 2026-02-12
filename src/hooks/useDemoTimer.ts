import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '../lib/notify';
import {
  clearDemoMode,
  DEMO_WARN_BEFORE_MS,
  getDemoRemainingMinutes,
  getDemoTimeRemaining,
  reloadPage,
} from '../lib/pageMode';
import { usePageMode } from './usePageMode';

export function useDemoTimer(): void {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);
  const mode = usePageMode();

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    if (mode !== 'demo') return;

    const handleDemoExpire = () => {
      clearDemoMode();
      queryClientRef.current.clear();
      reloadPage();
    };

    const remaining = getDemoTimeRemaining();
    if (remaining <= 0) {
      handleDemoExpire();
      return;
    }

    const warnDelay = Math.max(0, remaining - DEMO_WARN_BEFORE_MS);
    const warnTimer = setTimeout(() => {
      const minutes = Math.max(1, getDemoRemainingMinutes());
      notify.info('演示即將結束', `剩餘 ${minutes} 分鐘`);
    }, warnDelay);

    const expireTimer = setTimeout(() => {
      handleDemoExpire();
    }, remaining);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(expireTimer);
    };
  }, [mode]);
}
