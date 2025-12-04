/**
 * ReviewsSection Component
 * 
 * 社區評價區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import type { Role, Review } from '../types';
import { getPermissions } from '../types';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { LockedOverlay } from './LockedOverlay';

interface ReviewCardProps {
  review: Review;
}

function ReviewCard({ review }: ReviewCardProps) {
  const pros = review.pros.filter(Boolean);
  const consArray = Array.isArray(review.cons) ? review.cons : [review.cons];
  const cons = consArray.filter(Boolean);
  const hasVisits = review.visits > 0;
  const hasDeals = review.deals > 0;

  return (
    <div className="rounded-[14px] border border-border-light bg-white p-3.5 transition-all hover:border-brand/15 hover:shadow-[0_2px_8px_rgba(0,56,90,0.04)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div 
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-brand bg-gradient-to-br from-brand-100/50 to-white text-sm font-extrabold text-brand" 
          aria-hidden="true"
        >
          {review.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink-900">{review.author}{review.company ? `｜${review.company}` : ''}</div>
          {(hasVisits || hasDeals) && (
            <div className="text-[11px] text-ink-600">
              {hasVisits && `帶看 ${review.visits} 次`}
              {hasVisits && hasDeals && ' · '}
              {hasDeals && `成交 ${review.deals} 戶`}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {pros.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-[10px] bg-gradient-to-br from-brand-50 to-brand-100/50 p-2 text-[13px] leading-relaxed text-ink-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base" aria-hidden="true">✅</span>
            <span className="flex-1">
              {pros.map((text, idx) => (
                <span key={idx} className="block">{text}</span>
              ))}
            </span>
          </div>
        )}
        {cons.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-[10px] bg-gradient-to-br from-brand-100/30 to-brand-100 p-2 text-[13px] leading-relaxed text-ink-900">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base" aria-hidden="true">⚖️</span>
            <span className="flex-1">
              {cons.map((text, idx) => (
                <span key={idx} className="block">{text}</span>
              ))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  role: Role;
  reviews: Review[] | { items: Review[] };
  onUnlock?: () => void;
}

export function ReviewsSection({ role, reviews: reviewsProp, onUnlock }: ReviewsSectionProps) {
  const reviews = Array.isArray(reviewsProp) ? reviewsProp : (reviewsProp?.items ?? []);
  const perm = getPermissions(role);

  // 使用統一的 hook 處理訪客可見項目
  const { visible: visibleReviews, hiddenCount: hiddenReviewCount, nextHidden: nextHiddenReview } = 
    useGuestVisibleItems(reviews, perm.canSeeAllReviews);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/8 to-brand-600/4 px-4 py-3.5">
        <div>
          <h2 id="reviews-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">⭐ 社區評價</h2>
          <p className="mt-0.5 text-[11px] text-ink-600">來自最真實的評價</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand/8 px-2.5 py-1 text-[10px] font-bold text-brand">
          {reviews.length} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {visibleReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
        
        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenReviewCount > 0 && !!nextHiddenReview}
          hiddenCount={hiddenReviewCount}
          countLabel="則評價"
          benefits={['看完所有鄰居真實評價', '社區有新評論時通知你']}
          {...(onUnlock ? { onCtaClick: onUnlock } : {})}
        >
          {nextHiddenReview && (
            <ReviewCard review={nextHiddenReview} />
          )}
        </LockedOverlay>
      </div>
    </section>
  );
}
