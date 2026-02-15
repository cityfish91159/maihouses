import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { AgentReviewListData, AgentReview } from '../types/agent-review';
import { agentReviewsQueryKey, fetchAgentReviews } from '../hooks/useAgentReviews';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { usePageMode, type PageMode } from '../hooks/usePageMode';
import { AGENT_REVIEW_LIST_MOCK_DATA } from '../constants/mock';

interface AgentReviewListModalProps {
  open: boolean;
  agentId: string;
  agentName: string;
  onClose: () => void;
}

const STAR_LEVELS: Array<5 | 4 | 3 | 2 | 1> = [5, 4, 3, 2, 1];

/**
 * 外層元件：用 key 控制內層重掛，使 open/agentId/mode 變化時自動重置所有內部 state。
 */
export const AgentReviewListModal: React.FC<AgentReviewListModalProps> = (props) => {
  const mode = usePageMode();

  if (!props.open) return null;

  return (
    <AgentReviewListModalInner
      key={`${props.agentId}-${mode}`}
      {...props}
      mode={mode}
    />
  );
};

interface InnerProps extends AgentReviewListModalProps {
  mode: PageMode;
}

const AgentReviewListModalInner: React.FC<InnerProps> = ({
  agentId,
  agentName,
  onClose,
  mode,
}) => {
  const [page, setPage] = useState(1);
  const [accumulatedReviews, setAccumulatedReviews] = useState<AgentReviewListData['reviews']>([]);
  const useMockReviews = mode === 'demo';
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    containerRef: dialogRef,
    initialFocusRef: closeButtonRef,
    isActive: true,
    onEscape: onClose,
  });

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: agentReviewsQueryKey(mode, agentId, page),
    queryFn: () =>
      useMockReviews ? Promise.resolve(AGENT_REVIEW_LIST_MOCK_DATA) : fetchAgentReviews(agentId, page),
    enabled: Boolean(agentId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // 用 useMemo derived state：合併已累積的 reviews 與當前頁面 data
  const reviewData = useMemo<AgentReviewListData | null>(() => {
    if (!data) return null;
    if (useMockReviews || (page === 1 && accumulatedReviews.length === 0)) return data;
    const merged: AgentReviewListData['reviews'] = [];
    const seen = new Set<string>();
    for (const review of accumulatedReviews) {
      if (!seen.has(review.id)) {
        seen.add(review.id);
        merged.push(review);
      }
    }
    for (const review of data.reviews) {
      if (!seen.has(review.id)) {
        seen.add(review.id);
        merged.push(review);
      }
    }
    return {
      ...data,
      reviews: merged.length > 0 ? merged : data.reviews,
    };
  }, [accumulatedReviews, data, page, useMockReviews]);

  // 點擊「載入更多」時：先把當前已知的所有 reviews 快照到 accumulated，再翻頁
  const handleLoadMore = useCallback(() => {
    setAccumulatedReviews((prev) => {
      if (!data) return prev;
      const existingIds = new Set(prev.map((r) => r.id));
      const newReviews = data.reviews.filter((r: AgentReview) => !existingIds.has(r.id));
      return newReviews.length > 0 ? [...prev, ...newReviews] : prev;
    });
    setPage((prevPage) => prevPage + 1);
  }, [data]);

  const hasReviews = Boolean(reviewData && reviewData.total > 0);
  const isInitialLoading = isLoading && !reviewData;
  const isLoadingMore = isFetching && page > 1;
  const loadedCount = reviewData?.reviews.length ?? 0;
  const totalCount = reviewData?.total ?? 0;
  const canLoadMore = !useMockReviews && totalCount > loadedCount;

  const getDistributionCount = (star: 5 | 4 | 3 | 2 | 1): number => {
    if (!reviewData) return 0;
    switch (star) {
      case 5:
        return reviewData.distribution['5'];
      case 4:
        return reviewData.distribution['4'];
      case 3:
        return reviewData.distribution['3'];
      case 2:
        return reviewData.distribution['2'];
      case 1:
        return reviewData.distribution['1'];
      default:
        return 0;
    }
  };

  const renderStarBar = (star: 5 | 4 | 3 | 2 | 1) => {
    const count = getDistributionCount(star);
    const percentage = reviewData && reviewData.total > 0 ? (count / reviewData.total) * 100 : 0;
    const filledSegments = Math.round(percentage / 5);

    return (
      <div key={star} className="flex items-center gap-2 text-xs">
        <div className="flex w-16 items-center gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Star
              key={i}
              size={12}
              className={i < star ? 'fill-amber-400 text-amber-400' : 'fill-none text-border'}
            />
          ))}
        </div>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-base">
          <div className="grid-cols-20 grid h-full gap-px">
            {Array.from({ length: 20 }, (_, idx) => (
              <span
                key={idx}
                className={idx < filledSegments ? 'bg-amber-400' : 'bg-transparent'}
              />
            ))}
          </div>
        </div>
        <div className="w-16 text-right text-text-muted">
          {count} ({percentage.toFixed(0)}%)
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="關閉評價列表"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-list-modal-title"
        className="relative z-10 h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center border-b border-border bg-white px-6 py-4">
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            className="mr-3 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-base"
            aria-label="返回"
          >
            <X size={20} />
          </button>
          <h2 id="review-list-modal-title" className="flex-1 text-lg font-bold text-ink-900">
            {agentName} 的服務評價
          </h2>
        </div>

        <div className="h-[calc(80vh-73px)] overflow-y-auto p-6">
          {isInitialLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-brand-500 motion-reduce:animate-none" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              載入評價時發生錯誤，請稍後再試
            </div>
          )}

          {!isInitialLoading && !error && !hasReviews && (
            <div className="py-12 text-center">
              <Star size={48} className="mx-auto mb-3 fill-none text-border" />
              <p className="text-sm text-text-muted">尚無評價</p>
            </div>
          )}

          {!isInitialLoading && !error && hasReviews && reviewData && (
            <>
              <div className="mb-6 rounded-lg border border-border bg-bg-base p-4">
                <div className="mb-4 flex items-baseline gap-2">
                  <Star size={28} className="fill-amber-400 text-amber-400" />
                  <span className="text-3xl font-bold text-ink-900">
                    {reviewData.avgRating.toFixed(1)}
                  </span>
                  <span className="text-sm text-text-muted">({reviewData.total} 則評價)</span>
                </div>

                <div className="space-y-1.5">
                  {STAR_LEVELS.map((star) => renderStarBar(star))}
                </div>
              </div>

              <div className="space-y-4">
                {reviewData.reviews.map((review) => {
                  const formattedDate = new Date(review.createdAt).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  });

                  return (
                    <div key={review.id} className="rounded-lg border border-border bg-white p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-900">{review.reviewerName}</span>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < review.rating
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'fill-none text-border'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-text-muted">{formattedDate}</span>
                      </div>
                      {review.comment && (
                        <p className="whitespace-pre-wrap text-sm text-ink-700">{review.comment}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {canLoadMore && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isFetching}
                    className="rounded-lg border border-border px-6 py-2 text-sm font-medium text-ink-900 transition hover:bg-bg-base disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoadingMore ? '載入中...' : '載入更多...'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
