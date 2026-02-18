import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GlobalHeader } from '../../components/layout/GlobalHeader';
import { HEADER_MODES } from '../../constants/header';
import { useAuth } from '../../hooks/useAuth';
import { useConsumerSession } from '../../hooks/useConsumerSession';
import { usePageMode } from '../../hooks/usePageMode';
import { getLoginUrl, getCurrentPath } from '../../lib/authUtils';
import type { Message } from '../../types/messaging.types';
import { ChatHeader } from './ChatHeader';
import { ChatErrorLayout } from './ErrorLayout';
import { MessageInput } from './MessageInput';
import { MessageList } from './MessageList';
import { type ChatHeaderData, useChat } from './useChat';

const DEMO_PROPERTY_TITLE = '示範物件';
const DEMO_PROPERTY_SUBTITLE = 'Demo 對話展示';
const DEMO_COUNTERPART_NAME = '示範客戶';
const DEMO_COUNTERPART_SUBTITLE = '訪客會話';
const DEMO_STATUS_LABEL = '演示中';
const DEMO_WELCOME_MESSAGE = '歡迎來到示範聊天室，你可以直接輸入訊息體驗互動。';

function createLocalMessage(
  conversationId: string,
  senderType: Message['sender_type'],
  content: string
): Message {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    conversation_id: conversationId,
    sender_type: senderType,
    sender_id: null,
    content,
    created_at: new Date().toISOString(),
    read_at: senderType === 'consumer' ? null : new Date().toISOString(),
  };
}

function buildDemoReply(content: string): string {
  const preview = content.trim().slice(0, 20);
  if (!preview) {
    return '已收到，你可以繼續輸入想詢問的內容。';
  }
  return `示範回覆：已收到「${preview}」。`;
}

function getDemoHeader(conversationId: string): ChatHeaderData {
  return {
    counterpartName: DEMO_COUNTERPART_NAME,
    counterpartSubtitle: DEMO_COUNTERPART_SUBTITLE,
    statusLabel: DEMO_STATUS_LABEL,
    propertyTitle: DEMO_PROPERTY_TITLE,
    propertySubtitle: `${DEMO_PROPERTY_SUBTITLE} #${conversationId.slice(-6)}`,
  };
}

function VisitorLoginView() {
  const loginUrl = getLoginUrl(getCurrentPath());

  return (
    <ChatErrorLayout mode={HEADER_MODES.CONSUMER}>
      <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
        請先登入後再查看聊天室。
        <a className="ml-2 font-bold text-brand-700" href={loginUrl}>
          立即登入
        </a>
      </div>
    </ChatErrorLayout>
  );
}

interface DemoChatViewProps {
  conversationId: string;
}

function DemoChatView({ conversationId }: DemoChatViewProps) {
  const replyTimerRef = useRef<number | null>(null);
  const [messages, setMessages] = useState<Message[]>(() => [
    createLocalMessage(conversationId, 'agent', DEMO_WELCOME_MESSAGE),
  ]);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const header = useMemo(() => getDemoHeader(conversationId), [conversationId]);

  useEffect(() => {
    document.title = '聊天室 | MaiHouses';
  }, []);

  useEffect(() => {
    return () => {
      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
        replyTimerRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setMessages((prev) => [...prev, createLocalMessage(conversationId, 'consumer', trimmed)]);
      setIsSending(true);
      setIsTyping(true);

      if (replyTimerRef.current !== null) {
        window.clearTimeout(replyTimerRef.current);
      }

      const demoReply = buildDemoReply(trimmed);
      replyTimerRef.current = window.setTimeout(() => {
        setMessages((prev) => [...prev, createLocalMessage(conversationId, 'agent', demoReply)]);
        setIsTyping(false);
        setIsSending(false);
        replyTimerRef.current = null;
      }, 420);
    },
    [conversationId]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <GlobalHeader mode={HEADER_MODES.CONSUMER} />
      <div className="mx-auto flex max-w-[960px] flex-col gap-4 px-4 pb-10 pt-4">
        <ChatHeader
          isLoading={false}
          counterpartName={header.counterpartName}
          counterpartSubtitle={header.counterpartSubtitle}
          statusLabel={header.statusLabel}
          propertyTitle={header.propertyTitle}
          propertySubtitle={header.propertySubtitle}
          propertyImage={header.propertyImage}
        />

        <section className="flex min-h-[440px] flex-1 flex-col rounded-2xl border border-brand-100 bg-white shadow-sm">
          <div className="flex-1 overflow-hidden p-4">
            <MessageList
              messages={messages}
              currentSender="consumer"
              isLoading={false}
              error={null}
            />
            {isTyping && <div className="mt-3 text-xs text-slate-500">對方輸入中...</div>}
          </div>
          <div className="border-t border-brand-100 p-3">
            <MessageInput
              onSend={sendMessage}
              onTyping={() => {}}
              disabled={isSending}
              isSending={isSending}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

interface LiveChatViewProps {
  conversationId: string;
}

function LiveChatView({ conversationId }: LiveChatViewProps) {
  const { isAuthenticated, loading: authLoading, role } = useAuth();
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
  const loginUrl = getLoginUrl(getCurrentPath());

  useEffect(() => {
    document.title = '聊天室 | MaiHouses';
  }, []);

  if (authLoading) {
    return <ChatErrorLayout mode={headerMode}>載入中...</ChatErrorLayout>;
  }

  if (isExpired) {
    return (
      <ChatErrorLayout mode={headerMode}>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          訪客會話已超過 7 天有效期。
          <br />
          請重新登入或重新開啟新的對話。
        </div>
      </ChatErrorLayout>
    );
  }

  if (!isAuthenticated && !hasValidSession) {
    return (
      <ChatErrorLayout mode={headerMode}>
        <div className="rounded-2xl border border-brand-100 bg-white p-6 text-sm text-slate-600 shadow-sm">
          請先登入後再查看聊天室。
          <a className="ml-2 font-bold text-brand-700" href={loginUrl}>
            立即登入
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

export default function ChatPage() {
  const { conversationId } = useParams();
  const mode = usePageMode();
  const { hasValidSession } = useConsumerSession();

  if (!conversationId) {
    return <ChatErrorLayout mode={HEADER_MODES.CONSUMER}>找不到對話編號。</ChatErrorLayout>;
  }

  if (mode === 'demo') {
    return <DemoChatView conversationId={conversationId} />;
  }

  // 保留例外：visitor 只要有有效 consumer session，仍可進入 live chat。
  if (mode === 'live' || hasValidSession) {
    return <LiveChatView conversationId={conversationId} />;
  }

  return <VisitorLoginView />;
}
