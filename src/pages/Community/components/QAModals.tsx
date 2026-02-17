/**
 * QAModals Component
 *
 * 發問 / 回答 Modal，從 QASection 提取
 */

import type { MutableRefObject } from 'react';
import type { Question } from '../types';

interface QAModalSharedProps {
  submitting: 'ask' | 'answer' | null;
}

interface AskModalProps extends QAModalSharedProps {
  open: boolean;
  dialogRef: MutableRefObject<HTMLDivElement | null>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  minLength: number;
}

export function AskModal({
  open,
  dialogRef,
  textareaRef,
  input,
  onInputChange,
  error,
  onClose,
  onSubmit,
  submitting,
  minLength,
}: AskModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ask-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 id="ask-modal-title" className="text-base font-bold text-ink-700">
              提出你的問題
            </h3>
            <p className="text-ink-500 text-xs">請描述情境，方便住戶提供建議</p>
          </div>
          <button
            type="button"
            className="text-sm text-ink-400 transition hover:text-ink-700"
            onClick={() => {
              if (submitting === 'ask') return;
              onClose();
            }}
            aria-label="關閉發問視窗"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-ink-600" htmlFor="qa-ask-textarea">
            問題內容
          </label>
          <textarea
            ref={textareaRef}
            id="qa-ask-textarea"
            className="bg-ink-50/40 h-28 w-full rounded-xl border border-border-light p-3 text-sm outline-none focus:border-brand"
            placeholder="例：晚上車流聲音大嗎？管理費包含哪些服務？"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            maxLength={500}
            disabled={submitting === 'ask'}
          />
          {error && (
            <p className="text-error-500 text-xs" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between text-[11px] text-ink-400">
            <span>至少 {minLength} 個字</span>
            <span>{input.length}/500</span>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting === 'ask'}
            className={`w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition ${submitting === 'ask' ? 'opacity-70' : 'hover:bg-brand-600'}`}
          >
            {submitting === 'ask' ? '送出中…' : '送出問題'}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AnswerModalProps extends QAModalSharedProps {
  open: boolean;
  question: Question | null;
  dialogRef: MutableRefObject<HTMLDivElement | null>;
  textareaRef: MutableRefObject<HTMLTextAreaElement | null>;
  input: string;
  onInputChange: (value: string) => void;
  error: string;
  onClose: () => void;
  onSubmit: () => void;
  minLength: number;
}

export function AnswerModal({
  open,
  question,
  dialogRef,
  textareaRef,
  input,
  onInputChange,
  error,
  onClose,
  onSubmit,
  submitting,
  minLength,
}: AnswerModalProps) {
  if (!open || !question) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="answer-modal-title"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 id="answer-modal-title" className="text-base font-bold text-ink-700">
              回答問題
            </h3>
            <p className="text-ink-500 text-xs">{question.question}</p>
          </div>
          <button
            type="button"
            className="text-sm text-ink-400 transition hover:text-ink-700"
            onClick={() => {
              if (submitting === 'answer') return;
              onClose();
            }}
            aria-label="關閉回答視窗"
          >
            ✕
          </button>
        </div>
        <div className="space-y-3">
          <label
            className="block text-xs font-semibold text-ink-600"
            htmlFor="qa-answer-textarea"
          >
            回答內容
          </label>
          <textarea
            ref={textareaRef}
            id="qa-answer-textarea"
            className="bg-ink-50/40 h-32 w-full rounded-xl border border-border-light p-3 text-sm outline-none focus:border-brand"
            placeholder="提供實際經驗、噪音狀況、交通建議等"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            maxLength={800}
            disabled={submitting === 'answer'}
          />
          {error && (
            <p className="text-error-500 text-xs" role="alert">
              {error}
            </p>
          )}
          <div className="flex items-center justify-between text-[11px] text-ink-400">
            <span>至少 {minLength} 個字</span>
            <span>{input.length}/800</span>
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting === 'answer'}
            className={`w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition ${submitting === 'answer' ? 'opacity-70' : 'hover:bg-brand-600'}`}
          >
            {submitting === 'answer' ? '送出中…' : '送出回答'}
          </button>
        </div>
      </div>
    </div>
  );
}
