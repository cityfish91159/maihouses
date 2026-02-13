import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const { mockRpc, mockCreateClient, mockCaptureError, mockAddBreadcrumb, mockLoggerWarn } =
  vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockCreateClient: vi.fn(),
  mockCaptureError: vi.fn(),
  mockAddBreadcrumb: vi.fn(),
  mockLoggerWarn: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient,
}));

vi.mock('../../lib/sentry', () => ({
  withSentryHandler: (handler: unknown) => handler,
  captureError: mockCaptureError,
  addBreadcrumb: mockAddBreadcrumb,
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: mockLoggerWarn,
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

type MockReq = {
  method: string;
  body?: unknown;
};

type MockRes = {
  statusCode: number;
  jsonData: unknown;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
};

function createMockRequest(input?: Partial<MockReq>): MockReq {
  return {
    method: input?.method ?? 'POST',
    body:
      input?.body ??
      ({
        session_id: 'test-session',
        agent_id: 'test-agent',
        event: {
          property_id: 'MH-100001',
          duration: 30,
          scroll_depth: 80,
        },
      } as const),
  };
}

function createMockResponse(): MockRes {
  const res: MockRes = {
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

async function invokeHandler(
  handler: typeof import('../track').default,
  req: MockReq,
  res: MockRes
): Promise<void> {
  await handler(req as VercelRequest, res as VercelResponse);
}

describe('/api/uag/track', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    originalEnv = { ...process.env };
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.UAG_RPC_VERSION = 'v8_2';

    mockRpc.mockReset();
    mockCreateClient.mockReset();
    mockCreateClient.mockReturnValue({
      rpc: mockRpc,
    });
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('rejects payload without session_id', async () => {
    const handler = (await import('../track')).default;
    const req = createMockRequest({
      body: {
        event: { property_id: 'MH-100001' },
      },
    });
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('returns 400 and logs parse error when request body is invalid JSON string', async () => {
    const handler = (await import('../track')).default;
    const req = createMockRequest({
      body: '{invalid_json',
    });
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
    expect(mockLoggerWarn).toHaveBeenCalledWith(
      '[UAG] 解析請求 JSON 失敗',
      expect.objectContaining({
        error: expect.any(String),
      })
    );
  });

  it('rejects payload without event.property_id', async () => {
    const handler = (await import('../track')).default;
    const req = createMockRequest({
      body: {
        session_id: 'test-session',
        event: {},
      },
    });
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('rejects batch array payload (non-contract)', async () => {
    const handler = (await import('../track')).default;
    const req = createMockRequest({
      body: [
        {
          session_id: 'test-session',
          event: { property_id: 'MH-100001' },
        },
      ],
    });
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('calls RPC v8_2 and returns 200', async () => {
    mockRpc.mockResolvedValue({
      data: { grade: 'A', score: 85 },
      error: null,
    });

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(mockRpc).toHaveBeenCalledWith(
      'track_uag_event_v8_2',
      expect.objectContaining({
        p_session_id: 'test-session',
      })
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: { grade: 'A', score: 85 },
    });
  });

  it('falls back to v8 when v8_2 fails', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'v8_2 not found' },
      })
      .mockResolvedValueOnce({
        data: { grade: 'B' },
        error: null,
      });

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(mockRpc).toHaveBeenNthCalledWith(1, 'track_uag_event_v8_2', expect.any(Object));
    expect(mockRpc).toHaveBeenNthCalledWith(2, 'track_uag_event_v8', expect.any(Object));
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: { grade: 'B' },
    });
  });

  it('returns 500 when fallback RPC returns invalid payload shape', async () => {
    mockRpc
      .mockResolvedValueOnce({
        data: null,
        error: { message: 'v8_2 failure' },
      })
      .mockResolvedValueOnce({
        data: { ok: true },
        error: null,
      });

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(mockRpc).toHaveBeenCalledTimes(2);
    expect(res.statusCode).toBe(500);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INTERNAL_ERROR' },
    });
  });

  it('accepts RPC result with grade only', async () => {
    mockRpc.mockResolvedValue({
      data: { grade: 'C' },
      error: null,
    });

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: { grade: 'C' },
    });
  });

  it('returns 503 when required env vars are missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(res.statusCode).toBe(503);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'SERVICE_UNAVAILABLE' },
    });
  });

  it('uses VITE_SUPABASE_ANON_KEY fallback when SUPABASE_SERVICE_ROLE_KEY is missing', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-fallback-key';
    mockRpc.mockResolvedValue({
      data: { grade: 'A', score: 90 },
      error: null,
    });

    const handler = (await import('../track')).default;
    const req = createMockRequest();
    const res = createMockResponse();

    await invokeHandler(handler, req, res);

    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-fallback-key'
    );
    expect(res.statusCode).toBe(200);
  });

  it('stress test: invalid JSON payload burst should fail fast without RPC calls', async () => {
    const handler = (await import('../track')).default;
    const burstCount = 50;
    const requests = Array.from({ length: burstCount }, () => {
      const req = createMockRequest({
        body: '{broken_json',
      });
      const res = createMockResponse();
      return { req, res };
    });

    await Promise.all(
      requests.map(async ({ req, res }) => {
        await invokeHandler(handler, req, res);
      })
    );

    for (const { res } of requests) {
      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: { code: 'INVALID_INPUT' },
      });
    }

    expect(mockRpc).not.toHaveBeenCalled();
    expect(mockLoggerWarn).toHaveBeenCalledTimes(burstCount);
  });
});
