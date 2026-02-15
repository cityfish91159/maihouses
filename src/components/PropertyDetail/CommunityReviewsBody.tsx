import { ChevronRight, MessageSquare, Star } from 'lucide-react';
import type { ReviewPreview } from '../../hooks/useCommunityReviews';
import { ReviewCard } from './ReviewCard';
import { LockedReviewCard } from './LockedReviewCard';

interface CommunityReviewsBodyProps {
  publicReviews: ReviewPreview[];
  lockedReview: ReviewPreview;
  canViewFullReview: boolean;
  reviewButtonText: string;
  onToggleLike: (propertyId: string) => void;
  onSignupRedirect: () => void;
  onCommunityWall: () => void;
}

export function CommunityReviewsBody({
  publicReviews,
  lockedReview,
  canViewFullReview,
  reviewButtonText,
  onToggleLike,
  onSignupRedirect,
  onCommunityWall,
}: CommunityReviewsBodyProps) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
          <Star size={18} className="fill-current text-amber-500" />
          社區評價
        </h3>
        <span className="rounded-full bg-bg-base px-2 py-1 text-sm text-text-muted">住戶社區</span>
      </div>

      <div className="space-y-3">
        {publicReviews.length > 0 ? (
          publicReviews.map((review) => (
            <ReviewCard key={review.propertyId} review={review} onToggleLike={onToggleLike} />
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-bg-base p-3 text-sm text-text-muted">
            目前尚無公開評價，登入後可查看更多社區回饋。
          </div>
        )}
      </div>

      <LockedReviewCard
        review={lockedReview}
        canViewFullReview={canViewFullReview}
        reviewButtonText={reviewButtonText}
        onCtaClick={onSignupRedirect}
      />

      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
        <p className="flex items-center gap-1 text-sm text-text-muted">
          <MessageSquare size={12} />
          加入社區牆，與其他住戶交流
        </p>
        <button
          onClick={onCommunityWall}
          className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          前往社區牆
          <ChevronRight size={12} />
        </button>
      </div>
    </>
  );
}
