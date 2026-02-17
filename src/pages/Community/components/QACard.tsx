/**
 * QACard Component
 *
 * 單則問答卡片，從 QASection 提取
 */

import type { Question, Permissions } from '../types';
import { canPerformAction } from '../lib';
import { formatRelativeTimeLabel } from '../../../lib/time';

export interface QACardProps {
  q: Question & { hasMoreAnswers?: boolean | undefined; totalAnswers?: number | undefined };
  perm: Permissions;
  isUnanswered?: boolean | undefined;
  onAnswer?: ((question: Question) => void) | undefined;
  isAnswering?: boolean | undefined;
  onUnlock?: (() => void) | undefined;
  /** 當卡片在 LockedOverlay 內時，不顯示內部的解鎖按鈕 */
  hideUnlockButton?: boolean | undefined;
}

export function QACard({
  q,
  perm,
  isUnanswered,
  onAnswer,
  isAnswering,
  onUnlock,
  hideUnlockButton,
}: QACardProps) {
  const totalAnswers = q.totalAnswers ?? q.answersCount ?? q.answers.length;
  const visibleAnswers = q.answers;
  const hasMore = q.hasMoreAnswers ?? totalAnswers > visibleAnswers.length;

  return (
    <div
      className={`rounded-[14px] border p-3 ${
        isUnanswered
          ? 'border-dashed border-border-light bg-white/60'
          : 'border-border-light bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug text-ink-700">{q.question}</p>
          <div className="text-ink-500 mt-1 flex items-center gap-2 text-[10px]">
            <span>{formatRelativeTimeLabel(q.time)}</span>
          </div>
        </div>
        {!isUnanswered && (
          <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-600">
            {totalAnswers} 則回答
          </span>
        )}
      </div>
      {visibleAnswers.length > 0 && (
        <div className="mt-2 space-y-2">
          {visibleAnswers.map((a, idx) => (
            <div key={idx} className="bg-ink-50/40 rounded-xl px-3 py-2">
              <p className="text-xs leading-relaxed text-ink-700">{a.content}</p>
              <div className="text-ink-500 mt-1 flex items-center gap-2 text-[10px]">
                <span>{a.author}</span>
              </div>
            </div>
          ))}
          {hasMore && perm.isLoggedIn && (
            <p className="text-center text-[10px] text-ink-400">
              還有 {totalAnswers - visibleAnswers.length} 則回答
            </p>
          )}
          {hasMore && !perm.isLoggedIn && !hideUnlockButton && onUnlock && (
            <button
              type="button"
              onClick={onUnlock}
              className="bg-brand/5 hover:bg-brand/10 w-full rounded-lg px-2 py-1 text-[10px] font-semibold text-brand transition"
            >
              登入查看更多回答
            </button>
          )}
        </div>
      )}
      {canPerformAction(perm, 'answer_question') && onAnswer && (
        <button
          type="button"
          onClick={() => onAnswer(q)}
          disabled={isAnswering}
          className="bg-brand/5 hover:bg-brand/10 mt-2 w-full rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-brand transition disabled:opacity-60"
        >
          {isAnswering ? '回答中…' : isUnanswered ? '我來回答' : '補充回答'}
        </button>
      )}
    </div>
  );
}
