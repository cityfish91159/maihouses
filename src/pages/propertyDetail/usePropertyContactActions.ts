import { useCallback } from 'react';
import type { ContactChannel } from '../../components/ContactModal';
import { getTrustScenario, shouldAttachTrustAssureLeadNote } from '../../components/PropertyDetail/trustAssure';
import { track } from '../../analytics/track';
import { logger } from '../../lib/logger';

type PanelSource = 'sidebar' | 'mobile_bar';
type ContactSource = PanelSource | 'booking';

interface UsePropertyContactActionsParams {
  agentId: string;
  propertyPublicId: string;
  propertyAgentId?: string;
  hasLineId: boolean;
  hasPhone: boolean;
  isLoggedIn: boolean;
  isTrustEnabled: boolean;
  linePanelSource: PanelSource;
  callPanelSource: PanelSource;
  openLinePanelState: (source: PanelSource) => void;
  openCallPanelState: (source: PanelSource) => void;
  openBookingPanelState: (source: ContactSource) => void;
  openContactModal: (source: ContactSource, defaultChannel?: ContactChannel) => void;
  setContactTrustAssureRequested: (value: boolean) => void;
  trackLineClick: () => void;
  trackCallClick: () => void;
}

interface UsePropertyContactActionsResult {
  openLinePanel: (source: PanelSource) => void;
  openCallPanel: (source: PanelSource) => void;
  openBookingPanel: (source: ContactSource) => void;
  handleAgentLineClick: () => void;
  handleAgentCallClick: () => void;
  handleAgentBookingClick: () => void;
  handleMobileLineClick: () => void;
  handleMobileCallClick: () => void;
  handleMobileBookingClick: () => void;
  handleFloatingCallClick: () => void;
  handleVipLineClick: () => void;
  handleVipBookingClick: () => void;
  handleLineFallbackContact: (trustAssureChecked: boolean) => void;
  handleCallFallbackContact: (trustAssureChecked: boolean) => void;
}

export function usePropertyContactActions({
  agentId,
  propertyPublicId,
  propertyAgentId,
  hasLineId,
  hasPhone,
  isLoggedIn,
  isTrustEnabled,
  linePanelSource,
  callPanelSource,
  openLinePanelState,
  openCallPanelState,
  openBookingPanelState,
  openContactModal,
  setContactTrustAssureRequested,
  trackLineClick,
  trackCallClick,
}: UsePropertyContactActionsParams): UsePropertyContactActionsResult {
  const toAnalyticsSource = useCallback(
    (source: ContactSource): 'sidebar' | 'mobile' => (source === 'mobile_bar' ? 'mobile' : 'sidebar'),
    []
  );

  const trackLineAction = useCallback(
    (source: PanelSource) => {
      void track('line_click', {
        has_line_id: hasLineId,
        source: toAnalyticsSource(source),
      });
      logger.info('audit.contact.line', {
        source,
        hasLineId,
        propertyId: propertyPublicId,
        agentId: propertyAgentId ?? agentId,
      });
      trackLineClick();
    },
    [agentId, hasLineId, propertyAgentId, propertyPublicId, toAnalyticsSource, trackLineClick]
  );

  const trackCallAction = useCallback(
    (source: PanelSource) => {
      void track('call_click', {
        has_phone: hasPhone,
        source: toAnalyticsSource(source),
      });
      logger.info('audit.contact.call', {
        source,
        hasPhone,
        propertyId: propertyPublicId,
        agentId: propertyAgentId ?? agentId,
      });
      trackCallClick();
    },
    [agentId, hasPhone, propertyAgentId, propertyPublicId, toAnalyticsSource, trackCallClick]
  );

  const trackBookingAction = useCallback(
    (source: ContactSource) => {
      void track('booking_click', {
        source: toAnalyticsSource(source),
      });
      logger.info('audit.contact.booking', {
        source,
        propertyId: propertyPublicId,
        agentId: propertyAgentId ?? agentId,
      });
    },
    [agentId, propertyAgentId, propertyPublicId, toAnalyticsSource]
  );

  const openLinePanel = useCallback(
    (source: PanelSource) => {
      openLinePanelState(source);
      trackLineAction(source);
    },
    [openLinePanelState, trackLineAction]
  );

  const openCallPanel = useCallback(
    (source: PanelSource) => {
      openCallPanelState(source);
      trackCallAction(source);
    },
    [openCallPanelState, trackCallAction]
  );

  const openBookingPanel = useCallback(
    (source: ContactSource) => {
      openBookingPanelState(source);
      trackBookingAction(source);
    },
    [openBookingPanelState, trackBookingAction]
  );

  const shouldAttachContactTrustAssure = useCallback(
    (trustAssureChecked: boolean): boolean => {
      const scenario = getTrustScenario(isLoggedIn, isTrustEnabled);
      return shouldAttachTrustAssureLeadNote(scenario, trustAssureChecked);
    },
    [isLoggedIn, isTrustEnabled]
  );

  const handleLineFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      setContactTrustAssureRequested(shouldAttachContactTrustAssure(trustAssureChecked));
      openContactModal(linePanelSource, 'line');
    },
    [
      linePanelSource,
      openContactModal,
      setContactTrustAssureRequested,
      shouldAttachContactTrustAssure,
    ]
  );

  const handleCallFallbackContact = useCallback(
    (trustAssureChecked: boolean) => {
      setContactTrustAssureRequested(shouldAttachContactTrustAssure(trustAssureChecked));
      openContactModal(callPanelSource, 'phone');
    },
    [
      callPanelSource,
      openContactModal,
      setContactTrustAssureRequested,
      shouldAttachContactTrustAssure,
    ]
  );

  const handleAgentLineClick = useCallback(() => {
    openLinePanel('sidebar');
  }, [openLinePanel]);

  const handleAgentCallClick = useCallback(() => {
    openCallPanel('sidebar');
  }, [openCallPanel]);

  const handleAgentBookingClick = useCallback(() => {
    openBookingPanel('sidebar');
  }, [openBookingPanel]);

  const handleMobileLineClick = useCallback(() => {
    openLinePanel('mobile_bar');
  }, [openLinePanel]);

  const handleMobileCallClick = useCallback(() => {
    openCallPanel('mobile_bar');
  }, [openCallPanel]);

  const handleMobileBookingClick = useCallback(() => {
    openBookingPanel('mobile_bar');
  }, [openBookingPanel]);

  const handleFloatingCallClick = useCallback(() => {
    openCallPanel('mobile_bar');
  }, [openCallPanel]);

  const handleVipLineClick = useCallback(() => {
    openLinePanel('mobile_bar');
  }, [openLinePanel]);

  const handleVipBookingClick = useCallback(() => {
    openBookingPanel('booking');
  }, [openBookingPanel]);

  return {
    openLinePanel,
    openCallPanel,
    openBookingPanel,
    handleAgentLineClick,
    handleAgentCallClick,
    handleAgentBookingClick,
    handleMobileLineClick,
    handleMobileCallClick,
    handleMobileBookingClick,
    handleFloatingCallClick,
    handleVipLineClick,
    handleVipBookingClick,
    handleLineFallbackContact,
    handleCallFallbackContact,
  };
}
