/**
 * Trust Upgrade Case API - 單元測試
 *
 * 測試案例：
 * 1. 成功升級案件
 * 2. Token 格式錯誤
 * 3. 必填欄位缺失
 * 4. Token 無效
 * 5. Token 已過期
 * 6. 案件已綁定其他用戶
 * 7. 重複綁定同一用戶
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handler from "../upgrade-case";

// Mock dependencies
vi.mock("../_utils", () => ({
  cors: vi.fn(),
  supabase: {
    rpc: vi.fn(),
  },
  logAudit: vi.fn(),
  getClientIp: vi.fn(() => "127.0.0.1"),
  getUserAgent: vi.fn(() => "test-agent"),
}));

vi.mock("../../lib/apiResponse", () => ({
  successResponse: (data: unknown) => ({ success: true, data }),
  errorResponse: (code: string, message: string, details?: unknown) => ({
    success: false,
    error: { code, message, details },
  }),
  API_ERROR_CODES: {
    METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
    INVALID_INPUT: "INVALID_INPUT",
    DATA_FETCH_FAILED: "DATA_FETCH_FAILED",
    INTERNAL_ERROR: "INTERNAL_ERROR",
  },
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("POST /api/trust/upgrade-case", () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      method: "POST",
      headers: {},
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    };
  });

  it("應該拒絕非 POST 請求", async () => {
    mockReq.method = "GET";

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(405);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "METHOD_NOT_ALLOWED",
        }),
      })
    );
  });

  it("應該拒絕 Token 格式錯誤", async () => {
    mockReq.body = {
      token: "invalid-token",
      userId: "user-123",
      userName: "陳小明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_INPUT",
          message: "請求參數格式錯誤",
        }),
      })
    );
  });

  it("應該拒絕缺少必填欄位", async () => {
    mockReq.body = {
      token: "550e8400-e29b-41d4-a716-446655440000",
      // 缺少 userId 和 userName
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_INPUT",
        }),
      })
    );
  });

  it("應該成功升級案件", async () => {
    const { supabase } = await import("../_utils");
    const { logAudit } = await import("../_utils");

    const mockToken = "550e8400-e29b-41d4-a716-446655440000";
    const mockCaseId = "660e8400-e29b-41d4-a716-446655440001";

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: mockCaseId,
      },
      error: null,
    } as never);

    mockReq.body = {
      token: mockToken,
      userId: "user-123",
      userName: "陳小明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(supabase.rpc).toHaveBeenCalledWith("fn_upgrade_trust_case", {
      p_token: mockToken,
      p_user_id: "user-123",
      p_user_name: "陳小明",
    });

    expect(logAudit).toHaveBeenCalledWith(
      mockCaseId,
      "UPGRADE_TRUST_CASE",
      expect.objectContaining({
        id: "user-123",
        role: "buyer",
      })
    );

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          case_id: mockCaseId,
        }),
      })
    );
  });

  it("應該處理 Token 無效錯誤", async () => {
    const { supabase } = await import("../_utils");

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: false,
        error: "Token 無效、已過期或已撤銷",
      },
      error: null,
    } as never);

    mockReq.body = {
      token: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-123",
      userName: "陳小明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "INVALID_INPUT",
          message: "Token 無效、已過期或已撤銷",
        }),
      })
    );
  });

  it("應該處理案件已綁定其他用戶錯誤", async () => {
    const { supabase } = await import("../_utils");

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: false,
        error: "此案件已綁定其他用戶，無法重複綁定",
      },
      error: null,
    } as never);

    mockReq.body = {
      token: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-456",
      userName: "王大明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          message: "此案件已綁定其他用戶，無法重複綁定",
        }),
      })
    );
  });

  it("應該處理重複綁定同一用戶（冪等性）", async () => {
    const { supabase } = await import("../_utils");
    const { logAudit } = await import("../_utils");

    const mockToken = "550e8400-e29b-41d4-a716-446655440000";
    const mockCaseId = "660e8400-e29b-41d4-a716-446655440001";

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: {
        success: true,
        case_id: mockCaseId,
        message: "案件已綁定至此用戶（重複操作）",
      },
      error: null,
    } as never);

    mockReq.body = {
      token: mockToken,
      userId: "user-123",
      userName: "陳小明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(logAudit).toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("應該處理 RPC 錯誤", async () => {
    const { supabase } = await import("../_utils");

    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: "Database error" },
    } as never);

    mockReq.body = {
      token: "550e8400-e29b-41d4-a716-446655440000",
      userId: "user-123",
      userName: "陳小明",
    };

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({
          code: "DATA_FETCH_FAILED",
        }),
      })
    );
  });

  it("應該處理 OPTIONS 請求（CORS preflight）", async () => {
    mockReq.method = "OPTIONS";

    await handler(mockReq as VercelRequest, mockRes as VercelResponse);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.end).toHaveBeenCalled();
  });
});
