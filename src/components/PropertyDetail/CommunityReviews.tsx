/**
 * CommunityReviews Component
 *
 * 社區評價區塊，顯示住戶評價預覽
 * 支援 demo 模式和真實 API 資料
 *
 * 重構說明：
 * - API fetch 和狀態管理抽取至 useCommunityReviews hook
 * - Zod schema 移至 hook
 */

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Lock, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getCurrentPath, getLoginUrl, getSignupUrl } from '../../lib/authUtils';
import { ROUTES } from '../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../constants/seed';
import { notify } from '../../lib/notify';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { INTERSECTION_THRESHOLD, REVIEW_KEY_PREVIEW_LENGTH } from './constants';
import { useModeAwareAction } from '../../hooks/useModeAwareAction';
import { usePageMode } from '../../hooks/usePageMode';
import { useCommunityReviews } from '../../hooks/useCommunityReviews';
import type { ReviewPreview } from '../../hooks/useCommunityReviews';

// ========== Constants ==========

const STAR_COUNT = 5;
const FILLED_STAR_COUNT = 4;
const LOCKED_CONTENT_PREVIEW_LENGTH = 36;
const REGISTER_GUIDE_TITLE = '註冊後即可鼓勵評價';
const REGISTER_GUIDE_DESCRIPTION = '免費註冊即可解鎖完整社區評價與互動。';

// ========== Sub-components ==========

function ReviewStars({ className }: { className?: string }) {
  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      aria-label={`${FILLED_STAR_COUNT} 星評價`}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Star
          key={index}
          size={12}
          className={cn(
            index < FILLED_STAR_COUNT ? 'fill-current text-amber-500' : 'text-slate-300'
          )}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: ReviewPreview;
  onToggleLike: (propertyId: string) => void;
}

function ReviewCard({ review, onToggleLike }: ReviewCardProps) {
  return (
    <div
      key={`${review.name}-${review.content.slice(0, REVIEW_KEY_PREVIEW_LENGTH)}`}
      className="flex gap-3 rounded-2xl bg-bg-base p-3 transition-all duration-200 hover:shadow-md active:scale-[0.98] motion-reduce:transform-none"
    >
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

interface LockedReviewCardProps {
  review: ReviewPreview;
  canViewFullReview: boolean;
  reviewButtonText: string;
  onCtaClick: () => void;
}

function LockedReviewCard({
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

// ========== Main Component ==========

interface CommunityReviewsProps {
  isLoggedIn: boolean;
  communityId?: string | undefined;
  isDemo?: boolean | undefined;
  onToggleLike?: (propertyId: string) => void;
}

export const CommunityReviews = memo(function CommunityReviews({
  isLoggedIn,
  communityId,
  isDemo = false,
  onToggleLike,
}: CommunityReviewsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const mode = usePageMode();
  const isDemoMode = mode === 'demo' || isDemo;
  const canViewFullReview = mode !== 'visitor' || isDemoMode;

  // Intersection Observer for lazy loading
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

  // Use custom hook for data fetching and state
  const { publicReviews, lockedReview, reviewButtonText, toggleLocalLike } = useCommunityReviews({
    communityId,
    isDemo: isDemoMode,
    isVisible,
  });

  // Auth redirect handler
  const currentPath = getCurrentPath();
  const loginUrl = getLoginUrl(currentPath);
  const signupUrl = getSignupUrl(currentPath);

  const handleAuthRedirect = useCallback(() => {
    window.location.href = loginUrl;
  }, [loginUrl]);
  const handleSignupRedirect = useCallback(() => {
    window.location.href = signupUrl;
  }, [signupUrl]);

  // Community wall navigation
  const handleCommunityWall = useCallback(() => {
    if (communityId) {
      navigate(ROUTES.COMMUNITY_WALL(communityId));
      return;
    }

    if (isDemoMode) {
      navigate(ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID));
      return;
    }

    notify.info('暫時無法前往社區牆', '目前缺少社區識別資料，請稍後再試。');
  }, [communityId, isDemoMode, navigate]);

  const dispatchToggleLike = useModeAwareAction<string>({
    visitor: () => {
      notify.info(REGISTER_GUIDE_TITLE, REGISTER_GUIDE_DESCRIPTION, {
        action: {
          label: '免費註冊',
          onClick: handleSignupRedirect,
        },
      });
    },
    demo: (propertyId) => {
      toggleLocalLike(propertyId);
    },
    live: (propertyId) => {
      if (!isLoggedIn) {
        notify.info('請先登入', '登入後即可鼓勵評價。', {
          action: {
            label: '前往登入',
            onClick: handleAuthRedirect,
          },
        });
        return;
      }
      onToggleLike?.(propertyId);
    },
  });

  const handleToggleLike = useCallback(
    (propertyId: string) => {
      void dispatchToggleLike(propertyId);
    },
    [dispatchToggleLike]
  );

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-bg-card p-4 shadow-sm">
      {isVisible ? (
        <>
          {/* Header */}
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <Star size={18} className="fill-current text-amber-500" />
              社區評價
            </h3>
            <span className="rounded-full bg-bg-base px-2 py-1 text-sm text-text-muted">
              住戶社區
            </span>
          </div>

          {/* Public Reviews */}
          <div className="space-y-3">
            {publicReviews.length > 0 ? (
              publicReviews.map((review) => (
                <ReviewCard
                  key={`${review.name}-${review.content.slice(0, REVIEW_KEY_PREVIEW_LENGTH)}`}
                  review={review}
                  onToggleLike={handleToggleLike}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-bg-base p-3 text-sm text-text-muted">
                目前尚無公開評價，登入後可查看更多社區回饋。
              </div>
            )}
          </div>

          {/* Locked Review */}
          <LockedReviewCard
            review={lockedReview}
            canViewFullReview={canViewFullReview}
            reviewButtonText={reviewButtonText}
            onCtaClick={handleSignupRedirect}
          />

          {/* Footer CTA */}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <p className="flex items-center gap-1 text-sm text-text-muted">
              <MessageSquare size={12} />
              加入社區牆，與其他住戶交流
            </p>
            <button
              onClick={handleCommunityWall}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 transition-colors hover:bg-brand-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              前往社區牆
              <ChevronRight size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className={cn('h-96 rounded-xl bg-gray-100', motionA11y.pulse)} />
      )}
    </div>
  );
});
