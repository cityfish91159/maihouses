import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearDemoMode, reloadPage } from '../lib/pageMode';
import { notify } from '../lib/notify';
import { safeLocalStorage, safeSessionStorage } from '../lib/safeStorage';

const EXIT_CONFIRM_TOAST_ID = 'demo-exit-confirm';

export function useDemoExit() {
  const queryClient = useQueryClient();
  const queryClientRef = useRef(queryClient);

  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  const executeDemoExit = useCallback(() => {
    notify.dismiss(EXIT_CONFIRM_TOAST_ID);
    clearDemoMode();
    safeLocalStorage.removeItem('mai-uag-mode');
    safeSessionStorage.removeItem('feed-demo-role');
    queryClientRef.current.clear();
    reloadPage();
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
