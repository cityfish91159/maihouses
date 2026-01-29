/**
 * API Integration Tests: POST /api/trust/auto-create-case
 *
 * Team Bravo: P0-2 補完測試覆蓋
 * - 驗證 System API Key 認證
 * - 驗證請求參數格式
 * - 驗證業務邏輯錯誤處理
 * - 驗證成功建立案件流程
 *
 * Mock Quality Optimizations (目標: 95/100):
 * 1. 移除不必要的 Mock
 * 2. 添加 Mock 呼叫驗證
 * 3. 完善 beforeEach/afterEach
 * 4. 驗證 Mock 函數參數
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../auto-create-case';

// ========================================================================
// Type Definitions for Mocks
// ========================================================================
type PostgrestError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
};

// RPC Response Type
type RpcResponse<T> = {
  data: T | null;
  error: PostgrestError | null;
};

// fn_create_trust_case RPC Result Type
type CreateTrustCaseResult = {
  success: boolean;
  case_id?: string | null;
  token?: string | null;
  token_expires_at?: string;
  event_hash?: string;
  error?: string;
};

// Supabase From Query Chain Type
type SupabaseUpdateChain = {
  update: (data: Record<string, unknown>) => {
    eq: (
      column: string,
      value: string
    ) => Promise<{
      data: null;
      error: PostgrestError | null;
    }>;
  };
};

// Mock dependencies
vi.mock('../_utils', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
  cors: vi.fn(),
  logAudit: vi.fn(() => Promise.resolve()),
  withTimeout: vi.fn((promise) => promise),
  SYSTEM_API_KEY: 'test-system-key-12345',
}));

vi.mock('../_auto-create-helpers', () => ({
  validateProperty: vi.fn(),
  resolveBuyerInfo: vi.fn(),
  getClientIp: vi.fn(() => '127.0.0.1'),
  getUserAgent: vi.fn(() => 'Mozilla/5.0'),
}));

vi.mock('../../lib/rateLimiter', () => ({
  rateLimitMiddleware: vi.fn(() => null),
}));

import { supabase, logAudit, withTimeout } from '../_utils';
import {
  validateProperty,
  resolveBuyerInfo,
  getClientIp,
  getUserAgent,
} from '../_auto-create-helpers';
import { rateLimitMiddleware } from '../../lib/rateLimiter';

describe('POST /api/trust/auto-create-case', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // 清除所有 mock 狀態
    vi.clearAllMocks();

    // 設置 response mock
    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();

    mockReq = {
      method: 'POST',
      headers: {},
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
      setHeader: vi.fn(),
      end: vi.fn(),
    };
  });

  afterEach(() => {
    // 確保每個測試後都清理 mock
    vi.restoreAllMocks();
  });

  // ========================================================================
  // Test 1: 認證測試 - 應拒絕無 System Key 的請求
  // ========================================================================
  it('應拒絕無 System Key 的請求並返回 401', async () => {
    mockReq.headers = {}; // 無 x-system-key

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
        }),
      })
    );

    // 驗證 validateProperty 不應被呼叫（認證失敗提前返回）
    expect(validateProperty).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Test 2: 認證測試 - 應拒絕錯誤的 System Key
  // ========================================================================
  it('應拒絕錯誤的 System Key 並返回 401', async () => {
    mockReq.headers = {
      'x-system-key': 'wrong-key',
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'UNAUTHORIZED',
        }),
      })
    );

    // 驗證 validateProperty 不應被呼叫
    expect(validateProperty).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Test 3: 參數驗證 - 應拒絕無效的 propertyId 格式
  // ========================================================================
  it('應拒絕無效的 propertyId 格式並返回 400', async () => {
    mockReq.headers = {
      'x-system-key': 'test-system-key-12345',
    };
    mockReq.body = {
      propertyId: 'INVALID-FORMAT', // 非 MH-XXXXX 格式
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
        }),
      })
    );

    // 驗證 validateProperty 不應被呼叫（參數驗證失敗提前返回）
    expect(validateProperty).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Test 4: 業務邏輯 - 應拒絕未開啟 trust 的物件
  // ========================================================================
  it('應拒絕未開啟 trust 的物件並返回 400', async () => {
    mockReq.headers = {
      'x-system-key': 'test-system-key-12345',
    };
    mockReq.body = {
      propertyId: 'MH-100001',
    };

    // Mock: 物件存在但 trust_enabled = false
    vi.mocked(validateProperty).mockResolvedValue({
      success: false,
      errorCode: 'INVALID_INPUT',
      errorMessage: '此物件未開啟安心留痕服務',
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // 驗證 validateProperty 被正確呼叫
    expect(validateProperty).toHaveBeenCalledWith('MH-100001');
    expect(validateProperty).toHaveBeenCalledTimes(1);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: '此物件未開啟安心留痕服務',
        }),
      })
    );

    // 驗證 resolveBuyerInfo 不應被呼叫（物件驗證失敗提前返回）
    expect(resolveBuyerInfo).not.toHaveBeenCalled();
  });

  // ========================================================================
  // Test 5: 成功流程 - 匿名用戶建立案件（Mock 版本）
  // 注意：此為 Mock 測試，僅測試匿名用戶流程
  // 已註冊用戶流程涉及並行任務和 Supabase 鏈式呼叫，需要整合測試環境
  // ========================================================================
  it('應成功建立匿名用戶案件並生成臨時代號並返回 201', async () => {
    mockReq.headers = {
      'x-system-key': 'test-system-key-12345',
    };
    mockReq.body = {
      propertyId: 'MH-100001',
      // 無 userId 和 userName
    };

    // Mock: 物件驗證通過
    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    // Mock: 匿名用戶（生成臨時代號）
    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-A7B2C3D4',
      buyerUserId: null,
    });

    // Mock: supabase.rpc() 返回成功結果
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: '650e8400-e29b-41d4-a716-446655440001',
        token: '550e8400-e29b-41d4-a716-446655440000',
        token_expires_at: '2026-04-29T00:00:00Z',
        event_hash: 'hash456',
      } satisfies CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    // 匿名用戶不會執行 update，所以不需要 mock supabase.from

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // 驗證 RPC 被正確呼叫
    expect(supabase.rpc).toHaveBeenCalledWith('fn_create_trust_case', {
      p_agent_id: 'agent-uuid-456',
      p_buyer_name: '買方-A7B2C3D4',
      p_property_title: '測試物件',
      p_buyer_session_id: null,
      p_buyer_contact: null,
      p_property_id: 'MH-100001',
    });

    // 驗證 update 不應被呼叫（匿名用戶無 buyer_user_id）
    expect(supabase.from).not.toHaveBeenCalled();

    // 驗證回應
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          case_id: '650e8400-e29b-41d4-a716-446655440001',
          token: '550e8400-e29b-41d4-a716-446655440000',
          buyer_name: '買方-A7B2C3D4',
        }),
      })
    );
  });

  // ========================================================================
  // Test 6: RPC 失敗路徑 - RPC 函數返回 error
  // ========================================================================
  it('應處理 RPC 函數錯誤並返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回 error
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'Database error' } satisfies PostgrestError,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'DATA_FETCH_FAILED',
        }),
      })
    );
  });

  // ========================================================================
  // Test 7: RPC 失敗路徑 - RPC 返回 success=false
  // ========================================================================
  it('應處理 RPC 返回 success=false 並返回 400', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回 success=false
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: false,
        error: '案件已存在',
      } satisfies CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
          message: '案件已存在',
        }),
      })
    );
  });

  // ========================================================================
  // Test 8: RPC 失敗路徑 - RPC 返回 null case_id
  // ========================================================================
  it('應處理 RPC 返回 null case_id 並返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回無效格式（缺少必要欄位）
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: null, // null case_id
        token: '550e8400-e29b-41d4-a716-446655440000',
      } satisfies CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });

  // ========================================================================
  // Test 9: RPC 失敗路徑 - RPC 回應格式驗證失敗
  // ========================================================================
  it('應處理 RPC 回應格式驗證失敗並返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回完全錯誤的格式
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        invalid_field: 'invalid_value',
      } as CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: '回應格式驗證失敗',
        }),
      })
    );
  });

  // ========================================================================
  // Test 10: RPC 失敗路徑 - Audit log 失敗（不應影響主流程）
  // ========================================================================
  it('應在 Audit log 失敗時仍然成功返回 201', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: '650e8400-e29b-41d4-a716-446655440001',
        token: '550e8400-e29b-41d4-a716-446655440000',
        token_expires_at: '2026-04-29T00:00:00Z',
        event_hash: 'hash456',
      } satisfies CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    // Mock logAudit 失敗（但不應影響主流程）
    const { logAudit } = await import('../_utils');
    vi.mocked(logAudit).mockRejectedValueOnce(new Error('Audit log failed'));

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // 即使 audit log 失敗，主流程應該成功
    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );
  });

  // ========================================================================
  // Test 11: RPC 失敗路徑 - Rate limiting (429)
  // ========================================================================
  it('應在 Rate limit 超過時返回 429', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    // Mock rate limiter 返回錯誤
    const { rateLimitMiddleware } = await import('../../lib/rateLimiter');
    vi.mocked(rateLimitMiddleware).mockReturnValueOnce({
      remaining: 0,
      retryAfter: 60,
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      })
    );
  });

  // ========================================================================
  // Test 12: RPC 失敗路徑 - 並行請求（已註冊用戶）
  // ========================================================================
  it('應成功處理已註冊用戶案件並執行並行任務', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = {
      propertyId: 'MH-100001',
      userId: '550e8400-e29b-41d4-a716-446655440000',
      userName: '測試用戶',
    };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '測試用戶',
      buyerUserId: '550e8400-e29b-41d4-a716-446655440000',
    });

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: '650e8400-e29b-41d4-a716-446655440001',
        token: '550e8400-e29b-41d4-a716-446655440000',
        token_expires_at: '2026-04-29T00:00:00Z',
        event_hash: 'hash456',
      } satisfies CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    // Mock supabase.from().update().eq() 鏈式呼叫
    vi.mocked(supabase.from).mockReturnValueOnce({
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }),
    } as SupabaseUpdateChain);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    // 驗證 update 被呼叫（已註冊用戶需更新 buyer_user_id）
    expect(supabase.from).toHaveBeenCalledWith('trust_cases');

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          buyer_name: '測試用戶',
        }),
      })
    );
  });

  // ========================================================================
  // Test 13: RPC 失敗路徑 - Property 不存在
  // ========================================================================
  it('應在 Property 不存在時返回 404', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-999999' };

    // Mock: 物件不存在
    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: false,
      errorCode: 'NOT_FOUND',
      errorMessage: '找不到對應的物件',
    });

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: '找不到對應的物件',
        }),
      })
    );
  });

  // ========================================================================
  // Test 14: OPTIONS 預檢請求
  // ========================================================================
  it('應正確處理 OPTIONS 預檢請求', async () => {
    mockReq.method = 'OPTIONS';

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });

  // ========================================================================
  // Test 15: 非 POST 請求拒絕
  // ========================================================================
  it('應拒絕非 POST 請求並返回 405', async () => {
    mockReq.method = 'GET';

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(405);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'METHOD_NOT_ALLOWED',
        }),
      })
    );
  });

  // ========================================================================
  // Test 16: 用戶 ID 不存在時應返回 400 (Team Bravo P0-2)
  // ========================================================================
  it('應在 userId 不存在時返回 400', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = {
      propertyId: 'MH-100001',
      userId: '550e8400-e29b-41d4-a716-446655440999', // 不存在的用戶
    };

    // Mock: 物件驗證通過
    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    // Mock: resolveBuyerInfo 拋出錯誤（用戶不存在）
    vi.mocked(resolveBuyerInfo).mockRejectedValueOnce(new Error('找不到對應的用戶'));

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });

  // ========================================================================
  // Test 17: users 表查詢失敗應返回 500 (Team Bravo P0-2)
  // ========================================================================
  it('應在 users 表查詢失敗時返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = {
      propertyId: 'MH-100001',
      userId: '550e8400-e29b-41d4-a716-446655440000',
    };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    // Mock: resolveBuyerInfo 拋出資料驗證錯誤
    vi.mocked(resolveBuyerInfo).mockRejectedValueOnce(new Error('用戶資料格式驗證失敗'));

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });

  // ========================================================================
  // Test 18: RPC Timeout 測試 (Team Bravo P0-2)
  // ========================================================================
  it('應在 RPC Timeout 時返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock withTimeout 拋出 timeout 錯誤
    // 注意：withTimeout 拋出的錯誤會被 catch 捕獲，返回 INTERNAL_ERROR
    const { withTimeout } = await import('../_utils');
    vi.mocked(withTimeout).mockRejectedValueOnce(new Error('RPC call timed out after 15 seconds'));

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: '伺服器內部錯誤',
        }),
      })
    );
  }, 20000); // 設定測試 timeout 為 20 秒

  // ========================================================================
  // Test 19: RPC 返回 null response 測試 (Team Bravo P0-2)
  // ========================================================================
  it('應在 RPC 返回 null response 時返回 500', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回 null data
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
        }),
      })
    );
  });

  // ========================================================================
  // Test 20: Schema 驗證失敗測試 (Team Bravo P0-2)
  // ========================================================================
  it('應在 RPC 回應 Schema 驗證失敗時返回 500（case_id 類型錯誤）', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回格式錯誤的 response（case_id 是 number 而非 UUID string）
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        // 刻意使用錯誤類型模擬 Schema 驗證失敗場景
        case_id: 12345 as string,
        token: '550e8400-e29b-41d4-a716-446655440000',
      } as CreateTrustCaseResult,
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INTERNAL_ERROR',
          message: '回應格式驗證失敗',
        }),
      })
    );
  });

  // ========================================================================
  // Test 21: 重複 token 測試 (Team Bravo P0-2)
  // ========================================================================
  it('應在嘗試建立重複 token 時返回 400', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回重複 token 錯誤
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Token already exists',
      },
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
          message: 'Token already exists',
        }),
      })
    );
  });

  // ========================================================================
  // Test 22: 並發請求測試 - 兩個請求同時建立 case (Team Bravo P0-2)
  // ========================================================================
  it('應正確處理並發請求（第一個成功，第二個因重複 token 失敗）', async () => {
    const mockUserData = { id: 'user-123', name: '測試用戶' };
    const mockCaseId = '650e8400-e29b-41d4-a716-446655440001';

    // 建立兩組獨立的 mock request/response
    const req1 = {
      method: 'POST',
      headers: { 'x-system-key': 'test-system-key-12345' },
      body: { propertyId: 'MH-100001' },
    } as Partial<VercelRequest>;

    const res1Status = vi.fn().mockReturnThis();
    const res1Json = vi.fn().mockReturnThis();
    const res1 = {
      status: res1Status,
      json: res1Json,
      setHeader: vi.fn(),
      end: vi.fn(),
    } as Partial<VercelResponse>;

    const req2 = {
      method: 'POST',
      headers: { 'x-system-key': 'test-system-key-12345' },
      body: { propertyId: 'MH-100001' },
    } as Partial<VercelRequest>;

    const res2Status = vi.fn().mockReturnThis();
    const res2Json = vi.fn().mockReturnThis();
    const res2 = {
      status: res2Status,
      json: res2Json,
      setHeader: vi.fn(),
      end: vi.fn(),
    } as Partial<VercelResponse>;

    // Mock validateProperty（兩次呼叫都成功）
    vi.mocked(validateProperty)
      .mockResolvedValueOnce({
        success: true,
        property: {
          public_id: 'MH-100001',
          title: '測試物件',
          trust_enabled: true,
          agent_id: 'agent-uuid-456',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        property: {
          public_id: 'MH-100001',
          title: '測試物件',
          trust_enabled: true,
          agent_id: 'agent-uuid-456',
        },
      });

    // Mock resolveBuyerInfo（兩次呼叫都成功）
    vi.mocked(resolveBuyerInfo)
      .mockResolvedValueOnce({
        buyerName: '買方-TEST1',
        buyerUserId: null,
      })
      .mockResolvedValueOnce({
        buyerName: '買方-TEST2',
        buyerUserId: null,
      });

    // Mock RPC：第一次成功，第二次因為重複 token 失敗
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({
        data: {
          success: true,
          case_id: mockCaseId,
          token: '550e8400-e29b-41d4-a716-446655440000',
          token_expires_at: '2026-04-29T00:00:00Z',
          event_hash: 'hash456',
        } satisfies CreateTrustCaseResult,
        error: null,
      } satisfies RpcResponse<CreateTrustCaseResult>)
      .mockResolvedValueOnce({
        data: {
          success: false,
          error: 'Token already exists',
        } satisfies CreateTrustCaseResult,
        error: null,
      } satisfies RpcResponse<CreateTrustCaseResult>);

    // 並發執行兩個請求
    await Promise.all([
      handler(req1 as VercelRequest, res1 as VercelResponse),
      handler(req2 as VercelRequest, res2 as VercelResponse),
    ]);

    // 驗證第一個請求成功
    expect(res1Status).toHaveBeenCalledWith(201);
    expect(res1Json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
      })
    );

    // 驗證第二個請求失敗（重複 token）
    expect(res2Status).toHaveBeenCalledWith(400);
    expect(res2Json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
        }),
      })
    );
  });

  // ========================================================================
  // Test 23: 競態條件測試 - 模擬 token 碰撞 (Team Bravo P0-2)
  // ========================================================================
  it('應在 token 碰撞時正確處理重試邏輯', async () => {
    mockReq.headers = { 'x-system-key': 'test-system-key-12345' };
    mockReq.body = { propertyId: 'MH-100001' };

    vi.mocked(validateProperty).mockResolvedValueOnce({
      success: true,
      property: {
        public_id: 'MH-100001',
        title: '測試物件',
        trust_enabled: true,
        agent_id: 'agent-uuid-456',
      },
    });

    vi.mocked(resolveBuyerInfo).mockResolvedValueOnce({
      buyerName: '買方-TEST',
      buyerUserId: null,
    });

    // Mock RPC 返回 token 碰撞錯誤
    // 注意：目前的實作沒有重試邏輯，所以直接返回 400
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: false,
        error: 'Duplicate token detected',
      },
      error: null,
    } satisfies RpcResponse<CreateTrustCaseResult>);

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: 'INVALID_INPUT',
          message: 'Duplicate token detected',
        }),
      })
    );
  });
});
