import React, { useEffect, useRef, useState } from 'react';
import { useQuietMode } from '../../context/QuietModeContext';
import { Events, track } from '../../analytics/track';

type Props = { onSend: (text: string) => Promise<void> | void };

export const ChatInput: React.FC<Props> = ({ onSend }) => {
  const { isActive, decrementTurn } = useQuietMode();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // [NASA TypeScript Safety] 使用類型守衛驗證 CustomEvent
    const handler = (e: Event) => {
      // 檢查是否為 CustomEvent 並具有 detail 屬性
      if (!(e instanceof CustomEvent)) return;
      const detail = e.detail as { text?: string } | null | undefined;
      const seed = detail?.text || '';
      if (seed) {
        setText(seed);
        inputRef.current?.focus();
        track('ui.warmbar_prefill', { from: 'warmbar' });
      }
    };
    window.addEventListener('mai:chat:start', handler);
    return () => window.removeEventListener('mai:chat:start', handler);
  }, []);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg) return;
    setText('');
    try {
      await onSend(msg);
    } finally {
      if (isActive()) {
        decrementTurn();
        track(Events.QuietTurnUsed, {});
      }
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        id="chat-input"
        name="chat-message"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isActive() ? '安靜模式：只聊天,不推內容' : '輸入訊息…'}
        className="flex-1 rounded-[10px] border border-[var(--mh-color-dddddd)] px-3 py-2.5"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
      />
      <button
        onClick={handleSend}
        className="rounded-[10px] border border-[var(--mh-color-1749d7)] bg-[var(--mh-color-1749d7)] px-3 py-2 text-white"
      >
        發送
      </button>
    </div>
  );
};
