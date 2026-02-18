/**
 * useCommunityList hook 測試
 * #8d 社區探索頁
 */
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement } from 'react';
import type React from 'react';
import { useCommunityList } from '../useCommunityList';

// 合法的 RFC 4122 UUID（第三段 [1-8]、第四段 [89ab] 開頭）
const MOCK_COMMUNITIES = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: '惠宇上晴',
    address: '台中市西屯區',
    image: null,
    post_count: 24,
    review_count: 12,
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: '國泰禾',
    address: '新北市板橋區',
    image: null,
    post_count: 15,
    review_count: 8,
  },
];

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCommunityList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('回傳 isLoading=true 初始狀態', () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => undefined));
    const { result } = renderHook(() => useCommunityList(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('成功載入並回傳社區清單（含中文）', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: MOCK_COMMUNITIES }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { result } = renderHook(() => useCommunityList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(false);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]?.name).toBe('惠宇上晴');
    expect(result.current.data?.[1]?.name).toBe('國泰禾');
  });

  it('HTTP 5xx 時 isError=true', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response('{}', { status: 500 })
    );

    const { result } = renderHook(() => useCommunityList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isError).toBe(true);
  });

  it('API 回傳空陣列時 data 為 []', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { result } = renderHook(() => useCommunityList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('回傳 refetch 函式', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ success: true, data: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { result } = renderHook(() => useCommunityList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(typeof result.current.refetch).toBe('function');
  });
});
