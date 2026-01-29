import { useState, useCallback, useMemo } from 'react';
import { Lead } from '../types/uag.types';
import { useWindowSize } from './useWindowSize';
import { BREAKPOINTS } from '../uag-config';

export function useLeadSelection() {
  // 使用元組儲存 [lead, 當時的 width 是否為手機]
  // 這樣當 width 變大（桌面）時，可以判斷是否要顯示
  const [selectionState, setSelectionState] = useState<{
    lead: Lead;
    selectedOnMobile: boolean;
  } | null>(null);
  const { width } = useWindowSize();

  // 只有在手機上選擇的 lead，且當前仍在手機上，才會顯示
  const isOnMobile = width <= BREAKPOINTS.TABLET;
  const effectiveSelectedLead = useMemo(() => {
    if (!selectionState) return null;
    // 如果選擇時是在手機上，且現在變成桌面，則不顯示
    if (selectionState.selectedOnMobile && !isOnMobile) return null;
    return selectionState.lead;
  }, [selectionState, isOnMobile]);

  const selectLead = useCallback((lead: Lead) => {
    const isMobile = window.innerWidth <= BREAKPOINTS.TABLET;
    setSelectionState({ lead, selectedOnMobile: isMobile });
    // Scroll to action panel on mobile
    // Using requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      if (isMobile) {
        document
          .getElementById('action-panel-container')
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  const close = useCallback(() => setSelectionState(null), []);

  return { selectedLead: effectiveSelectedLead, selectLead, close };
}
