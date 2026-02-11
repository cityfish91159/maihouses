import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, MessageSquare, Star, ThumbsUp } from 'lucide-react';
import { logger } from '../../lib/logger';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import {
  INTERSECTION_THRESHOLD,
  MOCK_TOTAL_REVIEWS,
  REVIEW_KEY_PREVIEW_LENGTH,
} from './constants';

interface CommunityReviewsProps {
  isLoggedIn: boolean;
  communityId?: string | undefined;
  isDemo?: boolean | undefined;
  onToggleLike?: (propertyId: string) => void;
}

interface ReviewPreview {
  initial: string;
  name: string;
  residentLabel: string;
  content: string;
  avatarClass: string;
  propertyId: string;
  liked: boolean;
  totalLikes: number;
}

interface CommunityReviewItem {
  id: string;
  content?: {
    pros?: string[];
    cons?: string;
    property_title?: string | null;
  };
  agent?: {
    name?: string;
  };
}

interface CommunityWallResponse {
  success: boolean;
  data?: {
    data?: CommunityReviewItem[];
    total?: number;
  };
}

const STAR_COUNT = 5;
const FILLED_STAR_COUNT = 4;
const LOCKED_CONTENT_PREVIEW_LENGTH = 36;
const AVATAR_CLASSES = [
  'bg-gradient-to-br from-brand-500 to-brand-700',
  'bg-gradient-to-br from-brand-light to-brand-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
] as const;

const LOCKED_PREVIEW_PLACEHOLDER: ReviewPreview = {
  initial: '住',
  name: '住戶',
  residentLabel: '社區住戶',
  content: '登入後可查看完整住戶評價與社區回饋內容。',
  avatarClass: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  propertyId: '',
  liked: false,
  totalLikes: 0,
};

const MOCK_REVIEWS: ReviewPreview[] = [
  {
    initial: '林',
    name: '林***',
    residentLabel: '信義區住戶',
    content: '透過平台不僅看到了真實的成交行情，還能直接與經紀人溝通，整體體驗非常順暢。',
    avatarClass: 'bg-gradient-to-br from-brand-500 to-brand-700',
    propertyId: 'MH-100001',
    liked: false,
    totalLikes: 3,
  },
  {
    initial: '王',
    name: '王***',
    residentLabel: '住戶評價',
    content: '社區管理很用心，公設維護良好，住戶素質也不錯，住起來很安心。',
    avatarClass: 'bg-gradient-to-br from-brand-light to-brand-600',
    propertyId: 'MH-100002',
    liked: true,
    totalLikes: 7,
  },
  {
    initial: '住',
    name: '住戶',
    residentLabel: '社區住戶',
    content: '樓下就有便利商店和公車站，生活機能很方便，唯一小缺點是假日停車位比較緊張。',
    avatarClass: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
    propertyId: 'MH-100003',
    liked: false,
    totalLikes: 2,
  },
];

function ReviewStars({ className }: { className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${FILLED_STAR_COUNT} 星評價`}>
      {Array.from({ length: STAR_COUNT }, (_, index) => (
        <Star
          key={index}
          size={12}
          className={cn(
            index < FILLED_STAR_COUNT
              ? 'fill-current text-amber-500'
              : 'text-slate-300'
          )}
        />
      ))}
    </div>
  );
}

const maskName = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return '住戶';
  return `${trimmed.charAt(0)}***`;
};

const toPreview = (item: CommunityReviewItem, index: number): ReviewPreview | null => {
  const pros = Array.isArray(item.content?.pros)
    ? item.content.pros.filter(
        (text): text is string => typeof text === 'string' && text.trim().length > 0
      )
    : [];
  const cons = typeof item.content?.cons === 'string' ? item.content.cons.trim() : '';
  const content = [...pros.slice(0, 2), cons].filter(Boolean).join('，');

  if (!content) return null;

  const agentName =
    typeof item.agent?.name === 'string' && item.agent.name.trim().length > 0
      ? item.agent.name
      : '住戶';

  const propertyTitle =
    typeof item.content?.property_title === 'string' ? item.content.property_title.trim() : '';
  const name = maskName(agentName);

  return {
    initial: name.charAt(0) || '住',
    name,
    residentLabel: propertyTitle ? `${propertyTitle}住戶` : '住戶評價',
    content,
    avatarClass: AVATAR_CLASSES[index % AVATAR_CLASSES.length] ?? AVATAR_CLASSES[0],
    propertyId: item.id || '',
    liked: false,
    totalLikes: 0,
  };
};

export const CommunityReviews = memo(function CommunityReviews({
  isLoggedIn,
  communityId,
  isDemo = false,
  onToggleLike,
}: CommunityReviewsProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const useMockData = isDemo && !communityId;
  const [totalReviews, setTotalReviews] = useState<number | null>(() =>
    useMockData ? MOCK_TOTAL_REVIEWS : null
  );
  const [reviewPreviews, setReviewPreviews] = useState<ReviewPreview[]>(() =>
    useMockData ? MOCK_REVIEWS : []
  );
  const ref = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!isVisible || !communityId) return;

    const controller = new AbortController();

    const fetchReviewData = async () => {
      try {
        const response = await fetch(
          `/api/community/wall?communityId=${encodeURIComponent(communityId)}&type=reviews`,
          { signal: controller.signal }
        );
        if (!response.ok) return;

        const json = (await response.json()) as CommunityWallResponse;
        if (!json.success || !json.data) return;

        const items = Array.isArray(json.data.data) ? json.data.data : [];
        const parsedReviews = items
          .map((item, index) => toPreview(item, index))
          .filter((item): item is ReviewPreview => Boolean(item));

        setReviewPreviews(parsedReviews.slice(0, 3));

        if (typeof json.data.total === 'number') {
          setTotalReviews(json.data.total);
        } else if (items.length > 0) {
          setTotalReviews(items.length);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        logger.warn('[CommunityReviews] 無法取得評價資料', { communityId, error });
      }
    };

    void fetchReviewData();

    return () => controller.abort();
  }, [communityId, isVisible]);

  const reviewButtonText =
    totalReviews !== null && totalReviews > 0
      ? `註冊查看全部 ${totalReviews} 則評價`
      : '註冊查看更多評價';

  const publicReviews = useMemo(() => reviewPreviews.slice(0, 2), [reviewPreviews]);
  const lockedReview = reviewPreviews[2] ?? LOCKED_PREVIEW_PLACEHOLDER;

  const handleAuthRedirect = useCallback(() => {
    navigate('/maihouses/auth.html?mode=login');
  }, [navigate]);

  const handleCommunityWall = useCallback(() => {
    navigate('/maihouses/community-wall_mvp.html');
  }, [navigate]);

  const handleToggleLike = useCallback(
    (propertyId: string) => {
      if (isDemo) {
        setReviewPreviews((prev) =>
          prev.map((review) =>
            review.propertyId === propertyId
              ? {
                  ...review,
                  liked: !review.liked,
                  totalLikes: review.liked ? review.totalLikes - 1 : review.totalLikes + 1,
                }
              : review
          )
        );
        return;
      }
      onToggleLike?.(propertyId);
    },
    [isDemo, onToggleLike]
  );

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-bg-card p-4 shadow-sm">
      {isVisible ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <Star size={18} className="fill-current text-amber-500" />
              社區評價
            </h3>
            <span className="rounded-full bg-bg-base px-2 py-1 text-sm text-text-muted">
              住戶社區
            </span>
          </div>

          <div className="space-y-3">
            {publicReviews.length > 0 ? (
              publicReviews.map((review) => (
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
                        onClick={() => handleToggleLike(review.propertyId)}
                        disabled={!isLoggedIn}
                        aria-label={`鼓勵這則評價${review.liked ? '（已鼓勵）' : ''}`}
                        className={cn(
                          'inline-flex min-h-[44px] items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2',
                          review.liked
                            ? 'bg-brand-50 font-medium text-brand-700'
                            : 'bg-bg-base text-text-muted hover:bg-brand-50 hover:text-brand-600',
                          !isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                        )}
                      >
                        <ThumbsUp size={12} />
                        <span>{review.totalLikes > 0 ? review.totalLikes : '實用'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-bg-base p-3 text-sm text-text-muted">
                目前尚無公開評價，登入後可查看更多社區回饋。
              </div>
            )}
          </div>

          <div className="relative mt-3 overflow-hidden rounded-2xl">
            <div className={cn('flex gap-3 bg-bg-base p-3', !isLoggedIn && 'select-none blur-sm')}>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white',
                  lockedReview.avatarClass
                )}
              >
                {lockedReview.initial}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-900">{lockedReview.name}</span>
                  <span className="text-sm text-text-muted">{lockedReview.residentLabel}</span>
                  {isLoggedIn && <ReviewStars className="shrink-0" />}
                </div>
                <p className="text-sm text-ink-600">
                  {isLoggedIn
                    ? lockedReview.content
                    : `${lockedReview.content.slice(0, LOCKED_CONTENT_PREVIEW_LENGTH).trimEnd()}...`}
                </p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-bg-card/80 to-bg-card pb-3">
                <button
                  onClick={handleAuthRedirect}
                  className="flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                >
                  <Lock size={14} />
                  {reviewButtonText}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

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
