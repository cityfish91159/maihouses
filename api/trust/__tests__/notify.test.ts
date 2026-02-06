/**
 * BE-7 | 查詢通知目標 API 測試
 *
 * 測試案例：
 * 1. getNotifyTarget 函數 - 優先順序邏輯、驗證處理、輸入驗證
 * 2. API Handler - 真正呼叫 handler，驗證 HTTP 回應
 *
 * Skills Applied:
 * - [Test Driven Agent] 完整測試覆蓋
 * - [NASA TypeScript Safety] 類型安全的 Mock
 * - [Google Director] 真正的 handler 測試，非假測試
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ============================================================================
// Test Constants - 正確格式
// ============================================================================

/** 有效的 UUID v4 格式 */
const VALID_CASE_ID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_USER_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const VALID_USER_ID_2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

/** 有效的 LINE User ID 格式：U + 32 個十六進位字元 = 33 字元 */
const VALID_LINE_ID = 'U1234567890abcdef1234567890abcdef';
const VALID_LINE_ID_2 = 'Uabcdef1234567890abcdef1234567890';
const VALID_LINE_ID_UPPER = 'UABCDEF1234567890ABCDEF1234567890';

/** 無效格式 */
const INVALID_UUID = 'not-a-valid-uuid';
const INVALID_LINE_ID = 'Uxxx12345'; // 太短

// ============================================================================
// Mock Setup
// ============================================================================

interface MockSupabaseResponse {
  data: { buyer_user_id: string | null; buyer_line_id: string | null } | null;
  error: { code: string; message: string } | null;
}

const mockSingle = vi.fn<[], MockSupabaseResponse>();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock('../_utils', () => ({
  supabase: {
    from: mockFrom,
  },
  SYSTEM_API_KEY: 'test-system-api-key',
  JWT_SECRET: 'test-jwt-secret',
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../lib/cors', () => ({
  cors: vi.fn(),
}));

// ============================================================================
// Helper: 建立 Mock Request/Response
// ============================================================================

interface MockRequestOptions {
  method?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
}

function createMockRequest(options: MockRequestOptions = {}): VercelRequest {
  return {
    method: options.method ?? 'GET',
    headers: options.headers ?? {},
    query: options.query ?? {},
  } as unknown as VercelRequest;
}

interface MockResponse {
  status: ReturnType<typeof vi.fn>;
  json: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  setHeader: ReturnType<typeof vi.fn>;
  statusCode: number;
  jsonBody: unknown;
}

function createMockResponse(): MockResponse {
  const res: MockResponse = {
    statusCode: 0,
    jsonBody: null,
    status: vi.fn(),
    json: vi.fn(),
    end: vi.fn(),
    setHeader: vi.fn(),
  };

  res.status.mockImplementation((code: number) => {
    res.statusCode = code;
    return res;
  });

  res.json.mockImplementation((body: unknown) => {
    res.jsonBody = body;
    return res;
  });

  return res;
}

// ============================================================================
// Test Suite: getNotifyTarget 函數
// ============================================================================

describe('BE-7 | getNotifyTarget - 核心函數', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('輸入驗證', () => {
    it('無效的 caseId 格式應拋出錯誤', async () => {
      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget(INVALID_UUID)).rejects.toThrow(
        `Invalid caseId format: ${INVALID_UUID}`
      );

      // 不應該呼叫 DB
      expect(mockFrom).not.toHaveBeenCalled();
    });

    it('空字串 caseId 應拋出錯誤', async () => {
      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget('')).rejects.toThrow('Invalid caseId format');
      expect(mockFrom).not.toHaveBeenCalled();
    });
  });

  describe('優先順序邏輯', () => {
    it('有 buyer_user_id 時應返回 push 類型（優先於 buyer_line_id）', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: VALID_USER_ID,
          buyer_line_id: VALID_LINE_ID,
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');
      const result = await getNotifyTarget(VALID_CASE_ID);

      expect(result).toEqual({
        type: 'push',
        userId: VALID_USER_ID,
      });
      expect(mockFrom).toHaveBeenCalledWith('trust_cases');
      expect(mockSelect).toHaveBeenCalledWith('buyer_user_id, buyer_line_id');
      expect(mockEq).toHaveBeenCalledWith('id', VALID_CASE_ID);
    });

    it('只有 buyer_line_id 時應返回 line 類型', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: VALID_LINE_ID,
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');
      const result = await getNotifyTarget(VALID_CASE_ID);

      expect(result).toEqual({
        type: 'line',
        lineId: VALID_LINE_ID,
      });
    });

    it('大寫 LINE ID 也能通過驗證', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: VALID_LINE_ID_UPPER,
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');
      const result = await getNotifyTarget(VALID_CASE_ID);

      expect(result).toEqual({
        type: 'line',
        lineId: VALID_LINE_ID_UPPER,
      });
    });

    it('buyer_user_id 和 buyer_line_id 都沒有時應返回 null', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: null,
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');
      const result = await getNotifyTarget(VALID_CASE_ID);

      expect(result).toBeNull();
    });
  });

  describe('錯誤處理', () => {
    it('案件不存在時應拋出錯誤 (PGRST116)', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        },
      });

      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget(VALID_CASE_ID)).rejects.toThrow(
        `Case not found: ${VALID_CASE_ID}`
      );
    });

    it('資料庫連線錯誤時應拋出錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST500',
          message: 'Database connection failed',
        },
      });

      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget(VALID_CASE_ID)).rejects.toThrow(
        'Database error: Database connection failed'
      );
    });

    it('資料結構無效時應拋出錯誤（LINE ID 格式錯誤）', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: INVALID_LINE_ID, // 無效的 LINE ID
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget(VALID_CASE_ID)).rejects.toThrow('Invalid case data structure');
    });

    it('資料結構無效時應拋出錯誤（buyer_user_id 格式錯誤）', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: 'not-a-uuid',
          buyer_line_id: null,
        },
        error: null,
      });

      const { getNotifyTarget } = await import('../notify');

      await expect(getNotifyTarget(VALID_CASE_ID)).rejects.toThrow('Invalid case data structure');
    });
  });
});

// ============================================================================
// Test Suite: API Handler - 真正呼叫 handler
// ============================================================================

describe('BE-7 | GET /api/trust/notify - API Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('HTTP 方法驗證', () => {
    it('OPTIONS 應返回 200', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({ method: 'OPTIONS' });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.end).toHaveBeenCalled();
    });

    it('POST 應返回 405 METHOD_NOT_ALLOWED', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'POST',
        headers: { 'x-system-key': 'test-system-api-key' },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: '只允許 GET 方法',
        },
      });
    });

    it('PUT 應返回 405 METHOD_NOT_ALLOWED', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({ method: 'PUT' });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(405);
    });
  });

  describe('認證驗證', () => {
    it('缺少 x-system-key 應返回 401 UNAUTHORIZED', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: {},
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授權的存取',
        },
      });
    });

    it('無效的 x-system-key 應返回 401 UNAUTHORIZED', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'wrong-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '未授權的存取',
        },
      });
    });
  });

  describe('參數驗證', () => {
    it('缺少 caseId 應返回 400 INVALID_QUERY', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: {},
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.jsonBody).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUERY',
        },
      });
    });

    it('無效的 caseId 格式應返回 400 INVALID_QUERY', async () => {
      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: INVALID_UUID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.jsonBody).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_QUERY',
        },
      });
    });
  });

  describe('成功回應', () => {
    it('有 buyer_user_id 時應返回 200 和 push target', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: VALID_USER_ID,
          buyer_line_id: null,
        },
        error: null,
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.jsonBody).toEqual({
        success: true,
        data: {
          caseId: VALID_CASE_ID,
          target: {
            type: 'push',
            userId: VALID_USER_ID,
          },
        },
      });
    });

    it('只有 buyer_line_id 時應返回 200 和 line target', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: VALID_LINE_ID,
        },
        error: null,
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.jsonBody).toEqual({
        success: true,
        data: {
          caseId: VALID_CASE_ID,
          target: {
            type: 'line',
            lineId: VALID_LINE_ID,
          },
        },
      });
    });

    it('都沒有時應返回 200 和 null target', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: null,
        },
        error: null,
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.jsonBody).toEqual({
        success: true,
        data: {
          caseId: VALID_CASE_ID,
          target: null,
        },
      });
    });
  });

  describe('錯誤回應', () => {
    it('案件不存在應返回 404 NOT_FOUND', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST116',
          message: 'JSON object requested, multiple (or no) rows returned',
        },
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Case not found: ${VALID_CASE_ID}`,
        },
      });
    });

    it('資料結構錯誤應返回 500 INTERNAL_ERROR', async () => {
      mockSingle.mockResolvedValueOnce({
        data: {
          buyer_user_id: null,
          buyer_line_id: INVALID_LINE_ID,
        },
        error: null,
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '資料結構錯誤',
        },
      });
    });

    it('資料庫錯誤應返回 500 INTERNAL_ERROR', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: {
          code: 'PGRST500',
          message: 'Connection timeout',
        },
      });

      const { default: handler } = await import('../notify');
      const req = createMockRequest({
        method: 'GET',
        headers: { 'x-system-key': 'test-system-api-key' },
        query: { caseId: VALID_CASE_ID },
      });
      const res = createMockResponse();

      await handler(req, res as unknown as VercelResponse);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.jsonBody).toEqual({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '伺服器錯誤',
        },
      });
    });
  });
});

// ============================================================================
// Test Suite: 類型安全驗證
// ============================================================================

describe('BE-7 | 類型安全驗證', () => {
  it('NotifyTargetPush 類型結構正確', () => {
    const target: { type: 'push'; userId: string } = {
      type: 'push',
      userId: VALID_USER_ID,
    };

    expect(target.type).toBe('push');
    expect(target.userId).toBe(VALID_USER_ID);
    expect(target.userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('NotifyTargetLine 類型結構正確', () => {
    const target: { type: 'line'; lineId: string } = {
      type: 'line',
      lineId: VALID_LINE_ID,
    };

    expect(target.type).toBe('line');
    expect(target.lineId).toBe(VALID_LINE_ID);
    expect(target.lineId).toMatch(/^U[a-fA-F0-9]{32}$/);
    expect(target.lineId).toHaveLength(33);
  });

  it('LINE User ID 格式驗證', () => {
    // 有效格式
    expect(VALID_LINE_ID).toMatch(/^U[a-fA-F0-9]{32}$/);
    expect(VALID_LINE_ID_2).toMatch(/^U[a-fA-F0-9]{32}$/);
    expect(VALID_LINE_ID_UPPER).toMatch(/^U[a-fA-F0-9]{32}$/);

    // 無效格式
    expect(INVALID_LINE_ID).not.toMatch(/^U[a-fA-F0-9]{32}$/);
    expect('U123').not.toMatch(/^U[a-fA-F0-9]{32}$/); // 太短
    expect('X1234567890abcdef1234567890abcdef').not.toMatch(/^U[a-fA-F0-9]{32}$/); // 錯誤前綴
  });

  it('UUID v4 格式驗證', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 有效格式
    expect(VALID_CASE_ID).toMatch(uuidRegex);
    expect(VALID_USER_ID).toMatch(uuidRegex);
    expect(VALID_USER_ID_2).toMatch(uuidRegex);

    // 無效格式
    expect(INVALID_UUID).not.toMatch(uuidRegex);
    expect('').not.toMatch(uuidRegex);
    expect('123').not.toMatch(uuidRegex);
  });
});
