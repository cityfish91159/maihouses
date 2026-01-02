import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { HEADER_MODES } from '../../constants/header';
import { useAuth } from '../../hooks/useAuth';
import { ChatHeader } from './ChatHeader';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { useChat } from './useChat';

export default function ChatPage() {
  const { conversationId } = useParams();
  const { isAuthenticated, loading: authLoading, role } = useAuth();
  const { header, messages, isLoading, isSending, error, sendMessage, isAgent } = useChat(conversationId);
  const headerMode = role === 'agent' ? HEADER_MODES.AGENT : HEADER_MODES.CONSUMER;

  useEffect(() => {
    document.title = '對話 | MaiHouses';
  }, []);

  if (!conversationId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <GlobalHeader mode={headerMode} />
        <div className="mx-auto max-w-[960px] px-4 py-10 text-sm text-slate-600">
          無效的對話連結。
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <GlobalHeader mode={headerMode} />
        <div className="mx-auto max-w-[960px] px-4 py-10 text-sm text-slate-600">
          載入中...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50">
        <GlobalHeader mode={headerMode} />
        <div className="mx-auto max-w-[960px] px-4 py-10">
          <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
            請先登入才能查看對話內容。
            <a className="ml-2 font-bold text-brand-700" href="/maihouses/auth.html?mode=login">
              前往登入
            </a>
          </div>
        </div>
      </div>
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
          <div className="flex-1 overflow-y-auto p-4">
            <MessageList
              messages={messages}
              currentSender={isAgent ? 'agent' : 'consumer'}
              isLoading={isLoading}
              error={error}
            />
          </div>
          <div className="border-t border-brand-100 p-3">
            <MessageInput onSend={sendMessage} disabled={isLoading || isSending} isSending={isSending} />
          </div>
        </section>
      </div>
    </div>
  );
}
