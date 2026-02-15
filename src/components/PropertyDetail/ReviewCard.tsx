import { ThumbsUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { ReviewPreview } from '../../hooks/useCommunityReviews';
import { ReviewStars } from './ReviewStars';

interface ReviewCardProps {
  review: ReviewPreview;
  onToggleLike: (propertyId: string) => void;
}

export function ReviewCard({ review, onToggleLike }: ReviewCardProps) {
  return (
    <div className="flex gap-3 rounded-2xl bg-bg-base p-3 transition-all duration-200 hover:shadow-md active:scale-[0.98] motion-reduce:transform-none">
      <div
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white',
          review.avatarClass
        )}
      >
        {review.initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-bold text-ink-900">{review.name}</span>
          <span className="text-sm text-text-muted">{review.residentLabel}</span>
          <ReviewStars className="shrink-0" />
        </div>
        <p className="text-sm leading-relaxed text-ink-600">{review.content}</p>
        <div className="mt-2 flex items-center gap-1">
          <button
            onClick={() => onToggleLike(review.propertyId)}
            aria-label={`鼓勵這則評價${review.liked ? '（已鼓勵）' : ''}`}
            className={cn(
              'inline-flex min-h-[44px] items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
              review.liked
                ? 'bg-brand-50 font-medium text-brand-700'
                : 'bg-bg-base text-text-muted hover:bg-brand-50 hover:text-brand-600'
            )}
          >
            <ThumbsUp size={12} />
            <span>{review.totalLikes > 0 ? review.totalLikes : '實用'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
