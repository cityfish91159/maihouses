import { beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../me';
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

describe('/api/agent/me (#15)', () => {
  const mockGetSupabaseAdmin = vi.mocked(getSupabaseAdmin);
  const mockVerifyAuth = vi.mocked(verifyAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns license and verification fields', async () => {
    mockVerifyAuth.mockResolvedValue({
      success: true,
      userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      email: 'agent@maihouses.com',
    });

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
        trust_score: 90,
        encouragement_count: 9,
        service_rating: 4.8,
        review_count: 11,
        completed_cases: 7,
        active_listings: 3,
        joined_at: '2021-01-01T00:00:00Z',
        created_at: '2021-01-01T00:00:00Z',
        points: 1000,
        quota_s: 3,
        quota_a: 8,
        visit_count: 50,
        deal_count: 12,
      },
      error: null,
    });
    const eq = vi.fn().mockReturnValue({ single });
    const select = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ select });

    mockGetSupabaseAdmin.mockReturnValue({ from } as never);

    const req = createMockRequest({
      method: 'GET',
      headers: { authorization: 'Bearer token', origin: 'https://maihouses.com' },
    });
    const res = createMockResponse();

    await handler(req as unknown as VercelRequest, res as unknown as VercelResponse);

    expect(res.statusCode).toBe(200);
    expect(res.jsonData).toMatchObject({
      success: true,
      data: {
        license_number: '(113)北市經紀字第004521號',
        is_verified: true,
        verified_at: '2024-06-15T00:00:00Z',
      },
    });
  });
});
