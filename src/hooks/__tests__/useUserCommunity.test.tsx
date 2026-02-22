import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import type React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserCommunity } from '../useUserCommunity';

const mockGetSession = vi.hoisted(() => vi.fn());

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
    },
  },
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useUserCommunity', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    mockGetSession.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('未登入時不發送 API 請求且回傳 null', () => {
    const { result } = renderHook(
      () =>
        useUserCommunity({
          isAuthenticated: false,
          userId: null,
        }),
      { wrapper: makeWrapper() }
    );

    expect(result.current.communityId).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('已登入且有社區歸屬時回傳 communityId', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { communityId: '11111111-1111-4111-8111-111111111111' },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const { result } = renderHook(
      () =>
        useUserCommunity({
          isAuthenticated: true,
          userId: 'user-1',
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.communityId).toBe('11111111-1111-4111-8111-111111111111');
    expect(fetch).toHaveBeenCalledWith('/api/community/my', {
      headers: {
        Authorization: 'Bearer token-123',
      },
    });
  });

  it('已登入但沒有 access token 時回傳 null', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { result } = renderHook(
      () =>
        useUserCommunity({
          isAuthenticated: true,
          userId: 'user-1',
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.communityId).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('API 回傳 401 時回傳 null 且不拋錯', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ success: false }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { result } = renderHook(
      () =>
        useUserCommunity({
          isAuthenticated: true,
          userId: 'user-1',
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.communityId).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('API 成功但資料格式錯誤時 isError=true', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'token-123' } },
    });

    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { communityId: 'not-a-uuid' },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    );

    const { result } = renderHook(
      () =>
        useUserCommunity({
          isAuthenticated: true,
          userId: 'user-1',
        }),
      { wrapper: makeWrapper() }
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.communityId).toBeNull();
    expect(result.current.isError).toBe(true);
  });
});

