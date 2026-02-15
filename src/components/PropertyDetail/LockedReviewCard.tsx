import { ChevronRight, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ReviewPreview } from '../../hooks/useCommunityReviews';
import { ReviewStars } from './ReviewStars';

const LOCKED_CONTENT_PREVIEW_LENGTH = 36;

interface LockedReviewCardProps {
  review: ReviewPreview;
  canViewFullReview: boolean;
  reviewButtonText: string;
  onCtaClick: () => void;
}

export function LockedReviewCard({
  review,
  canViewFullReview,
  reviewButtonText,
  onCtaClick,
}: LockedReviewCardProps) {
  return (
    <div className="relative mt-3 overflow-hidden rounded-2xl">
      <div className={cn('flex gap-3 bg-bg-base p-3', !canViewFullReview && 'select-none blur-sm')}>
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white',
            review.avatarClass
          )}
        >
          {review.initial}
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-sm font-bold text-ink-900">{review.name}</span>
            <span className="text-sm text-text-muted">{review.residentLabel}</span>
            {canViewFullReview && <ReviewStars className="shrink-0" />}
          </div>
          <p className="text-sm text-ink-600">
            {canViewFullReview
              ? review.content
              : `${review.content.slice(0, LOCKED_CONTENT_PREVIEW_LENGTH).trimEnd()}...`}
          </p>
        </div>
      </div>

      {!canViewFullReview && (
        <div className="via-bg-card/80 absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent to-bg-card pb-3">
          <button
            onClick={onCtaClick}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
          >
            <Lock size={14} />
            {reviewButtonText}
            <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
