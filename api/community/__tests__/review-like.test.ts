import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../review-like';
import { verifyAuth } from '../../lib/auth';
import { getSupabaseAdmin } from '../../lib/supabase';

vi.mock('../../lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

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
  query: Record<string, unknown>;
  body: unknown;
  headers: Record<string, string | undefined>;
};

type MockResponse = {
  statusCode: number;
  jsonData: unknown;
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
};

const COMPLETE_PROPERTY = {
  id: '11111111-1111-4111-8111-111111111111',
  public_id: 'MH-100001',
  advantage_1: 'Near MRT station',
  advantage_2: 'Well-managed community',
  disadvantage: 'Limited parking at peak time',
};

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
    setHeader: vi.fn(),
    end: vi.fn(),
  };

  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });
  res.json.mockImplementation((payload: unknown) => {
    res.jsonData = payload;
    return res;
  });
  res.setHeader.mockReturnValue(res);
  res.end.mockReturnValue(res);

  return res;
}

function createPropertiesTable(data: unknown, error: { message: string } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const limit = vi.fn().mockReturnValue({ eq });
  const select = vi.fn().mockReturnValue({ limit });
  return { table: { select }, eq };
}

function createLikeCountTable(count: number, error: { message: string } | null = null) {
  const eq = vi.fn().mockResolvedValue({ count, error });
  const select = vi.fn().mockReturnValue({ eq });
  return { table: { select }, eq };
}

function createLikeLookupTable(data: unknown, error: { message: string } | null = null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const eqUser = vi.fn().mockReturnValue({ maybeSingle });
  const eqProperty = vi.fn().mockReturnValue({ eq: eqUser, maybeSingle });
  const select = vi.fn().mockReturnValue({ eq: eqProperty });
  return { table: { select }, eqProperty, eqUser };
}

function createLikeDeleteTable(error: { message: string } | null = null) {
  const eqUser = vi.fn().mockResolvedValue({ error });
  const eqId = vi.fn().mockReturnValue({ eq: eqUser });
  const del = vi.fn().mockReturnValue({ eq: eqId });
  return { table: { delete: del }, eqId, eqUser };
}

function createLikeInsertTable(error: { code?: string; message?: string } | null = null) {
  const insert = vi.fn().mockResolvedValue({ error });
  return { table: { insert }, insert };
}

describe('/api/community/review-like', () => {
  const mockVerifyAuth = vi.mocked(verifyAuth);
  const mockGetSupabaseAdmin = vi.mocked(getSupabaseAdmin);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 400 when propertyId is missing', async () => {
    const req = createMockRequest({ method: 'GET', query: {} });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(400);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_QUERY' },
    });
  });

  it('GET returns public like status for anonymous request', async () => {
    const properties = createPropertiesTable(COMPLETE_PROPERTY);
    const count = createLikeCountTable(6);
    const from = vi.fn().mockReturnValueOnce(properties.table).mockReturnValueOnce(count.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: false,
      error: 'Missing or invalid Authorization header',
      statusCode: 401,
    });

    const req = createMockRequest({
      method: 'GET',
      query: { propertyId: 'MH-100001' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(properties.eq).toHaveBeenCalledWith('public_id', 'MH-100001');
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      liked: false,
      totalLikes: 6,
    });
  });

  it('GET returns liked=true for authenticated user with existing like', async () => {
    const properties = createPropertiesTable(COMPLETE_PROPERTY);
    const count = createLikeCountTable(3);
    const likedLookup = createLikeLookupTable({ id: 'like-1' });
    const from = vi
      .fn()
      .mockReturnValueOnce(properties.table)
      .mockReturnValueOnce(count.table)
      .mockReturnValueOnce(likedLookup.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'user-1',
    });

    const req = createMockRequest({
      method: 'GET',
      query: { propertyId: COMPLETE_PROPERTY.id },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      liked: true,
      totalLikes: 3,
    });
  });

  it('POST returns 401 when auth verification fails', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: false,
      error: 'Unauthorized',
      statusCode: 401,
    });

    const req = createMockRequest({
      method: 'POST',
      body: { propertyId: 'MH-100001' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(401);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'UNAUTHORIZED' },
    });
  });

  it('POST returns 422 when review summary is incomplete', async () => {
    const incompleteProperty = {
      ...COMPLETE_PROPERTY,
      advantage_2: '',
    };
    const properties = createPropertiesTable(incompleteProperty);
    const from = vi.fn().mockReturnValueOnce(properties.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'user-1',
    });

    const req = createMockRequest({
      method: 'POST',
      body: { propertyId: 'MH-100001' },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(422);
    expect(res.jsonData).toMatchObject({
      success: false,
      error: { code: 'INVALID_INPUT' },
    });
  });

  it('POST toggles like on (insert path)', async () => {
    const properties = createPropertiesTable(COMPLETE_PROPERTY);
    const existingLike = createLikeLookupTable(null);
    const insert = createLikeInsertTable(null);
    const count = createLikeCountTable(9);
    const from = vi
      .fn()
      .mockReturnValueOnce(properties.table)
      .mockReturnValueOnce(existingLike.table)
      .mockReturnValueOnce(insert.table)
      .mockReturnValueOnce(count.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'user-1',
    });

    const req = createMockRequest({
      method: 'POST',
      body: { propertyId: 'MH-100001' },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(insert.insert).toHaveBeenCalledWith({
      property_id: COMPLETE_PROPERTY.id,
      user_id: 'user-1',
    });
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      liked: true,
      totalLikes: 9,
    });
  });

  it('POST keeps liked=true on unique conflict (idempotent)', async () => {
    const properties = createPropertiesTable(COMPLETE_PROPERTY);
    const existingLike = createLikeLookupTable(null);
    const insert = createLikeInsertTable({ code: '23505', message: 'duplicate key' });
    const count = createLikeCountTable(10);
    const from = vi
      .fn()
      .mockReturnValueOnce(properties.table)
      .mockReturnValueOnce(existingLike.table)
      .mockReturnValueOnce(insert.table)
      .mockReturnValueOnce(count.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'user-1',
    });

    const req = createMockRequest({
      method: 'POST',
      body: { propertyId: COMPLETE_PROPERTY.id },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      liked: true,
      totalLikes: 10,
    });
  });

  it('POST toggles like off (delete path)', async () => {
    const properties = createPropertiesTable(COMPLETE_PROPERTY);
    const existingLike = createLikeLookupTable({ id: 'like-1' });
    const del = createLikeDeleteTable(null);
    const count = createLikeCountTable(2);
    const from = vi
      .fn()
      .mockReturnValueOnce(properties.table)
      .mockReturnValueOnce(existingLike.table)
      .mockReturnValueOnce(del.table)
      .mockReturnValueOnce(count.table);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Test mock for Supabase client
    mockGetSupabaseAdmin.mockReturnValue({ from } as any);
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'user-1',
    });

    const req = createMockRequest({
      method: 'POST',
      body: { propertyId: 'MH-100001' },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(del.eqId).toHaveBeenCalledWith('id', 'like-1');
    expect(del.eqUser).toHaveBeenCalledWith('user_id', 'user-1');
    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toEqual({
      success: true,
      liked: false,
      totalLikes: 2,
    });
  });
});
