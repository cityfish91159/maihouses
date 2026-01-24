/**
 * BE-9 | 案件關閉通知 API 測試
 *
 * 14 個測試案例覆蓋所有情境
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

const baseCaseId = "550e8400-e29b-41d4-a716-446655440000";
const baseAgentId = "11111111-1111-4111-8111-111111111111";

const baseCaseRow = {
  id: baseCaseId,
  agent_id: baseAgentId,
  status: "active",
  property_title: "Test Property",
  closed_at: null,
  closed_reason: null,
};

function createSupabaseMock({
  caseResult,
  updateResult,
}: {
  caseResult?: SupabaseResult<typeof baseCaseRow>;
  updateResult?: SupabaseResult<typeof baseCaseRow>;
} = {}) {
  const selectSingle = vi.fn().mockResolvedValue(
    caseResult ?? { data: baseCaseRow, error: null },
  );
  const updateSingle = vi.fn().mockResolvedValue(
    updateResult ?? {
      data: {
        ...baseCaseRow,
        status: "closed",
        closed_at: "2026-01-23T00:00:00.000Z",
        closed_reason: "closed_inactive",
      },
      error: null,
    },
  );

  // Select chain for reading: .select().eq().single()
  const selectEq = vi.fn(() => ({ single: selectSingle }));
  const selectFn = vi.fn(() => ({ eq: selectEq }));

  // Update chain builder - 所有節點都返回同樣的物件結構以支援任意順序調用
  const updateSelectFn = vi.fn(() => ({ single: updateSingle }));

  // 建立一個通用的鏈式物件，支援 eq/in/select 任意順序
  const chainObj: Record<string, ReturnType<typeof vi.fn>> = {};
  chainObj.eq = vi.fn(() => chainObj);
  chainObj.in = vi.fn(() => chainObj);
  chainObj.select = vi.fn(() => ({ single: updateSingle }));

  const updateFn = vi.fn(() => chainObj);

  // Single from object that has both select and update
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
  sendCaseClosedNotification?: ReturnType<typeof vi.fn>;
  logAudit?: ReturnType<typeof vi.fn>;
}) {
  const supabase = options?.supabase ?? createSupabaseMock();
  const verifyToken =
    options?.verifyToken ??
    vi.fn(() => ({
      id: baseAgentId,
      role: "agent",
      txId: "tx-1",
      ip: "127.0.0.1",
      agent: "vitest",
    }));
  const logAudit = options?.logAudit ?? vi.fn().mockResolvedValue(undefined);
  const sendCaseClosedNotification =
    options?.sendCaseClosedNotification ?? vi.fn().mockResolvedValue({ success: true });

  vi.doMock("../_utils", () => ({
    supabase,
    verifyToken,
    cors: vi.fn(),
    logAudit,
    SYSTEM_API_KEY: options?.systemKey ?? "system-key",
    getClientIp: vi.fn(() => "127.0.0.1"),
    getUserAgent: vi.fn(() => "vitest"),
  }));
  vi.doMock("../send-notification", () => ({
    sendCaseClosedNotification,
    CLOSE_REASON_TEXTS: {
      closed_sold_to_other: "test",
      closed_property_unlisted: "test",
      closed_inactive: "test",
    },
  }));
  vi.doMock("../../lib/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));

  return { supabase, verifyToken, logAudit, sendCaseClosedNotification };
}

describe("BE-9 trust/close handler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("OPTIONS 回傳 200", async () => {
    mockModules();
    const { default: handler } = await import("../close");

    const req = { method: "OPTIONS", headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("GET 回傳 405", async () => {
    mockModules();
    const { default: handler } = await import("../close");

    const req = { method: "GET", headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  it("無認證回傳 401", async () => {
    mockModules({
      verifyToken: vi.fn(() => {
        throw new Error("Unauthorized");
      }),
    });
    const { default: handler } = await import("../close");

    const req = { method: "POST", headers: {}, body: { caseId: baseCaseId, reason: "closed_inactive" } } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("System Key 認證成功", async () => {
    const { verifyToken } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { "x-system-key": "system-key" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("System Key 錯誤回傳 401", async () => {
    const { verifyToken } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { "x-system-key": "wrong-key" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(verifyToken).not.toHaveBeenCalled();
  });

  it("JWT 非 agent 角色回傳 403", async () => {
    mockModules({
      verifyToken: vi.fn(() => ({
        id: baseAgentId,
        role: "buyer",
        txId: "tx-1",
        ip: "127.0.0.1",
        agent: "vitest",
      })),
    });
    const { default: handler } = await import("../close");

    const req = { method: "POST", headers: { authorization: "Bearer x" }, body: { caseId: baseCaseId, reason: "closed_inactive" } } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("無效 caseId 格式回傳 400", async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: "not-uuid", reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("無效 reason 回傳 400", async () => {
    const { supabase } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "invalid_reason" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("案件不存在回傳 404", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: null, error: { code: "PGRST116", message: "Not found" } },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(404);
  });

  it("非擁有者關閉回傳 403", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: {
          data: { ...baseCaseRow, agent_id: "22222222-2222-4222-8222-222222222222" },
          error: null,
        },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("已關閉案件回傳 400", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: "closed" }, error: null },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });

  it("成功關閉 active 案件", async () => {
    mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_property_unlisted" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("成功關閉 dormant 案件", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, status: "dormant" }, error: null },
        updateResult: {
          data: {
            ...baseCaseRow,
            status: "closed",
            closed_at: "2026-01-23T00:00:00.000Z",
            closed_reason: "closed_sold_to_other",
          },
          error: null,
        },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_sold_to_other" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("通知函數被呼叫", async () => {
    const { sendCaseClosedNotification } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(sendCaseClosedNotification).toHaveBeenCalledTimes(1);
    expect(sendCaseClosedNotification).toHaveBeenCalledWith(
      baseCaseId,
      "closed_inactive",
      "Test Property",
    );
  });

  it("logAudit 被呼叫", async () => {
    const { logAudit } = mockModules();
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(logAudit).toHaveBeenCalledTimes(1);
    expect(logAudit).toHaveBeenCalledWith(
      baseCaseId,
      "CLOSE_TRUST_CASE_JWT",
      expect.objectContaining({ id: baseAgentId, role: "agent" }),
    );
  });

  it("System Key 可關閉其他房仲的案件", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: {
          data: { ...baseCaseRow, agent_id: "22222222-2222-4222-8222-222222222222" },
          error: null,
        },
        updateResult: {
          data: {
            ...baseCaseRow,
            agent_id: "22222222-2222-4222-8222-222222222222",
            status: "closed",
            closed_at: "2026-01-23T00:00:00.000Z",
            closed_reason: "closed_inactive",
          },
          error: null,
        },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { "x-system-key": "system-key" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });
  it("UPDATE 並發衝突時返回 409", async () => {
    // 修復 #3: PGRST116 (no rows returned) 代表並發衝突，應返回 409 Conflict
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: baseCaseRow, error: null },
        updateResult: { data: null, error: { code: "PGRST116", message: "No rows returned" } },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(409);
  });
  it("通知失敗不影響主流程", async () => {
    const failingNotification = vi.fn().mockRejectedValue(new Error("Push failed"));
    mockModules({
      sendCaseClosedNotification: failingNotification,
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(failingNotification).toHaveBeenCalled();
  });
  it("logAudit 失敗不影響主流程", async () => {
    const failingAudit = vi.fn().mockRejectedValue(new Error("Audit DB down"));
    mockModules({
      logAudit: failingAudit,
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(failingAudit).toHaveBeenCalled();
  });
  it("property_title 為空字串時正常處理", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: { ...baseCaseRow, property_title: "" }, error: null },
        updateResult: {
          data: { ...baseCaseRow, property_title: "", status: "closed", closed_at: "2026-01-23T00:00:00.000Z", closed_reason: "closed_inactive" },
          error: null,
        },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("案件資料驗證失敗返回 500", async () => {
    // 模擬資料庫返回不符合 Schema 的資料（缺少必要欄位）
    const invalidCaseRow = {
      id: baseCaseId,
      agent_id: baseAgentId,
      // 缺少 status, property_title 等必要欄位
    };

    const supabase = createSupabaseMock();
    const selectSingle = vi.fn().mockResolvedValue({ data: invalidCaseRow, error: null });
    const selectEq = vi.fn(() => ({ single: selectSingle }));
    const selectFn = vi.fn(() => ({ eq: selectEq }));
    supabase.from = vi.fn(() => ({ select: selectFn, update: vi.fn() }));

    mockModules({ supabase });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("資料庫非 404 錯誤返回 500", async () => {
    mockModules({
      supabase: createSupabaseMock({
        caseResult: { data: null, error: { code: "PGRST500", message: "Database connection failed" } },
      }),
    });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

  it("更新後資料驗證失敗返回 500", async () => {
    // 模擬更新成功但返回不完整資料
    const invalidUpdatedRow = {
      id: baseCaseId,
      // 缺少其他必要欄位
    };

    const supabase = createSupabaseMock();
    const selectSingle = vi.fn().mockResolvedValue({ data: baseCaseRow, error: null });
    const updateSingle = vi.fn().mockResolvedValue({ data: invalidUpdatedRow, error: null });
    const selectEq = vi.fn(() => ({ single: selectSingle }));
    const selectFn = vi.fn(() => ({ eq: selectEq }));
    const updateSelectFn = vi.fn(() => ({ single: updateSingle }));
    const updateIn = vi.fn(() => ({ select: updateSelectFn }));
    const updateEq = vi.fn(() => ({ in: updateIn }));
    const updateFn = vi.fn(() => ({ eq: updateEq }));
    supabase.from = vi.fn(() => ({ select: selectFn, update: updateFn }));

    mockModules({ supabase });
    const { default: handler } = await import("../close");

    const req = {
      method: "POST",
      headers: { authorization: "Bearer x" },
      body: { caseId: baseCaseId, reason: "closed_inactive" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(500);
  });

});
