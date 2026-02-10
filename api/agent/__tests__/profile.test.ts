import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../profile';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseAdmin } from '../../lib/supabase';
import { verifyAuth } from '../../lib/auth';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  verifyAuth: vi.fn(),
  sendAuthError: vi.fn(),
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

describe('/api/agent/profile (#15)', () => {
  const mockGetSupabaseAdmin = vi.mocked(getSupabaseAdmin);
  const mockVerifyAuth = vi.mocked(verifyAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns verification fields in payload', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        internal_code: 12345,
        name: '測試房仲',
        avatar_url: null,
        company: '邁房子',
        bio: null,
        specialties: [],
        certifications: [],
        phone: null,
        line_id: null,
        license_number: '(113)北市經紀字第004521號',
        is_verified: true,
        verified_at: '2024-06-15T00:00:00Z',
        trust_score: 86,
        encouragement_count: 9,
        service_rating: 4.7,
        review_count: 11,
        completed_cases: 7,
        active_listings: 3,
        joined_at: '2021-01-01T00:00:00Z',
        created_at: '2021-01-01T00:00:00Z',
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockGetSupabaseAdmin.mockReturnValue({ from } as never);

    const req = createMockRequest({
      method: 'GET',
      query: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: {
        company: '邁房子',
        license_number: '(113)北市經紀字第004521號',
        is_verified: true,
        verified_at: '2024-06-15T00:00:00Z',
      },
    });
  });

  it('GET keeps company null without forcing fallback value', async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        internal_code: 12345,
        name: '測試房仲',
        avatar_url: null,
        company: null,
        bio: null,
        specialties: [],
        certifications: [],
        phone: null,
        line_id: null,
        license_number: null,
        is_verified: false,
        verified_at: null,
        trust_score: 86,
        encouragement_count: 9,
        service_rating: 4.7,
        review_count: 11,
        completed_cases: 7,
        active_listings: 3,
        joined_at: '2021-01-01T00:00:00Z',
        created_at: '2021-01-01T00:00:00Z',
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockGetSupabaseAdmin.mockReturnValue({ from } as never);

    const req = createMockRequest({
      method: 'GET',
      query: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: {
        company: null,
      },
    });
  });

  it('PUT accepts and updates company + license_number + normalized phone', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const single = vi.fn().mockResolvedValue({
      data: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    mockGetSupabaseAdmin.mockReturnValue({ from } as never);

    const req = createMockRequest({
      method: 'PUT',
      body: {
        company: '邁房子忠孝店',
        phone: '0912-345-678',
        license_number: '(113)北市經紀字第009999號',
      },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(update).toHaveBeenCalledWith({
      company: '邁房子忠孝店',
      phone: '0912345678',
      license_number: '(113)北市經紀字第009999號',
    });
    expect(res.statusCode).toBe(200);
  });

  it('PUT accepts company=null for clearing company name', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    });

    const single = vi.fn().mockResolvedValue({
      data: { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
      error: null,
    });
    const select = vi.fn().mockReturnValue({ single });
    const eq = vi.fn().mockReturnValue({ select });
    const update = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ update });

    mockGetSupabaseAdmin.mockReturnValue({ from } as never);

    const req = createMockRequest({
      method: 'PUT',
      body: {
        company: null,
      },
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(update).toHaveBeenCalledWith({
      company: null,
    });
    expect(res.statusCode).toBe(200);
  });
});
