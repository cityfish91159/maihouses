import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

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

describe("BE-5 Real Handler Tests", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("GET /api/trust/cases - unauthorized returns 401", async () => {
    vi.doMock("../_utils", () => ({
      supabase: { rpc: vi.fn() },
      verifyToken: vi.fn(() => {
        throw new Error("Unauthorized");
      }),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases");

    const req = { method: "GET", headers: {}, query: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(401);
  });

  it("GET /api/trust/cases - buyer role returns 403", async () => {
    vi.doMock("../_utils", () => ({
      supabase: { rpc: vi.fn() },
      verifyToken: vi.fn(() => ({ id: "buyer-1", role: "buyer", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases");

    const req = { method: "GET", headers: { authorization: "Bearer x" }, query: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("GET /api/trust/cases - success returns 200", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: { cases: [], total: 0, limit: 50, offset: 0 },
      error: null,
    });

    vi.doMock("../_utils", () => ({
      supabase: { rpc: mockRpc },
      verifyToken: vi.fn(() => ({ id: "agent-1", role: "agent", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases");

    const req = {
      method: "GET",
      headers: { authorization: "Bearer x" },
      query: { limit: "50", offset: "0" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("GET /api/trust/cases/[id] - accepts step=0 event", { timeout: 10000 }, async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        buyer_session_id: null,
        buyer_name: "Buyer",
        buyer_contact: null,
        property_id: null,
        property_title: "Property",
        transaction_id: null,
        current_step: 1,
        status: "active",
        offer_price: null,
        created_at: "2026-01-22T00:00:00Z",
        updated_at: "2026-01-22T00:00:00Z",
        events: [
          {
            id: "11111111-1111-4111-8111-111111111111",
            step: 0,
            step_name: "系統通知",
            action: "通知失敗",
            actor: "system",
            event_hash: null,
            detail: null,
            created_at: "2026-01-22T00:00:00Z",
          },
        ],
      },
      error: null,
    });

    vi.doMock("../_utils", () => ({
      supabase: { rpc: mockRpc },
      verifyToken: vi.fn(() => ({ id: "agent-1", role: "agent", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    const logError = vi.fn();
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: logError } }));

    const { default: handler } = await import("../cases/[id]");

    const req = {
      method: "GET",
      headers: { authorization: "Bearer x" },
      query: { id: "550e8400-e29b-41d4-a716-446655440000" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(logError).not.toHaveBeenCalled();
  });

  it("GET /api/trust/cases/[id] - buyer role returns 403", async () => {
    vi.doMock("../_utils", () => ({
      supabase: { rpc: vi.fn() },
      verifyToken: vi.fn(() => ({ id: "buyer-1", role: "buyer", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases/[id]");

    const req = {
      method: "GET",
      headers: { authorization: "Bearer x" },
      query: { id: "550e8400-e29b-41d4-a716-446655440000" },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(403);
  });

  it("PATCH /api/trust/cases/[id] - sync throw in notification does not break response", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: {
        success: true,
        case_id: "550e8400-e29b-41d4-a716-446655440000",
        old_step: 1,
        new_step: 2,
        property_title: "Property",
        event_hash: "abc12345...def2",
      },
      error: null,
    });

    vi.doMock("../send-notification", () => ({
      sendStepUpdateNotification: vi.fn(() => {
        throw new Error("sync throw");
      }),
    }));
    vi.doMock("../_utils", () => ({
      supabase: { rpc: mockRpc },
      verifyToken: vi.fn(() => ({ id: "agent-1", role: "agent", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases/[id]");

    const req = {
      method: "PATCH",
      headers: { authorization: "Bearer x" },
      query: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: {
        new_step: 2,
        action: "進度更新",
        actor: "agent",
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("PATCH /api/trust/cases/[id] - race condition returns 400", async () => {
    const mockRpc = vi.fn().mockResolvedValue({
      data: { success: false, error: "Update failed: case may have been modified by another request" },
      error: null,
    });

    vi.doMock("../send-notification", () => ({
      sendStepUpdateNotification: vi.fn().mockResolvedValue({ success: true }),
    }));
    vi.doMock("../_utils", () => ({
      supabase: { rpc: mockRpc },
      verifyToken: vi.fn(() => ({ id: "agent-1", role: "agent", txId: "tx" })),
      cors: vi.fn(),
      logAudit: vi.fn(),
    }));
    vi.doMock("../../lib/logger", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

    const { default: handler } = await import("../cases/[id]");

    const req = {
      method: "PATCH",
      headers: { authorization: "Bearer x" },
      query: { id: "550e8400-e29b-41d4-a716-446655440000" },
      body: {
        new_step: 2,
        action: "進度更新",
        actor: "agent",
      },
    } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(400);
  });
});
