import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../my';
import { getSupabaseAdmin } from '../../lib/supabase';
import { verifyAuth } from '../../lib/auth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  verifyAuth: vi.fn(),
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
  headers: Record<string, string | undefined>;
};

type MockResponse = {
  statusCode: number;
  jsonData: unknown;
  headers: Record<string, string>;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
};

const COMMUNITY_ID = '11111111-1111-4111-8111-111111111111';

function createMockRequest(input?: Partial<MockRequest>): MockRequest {
  return {
    method: input?.method ?? 'GET',
    query: input?.query ?? {},
    headers: input?.headers ?? { origin: 'https://maihouses.com' },
  };
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 0,
    jsonData: null,
    headers: {},
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
  res.setHeader.mockImplementation((name: string, value: string) => {
    res.headers[name] = value;
    return res;
  });

  return res;
}

function setupSupabaseMock() {
  const queryBuilder = {
    select: vi.fn(),
    eq: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
    maybeSingle: vi.fn(),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.eq.mockReturnValue(queryBuilder);
  queryBuilder.order.mockReturnValue(queryBuilder);
  queryBuilder.limit.mockReturnValue(queryBuilder);

  const mockFrom = vi.fn().mockReturnValue(queryBuilder);
  vi.mocked(getSupabaseAdmin).mockReturnValue({ from: mockFrom } as never);

  return {
    mockFrom,
    queryBuilder,
  };
}

describe('/api/community/my (#12b)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyAuth).mockResolvedValue({
      success: true,
      userId: 'user-1',
      email: 'test@example.com',
    });
  });

  it('returns 200 for OPTIONS preflight', async () => {
    const req = createMockRequest({ method: 'OPTIONS' });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalled();
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
      },
    });
  });

  it('returns 401 when auth verification fails', async () => {
    vi.mocked(verifyAuth).mockResolvedValue({
      success: false,
      statusCode: 401,
      error: 'Missing or invalid Authorization header',
    });

    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
      },
    });
  });

  it('returns communityId when active membership exists', async () => {
    const { queryBuilder } = setupSupabaseMock();
    queryBuilder.maybeSingle.mockResolvedValue({
      data: { community_id: COMMUNITY_ID },
      error: null,
    });

    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active');
    expect(queryBuilder.order).toHaveBeenCalledWith('joined_at', { ascending: false });
    expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(res.statusCode).toBe(200);
    expect(res.headers['Vary']).toBe('Origin, Authorization');
    expect(res.headers['Cache-Control']).toBe('private, max-age=60');
    expect(res.jsonData).toEqual({
      success: true,
      data: {
        communityId: COMMUNITY_ID,
      },
    });
  });

  it('returns { data: null } when membership does not exist', async () => {
    const { queryBuilder } = setupSupabaseMock();
    queryBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: null,
    });

    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      data: null,
    });
  });

  it('returns 500 when DB query fails', async () => {
    const { queryBuilder } = setupSupabaseMock();
    queryBuilder.maybeSingle.mockResolvedValue({
      data: null,
      error: {
        code: 'XX000',
        message: 'db error',
      },
    });

    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'DATA_FETCH_FAILED',
      },
    });
  });
});
