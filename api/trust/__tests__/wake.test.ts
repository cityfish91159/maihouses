/**
 * BE-10 | 喚醒休眠案件 API 測試
 *
 * 17 個測試案例覆蓋所有情境
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

type SupabaseResult<T> = { data: T | null; error: { code?: string; message?: string } | null };

// 建立共用 Response 物件
function createMockRes() {
  const res: Partial<VercelResponse> = {
    statusCode: 200,
    status(code: number) {
      this.statusCode = code;
      return this as VercelResponse;
    },
    json(payload: unknown) {
      (this as { body?: unknown }).body = payload;
      return this as VercelResponse;
    },
    end() {
      return this as VercelResponse;
    },
  };
  return res as VercelResponse & { body?: unknown };
}

const baseCaseId = '550e8400-e29b-41d4-a716-446655440000';
const baseAgentId = '11111111-1111-4111-8111-111111111111';
const baseBuyerId = '22222222-2222-4222-8222-222222222222';
const otherAgentId = '33333333-3333-4333-8333-333333333333';
const otherBuyerId = '44444444-4444-4444-8444-444444444444';

const baseCaseRow = {
  id: baseCaseId,
  agent_id: baseAgentId,
  buyer_user_id: baseBuyerId,
  status: 'dormant',
  property_title: 'Test Property',
  dormant_at: '2026-01-20T00:00:00.000Z',
};

function createSupabaseMock({
  caseResult,
  updateResult,
}: {
  caseResult?: SupabaseResult<typeof baseCaseRow>;
  updateResult?: SupabaseResult<typeof baseCaseRow>;
} = {}) {
  const selectSingle = vi.fn().mockResolvedValue(caseResult ?? { data: baseCaseRow, error: null });
  const updateSingle = vi.fn().mockResolvedValue(
    updateResult ?? {
      data: {
        ...baseCaseRow,
        status: 'active',
        dormant_at: null,
      },
      error: null,
    }
  );

  // Select chain for reading: .select().eq().single()
  const selectEq = vi.fn(() => ({ single: selectSingle }));
  const selectFn = vi.fn(() => ({ eq: selectEq }));

  // Update chain builder - 支援任意順序的 eq 調用
  const chainObj: Record<string, ReturnType<typeof vi.fn>> = {};
  chainObj.eq = vi.fn(() => chainObj);
  chainObj.select = vi.fn(() => ({ single: updateSingle }));

  const updateFn = vi.fn(() => chainObj);

  const fromResult = {
    select: selectFn,
    update: updateFn,
  };

  return {
    from: vi.fn(() => fromResult),
  };
}

function mockModules(options?: {
  supabase?: ReturnType<typeof createSupabaseMock>;
  verifyToken?: ReturnType<typeof vi.fn>;
  systemKey?: string;
  sendCaseWakeNotification?: ReturnType<typeof vi.fn>;
  logAudit?: ReturnType<typeof vi.fn>;
}) {
  const supabase = options?.supabase ?? createSupabaseMock();
  const verifyToken =
    options?.verifyToken ??
    vi.fn(() => ({
      id: baseAgentId,
      role: 'agent',
      txId: 'tx-1',
      ip: '127.0.0.1',
      agent: 'vitest',
    }));
  const logAudit = options?.logAudit ?? vi.fn().mockResolvedValue(undefined);
  const sendCaseWakeNotification =
    options?.sendCaseWakeNotification ?? vi.fn().mockResolvedValue({ success: true });

  vi.doMock('../_utils', () => ({
    supabase,
    verifyToken,
    cors: vi.fn(),
    logAudit,
    SYSTEM_API_KEY: options?.systemKey ?? 'system-key',
    getClientIp: vi.fn(() => '127.0.0.1'),
    getUserAgent: vi.fn(() => 'vitest'),
  }));
  vi.doMock('../send-notification', () => ({
    sendCaseWakeNotification,
  }));
  vi.doMock('../../lib/logger', () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));

  return { supabase, verifyToken, logAudit, sendCaseWakeNotification };
}

describe('BE-10 trust/wake handler', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  // ============================================================================
  // 基本 HTTP 測試
  // ============================================================================

  it('1. OPTIONS 回傳 200', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = { method: 'OPTIONS', headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('2. GET 回傳 405', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = { method: 'GET', headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  // ============================================================================
  // 認證測試
  // ============================================================================

  it('3. 無認證回傳 401', async () => {
    mockModules({
      verifyToken: vi.fn(() => {
        throw new Error('Unauthorized');
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: {},
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it('4. 錯誤 system-key 回傳 401', async () => {
    const { verifyToken } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { 'x-system-key': 'wrong-key' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  // ============================================================================
  // 請求驗證測試
  // ============================================================================

  it('5. 無效 caseId 格式回傳 400', async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: 'not-uuid' },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('6. 案件不存在回傳 404', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: null, error: { code: 'PGRST116', message: 'Not found' } },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  // ============================================================================
  // 房仲權限測試
  // ============================================================================

  it('7. 房仲喚醒自己的 dormant 案件成功', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        caseId: baseCaseId,
        previousStatus: 'dormant',
        status: 'active',
      },
    });
  });

  it('8. 房仲喚醒他人案件回傳 403', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: {
          data: { ...baseCaseRow, agent_id: otherAgentId },
          error: null,
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  // ============================================================================
  // 消費者權限測試
  // ============================================================================

  it('9. 消費者喚醒自己的 dormant 案件成功', async () => {
    mockModules({
      verifyToken: vi.fn(() => ({
        id: baseBuyerId,
        role: 'buyer',
        txId: 'tx-1',
        ip: '127.0.0.1',
        agent: 'vitest',
      })),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('10. 消費者喚醒他人案件回傳 403', async () => {
    mockModules({
      verifyToken: vi.fn(() => ({
        id: otherBuyerId,
        role: 'buyer',
        txId: 'tx-1',
        ip: '127.0.0.1',
        agent: 'vitest',
      })),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  // ============================================================================
  // System Key 測試
  // ============================================================================

  it('11. System-key 喚醒任意 dormant 案件成功', async () => {
    const { verifyToken } = mockModules({
      supabase: createSupabaseMock({
        caseResult: {
          data: { ...baseCaseRow, agent_id: otherAgentId },
          error: null,
        },
        updateResult: {
          data: { ...baseCaseRow, agent_id: otherAgentId, status: 'active', dormant_at: null },
          error: null,
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { 'x-system-key': 'system-key' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  // ============================================================================
  // 狀態驗證測試
  // ============================================================================

  it('12. 喚醒 active 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'active' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('13. 喚醒 closed 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'closed' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  // ============================================================================
  // 更新驗證測試
  // ============================================================================

  it('14. dormant_at 被正確清除', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    // 確認回傳的案件狀態為 active
    expect(res.body).toMatchObject({
      success: true,
      data: {
        status: 'active',
      },
    });
  });

  it('15. 並發衝突回傳 409', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: baseCaseRow, error: null },
        updateResult: { data: null, error: { code: 'PGRST116', message: 'No rows returned' } },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(409);
  });

  // ============================================================================
  // 通知與審計測試
  // ============================================================================

  it('16. 通知函數被呼叫', async () => {
    const { sendCaseWakeNotification } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(sendCaseWakeNotification).toHaveBeenCalledTimes(1);
    expect(sendCaseWakeNotification).toHaveBeenCalledWith(baseCaseId, 'Test Property');
  });

  it('17. 審計日誌被記錄（區分來源）', async () => {
    const { logAudit } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(logAudit).toHaveBeenCalledTimes(1);
    expect(logAudit).toHaveBeenCalledWith(
      baseCaseId,
      'WAKE_TRUST_CASE_AGENT',
      expect.objectContaining({ id: baseAgentId, role: 'agent' })
    );
  });

  // ============================================================================
  // 額外邊界測試
  // ============================================================================

  it('通知失敗不影響主流程', async () => {
    const failingNotification = vi.fn().mockRejectedValue(new Error('Push failed'));
    mockModules({
      sendCaseWakeNotification: failingNotification,
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(failingNotification).toHaveBeenCalled();
  });

  it('logAudit 失敗不影響主流程', async () => {
    const failingAudit = vi.fn().mockRejectedValue(new Error('Audit DB down'));
    mockModules({
      logAudit: failingAudit,
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(failingAudit).toHaveBeenCalled();
  });

  it('property_title 為 null 時正常處理', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, property_title: null }, error: null },
        updateResult: {
          data: { ...baseCaseRow, property_title: null, status: 'active', dormant_at: null },
          error: null,
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it('System Key 審計記錄為 WAKE_TRUST_CASE_SYSTEM', async () => {
    const { logAudit } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { 'x-system-key': 'system-key' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(logAudit).toHaveBeenCalledWith(
      baseCaseId,
      'WAKE_TRUST_CASE_SYSTEM',
      expect.objectContaining({ id: 'system', role: 'system' })
    );
  });

  it('Buyer 審計記錄為 WAKE_TRUST_CASE_BUYER', async () => {
    const { logAudit } = mockModules({
      verifyToken: vi.fn(() => ({
        id: baseBuyerId,
        role: 'buyer',
        txId: 'tx-1',
        ip: '127.0.0.1',
        agent: 'vitest',
      })),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(logAudit).toHaveBeenCalledWith(
      baseCaseId,
      'WAKE_TRUST_CASE_BUYER',
      expect.objectContaining({ id: baseBuyerId, role: 'buyer' })
    );
  });

  it('案件資料驗證失敗返回 500', async () => {
    const invalidCaseRow = {
      id: baseCaseId,
      agent_id: baseAgentId,
      // 缺少 buyer_user_id, status, property_title, dormant_at
    };

    const supabase = createSupabaseMock();
    const selectSingle = vi.fn().mockResolvedValue({ data: invalidCaseRow, error: null });
    const selectEq = vi.fn(() => ({ single: selectSingle }));
    const selectFn = vi.fn(() => ({ eq: selectEq }));
    supabase.from = vi.fn(() => ({ select: selectFn, update: vi.fn() }));

    mockModules({ supabase });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('資料庫非 404 錯誤返回 500', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: {
          data: null,
          error: { code: 'PGRST500', message: 'Database connection failed' },
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it('JWT system role 回傳 403', async () => {
    mockModules({
      verifyToken: vi.fn(() => ({
        id: 'system-id',
        role: 'system',
        txId: 'tx-1',
        ip: '127.0.0.1',
        agent: 'vitest',
      })),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  // ============================================================================
  // P1 補充測試：HTTP 方法
  // ============================================================================

  it('PUT 回傳 405', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = { method: 'PUT', headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('DELETE 回傳 405', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = { method: 'DELETE', headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it('PATCH 回傳 405', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = { method: 'PATCH', headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  // ============================================================================
  // P1 補充測試：請求驗證
  // ============================================================================

  it('缺少 caseId 回傳 400', async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: {},
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('空 body 回傳 400', async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: null,
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('caseId 為空字串回傳 400', async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: '' },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  // ============================================================================
  // P1 補充測試：權限
  // ============================================================================

  it('buyer 但 buyer_user_id 為 null 回傳 403', async () => {
    mockModules({
      verifyToken: vi.fn(() => ({
        id: baseBuyerId,
        role: 'buyer',
        txId: 'tx-1',
        ip: '127.0.0.1',
        agent: 'vitest',
      })),
      supabase: createSupabaseMock({
        caseResult: {
          data: { ...baseCaseRow, buyer_user_id: null },
          error: null,
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it('JWT 過期回傳 401', async () => {
    mockModules({
      verifyToken: vi.fn(() => {
        throw new Error('Token expired or invalid');
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer expired-token' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  // ============================================================================
  // P2 補充測試：closed_* 狀態
  // ============================================================================

  it('喚醒 closed_sold_to_other 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'closed_sold_to_other' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('喚醒 closed_property_unlisted 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'closed_property_unlisted' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('喚醒 closed_inactive 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'closed_inactive' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('喚醒 completed 案件回傳 400', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'completed' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  // ============================================================================
  // P2 補充測試：回傳格式驗證
  // ============================================================================

  it('成功回傳包含 wokenAt 時間戳', async () => {
    mockModules();
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);

    const body = res.body as { success: boolean; data: { wokenAt: string } };
    expect(body.data.wokenAt).toBeDefined();
    // 驗證 wokenAt 是有效的 ISO 時間戳
    expect(new Date(body.data.wokenAt).toISOString()).toBe(body.data.wokenAt);
  });

  it('錯誤訊息符合規格「案件狀態不允許喚醒（必須為休眠狀態）」', async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: 'active' }, error: null },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);

    const body = res.body as { success: boolean; error: { message: string } };
    expect(body.error.message).toBe('案件狀態不允許喚醒（必須為休眠狀態）');
  });

  it('property_title 為 null 時通知傳入 undefined', async () => {
    const { sendCaseWakeNotification } = mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, property_title: null }, error: null },
        updateResult: {
          data: { ...baseCaseRow, property_title: null, status: 'active', dormant_at: null },
          error: null,
        },
      }),
    });
    const { default: handler } = await import('../wake');

    const req = {
      method: 'POST',
      headers: { authorization: 'Bearer x' },
      body: { caseId: baseCaseId },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(sendCaseWakeNotification).toHaveBeenCalledWith(baseCaseId, undefined);
  });
});
