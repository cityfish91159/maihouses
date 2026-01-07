import React, { useRef, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";

import styles from "./UAG.module.css";
import { useUAG } from "./hooks/useUAG";
import { useLeadSelection } from "./hooks/useLeadSelection";
import { useAuth } from "../../hooks/useAuth";

import { UAGHeader } from "./components/UAGHeader";
import { UAGFooter } from "./components/UAGFooter";
import { UAGLoadingSkeleton } from "./components/UAGLoadingSkeleton";
import { UAGErrorState } from "./components/UAGErrorState";

import RadarCluster from "./components/RadarCluster";
import ActionPanel from "./components/ActionPanel";
import AssetMonitor from "./components/AssetMonitor";
import ListingFeed from "./components/ListingFeed";
import ReportGenerator from "./components/ReportGenerator";
import TrustFlow from "./components/TrustFlow";

// MSG-5: 購買成功後發送訊息 Modal
import { SendMessageModal } from "../../components/UAG/SendMessageModal";
import type { Lead } from "./types/uag.types";

function UAGPageContent() {
  const {
    data: appData,
    isLoading,
    buyLead,
    isBuying,
    useMock,
    toggleMode,
  } = useUAG();
  const { selectedLead, selectLead, close } = useLeadSelection();
  const { user, loading: authLoading, error: authError, signOut } = useAuth();
  const actionPanelRef = useRef<HTMLDivElement>(null);

  // MSG-5: Modal 狀態
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [purchasedLead, setPurchasedLead] = useState<Lead | null>(null);
  // MSG-5 FIX: 保存購買後回傳的 conversation_id (UAG-13)
  const [currentConversationId, setCurrentConversationId] = useState<
    string | undefined
  >(undefined);
  // Header signOut 狀態
  const [isSigningOut, setIsSigningOut] = useState(false);

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
  const onBuyLead = async (leadId: string) => {
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
  };

  const handleCloseModal = () => {
    setShowMessageModal(false);
    setPurchasedLead(null);
    setCurrentConversationId(undefined);
  };

  if (isLoading) return <UAGLoadingSkeleton />;
  if (!appData) return null;

  /**
   * 問題 #10-11 修復：不使用假數據 fallback
   * 如果沒有真實的 user.id 或 session_id，不應該嘗試建立對話
   */
  const agentId = user?.id;
  // 使用 lead 的 session_id（來自消費者瀏覽記錄）
  const consumerSessionId = purchasedLead?.session_id;

  // 問題 #10-11 修復：判斷是否可以發送訊息
  const canSendMessage = Boolean(agentId && consumerSessionId);

  return (
    <div className={styles["uag-page"]}>
      <UAGHeader
        user={user}
        isLoading={authLoading}
        error={authError}
        onSignOut={handleSignOut}
        isSigningOut={isSigningOut}
      />

      <main className={styles["uag-container"]}>
        <div className={styles["uag-grid"]}>
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

      <UAGFooter
        user={appData.user}
        useMock={useMock}
        toggleMode={toggleMode}
      />

      {/* MSG-5: 購買成功後發送訊息 Modal */}
      {/* 問題 #10-11 修復：只有在有真實 agentId 和 sessionId 時才渲染 */}
      {purchasedLead && canSendMessage && agentId && consumerSessionId && (
        <SendMessageModal
          isOpen={showMessageModal}
          onClose={handleCloseModal}
          lead={purchasedLead}
          agentId={agentId}
          sessionId={consumerSessionId}
          {...(currentConversationId && {
            conversationId: currentConversationId,
          })} // UAG-13 Safe
          {...(purchasedLead.property_id
            ? { propertyId: purchasedLead.property_id }
            : {})}
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
