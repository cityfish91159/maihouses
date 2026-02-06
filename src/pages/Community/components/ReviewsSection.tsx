/**
 * ReviewsSection Component
 *
 * 社區評價區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useMemo } from 'react';
import type { Role, Review } from '../types';
import { getPermissions } from '../types';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { LockedOverlay } from './LockedOverlay';

interface ReviewEntry {
  id: string;
  type: 'pro' | 'con';
  text: string;
  author: string;
  company: string;
  visits: number;
  deals: number;
}

interface ReviewCardProps {
  entry: ReviewEntry;
}

function ReviewCard({ entry }: ReviewCardProps) {
  const isPro = entry.type === 'pro';
  const hasVisits = entry.visits > 0;
  const hasDeals = entry.deals > 0;

  return (
    <div className="hover:border-brand/15 rounded-[14px] border border-border-light bg-white p-3.5 transition-all hover:shadow-brand-xs">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div
          className="from-brand-100/50 flex size-[38px] items-center justify-center rounded-full border-2 border-brand bg-gradient-to-br to-white text-sm font-extrabold text-brand"
          aria-hidden="true"
        >
          {entry.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink-900">
            {entry.author}
            {entry.company ? `｜${entry.company}` : ''}
          </div>
          {(hasVisits || hasDeals) && (
            <div className="text-[11px] text-ink-600">
              {hasVisits && `帶看 ${entry.visits} 次`}
              {hasVisits && hasDeals && ' · '}
              {hasDeals && `成交 ${entry.deals} 戶`}
            </div>
          )}
        </div>
      </div>
      <div
        className={`flex items-start gap-2.5 rounded-[10px] p-2 text-[13px] leading-relaxed ${isPro ? 'to-brand-100/50 bg-gradient-to-br from-brand-50' : 'from-brand-100/30 bg-gradient-to-br to-brand-100'}`}
      >
        <span
          className="flex size-6 shrink-0 items-center justify-center text-base"
          aria-hidden="true"
        >
          {isPro ? '✅' : '⚖️'}
        </span>
        <span className="flex-1 text-ink-900">{entry.text}</span>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  viewerRole: Role;
  reviews: Review[] | { items: Review[] };
  onUnlock?: () => void;
}

export function ReviewsSection({
  viewerRole,
  reviews: reviewsProp,
  onUnlock,
}: ReviewsSectionProps) {
  // Memoize reviews to ensure stable identity for downstream useMemo
  const reviews = useMemo(
    () => (Array.isArray(reviewsProp) ? reviewsProp : (reviewsProp?.items ?? [])),
    [reviewsProp]
  );
  const perm = getPermissions(viewerRole);

  const reviewEntries = useMemo<ReviewEntry[]>(() => {
    const entries: ReviewEntry[] = [];
    reviews.forEach((review) => {
      review.pros.forEach((pro, idx) => {
        if (!pro) return;
        entries.push({
          id: `${review.id}-pro-${idx}`,
          type: 'pro',
          text: pro,
          author: review.author,
          company: review.company,
          visits: review.visits,
          deals: review.deals,
        });
      });
      const consArray = Array.isArray(review.cons) ? review.cons : [review.cons];
      consArray.forEach((con, idx) => {
        if (!con) return;
        entries.push({
          id: `${review.id}-con-${idx}`,
          type: 'con',
          text: con,
          author: review.author,
          company: review.company,
          visits: review.visits,
          deals: review.deals,
        });
      });
    });
    return entries;
  }, [reviews]);

  // 使用統一的 hook 處理訪客可見項目（以單則 pros/cons 為單位）
  const {
    visible: visibleEntries,
    hiddenCount: hiddenReviewCount,
    nextHidden: nextHiddenEntry,
  } = useGuestVisibleItems(reviewEntries, perm.canSeeAllReviews);

  return (
    <section
      className="bg-white/98 overflow-hidden rounded-[18px] border border-border-light shadow-[0_2px_12px_rgba(0,51,102,0.04)]"
      aria-labelledby="reviews-heading"
    >
      <div className="from-brand/8 to-brand-600/4 border-brand/5 flex items-center justify-between border-b bg-gradient-to-br px-4 py-3.5">
        <div>
          <h2
            id="reviews-heading"
            className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700"
          >
            ⭐ 社區評價
          </h2>
          <p className="mt-0.5 text-[11px] text-ink-600">來自最真實的評價</p>
        </div>
        <span className="bg-brand/8 flex items-center gap-1 rounded-full border border-brand-600 px-2.5 py-1 text-[10px] font-bold text-brand">
          {reviews.length} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {visibleEntries.map((entry) => (
          <ReviewCard key={entry.id} entry={entry} />
        ))}

        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenReviewCount > 0 && !!nextHiddenEntry}
          hiddenCount={hiddenReviewCount}
          countLabel="則評價"
          benefits={['查看全部評價', '新回答通知']}
          {...(onUnlock ? { onCtaClick: onUnlock } : {})}
        >
          {nextHiddenEntry && <ReviewCard entry={nextHiddenEntry} />}
        </LockedOverlay>
      </div>
    </section>
  );
}
