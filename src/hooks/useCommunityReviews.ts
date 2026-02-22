/**
 * useCommunityReviews Hook
 *
 * 管理 CommunityReviews 元件的 API 資料獲取和狀態
 * 將元件中的 fetch 邏輯和狀態管理抽取為 hook
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { z } from 'zod';
import { logger } from '../lib/logger';
import { MOCK_TOTAL_REVIEWS } from '../components/PropertyDetail/constants';
import { COMMUNITY_REVIEW_PREVIEWS } from '../constants/mock';

// ========== Types ==========

export interface ReviewPreview {
  initial: string;
  name: string;
  residentLabel: string;
  content: string;
  avatarClass: string;
  propertyId: string;
  liked: boolean;
  totalLikes: number;
}

// ========== Zod Schemas ==========

const CommunityReviewItemSchema = z.object({
  id: z.string(),
  content: z
    .object({
      pros: z.array(z.string()).optional(),
      cons: z.string().optional(),
      property_title: z.string().nullable().optional(),
    })
    .optional(),
  agent: z
    .object({
      name: z.string().optional(),
    })
    .optional(),
});

const CommunityWallResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      data: z.array(CommunityReviewItemSchema).optional(),
      total: z.number().optional(),
    })
    .optional(),
});

type CommunityReviewItem = z.infer<typeof CommunityReviewItemSchema>;

// ========== Constants ==========

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

const MOCK_REVIEWS: ReviewPreview[] = COMMUNITY_REVIEW_PREVIEWS;

// ========== Helper Functions ==========

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

// ========== Hook ==========

interface UseCommunityReviewsOptions {
  communityId: string | undefined;
  isDemo: boolean | undefined;
  isVisible: boolean;
}

interface UseCommunityReviewsReturn {
  reviewPreviews: ReviewPreview[];
  publicReviews: ReviewPreview[];
  lockedReview: ReviewPreview;
  totalReviews: number | null;
  reviewButtonText: string;
  toggleLocalLike: (propertyId: string) => void;
}

export function useCommunityReviews({
  communityId,
  isDemo = false,
  isVisible,
}: UseCommunityReviewsOptions): UseCommunityReviewsReturn {
  // API 模式用 state；mock 模式用下方 localLikeOverrides 疊加常數
  const [fetchedReviews, setFetchedReviews] = useState<ReviewPreview[]>([]);
  const [fetchedTotal, setFetchedTotal] = useState<number | null>(null);

  // Demo 模式本地按讚覆蓋：key = propertyId, value = liked toggle count（奇數 = toggled）
  const [localLikeOverrides, setLocalLikeOverrides] = useState<Record<string, number>>({});

  // Fetch review data when visible（僅 API 模式）
  useEffect(() => {
    if (isDemo || !communityId || !isVisible) return;

    const controller = new AbortController();

    const fetchReviewData = async () => {
      try {
        const response = await fetch(
          `/api/community/wall?communityId=${encodeURIComponent(communityId)}&type=reviews`,
          { signal: controller.signal }
        );
        if (!response.ok) return;

        const json: unknown = await response.json();

        const parseResult = CommunityWallResponseSchema.safeParse(json);
        if (!parseResult.success) {
          logger.warn('[useCommunityReviews] API 回應格式驗證失敗', {
            communityId,
            error: parseResult.error,
          });
          return;
        }

        const { data } = parseResult;
        if (!data.success || !data.data) return;

        const items = data.data.data ?? [];
        const parsedReviews = items
          .map((item, index) => toPreview(item, index))
          .filter((item): item is ReviewPreview => Boolean(item));

        setFetchedReviews(parsedReviews.slice(0, 3));

        if (typeof data.data.total === 'number') {
          setFetchedTotal(data.data.total);
        } else if (items.length > 0) {
          setFetchedTotal(items.length);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        logger.warn('[useCommunityReviews] 無法取得評價資料', { communityId, error });
      }
    };

    void fetchReviewData();

    return () => controller.abort();
  }, [communityId, isDemo, isVisible]);

  // 基底資料：mock 用常數，無 communityId 回空，其餘用 fetch 結果
  const totalReviews = isDemo ? MOCK_TOTAL_REVIEWS : !communityId ? null : fetchedTotal;

  // 套用本地按讚覆蓋（demo 模式按讚不寫 DB）
  const reviewPreviews = useMemo(() => {
    const baseReviews: ReviewPreview[] = isDemo ? MOCK_REVIEWS : !communityId ? [] : fetchedReviews;

    if (Object.keys(localLikeOverrides).length === 0) return baseReviews;
    return baseReviews.map((review) => {
      const toggleCount = localLikeOverrides[review.propertyId];
      if (toggleCount === undefined || toggleCount === 0) return review;
      const toggled = toggleCount % 2 === 1;
      if (!toggled) return review;
      const newLiked = !review.liked;
      return {
        ...review,
        liked: newLiked,
        totalLikes: newLiked ? review.totalLikes + 1 : Math.max(0, review.totalLikes - 1),
      };
    });
  }, [isDemo, communityId, fetchedReviews, localLikeOverrides]);

  // Demo 模式按讚：僅做本地狀態切換，不寫入 API/DB
  const toggleLocalLike = useCallback((propertyId: string) => {
    setLocalLikeOverrides((prev) => ({
      ...prev,
      [propertyId]: (prev[propertyId] ?? 0) + 1,
    }));
  }, []);

  // Computed values
  const publicReviews = useMemo(() => reviewPreviews.slice(0, 2), [reviewPreviews]);
  const lockedReview = reviewPreviews[2] ?? LOCKED_PREVIEW_PLACEHOLDER;

  const reviewButtonText =
    totalReviews !== null && totalReviews > 0
      ? `註冊查看全部 ${totalReviews} 則評價`
      : '註冊查看更多評價';

  return {
    reviewPreviews,
    publicReviews,
    lockedReview,
    totalReviews,
    reviewButtonText,
    toggleLocalLike,
  };
}
