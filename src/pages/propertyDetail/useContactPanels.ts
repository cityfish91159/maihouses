/** 聯絡面板狀態 Hook：ContactModal + LinePanel + CallPanel */
import { useState, useCallback } from 'react';
import type { ContactChannel } from '../../components/ContactModal';

type PanelSource = 'sidebar' | 'mobile_bar';

export function useContactPanels(trackLineClick: () => void, trackCallClick: () => void) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactSource, setContactSource] = useState<PanelSource>('sidebar');
  const [contactDefaultChannel, setContactDefaultChannel] = useState<ContactChannel>('line');
  const [contactTrustAssureRequested, setContactTrustAssureRequested] = useState(false);

  const [linePanelOpen, setLinePanelOpen] = useState(false);
  const [callPanelOpen, setCallPanelOpen] = useState(false);
  const [linePanelSource, setLinePanelSource] = useState<PanelSource>('sidebar');
  const [callPanelSource, setCallPanelSource] = useState<PanelSource>('sidebar');

  const openContactModal = useCallback(
    (
      source: PanelSource,
      defaultChannel: ContactChannel = 'line',
      trustAssureRequested = false
    ) => {
      setContactSource(source);
      setContactDefaultChannel(defaultChannel);
      setContactTrustAssureRequested(trustAssureRequested);
      setShowContactModal(true);
    },
    []
  );

  const closeContactModal = useCallback(() => {
    setShowContactModal(false);
    setContactTrustAssureRequested(false);
  }, []);

  const openLinePanel = useCallback(
    (source: PanelSource) => {
      setLinePanelSource(source);
      setLinePanelOpen(true);
      trackLineClick();
    },
    [trackLineClick]
  );

  const openCallPanel = useCallback(
    (source: PanelSource) => {
      setCallPanelSource(source);
      setCallPanelOpen(true);
      trackCallClick();
    },
    [trackCallClick]
  );

  const closeLinePanel = useCallback(() => setLinePanelOpen(false), []);
  const closeCallPanel = useCallback(() => setCallPanelOpen(false), []);

  const isActionLocked = linePanelOpen || callPanelOpen || showContactModal;

  return {
    showContactModal,
    contactSource,
    contactDefaultChannel,
    contactTrustAssureRequested,
    linePanelOpen,
    callPanelOpen,
    linePanelSource,
    callPanelSource,
    openContactModal,
    closeContactModal,
    openLinePanel,
    openCallPanel,
    closeLinePanel,
    closeCallPanel,
    isActionLocked,
  };
}
