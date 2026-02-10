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
import type { UAGMobileTab } from './components/UAGTabBar';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import ReportGenerator from './components/ReportGenerator';
import TrustFlow from './components/TrustFlow';
import { useWindowSize } from './hooks/useWindowSize';

// MSG-5: 購買成功後發送訊息 Modal
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

  // MSG-5: Modal 狀態
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);
  // MSG-5 FIX: 保存購買後回傳的 conversation_id (UAG-13)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  // Header signOut 狀態
  const [isSigningOut, setIsSigningOut] = useState(false);

  // 修9: AssetMonitor 發送訊息狀態
  const [assetMessageLead, setAssetMessageLead] = useState<Lead | null>(null);
  const [showAssetMessageModal, setShowAssetMessageModal] = useState(false);
  const [activeTab, setActiveTab] = useState<UAGMobileTab>('overview');

  // 修9: AssetMonitor 回調
  const handleSendMessageFromAsset = useCallback((lead: Lead) => {
    setAssetMessageLead(lead);
    setShowAssetMessageModal(true);
  }, []);

  const handleViewChat = useCallback(
    (conversationId: string) => {
      // Mock 模式下的聊天室導航處理
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

  // 修9: AssetMonitor 發送訊息成功回調
  const handleAssetMessageSuccess = useCallback(
    (conversationId?: string) => {
      if (!assetMessageLead) return;

      // 更新 React Query cache - 設置 conversation_id 和 notification_status
      queryClient.setQueryData<AppData>(['uagData', useMock, user?.id], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === assetMessageLead.id) {
              // Mock 模式：生成 Mock conversation ID
              // API 模式：使用後端返回的 conversationId
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

      // 關閉 Modal
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

  /**
   * MSG-5 FIX 1: 使用 await 確認購買成功後才顯示 Modal
   */
  const onBuyLead = useCallback(
    async (leadId: string) => {
      if (!appData || isBuying) return;

      close();

      // 等待購買結果，只有成功才顯示 Modal
      const result = await buyLead(leadId);

      if (result.success && result.lead) {
        setPurchasedLead(result.lead);
        // UAG-13: 如果有回傳 conversation_id，存起來傳給 Modal
        setCurrentConversationId(result.conversation_id);
        setShowMessageModal(true);
      }
      // 失敗時 useUAG 已經顯示 toast 錯誤訊息
    },
    [appData, isBuying, close, buyLead]
  );

  const handleCloseModal = useCallback(() => {
    setShowMessageModal(false);
    setPurchasedLead(null);
    setCurrentConversationId(undefined);
  }, []);

  // 發送訊息成功的回調（Mock 和 API 模式都會調用）
  const handleMessageSentSuccess = useCallback(
    (conversationId?: string) => {
      if (!purchasedLead) return;

      // 更新 React Query cache - 設置 conversation_id 和 notification_status
      queryClient.setQueryData<AppData>(['uagData', useMock, user?.id], (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === purchasedLead.id) {
              // Mock 模式：生成 Mock conversation ID
              // API 模式：使用後端返回的 conversationId（如果有的話）
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

      // 關閉 Modal
      setShowMessageModal(false);
      setPurchasedLead(null);
      setCurrentConversationId(undefined);
    },
    [purchasedLead, queryClient, useMock, user?.id]
  );

  // FEED-01 Phase 10: 從 feed 提取可用社區列表（去重）
  // 注意：必須在所有 early return 之前呼叫 hooks
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

  // FEED-01 Phase 10: 發文處理函數
  const handleCreatePost = useCallback(
    async (content: string, communityId: string) => {
      try {
        await createPost(communityId, content, 'public');
        // 成功後重新載入資料
        queryClient.invalidateQueries({ queryKey: ['uagData'] });
      } catch (err) {
        const message = err instanceof Error ? err.message : '發文失敗';
        logger.error('[UAG] handleCreatePost failed', { error: message });
        throw err; // 讓 ListingFeed 顯示錯誤
      }
    },
    [queryClient]
  );

  // Profile navigation (must be before early return)
  const profileHref = useMock ? `${ROUTES.UAG_PROFILE}?mock=true` : ROUTES.UAG_PROFILE;
  const handleOpenProfile = useCallback(() => {
    navigate(profileHref);
  }, [navigate, profileHref]);

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  /**
   * 問題 #10-11 修復：不使用假數據 fallback
   * 如果沒有真實的 user.id 或 session_id，不應該嘗試建立對話
   * UAG-15 FIX: Mock 模式下使用 Mock agentId 以支援測試
   */
  const agentId = user?.id ?? (useMock ? 'mock-agent-001' : undefined);
  // UAG-14: 取得房仲名稱（優先使用 user_metadata.full_name，fallback 到 email 前綴）
  // [NASA TypeScript Safety] 使用類型守衛取代 as Record
  const agentName = (() => {
    const metadata = user?.user_metadata;
    if (metadata && typeof metadata === 'object' && 'full_name' in metadata) {
      const fullName = metadata.full_name;
      if (typeof fullName === 'string' && fullName) return fullName;
    }
    return user?.email?.split('@')[0] ?? '房仲';
  })();
  // 使用 lead 的 session_id（來自消費者瀏覽記錄）
  const consumerSessionId = purchasedLead?.session_id;

  // 問題 #10-11 修復：判斷是否可以發送訊息
  const canSendMessage = Boolean(agentId && consumerSessionId);

  const renderMobileTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className={styles['uag-mobile-content']}>
            <RadarCluster leads={appData.leads} onSelectLead={selectLead} />
            <ActionPanel
              ref={actionPanelRef}
              selectedLead={selectedLead}
              onBuyLead={onBuyLead}
              isProcessing={isBuying}
            />
          </div>
        );
      case 'leads':
        return (
          <div className={styles['uag-mobile-content']}>
            <ListingFeed
              listings={appData.listings}
              feed={appData.feed}
              onCreatePost={handleCreatePost}
              availableCommunities={availableCommunities}
            />
            <ReportGenerator listings={appData.listings} agentName={agentName} />
          </div>
        );
      case 'monitor':
        return (
          <div className={styles['uag-mobile-content']}>
            <AssetMonitor
              leads={appData.leads}
              onSendMessage={handleSendMessageFromAsset}
              onViewChat={handleViewChat}
            />
            <TrustFlow toggleMode={toggleMode} />
          </div>
        );
      case 'settings':
        return (
          <section className={`${styles['uag-card']} ${styles['uag-mobile-settings']}`}>
            <div className={styles['uag-mobile-settings-header']}>
              <div className={styles['uag-mobile-settings-title']}>工作台設定</div>
              <div className={styles['uag-mobile-settings-sub']}>管理模式、方案與個人資料入口</div>
            </div>

            <div className={styles['uag-mobile-settings-mode']}>
              <span>系統模式</span>
              <strong
                className={useMock ? styles['uag-footer-mode-mock'] : styles['uag-footer-mode-live']}
              >
                {useMock ? 'Local Mock' : 'Live API'}
              </strong>
              <button type="button" className={styles['uag-mode-toggle']} onClick={toggleMode}>
                切換模式
              </button>
            </div>

            <div className={styles['uag-mobile-settings-actions']}>
              <button type="button" className={styles['uag-btn']}>
                方案設定
              </button>
              <button type="button" className={`${styles['uag-btn']} ${styles['primary']}`}>
                加值點數
              </button>
              <button
                type="button"
                className={`${styles['uag-btn']} ${styles['uag-btn-link']}`}
                onClick={handleOpenProfile}
              >
                個人資料
              </button>
            </div>

            <div className={styles['uag-mobile-settings-points']}>
              點數餘額 <strong>{appData.user.points}</strong>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles['uag-page']}>
      <UAGHeader
        user={user}
        agentProfile={agentProfile}
        isLoading={authLoading}
        error={authError}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
        useMock={useMock} // #6 傳入 Mock 模式狀態
      />

      <main className={styles['uag-container']}>
        {isMobileLayout ? (
          renderMobileTabContent()
        ) : (
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
            <AssetMonitor
              leads={appData.leads}
              onSendMessage={handleSendMessageFromAsset}
              onViewChat={handleViewChat}
            />

            {/* [3] Listings & [4] Feed */}
            <ListingFeed
              listings={appData.listings}
              feed={appData.feed}
              onCreatePost={handleCreatePost}
              availableCommunities={availableCommunities}
            />

            {/* [5] 手機報告生成器 */}
            <ReportGenerator listings={appData.listings} agentName={agentName} />

            {/* [6] Trust Flow */}
            <TrustFlow toggleMode={toggleMode} />
          </div>
        )}
      </main>

      {isMobileLayout ? (
        <UAGTabBar activeTab={activeTab} onTabChange={setActiveTab} />
      ) : (
        <UAGFooter user={appData.user} useMock={useMock} toggleMode={toggleMode} />
      )}

      {/* MSG-5: 購買成功後發送訊息 Modal */}
      {/* 問題 #10-11 修復：只有在有真實 agentId 和 sessionId 時才渲染 */}
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
          })} // UAG-13 Safe
          {...(purchasedLead.property_id ? { propertyId: purchasedLead.property_id } : {})}
        />
      )}

      {/* 修9: AssetMonitor 發送訊息 Modal */}
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
