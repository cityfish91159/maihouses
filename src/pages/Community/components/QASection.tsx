/**
 * QASection Component
 *
 * 準住戶問答區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Role, Question, Permissions } from '../types';
import { getPermissions } from '../types';
import { canPerformAction, getPermissionDeniedMessage } from '../lib';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import { LockedOverlay } from './LockedOverlay';
import { formatRelativeTimeLabel } from '../../../lib/time';
import { logger } from '../../../lib/logger';
import { useQAModalState } from '../hooks/useQAModalState';

/** 虛擬化啟用門檻：超過此數量才啟用虛擬化 */
const VIRTUALIZATION_THRESHOLD = 10;

/** QACard 預估高度（px），用於虛擬化計算 */
const ESTIMATED_CARD_HEIGHT = 180;

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

function QACard({
  q,
  perm,
  isUnanswered = false,
  onAnswer,
  isAnswering,
  onUnlock,
  hideUnlockButton = false,
}: QACardProps) {
  const displayTime = formatRelativeTimeLabel(q.time);
  return (
    <article
      className={`hover:border-brand/15 rounded-[12px] border p-3 transition-all ${isUnanswered ? 'border-brand-light/30 to-brand-100/30 bg-gradient-to-br from-brand-50' : 'border-border-light bg-white'}`}
    >
      <div className="mb-1.5 text-[13px] font-bold leading-snug text-brand-700">
        Q: {q.question}
      </div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-600">
        <span>👤 準住戶</span>
        <span>· {displayTime}</span>
        {isUnanswered ? (
          <span className="font-bold text-brand-light">· 等待回答中</span>
        ) : (
          <span>· {q.answersCount} 則回覆</span>
        )}
      </div>

      {isUnanswered ? (
        <div className="bg-brand/2 mt-2 rounded-[10px] p-4 text-center text-[13px] text-ink-600">
          🙋 還沒有人回答，成為第一個回答的人！
        </div>
      ) : (
        <div className="flex flex-col gap-1.5 border-l-[3px] border-border-light pl-3">
          {q.answers.map((a) => {
            const answerKey = `${String(q.id)}-${a.type}-${a.author}-${a.content}`;
            return (
              <div key={answerKey} className="py-1.5 text-[12px] leading-relaxed">
                <div className="mb-1 flex flex-wrap items-center gap-1">
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-bold ${a.type === 'agent' ? 'bg-brand-100 text-brand-600' : a.type === 'official' ? 'bg-brand-50 text-brand' : 'bg-brand-100 text-brand'}`}
                  >
                    {a.type === 'agent'
                      ? '🏢 認證房仲'
                      : a.type === 'official'
                        ? `📋 ${a.author}`
                        : `🏠 ${a.author}`}
                  </span>
                  {a.expert && (
                    <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-600">
                      ⭐ 專家回答
                    </span>
                  )}
                </div>
                {a.content}
              </div>
            );
          })}

          {/* 非會員：顯示「還有 X 則回答」+ 註冊按鈕（但在 LockedOverlay 內不顯示） */}
          {!hideUnlockButton && q.hasMoreAnswers && q.totalAnswers && (
            <div className="border-brand/10 to-brand-100/50 mt-2 rounded-lg border bg-gradient-to-r from-brand-50 p-3 text-center">
              <p className="mb-2 text-[13px] text-ink-700">
                🔒 還有{' '}
                <span className="font-bold text-brand">{q.totalAnswers - q.answers.length}</span>{' '}
                則回答
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

      {canPerformAction(perm, 'answer_question') && (
        <div className="mt-2">
          <button
            type="button"
            className={`flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${isUnanswered ? 'border-brand-light/30 bg-brand-light/10 text-brand-600' : 'bg-brand/6 border-brand/10 text-brand'} hover:bg-brand/12`}
            onClick={() => onAnswer?.(q)}
            disabled={isAnswering}
            aria-busy={isAnswering}
            aria-label={isUnanswered ? '搶先回答這個問題' : '回答這個問題'}
          >
            {isAnswering
              ? '⏳ 傳送中…'
              : `💬 ${isUnanswered ? '搶先回答' : '我來回答'}${perm.isAgent ? '（專家）' : ''}`}
          </button>
        </div>
      )}
    </article>
  );
}

/**
 * AUDIT-01 Phase 8: 虛擬化 QA 列表
 *
 * 當問題數量超過門檻時，使用虛擬化渲染提升效能
 * - 減少 DOM 節點數量
 * - 降低記憶體占用
 * - 提升滾動流暢度
 */
interface VirtualizedQAListProps {
  questions: (Question & { hasMoreAnswers?: boolean; totalAnswers?: number })[];
  perm: Permissions;
  isUnanswered?: boolean | undefined;
  onAnswer?: ((question: Question) => void) | undefined;
  activeQuestionId?: string | number | null | undefined;
  isAnswering?: boolean | undefined;
  onUnlock?: (() => void) | undefined;
  /** 容器最大高度（px），超過此高度會出現滾動條 */
  maxHeight?: number | undefined;
}

/**
 * 非虛擬化渲染：當問題數量 <= 門檻時使用
 * 獨立組件避免 useVirtualizer hook 被調用
 */
function SimpleQAList({
  questions,
  perm,
  isUnanswered = false,
  onAnswer,
  activeQuestionId,
  isAnswering,
  onUnlock,
}: Omit<VirtualizedQAListProps, 'maxHeight'>) {
  return (
    <div className="flex flex-col gap-2.5">
      {questions.map((q) => {
        const cardIsAnswering = isAnswering === true && activeQuestionId === q.id;
        return (
          <QACard
            key={q.id}
            q={q}
            perm={perm}
            isUnanswered={isUnanswered}
            isAnswering={cardIsAnswering}
            {...(onAnswer ? { onAnswer } : {})}
            {...(onUnlock ? { onUnlock } : {})}
          />
        );
      })}
    </div>
  );
}

/** 虛擬化容器預設最大高度（px） */
const DEFAULT_VIRTUAL_MAX_HEIGHT = 600;

/** 已回答問題區塊最大高度（px） */
const ANSWERED_SECTION_MAX_HEIGHT = 500;

/** 未回答問題區塊最大高度（px） */
const UNANSWERED_SECTION_MAX_HEIGHT = 400;

/**
 * 虛擬化渲染：當問題數量 > 門檻時使用
 * 獨立組件確保 useVirtualizer hook 只在需要時調用
 */
function VirtualizedQAListInner({
  questions,
  perm,
  isUnanswered = false,
  onAnswer,
  activeQuestionId,
  isAnswering,
  onUnlock,
  maxHeight = DEFAULT_VIRTUAL_MAX_HEIGHT,
}: VirtualizedQAListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const { visibleItems, totalHeight } = useMemo(() => {
    const containerHeight = maxHeight;
    const overscan = 2;

    const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_CARD_HEIGHT) - overscan);
    const endIndex = Math.min(
      questions.length - 1,
      Math.ceil((scrollTop + containerHeight) / ESTIMATED_CARD_HEIGHT) + overscan
    );

    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offsetTop: i * ESTIMATED_CARD_HEIGHT,
      });
    }

    return {
      visibleItems: items,
      totalHeight: questions.length * ESTIMATED_CARD_HEIGHT,
    };
  }, [scrollTop, questions.length, maxHeight]);
  const firstVisibleOffset = visibleItems.length > 0 ? visibleItems[0]?.offsetTop ?? 0 : 0;
  const lastVisibleOffset = visibleItems.length > 0 ? visibleItems[visibleItems.length - 1]?.offsetTop ?? 0 : 0;
  const bottomPadding = Math.max(
    0,
    totalHeight - (lastVisibleOffset + (visibleItems.length > 0 ? ESTIMATED_CARD_HEIGHT : 0))
  );

  useEffect(() => {
    if (!parentRef.current) return;
    parentRef.current.style.maxHeight = `${maxHeight}px`;
  }, [maxHeight]);

  useEffect(() => {
    if (!spacerRef.current) return;
    spacerRef.current.style.paddingTop = `${firstVisibleOffset}px`;
    spacerRef.current.style.paddingBottom = `${bottomPadding}px`;
  }, [firstVisibleOffset, bottomPadding]);

  return (
    <div
      ref={parentRef}
      className="overflow-auto"
      onScroll={handleScroll}
      data-testid="virtualized-container"
    >
      <div ref={spacerRef} className="w-full">
        {visibleItems.map((item) => {
          const q = questions[item.index];
          if (!q) return null;
          const cardIsAnswering = isAnswering === true && activeQuestionId === q.id;
          const isLastItem = item.index === questions.length - 1;
          return (
            <div
              key={q.id}
              data-index={item.index}
              // P3 修復：最後一項不加底部間距，避免多餘空白
              className={isLastItem ? '' : 'pb-2.5'}
            >
              <QACard
                q={q}
                perm={perm}
                isUnanswered={isUnanswered}
                isAnswering={cardIsAnswering}
                {...(onAnswer ? { onAnswer } : {})}
                {...(onUnlock ? { onUnlock } : {})}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 智慧選擇列表組件
 * - 數量 <= 門檻：使用 SimpleQAList（不調用 useVirtualizer）
 * - 數量 > 門檻：使用 VirtualizedQAListInner（啟用虛擬化）
 */
function VirtualizedQAList(props: VirtualizedQAListProps) {
  const shouldVirtualize = props.questions.length > VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return <SimpleQAList {...props} />;
  }

  return <VirtualizedQAListInner {...props} />;
}

interface QASectionProps {
  viewerRole: Role;
  questions: Question[] | { items: Question[] };
  onAskQuestion?: (question: string) => Promise<void> | void;
  onAnswerQuestion?: (questionId: string, content: string) => Promise<void> | void;
  feedbackDurationMs?: number;
  onUnlock?: () => void;
}

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
  // 這樣即使 API 對非會員限流，也能正確分類
  const answeredQuestions = questions.filter(
    (q) => (q.totalAnswers ?? q.answersCount ?? q.answers.length) > 0
  );
  const unansweredQuestions = questions.filter(
    (q) => (q.totalAnswers ?? q.answersCount ?? q.answers.length) === 0
  );

  // 使用統一的 hook 處理訪客可見項目
  const {
    visible: visibleAnswered,
    hiddenCount,
    nextHidden: nextHiddenQuestion,
  } = useGuestVisibleItems(answeredQuestions, perm.isLoggedIn);
  const remainingAnsweredCount = answeredQuestions.length - visibleAnswered.length;

  const showGuestUnlockCta = !perm.isLoggedIn;
  const shouldShowUnlockCta =
    !!onUnlock && (showGuestUnlockCta || hiddenCount > 0 || remainingAnsweredCount > 0);

  const MIN_QUESTION_LENGTH = 10;
  const MIN_ANSWER_LENGTH = 5;

  const rememberTriggerFocus = useCallback(() => {
    // [NASA TypeScript Safety] 使用 instanceof 檢查取代 as HTMLElement
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
  }, [onUnlock, perm, resetAskModal, setAskModalOpen]);

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
    [onUnlock, perm, resetAnswerModal, setActiveQuestion, setAnswerModalOpen]
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

  // AUDIT-01 Phase 7: 使用統一權限檢查函數
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
      const last = focusable.at(-1);
      // [NASA TypeScript Safety] 使用 instanceof 檢查取代 as HTMLElement
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
      // [NASA TypeScript Safety] 使用 instanceof 檢查取代 as Node
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
        {/* AUDIT-01 Phase 8: 使用虛擬化列表渲染已回答問題 */}
        <VirtualizedQAList
          questions={visibleAnswered}
          perm={perm}
          onAnswer={openAnswerModal}
          activeQuestionId={activeQuestion?.id}
          isAnswering={submitting === 'answer'}
          onUnlock={onUnlock}
          maxHeight={ANSWERED_SECTION_MAX_HEIGHT}
        />

        {/* 使用 LockedOverlay 組件 */}
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

        {/* 還沒人回答區塊 - 移至註冊 CTA 上方 */}
        <div className="bg-brand/3 rounded-[14px] border border-dashed border-border-light p-3.5">
          <div className="space-y-2">
            <div className="text-[12px] font-semibold text-brand-700">還沒人回答的問題</div>
            {/* AUDIT-01 Phase 8: 使用虛擬化列表渲染未回答問題 */}
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

        {/* 訪客固定顯示註冊 CTA，放在還沒人回答區塊下方 */}
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
                  setAskModalOpen(false);
                  resetAskModal();
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
                ref={askTextareaRef}
                id="qa-ask-textarea"
                className="bg-ink-50/40 h-28 w-full rounded-xl border border-border-light p-3 text-sm outline-none focus:border-brand"
                placeholder="例：晚上車流聲音大嗎？管理費包含哪些服務？"
                value={askInput}
                onChange={(e) => setAskInput(e.target.value)}
                maxLength={500}
                disabled={submitting === 'ask'}
              />
              {askError && (
                <p className="text-error-500 text-xs" role="alert">
                  {askError}
                </p>
              )}
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
                <h3 id="answer-modal-title" className="text-base font-bold text-ink-700">
                  回答問題
                </h3>
                <p className="text-ink-500 text-xs">{activeQuestion.question}</p>
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
              <label
                className="block text-xs font-semibold text-ink-600"
                htmlFor="qa-answer-textarea"
              >
                回答內容
              </label>
              <textarea
                ref={answerTextareaRef}
                id="qa-answer-textarea"
                className="bg-ink-50/40 h-32 w-full rounded-xl border border-border-light p-3 text-sm outline-none focus:border-brand"
                placeholder="提供實際經驗、噪音狀況、交通建議等"
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                maxLength={800}
                disabled={submitting === 'answer'}
              />
              {answerError && (
                <p className="text-error-500 text-xs" role="alert">
                  {answerError}
                </p>
              )}
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
