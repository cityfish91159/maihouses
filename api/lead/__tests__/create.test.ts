import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetSupabaseAdmin = vi.fn();

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

function createMockRequest(options: { method?: string; body?: unknown }): {
  method: string;
  body: unknown;
  headers: Record<string, string | undefined>;
} {
  return {
    method: options.method ?? 'POST',
    body: options.body ?? {},
    headers: {
      origin: 'https://maihouses.com',
    },
  };
}

function createMockResponse(): {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  statusCode: number;
  jsonData: unknown;
} {
  const res = {
    statusCode: 0,
    jsonData: null as unknown,
    status: vi.fn().mockImplementation((code: number) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn().mockImplementation((data: unknown) => {
      res.jsonData = data;
      return res;
    }),
    end: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  };
  return res;
}

function buildValidBody(overrides?: Record<string, unknown>): Record<string, unknown> {
  return {
    customerName: 'Test User',
    customerPhone: '0912345678',
    propertyId: 'MH-100001',
    source: 'sidebar',
    agentId: 'agent-client',
    ...overrides,
  };
}

describe('POST /api/lead/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockEq.mockImplementation(() => ({
      single: mockSingle,
    }));
    mockSelect.mockImplementation(() => ({
      eq: mockEq,
    }));
    mockFrom.mockImplementation(() => ({
      select: mockSelect,
    }));
    mockGetSupabaseAdmin.mockReturnValue({
      from: mockFrom,
      rpc: mockRpc,
    });
  });

  it('OPTIONS returns 200', async () => {
    const handler = (await import('../create')).default;
    const req = createMockRequest({ method: 'OPTIONS' });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.end).toHaveBeenCalled();
  });

  it('GET returns 405', async () => {
    const handler = (await import('../create')).default;
    const req = createMockRequest({ method: 'GET' });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(405);
  });

  it('invalid body returns 400', async () => {
    const handler = (await import('../create')).default;
    const req = createMockRequest({
      body: { customerName: '', source: 'sidebar' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('property not found returns 404', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: 'Not found' },
    });

    const handler = (await import('../create')).default;
    const req = createMockRequest({
      body: buildValidBody(),
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(mockFrom).toHaveBeenCalledWith('properties');
    expect(mockEq).toHaveBeenCalledWith('public_id', 'MH-100001');
    expect(res.statusCode).toBe(404);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'PROPERTY_NOT_FOUND' },
    });
  });

  it('property with missing agent_id returns 422', async () => {
    mockSingle.mockResolvedValue({
      data: {
        public_id: 'MH-100001',
        agent_id: null,
      },
      error: null,
    });

    const handler = (await import('../create')).default;
    const req = createMockRequest({
      body: buildValidBody(),
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(422);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'PROPERTY_AGENT_MISSING' },
    });
  });

  it('uses backend-resolved agentId instead of client-sent agentId', async () => {
    mockSingle.mockResolvedValue({
      data: {
        public_id: 'MH-100001',
        agent_id: 'agent-resolved-001',
      },
      error: null,
    });
    mockRpc.mockResolvedValue({
      data: 'lead-123',
      error: null,
    });

    const handler = (await import('../create')).default;
    const req = createMockRequest({
      body: buildValidBody({ agentId: 'agent-client-999' }),
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(mockRpc).toHaveBeenCalledWith(
      'create_lead',
      expect.objectContaining({
        p_agent_id: 'agent-resolved-001',
        p_property_id: 'MH-100001',
      })
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: {
        leadId: 'lead-123',
        agentId: 'agent-resolved-001',
      },
    });
  });
});
