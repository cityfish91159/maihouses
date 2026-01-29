/**
 * BE-2: 補開安心服務 API 測試
 *
 * 測試案例：
 * 1. 成功：false → true
 * 2. 失敗：已經是 true
 * 3. 失敗：非擁有者
 * 4. 失敗：物件不存在
 * 5. 失敗：未登入
 * 6. 失敗：無效的 propertyId 格式
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
  }),
}));

// Mock logger
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// Test Helpers
// ============================================================================

function createMockRequest(options: { method?: string; body?: unknown; authToken?: string }): {
  method: string;
  body: unknown;
  headers: Record<string, string | undefined>;
} {
  return {
    method: options.method ?? 'POST',
    body: options.body ?? {},
    headers: {
      authorization: options.authToken ? `Bearer ${options.authToken}` : undefined,
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

// ============================================================================
// Test Data
// ============================================================================

const VALID_PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_AGENT_ID = '660e8400-e29b-41d4-a716-446655440001';
const OTHER_AGENT_ID = '770e8400-e29b-41d4-a716-446655440002';
const VALID_USER_ID = '880e8400-e29b-41d4-a716-446655440003';
const VALID_TOKEN = 'valid-jwt-token';

// ============================================================================
// Tests
// ============================================================================

describe('BE-2: POST /api/property/enable-trust', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('成功案例', () => {
    it('trust_enabled=false 時可以成功開啟', async () => {
      // Mock: 用戶驗證成功
      mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });

      // Mock: agents 表查詢
      mockFrom.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: VALID_AGENT_ID },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: VALID_PROPERTY_ID,
                      agent_id: VALID_AGENT_ID,
                      trust_enabled: false,
                    },
                    error: null,
                  }),
              }),
            }),
            update: () => {
              const updateChain = {
                eq: vi.fn().mockReturnThis(),
                select: vi.fn().mockResolvedValue({
                  data: [{ id: VALID_PROPERTY_ID }],
                  error: null,
                }),
              };
              return updateChain;
            },
          };
        }
        return { select: vi.fn() };
      });

      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: VALID_PROPERTY_ID },
        authToken: VALID_TOKEN,
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData).toEqual({
        success: true,
        data: {
          propertyId: VALID_PROPERTY_ID,
          trustEnabled: true,
          message: '安心服務已成功開啟',
        },
      });
    });
  });

  describe('失敗案例 - 已開啟', () => {
    it('trust_enabled=true 時回傳錯誤', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: VALID_AGENT_ID },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: VALID_PROPERTY_ID,
                      agent_id: VALID_AGENT_ID,
                      trust_enabled: true, // 已開啟
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: VALID_PROPERTY_ID },
        authToken: VALID_TOKEN,
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: {
          code: 'ALREADY_ENABLED',
          message: '安心服務已開啟，無法重複操作',
        },
      });
    });
  });

  describe('失敗案例 - 權限', () => {
    it('非擁有者回傳 403', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: VALID_AGENT_ID },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: VALID_PROPERTY_ID,
                      agent_id: OTHER_AGENT_ID, // 不同擁有者
                      trust_enabled: false,
                    },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: VALID_PROPERTY_ID },
        authToken: VALID_TOKEN,
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: {
          code: 'NOT_OWNER',
          message: '您不是此物件的擁有者',
        },
      });
    });

    it('未登入回傳 401', async () => {
      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: VALID_PROPERTY_ID },
        // 沒有 authToken
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
        },
      });
    });
  });

  describe('失敗案例 - 資料驗證', () => {
    it('物件不存在回傳 404', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: VALID_AGENT_ID },
                    error: null,
                  }),
              }),
            }),
          };
        }
        if (table === 'properties') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: null,
                    error: { message: 'Not found' },
                  }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: VALID_PROPERTY_ID },
        authToken: VALID_TOKEN,
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: {
          code: 'PROPERTY_NOT_FOUND',
        },
      });
    });

    it('無效的 propertyId 格式回傳 400', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: VALID_USER_ID } },
        error: null,
      });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'agents') {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: VALID_AGENT_ID },
                    error: null,
                  }),
              }),
            }),
          };
        }
        return { select: vi.fn() };
      });

      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({
        method: 'POST',
        body: { propertyId: 'not-a-uuid' }, // 無效格式
        authToken: VALID_TOKEN,
      });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_INPUT',
        },
      });
    });
  });

  describe('HTTP 方法', () => {
    it('OPTIONS 回傳 200', async () => {
      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(200);
    });

    it('GET 回傳 405', async () => {
      const handler = (await import('../enable-trust')).default;
      const req = createMockRequest({ method: 'GET' });
      const res = createMockResponse();

      await handler(req as never, res as never);

      expect(res.statusCode).toBe(405);
    });
  });
});

// ============================================================================
// Schema 單元測試
// ============================================================================

import { z } from 'zod';

const EnableTrustRequestSchema = z.object({
  propertyId: z.string().uuid('propertyId 必須是有效的 UUID'),
});

describe('BE-2: EnableTrustRequestSchema', () => {
  it('有效的 UUID 通過驗證', () => {
    const result = EnableTrustRequestSchema.safeParse({
      propertyId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('無效的 UUID 驗證失敗', () => {
    const result = EnableTrustRequestSchema.safeParse({
      propertyId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('缺少 propertyId 驗證失敗', () => {
    const result = EnableTrustRequestSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('propertyId 為空字串驗證失敗', () => {
    const result = EnableTrustRequestSchema.safeParse({
      propertyId: '',
    });
    expect(result.success).toBe(false);
  });
});
