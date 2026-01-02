import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { List, type ListImperativeAPI, type RowComponentProps } from 'react-window';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<ListImperativeAPI | null>(null);
  const [listHeight, setListHeight] = useState(360);
  const rowHeight = 88;

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    if (typeof ResizeObserver === 'undefined') {
      setListHeight(containerRef.current.clientHeight || 360);
      return;
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setListHeight(entry.contentRect.height);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    listRef.current?.scrollToRow({ index: messages.length - 1, align: 'end', behavior: 'smooth' });
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
    <div ref={containerRef} className="h-full">
      <List
        listRef={listRef}
        rowCount={messages.length}
        rowHeight={rowHeight}
        rowProps={{}}
        rowComponent={({ index, style }: RowComponentProps) => {
          const msg = messages[index];
          if (!msg) return <div style={style} />;
          const isSelf = msg.sender_type === currentSender;
          return (
            <div style={style} className={clsx('flex px-1', isSelf ? 'justify-end' : 'justify-start')}>
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
                {isSelf && (
                  <div className="mt-1 text-[10px] text-white/70">
                    {msg.read_at ? '已讀' : '已送出'}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        style={{ height: listHeight, width: '100%' }}
        defaultHeight={listHeight}
      />
    </div>
  );
}
