import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  agentProfileQueryKey,
  agentReviewsQueryPrefix,
  postAgentReview,
  useAgentReviewList,
  useSubmitReview,
} from '../useAgentReviews';

const mockUsePageMode = vi.fn();

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
}));

vi.mock('../usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
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
  const mode = 'demo' as const;
  const agentId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue(mode);
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

    const { result } = renderHook(() => useAgentReviewList(agentId, true), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.total).toBe(1);
    expect(result.current.data?.avgRating).toBe(5);
  });

  it('useSubmitReview posts review and invalidates mode-aware keys', async () => {
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
        agentId,
        rating: 5,
        comment: 'excellent service',
        trustCaseId: '12b4af9b-8985-4329-bdcf-3569f9878f56',
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
      queryKey: agentReviewsQueryPrefix(mode, agentId),
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: agentProfileQueryKey(mode, agentId),
    });
  });

  it('postAgentReview rejects payload without trustCaseId', async () => {
    await expect(
      postAgentReview({
        agentId,
        rating: 5,
      } as never)
    ).rejects.toThrow('Invalid review payload');
  });
});
