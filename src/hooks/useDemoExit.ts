import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { exitDemoMode } from '../lib/pageMode';
import { notify } from '../lib/notify';

const EXIT_CONFIRM_TOAST_ID = 'demo-exit-confirm';

export function useDemoExit() {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  const executeDemoExit = useCallback(() => {
    notify.dismiss(EXIT_CONFIRM_TOAST_ID);
    exitDemoMode(queryClientRef.current);
  }, []);

  const requestDemoExit = useCallback(() => {
    notify.info('確定退出演示模式？', '退出後將返回訪客首頁。', {
      id: EXIT_CONFIRM_TOAST_ID,
      duration: Number.POSITIVE_INFINITY,
      action: {
        label: '確定退出',
        onClick: executeDemoExit,
      },
    });
  }, [executeDemoExit]);

  return { requestDemoExit };
}
