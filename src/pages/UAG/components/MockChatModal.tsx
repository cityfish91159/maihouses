import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import styles from '../UAG.module.css';
import type { Lead } from '../types/uag.types';
import { MOCK_AUTO_REPLIES, MOCK_CONVERSATIONS, type MockMessage } from '../mockData';

const MAX_MESSAGE_LENGTH = 500;
const INPUT_FOCUS_DELAY_MS = 40;
const AUTO_REPLY_DELAY_STEPS_MS = [800, 1000, 1200] as const;

const S = {
  TITLE: 'Mock 客戶對話',
  SUBTITLE_PREFIX: '演示對象',
  INPUT_LABEL: '輸入訊息',
  INPUT_PLACEHOLDER: '輸入想對客戶說的內容…（Ctrl + Enter 發送）',
  SEND: '發送',
  TYPING: '對方輸入中…',
  EMPTY: '尚無歷史訊息，現在就開始第一句對話吧。',
  CLOSE_LABEL: '關閉對話',
  BACKDROP_CLOSE_LABEL: '關閉對話背景',
  DEMO_HINT: '演示模式 — 對話內容不會被儲存',
} as const;

export interface MockChatModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly lead: Lead;
  readonly conversationId: string;
}

function createMessageId(senderType: 'agent' | 'consumer'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${senderType}-${crypto.randomUUID()}`;
  }
  return `${senderType}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function MockChatModal({
  isOpen,
  onClose,
  lead,
  conversationId,
}: MockChatModalProps): React.ReactElement | null {
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<MockMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasOpenRef = useRef(false);

  const baseMessages = useMemo(
    () => MOCK_CONVERSATIONS[conversationId] ?? [],
    [conversationId]
  );
  const allMessages = useMemo(
    () => [...baseMessages, ...localMessages],
    [baseMessages, localMessages]
  );
  const canSend = draft.trim().length > 0 && !isTyping;

  const clearTypingTimer = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, []);

  const resetLocalState = useCallback(() => {
    clearTypingTimer();
    setDraft('');
    setLocalMessages([]);
    setIsTyping(false);
  }, [clearTypingTimer]);

  const handleClose = useCallback(() => {
    resetLocalState();
    onClose();
  }, [onClose, resetLocalState]);

  const handleSend = useCallback(() => {
    const messageText = draft.trim();
    if (!messageText || isTyping) return;

    const safeText = messageText.slice(0, MAX_MESSAGE_LENGTH);
    const now = new Date().toISOString();
    const nextAgentMessage: MockMessage = {
      id: createMessageId('agent'),
      sender_type: 'agent',
      content: safeText,
      created_at: now,
    };

    const roundIndex = Math.floor(localMessages.length / 2);
    const delay =
      AUTO_REPLY_DELAY_STEPS_MS[roundIndex % AUTO_REPLY_DELAY_STEPS_MS.length] ??
      AUTO_REPLY_DELAY_STEPS_MS[0];
    const replyIndex = roundIndex % MOCK_AUTO_REPLIES.length;
    const replyText = MOCK_AUTO_REPLIES[replyIndex] ?? MOCK_AUTO_REPLIES[0] ?? '';

    setLocalMessages((prev) => [...prev, nextAgentMessage]);
    setDraft('');
    setIsTyping(true);
    clearTypingTimer();

    typingTimeoutRef.current = setTimeout(() => {
      const autoReply: MockMessage = {
        id: createMessageId('consumer'),
        sender_type: 'consumer',
        content: replyText,
        created_at: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, autoReply]);
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, delay);
  }, [clearTypingTimer, draft, isTyping, localMessages.length]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      handleSend();
    },
    [handleSend]
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleDialogKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), textarea:not([disabled])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleDialogKeyDown);
    return () => { document.removeEventListener('keydown', handleDialogKeyDown); };
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), INPUT_FOCUS_DELAY_MS);
    return () => {
      clearTimeout(focusTimer);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [allMessages, isOpen, isTyping]);

  useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    clearTypingTimer();
    previousFocusRef.current?.focus();
    previousFocusRef.current = null;
  }, [clearTypingTimer, isOpen]);

  useEffect(() => () => clearTypingTimer(), [clearTypingTimer]);

  if (!isOpen) return null;

  const gradeClass = styles[`lead-grade-${lead.grade.toLowerCase()}`] ?? styles['lead-grade-f'];

  return (
    <div className={styles['mock-chat-overlay']} role="presentation">
      <button
        type="button"
        tabIndex={-1}
        aria-label={S.BACKDROP_CLOSE_LABEL}
        className={styles['mock-chat-backdrop']}
        onClick={handleClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mock-chat-title"
        className={styles['mock-chat-dialog']}
        tabIndex={-1}
      >
        <header className={styles['mock-chat-header']}>
          <div className={styles['mock-chat-header-left']}>
            <span className={`${styles['lead-grade-pill']} ${gradeClass}`}>{lead.grade}</span>
            <div>
              <h2 id="mock-chat-title" className={styles['mock-chat-title']}>
                {S.TITLE}
              </h2>
              <p className={styles['mock-chat-subtitle']}>
                {S.SUBTITLE_PREFIX}｜{lead.name}・{lead.prop}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label={S.CLOSE_LABEL}
            onClick={handleClose}
            className={styles['mock-chat-close-btn']}
          >
            <X size={18} />
          </button>
        </header>

        <div
          ref={viewportRef}
          className={styles['mock-chat-messages']}
          role="log"
          aria-live="polite"
        >
          {allMessages.length === 0 ? (
            <p className={styles['mock-chat-empty']}>{S.EMPTY}</p>
          ) : (
            allMessages.map((message) => {
              const isAgent = message.sender_type === 'agent';
              const rowClass = isAgent
                ? styles['mock-chat-row-agent']
                : styles['mock-chat-row-consumer'];
              const bubbleClass = isAgent
                ? styles['mock-chat-bubble-agent']
                : styles['mock-chat-bubble-consumer'];

              return (
                <div key={message.id} className={`${styles['mock-chat-row']} ${rowClass}`}>
                  <div className={`${styles['mock-chat-bubble']} ${bubbleClass}`}>
                    <p className={styles['mock-chat-content']}>{message.content}</p>
                    <span className={styles['mock-chat-time']}>
                      {formatMessageTime(message.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )}

          {isTyping && (
            <div className={`${styles['mock-chat-row']} ${styles['mock-chat-row-consumer']}`}>
              <div
                className={`${styles['mock-chat-bubble']} ${styles['mock-chat-bubble-consumer']} ${styles['mock-chat-typing']}`}
              >
                {S.TYPING}
              </div>
            </div>
          )}
        </div>

        <form className={styles['mock-chat-input-area']} onSubmit={handleSubmit}>
          <label htmlFor="mock-chat-input" className={styles['sr-only']}>
            {S.INPUT_LABEL}
          </label>
          <textarea
            id="mock-chat-input"
            ref={inputRef}
            value={draft}
            rows={3}
            maxLength={MAX_MESSAGE_LENGTH}
            className={`${styles['modal-textarea']} ${styles['mock-chat-textarea']}`}
            placeholder={S.INPUT_PLACEHOLDER}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={isTyping}
          />
          <div className={styles['mock-chat-actions']}>
            <span className={styles['modal-char-count']}>
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </span>
            <button
              type="submit"
              className={`${styles['uag-btn']} ${styles['primary']} ${styles['mock-chat-send-btn']}`}
              disabled={!canSend}
            >
              <Send size={14} />
              {S.SEND}
            </button>
          </div>
          <p className={styles['mock-chat-demo-hint']}>{S.DEMO_HINT}</p>
        </form>
      </div>
    </div>
  );
}
