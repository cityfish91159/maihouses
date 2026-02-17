/**
 * QASection Component
 *
 * 準住戶問答區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Role, Question } from '../types';
import { getPermissions } from '../types';
import { canPerformAction, getPermissionDeniedMessage } from '../lib';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import { LockedOverlay } from './LockedOverlay';
import { logger } from '../../../lib/logger';
import { useQAModalState } from '../hooks/useQAModalState';
import { QACard } from './QACard';
import { VirtualizedQAList, ANSWERED_SECTION_MAX_HEIGHT, UNANSWERED_SECTION_MAX_HEIGHT } from './QAVirtualizedList';
import { AskModal, AnswerModal } from './QAModals';

interface QASectionProps {
  viewerRole: Role;
  questions: Question[] | { items: Question[] };
  onAskQuestion?: (question: string) => Promise<void> | void;
  onAnswerQuestion?: (questionId: string, content: string) => Promise<void> | void;
  feedbackDurationMs?: number;
  onUnlock?: () => void;
}

const MIN_QUESTION_LENGTH = 10;
const MIN_ANSWER_LENGTH = 5;

export function QASection({
  viewerRole,
  questions: questionsProp,
  onAskQuestion,
  onAnswerQuestion,
  feedbackDurationMs = 5000,
  onUnlock,
}: QASectionProps) {
  const questions = Array.isArray(questionsProp) ? questionsProp : questionsProp?.items || [];
  const perm = getPermissions(viewerRole);
  const [feedback, setFeedback] = useState('');
  const focusRestoreTimerRef = useRef<number | null>(null);
  const {
    askModalOpen,
    setAskModalOpen,
    askInput,
    setAskInput,
    answerModalOpen,
    setAnswerModalOpen,
    answerInput,
    setAnswerInput,
    activeQuestion,
    setActiveQuestion,
    submitting,
    setSubmitting,
    askError,
    setAskError,
    answerError,
    setAnswerError,
    askDialogRef,
    answerDialogRef,
    askTextareaRef,
    answerTextareaRef,
    feedbackTimeoutRef,
    restoreFocusRef,
    resetAskModal,
    resetAnswerModal,
  } = useQAModalState();

  // 使用 totalAnswers（API 回傳總數）或 answersCount 判斷是否有回答
  const answeredQuestions = questions.filter(
    (q) => (q.totalAnswers ?? q.answersCount ?? q.answers.length) > 0
  );
  const unansweredQuestions = questions.filter(
    (q) => (q.totalAnswers ?? q.answersCount ?? q.answers.length) === 0
  );

  const {
    visible: visibleAnswered,
    hiddenCount,
    nextHidden: nextHiddenQuestion,
  } = useGuestVisibleItems(answeredQuestions, perm.isLoggedIn);
  const remainingAnsweredCount = answeredQuestions.length - visibleAnswered.length;

  const showGuestUnlockCta = !perm.isLoggedIn;
  const shouldShowUnlockCta =
    !!onUnlock && (showGuestUnlockCta || hiddenCount > 0 || remainingAnsweredCount > 0);

  // --- Modal open handlers ---

  const rememberTriggerFocus = useCallback(() => {
    const active = document.activeElement;
    restoreFocusRef.current = active instanceof HTMLElement ? active : null;
  }, [restoreFocusRef]);

  const openAskModalForPermittedUser = useCallback(() => {
    if (!canPerformAction(perm, 'ask_question')) {
      if (onUnlock) {
        onUnlock();
        return;
      }
      const msg = getPermissionDeniedMessage('ask_question');
      setFeedback(`⚠️ ${msg.title}`);
      return;
    }
    rememberTriggerFocus();
    resetAskModal();
    setAskModalOpen(true);
  }, [onUnlock, perm, rememberTriggerFocus, resetAskModal, setAskModalOpen]);

  const openAnswerModalForPermittedUser = useCallback(
    (question: Question) => {
      if (!canPerformAction(perm, 'answer_question')) {
        if (onUnlock) {
          onUnlock();
          return;
        }
        const msg = getPermissionDeniedMessage('answer_question');
        setFeedback(`⚠️ ${msg.title}`);
        return;
      }
      rememberTriggerFocus();
      resetAnswerModal();
      setActiveQuestion(question);
      setAnswerModalOpen(true);
    },
    [onUnlock, perm, rememberTriggerFocus, resetAnswerModal, setActiveQuestion, setAnswerModalOpen]
  );

  const showDiscussionRegisterGuide = useCallback(
    (_question?: Question) => {
      if (onUnlock) {
        onUnlock();
        return;
      }
      setFeedback('⚠️ 請先登入或註冊');
    },
    [onUnlock]
  );

  const dispatchOpenAskModal = useModeAwareAction<undefined>({
    visitor: showDiscussionRegisterGuide,
    demo: () => openAskModalForPermittedUser(),
    live: () => openAskModalForPermittedUser(),
  });

  const dispatchOpenAnswerModal = useModeAwareAction<Question>({
    visitor: showDiscussionRegisterGuide,
    demo: (question) => openAnswerModalForPermittedUser(question),
    live: (question) => openAnswerModalForPermittedUser(question),
  });

  const openAskModal = useCallback(() => {
    void dispatchOpenAskModal(undefined).then((result) => {
      if (!result.ok) {
        logger.error('[QASection] Failed to open ask modal', { error: result.error });
        setFeedback('⚠️ 目前無法開啟發問視窗，請稍後再試。');
      }
    });
  }, [dispatchOpenAskModal]);

  const openAnswerModal = useCallback((question: Question) => {
    void dispatchOpenAnswerModal(question).then((result) => {
      if (!result.ok) {
        logger.error('[QASection] Failed to open answer modal', { error: result.error });
        setFeedback('⚠️ 目前無法開啟回答視窗，請稍後再試。');
      }
    });
  }, [dispatchOpenAnswerModal]);

  // --- Focus trap ---

  const getActiveDialog = useCallback((): HTMLDivElement | null => {
    return askModalOpen ? askDialogRef.current : answerModalOpen ? answerDialogRef.current : null;
  }, [askModalOpen, askDialogRef, answerModalOpen, answerDialogRef]);

  const getFocusableElements = useCallback((container: HTMLElement | null): HTMLElement[] => {
    if (!container) return [];
    const selector = 'a[href], button, textarea, input, select, [tabindex]';
    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter((el) => {
      const tabIndexAttr = el.getAttribute('tabindex');
      const tabIndex = typeof tabIndexAttr === 'string' ? Number(tabIndexAttr) : undefined;
      const isDisabled = el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true';
      const isHidden = el.hasAttribute('aria-hidden');
      const isNegativeTabIndex = typeof tabIndex === 'number' && tabIndex < 0;
      return !isDisabled && !isHidden && !isNegativeTabIndex;
    });
  }, []);

  /**
   * 安全聚焦 helper：依序嘗試 main、[data-app-root]、#root、body
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
        if (focusRestoreTimerRef.current !== null) {
          window.clearTimeout(focusRestoreTimerRef.current);
        }
        focusRestoreTimerRef.current = window.setTimeout(() => {
          const stored = el.dataset.prevTabindex;
          if (stored === '') {
            el.removeAttribute('tabindex');
          } else if (stored !== undefined) {
            el.tabIndex = Number(stored);
          }
          delete el.dataset.prevTabindex;
          focusRestoreTimerRef.current = null;
        }, 0);
        return;
      }
    }
    if (import.meta.env.DEV) {
      logger.warn('[QASection] focusSafeElement: 找不到可聚焦的 fallback 元素');
    }
  };

  useEffect(() => {
    return () => {
      if (focusRestoreTimerRef.current !== null) {
        window.clearTimeout(focusRestoreTimerRef.current);
        focusRestoreTimerRef.current = null;
      }
    };
  }, []);

  const trapFocusWithinModal = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const container = getActiveDialog();
      if (!container) return;
      const focusable = getFocusableElements(container);

      if (!focusable.length) {
        const prevTabIndex = container.getAttribute('tabindex');
        container.dataset.prevTabindex = prevTabIndex ?? '';
        container.tabIndex = -1;
        container.focus();
        event.preventDefault();
        return;
      }

      const [first] = focusable;
      const last = focusable.at(-1);
      const activeEl = document.activeElement;
      const active = activeEl instanceof HTMLElement ? activeEl : null;
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
    },
    [getActiveDialog, getFocusableElements]
  );

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
      const targetNode = event.target instanceof Node ? event.target : null;
      if (!targetNode || !activeDialog.contains(targetNode)) {
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

      if (activeDialog && activeDialog.dataset.prevTabindex !== undefined) {
        const stored = activeDialog.dataset.prevTabindex;
        if (stored === '') {
          activeDialog.removeAttribute('tabindex');
        } else {
          activeDialog.tabIndex = Number(stored);
        }
        delete activeDialog.dataset.prevTabindex;
      }

      const target = restoreFocusRef.current;
      if (target && document.body.contains(target)) {
        target.focus();
      } else {
        focusSafeElement();
      }
      restoreFocusRef.current = null;
    };
  }, [
    askModalOpen,
    answerModalOpen,
    submitting,
    getActiveDialog,
    trapFocusWithinModal,
    getFocusableElements,
    resetAnswerModal,
    resetAskModal,
    restoreFocusRef,
    setAnswerModalOpen,
    setAskModalOpen,
  ]);

  // --- Feedback timer ---

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
  }, [feedback, feedbackDurationMs, feedbackTimeoutRef]);

  // --- Auto-focus textarea ---

  useEffect(() => {
    if (askModalOpen) {
      requestAnimationFrame(() => {
        askTextareaRef.current?.focus();
      });
    }
  }, [askModalOpen, askTextareaRef]);

  useEffect(() => {
    if (answerModalOpen) {
      requestAnimationFrame(() => {
        answerTextareaRef.current?.focus();
      });
    }
  }, [answerModalOpen, answerTextareaRef]);

  // --- Submit handlers ---

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
      logger.error('[QASection] Failed to submit question', { error: err });
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
      logger.error('[QASection] Failed to submit answer', { error: err });
      setAnswerError('送出失敗，請稍後再試。');
    } finally {
      setSubmitting(null);
    }
  };

  // --- Modal close handlers ---

  const handleCloseAskModal = useCallback(() => {
    setAskModalOpen(false);
    resetAskModal();
  }, [setAskModalOpen, resetAskModal]);

  const handleCloseAnswerModal = useCallback(() => {
    setAnswerModalOpen(false);
    resetAnswerModal();
  }, [setAnswerModalOpen, resetAnswerModal]);

  return (
    <section
      className="bg-white/98 scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light shadow-[0_2px_12px_rgba(0,51,102,0.04)]"
      aria-labelledby="qa-heading"
      id="qa-section"
    >
      <div className="from-brand/3 to-brand-600/1 border-brand/5 flex items-center justify-between border-b bg-gradient-to-br px-4 py-3.5">
        <div>
          <h2
            id="qa-heading"
            className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700"
          >
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
      <div className="flex flex-col gap-2.5 p-3.5 pb-12">
        <VirtualizedQAList
          questions={visibleAnswered}
          perm={perm}
          onAnswer={openAnswerModal}
          activeQuestionId={activeQuestion?.id}
          isAnswering={submitting === 'answer'}
          onUnlock={onUnlock}
          maxHeight={ANSWERED_SECTION_MAX_HEIGHT}
        />

        <LockedOverlay
          visible={hiddenCount > 0 && !!nextHiddenQuestion}
          hiddenCount={hiddenCount}
          countLabel="則問答"
          benefits={['查看完整問答', '新回答通知']}
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

        {/* 還沒人回答區塊 */}
        <div className="bg-brand/3 rounded-[14px] border border-dashed border-border-light p-3.5">
          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-brand-700">還沒人回答的問題</div>
            {unansweredQuestions.length > 0 ? (
              <VirtualizedQAList
                questions={unansweredQuestions}
                perm={perm}
                isUnanswered
                onAnswer={openAnswerModal}
                activeQuestionId={activeQuestion?.id}
                isAnswering={submitting === 'answer'}
                onUnlock={onUnlock}
                maxHeight={UNANSWERED_SECTION_MAX_HEIGHT}
              />
            ) : (
              <div className="rounded-[10px] border border-dashed border-border-light bg-white/80 p-3 text-center text-[12px] text-ink-600">
                目前沒有待回答的問題，登入後可解鎖更多或發問。
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-col gap-1">
            <div className="text-sm font-bold text-ink-600">💬 你也有問題想問？</div>
            <p className="text-xs text-ink-600">問題會通知該社區住戶，通常 24 小時內會有回覆</p>
            <button
              type="button"
              onClick={openAskModal}
              className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand transition"
            >
              {canPerformAction(perm, 'ask_question') ? '我想問問題' : '登入後發問'}
            </button>
          </div>
        </div>

        {/* 訪客註冊 CTA */}
        {shouldShowUnlockCta && (
          <div className="bg-brand/4 border-brand/10 rounded-[12px] border p-3 text-center">
            <div className="text-sm font-bold text-brand-700">免費註冊 / 登入</div>
            <p className="mt-1 text-[12px] text-ink-600">
              {remainingAnsweredCount > 0
                ? `還有 ${remainingAnsweredCount} 則問答可解鎖，追蹤最新回覆`
                : '解鎖更多問答、追蹤最新回覆'}
            </p>
            <button
              type="button"
              onClick={onUnlock}
              className="mt-2 w-full rounded-lg bg-brand px-3 py-2 text-[12px] font-semibold text-white shadow-sm transition hover:bg-brand-dark"
            >
              立即解鎖
            </button>
          </div>
        )}

        {feedback && (
          <p className="text-center text-[11px] text-brand-600" role="status" aria-live="polite">
            {feedback}
          </p>
        )}
      </div>

      <AskModal
        open={askModalOpen}
        dialogRef={askDialogRef}
        textareaRef={askTextareaRef}
        input={askInput}
        onInputChange={setAskInput}
        error={askError}
        onClose={handleCloseAskModal}
        onSubmit={handleAskSubmit}
        submitting={submitting}
        minLength={MIN_QUESTION_LENGTH}
      />

      <AnswerModal
        open={answerModalOpen}
        question={activeQuestion}
        dialogRef={answerDialogRef}
        textareaRef={answerTextareaRef}
        input={answerInput}
        onInputChange={setAnswerInput}
        error={answerError}
        onClose={handleCloseAnswerModal}
        onSubmit={handleAnswerSubmit}
        submitting={submitting}
        minLength={MIN_ANSWER_LENGTH}
      />
    </section>
  );
}
