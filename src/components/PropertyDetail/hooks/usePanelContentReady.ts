import { useEffect, useState } from 'react';

export function usePanelContentReady(isOpen: boolean, delayMs = 300): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timerId = window.setTimeout(() => {
      setIsReady(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timerId);
      setIsReady(false);
    };
  }, [delayMs, isOpen]);

  return isReady;
}
