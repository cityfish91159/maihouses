/**
 * PostModal Component
 * 
 * 發文 Modal - 取代 prompt()
 * 參考 QASection 的 Modal 實作，包含 Focus Trap、Escape 關閉、字數驗證
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Role } from '../types';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (content: string) => Promise<void> | void;
  visibility: 'public' | 'private';
  minLength?: number;
  maxLength?: number;
  role: Role;
}

export function PostModal({
  isOpen,
  onClose,
  onSubmit,
  visibility,
  minLength = 5,
  maxLength = 500,
  role,
}: PostModalProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const isPrivate = visibility === 'private';
  const title = isPrivate ? '發布私密貼文' : '發布貼文';
  const placeholder = isPrivate 
    ? '分享只有住戶能看到的內容...' 
    : '分享你的想法、社區生活...';
  // B3: guest 已在 render 前被擋，這裡 isGuest 理論上永遠 false
  const isGuest = role === 'guest';
  const isDisabled = submitting;

  const reset = useCallback(() => {
    setContent('');
    setError('');
    setSubmitting(false);
  }, []);

  const handleClose = useCallback(() => {
    if (submitting) return;
    reset();
    onClose();
  }, [submitting, reset, onClose]);

  const validate = (): string | null => {
    const trimmed = content.trim();
    if (trimmed.length < minLength) {
      return `貼文內容至少需要 ${minLength} 個字`;
    }
    if (trimmed.length > maxLength) {
      return `貼文內容不能超過 ${maxLength} 個字`;
    }
    return null;
  };

  const handleSubmit = async () => {
    // B3: guest 已被擋在 render 前，此處保留作為防禦性程式碼
    if (isGuest) {
      setError('請先登入後再發文');
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await onSubmit(content.trim());
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '發文失敗，請稍後再試');
    } finally {
      setSubmitting(false);
    }
  };

  // Focus Trap
  const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');
    return Array.from(container.querySelectorAll<HTMLElement>(selectors));
  };

  const trapFocus = useCallback((event: KeyboardEvent) => {
    if (event.key !== 'Tab' || !dialogRef.current) return;
    
    const focusable = getFocusableElements(dialogRef.current);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;

    if (!event.shiftKey && active === last) {
      first?.focus();
      event.preventDefault();
    }
    if (event.shiftKey && active === first) {
      last?.focus();
      event.preventDefault();
    }
  }, []);

  // Escape 關閉
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && !submitting) {
      handleClose();
    }
    trapFocus(event);
  }, [submitting, handleClose, trapFocus]);

  // 開啟時：記住焦點、聚焦 textarea、鎖定 body
  useEffect(() => {
    if (isOpen) {
      restoreFocusRef.current = document.activeElement as HTMLElement | null;
      document.body.style.overflow = 'hidden';
      // 延遲聚焦確保 DOM 已渲染
      setTimeout(() => textareaRef.current?.focus(), 10);
    } else {
      document.body.style.overflow = '';
      // 還原焦點
      if (restoreFocusRef.current?.focus) {
        restoreFocusRef.current.focus();
      }
    }
  }, [isOpen]);

  // 綁定鍵盤事件
  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // B3: 訪客若意外打開，透過 effect 關閉，避免 render 階段 side effect
  useEffect(() => {
    if (isOpen && isGuest) {
      onClose();
    }
  }, [isOpen, isGuest, onClose]);

  if (!isOpen || isGuest) return null;

  const charCount = content.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="post-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-light px-4 py-3">
          <h2 id="post-modal-title" className="flex items-center gap-2 text-base font-bold text-brand-700">
            {isPrivate ? '🔐' : '✏️'} {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-full p-1 text-ink-600 hover:bg-brand/10 hover:text-brand disabled:opacity-50"
            aria-label="關閉"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (error) setError('');
            }}
            placeholder={placeholder}
            disabled={isDisabled}
            rows={5}
            className={`w-full resize-none rounded-xl border bg-brand/3 p-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-50 ${
              error ? 'border-red-400' : 'border-border-light'
            }`}
            aria-describedby={error ? 'post-modal-error' : undefined}
            aria-invalid={!!error}
          />
          
          {/* 字數計數 */}
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={isOverLimit ? 'text-red-500' : 'text-ink-500'}>
              {charCount} / {maxLength} 字
            </span>
            {isPrivate && (
              <span className="text-brand-600">🔐 僅住戶可見</span>
            )}
          </div>

          {/* 錯誤訊息 */}
          {error && (
            <p id="post-modal-error" className="mt-2 text-sm text-red-500" role="alert">
              ⚠️ {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border-light px-4 py-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDisabled}
            className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-ink-600 hover:bg-brand/5 disabled:opacity-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isDisabled || isOverLimit}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            aria-busy={submitting}
          >
            {submitting ? '發布中...' : '發布'}
          </button>
        </div>
      </div>
    </div>
  );
}
