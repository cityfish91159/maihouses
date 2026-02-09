import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetSupabaseAdmin = vi.fn();
const mockVerifyAuth = vi.fn();
const mockSendAuthError = vi.fn();

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdmin: mockGetSupabaseAdmin,
}));

vi.mock('../../lib/auth', () => ({
  verifyAuth: mockVerifyAuth,
  sendAuthError: mockSendAuthError,
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

type MockReq = {
  method: string;
  query?: Record<string, unknown>;
  body?: unknown;
  headers: Record<string, string | undefined>;
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
    method: input?.method ?? 'GET',
    query: input?.query ?? {},
    body: input?.body ?? {},
    headers: input?.headers ?? { origin: 'https://maihouses.com' },
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

function createTrustCaseSelectResult(data: unknown, error: { message: string } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  return {
    select: vi.fn().mockReturnValue({ eq }),
    maybeSingle,
    eq,
  };
}

function createDuplicateSelectResult(rows: unknown[] = [], error: { message: string } | null = null) {
  const limit = vi.fn().mockResolvedValue({ data: rows, error });
  const eq3 = vi.fn().mockReturnValue({ limit });
  const eq2 = vi.fn().mockReturnValue({ eq: eq3 });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  return {
    select: vi.fn().mockReturnValue({ eq: eq1 }),
    limit,
    eq1,
    eq2,
    eq3,
  };
}

describe('/api/agent/reviews', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns paginated reviews with summary and masked names', async () => {
    const summaryBuilder = {
      eq: vi.fn(),
    };
    const summaryBuilder2 = {
      eq: vi.fn().mockResolvedValue({
        data: [{ rating: 5 }, { rating: 4 }, { rating: 5 }],
        error: null,
      }),
    };
    summaryBuilder.eq.mockReturnValue(summaryBuilder2);

    const listBuilder = {
      eq: vi.fn(),
      order: vi.fn(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: '3f5f96ef-6910-4fe8-83da-f7944f1119d8',
            rating: 5,
            comment: 'great',
            created_at: '2026-02-09T00:00:00.000Z',
            reviewer_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
          },
          {
            id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
            rating: 4,
            comment: null,
            created_at: '2026-02-08T00:00:00.000Z',
            reviewer_id: '0f99c8c6-26d4-4db4-9fdc-f76a55e2f0d2',
          },
        ],
        error: null,
      }),
    };
    const listBuilder2 = {
      eq: vi.fn().mockReturnValue(listBuilder),
    };
    listBuilder.eq.mockReturnValue(listBuilder2);
    listBuilder.order.mockReturnValue(listBuilder);

    const mockFrom = vi
      .fn()
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue(summaryBuilder),
      })
      .mockReturnValueOnce({
        select: vi.fn().mockReturnValue(listBuilder),
      });

    mockGetSupabaseAdmin.mockReturnValue({
      from: mockFrom,
      auth: {
        admin: {
          getUserById: vi
            .fn()
            .mockResolvedValueOnce({
              data: { user: { email: 'alice@example.com', user_metadata: { name: 'Alice' } } },
              error: null,
            })
            .mockResolvedValueOnce({
              data: { user: { email: 'bob@example.com', user_metadata: { name: 'Bob' } } },
              error: null,
            }),
        },
      },
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'GET',
      query: { agentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', page: '1', limit: '10' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: {
        total: 3,
        avgRating: 4.7,
        distribution: {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 1,
          '5': 2,
        },
      },
    });
  });

  it('GET validates query params', async () => {
    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'GET',
      query: { agentId: 'not-a-uuid' },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_QUERY' },
    });
  });

  it('POST returns unauthorized when auth verification fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: false,
      error: 'Unauthorized',
      statusCode: 401,
    });

    mockSendAuthError.mockImplementation((res: MockRes) => {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return res;
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({ method: 'POST', body: {} });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(mockSendAuthError).toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it('POST requires trustCaseId', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        agentId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        rating: 5,
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('POST rejects when reviewer is not trust-case buyer', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const trustCaseSelect = createTrustCaseSelectResult({
      id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      agent_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      buyer_user_id: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      current_step: 2,
      property_id: 'MH-100001',
    });

    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(trustCaseSelect),
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        agentId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        rating: 5,
        trustCaseId: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(403);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'PERMISSION_DENIED' },
    });
  });

  it('POST rejects when trust case has not reached step 2', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const trustCaseSelect = createTrustCaseSelectResult({
      id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      agent_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      buyer_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      current_step: 1,
      property_id: 'MH-100001',
    });

    mockGetSupabaseAdmin.mockReturnValue({
      from: vi.fn().mockReturnValueOnce(trustCaseSelect),
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        agentId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        rating: 5,
        trustCaseId: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(422);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('POST enforces duplicate protection for same agent+reviewer+case', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const trustCaseSelect = createTrustCaseSelectResult({
      id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      agent_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      buyer_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      current_step: 3,
      property_id: 'MH-100001',
    });

    const duplicateSelect = createDuplicateSelectResult([
      { id: '3f5f96ef-6910-4fe8-83da-f7944f1119d8' },
    ]);

    mockGetSupabaseAdmin.mockReturnValue({
      from: vi
        .fn()
        .mockReturnValueOnce(trustCaseSelect)
        .mockReturnValueOnce(duplicateSelect),
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        agentId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        rating: 5,
        trustCaseId: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(res.statusCode).toBe(409);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'CONFLICT' },
    });
  });

  it('POST creates review and returns reviewId', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const trustCaseSelect = createTrustCaseSelectResult({
      id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      agent_id: 'de305d54-75b4-431b-adb2-eb6b9e546014',
      buyer_user_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      current_step: 4,
      property_id: 'MH-100001',
    });

    const duplicateSelect = createDuplicateSelectResult([]);

    const insertBuilder = {
      select: vi.fn(),
      single: vi.fn().mockResolvedValue({
        data: { id: '3f5f96ef-6910-4fe8-83da-f7944f1119d8' },
        error: null,
      }),
    };
    insertBuilder.select.mockReturnValue(insertBuilder);
    const insertMock = vi.fn().mockReturnValue(insertBuilder);

    const fromMock = vi
      .fn()
      .mockReturnValueOnce(trustCaseSelect)
      .mockReturnValueOnce(duplicateSelect)
      .mockReturnValueOnce({
        insert: insertMock,
      });

    mockGetSupabaseAdmin.mockReturnValue({
      from: fromMock,
    });

    const handler = (await import('../reviews')).default;
    const req = createMockRequest({
      method: 'POST',
      body: {
        agentId: 'de305d54-75b4-431b-adb2-eb6b9e546014',
        rating: 5,
        comment: 'excellent support',
        trustCaseId: '12b4af9b-8985-4329-bdcf-3569f9878f56',
      },
    });
    const res = createMockResponse();

    await handler(req as never, res as never);

    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        trust_case_id: '12b4af9b-8985-4329-bdcf-3569f9878f56',
        step_completed: 4,
        property_id: 'MH-100001',
      })
    );
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: { reviewId: '3f5f96ef-6910-4fe8-83da-f7944f1119d8' },
    });
  });
});
