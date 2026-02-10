import React, { useRef, useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { AgentReviewListData } from '../types/agent-review';
import { fetchAgentReviews } from '../hooks/useAgentReviews';
import { useFocusTrap } from '../hooks/useFocusTrap';

/** Seed agent（演示用），DB 無評價時改走 mock 路徑 */
const SEED_AGENT_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

interface AgentReviewListModalProps {
  open: boolean;
  agentId: string;
  agentName: string;
  onClose: () => void;
}

const MOCK_REVIEWS: AgentReviewListData = {
  reviews: [
    {
      id: 'mock-1',
      rating: 5,
      comment: '帶看很仔細，解說清楚，推薦！',
      createdAt: '2026-01-15T10:00:00Z',
      reviewerName: '林**',
    },
    {
      id: 'mock-2',
      rating: 5,
      comment: '回覆很快，態度親切。',
      createdAt: '2026-01-10T14:30:00Z',
      reviewerName: '王**',
    },
    {
      id: 'mock-3',
      rating: 4,
      comment: '專業度不錯，但文件準備稍微等了一下。',
      createdAt: '2026-01-05T09:15:00Z',
      reviewerName: '陳**',
    },
  ],
  total: 32,
  avgRating: 4.8,
  distribution: {
    '1': 0,
    '2': 0,
    '3': 2,
    '4': 6,
    '5': 24,
  },
};

export const AgentReviewListModal: React.FC<AgentReviewListModalProps> = ({
  open,
  agentId,
  agentName,
  onClose,
}) => {
  const [page, setPage] = useState(1);
  const isDemo = agentId.startsWith('mock-') || agentId === SEED_AGENT_ID;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useFocusTrap({
    containerRef: dialogRef as React.RefObject<HTMLElement>,
    initialFocusRef: closeButtonRef as React.RefObject<HTMLElement>,
    isActive: open,
    onEscape: onClose,
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['agent-reviews', agentId, page],
    queryFn: () => (isDemo ? Promise.resolve(MOCK_REVIEWS) : fetchAgentReviews(agentId, page)),
    enabled: open && Boolean(agentId),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  if (!open) return null;

  const reviewData = data;
  const hasReviews = reviewData && reviewData.total > 0;

  const renderStarBar = (star: 5 | 4 | 3 | 2 | 1) => {
    const count = reviewData?.distribution[String(star) as '5' | '4' | '3' | '2' | '1'] || 0;
    const percentage = reviewData && reviewData.total > 0 ? (count / reviewData.total) * 100 : 0;

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
          <div className="h-full bg-amber-400 transition-all" style={{ width: `${percentage}%` }} />
        </div>
        <div className="w-16 text-right text-text-muted">
          {count} ({percentage.toFixed(0)}%)
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-list-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-label="關閉服務評價清單"
      />
      <div
        ref={dialogRef}
        className="relative h-[80vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center border-b border-border bg-white px-6 py-4">
          <button
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
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-8 animate-spin text-brand-500" />
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600">
              載入評價時發生錯誤，請稍後再試
            </div>
          )}

          {!isLoading && !error && !hasReviews && (
            <div className="py-12 text-center">
              <Star size={48} className="mx-auto mb-3 fill-none text-border" />
              <p className="text-sm text-text-muted">尚無評價</p>
            </div>
          )}

          {!isLoading && !error && hasReviews && reviewData && (
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
                  {([5, 4, 3, 2, 1] as const).map((star) => renderStarBar(star))}
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

              {reviewData.reviews.length < reviewData.total && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-border px-6 py-2 text-sm font-medium text-ink-900 transition hover:bg-bg-base"
                  >
                    載入更多...
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
