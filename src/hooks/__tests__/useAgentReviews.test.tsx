import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { useAgentReviewList, useSubmitReview } from '../useAgentReviews';

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

function createWrapper(queryClient: QueryClient) {
  return ({ children }: WrapperProps) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useAgentReviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
    });
  });

  it('useAgentReviewList loads review list data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            reviews: [
              {
                id: '3f5f96ef-6910-4fe8-83da-f7944f1119d8',
                rating: 5,
                comment: 'great',
                createdAt: '2026-02-09T00:00:00.000Z',
                reviewerName: 'A***',
              },
            ],
            total: 1,
            avgRating: 5,
            distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 1 },
          },
        }),
      })
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    const { result } = renderHook(
      () => useAgentReviewList('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', true),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.avgRating).toBe(5);
  });

  it('useSubmitReview posts review and invalidates related queries', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          reviewId: '3f5f96ef-6910-4fe8-83da-f7944f1119d8',
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useSubmitReview(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        agentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        rating: 5,
        comment: 'excellent service',
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/agent/reviews',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
        }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['agent-reviews', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['agent-profile', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    });
  });
});
