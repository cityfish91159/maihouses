import { useEffect, useRef } from 'react';
import { track } from '../../analytics/track';

type PanelType = 'line' | 'call';

interface UsePanelWelcomeTrackParams {
  panelType: PanelType;
  isOpen: boolean;
  hasContact: boolean;
}

export function usePanelWelcomeTrack({
  panelType,
  isOpen,
  hasContact,
}: UsePanelWelcomeTrackParams): void {
  const hasTrackedWelcomeRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasTrackedWelcomeRef.current = false;
      return;
    }

    if (hasTrackedWelcomeRef.current) return;
    hasTrackedWelcomeRef.current = true;

    void track('maimai_panel_welcome', {
      panelType,
      hasContact,
    });
  }, [hasContact, isOpen, panelType]);
}
