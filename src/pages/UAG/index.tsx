import React, { useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

import styles from './UAG.module.css';
import { useUAG } from './hooks/useUAG';
import { useLeadSelection } from './hooks/useLeadSelection';
import { useAuth } from '../../hooks/useAuth';

import { UAGHeader } from './components/UAGHeader';
import { UAGFooter } from './components/UAGFooter';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import ReportGenerator from './components/ReportGenerator';
import TrustFlow from './components/TrustFlow';

// MSG-5: 購買成功後發送訊息 Modal
import { SendMessageModal } from '../../components/UAG/SendMessageModal';
import type { Lead } from './types/uag.types';

function UAGPageContent() {
  const { data: appData, isLoading, buyLead, isBuying, useMock, toggleMode } = useUAG();
  const { selectedLead, selectLead, close } = useLeadSelection();
  const { user } = useAuth();
  const actionPanelRef = useRef<HTMLDivElement>(null);

  // MSG-5: Modal 狀態
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);

  const onBuyLead = async (leadId: string) => {
    if (!appData || isBuying) return;

    // 找到被購買的 lead
    const lead = appData.leads.find(l => l.id === leadId);
    if (!lead) return;

    // 執行購買
    buyLead(leadId);
    close();

    // MSG-5: 購買成功後顯示發送訊息 Modal
    setPurchasedLead(lead);
    setShowMessageModal(true);
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setPurchasedLead(null);
  };

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  // MSG-5: 取得 agent_id 和 session_id
  const agentId = user?.id || 'demo-agent';
  // 對於 mock 模式，使用 lead 的 id 作為 session_id
  const sessionId = purchasedLead?.id || 'demo-session';

  return (
    <div className={styles['uag-page']}>
      <UAGHeader />

      <main className={styles['uag-container']}>
        <div className={styles['uag-grid']}>
          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={selectLead} />

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

          {/* [5] 手機報告生成器 */}
          <ReportGenerator listings={appData.listings} />

          {/* [6] Trust Flow */}
          <TrustFlow />
        </div>
      </main>

      <UAGFooter user={appData.user} useMock={useMock} toggleMode={toggleMode} />

      {/* MSG-5: 購買成功後發送訊息 Modal */}
      {purchasedLead && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={handleCloseModal}
          lead={purchasedLead}
          agentId={agentId}
          sessionId={sessionId}
        />
      )}
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
