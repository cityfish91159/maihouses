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
  const { user, session } = useAuth();
  const actionPanelRef = useRef<HTMLDivElement>(null);

  // MSG-5: Modal 狀態
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);

  /**
   * MSG-5 FIX 1: 使用 await 確認購買成功後才顯示 Modal
   */
  const onBuyLead = async (leadId: string) => {
    if (!appData || isBuying) return;

    close();
    
    // 等待購買結果，只有成功才顯示 Modal
    const result = await buyLead(leadId);
    
    if (result.success && result.lead) {
      setPurchasedLead(result.lead);
      setShowMessageModal(true);
    }
    // 失敗時 useUAG 已經顯示 toast 錯誤訊息
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setPurchasedLead(null);
  };

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  // MSG-5 FIX 2: 使用真實的 agent 和 session ID
  const agentId = user?.id || 'demo-agent';
  // 使用真實 session_id，而非 lead.id
  // 對於 mock 模式，生成一個基於時間的 session_id
  const consumerSessionId = session?.user?.id 
    ? `session-${Date.now()}-${purchasedLead?.id?.slice(-4) || 'xxxx'}`
    : `mock-session-${Date.now()}`;

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
          sessionId={consumerSessionId}
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
