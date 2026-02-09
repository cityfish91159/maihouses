import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCommunityReviewLike } from '../useCommunityReviewLike';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock supabase
const mockGetSession = vi.fn();
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useCommunityReviewLike', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should toggle like successfully', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'valid-token' } },
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, liked: true, totalLikes: 10 }),
    });

    const { result } = renderHook(() => useCommunityReviewLike(), {
      wrapper: createWrapper(),
    });

    result.current.toggleLike.mutate('prop-123');

    await waitFor(() => {
      expect(result.current.toggleLike.isSuccess).toBe(true);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/community/review-like', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ propertyId: 'prop-123' }),
    }));
  });

  it('should handle unauthorized error', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null }, // No token
    });

    const { result } = renderHook(() => useCommunityReviewLike(), {
      wrapper: createWrapper(),
    });

    result.current.toggleLike.mutate('prop-123');

    await waitFor(() => {
      expect(result.current.toggleLike.isError).toBe(true);
    });
    
    expect(result.current.toggleLike.error).toEqual(new Error('Unauthorized'));
  });
});
