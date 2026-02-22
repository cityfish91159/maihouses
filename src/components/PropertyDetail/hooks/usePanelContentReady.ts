import { useEffect, useState } from 'react';
import { PANEL_SKELETON_DELAY_MS } from '../constants';

export function usePanelContentReady(isOpen: boolean, delayMs = PANEL_SKELETON_DELAY_MS): boolean {
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
