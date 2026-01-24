/**
 * case-query.ts 單元測試
 *
 * 測試純業務邏輯層：查詢用戶案件
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// 3.6-3.8: 使用共用常數（集中管理測試資料）
import {
  TEST_LINE_USER_ID,
  TEST_LINE_USER_ID_UPPER,
  TEST_CASE_ID,
  TEST_CASE_ID_2,
  TEST_AGENT_ID,
  TEST_USER_ID,
  TEST_USER_ID_2,
} from "../../../line/constants/my-cases";

// ============================================================================
// Test Data - 使用共用常數
// ============================================================================

const validLineUserId = TEST_LINE_USER_ID;
const validCaseId = TEST_CASE_ID;
const validAgentId = TEST_AGENT_ID;

const baseCaseRow = {
  id: validCaseId,
  property_title: "信義區三房",
  current_step: 3,
  status: "active",
  agent_id: validAgentId,
  updated_at: "2026-01-24T10:00:00.000Z",
};

const baseAgentRow = {
  id: validAgentId,
  name: "王小明",
};

// ============================================================================
// Mock Setup
// ============================================================================

interface MockOptions {
  casesResult?: { data: unknown[] | null; error: { message: string; code?: string } | null };
  agentsResult?: { data: unknown[] | null; error: { message: string; code?: string } | null };
}

function mockModules(options: MockOptions = {}) {
  const casesResult = options.casesResult ?? { data: [baseCaseRow], error: null };
  const agentsResult = options.agentsResult ?? { data: [baseAgentRow], error: null };

  const casesOrder = vi.fn().mockResolvedValue(casesResult);
  const casesIn = vi.fn(() => ({ order: casesOrder }));
  const casesEq = vi.fn(() => ({ in: casesIn }));
  const casesSelect = vi.fn(() => ({ eq: casesEq }));

  const agentsIn = vi.fn().mockResolvedValue(agentsResult);
  const agentsSelect = vi.fn(() => ({ in: agentsIn }));

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "trust_cases") return { select: casesSelect };
      if (table === "agents") return { select: agentsSelect };
      return { select: vi.fn() };
    }),
  };

  vi.doMock("../../_utils", () => ({
    supabase,
  }));

  vi.doMock("../../../lib/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));

  return { supabase, casesSelect, casesEq, casesIn, casesOrder, agentsSelect, agentsIn };
}

// ============================================================================
// Tests
// ============================================================================

describe("queryMyCases", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("有效的 LINE ID 回傳案件列表", async () => {
    mockModules();
    const { queryMyCases } = await import("../case-query");

    const result = await queryMyCases(validLineUserId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cases).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.cases[0]).toEqual({
        id: validCaseId,
        propertyTitle: "信義區三房",
        agentName: "王小明",
        currentStep: 3,
        status: "active",
        updatedAt: "2026-01-24T10:00:00.000Z",
      });
    }
  });

  it("無效的 LINE ID 格式回傳錯誤", async () => {
    mockModules();
    const { queryMyCases } = await import("../case-query");

    const result = await queryMyCases("invalid-line-id");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_LINE_ID");
    }
  });

  it("無案件時回傳空陣列", async () => {
    mockModules({ casesResult: { data: [], error: null } });
    const { queryMyCases } = await import("../case-query");

    const result = await queryMyCases(validLineUserId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cases).toHaveLength(0);
      expect(result.data.total).toBe(0);
    }
  });

  it("DB 錯誤回傳失敗", async () => {
    mockModules({ casesResult: { data: null, error: { message: "DB error", code: "500" } } });
    const { queryMyCases } = await import("../case-query");

    const result = await queryMyCases(validLineUserId);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("DB_ERROR");
    }
  });

  it("agents 查詢失敗時仍回傳案件（agentName 為「未知房仲」）", async () => {
    mockModules({
      agentsResult: { data: null, error: { message: "Agents error" } },
    });
    const { queryMyCases } = await import("../case-query");

    const result = await queryMyCases(validLineUserId);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cases[0]?.agentName).toBe("未知房仲");
    }
  });

  it("大寫 hex 的 LINE ID 也能正確處理", async () => {
    mockModules();
    const { queryMyCases } = await import("../case-query");

    // 使用共用常數
    const result = await queryMyCases(TEST_LINE_USER_ID_UPPER);

    expect(result.success).toBe(true);
  });
});

describe("getStepName", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("回傳正確的步驟名稱", async () => {
    mockModules();
    const { getStepName } = await import("../case-query");

    expect(getStepName(1)).toBe("M1 接洽");
    expect(getStepName(2)).toBe("M2 帶看");
    expect(getStepName(3)).toBe("M3 出價");
    expect(getStepName(4)).toBe("M4 斡旋");
    expect(getStepName(5)).toBe("M5 成交");
    expect(getStepName(6)).toBe("M6 交屋");
  });

  it("無效步驟回傳預設格式", async () => {
    mockModules();
    const { getStepName } = await import("../case-query");

    expect(getStepName(0)).toBe("步驟 0");
    expect(getStepName(7)).toBe("步驟 7");
    expect(getStepName(99)).toBe("步驟 99");
  });
});

describe("generateTrustRoomUrl", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("生成正確的 Trust Room URL", async () => {
    mockModules();
    const { generateTrustRoomUrl } = await import("../case-query");

    const url = generateTrustRoomUrl(validCaseId);

    expect(url).toContain("/maihouses/#/trust-room/");
    expect(url).toContain(validCaseId);
  });
});

// ============================================================================
// 9.5 / 9.6 / 9.13 - OR 查詢、去重、排序測試
// ============================================================================

/**
 * 建立 OR 查詢專用 Mock
 *
 * 使用參數檢查而非 callCount 來區分查詢（修復 Director 指出的 #1 問題）
 */
interface OrQueryMockOptions {
  userIdResult: { data: unknown[] | null; error: { message: string; code?: string } | null };
  lineIdResult: { data: unknown[] | null; error: { message: string; code?: string } | null };
  agentsResult?: { data: unknown[] | null; error: { message: string; code?: string } | null };
}

function mockOrQueryModules(options: OrQueryMockOptions) {
  const agentsResult = options.agentsResult ?? { data: [baseAgentRow], error: null };

  // 使用 mockImplementation 檢查實際參數，而非 callCount
  const casesIn = vi.fn().mockImplementation(() => {
    // OR 查詢不使用 order，直接返回結果
    // 根據前一個 eq 呼叫的參數決定返回值
    return Promise.resolve(options.userIdResult);
  });

  // 關鍵修復：根據 eq 的第一個參數區分是 buyer_user_id 還是 buyer_line_id
  const casesEq = vi.fn().mockImplementation((field: string) => {
    return {
      in: vi.fn().mockImplementation(() => {
        if (field === "buyer_user_id") {
          return Promise.resolve(options.userIdResult);
        } else if (field === "buyer_line_id") {
          return Promise.resolve(options.lineIdResult);
        }
        return Promise.resolve({ data: [], error: null });
      }),
    };
  });

  const casesSelect = vi.fn(() => ({ eq: casesEq }));

  const agentsIn = vi.fn().mockResolvedValue(agentsResult);
  const agentsSelect = vi.fn(() => ({ in: agentsIn }));

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === "trust_cases") return { select: casesSelect };
      if (table === "agents") return { select: agentsSelect };
      return { select: vi.fn() };
    }),
  };

  vi.doMock("../../_utils", () => ({ supabase }));
  vi.doMock("../../../lib/logger", () => ({
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  }));

  return { supabase, casesEq };
}

describe("queryCasesByIdentity (統一入口)", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  const validUserId = "11111111-1111-4111-8111-111111111111";

  // 9.5: JWT + LINE 綁定 (OR 查詢)
  it("同時提供 userId 和 lineUserId 時執行 OR 查詢", async () => {
    const caseFromUserId = {
      id: validCaseId,
      property_title: "信義區三房",
      current_step: 3,
      status: "active",
      agent_id: validAgentId,
      updated_at: "2026-01-24T10:00:00.000Z",
    };
    const caseFromLineId = {
      id: "22222222-2222-4222-8222-222222222222",
      property_title: "大安區兩房",
      current_step: 2,
      status: "active",
      agent_id: validAgentId,
      updated_at: "2026-01-23T10:00:00.000Z",
    };

    const { casesEq } = mockOrQueryModules({
      userIdResult: { data: [caseFromUserId], error: null },
      lineIdResult: { data: [caseFromLineId], error: null },
    });

    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: validUserId,
      lineUserId: validLineUserId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cases.length).toBe(2);
    }
    // 驗證 eq 被呼叫時使用正確的欄位名稱
    expect(casesEq).toHaveBeenCalledWith("buyer_user_id", validUserId);
    expect(casesEq).toHaveBeenCalledWith("buyer_line_id", validLineUserId);
  });

  // 9.6: 去重驗證
  it("OR 查詢時同一案件不重複顯示", async () => {
    const duplicateCase = {
      id: validCaseId,
      property_title: "信義區三房",
      current_step: 3,
      status: "active",
      agent_id: validAgentId,
      updated_at: "2026-01-24T10:00:00.000Z",
    };

    // 兩個查詢都回傳同一個案件（模擬 buyer_user_id 和 buyer_line_id 指向同一案件）
    mockOrQueryModules({
      userIdResult: { data: [duplicateCase], error: null },
      lineIdResult: { data: [duplicateCase], error: null },
    });

    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: validUserId,
      lineUserId: validLineUserId,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cases).toHaveLength(1);
      expect(result.data.total).toBe(1);
    }
  });

  // 9.13: 排序正確性
  it("結果按 updated_at DESC 排序", async () => {
    const olderCase = {
      id: validCaseId,
      property_title: "舊案件",
      current_step: 1,
      status: "active",
      agent_id: validAgentId,
      updated_at: "2026-01-20T10:00:00.000Z",
    };
    const newerCase = {
      id: "22222222-2222-4222-8222-222222222222",
      property_title: "新案件",
      current_step: 2,
      status: "active",
      agent_id: validAgentId,
      updated_at: "2026-01-24T10:00:00.000Z",
    };

    // 刻意以錯誤順序回傳
    const casesOrder = vi.fn().mockResolvedValue({ data: [olderCase, newerCase], error: null });
    const casesIn = vi.fn(() => ({ order: casesOrder }));
    const casesEq = vi.fn(() => ({ in: casesIn }));
    const casesSelect = vi.fn(() => ({ eq: casesEq }));

    const agentsIn = vi.fn().mockResolvedValue({ data: [baseAgentRow], error: null });
    const agentsSelect = vi.fn(() => ({ in: agentsIn }));

    vi.doMock("../../_utils", () => ({
      supabase: {
        from: vi.fn((table: string) => {
          if (table === "trust_cases") return { select: casesSelect };
          if (table === "agents") return { select: agentsSelect };
          return { select: vi.fn() };
        }),
      },
    }));
    vi.doMock("../../../lib/logger", () => ({
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    }));

    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({ lineUserId: validLineUserId });

    expect(result.success).toBe(true);
    if (result.success && result.data.cases.length === 2) {
      expect(result.data.cases[0]?.propertyTitle).toBe("新案件");
      expect(result.data.cases[1]?.propertyTitle).toBe("舊案件");
    }
  });

  it("只提供 userId 時使用 userId 查詢", async () => {
    mockModules();
    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({ userId: validUserId });

    expect(result.success).toBe(true);
  });

  it("缺少識別參數時回傳驗證錯誤", async () => {
    mockModules();
    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("VALIDATION_ERROR");
    }
  });

  // ========================================================================
  // Director 指出的 #5：缺失的邊界測試
  // ========================================================================

  it("OR 查詢：userId 查詢失敗但 lineUserId 成功時回傳 DB_ERROR", async () => {
    mockOrQueryModules({
      userIdResult: { data: null, error: { message: "DB error", code: "500" } },
      lineIdResult: { data: [baseCaseRow], error: null },
    });

    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: validUserId,
      lineUserId: validLineUserId,
    });

    // 任一查詢失敗應回傳 DB_ERROR
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("DB_ERROR");
    }
  });

  it("OR 查詢：lineUserId 查詢失敗但 userId 成功時回傳 DB_ERROR", async () => {
    mockOrQueryModules({
      userIdResult: { data: [baseCaseRow], error: null },
      lineIdResult: { data: null, error: { message: "DB error", code: "500" } },
    });

    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: validUserId,
      lineUserId: validLineUserId,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("DB_ERROR");
    }
  });

  it("同時提供 userId 和無效 lineUserId 時回傳 INVALID_LINE_ID", async () => {
    mockModules();
    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: validUserId,
      lineUserId: "invalid-line-id", // 無效格式
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_LINE_ID");
    }
  });

  it("同時提供無效 userId 和有效 lineUserId 時回傳 INVALID_USER_ID", async () => {
    mockModules();
    const { queryCasesByIdentity } = await import("../case-query");

    const result = await queryCasesByIdentity({
      userId: "not-a-uuid", // 無效格式
      lineUserId: validLineUserId,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe("INVALID_USER_ID");
    }
  });

  it("大小寫混合的 LINE ID 也能正確處理", async () => {
    mockModules();
    const { queryCasesByIdentity } = await import("../case-query");

    // 混合大小寫：UaBcDeF...
    const mixedCaseLineId = "UaBcDeF1234567890aBcDeF1234567890";

    const result = await queryCasesByIdentity({ lineUserId: mixedCaseLineId });

    expect(result.success).toBe(true);
  });
});
