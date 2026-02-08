import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRpc = vi.fn();
const mockCreateClient = vi.fn(() => ({
  rpc: mockRpc,
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

interface MockRequest {
  method: string;
  query: Record<string, unknown>;
  headers: Record<string, string | undefined>;
}

interface MockResponse {
  statusCode: number;
  jsonData: unknown;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
}

function createMockRequest(options?: Partial<MockRequest>): MockRequest {
  return {
    method: options?.method ?? 'GET',
    query: options?.query ?? { id: 'MH-100001' },
    headers: options?.headers ?? { origin: 'https://maihouses.vercel.app' },
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

  res.json.mockImplementation((data: unknown) => {
    res.jsonData = data;
    return res;
  });

  res.end.mockReturnValue(res);
  res.setHeader.mockReturnValue(res);

  return res;
}

describe('GET /api/property/public-stats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'anon-key';
  });

  it('成功回傳 view_count 與 trust_cases_count', async () => {
    mockRpc.mockResolvedValue({
      data: { view_count: 11, trust_cases_count: 4 },
      error: null,
    });

    const handler = (await import('../public-stats')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(mockCreateClient).toHaveBeenCalledWith('https://example.supabase.co', 'anon-key');
    expect(mockRpc).toHaveBeenCalledWith('fn_get_property_public_stats', {
      p_property_id: 'MH-100001',
    });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      data: { view_count: 11, trust_cases_count: 4 },
    });
  });

  it('query 缺少 id 時回傳 400 INVALID_QUERY', async () => {
    const handler = (await import('../public-stats')).default;
    const req = createMockRequest({ query: {} });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_QUERY',
        message: 'Invalid query parameters',
      },
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('RPC 失敗時回傳 500 DATA_FETCH_FAILED', async () => {
    mockRpc.mockResolvedValue({
      data: null,
      error: { message: 'rpc failed', code: 'XX000' },
    });

    const handler = (await import('../public-stats')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'DATA_FETCH_FAILED',
        message: 'Failed to fetch property stats',
        details: 'rpc failed',
      },
    });
  });

  it('非 GET 請求回傳 405 METHOD_NOT_ALLOWED', async () => {
    const handler = (await import('../public-stats')).default;
    const req = createMockRequest({ method: 'POST' });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(405);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: 'Method not allowed',
      },
    });
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
