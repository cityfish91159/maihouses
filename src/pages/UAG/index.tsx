import React, { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

import styles from './UAG.module.css';
import { useUAG } from './hooks/useUAG';
import { useWindowSize } from './hooks/useWindowSize';
import { Lead } from './types/uag.types';
import { validateQuota } from './utils/validation';

import { UAGHeader } from './components/UAGHeader';
import { UAGFooter } from './components/UAGFooter';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import MaiCard from './components/MaiCard';
import TrustFlow from './components/TrustFlow';

function UAGPageContent() {
  const { data: appData, isLoading, error, buyLead, isBuying, useMock, toggleMode } = useUAG();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();

  // Handle window resize to close panel on desktop
  useEffect(() => {
    if (width > 768 && selectedLead) {
      // Optional: auto-close or adjust layout
    }
  }, [width, selectedLead]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    if (width <= 1024) {
      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onBuyLead = async (leadId: string) => {
    if (!appData || isBuying) return;

    const lead = appData.leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("客戶不存在");
      return;
    }

    if (lead.status !== 'new') {
      toast.error("此客戶已被購買");
      return;
    }

    const { valid, error } = validateQuota(lead, appData.user);
    if (!valid) {
      toast.error(error || "配額不足");
      return;
    }

    const cost = lead.price || 10;
    if (appData.user.points < cost) {
      toast.error("點數不足");
      return;
    }

    if (!confirm(`確定要花費 ${cost} 點購買此客戶資料嗎？`)) return;

    buyLead({ leadId, cost, grade: lead.grade });
    setSelectedLead(null);
  };

  if (isLoading) return <UAGLoadingSkeleton />;
  if (error) throw error; // Let ErrorBoundary handle it
  if (!appData) return null;

  return (
    <div className={styles['uag-page']}>
      <Toaster position="top-center" />
      <UAGHeader />

      <main className={styles['uag-container']}>
        <div className={styles['uag-grid']}>
          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={handleSelectLead} />

          {/* [Action Panel] */}
          <ActionPanel 
            ref={actionPanelRef}
            selectedLead={selectedLead} 
            onBuyLead={onBuyLead} 
            isProcessing={isBuying} 
          />

          {/* [2] Asset Monitor */}
          <AssetMonitor leads={appData.leads} />

          {/* [3] Listings & [4] Feed */}
          <ListingFeed listings={appData.listings} feed={appData.feed} />

          {/* [5] Mai Card */}
          <MaiCard />

          {/* [6] Trust Flow */}
          <TrustFlow />
        </div>
      </main>

      <UAGFooter user={appData.user} useMock={useMock} toggleMode={toggleMode} />
    </div>
  );
}

export default function UAGPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={UAGErrorState}
        >
          <UAGPageContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

