import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Lock, ChevronRight, MessageSquare } from 'lucide-react';
import { logger } from '../../lib/logger';

interface CommunityReviewsProps {
  isLoggedIn: boolean;
  communityId?: string | undefined;
}

interface ReviewPreview {
  initial: string;
  name: string;
  residentLabel: string;
  stars: string;
  content: string;
  avatarClass: string;
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

const AVATAR_CLASSES = ['bg-brand-700', 'bg-brand-light', 'bg-green-500'] as const;
const LOCKED_PREVIEW_PLACEHOLDER: ReviewPreview = {
  initial: '住',
  name: '住戶',
  residentLabel: '社區住戶',
  stars: '★★★★★',
  content: '登入後可查看完整住戶評價與社區回饋內容。',
  avatarClass: 'bg-green-500',
};

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
    stars: '★★★★★',
    content,
    avatarClass: AVATAR_CLASSES[index % AVATAR_CLASSES.length] ?? 'bg-brand-700',
  };
};

export const CommunityReviews = memo(function CommunityReviews({
  isLoggedIn,
  communityId,
}: CommunityReviewsProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [totalReviews, setTotalReviews] = useState<number | null>(null);
  const [reviewPreviews, setReviewPreviews] = useState<ReviewPreview[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!communityId || !isVisible) return;

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
    navigate('/maihouses/auth.html?redirect=community');
  }, [navigate]);

  const handleCommunityWall = useCallback(() => {
    navigate('/maihouses/community-wall_mvp.html');
  }, [navigate]);

  return (
    <div ref={ref} className="rounded-2xl border border-border bg-bg-card p-4 shadow-sm">
      {isVisible ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
              <Star size={18} className="text-yellow-500" fill="currentColor" />
              社區評價
            </h3>
            <span className="rounded-full bg-bg-base px-2 py-1 text-xs text-text-muted">
              住戶社區
            </span>
          </div>

          <div className="space-y-3">
            {publicReviews.length > 0 ? (
              publicReviews.map((review) => (
                <div
                  key={`${review.name}-${review.content.slice(0, 12)}`}
                  className="flex gap-3 rounded-xl bg-bg-base p-3"
                >
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${review.avatarClass}`}
                  >
                    {review.initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-ink-900">{review.name}</span>
                      <span className="text-xs text-text-muted">{review.residentLabel}</span>
                      <span className="text-xs text-yellow-500">{review.stars}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-ink-600">{review.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-bg-base p-3 text-sm text-text-muted">
                目前尚無公開評價，登入後可查看更多社區回饋。
              </div>
            )}
          </div>

          <div className="relative mt-3 overflow-hidden rounded-xl">
            <div
              className={`flex gap-3 bg-bg-base p-3 ${!isLoggedIn ? 'select-none blur-sm' : ''}`}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white ${lockedReview.avatarClass}`}
              >
                {lockedReview.initial}
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-bold text-ink-900">{lockedReview.name}</span>
                  <span className="text-xs text-text-muted">{lockedReview.residentLabel}</span>
                  {isLoggedIn && (
                    <span className="text-xs text-yellow-500">{lockedReview.stars}</span>
                  )}
                </div>
                <p className="text-sm text-ink-600">
                  {isLoggedIn
                    ? lockedReview.content
                    : `${lockedReview.content.slice(0, 36).trimEnd()}...`}
                </p>
              </div>
            </div>

            {!isLoggedIn && (
              <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-white/80 to-white pb-3">
                <button
                  onClick={handleAuthRedirect}
                  className="flex min-h-[44px] items-center gap-2 rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white shadow-lg transition-colors hover:bg-brand-600 focus:ring-2 focus:ring-brand-500"
                >
                  <Lock size={14} />
                  {reviewButtonText}
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <p className="flex items-center gap-1 text-xs text-text-muted">
              <MessageSquare size={12} />
              加入社區牆，與其他住戶交流
            </p>
            <button
              onClick={handleCommunityWall}
              className="flex min-h-[44px] items-center gap-1 rounded text-xs font-bold text-brand-700 hover:underline focus:ring-2 focus:ring-brand-500"
            >
              前往社區牆
              <ChevronRight size={12} />
            </button>
          </div>
        </>
      ) : (
        <div className="h-96 animate-pulse rounded-xl bg-gray-100"></div>
      )}
    </div>
  );
});
