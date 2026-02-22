import React, { useState, useCallback, useRef } from 'react';
import { Star, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '../../lib/logger';
import type { CreateReviewPayload } from '../../types/agent-review';
import {
  agentProfileQueryKey,
  agentReviewsQueryPrefix,
  postAgentReview,
} from '../../hooks/useAgentReviews';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { usePageMode } from '../../hooks/usePageMode';

interface ReviewPromptModalProps {
  open: boolean;
  agentId: string;
  agentName: string;
  trustCaseId: string;
  propertyId?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export const ReviewPromptModal: React.FC<ReviewPromptModalProps> = ({
  open,
  agentId,
  agentName,
  trustCaseId,
  propertyId,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [isBusy, setIsBusy] = useState<boolean>(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const mode = usePageMode();

  useFocusTrap({
    containerRef: dialogRef as React.RefObject<HTMLElement>,
    initialFocusRef: closeButtonRef as React.RefObject<HTMLElement>,
    isActive: open,
    onEscape: onClose,
  });

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      toast.error('請選擇星級評價');
      return;
    }

    if (comment.length > 500) {
      toast.error('評語最多 500 字');
      return;
    }

    if (!trustCaseId.trim()) {
      toast.error('缺少案件資訊，無法送出評價');
      return;
    }

    setIsBusy(true);

    try {
      const payload: CreateReviewPayload = {
        agentId,
        rating,
        comment: comment.trim() || undefined,
        trustCaseId,
        propertyId,
      };

      await postAgentReview(payload);

      toast.success('感謝您的評價！');
      logger.info('Agent review submitted', {
        agentId,
        agentName,
        rating,
        trustCaseId,
        propertyId,
      });

      queryClient.invalidateQueries({ queryKey: agentReviewsQueryPrefix(mode, agentId) });
      queryClient.invalidateQueries({ queryKey: agentProfileQueryKey(mode, agentId) });

      onSubmitted();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to submit agent review', {
        error: errorMessage,
        agentId,
        agentName,
        rating,
      });

      const normalizedMessage = errorMessage.toLowerCase();
      const description = normalizedMessage.includes('unauthorized')
        ? '請先登入後再送出評價'
        : normalizedMessage.includes('網路')
          ? '網路連線異常，請檢查後重試'
          : '請稍後再試';

      toast.error('提交失敗', {
        description,
      });
    } finally {
      setIsBusy(false);
    }
  }, [
    rating,
    comment,
    agentId,
    agentName,
    trustCaseId,
    propertyId,
    onSubmitted,
    onClose,
    queryClient,
    mode,
  ]);

  const handleLater = useCallback(() => {
    logger.info('Agent review prompt dismissed', { agentId });
    onClose();
  }, [agentId, onClose]);

  if (!open) return null;

  const displayRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={handleLater}
        aria-label="關閉評價彈窗"
        tabIndex={-1}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <button
          ref={closeButtonRef}
          onClick={handleLater}
          className="absolute right-4 top-4 rounded-full p-1 text-text-muted transition-colors hover:bg-bg-base"
          aria-label="關閉"
        >
          <X size={20} />
        </button>

        <h2 id="review-modal-title" className="mb-4 text-xl font-bold text-ink-900">
          覺得這次帶看服務如何？
        </h2>

        <div className="mb-4 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
              aria-label={`給 ${star} 顆星`}
            >
              <Star
                size={36}
                className={
                  star <= displayRating ? 'fill-amber-400 text-amber-400' : 'fill-none text-border'
                }
              />
            </button>
          ))}
        </div>

        <div className="mb-4">
          <label htmlFor="review-comment" className="mb-2 block text-sm font-medium text-ink-900">
            留下一句話給房仲（選填）
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
            rows={4}
            className="w-full rounded-lg border border-border p-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="分享您的感受..."
          />
          <div
            className={`mt-1 text-right text-xs ${
              comment.length > 450
                ? 'text-red-600'
                : comment.length > 400
                  ? 'text-amber-600'
                  : 'text-text-muted'
            }`}
          >
            {comment.length}/500
          </div>
        </div>

        {rating === 0 && (
          <p className="mb-2 text-center text-xs text-red-600">請選擇星級評價後才能送出</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleLater}
            disabled={isBusy}
            className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-ink-900 transition hover:bg-bg-base disabled:cursor-not-allowed disabled:opacity-50"
          >
            稍後再說
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy || rating === 0}
            className="flex-1 rounded-lg bg-brand-700 py-3 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isBusy ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-4 animate-spin" /> 送出中
              </span>
            ) : (
              '送出評價'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
