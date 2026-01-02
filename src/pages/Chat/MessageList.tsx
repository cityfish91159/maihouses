import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import type { Message, SenderType } from '../../types/messaging.types';

interface MessageListProps {
  messages: Message[];
  currentSender: SenderType;
  isLoading?: boolean;
  error?: Error | null;
}

function formatTime(timestamp: string) {
  const time = new Date(timestamp);
  return time.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
}

export function MessageList({ messages, currentSender, isLoading, error }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((row) => (
          <div key={row} className="flex animate-pulse gap-2">
            <div className="h-10 w-12 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/2 rounded bg-slate-100" />
              <div className="h-3 w-1/3 rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
        對話載入失敗，請稍後再試。
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
        尚無訊息，先打聲招呼吧。
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isSelf = msg.sender_type === currentSender;
        return (
          <div key={msg.id} className={clsx('flex', isSelf ? 'justify-end' : 'justify-start')}>
            <div
              className={clsx(
                'max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm',
                isSelf ? 'bg-brand-700 text-white' : 'border border-brand-100 bg-white text-slate-900'
              )}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              <div className={clsx('mt-2 text-[10px]', isSelf ? 'text-white/70' : 'text-slate-400')}>
                {formatTime(msg.created_at)}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
