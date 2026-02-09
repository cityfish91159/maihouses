import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMocks } from '../../__test-utils__/mockRequest';
import handler from '../review-like';
import { verifyAuth } from '../../lib/auth';

// Mock dependencies
vi.mock('../../lib/env', () => ({
  getEnvVar: vi.fn((key) => `mock-${key}`),
}));

vi.mock('../../lib/auth', () => ({
  verifyAuth: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logError: vi.fn(),
}));

const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      if (table === 'community_review_likes') {
        return {
          select: (cols: string, options?: any) => {
            mockSelect(cols, options);
            return {
              eq: (field: string, value: any) => {
                mockEq(field, value);
                return {
                  eq: (field2: string, value2: any) => {
                    // for select count or check like
                    if (options?.count === 'exact') {
                        // total likes query
                        return Promise.resolve({ count: 5, error: null });
                    }
                    return {
                      maybeSingle: mockMaybeSingle, // check existing like
                    };
                  },
                  maybeSingle: mockMaybeSingle
                };
              }
            };
          },
          insert: mockInsert,
          delete: () => ({
            eq: mockEq // for delete
          }),
        };
      }
      if (table === 'properties') {
        return {
          select: () => ({
            eq: () => ({
              single: mockSingle // check property exists
            })
          })
        };
      }
      return {};
    },
  }),
}));

describe('API: /api/community/review-like', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET should return 400 if propertyId is missing', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: 'Missing propertyId' });
  });

  it('GET should return like status (unauthenticated)', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { propertyId: 'prop-123' },
    });

    // Mock count query
    // This is hard to mock perfectly with the current setup without making it very complex
    // Simplified expectation: 200 OK
    
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.success).toBe(true);
    expect(data.liked).toBe(false); // No auth -> false
  });

  it('POST should return 401 if unauthorized', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { propertyId: 'prop-123' },
    });

    (verifyAuth as any).mockResolvedValue({ user: null, error: 'Auth failed' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('POST should return 400 if payload is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer token' },
      body: { }, // missing propertyId
    });

    (verifyAuth as any).mockResolvedValue({ user: { id: 'user-123' }, error: null });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
  });
});
