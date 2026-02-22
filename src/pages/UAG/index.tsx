import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES, RouteUtils } from '../../constants/routes';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { getErrorMessage } from '../../lib/error';
import { safeSessionStorage } from '../../lib/safeStorage';
import { createPost } from '../../services/communityService';
import type { AppData } from './types/uag.types';
import { createMockConversationId, isMockConversationId } from './uag-config';

import styles from './UAG.module.css';
import { useUAG } from './hooks/useUAG';
import { useLeadSelection } from './hooks/useLeadSelection';
import { useAgentProfile } from './hooks/useAgentProfile';
import { uagDataQueryKey } from './hooks/queryKeys';
import { useAuth } from '../../hooks/useAuth';
import { usePageModeWithAuthState } from '../../hooks/usePageMode';
import { UAGLandingPage } from './UAGLandingPage';

import { UAGHeader } from './components/UAGHeader';
import { UAGFooter } from './components/UAGFooter';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import { MockChatModal } from './components/MockChatModal';
import ListingFeed from './components/ListingFeed';
import { UAGEmptyState } from './components/UAGEmptyState';
import ReportGenerator from './components/ReportGenerator';
import TrustFlow from './components/TrustFlow';

// MSG-5: 購買成功後發送訊息 Modal
import { SendMessageModal } from '../../components/UAG/SendMessageModal';
import type { Lead } from './types/uag.types';

const UAG_WELCOME_DISMISSED_KEY = 'uag-welcome-dismissed';

function UAGPageContent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: appData, isLoading, buyLead, isBuying, useMock, mode } = useUAG();
  const { selectedLead, selectLead, close } = useLeadSelection();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const { profile: agentProfile } = useAgentProfile(user?.id);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const uagCacheKey = useMemo(() => uagDataQueryKey(mode, user?.id), [mode, user?.id]);
  const [welcomeDismissed, setWelcomeDismissed] = useState(
    () => safeSessionStorage.getItem(UAG_WELCOME_DISMISSED_KEY) === '1'
  );

  // MSG-5: Modal 狀態
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);
  // MSG-5 FIX: 保存購買後回傳的 conversation_id (UAG-13)
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(undefined);
  // Header signOut 狀態
  const [isSigningOut, setIsSigningOut] = useState(false);
  // M8: 購買結果微互動
  const [purchaseResult, setPurchaseResult] = useState<'success' | 'error' | null>(null);

  // 修9: AssetMonitor 發送訊息狀態
  const [assetMessageLead, setAssetMessageLead] = useState<Lead | null>(null);
  const [mockChatLead, setMockChatLead] = useState<Lead | null>(null);
  const [mockChatConversationId, setMockChatConversationId] = useState('');

  // 修9: AssetMonitor 回調
  const handleSendMessageFromAsset = useCallback((lead: Lead) => {
    setAssetMessageLead(lead);
  }, []);

  const handleViewChat = useCallback(
    (conversationId: string) => {
      // #24a: demo 模式改為 UAG 內嵌 Mock 對話，不跳轉 Chat 頁面
      if (useMock && isMockConversationId(conversationId)) {
        const targetLead =
          appData?.leads.find((leadItem) => leadItem.conversation_id === conversationId) ?? null;
        if (!targetLead) {
          notify.warning('找不到對話資料', '此對話資料尚未同步，請稍後再試。');
          return;
        }
        setMockChatLead(targetLead);
        setMockChatConversationId(conversationId);
        return;
      }
      navigate(RouteUtils.toNavigatePath(ROUTES.CHAT(conversationId)));
    },
    [appData?.leads, navigate, useMock]
  );

  const handleCloseAssetModal = useCallback(() => {
    setAssetMessageLead(null);
  }, []);

  const handleCloseMockChatModal = useCallback(() => {
    setMockChatLead(null);
    setMockChatConversationId('');
  }, []);

  const handleDismissWelcome = useCallback(() => {
    setWelcomeDismissed(true);
    safeSessionStorage.setItem(UAG_WELCOME_DISMISSED_KEY, '1');
  }, []);

  // 修9: AssetMonitor 發送訊息成功回調
  const handleAssetMessageSuccess = useCallback(
    (conversationId?: string) => {
      if (!assetMessageLead) return;

      // 更新 React Query cache - 設置 conversation_id 和 notification_status
      queryClient.setQueryData<AppData>(uagCacheKey, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === assetMessageLead.id) {
              // Mock 模式：生成 Mock conversation ID
              // API 模式：使用後端返回的 conversationId
              const finalConversationId =
                conversationId ||
                (useMock ? createMockConversationId(assetMessageLead.id) : undefined);

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
      setAssetMessageLead(null);
    },
    [assetMessageLead, queryClient, uagCacheKey, useMock]
  );

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      logger.error('[UAG] 登出失敗', { error: err });
      notify.error('登出失敗', '請稍後再試');
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut]);

  /**
   * MSG-5 FIX 1: 使用 await 確認購買成功後才顯示 Modal
   */
  const onBuyLead = useCallback(
    async (leadId: string) => {
      if (!appData || isBuying) return;

      close();
      setPurchaseResult(null);

      // 等待購買結果，只有成功才顯示 Modal
      const result = await buyLead(leadId);

      if (result.success && result.lead) {
        setPurchaseResult('success');
        setPurchasedLead(result.lead);
        setCurrentConversationId(result.conversation_id);
        setShowMessageModal(true);
      } else {
        setPurchaseResult('error');
      }
      // 動畫結束後清除狀態
      setTimeout(() => setPurchaseResult(null), 500);
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
      queryClient.setQueryData<AppData>(uagCacheKey, (oldData) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          leads: oldData.leads.map((item) => {
            if (item.id === purchasedLead.id) {
              // Mock 模式：生成 Mock conversation ID
              // API 模式：使用後端返回的 conversationId（如果有的話）
              const finalConversationId =
                conversationId ||
                (useMock ? createMockConversationId(purchasedLead.id) : undefined);

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
    [purchasedLead, queryClient, uagCacheKey, useMock]
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
        queryClient.invalidateQueries({ queryKey: uagCacheKey });
      } catch (err) {
        const message = getErrorMessage(err);
        logger.error('[UAG] 建立貼文失敗', { error: message });
        throw err; // 讓 ListingFeed 顯示錯誤
      }
    },
    [queryClient, uagCacheKey]
  );

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  const showWelcome =
    appData.leads.length === 0 && appData.listings.length === 0 && !welcomeDismissed;

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
        <div className={styles['uag-grid']}>
          {showWelcome && <UAGEmptyState onDismiss={handleDismissWelcome} />}

          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={selectLead} />

          {/* [Action Panel] */}
          <ActionPanel
            ref={actionPanelRef}
            selectedLead={selectedLead}
            onBuyLead={onBuyLead}
            isProcessing={isBuying}
            purchaseResult={purchaseResult}
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
          <TrustFlow />
        </div>
      </main>

      <UAGFooter user={appData.user} pointsBumping={purchaseResult === 'success'} />

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
          isOpen={Boolean(assetMessageLead)}
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

      {mockChatLead && (
        <MockChatModal
          isOpen={Boolean(mockChatLead)}
          onClose={handleCloseMockChatModal}
          lead={mockChatLead}
          conversationId={mockChatConversationId}
        />
      )}
    </div>
  );
}

/** 允許存取 UAG 後台的角色 */
const UAG_ALLOWED_ROLES = new Set(['agent', 'admin', 'official']);

function UAGGuard() {
  const { role, loading, isAuthenticated } = useAuth();
  const mode = usePageModeWithAuthState(isAuthenticated);
  const navigate = useNavigate();
  const isUnauthorized = mode === 'live' && !UAG_ALLOWED_ROLES.has(role);

  useEffect(() => {
    if (loading) return;
    if (isUnauthorized) {
      notify.warning('權限不足', '你的帳號角色無法存取 UAG 後台');
      navigate(RouteUtils.toNavigatePath(ROUTES.HOME), { replace: true });
    }
  }, [isUnauthorized, loading, navigate]);

  if (mode === 'visitor') {
    return <UAGLandingPage />;
  }

  if (loading) {
    return <UAGLoadingSkeleton />;
  }

  if (isUnauthorized) {
    return null;
  }

  return <UAGPageContent />;
}

export default function UAGPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary onReset={reset} FallbackComponent={UAGErrorState}>
          <UAGGuard />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
