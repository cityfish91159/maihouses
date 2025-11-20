import { useState, useEffect } from 'react';
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

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    if (width <= BREAKPOINTS.TABLET) {
      setTimeout(() => {
        document.getElementById('action-panel-container')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  };

  const close = () => setSelectedLead(null);

  return { selectedLead, selectLead, close };
}
