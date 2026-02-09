import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  fetchReviewLikeStatus,
  postReviewLike,
  reviewLikeQueryKey,
  useCommunityReviewLike,
} from '../useCommunityReviewLike';

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

type WrapperProps = { children: ReactNode };

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

function createWrapper(queryClient: QueryClient) {
  return ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCommunityReviewLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
    });
  });

  it('fetchReviewLikeStatus returns parsed payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, liked: false, totalLikes: 6 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await fetchReviewLikeStatus('MH-100001');

    expect(fetchMock).toHaveBeenCalledWith('/api/community/review-like?propertyId=MH-100001');
    expect(result).toEqual({ success: true, liked: false, totalLikes: 6 });
  });

  it('fetchReviewLikeStatus throws API error message when request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'Property not found' } }),
      })
    );

    await expect(fetchReviewLikeStatus('MH-404')).rejects.toThrow('Property not found');
  });

  it('postReviewLike throws Unauthorized when no auth session exists', async () => {
    mockGetSession.mockResolvedValue({
      data: {
        session: null,
      },
    });

    await expect(postReviewLike('MH-100001')).rejects.toThrow('Unauthorized');
  });

  it('postReviewLike sends bearer token and returns parsed payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, liked: true, totalLikes: 8 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await postReviewLike('MH-100001');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/community/review-like',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ propertyId: 'MH-100001' }),
      })
    );
    expect(result).toEqual({ success: true, liked: true, totalLikes: 8 });
  });

  it('useCommunityReviewLike applies optimistic update then commits server payload', async () => {
    type FetchResponse = {
      ok: boolean;
      json: () => Promise<{ success: true; liked: boolean; totalLikes: number }>;
    };
    let resolveFetch: ((value: FetchResponse) => void) | null = null;
    const fetchPromise: Promise<FetchResponse> = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(fetchPromise));

    const queryClient = createQueryClient();
    const propertyId = 'MH-100001';
    queryClient.setQueryData(reviewLikeQueryKey(propertyId), {
      success: true,
      liked: false,
      totalLikes: 1,
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCommunityReviewLike(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.toggleLike.mutate(propertyId);
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(reviewLikeQueryKey(propertyId))).toMatchObject({
        liked: true,
        totalLikes: 2,
      });
    });

    if (!resolveFetch) {
      throw new Error('Expected deferred fetch resolver to be initialized');
    }

    resolveFetch({
      ok: true,
      json: async () => ({ success: true, liked: true, totalLikes: 4 }),
    });

    await waitFor(() => {
      expect(result.current.toggleLike.isSuccess).toBe(true);
    });

    expect(queryClient.getQueryData(reviewLikeQueryKey(propertyId))).toMatchObject({
      liked: true,
      totalLikes: 4,
    });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['agent-profile'] });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: reviewLikeQueryKey(propertyId),
    });
  });

  it('useCommunityReviewLike rolls back optimistic update on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: 'toggle failed' } }),
      })
    );

    const queryClient = createQueryClient();
    const propertyId = 'MH-100001';
    queryClient.setQueryData(reviewLikeQueryKey(propertyId), {
      success: true,
      liked: true,
      totalLikes: 4,
    });

    const { result } = renderHook(() => useCommunityReviewLike(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.toggleLike.mutate(propertyId);
    });

    await waitFor(() => {
      expect(result.current.toggleLike.isError).toBe(true);
    });

    expect(queryClient.getQueryData(reviewLikeQueryKey(propertyId))).toMatchObject({
      liked: true,
      totalLikes: 4,
    });
  });
});
