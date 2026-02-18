import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { notify } from '../lib/notify';
import {
  DEMO_WARN_BEFORE_MS,
  exitDemoMode,
  getDemoRemainingMinutes,
  getDemoTimeRemaining,
} from '../lib/pageMode';
import { usePageMode } from './usePageMode';

const WARN_SKIP_THRESHOLD_MS = 30_000;

export function useDemoTimer(): void {
  const queryClient = useQueryClient();
  // ref 追蹤最新 queryClient，避免 effect 閉包捕獲過時實例
  // queryClient 通常是 app 生命週期不變的單例，但 ref 確保安全
  const queryClientRef = useRef(queryClient);
  const mode = usePageMode();
  const modeRef = useRef(mode);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (mode !== 'demo') return;

    const handleDemoExpire = () => {
      if (modeRef.current !== 'demo') return;
      exitDemoMode(queryClientRef.current);
    };

    const remaining = getDemoTimeRemaining();
    if (remaining <= 0) {
      handleDemoExpire();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    // 剩餘時間 > 30 秒才顯示 warn toast，避免 warn 和 expire 幾乎同時觸發
    const warnDelay = remaining - DEMO_WARN_BEFORE_MS;
    if (warnDelay > 0 && remaining > WARN_SKIP_THRESHOLD_MS) {
      timers.push(
        setTimeout(() => {
          const minutes = Math.max(1, getDemoRemainingMinutes());
          notify.info('演示即將結束', `剩餘 ${minutes} 分鐘`);
        }, Math.max(0, warnDelay))
      );
    }

    timers.push(
      setTimeout(() => {
        handleDemoExpire();
      }, remaining)
    );

    // iOS Safari 背景分頁 setTimeout 暫停補償
    // 回前景時檢查 TTL 是否已過期
    const visibilityHandler = () => {
      if (document.visibilityState !== 'visible') return;
      const nowRemaining = getDemoTimeRemaining();
      if (nowRemaining <= 0) {
        handleDemoExpire();
      }
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
      document.removeEventListener('visibilitychange', visibilityHandler);
    };
  }, [mode]);
}
