/**
 * QASection Component
 * 
 * 準住戶問答區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useState, useEffect, useRef } from 'react';
import type { Role, Question, Permissions } from '../types';
import { getPermissions } from '../types';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { LockedOverlay } from './LockedOverlay';
import { formatRelativeTimeLabel } from '../../../lib/time';

interface QACardProps {
  q: Question & { hasMoreAnswers?: boolean; totalAnswers?: number };
  perm: Permissions;
  isUnanswered?: boolean;
  onAnswer?: (question: Question) => void;
  isAnswering?: boolean;
  onUnlock?: () => void;
  /** 當卡片在 LockedOverlay 內時，不顯示內部的解鎖按鈕 */
  hideUnlockButton?: boolean;
}

function QACard({ q, perm, isUnanswered = false, onAnswer, isAnswering, onUnlock, hideUnlockButton = false }: QACardProps) {
  const displayTime = formatRelativeTimeLabel(q.time);
  return (
    <article className={`rounded-[14px] border p-3.5 transition-all hover:border-brand/15 ${isUnanswered ? 'border-brand-light/30 bg-gradient-to-br from-brand-50 to-brand-100/30' : 'border-border-light bg-white'}`}>
      <div className="mb-2 text-sm font-bold leading-snug text-brand-700">Q: {q.question}</div>
      <div className="mb-2.5 flex flex-wrap items-center gap-2 text-[11px] text-ink-600">
        <span>👤 準住戶</span>
        <span>· {displayTime}</span>
        {isUnanswered ? (
          <span className="font-bold text-brand-light">· 等待回答中</span>
        ) : (
          <span>· {q.answersCount} 則回覆</span>
        )}
      </div>
      
      {isUnanswered ? (
        <div className="mt-2 rounded-[10px] bg-brand/2 p-4 text-center text-[13px] text-ink-600">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-2 border-l-[3px] border-border-light pl-3.5">
          {q.answers.map((a, idx) => (
            <div key={idx} className="py-2 text-[13px] leading-relaxed">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-brand-100 text-brand-600' : a.type === 'official' ? 'bg-brand-50 text-brand' : 'bg-brand-100 text-brand'}`}>
                  {a.type === 'agent' ? '🏢 認證房仲' : a.type === 'official' ? `📋 ${a.author}` : `🏠 ${a.author}`}
                </span>
                {a.expert && <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600">⭐ 專家回答</span>}
              </div>
              {a.content}
            </div>
          ))}
          
          {/* 非會員：顯示「還有 X 則回答」+ 註冊按鈕（但在 LockedOverlay 內不顯示） */}
          {!hideUnlockButton && q.hasMoreAnswers && q.totalAnswers && (
            <div className="mt-2 rounded-lg border border-brand/10 bg-gradient-to-r from-brand-50 to-brand-100/50 p-3 text-center">
              <p className="mb-2 text-[13px] text-ink-700">
                🔒 還有 <span className="font-bold text-brand">{q.totalAnswers - q.answers.length}</span> 則回答
              </p>
              <button
                type="button"
                onClick={onUnlock}
                className="rounded-lg bg-brand px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-brand-dark hover:shadow-md"
              >
                免費註冊 / 登入 解鎖全部
              </button>
            </div>
          )}
        </div>
      )}

      {perm.canAnswer && (
        <div className="mt-2.5">
          <button 
            type="button"
            className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-brand-light/30 bg-brand-light/10 text-brand-600' : 'border-brand/10 bg-brand/6 text-brand'} hover:bg-brand/12`}
            onClick={() => onAnswer?.(q)}
            disabled={isAnswering}
            aria-busy={isAnswering}
            aria-label={isUnanswered ? '搶先回答這個問題' : '回答這個問題'}
          >
            {isAnswering ? '⏳ 傳送中…' : `💬 ${isUnanswered ? '搶先回答' : '我來回答'}${perm.isAgent ? '（專家）' : ''}`}
          </button>
        </div>
      )}
    </article>
  );
}

interface QASectionProps {
  role: Role;
  questions: Question[] | { items: Question[] };
  onAskQuestion?: (question: string) => Promise<void> | void;
  onAnswerQuestion?: (questionId: string, content: string) => Promise<void> | void;
  feedbackDurationMs?: number;
  onUnlock?: () => void;
}

export function QASection({ role, questions: questionsProp, onAskQuestion, onAnswerQuestion, feedbackDurationMs = 5000, onUnlock }: QASectionProps) {
  const questions = Array.isArray(questionsProp) ? questionsProp : (questionsProp?.items || []);
  const perm = getPermissions(role);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askInput, setAskInput] = useState('');
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [answerInput, setAnswerInput] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [submitting, setSubmitting] = useState<'ask' | 'answer' | null>(null);
  const [askError, setAskError] = useState('');
  const [answerError, setAnswerError] = useState('');
  const [feedback, setFeedback] = useState('');
  const askDialogRef = useRef<HTMLDivElement | null>(null);
  const answerDialogRef = useRef<HTMLDivElement | null>(null);
  const askTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const answerTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // 使用 totalAnswers（API 回傳總數）或 answersCount 判斷是否有回答
  // 這樣即使 API 對非會員限流，也能正確分類
  const answeredQuestions = questions.filter(q => (q.totalAnswers ?? q.answersCount ?? q.answers.length) > 0);
  const unansweredQuestions = questions.filter(q => (q.totalAnswers ?? q.answersCount ?? q.answers.length) === 0);

  // 使用統一的 hook 處理訪客可見項目
  const { visible: visibleAnswered, hiddenCount, nextHidden: nextHiddenQuestion } = 
    useGuestVisibleItems(answeredQuestions, perm.isLoggedIn);

  const MIN_QUESTION_LENGTH = 10;
  const MIN_ANSWER_LENGTH = 5;

  const resetAskModal = () => {
    setAskInput('');
    setAskError('');
  };

  const resetAnswerModal = () => {
    setAnswerInput('');
    setAnswerError('');
    setActiveQuestion(null);
  };

  const rememberTriggerFocus = () => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
  };

  const openAskModal = () => {
    if (!perm.canAskQuestion) {
      if (onUnlock) {
        onUnlock();
        return;
      }
      setFeedback('⚠️ 請登入後再發問。');
      return;
    }
    rememberTriggerFocus();
    resetAskModal();
    setAskModalOpen(true);
  };

  const openAnswerModal = (question: Question) => {
    if (!perm.canAnswer) {
      if (onUnlock) {
        onUnlock();
        return;
      }
      setFeedback('⚠️ 只有住戶或房仲可以回答問題。');
      return;
    }
    rememberTriggerFocus();
    resetAnswerModal();
    setActiveQuestion(question);
    setAnswerModalOpen(true);
  };

  const getActiveDialog = (): HTMLDivElement | null => {
    return askModalOpen ? askDialogRef.current : answerModalOpen ? answerDialogRef.current : null;
  };

  const getFocusableElements = (container: HTMLElement | null) => {
    if (!container) return [] as HTMLElement[];
    const selector = 'a[href], button, textarea, input, select, [tabindex]';
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(el => {
      const tabIndexAttr = el.getAttribute('tabindex');
      const tabIndex = typeof tabIndexAttr === 'string' ? Number(tabIndexAttr) : undefined;
      const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      const isHidden = el.hasAttribute('aria-hidden');
      const isNegativeTabIndex = typeof tabIndex === 'number' && tabIndex < 0;
      return !isDisabled && !isHidden && !isNegativeTabIndex;
    });
  };

  /**
   * 安全聚焦 helper：依序嘗試 main、[data-app-root]、#root、body
   * 會暫存原本的 tabIndex 並在聚焦後還原，避免永久污染 DOM
   */
  const focusSafeElement = (): void => {
    const candidates = [
      document.querySelector('main'),
      document.querySelector('[data-app-root]'),
      document.getElementById('root'),
      document.body,
    ];
    for (const el of candidates) {
      if (el instanceof HTMLElement) {
        const prevTabIndex = el.getAttribute('tabindex');
        el.dataset.prevTabindex = prevTabIndex ?? '';
        el.tabIndex = -1;
        el.focus();
        // 還原 tabIndex（使用 setTimeout 確保 focus 完成）
        setTimeout(() => {
          const stored = el.dataset.prevTabindex;
          if (stored === '') {
            el.removeAttribute('tabindex');
          } else if (stored !== undefined) {
            el.tabIndex = Number(stored);
          }
          delete el.dataset.prevTabindex;
        }, 0);
        return;
      }
    }
    if (import.meta.env.DEV) {
      console.warn('[QASection] focusSafeElement: 找不到可聚焦的 fallback 元素');
    }
  };

  const trapFocusWithinModal = (event: KeyboardEvent) => {
    if (event.key !== 'Tab') return;
    const container = getActiveDialog();
    if (!container) return;
    const focusable = getFocusableElements(container);
    
    // 若無可聚焦元素，將焦點設到對話框本身
    if (!focusable.length) {
      const prevTabIndex = container.getAttribute('tabindex');
      container.dataset.prevTabindex = prevTabIndex ?? '';
      container.tabIndex = -1;
      container.focus();
      event.preventDefault();
      return;
    }
    
    const [first] = focusable;
    const last = focusable[focusable.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (!active || !container.contains(active)) {
      first?.focus();
      event.preventDefault();
      return;
    }
    if (!event.shiftKey && active === last) {
      first?.focus();
      event.preventDefault();
    }
    if (event.shiftKey && active === first) {
      last?.focus();
      event.preventDefault();
    }
  };

  useEffect(() => {
    const activeDialog = getActiveDialog();
    if (!activeDialog) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && submitting !== 'ask' && submitting !== 'answer') {
        if (askModalOpen) {
          setAskModalOpen(false);
          resetAskModal();
        }
        if (answerModalOpen) {
          setAnswerModalOpen(false);
          resetAnswerModal();
        }
      }
      trapFocusWithinModal(event);
    };

    const ensureFocusStaysInside = (event: FocusEvent) => {
      if (!activeDialog.contains(event.target as Node)) {
        const focusable = getFocusableElements(activeDialog);
        focusable[0]?.focus();
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('focusin', ensureFocusStaysInside);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('focusin', ensureFocusStaysInside);

      // 還原對話框的 tabIndex（若之前被設為 -1）
      if (activeDialog && activeDialog.dataset.prevTabindex !== undefined) {
        const stored = activeDialog.dataset.prevTabindex;
        if (stored === '') {
          activeDialog.removeAttribute('tabindex');
        } else {
          activeDialog.tabIndex = Number(stored);
        }
        delete activeDialog.dataset.prevTabindex;
      }

      // 確保還原焦點到仍存在於 DOM 的元素
      const target = restoreFocusRef.current;
      if (target && document.body.contains(target)) {
        target.focus();
      } else {
        // Fallback: 使用安全聚焦 helper
        focusSafeElement();
      }
      restoreFocusRef.current = null;
    };
  }, [askModalOpen, answerModalOpen, submitting]);

  useEffect(() => {
    if (!feedback) return () => undefined;
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedback('');
    }, feedbackDurationMs);
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = null;
      }
    };
  }, [feedback, feedbackDurationMs]);

  useEffect(() => {
    if (askModalOpen) {
      requestAnimationFrame(() => {
        askTextareaRef.current?.focus();
      });
    }
  }, [askModalOpen]);

  useEffect(() => {
    if (answerModalOpen) {
      requestAnimationFrame(() => {
        answerTextareaRef.current?.focus();
      });
    }
  }, [answerModalOpen]);

  const handleAskSubmit = async () => {
    const trimmed = askInput.trim();
    if (trimmed.length < MIN_QUESTION_LENGTH) {
      setAskError(`請至少輸入 ${MIN_QUESTION_LENGTH} 個字，描述你的問題。`);
      return;
    }
    if (!onAskQuestion) {
      setAskError('目前無法送出問題，請稍後再試。');
      return;
    }
    setSubmitting('ask');
    setAskError('');
    try {
      await onAskQuestion(trimmed);
      setAskModalOpen(false);
      resetAskModal();
      setFeedback('✅ 問題已送出，住戶將收到通知。');
    } catch (err) {
      console.error('Failed to submit question', err);
      setAskError('送出失敗，請稍後再試。');
    } finally {
      setSubmitting(null);
    }
  };

  const handleAnswerSubmit = async () => {
    const trimmed = answerInput.trim();
    if (!activeQuestion) {
      setAnswerError('找不到問題，請重新選擇。');
      return;
    }
    if (trimmed.length < MIN_ANSWER_LENGTH) {
      setAnswerError(`請至少輸入 ${MIN_ANSWER_LENGTH} 個字，提供有用的資訊。`);
      return;
    }
    if (!onAnswerQuestion) {
      setAnswerError('目前無法送出回答，請稍後再試。');
      return;
    }
    setSubmitting('answer');
    setAnswerError('');
    try {
      await onAnswerQuestion(String(activeQuestion.id), trimmed);
      setAnswerModalOpen(false);
      resetAnswerModal();
      setFeedback('✅ 回答已送出，感謝你的協助。');
    } catch (err) {
      console.error('Failed to submit answer', err);
      setAnswerError('送出失敗，請稍後再試。');
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <section className="scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="qa-heading" id="qa-section">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/3 to-brand-600/1 px-4 py-3.5">
        <div>
          <h2 id="qa-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">
            🙋 準住戶問答
            {unansweredQuestions.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-600">
                {unansweredQuestions.length} 題待回答
              </span>
            )}
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-600">買房前，先問問鄰居怎麼說</p>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {/* 有回答的問題 */}
        {visibleAnswered.map(q => (
          <QACard
            key={q.id}
            q={q}
            perm={perm}
            onAnswer={openAnswerModal}
            isAnswering={submitting === 'answer' && activeQuestion?.id === q.id}
            {...(onUnlock && { onUnlock })}
          />
        ))}

        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenCount > 0 && !!nextHiddenQuestion}
          hiddenCount={hiddenCount}
          countLabel="則問答"
          benefits={['追蹤這題的最新回答', '看更多準住戶關心的問題']}
          {...(onUnlock ? { onCtaClick: onUnlock } : {})}
        >
          {nextHiddenQuestion && (
            <QACard
              q={nextHiddenQuestion}
              perm={perm}
              onAnswer={openAnswerModal}
              isAnswering={submitting === 'answer' && activeQuestion?.id === nextHiddenQuestion.id}
              hideUnlockButton
            />
          )}
        </LockedOverlay>

        {/* 無回答的問題 */}
        {unansweredQuestions.map(q => (
          <QACard
            key={q.id}
            q={q}
            perm={perm}
            isUnanswered
            onAnswer={openAnswerModal}
            isAnswering={submitting === 'answer' && activeQuestion?.id === q.id}
            {...(onUnlock && { onUnlock })}
          />
        ))}

        {/* 發問區塊 */}
        <div className="rounded-[14px] border border-dashed border-border-light bg-brand/3 p-3.5">
          <div className="mb-2 text-sm font-bold text-ink-600">💬 你也有問題想問？</div>
          <p className="mb-2 text-xs text-ink-600">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
          <button
            type="button"
            onClick={openAskModal}
            className="flex w-full items-center justify-center gap-1 rounded-lg border border-brand/10 bg-brand/6 px-2.5 py-1.5 text-[11px] font-semibold text-brand transition hover:bg-brand/12"
          >
            {perm.canAskQuestion ? '我想問問題' : '登入後發問'}
          </button>
        </div>

        {feedback && (
          <p className="text-center text-[11px] text-brand-600" role="status" aria-live="polite">
            {feedback}
          </p>
        )}
      </div>

      {/* 發問 Modal */}
      {askModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div
            ref={askDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ask-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 id="ask-modal-title" className="text-base font-bold text-ink-700">提出你的問題</h3>
                <p className="text-xs text-ink-500">請描述情境，方便住戶提供建議</p>
              </div>
              <button
                type="button"
                className="text-sm text-ink-400 transition hover:text-ink-700"
                onClick={() => {
                  if (submitting === 'ask') return;
                  setAskModalOpen(false);
                  resetAskModal();
                }}
                aria-label="關閉發問視窗"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink-600" htmlFor="qa-ask-textarea">問題內容</label>
              <textarea
                ref={askTextareaRef}
                id="qa-ask-textarea"
                className="h-28 w-full rounded-xl border border-border-light bg-ink-50/40 p-3 text-sm outline-none focus:border-brand"
                placeholder="例：晚上車流聲音大嗎？管理費包含哪些服務？"
                value={askInput}
                onChange={e => setAskInput(e.target.value)}
                maxLength={500}
                disabled={submitting === 'ask'}
              />
              {askError && <p className="text-xs text-error-500" role="alert">{askError}</p>}
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span>至少 {MIN_QUESTION_LENGTH} 個字</span>
                <span>{askInput.length}/500</span>
              </div>
              <button
                type="button"
                onClick={handleAskSubmit}
                disabled={submitting === 'ask'}
                className={`w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition ${submitting === 'ask' ? 'opacity-70' : 'hover:bg-brand-600'}`}
              >
                {submitting === 'ask' ? '送出中…' : '送出問題'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 回答 Modal */}
      {answerModalOpen && activeQuestion && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div
            ref={answerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="answer-modal-title"
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 id="answer-modal-title" className="text-base font-bold text-ink-700">回答問題</h3>
                <p className="text-xs text-ink-500">{activeQuestion.question}</p>
              </div>
              <button
                type="button"
                className="text-sm text-ink-400 transition hover:text-ink-700"
                onClick={() => {
                  if (submitting === 'answer') return;
                  setAnswerModalOpen(false);
                  resetAnswerModal();
                }}
                aria-label="關閉回答視窗"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-ink-600" htmlFor="qa-answer-textarea">回答內容</label>
              <textarea
                ref={answerTextareaRef}
                id="qa-answer-textarea"
                className="h-32 w-full rounded-xl border border-border-light bg-ink-50/40 p-3 text-sm outline-none focus:border-brand"
                placeholder="提供實際經驗、噪音狀況、交通建議等"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                maxLength={800}
                disabled={submitting === 'answer'}
              />
              {answerError && <p className="text-xs text-error-500" role="alert">{answerError}</p>}
              <div className="flex items-center justify-between text-[11px] text-ink-400">
                <span>至少 {MIN_ANSWER_LENGTH} 個字</span>
                <span>{answerInput.length}/800</span>
              </div>
              <button
                type="button"
                onClick={handleAnswerSubmit}
                disabled={submitting === 'answer'}
                className={`w-full rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition ${submitting === 'answer' ? 'opacity-70' : 'hover:bg-brand-600'}`}
              >
                {submitting === 'answer' ? '送出中…' : '送出回答'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
