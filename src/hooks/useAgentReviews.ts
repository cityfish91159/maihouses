import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '../lib/supabase';
import {
  AgentReviewListResponseSchema,
  CreateReviewPayloadSchema,
  CreateReviewResponseSchema,
  type AgentReviewListData,
  type CreateReviewPayload,
} from '../types/agent-review';

// Error Response Schema for safe error message extraction
const ErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const STALE_TIME_MS = 2 * 60 * 1000;

export async function fetchAgentReviews(
  agentId: string,
  page = DEFAULT_PAGE,
  limit = DEFAULT_LIMIT
): Promise<AgentReviewListData> {
  const query = new URLSearchParams({
    agentId,
    page: String(page),
    limit: String(limit),
  });
  const response = await fetch(`/api/agent/reviews?${query.toString()}`);
  const payload: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorParse = ErrorResponseSchema.safeParse(payload);
    throw new Error(
      errorParse.success && errorParse.data.error?.message
        ? errorParse.data.error.message
        : 'Failed to fetch reviews'
    );
  }

  const parsed = AgentReviewListResponseSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error('Invalid response payload for agent reviews');
  }

  return parsed.data.data;
}

export async function postAgentReview(payload: CreateReviewPayload): Promise<{ reviewId: string }> {
  const parsedPayload = CreateReviewPayloadSchema.safeParse(payload);
  if (!parsedPayload.success) {
    throw new Error('Invalid review payload');
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Unauthorized');
  }

  const response = await fetch('/api/agent/reviews', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(parsedPayload.data),
  });

  const responsePayload: unknown = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorParse = ErrorResponseSchema.safeParse(responsePayload);
    throw new Error(
      errorParse.success && errorParse.data.error?.message
        ? errorParse.data.error.message
        : 'Failed to submit review'
    );
  }

  const parsedResponse = CreateReviewResponseSchema.safeParse(responsePayload);
  if (!parsedResponse.success) {
    throw new Error('Invalid response payload for review creation');
  }

  return parsedResponse.data.data;
}

export function useAgentReviewList(agentId: string, enabled: boolean, page = 1, limit = 10) {
  return useQuery({
    queryKey: ['agent-reviews', agentId, page, limit],
    queryFn: () => fetchAgentReviews(agentId, page, limit),
    enabled: enabled && Boolean(agentId),
    staleTime: STALE_TIME_MS,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => postAgentReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-reviews', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-profile', variables.agentId] });
    },
  });
}
