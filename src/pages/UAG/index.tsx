import React, { useCallback, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { createPost } from '../../services/communityService';
import type { AppData } from './types/uag.types';

import styles from './UAG.module.css';
import { useUAG } from './hooks/useUAG';
import { useLeadSelection } from './hooks/useLeadSelection';
import { useAgentProfile } from './hooks/useAgentProfile';
import { useAuth } from '../../hooks/useAuth';

import { UAGHeader } from './components/UAGHeader';
import { UAGFooter } from './components/UAGFooter';
import { UAGTabBar } from './components/UAGTabBar';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import ReportGenerator from './components/ReportGenerator';
import TrustFlow from './components/TrustFlow';
import { useWindowSize } from './hooks/useWindowSize';

import { SendMessageModal } from '../../components/UAG/SendMessageModal';
import type { Lead } from './types/uag.types';

function UAGPageContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: appData, isLoading, buyLead, isBuying, useMock, toggleMode } = useUAG();
  const { selectedLead, selectLead, close } = useLeadSelection();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const { profile: agentProfile } = useAgentProfile(user?.id);
  const { width } = useWindowSize();
  const isMobileLayout = width < 768;
  const actionPanelRef = useRef<HTMLDivElement>(null);

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [assetMessageLead, setAssetMessageLead] = useState<Lead | null>(null);
  const [showAssetMessageModal, setShowAssetMessageModal] = useState(false);

  const handleSendMessageFromAsset = useCallback((lead: Lead) => {
    setAssetMessageLead(lead);
    setShowAssetMessageModal(true);
  }, []);

  const handleViewChat = useCallback(
    (conversationId: string) => {
      if (useMock && conversationId.startsWith('mock-conv-')) {
        notify.info('Mock 模式', '聊天室功能需要切換到 Live 模式');
        return;
      }
      navigate(ROUTES.CHAT(conversationId));
    },
    [navigate, useMock]
  );

  const handleCloseAssetModal = useCallback(() => {
    setShowAssetMessageModal(false);
    setAssetMessageLead(null);
  }, []);

  const handleAssetMessageSuccess = useCallback(
    (conversationId?: string) => {
      if (!assetMessageLead) return;

      queryClient.setQueryData<AppData>(['uagData', useMock, user?.id], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === assetMessageLead.id) {
              const finalConversationId =
                conversationId ||
                (useMock ? `mock-conv-${assetMessageLead.id}-${Date.now()}` : undefined);

              return {
                ...item,
                conversation_id: finalConversationId,
                notification_status: 'sent' as const,
              };
            }
            return item;
          }),
        };
      });

      setShowAssetMessageModal(false);
      setAssetMessageLead(null);
    },
    [assetMessageLead, queryClient, useMock, user?.id]
  );

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const onBuyLead = useCallback(
    async (leadId: string) => {
      if (!appData || isBuying) return;

      close();

      const result = await buyLead(leadId);

      if (result.success && result.lead) {
        setPurchasedLead(result.lead);
        setCurrentConversationId(result.conversation_id);
        setShowMessageModal(true);
      }
    },
    [appData, isBuying, close, buyLead]
  );

  const handleCloseModal = useCallback(() => {
    setShowMessageModal(false);
    setPurchasedLead(null);
    setCurrentConversationId(undefined);
  }, []);

  const handleMessageSentSuccess = useCallback(
    (conversationId?: string) => {
      if (!purchasedLead) return;

      queryClient.setQueryData<AppData>(['uagData', useMock, user?.id], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === purchasedLead.id) {
              const finalConversationId =
                conversationId ||
                (useMock ? `mock-conv-${purchasedLead.id}-${Date.now()}` : undefined);

              return {
                ...item,
                conversation_id: finalConversationId,
                notification_status: 'sent' as const,
              };
            }
            return item;
          }),
        };
      });

      setShowMessageModal(false);
      setPurchasedLead(null);
      setCurrentConversationId(undefined);
    },
    [purchasedLead, queryClient, useMock, user?.id]
  );

  const availableCommunities = React.useMemo(() => {
    if (!appData) return [];
    const communityMap = new Map<string, string>();
    for (const post of appData.feed) {
      if (post.communityId && post.communityName) {
        communityMap.set(post.communityId, post.communityName);
      }
    }
    return Array.from(communityMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [appData]);

  const handleCreatePost = useCallback(
    async (content: string, communityId: string) => {
      try {
        await createPost(communityId, content, 'public');
        queryClient.invalidateQueries({ queryKey: ['uagData'] });
      } catch (err) {
        const message = err instanceof Error ? err.message : '發文失敗';
        logger.error('[UAG] handleCreatePost failed', { error: message });
        throw err;
      }
    },
    [queryClient]
  );

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  const agentId = user?.id ?? (useMock ? 'mock-agent-001' : undefined);
  const agentName = (() => {
    const metadata = user?.user_metadata;
    if (metadata && typeof metadata === 'object' && 'full_name' in metadata) {
      const fullName = metadata.full_name;
      if (typeof fullName === 'string' && fullName) return fullName;
    }
    return user?.email?.split('@')[0] ?? '房仲';
  })();
  const consumerSessionId = purchasedLead?.session_id;
  const canSendMessage = Boolean(agentId && consumerSessionId);

  return (
    <div className={styles['uag-page']}>
      <UAGHeader
        user={user}
        agentProfile={agentProfile}
        isLoading={authLoading}
        error={authError}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        useMock={useMock}
      />

      <main className={styles['uag-container']}>
        <div className={styles['uag-grid']}>
          {/* 區塊 1: 概覽（Radar + ActionPanel） */}
          <section id="uag-section-overview" className={styles['uag-anchor-section']}>
            <RadarCluster leads={appData.leads} onSelectLead={selectLead} />
            <ActionPanel
              ref={actionPanelRef}
              selectedLead={selectedLead}
              onBuyLead={onBuyLead}
              isProcessing={isBuying}
            />
          </section>

          {/* 區塊 2: 商機（Listings + Feed + Report） */}
          <section id="uag-section-leads" className={styles['uag-anchor-section']}>
            <ListingFeed
              listings={appData.listings}
              feed={appData.feed}
              onCreatePost={handleCreatePost}
              availableCommunities={availableCommunities}
            />
            <ReportGenerator listings={appData.listings} agentName={agentName} />
          </section>

          {/* 區塊 3: 監控（AssetMonitor + TrustFlow） */}
          <section id="uag-section-monitor" className={styles['uag-anchor-section']}>
            <AssetMonitor
              leads={appData.leads}
              onSendMessage={handleSendMessageFromAsset}
              onViewChat={handleViewChat}
            />
            <TrustFlow toggleMode={toggleMode} />
          </section>
        </div>
      </main>

      {isMobileLayout ? (
        <UAGTabBar />
      ) : (
        <UAGFooter user={appData.user} useMock={useMock} />
      )}

      {purchasedLead && canSendMessage && agentId && consumerSessionId && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={handleCloseModal}
          onSuccess={handleMessageSentSuccess}
          lead={purchasedLead}
          agentId={agentId}
          sessionId={consumerSessionId}
          agentName={agentName}
          {...(currentConversationId && {
            conversationId: currentConversationId,
          })}
          {...(purchasedLead.property_id ? { propertyId: purchasedLead.property_id } : {})}
        />
      )}

      {assetMessageLead && agentId && (
        <SendMessageModal
          isOpen={showAssetMessageModal}
          onClose={handleCloseAssetModal}
          onSuccess={handleAssetMessageSuccess}
          lead={assetMessageLead}
          agentId={agentId}
          sessionId={assetMessageLead.session_id}
          agentName={agentName}
          {...(assetMessageLead.conversation_id && {
            conversationId: assetMessageLead.conversation_id,
          })}
          {...(assetMessageLead.property_id ? { propertyId: assetMessageLead.property_id } : {})}
        />
      )}
    </div>
  );
}

export default function UAGPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={UAGErrorState}>
          <UAGPageContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
