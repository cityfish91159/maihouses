/**
 * BE-6 | 消費者案件列表 API 測試
 *
 * 測試 HTTP Handler 層（雙認證模式 + 回應格式）
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// 使用共用常數（集中管理測試資料）
import {
  TEST_LINE_USER_ID,
  TEST_LINE_USER_ID_UPPER,
  TEST_CASE_ID,
  TEST_USER_ID,
  TEST_USER_ID_2,
} from "../../line/constants/my-cases";

// ============================================================================
// Test Data（統一使用共用常數）
// ============================================================================

const validLineUserId = TEST_LINE_USER_ID;
const validCaseId = TEST_CASE_ID;
const validUserId = TEST_USER_ID;

const sampleCases = [
  {
    id: validCaseId,
    propertyTitle: "信義區三房",
    agentName: "王小明",
    currentStep: 3,
    status: "active" as const,
    updatedAt: "2026-01-24T10:00:00.000Z",
  },
];

// ============================================================================
// Mock Helpers
// ============================================================================

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

interface MockOptions {
  /** 用於 lineUserId 查詢的結果 */
  lineQueryResult?: {
    success: boolean;
    data?: { cases: typeof sampleCases; total: number };
    error?: string;
    code?: string;
  };
  /** 用於 userId (JWT) 查詢的結果 */
  userQueryResult?: {
    success: boolean;
    data?: { cases: typeof sampleCases; total: number };
    error?: string;
    code?: string;
  };
  systemKey?: string;
  authResult?: { success: boolean; userId?: string; error?: string; statusCode?: number };
}

function mockModules(options: MockOptions = {}) {
  const lineQueryResult = options.lineQueryResult ?? {
    success: true,
    data: { cases: sampleCases, total: 1 },
  };

  const userQueryResult = options.userQueryResult ?? {
    success: true,
    data: { cases: sampleCases, total: 1 },
  };

  const authResult = options.authResult ?? {
    success: false,
    error: "No auth header",
    statusCode: 401,
  };

  // 統一入口函數的 mock：根據參數決定回傳哪個結果
  const queryCasesByIdentityMock = vi.fn().mockImplementation(
    (params: { userId?: string; lineUserId?: string }) => {
      if (params.userId) {
        return Promise.resolve(userQueryResult);
      }
      if (params.lineUserId) {
        return Promise.resolve(lineQueryResult);
      }
      return Promise.resolve({
        success: false,
        error: "需要提供 userId 或 lineUserId",
        code: "VALIDATION_ERROR",
      });
    }
  );

  vi.doMock("../_utils", () => ({
    SYSTEM_API_KEY: options.systemKey ?? "valid-system-key",
  }));

  vi.doMock("../../lib/cors", () => ({
    cors: vi.fn(),
  }));

  vi.doMock("../../lib/logger", () => ({
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  }));

  vi.doMock("../../lib/auth", () => ({
    verifyAuth: vi.fn().mockResolvedValue(authResult),
  }));

  vi.doMock("../services/case-query", () => ({
    queryCasesByIdentity: queryCasesByIdentityMock,
    getStepName: vi.fn().mockImplementation((step: number) => `M${step} 步驟`),
    generateTrustRoomUrl: vi.fn().mockImplementation((id: string) => `https://maihouses.vercel.app/maihouses/#/trust-room/${id}`),
  }));

  return { lineQueryResult, userQueryResult, authResult, queryCasesByIdentityMock };
}

// ============================================================================
// Tests - HTTP 基本行為
// ============================================================================

describe("BE-6 trust/my-cases handler", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("OPTIONS 回傳 200", async () => {
    mockModules();
    const { default: handler } = await import("../my-cases");
    const req = { method: "OPTIONS", headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(200);
  });

  it("POST 回傳 405", async () => {
    mockModules();
    const { default: handler } = await import("../my-cases");
    const req = { method: "POST", headers: {} } as unknown as VercelRequest;
    const res = createMockRes();

    await handler(req, res);
    expect(res.statusCode).toBe(405);
  });

  // ============================================================================
  // Tests - system-key 認證（LINE webhook 用）
  // ============================================================================

  describe("system-key 認證模式", () => {
    it("無 x-system-key 且無 JWT 回傳 401", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: {},
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(401);
    });

    it("錯誤 x-system-key 回傳 401", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "wrong-key" },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(401);
    });

    it("缺少 lineUserId 參數回傳 400", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(400);
    });

    it("無效 LINE ID 格式回傳 400", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: "invalid-line-id" },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(400);
    });

    it("有案件的 LINE ID 回傳 200 + BE-6 規格結構", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      const body = res.body as { success: boolean; data: { cases: unknown[]; total: number } };
      expect(body.success).toBe(true);
      expect(body.data.cases).toHaveLength(1);
      expect(body.data.total).toBe(1);

      // 驗證回傳結構符合 BE-6 規格
      const firstCase = body.data.cases[0] as Record<string, unknown>;
      expect(firstCase.id).toBe(validCaseId);
      expect(firstCase.propertyTitle).toBe("信義區三房");
      expect(firstCase.agentName).toBe("王小明");
      expect(firstCase.currentStep).toBe(3);
      expect(firstCase.stepName).toBe("M3 步驟");
      expect(firstCase.status).toBe("active");
      expect(firstCase.trustRoomUrl).toContain(validCaseId);
      expect(firstCase.updatedAt).toBe("2026-01-24T10:00:00.000Z");

      // 驗證無多餘欄位（BE-6 規格移除了 caseName）
      const expectedKeys = ["id", "propertyTitle", "agentName", "currentStep", "stepName", "status", "trustRoomUrl", "updatedAt"];
      expect(Object.keys(firstCase).sort()).toEqual(expectedKeys.sort());
    });

    it("無案件的 LINE ID 回傳 200 + 空陣列", async () => {
      mockModules({ lineQueryResult: { success: true, data: { cases: [], total: 0 } } });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      const body = res.body as { success: boolean; data: { cases: unknown[]; total: number } };
      expect(body.success).toBe(true);
      expect(body.data.cases).toHaveLength(0);
      expect(body.data.total).toBe(0);
    });

    it("業務邏輯層錯誤回傳 500", async () => {
      mockModules({ lineQueryResult: { success: false, error: "DB error", code: "DB_ERROR" } });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(500);
    });

    it("業務邏輯層 LINE ID 錯誤回傳 400", async () => {
      mockModules({ lineQueryResult: { success: false, error: "LINE ID error", code: "INVALID_LINE_ID" } });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(400);
    });

    it("大寫 hex 的 LINE ID 也能正確處理", async () => {
      mockModules();
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { "x-system-key": "valid-system-key" },
        query: { lineUserId: TEST_LINE_USER_ID_UPPER },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);
    });
  });

  // ============================================================================
  // Tests - JWT 認證（消費者前端用）
  // ============================================================================

  describe("JWT 認證模式", () => {
    it("有效 JWT 回傳 200 + BE-6 規格結構", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      const body = res.body as { success: boolean; data: { cases: unknown[]; total: number } };
      expect(body.success).toBe(true);
      expect(body.data.cases).toHaveLength(1);
      expect(body.data.total).toBe(1);

      // 驗證回傳結構符合 BE-6 規格
      const firstCase = body.data.cases[0] as Record<string, unknown>;
      expect(firstCase.id).toBe(validCaseId);
      expect(firstCase.stepName).toBeDefined();
      expect(firstCase.trustRoomUrl).toBeDefined();
      expect(firstCase.updatedAt).toBeDefined();
    });

    it("JWT 無案件回傳 200 + 空陣列", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
        userQueryResult: { success: true, data: { cases: [], total: 0 } },
      });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      const body = res.body as { success: boolean; data: { cases: unknown[]; total: number } };
      expect(body.success).toBe(true);
      expect(body.data.cases).toHaveLength(0);
      expect(body.data.total).toBe(0);
    });

    it("JWT 業務邏輯層錯誤回傳 500", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
        userQueryResult: { success: false, error: "DB error", code: "DB_ERROR" },
      });
      const { default: handler } = await import("../my-cases");
      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(500);
    });

    it("JWT 認證成功時忽略 query 中的 userId 參數", async () => {
      const { queryCasesByIdentityMock } = mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");

      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: { userId: TEST_USER_ID_2 }, // 嘗試查詢其他人
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      // 確認使用的是 JWT 中的 userId，不是 query 參數
      expect(queryCasesByIdentityMock).toHaveBeenCalledWith({ userId: validUserId });
    });

    it("JWT 優先於 system-key", async () => {
      const { queryCasesByIdentityMock } = mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");

      const req = {
        method: "GET",
        headers: {
          authorization: "Bearer valid-token",
          "x-system-key": "valid-system-key",
        },
        query: { lineUserId: validLineUserId },
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);
      expect(res.statusCode).toBe(200);

      // 確認使用 JWT 認證路徑（userId）而非 system-key 路徑（lineUserId）
      expect(queryCasesByIdentityMock).toHaveBeenCalledWith({ userId: validUserId });
    });
  });

  // ============================================================================
  // Tests - Request ID 追蹤
  // ============================================================================

  describe("Request ID 追蹤", () => {
    it("每次請求都會生成 requestId 並記錄到日誌", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");
      const { logger } = await import("../../lib/logger");

      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);

      // 驗證 logger.info 被呼叫且包含 requestId
      expect(logger.info).toHaveBeenCalled();

      // 取得第一次呼叫的參數（Request received）
      const firstCall = vi.mocked(logger.info).mock.calls[0];
      expect(firstCall).toBeDefined();
      expect(firstCall[0]).toBe("[my-cases] Request received");
      expect(firstCall[1]).toHaveProperty("requestId");

      // 驗證 requestId 格式：req-{8字元}
      const requestId = (firstCall[1] as { requestId: string }).requestId;
      expect(requestId).toMatch(/^req-[a-f0-9]{8}$/);
    });

    it("同一請求的所有日誌都使用相同的 requestId", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");
      const { logger } = await import("../../lib/logger");

      const req = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res = createMockRes();

      await handler(req, res);

      // 取得所有 logger.info 呼叫
      const infoCalls = vi.mocked(logger.info).mock.calls;
      expect(infoCalls.length).toBeGreaterThanOrEqual(3); // Request, Auth, Response

      // 收集所有帶有 requestId 的呼叫
      const requestIds = infoCalls
        .filter((call) => call[1] && typeof call[1] === "object" && "requestId" in call[1])
        .map((call) => (call[1] as { requestId: string }).requestId);

      // 驗證所有 requestId 相同
      expect(requestIds.length).toBeGreaterThanOrEqual(3);
      const firstId = requestIds[0];
      for (const id of requestIds) {
        expect(id).toBe(firstId);
      }
    });

    it("不同請求使用不同的 requestId", async () => {
      mockModules({
        authResult: { success: true, userId: validUserId },
      });
      const { default: handler } = await import("../my-cases");
      const { logger } = await import("../../lib/logger");

      // 第一次請求
      const req1 = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res1 = createMockRes();
      await handler(req1, res1);

      const firstCallAfterReq1 = vi.mocked(logger.info).mock.calls[0];
      const requestId1 = (firstCallAfterReq1[1] as { requestId: string }).requestId;

      // 清除 mock 並重新設置
      vi.mocked(logger.info).mockClear();

      // 第二次請求
      const req2 = {
        method: "GET",
        headers: { authorization: "Bearer valid-token" },
        query: {},
      } as unknown as VercelRequest;
      const res2 = createMockRes();
      await handler(req2, res2);

      const firstCallAfterReq2 = vi.mocked(logger.info).mock.calls[0];
      const requestId2 = (firstCallAfterReq2[1] as { requestId: string }).requestId;

      // 驗證兩次請求的 requestId 不同
      expect(requestId1).not.toBe(requestId2);
    });
  });
});
