import { useState, useEffect, useCallback } from 'react';
import { Lead } from '../types/uag.types';
import { useWindowSize } from './useWindowSize';
import { BREAKPOINTS } from '../uag-config';

export function useLeadSelection() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { width } = useWindowSize();

  // Handle window resize to close panel on desktop
  useEffect(() => {
    if (width > BREAKPOINTS.TABLET && selectedLead) {
      setSelectedLead(null);
    }
  }, [width, selectedLead]);

  const selectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    // Using requestAnimationFrame for better timing
    requestAnimationFrame(() => {
      if (window.innerWidth <= BREAKPOINTS.TABLET) {
        document.getElementById('action-panel-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }, []);

  const close = useCallback(() => setSelectedLead(null), []);

  return { selectedLead, selectLead, close };
}
