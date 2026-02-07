import { FileText, Phone } from 'lucide-react';
import { ContactModal, type ContactChannel } from '../../components/ContactModal';
import {
  BookingModal,
  CallConfirmPanel,
  LineLinkPanel,
  MobileActionBar,
  VipModal,
} from '../../components/PropertyDetail';
import { ReportGenerator } from '../Report';
import type { PropertyData } from '../../services/propertyService';

interface SocialProof {
  socialProof: {
    currentViewers: number;
    weeklyBookings: number;
    isHot: boolean;
  };
}

interface MobileActionLayerProps extends SocialProof {
  isActionLocked: boolean;
  onFloatingCallClick: () => void;
  onMobileLineClick: () => void;
  onMobileCallClick: () => void;
  onMobileBookingClick: () => void;
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

interface BookingPanelLayerProps {
  bookingPanelSession: number;
  bookingOpen: boolean;
  onCloseBookingPanel: () => void;
  onBookingTrustAction: (checked: boolean) => Promise<void>;
  onBookingSubmit: (payload: {
    selectedSlot: string;
    phone: string;
    trustAssureChecked: boolean;
  }) => Promise<void>;
}

interface ContactModalLayerProps {
  showContactModal: boolean;
  contactSource: 'sidebar' | 'mobile_bar' | 'booking';
  contactDefaultChannel: ContactChannel;
  contactTrustAssureRequested: boolean;
  onCloseContactModal: () => void;
}

interface VipLayerProps {
  showVipModal: boolean;
  onCloseVipModal: () => void;
  onVipLineClick: () => void;
  onVipBookingClick: () => void;
  vipReason: string;
}

interface ReportLayerProps {
  showReportGenerator: boolean;
  onOpenReportGenerator: () => void;
  onCloseReportGenerator: () => void;
}

interface PropertyDetailActionLayerProps {
  property: PropertyData;
  agentId: string;
  isLoggedIn: boolean;
  isTrustEnabled: boolean;
  mobileActions: MobileActionLayerProps;
  linePanel: LinePanelLayerProps;
  callPanel: CallPanelLayerProps;
  bookingPanel: BookingPanelLayerProps;
  contactModalLayer: ContactModalLayerProps;
  vipLayer: VipLayerProps;
  reportLayer: ReportLayerProps;
}

export function PropertyDetailActionLayer({
  property,
  agentId,
  isLoggedIn,
  isTrustEnabled,
  mobileActions,
  linePanel,
  callPanel,
  bookingPanel,
  contactModalLayer,
  vipLayer,
  reportLayer,
}: PropertyDetailActionLayerProps) {
  return (
    <>
      <button
        onClick={mobileActions.onFloatingCallClick}
        aria-label="30秒回電"
        className="fixed bottom-8 right-4 z-40 hidden size-16 flex-col items-center justify-center rounded-full bg-brand-700 text-xs font-bold text-white shadow-2xl transition-colors hover:bg-brand-600 motion-reduce:transition-none lg:flex"
      >
        <Phone size={22} />
        <span className="mt-0.5 text-xs">30秒回電</span>
      </button>

      <MobileActionBar
        onLineClick={mobileActions.onMobileLineClick}
        onCallClick={mobileActions.onMobileCallClick}
        onBookingClick={mobileActions.onMobileBookingClick}
        socialProof={mobileActions.socialProof}
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

      <BookingModal
        key={`booking-panel-${bookingPanel.bookingPanelSession}`}
        isOpen={bookingPanel.bookingOpen}
        onClose={bookingPanel.onCloseBookingPanel}
        agentName={property.agent?.name || '專屬業務'}
        isLoggedIn={isLoggedIn}
        trustEnabled={isTrustEnabled}
        onTrustAction={bookingPanel.onBookingTrustAction}
        onSubmitBooking={bookingPanel.onBookingSubmit}
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
        onBookingClick={vipLayer.onVipBookingClick}
        reason={vipLayer.vipReason}
      />

      <button
        onClick={reportLayer.onOpenReportGenerator}
        aria-label="生成物件報告"
        className="group fixed bottom-24 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-700 to-brand-light text-white shadow-lg transition-all hover:shadow-xl motion-reduce:transition-none"
        title="生成物件報告"
      >
        <FileText size={24} />
        <span className="sr-only">生成物件報告</span>
        <span
          aria-hidden="true"
          className="absolute right-full mr-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 sm:block"
        >
          生成報告
        </span>
      </button>

      <ReportGenerator
        property={{
          id: property.id,
          publicId: property.publicId,
          title: property.title,
          price: property.price,
          address: property.address,
          description: property.description,
          images: property.images,
          agent: {
            id: property.agent.id,
            name: property.agent.name,
            avatarUrl: property.agent.avatarUrl,
            company: property.agent.company,
            trustScore: property.agent.trustScore,
            reviewCount: property.agent.encouragementCount,
          },
        }}
        isOpen={reportLayer.showReportGenerator}
        onClose={reportLayer.onCloseReportGenerator}
      />
    </>
  );
}
