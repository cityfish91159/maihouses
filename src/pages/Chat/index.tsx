import { useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { HEADER_MODES } from '../../constants/header';
import { useAuth } from '../../hooks/useAuth';
import { useConsumerSession } from '../../hooks/useConsumerSession';
import { getLoginUrl } from '../../lib/authUtils';
import { ChatHeader } from './ChatHeader';
import { ChatErrorLayout } from './ErrorLayout';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { useChat } from './useChat';

export default function ChatPage() {
  const { conversationId } = useParams();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading, role } = useAuth();
  // 使用統一的 session hook（含過期檢查）
  const { hasValidSession, isExpired } = useConsumerSession();
  const {
    header,
    messages,
    isLoading,
    isSending,
    isTyping,
    error,
    sendMessage,
    sendTyping,
    isAgent,
  } = useChat(conversationId);
  const headerMode = role === 'agent' ? HEADER_MODES.AGENT : HEADER_MODES.CONSUMER;

  // 產生當前頁面的登入 URL（含 return 參數）
  const loginUrl = getLoginUrl(`${location.pathname}${location.search}${location.hash}`);

  useEffect(() => {
    document.title = '對話 | MaiHouses';
  }, []);

  if (!conversationId) {
    return <ChatErrorLayout mode={headerMode}>無效的對話連結。</ChatErrorLayout>;
  }

  if (authLoading) {
    return <ChatErrorLayout mode={headerMode}>載入中...</ChatErrorLayout>;
  }

  // Session 過期提示
  if (isExpired) {
    return (
      <ChatErrorLayout mode={headerMode}>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          您的對話連結已過期（超過 7 天）。
          <br />
          請聯繫房仲重新發送連結。
        </div>
      </ChatErrorLayout>
    );
  }

  // 有 session 或已登入都允許進入
  if (!isAuthenticated && !hasValidSession) {
    return (
      <ChatErrorLayout mode={headerMode}>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
          請先登入才能查看對話內容。
          <a className="ml-2 font-bold text-brand-700" href={loginUrl}>
            前往登入
          </a>
        </div>
      </ChatErrorLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader mode={headerMode} />
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 pb-10 pt-4">
        <ChatHeader
          isLoading={isLoading}
          counterpartName={header?.counterpartName}
          counterpartSubtitle={header?.counterpartSubtitle}
          statusLabel={header?.statusLabel}
          propertyTitle={header?.propertyTitle}
          propertySubtitle={header?.propertySubtitle}
          propertyImage={header?.propertyImage}
        />

        <section className="flex min-h-[440px] flex-1 flex-col rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="flex-1 overflow-hidden p-4">
            <MessageList
              messages={messages}
              currentSender={isAgent ? 'agent' : 'consumer'}
              isLoading={isLoading}
              error={error}
            />
            {isTyping && <div className="mt-3 text-xs text-slate-500">對方輸入中...</div>}
          </div>
          <div className="border-t border-brand-100 p-3">
            <MessageInput
              onSend={sendMessage}
              onTyping={sendTyping}
              disabled={isLoading || isSending}
              isSending={isSending}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
