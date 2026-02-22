/**
 * useQAFocusTrap
 *
 * QA 問答區 modal 的 focus trap 邏輯
 * 從 QASection.tsx 抽出以降低主組件行數
 */

import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject, RefObject } from 'react';
import { logger } from '../../../lib/logger';

// ─── 工具函數 ────────────────────────────────────────────────────────────────

function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
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
}

/**
 * 安全聚焦 helper：依序嘗試 main、[data-app-root]、#root、body
 */
function focusSafeElement(timerRef: MutableRefObject<number | null>): void {
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
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        const stored = el.dataset.prevTabindex;
        if (stored === '') {
          el.removeAttribute('tabindex');
        } else if (stored !== undefined) {
          el.tabIndex = Number(stored);
        }
        delete el.dataset.prevTabindex;
        timerRef.current = null;
      }, 0);
      return;
    }
  }
  if (import.meta.env.DEV) {
    logger.warn('[useQAFocusTrap] focusSafeElement: 找不到可聚焦的 fallback 元素');
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

interface UseQAFocusTrapOptions {
  askModalOpen: boolean;
  answerModalOpen: boolean;
  submitting: 'ask' | 'answer' | null;
  askDialogRef: RefObject<HTMLDivElement | null>;
  answerDialogRef: RefObject<HTMLDivElement | null>;
  restoreFocusRef: MutableRefObject<HTMLElement | null>;
  setAskModalOpen: (open: boolean) => void;
  setAnswerModalOpen: (open: boolean) => void;
  resetAskModal: () => void;
  resetAnswerModal: () => void;
}

export function useQAFocusTrap({
  askModalOpen,
  answerModalOpen,
  submitting,
  askDialogRef,
  answerDialogRef,
  restoreFocusRef,
  setAskModalOpen,
  setAnswerModalOpen,
  resetAskModal,
  resetAnswerModal,
}: UseQAFocusTrapOptions): void {
  const focusRestoreTimerRef = useRef<number | null>(null);

  const getActiveDialog = useCallback((): HTMLDivElement | null => {
    return askModalOpen ? askDialogRef.current : answerModalOpen ? answerDialogRef.current : null;
  }, [askModalOpen, askDialogRef, answerModalOpen, answerDialogRef]);

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
    [getActiveDialog]
  );

  // 清理 timer
  useEffect(() => {
    return () => {
      if (focusRestoreTimerRef.current !== null) {
        window.clearTimeout(focusRestoreTimerRef.current);
        focusRestoreTimerRef.current = null;
      }
    };
  }, []);

  // 主要 focus trap effect
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
        focusSafeElement(focusRestoreTimerRef);
      }
      restoreFocusRef.current = null;
    };
  }, [
    askModalOpen,
    answerModalOpen,
    submitting,
    getActiveDialog,
    trapFocusWithinModal,
    resetAnswerModal,
    resetAskModal,
    restoreFocusRef,
    setAnswerModalOpen,
    setAskModalOpen,
  ]);
}
