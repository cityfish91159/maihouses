import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { usePageMode, type PageMode } from './usePageMode';
import {
  ToggleReviewLikePayloadSchema,
  ReviewLikeResponseSchema,
  ReviewLikeApiErrorSchema,
  type ReviewLikeResponse,
} from '../types/community-review-like';

export const reviewLikeQueryKey = (mode: PageMode, propertyId: string) =>
  ['community-review-like', mode, propertyId] as const;

function parseErrorMessage(payload: unknown, fallback: string): string {
  const parsed = ReviewLikeApiErrorSchema.safeParse(payload);
  if (parsed.success && parsed.data.error?.message) {
    return parsed.data.error.message;
  }
  return fallback;
}

export async function fetchReviewLikeStatus(propertyId: string): Promise<ReviewLikeResponse> {
  const parsedPayload = ToggleReviewLikePayloadSchema.safeParse({ propertyId });
  if (!parsedPayload.success) {
    throw new Error('Invalid review like payload');
  }

  const query = new URLSearchParams({ propertyId: parsedPayload.data.propertyId });
  const response = await fetch(`/api/community/review-like?${query.toString()}`);
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseErrorMessage(payload, 'Failed to fetch review-like status'));
  }

  const parsedResponse = ReviewLikeResponseSchema.safeParse(payload);
  if (!parsedResponse.success) {
    throw new Error('Invalid review-like response payload');
  }

  return parsedResponse.data;
}

export async function postReviewLike(propertyId: string): Promise<ReviewLikeResponse> {
  const parsedPayload = ToggleReviewLikePayloadSchema.safeParse({ propertyId });
  if (!parsedPayload.success) {
    throw new Error('Invalid review like payload');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Unauthorized');
  }

  const response = await fetch('/api/community/review-like', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(parsedPayload.data),
  });

  const payload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseErrorMessage(payload, 'Failed to toggle review-like'));
  }

  const parsedResponse = ReviewLikeResponseSchema.safeParse(payload);
  if (!parsedResponse.success) {
    throw new Error('Invalid review-like response payload');
  }

  return parsedResponse.data;
}

export function useCommunityReviewLikeStatus(propertyId: string, enabled = true) {
  const mode = usePageMode();

  return useQuery({
    queryKey: reviewLikeQueryKey(mode, propertyId),
    queryFn: () => fetchReviewLikeStatus(propertyId),
    enabled: enabled && Boolean(propertyId),
    staleTime: 60_000,
  });
}

export function useCommunityReviewLike() {
  const mode = usePageMode();
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: (propertyId: string) => postReviewLike(propertyId),
    onMutate: async (propertyId: string) => {
      const key = reviewLikeQueryKey(mode, propertyId);
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<ReviewLikeResponse>(key);
      if (previous) {
        queryClient.setQueryData<ReviewLikeResponse>(key, {
          ...previous,
          liked: !previous.liked,
          totalLikes: Math.max(0, previous.totalLikes + (previous.liked ? -1 : 1)),
        });
      }

      return { previous, key };
    },
    onError: (_error, _propertyId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSuccess: (_data, propertyId) => {
      queryClient.invalidateQueries({ queryKey: ['agent-profile', mode] });
      queryClient.invalidateQueries({ queryKey: reviewLikeQueryKey(mode, propertyId) });
    },
  });

  return { toggleLike };
}
