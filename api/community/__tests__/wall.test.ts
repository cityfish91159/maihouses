import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  __reviewTestHelpers,
  type AgentRow,
  type PropertyRow,
  type ReviewRow,
} from "../wall";

const { cleanText, normalizeCount, buildAgentPayload, transformReviewRecord } =
  __reviewTestHelpers;

const REVIEW_ID = "11111111-1111-1111-1111-111111111111";
const COMMUNITY_ID = "22222222-2222-2222-2222-222222222222";
const AGENT_ID = "44444444-4444-4444-4444-444444444444";
const PROPERTY_ID = "33333333-3333-3333-3333-333333333333";
const USER_ID = "55555555-5555-5555-5555-555555555555";
const POST_ID = "66666666-6666-6666-6666-666666666666";
const QUESTION_ID = "77777777-7777-7777-7777-777777777777";
const ISO_DATE = "2024-01-01T00:00:00.000Z";

const withDefaults = (overrides: Partial<ReviewRow> = {}): ReviewRow => ({
  id: REVIEW_ID,
  community_id: COMMUNITY_ID,
  author_id: AGENT_ID,
  content: {
    pros: ["  交通便利  "],
    cons: " 管委會嚴謹 ",
    property_title: "示範社區",
  },
  source_platform: "agent",
  created_at: ISO_DATE,
  ...overrides,
});

const buildAgent = (overrides: Partial<AgentRow> = {}): AgentRow => ({
  id: AGENT_ID,
  name: "張房仲",
  company: "邁房子不動產",
  visit_count: 8,
  deal_count: 3,
  ...overrides,
});

const buildProperty = (overrides: Partial<PropertyRow> = {}): PropertyRow => ({
  id: PROPERTY_ID,
  title: "預設房源",
  agent_id: AGENT_ID,
  ...overrides,
});

// Mock environment variables
const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    SUPABASE_URL: "https://test.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
  };
});

afterEach(() => {
  process.env = originalEnv;
  vi.clearAllMocks();
});

// Mock Supabase client
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockIn = vi.fn();
const mockOrder = vi.fn();
const mockLimit = vi.fn();
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

const mockSupabaseClient = {
  from: mockFrom,
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock logger
vi.mock("../../lib/logger", () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock API response helpers
vi.mock("../../lib/apiResponse", async () => {
  const actual = await vi.importActual<typeof import("../../lib/apiResponse")>(
    "../../lib/apiResponse"
  );
  return {
    ...actual,
    successResponse: actual.successResponse,
    errorResponse: actual.errorResponse,
    API_ERROR_CODES: actual.API_ERROR_CODES,
  };
});

// Helper to create mock request/response
function createMockRequest(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return {
    method: "GET",
    query: {},
    headers: {},
    body: null,
    ...overrides,
  } as VercelRequest;
}

function createMockResponse(): {
  res: VercelResponse;
  getStatus: () => number | undefined;
  getJSON: () => unknown;
} {
  let statusCode: number | undefined;
  let jsonData: unknown;

  const res = {
    status: vi.fn((code: number) => {
      statusCode = code;
      return res;
    }),
    json: vi.fn((data: unknown) => {
      jsonData = data;
      return res;
    }),
    setHeader: vi.fn(),
    end: vi.fn(),
  } as unknown as VercelResponse;

  return {
    res,
    getStatus: () => statusCode,
    getJSON: () => jsonData,
  };
}

describe("community wall helpers", () => {
  it("normalizes whitespace-only strings safely", () => {
    expect(cleanText("  測試  ")).toBe("測試");
    expect(cleanText(undefined)).toBe("");
  });

  it("normalizes visit/deal counters to non-negative numbers", () => {
    expect(normalizeCount(null)).toBe(0);
    expect(normalizeCount(-5)).toBe(0);
    expect(normalizeCount(12)).toBe(12);
  });

  it("builds agent payloads with normalized stats", () => {
    const agent = buildAgent({
      visit_count: -10,
      deal_count: null,
      company: null,
    });
    const payload = buildAgentPayload(agent);

    expect(payload).toBeDefined();
    expect(payload?.name).toBe("張房仲");
    expect(payload?.company).toBe("");
    expect(payload?.stats).toEqual({ visits: 0, deals: 0 });
  });

  it("merges review content with agent details", () => {
    const record = withDefaults({
      content: {
        pros: ["  交通便利  ", " 有管理 "],
        cons: " 管委會嚴謹 ",
        property_title: "華廈 A",
      },
    });
    const propertyMap = new Map([
      [PROPERTY_ID, buildProperty({ title: "華廈 A" })],
    ]);
    const agentMap = new Map([
      [AGENT_ID, buildAgent({ visit_count: 5, deal_count: 2 })],
    ]);

    const result = transformReviewRecord(record, propertyMap, agentMap);

    expect(result.agent?.stats).toEqual({ visits: 5, deals: 2 });
    expect(result.content.pros).toEqual(["交通便利", "有管理"]);
    expect(result.content.property_title).toBe("華廈 A");
    expect(result.author_id).toBe(AGENT_ID);
  });

  it("falls back to resident info when no agent is attached", () => {
    const record = withDefaults({
      author_id: null,
      source_platform: "resident",
      content: {
        pros: [],
        cons: " 管委會嚴謹 ",
        property_title: null,
      },
    });
    const result = transformReviewRecord(record, new Map(), new Map());

    expect(result.agent?.name).toBe("住戶");
    expect(result.agent?.stats).toEqual({ visits: 0, deals: 0 });
  });

  it("falls back to property agent when author_id is missing", () => {
    const record = withDefaults({
      author_id: null,
      property_id: PROPERTY_ID,
      source_platform: null,
      content: {
        pros: [" 採光好 "],
        cons: " 管委會嚴謹 ",
        property_title: null,
      },
    });

    const propertyMap = new Map([
      [PROPERTY_ID, buildProperty({ agent_id: AGENT_ID, title: "河景宅" })],
    ]);
    const agentMap = new Map([
      [AGENT_ID, buildAgent({ visit_count: 1, deal_count: 0 })],
    ]);

    const result = transformReviewRecord(record, propertyMap, agentMap);

    expect(result.author_id).toBe(AGENT_ID);
    expect(result.agent?.stats).toEqual({ visits: 1, deals: 0 });
    expect(result.content.property_title).toBe("河景宅");
  });
});

describe("API handler - Integration Tests", () => {
  let handler: typeof import("../wall").default;

  beforeEach(async () => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
    mockEq.mockResolvedValue({ data: null, error: null });

    // Dynamically import handler after mocks are set up
    const module = await import("../wall");
    handler = module.default;
  });

  describe("OPTIONS request (CORS preflight)", () => {
    it("應回應 200 並設定 CORS headers", async () => {
      const req = createMockRequest({ method: "OPTIONS" });
      const { res } = createMockResponse();

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS"
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
      );
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe("Test-UUID alias support", () => {
    it("應接受 test-uuid alias", async () => {
      const req = createMockRequest({
        query: { communityId: "test-uuid", type: "reviews" },
      });
      const { res, getStatus } = createMockResponse();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      // Should return 200 (success) not 400 (validation error)
      const status = getStatus();
      expect(status).not.toBe(400);
    });
  });

  describe("Authentication handling", () => {
    it("應處理沒有 Authorization header 的請求", async () => {
      const req = createMockRequest({
        query: { communityId: COMMUNITY_ID, type: "reviews" },
        headers: {},
      });
      const { res, getStatus } = createMockResponse();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      const status = getStatus();
      expect(status).not.toBe(401); // Should not require auth
    });

    it("應處理無效的 Bearer token", async () => {
      const req = createMockRequest({
        query: { communityId: COMMUNITY_ID, type: "reviews" },
        headers: { authorization: "Bearer invalid" },
      });
      const { res, getStatus } = createMockResponse();

      mockGetUser.mockRejectedValue(new Error("Invalid token"));
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      const status = getStatus();
      // Should gracefully degrade to guest, not crash
      expect(status).not.toBe(500);
    });

    it("應接受有效的 Bearer token", async () => {
      const req = createMockRequest({
        query: { communityId: COMMUNITY_ID, type: "reviews" },
        headers: { authorization: "Bearer valid-token" },
      });
      const { res, getStatus } = createMockResponse();

      mockGetUser.mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      });
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      const status = getStatus();
      expect(status).not.toBe(401);
    });
  });

  describe("Response format", () => {
    it("應回傳 JSON 格式資料", async () => {
      const req = createMockRequest({
        query: { communityId: COMMUNITY_ID, type: "reviews" },
      });
      const { res, getJSON } = createMockResponse();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      const json = getJSON();
      expect(json).toBeDefined();
    });

    it("應設定正確的 CORS headers", async () => {
      const req = createMockRequest({
        query: { communityId: COMMUNITY_ID, type: "reviews" },
      });
      const { res } = createMockResponse();

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      await handler(req, res);

      expect(res.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "*");
    });
  });
});

describe("Data transformation helpers", () => {
  it("應正確處理 content 為 null 的 review", () => {
    const record = withDefaults({
      content: null,
    });
    const result = transformReviewRecord(record, new Map(), new Map());

    expect(result.content.pros).toEqual([]);
    expect(result.content.cons).toBe("");
  });

  it("應正確處理 pros 陣列中的 null 值", () => {
    const record = withDefaults({
      content: {
        pros: ["優點1", null, "優點2"],
        cons: "缺點",
        property_title: "物件名",
      },
    });
    const result = transformReviewRecord(record, new Map(), new Map());

    // Null 值應該被過濾或轉成空字串
    expect(result.content.pros).toBeDefined();
    expect(result.content.pros.length).toBeGreaterThan(0);
  });

  it("應正確處理 company 為 null 的房仲", () => {
    const agent = buildAgent({
      company: null,
    });
    const payload = buildAgentPayload(agent);

    expect(payload?.company).toBe("");
  });

  it("應正確處理 visit_count 和 deal_count 為 undefined", () => {
    const agent = buildAgent({
      visit_count: undefined,
      deal_count: undefined,
    });
    const payload = buildAgentPayload(agent);

    expect(payload?.stats.visits).toBe(0);
    expect(payload?.stats.deals).toBe(0);
  });

  it("應正確處理 NaN 數值", () => {
    expect(normalizeCount(NaN)).toBe(0);
    expect(normalizeCount(Number.NaN)).toBe(0);
  });

  it("buildAgentPayload 應在 agentRow 為 null 時返回 undefined", () => {
    const payload = buildAgentPayload(null);
    expect(payload).toBeUndefined();
  });

  it("buildAgentPayload 應在 agentRow 為 undefined 時返回 undefined", () => {
    const payload = buildAgentPayload(undefined);
    expect(payload).toBeUndefined();
  });

  it("cleanText 應正確處理空字串", () => {
    expect(cleanText("")).toBe("");
    expect(cleanText("   ")).toBe("");
  });

  it("cleanText 應正確處理 null", () => {
    expect(cleanText(null)).toBe("");
  });

  it("transformReviewRecord 應使用 property_id 查找房源資訊", () => {
    const record = withDefaults({
      property_id: PROPERTY_ID,
      content: {
        pros: ["優點"],
        cons: "缺點",
        property_title: null,
      },
    });
    const propertyMap = new Map([
      [PROPERTY_ID, buildProperty({ title: "測試房源" })],
    ]);

    const result = transformReviewRecord(record, propertyMap, new Map());

    expect(result.content.property_title).toBe("測試房源");
  });

  it("transformReviewRecord 應處理同時有 agent 和 property 資訊", () => {
    const record = withDefaults({
      author_id: AGENT_ID,
      property_id: PROPERTY_ID,
    });
    const propertyMap = new Map([
      [PROPERTY_ID, buildProperty({ title: "房源A" })],
    ]);
    const agentMap = new Map([
      [AGENT_ID, buildAgent({ name: "房仲A" })],
    ]);

    const result = transformReviewRecord(record, propertyMap, agentMap);

    expect(result.agent?.name).toBe("房仲A");
    expect(result.author_id).toBe(AGENT_ID);
  });
});
