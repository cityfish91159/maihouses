import { ContactModal, type ContactChannel } from '../../components/ContactModal';
import {
  CallConfirmPanel,
  LineLinkPanel,
  MobileActionBar,
  VipModal,
} from '../../components/PropertyDetail';
import type { PropertyData } from '../../services/propertyService';

interface SocialProof {
  socialProof: {
    currentViewers: number;
    trustCasesCount: number;
    isHot: boolean;
  };
}

interface MobileActionLayerProps extends SocialProof {
  isActionLocked: boolean;
  onMobileLineClick: () => void;
  onMobileCallClick: () => void;
}

interface LinePanelLayerProps {
  linePanelSession: number;
  linePanelOpen: boolean;
  onCloseLinePanel: () => void;
  onLineTrustAction: (checked: boolean) => Promise<void>;
  onLineFallbackContact: (trustAssureChecked: boolean) => void;
}

interface CallPanelLayerProps {
  callPanelSession: number;
  callPanelOpen: boolean;
  onCloseCallPanel: () => void;
  onCallTrustAction: (checked: boolean) => Promise<void>;
  onCallFallbackContact: (trustAssureChecked: boolean) => void;
}

interface ContactModalLayerProps {
  showContactModal: boolean;
  contactSource: 'sidebar' | 'mobile_bar';
  contactDefaultChannel: ContactChannel;
  contactTrustAssureRequested: boolean;
  onCloseContactModal: () => void;
}

interface VipLayerProps {
  showVipModal: boolean;
  onCloseVipModal: () => void;
  onVipLineClick: () => void;
  onVipCallClick: () => void;
  vipReason: string;
}

interface PropertyDetailActionLayerProps {
  property: PropertyData;
  agentId: string;
  isLoggedIn: boolean;
  isTrustEnabled: boolean;
  mobileActions: MobileActionLayerProps;
  linePanel: LinePanelLayerProps;
  callPanel: CallPanelLayerProps;
  contactModalLayer: ContactModalLayerProps;
  vipLayer: VipLayerProps;
}

export function PropertyDetailActionLayer({
  property,
  agentId,
  isLoggedIn,
  isTrustEnabled,
  mobileActions,
  linePanel,
  callPanel,
  contactModalLayer,
  vipLayer,
}: PropertyDetailActionLayerProps) {
  return (
    <>
      <MobileActionBar
        onLineClick={mobileActions.onMobileLineClick}
        onCallClick={mobileActions.onMobileCallClick}
        socialProof={mobileActions.socialProof}
        trustEnabled={property.trustEnabled ?? false}
        isVerified={property.isDemo ? true : (property.agent?.isVerified ?? false)}
        isActionLocked={mobileActions.isActionLocked}
      />

      <LineLinkPanel
        key={`line-panel-${linePanel.linePanelSession}`}
        isOpen={linePanel.linePanelOpen}
        onClose={linePanel.onCloseLinePanel}
        agentLineId={property.agent?.lineId ?? null}
        agentName={property.agent?.name || '專屬業務'}
        isLoggedIn={isLoggedIn}
        trustEnabled={isTrustEnabled}
        onTrustAction={linePanel.onLineTrustAction}
        onFallbackContact={linePanel.onLineFallbackContact}
      />

      <CallConfirmPanel
        key={`call-panel-${callPanel.callPanelSession}`}
        isOpen={callPanel.callPanelOpen}
        onClose={callPanel.onCloseCallPanel}
        agentPhone={property.agent?.phone ?? null}
        agentName={property.agent?.name || '專屬業務'}
        isLoggedIn={isLoggedIn}
        trustEnabled={isTrustEnabled}
        onTrustAction={callPanel.onCallTrustAction}
        onFallbackContact={callPanel.onCallFallbackContact}
      />

      <ContactModal
        key={contactModalLayer.contactDefaultChannel}
        isOpen={contactModalLayer.showContactModal}
        onClose={contactModalLayer.onCloseContactModal}
        propertyId={property.publicId}
        propertyTitle={property.title}
        agentId={property.agent?.id || agentId}
        agentName={property.agent?.name || '專屬業務'}
        source={contactModalLayer.contactSource}
        defaultChannel={contactModalLayer.contactDefaultChannel}
        trustAssureRequested={contactModalLayer.contactTrustAssureRequested}
      />

      <VipModal
        isOpen={vipLayer.showVipModal}
        onClose={vipLayer.onCloseVipModal}
        onLineClick={vipLayer.onVipLineClick}
        onCallClick={vipLayer.onVipCallClick}
        reason={vipLayer.vipReason}
      />
    </>
  );
}
