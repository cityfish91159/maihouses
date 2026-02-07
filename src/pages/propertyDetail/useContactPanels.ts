import { useCallback, useState } from 'react';
import type { ContactChannel } from '../../components/ContactModal';

type PanelSource = 'sidebar' | 'mobile_bar';
type ContactSource = PanelSource | 'booking';

interface ContactPanelsState {
  showContactModal: boolean;
  contactSource: ContactSource;
  contactDefaultChannel: ContactChannel;
  linePanelOpen: boolean;
  callPanelOpen: boolean;
  bookingOpen: boolean;
  linePanelSource: PanelSource;
  callPanelSource: PanelSource;
  bookingSource: ContactSource;
  linePanelSession: number;
  callPanelSession: number;
  bookingPanelSession: number;
}

const INITIAL_STATE: ContactPanelsState = {
  showContactModal: false,
  contactSource: 'sidebar',
  contactDefaultChannel: 'line',
  linePanelOpen: false,
  callPanelOpen: false,
  bookingOpen: false,
  linePanelSource: 'sidebar',
  callPanelSource: 'sidebar',
  bookingSource: 'sidebar',
  linePanelSession: 0,
  callPanelSession: 0,
  bookingPanelSession: 0,
};

export function useContactPanels() {
  const [state, setState] = useState<ContactPanelsState>(INITIAL_STATE);

  const openContactModal = useCallback(
    (source: ContactSource, defaultChannel: ContactChannel = 'line') => {
      setState((prev) => ({
        ...prev,
        showContactModal: true,
        contactSource: source,
        contactDefaultChannel: defaultChannel,
      }));
    },
    []
  );

  const closeContactModal = useCallback(() => {
    setState((prev) => ({ ...prev, showContactModal: false }));
  }, []);

  const openLinePanel = useCallback((source: PanelSource) => {
    setState((prev) => ({
      ...prev,
      linePanelOpen: true,
      linePanelSource: source,
      linePanelSession: prev.linePanelSession + 1,
    }));
  }, []);

  const closeLinePanel = useCallback(() => {
    setState((prev) => ({ ...prev, linePanelOpen: false }));
  }, []);

  const openCallPanel = useCallback((source: PanelSource) => {
    setState((prev) => ({
      ...prev,
      callPanelOpen: true,
      callPanelSource: source,
      callPanelSession: prev.callPanelSession + 1,
    }));
  }, []);

  const closeCallPanel = useCallback(() => {
    setState((prev) => ({ ...prev, callPanelOpen: false }));
  }, []);

  const openBookingPanel = useCallback((source: ContactSource) => {
    setState((prev) => ({
      ...prev,
      bookingOpen: true,
      bookingSource: source,
      bookingPanelSession: prev.bookingPanelSession + 1,
    }));
  }, []);

  const closeBookingPanel = useCallback(() => {
    setState((prev) => ({ ...prev, bookingOpen: false }));
  }, []);

  const isActionLocked =
    state.linePanelOpen || state.callPanelOpen || state.bookingOpen || state.showContactModal;

  return {
    ...state,
    isActionLocked,
    openContactModal,
    closeContactModal,
    openLinePanel,
    closeLinePanel,
    openCallPanel,
    closeCallPanel,
    openBookingPanel,
    closeBookingPanel,
  };
}
