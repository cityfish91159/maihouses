/** 社區評價區塊：顯示住戶評價預覽，支援 demo/live/visitor 模式 */
import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { INTERSECTION_THRESHOLD } from './constants';
import { usePageMode } from '../../hooks/usePageMode';
import { useCommunityReviews } from '../../hooks/useCommunityReviews';
import {
  useCommunityReviewActions,
  type UseCommunityReviewActionsOptions,
} from './useCommunityReviewActions';
import { CommunityReviewsBody } from './CommunityReviewsBody';

interface CommunityReviewsProps {
  isLoggedIn: boolean;
  communityId?: string | undefined;
  onToggleLike?: (propertyId: string) => void;
}

export const CommunityReviews = memo(function CommunityReviews({
  isLoggedIn,
  communityId,
  onToggleLike,
}: CommunityReviewsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const mode = usePageMode();
  const isDemoMode = mode === 'demo';
  const canViewFullReview = mode !== 'visitor';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: INTERSECTION_THRESHOLD }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const { publicReviews, lockedReview, reviewButtonText, toggleLocalLike } = useCommunityReviews({
    communityId,
    isDemo: isDemoMode,
    isVisible,
  });

  const actionOptions: UseCommunityReviewActionsOptions = {
    communityId,
    isDemoMode,
    isLoggedIn,
    toggleLocalLike,
    ...(onToggleLike ? { onToggleLike } : {}),
  };
  const { handleSignupRedirect, handleCommunityWall, handleToggleLike } =
    useCommunityReviewActions(actionOptions);

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-bg-card p-4 shadow-sm">
      {isVisible ? (
        <CommunityReviewsBody
          publicReviews={publicReviews}
          lockedReview={lockedReview}
          canViewFullReview={canViewFullReview}
          reviewButtonText={reviewButtonText}
          onToggleLike={handleToggleLike}
          onSignupRedirect={handleSignupRedirect}
          onCommunityWall={handleCommunityWall}
        />
      ) : (
        <div className={cn('h-96 rounded-xl bg-gray-100', motionA11y.pulse)} />
      )}
    </div>
  );
});
