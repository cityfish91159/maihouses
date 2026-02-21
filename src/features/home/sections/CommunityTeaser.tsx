import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BACKUP_REVIEWS } from '../../../constants/data';
import { ROUTES, RouteUtils } from '../../../constants/routes';
import { HomeCard } from '../components/HomeCard';
import { ReviewCard } from '../components/ReviewCard';
import { getFeaturedHomeReviews } from '../../../services/communityService';
import { usePageMode } from '../../../hooks/usePageMode';
import type { ReviewForUI } from '../../../types/review';

/**
 * 將 ReviewForUI 轉換為 ReviewCard 所需格式
 * - displayId: ReviewForUI.displayId (顯示用字母，給 ReviewCard)
 * - originalId: ReviewForUI.id (原始 UUID，用於 React key)
 * - 保留 source 和 communityId 供點擊導向使用
 */
interface ReviewWithNavigation {
  originalId: string; // 原始 UUID，用於 React key
  displayId: string; // 顯示用字母 (給 ReviewCard)
  name: string;
  rating: number;
  tags: string[];
  content: string;
  source: 'real' | 'seed';
  communityId: string | null;
}

const SKELETON_CARD_KEYS = [
  'community-skeleton-1',
  'community-skeleton-2',
  'community-skeleton-3',
  'community-skeleton-4',
  'community-skeleton-5',
  'community-skeleton-6',
] as const;

/**
 * 將 API 回傳的 ReviewForUI 轉換為組件需要的格式
 * 保留原始 UUID 用於 React key，displayId 用於顯示
 */
function mapToReviewWithNavigation(review: ReviewForUI): ReviewWithNavigation {
  return {
    originalId: review.id, // 原始 UUID
    displayId: review.displayId, // 顯示用字母
    name: review.name,
    rating: review.rating,
    tags: review.tags,
    content: review.content,
    source: review.source,
    communityId: review.communityId,
  };
}

/**
 * 將靜態 BACKUP_REVIEWS 轉換為相容格式
 * backup.id 本身就是唯一字母，同時用於 originalId 和 displayId
 * V3: BACKUP_REVIEWS 現在已包含 source 和 communityId
 */
function mapBackupToReviewWithNavigation(
  backup: (typeof BACKUP_REVIEWS)[number]
): ReviewWithNavigation {
  return {
    originalId: backup.id, // H5: Use stable ID directly
    displayId: backup.id, // 顯示用字母
    name: backup.name,
    rating: backup.rating,
    tags: backup.tags,
    content: backup.content,
    source: backup.source,
    communityId: backup.communityId,
  };
}

/**
 * P9-3: 首頁社區評價區塊
 *
 * 改用 React Query 從 API 取得資料 (V2)
 * - Loading 時顯示 skeleton
 * - Error 時使用 BACKUP_REVIEWS 保底
 * - 點擊 real 評價導向社區頁面，seed 評價導向社區牆
 */
export default function CommunityTeaser() {
  const navigate = useNavigate();
  const mode = usePageMode();
  const explorePath = RouteUtils.toNavigatePath(ROUTES.COMMUNITY_EXPLORE);

  // V2: Use React Query instead of useEffect + useState
  const {
    data: apiReviews,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['featured-reviews', mode],
    queryFn: getFeaturedHomeReviews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // U2: Retry once (handled by React Query now)
  });

  // Determine which reviews to show
  // If error or no data, fallback to BACKUP_REVIEWS
  const reviews =
    isError || !apiReviews
      ? BACKUP_REVIEWS.map(mapBackupToReviewWithNavigation)
      : apiReviews.map(mapToReviewWithNavigation);

  // V1: Extract click handler with useCallback to avoid duplication
  const handleReviewClick = useCallback(
    (review: ReviewWithNavigation) => {
      if (review.source === 'real' && review.communityId) {
        navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(review.communityId)));
      } else {
        navigate(explorePath);
      }
    },
    [navigate, explorePath]
  );

  // Loading skeleton
  if (isLoading) {
    return (
      <HomeCard className="border border-brand-100 bg-bg-card-blur p-3 shadow-card-glow backdrop-blur-md">
        <div className="relative mb-4 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 shadow-header">
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="size-1.5 rounded-full bg-accent-alert shadow-alert-glow" />
            <h3 className="text-shadow-sm m-0 text-lg font-black tracking-wide text-white">
              社區評價
            </h3>
            <span className="rounded-full border border-white/20 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur-sm">
              聚合
            </span>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SKELETON_CARD_KEYS.map((skeletonKey) => (
            <div
              key={skeletonKey}
              className="animate-pulse rounded-2xl border border-brand-100 bg-white p-3.5 motion-reduce:animate-none"
            >
              <div className="flex gap-3">
                <div className="size-[38px] rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                  <div className="h-3 w-full rounded bg-gray-200" />
                  <div className="h-3 w-5/6 rounded bg-gray-200" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 h-12 animate-pulse rounded-xl bg-gray-100 motion-reduce:animate-none" />
      </HomeCard>
    );
  }

  return (
    <HomeCard className="border border-brand-100 bg-bg-card-blur p-3 shadow-card-glow backdrop-blur-md">
      <div className="relative mb-4 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-brand-700 to-brand-600 px-4 py-3 shadow-header">
        {/* Decorative circle for texture */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="size-1.5 rounded-full bg-accent-alert shadow-alert-glow" />
          <h3 className="text-shadow-sm m-0 text-lg font-black tracking-wide text-white">
            社區評價
          </h3>
          <span className="rounded-full border border-white/20 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur-sm">
            聚合
          </span>
        </div>

        {/* Error indicator - 小提示，不影響 UI */}
        {isError && (
          <span className="relative z-10 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] text-yellow-100">
            使用備用資料
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {reviews.map((review) => (
          <button
            type="button"
            key={review.originalId}
            onClick={() => handleReviewClick(review)}
            className="cursor-pointer text-left"
            aria-label={`查看 ${review.name} 的評價詳情`}
          >
            <ReviewCard
              id={review.displayId}
              name={review.name}
              rating={review.rating}
              tags={review.tags}
              content={review.content}
            />
          </button>
        ))}
      </div>

      <button
        type="button"
        className="hover:border-brand-700/20 group relative mt-4 flex items-center gap-2.5 rounded-xl border border-brand-100 bg-gradient-to-b from-white to-brand-50 p-3.5 font-black text-brand-700 no-underline transition-all duration-200 hover:shadow-brand-md active:translate-y-px lg:justify-center lg:text-center"
        onClick={() => navigate(explorePath)}
        aria-label="點我看更多社區評價"
      >
        <span className="text-[15px] tracking-wide transition-colors group-hover:text-brand-600 lg:mx-auto">
          查看更多真實住戶評價
        </span>
        <span className="ml-auto rounded-lg bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-brand-600 lg:absolute lg:right-[14px] lg:top-1/2 lg:ml-0 lg:-translate-y-1/2">
          前往社區牆 →
        </span>
      </button>
    </HomeCard>
  );
}
