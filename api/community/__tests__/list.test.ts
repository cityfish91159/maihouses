import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../list';
import { getSupabaseAdmin } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type MockRequest = {
  method: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers: Record<string, string | undefined>;
};

type MockResponse = {
  statusCode: number;
  jsonData: unknown;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
};

const COMMUNITY_A = '11111111-1111-4111-8111-111111111111';
const COMMUNITY_B = '22222222-2222-4222-8222-222222222222';
const COMMUNITY_C = '33333333-3333-4333-8333-333333333333';

function createMockRequest(input?: Partial<MockRequest>): MockRequest {
  return {
    method: input?.method ?? 'GET',
    query: input?.query ?? {},
    body: input?.body ?? {},
    headers: input?.headers ?? { origin: 'https://maihouses.com' },
  };
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 0,
    jsonData: null,
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
    setHeader: vi.fn(),
  };

  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation((payload: unknown) => {
    res.jsonData = payload;
    return res;
  });
  res.end.mockReturnValue(res);
  res.setHeader.mockReturnValue(res);

  return res;
}

function setupSupabaseMock() {
  const mockCommunityRange = vi.fn();
  const mockCommunityOrder = vi.fn().mockReturnValue({ range: mockCommunityRange });
  const mockCommunitySelect = vi.fn().mockReturnValue({ order: mockCommunityOrder });

  const mockPostIn = vi.fn();
  const mockPostEq = vi.fn().mockReturnValue({ in: mockPostIn });
  const mockPostSelect = vi.fn().mockReturnValue({ eq: mockPostEq });

  const mockFrom = vi.fn((table: string) => {
    if (table === 'communities') return { select: mockCommunitySelect };
    if (table === 'community_posts') return { select: mockPostSelect };
    throw new Error(`Unexpected table: ${table}`);
  });

  vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as never);

  return {
    mockFrom,
    mockCommunityRange,
    mockPostIn,
  };
}

describe('/api/community/list (#8c)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 for OPTIONS preflight', async () => {
    const req = createMockRequest({ method: 'OPTIONS' });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('returns 403 with structured payload for disallowed origin', async () => {
    const req = createMockRequest({
      method: 'GET',
      headers: { origin: 'https://evil.example.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'FORBIDDEN',
      },
    });
  });

  it('returns 405 for non-GET methods', async () => {
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(405);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: '僅支援 GET 請求',
      },
    });
  });

  it('returns 400 when query params are invalid', async () => {
    const req = createMockRequest({
      method: 'GET',
      query: { offset: '-1', limit: '200' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_QUERY',
      },
    });
  });

  it('returns filtered and paginated community list', async () => {
    const { mockCommunityRange, mockPostIn } = setupSupabaseMock();

    mockCommunityRange.mockResolvedValueOnce({
      data: [
        {
          id: COMMUNITY_A,
          name: 'A 社區',
          address: '台北市 A 路',
          cover_image: null,
          review_count: 2,
        },
        {
          id: COMMUNITY_B,
          name: 'B 社區',
          address: '台北市 B 路',
          cover_image: 'https://img.example.com/b.jpg',
          review_count: 0,
        },
        {
          id: COMMUNITY_C,
          name: 'C 社區',
          address: null,
          cover_image: null,
          review_count: 0,
        },
      ],
      error: null,
    });

    mockPostIn.mockResolvedValueOnce({
      data: [
        { community_id: COMMUNITY_A },
        { community_id: COMMUNITY_B },
        { community_id: COMMUNITY_B },
      ],
      error: null,
    });

    const req = createMockRequest({
      method: 'GET',
      query: { offset: '1', limit: '1' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    expect(res.jsonData).toEqual({
      success: true,
      data: [
        {
          id: COMMUNITY_B,
          name: 'B 社區',
          address: '台北市 B 路',
          image: 'https://img.example.com/b.jpg',
          post_count: 2,
          review_count: 0,
        },
      ],
    });
  });
});
