import { useState, useEffect } from 'react'
import { BACKUP_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'
import { getFeaturedHomeReviews } from '../../../services/communityService'
import type { ReviewForUI } from '../../../types/review'

/**
 * 將 ReviewForUI 轉換為 ReviewCard 所需格式
 * - displayId: ReviewForUI.displayId (顯示用字母，給 ReviewCard)
 * - originalId: ReviewForUI.id (原始 UUID，用於 React key)
 * - 保留 source 和 communityId 供點擊導向使用
 */
interface ReviewWithNavigation {
  originalId: string;   // 原始 UUID，用於 React key
  displayId: string;    // 顯示用字母 (給 ReviewCard)
  name: string;
  rating: number;
  tags: string[];
  content: string;
  source: 'real' | 'seed';
  communityId: string | null;
}

/**
 * 將 API 回傳的 ReviewForUI 轉換為組件需要的格式
 * 保留原始 UUID 用於 React key，displayId 用於顯示
 */
function mapToReviewWithNavigation(review: ReviewForUI): ReviewWithNavigation {
  return {
    originalId: review.id,      // 原始 UUID
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
 */
function mapBackupToReviewWithNavigation(backup: typeof BACKUP_REVIEWS[number], index: number): ReviewWithNavigation {
  return {
    originalId: `backup-${index}-${backup.id}`, // 生成唯一 ID
    displayId: backup.id,  // 顯示用字母
    name: backup.name,
    rating: backup.rating,
    tags: backup.tags,
    content: backup.content,
    source: 'seed',
    communityId: null,
  };
}

/**
 * P9-3: 首頁社區評價區塊
 * 
 * 改用 useEffect + useState 從 API 取得資料
 * - Loading 時顯示 skeleton
 * - Error 時使用 BACKUP_REVIEWS 保底
 * - 點擊 real 評價導向社區頁面，seed 評價導向社區牆
 */
export default function CommunityTeaser() {
  const [reviews, setReviews] = useState<ReviewWithNavigation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchReviews() {
      try {
        setIsLoading(true);
        setError(null);
        
        const data = await getFeaturedHomeReviews();
        
        if (isMounted) {
          setReviews(data.map(mapToReviewWithNavigation));
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
          // P9-4: API 失敗時使用 BACKUP_REVIEWS 保底
          setReviews(BACKUP_REVIEWS.map((backup, index) => mapBackupToReviewWithNavigation(backup, index)));
          setIsLoading(false);
        }
      }
    }

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * P9-3: 處理評價卡片點擊
   * - source: 'real' → 導向社區牆頁面 /community/{communityId}/wall
   * - source: 'seed' → 導向社區牆 /maihouses/community-wall_mvp.html
   */
  const handleReviewClick = (review: ReviewWithNavigation) => {
    if (review.source === 'real' && review.communityId) {
      window.location.href = `/community/${review.communityId}/wall`;
    } else {
      window.location.href = '/maihouses/community-wall_mvp.html';
    }
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <HomeCard className="bg-white/96 border border-[#E6EDF7] p-3 shadow-[0_4px_20px_rgba(0,56,90,0.03)] backdrop-blur-md">
        <div className="relative mb-4 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#00385a] to-[#005585] px-4 py-3 shadow-[0_2px_8px_rgba(0,56,90,0.15)]">
          <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="size-1.5 rounded-full bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.6)]" />
            <h3 className="text-shadow-sm m-0 text-lg font-black tracking-wide text-white">社區評價</h3>
            <span className="rounded-full border border-white/20 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#00385a] shadow-sm backdrop-blur-sm">
              聚合
            </span>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-[#E6EDF7] bg-white p-3.5">
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

        <div className="mt-4 h-12 animate-pulse rounded-xl bg-gray-100" />
      </HomeCard>
    );
  }

  return (
    <HomeCard className="bg-white/96 border border-[#E6EDF7] p-3 shadow-[0_4px_20px_rgba(0,56,90,0.03)] backdrop-blur-md">
      <div className="relative mb-4 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#00385a] to-[#005585] px-4 py-3 shadow-[0_2px_8px_rgba(0,56,90,0.15)]">
        {/* Decorative circle for texture */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="size-1.5 rounded-full bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.6)]" />
          <h3 className="text-shadow-sm m-0 text-lg font-black tracking-wide text-white">社區評價</h3>
          <span className="rounded-full border border-white/20 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#00385a] shadow-sm backdrop-blur-sm">
            聚合
          </span>
        </div>
        
        {/* Error indicator - 小提示，不影響 UI */}
        {error && (
          <span className="relative z-10 rounded-full bg-yellow-500/20 px-2 py-0.5 text-[10px] text-yellow-100">
            使用備用資料
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {reviews.map((review) => (
          <div
            key={review.originalId}
            onClick={() => handleReviewClick(review)}
            onKeyDown={(e) => e.key === 'Enter' && handleReviewClick(review)}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            aria-label={`查看 ${review.name} 的評價詳情`}
          >
            <ReviewCard
              id={review.displayId}
              name={review.name}
              rating={review.rating}
              tags={review.tags}
              content={review.content}
            />
          </div>
        ))}
      </div>

      <a
        className="group relative mt-4 flex items-center gap-2.5 rounded-xl border border-[#E6EDF7] bg-gradient-to-b from-white to-[#F6F9FF] p-3.5 font-black text-[#00385a] no-underline transition-all duration-200 hover:border-[#00385a]/20 hover:shadow-[0_4px_12px_rgba(0,56,90,0.08)] active:translate-y-px lg:justify-center lg:text-center"
        href="/maihouses/community-wall_mvp.html"
        aria-label="點我看更多社區評價"
      >
        <span className="text-[15px] tracking-wide transition-colors group-hover:text-[#004E7C] lg:mx-auto">
          查看更多真實住戶評價
        </span>
        <span className="ml-auto rounded-lg bg-[#00385a] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-[#004E7C] lg:absolute lg:right-[14px] lg:top-1/2 lg:ml-0 lg:-translate-y-1/2">
          前往社區牆 →
        </span>
      </a>
    </HomeCard>
  )
}

