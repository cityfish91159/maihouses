/**
 * QAVirtualizedList Component
 *
 * 虛擬化問答列表，從 QASection 提取
 * 超過 VIRTUALIZATION_THRESHOLD 題時啟用虛擬滾動
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { Question, Permissions } from '../types';
import { QACard } from './QACard';
import styles from './QAVirtualizedList.module.css';

/** 虛擬化啟用門檻：超過此數量才啟用虛擬化 */
const VIRTUALIZATION_THRESHOLD = 10;

/** QACard 預估高度（px），用於虛擬化計算 */
const ESTIMATED_CARD_HEIGHT = 180;

/** 已回答區塊最大高度 */
export const ANSWERED_SECTION_MAX_HEIGHT = 600;

/** 未回答區塊最大高度 */
export const UNANSWERED_SECTION_MAX_HEIGHT = 400;

export interface VirtualizedQAListProps {
  questions: Question[];
  perm: Permissions;
  isUnanswered?: boolean | undefined;
  onAnswer?: ((question: Question) => void) | undefined;
  activeQuestionId?: string | number | undefined;
  isAnswering?: boolean | undefined;
  onUnlock?: (() => void) | undefined;
  maxHeight?: number | undefined;
}

function SimpleQAList({
  questions,
  perm,
  isUnanswered,
  onAnswer,
  activeQuestionId,
  isAnswering,
  onUnlock,
  maxHeight,
}: VirtualizedQAListProps) {
  const maxHeightClass =
    maxHeight === UNANSWERED_SECTION_MAX_HEIGHT ? styles.unansweredMaxHeight : styles.answeredMaxHeight;

  return (
    <div className={`space-y-2 overflow-auto ${maxHeightClass}`}>
      {questions.map((q) => (
        <QACard
          key={q.id}
          q={q}
          perm={perm}
          isUnanswered={isUnanswered}
          onAnswer={onAnswer}
          isAnswering={isAnswering && activeQuestionId === q.id}
          onUnlock={onUnlock}
        />
      ))}
    </div>
  );
}

function VirtualizedQAListInner({
  questions,
  perm,
  isUnanswered,
  onAnswer,
  activeQuestionId,
  isAnswering,
  onUnlock,
  maxHeight = ANSWERED_SECTION_MAX_HEIGHT,
}: VirtualizedQAListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [maxHeight]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (container) {
      setScrollTop(container.scrollTop);
    }
  }, []);

  const { visibleItems, totalHeight, offsetY } = useMemo(() => {
    const overscan = 3;
    const startIndex = Math.max(0, Math.floor(scrollTop / ESTIMATED_CARD_HEIGHT) - overscan);
    const visibleCount =
      Math.ceil(containerHeight / ESTIMATED_CARD_HEIGHT) + 2 * overscan;
    const endIndex = Math.min(questions.length, startIndex + visibleCount);

    return {
      visibleItems: questions.slice(startIndex, endIndex).map((q, i) => ({
        question: q,
        index: startIndex + i,
      })),
      totalHeight: questions.length * ESTIMATED_CARD_HEIGHT,
      offsetY: startIndex * ESTIMATED_CARD_HEIGHT,
    };
  }, [questions, scrollTop, containerHeight]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--qa-max-height', `${maxHeight}px`);
    }
    if (spacerRef.current) {
      spacerRef.current.style.setProperty('--qa-total-height', `${totalHeight}px`);
    }
    if (offsetRef.current) {
      offsetRef.current.style.setProperty('--qa-offset-y', `${offsetY}px`);
    }
  }, [maxHeight, offsetY, totalHeight]);

  return (
    <div
      ref={containerRef}
      data-testid="virtualized-container"
      className={`overflow-auto ${styles.virtualizedContainer}`}
      onScroll={handleScroll}
    >
      <div ref={spacerRef} className={styles.virtualizedSpacer}>
        <div ref={offsetRef} className={`space-y-2 ${styles.virtualizedOffset}`}>
          {visibleItems.map(({ question: q }) => (
            <QACard
              key={q.id}
              q={q}
              perm={perm}
              isUnanswered={isUnanswered}
              onAnswer={onAnswer}
              isAnswering={isAnswering && activeQuestionId === q.id}
              onUnlock={onUnlock}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function VirtualizedQAList(props: VirtualizedQAListProps) {
  const shouldVirtualize = props.questions.length > VIRTUALIZATION_THRESHOLD;

  if (!shouldVirtualize) {
    return <SimpleQAList {...props} />;
  }

  return <VirtualizedQAListInner {...props} />;
}
