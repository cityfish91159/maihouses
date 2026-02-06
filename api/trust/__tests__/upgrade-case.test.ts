/**
 * API Integration Tests: POST /api/trust/upgrade-case
 *
 * Team Charlie: P0-3 補完測試覆蓋
 * - 驗證 JWT 認證流程
 * - 驗證 RPC fn_get_user_display_name 查詢真實姓名
 * - 驗證 RPC fn_upgrade_trust_case 參數正確性（buyer_name 應為真實姓名，非 UUID）
 * - 驗證錯誤處理（用戶不存在、空姓名等）
 * - 驗證審計日誌記錄（包含 buyer_name metadata）
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../upgrade-case';

// Mock dependencies
vi.mock('../_utils', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
  cors: vi.fn(),
  logAudit: vi.fn(() => Promise.resolve()),
  getClientIp: vi.fn(() => '127.0.0.1'),
  getUserAgent: vi.fn(() => 'Mozilla/5.0'),
  verifyToken: vi.fn(),
}));

vi.mock('../../lib/rateLimiter', () => ({
  rateLimitMiddleware: vi.fn(() => null),
}));

import { supabase, verifyToken, logAudit } from '../_utils';

describe('POST /api/trust/upgrade-case', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let statusMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    statusMock = vi.fn().mockReturnThis();
    jsonMock = vi.fn().mockReturnThis();

    mockReq = {
      method: 'POST',
      headers: {
        cookie: 'mh_token=valid-jwt-token',
      },
      body: {},
    };

    mockRes = {
      status: statusMock,
      json: jsonMock,
      setHeader: vi.fn(),
      end: vi.fn(),
    };

    // Default: JWT 驗證成功
    vi.mocked(verifyToken).mockReturnValue({
      id: 'user-123',
      role: 'buyer',
      txId: 'tx-456',
      ip: '127.0.0.1',
      agent: 'Mozilla/5.0',
    });
  });

  // ========================================================================
  // Test Suite 1: 成功路徑
  // ========================================================================
  describe('成功路徑', () => {
    it('應正確透過 RPC 查詢用戶姓名並傳入真實姓名到 RPC', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      // Mock: fn_get_user_display_name RPC 成功
      // Mock: fn_upgrade_trust_case RPC 成功
      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            case_id: '650e8400-e29b-41d4-a716-446655440001',
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // 驗證 fn_get_user_display_name 被呼叫
      expect(supabase.rpc).toHaveBeenNthCalledWith(1, 'fn_get_user_display_name', {
        p_user_id: 'user-123',
      });

      // 驗證 fn_upgrade_trust_case 被呼叫並傳入真實姓名
      expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'fn_upgrade_trust_case', {
        p_token: '550e8400-e29b-41d4-a716-446655440000',
        p_user_id: 'user-123',
        p_user_name: '王小明', // ← 真實姓名，非 UUID
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            case_id: '650e8400-e29b-41d4-a716-446655440001',
            message: '案件已成功升級為已註冊用戶',
          }),
        })
      );
    });

    it('應成功處理繁體中文姓名', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '李大華',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            case_id: '750e8400-e29b-41d4-a716-446655440456', // 有效 UUID
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'fn_upgrade_trust_case', {
        p_token: '550e8400-e29b-41d4-a716-446655440000',
        p_user_id: 'user-123',
        p_user_name: '李大華',
      });

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('應成功處理含空格的姓名', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: ' 陳小美 ',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            case_id: '850e8400-e29b-41d4-a716-446655440789', // 有效 UUID
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // 姓名應保留空格（trim 檢查是在 trim() === "" 的情況）
      expect(supabase.rpc).toHaveBeenNthCalledWith(2, 'fn_upgrade_trust_case', {
        p_token: '550e8400-e29b-41d4-a716-446655440000',
        p_user_id: 'user-123',
        p_user_name: ' 陳小美 ',
      });

      expect(statusMock).toHaveBeenCalledWith(200);
    });
  });

  // ========================================================================
  // Test Suite 2: 錯誤路徑 - 認證失敗
  // ========================================================================
  describe('認證失敗', () => {
    it('應在 JWT 驗證失敗時返回 401', async () => {
      vi.mocked(verifyToken).mockImplementationOnce(() => {
        throw new Error('Token expired');
      });

      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'UNAUTHORIZED',
            message: '未登入或 Token 已過期',
          }),
        })
      );
    });

    it('應在無 JWT Token 時返回 401', async () => {
      vi.mocked(verifyToken).mockImplementationOnce(() => {
        throw new Error('Unauthorized');
      });

      mockReq.headers = {}; // 無 cookie
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
    });
  });

  // ========================================================================
  // Test Suite 3: 錯誤路徑 - 參數驗證
  // ========================================================================
  describe('參數驗證', () => {
    it('應在 token 缺失時返回 400', async () => {
      mockReq.body = {}; // 無 token

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_INPUT',
            message: '請求參數格式錯誤',
          }),
        })
      );
    });

    it('應在 token 格式錯誤時返回 400', async () => {
      mockReq.body = { token: 'INVALID-FORMAT' }; // 非 UUID

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
    });
  });

  // ========================================================================
  // Test Suite 4: 錯誤路徑 - fn_get_user_display_name RPC 失敗
  // ========================================================================
  describe('fn_get_user_display_name RPC 失敗', () => {
    it('應在 RPC 返回錯誤時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'User not found' },
      } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DATA_FETCH_FAILED',
            message: '無法取得用戶資料',
          }),
        })
      );
    });

    it('應在 RPC 回應格式錯誤時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          invalid_field: 'invalid_value',
        },
        error: null,
      } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: '用戶資料格式錯誤',
          }),
        })
      );
    });

    it('應在 RPC 返回 success=false 時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: false,
          error: 'User not found',
        },
        error: null,
      } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DATA_FETCH_FAILED',
            message: 'User not found',
          }),
        })
      );
    });

    it('應在用戶姓名為空字串時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: true,
          name: '', // 空姓名
        },
        error: null,
      } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DATA_FETCH_FAILED',
            message: '無法取得用戶姓名',
          }),
        })
      );
    });

    it('應在用戶姓名為純空格時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: {
          success: true,
          name: '   ', // 純空格
        },
        error: null,
      } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DATA_FETCH_FAILED',
            message: '用戶姓名不可為空',
          }),
        })
      );
    });
  });

  // ========================================================================
  // Test Suite 5: 錯誤路徑 - fn_upgrade_trust_case RPC 失敗
  // ========================================================================
  describe('fn_upgrade_trust_case RPC 失敗', () => {
    it('應在 RPC 返回錯誤時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Database error' },
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'DATA_FETCH_FAILED',
            message: '案件升級失敗',
          }),
        })
      );
    });

    it('應在 RPC 返回 success=false 時返回 400', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: false,
            error: 'Token 已過期',
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INVALID_INPUT',
            message: 'Token 已過期',
          }),
        })
      );
    });

    it('應在 RPC 返回 undefined case_id 時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            // case_id: undefined
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: 'Database error: missing case_id',
          }),
        })
      );
    });

    it('應在 RPC 回應格式驗證失敗時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            invalid_field: 'invalid_value',
          },
          error: null,
        } as any);

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
  });

  // ========================================================================
  // Test Suite 6: 審計日誌驗證
  // ========================================================================
  describe('審計日誌', () => {
    it('應記錄 buyer_name 到審計日誌 metadata', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '李大華',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            case_id: '950e8400-e29b-41d4-a716-446655440456', // 有效 UUID
          },
          error: null,
        } as any);

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // 驗證 logAudit 被正確呼叫（包含 buyer_name 和 token）
      expect(logAudit).toHaveBeenCalledWith(
        '950e8400-e29b-41d4-a716-446655440456',
        'UPGRADE_TRUST_CASE',
        {
          id: 'user-123',
          role: 'buyer',
          txId: '950e8400-e29b-41d4-a716-446655440456',
          ip: '127.0.0.1',
          agent: 'Mozilla/5.0',
          metadata: {
            buyer_name: '李大華', // ✅ 真實姓名而非 UUID
            token: '550e8400-e29b-41d4-a716-446655440000', // ✅ 審計追蹤
          },
        }
      );

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('應在審計日誌失敗時返回 500（阻塞模式）', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      vi.mocked(supabase.rpc)
        .mockResolvedValueOnce({
          data: {
            success: true,
            name: '王小明',
          },
          error: null,
        } as any)
        .mockResolvedValueOnce({
          data: {
            success: true,
            case_id: '650e8400-e29b-41d4-a716-446655440001',
          },
          error: null,
        } as any);

      // Mock: logAudit 失敗
      vi.mocked(logAudit).mockRejectedValueOnce(new Error('Audit log failed'));

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'INTERNAL_ERROR',
            message: 'Audit logging failed',
          }),
        })
      );
    });
  });

  // ========================================================================
  // Test Suite 7: HTTP 方法驗證
  // ========================================================================
  describe('HTTP 方法驗證', () => {
    it('應正確處理 OPTIONS 預檢請求', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('應拒絕非 POST 請求並返回 405', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'METHOD_NOT_ALLOWED',
            message: '只允許 POST 請求',
          }),
        })
      );
    });

    it('應拒絕 PUT 請求並返回 405', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });

    it('應拒絕 DELETE 請求並返回 405', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
    });
  });

  // ========================================================================
  // Test Suite 8: Rate Limiting
  // ========================================================================
  describe('Rate Limiting', () => {
    it('應在 Rate limit 超過時返回 429', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

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
            message: '請求過於頻繁，請稍後再試',
          }),
        })
      );
    });
  });

  // ========================================================================
  // Test Suite 9: Unexpected Errors
  // ========================================================================
  describe('Unexpected Errors', () => {
    it('應在未預期錯誤時返回 500', async () => {
      mockReq.body = { token: '550e8400-e29b-41d4-a716-446655440000' };

      // Mock: RPC 拋出例外
      vi.mocked(supabase.rpc).mockImplementationOnce(() => {
        throw new Error('Unexpected database error');
      });

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
    });
  });
});
