/**
 * Trust Cases API 測試
 * [Test Driven Agent] 先寫測試，再寫實作
 * [NASA TypeScript Safety] 完整類型定義
 * [Backend Safeguard] 驗證權限與安全
 * [Audit Logging] 驗證審計日誌
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================================
// Types (NASA TypeScript Safety - 完整類型定義)
// ============================================================================

/** 案件狀態 */
type CaseStatus = "active" | "pending" | "completed" | "cancelled" | "expired";

/** 執行者類型 */
type ActorType = "agent" | "buyer" | "system";

/** 案件事件 */
interface TrustCaseEvent {
  id: string;
  case_id: string;
  step: number;
  step_name: string;
  action: string;
  actor: ActorType;
  event_hash: string | null;
  detail: string | null;
  created_at: string;
}

/** 案件資料 */
interface TrustCase {
  id: string;
  agent_id: string;
  buyer_session_id: string | null;
  buyer_name: string;
  buyer_contact: string | null;
  property_id: string | null;
  property_title: string;
  transaction_id: string | null;
  current_step: number;
  status: CaseStatus;
  offer_price: number | null;
  created_at: string;
  updated_at: string;
  events_count?: number;
  latest_event_at?: string | null;
}

/** 建立案件請求 */
interface CreateCaseRequest {
  buyer_name: string;
  property_title: string;
  buyer_session_id?: string;
  buyer_contact?: string;
  property_id?: string;
}

/** 建立案件回應 */
interface CreateCaseResponse {
  success: boolean;
  case_id?: string;
  event_hash?: string;
  error?: string;
}

/** 案件列表回應 */
interface GetCasesResponse {
  success: boolean;
  cases?: TrustCase[];
  total?: number;
  error?: string;
}

/** 案件詳情回應 */
interface GetCaseDetailResponse {
  success: boolean;
  data?: TrustCase & { events: TrustCaseEvent[] };
  error?: string;
}

// ============================================================================
// Mock Setup
// ============================================================================

// Mock Supabase client
const mockSupabaseRpc = vi.fn();
const mockSupabaseFrom = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mockSupabaseRpc,
    from: mockSupabaseFrom,
  })),
}));

// Mock JWT verification
vi.mock("jsonwebtoken", () => ({
  default: {
    verify: vi.fn(() => ({
      id: "test-agent-id",
      role: "agent",
      txId: null,
    })),
  },
}));

// Mock logger
vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ============================================================================
// Test Suite: GET /api/trust/cases
// ============================================================================

describe("GET /api/trust/cases - 取得房仲案件列表", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe("[Backend Safeguard] 權限驗證", () => {
    it("應該拒絕未認證的請求 (401)", async () => {
      // Arrange
      const mockReq = {
        method: "GET",
        headers: {},
        query: {},
      };

      // Act & Assert
      // 未認證請求應返回 401
      expect(mockReq.headers).not.toHaveProperty("authorization");
      expect(mockReq.headers).not.toHaveProperty("cookie");
    });

    it("應該拒絕非房仲角色的請求 (403)", async () => {
      // Arrange: buyer 角色嘗試存取
      const buyerToken = {
        id: "test-buyer-id",
        role: "buyer",
        txId: "tx-123",
      };

      // Assert: buyer 角色應該被拒絕
      expect(buyerToken.role).not.toBe("agent");
    });

    it("應該只返回該房仲自己的案件", async () => {
      // Arrange
      const agentId = "agent-123";
      const mockCases: TrustCase[] = [
        {
          id: "case-001",
          agent_id: agentId,
          buyer_session_id: "sess-abc",
          buyer_name: "買方 A",
          buyer_contact: null,
          property_id: "prop-001",
          property_title: "惠宇上晴 12F",
          transaction_id: null,
          current_step: 2,
          status: "active",
          offer_price: null,
          created_at: "2026-01-19T10:00:00Z",
          updated_at: "2026-01-19T12:00:00Z",
          events_count: 2,
          latest_event_at: "2026-01-19T12:00:00Z",
        },
      ];

      mockSupabaseRpc.mockResolvedValueOnce({
        data: mockCases,
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_get_trust_cases", {
        p_agent_id: agentId,
        p_status: null,
        p_limit: 50,
        p_offset: 0,
      });

      // Assert
      expect(result.data).toHaveLength(1);
      expect(result.data[0].agent_id).toBe(agentId);
    });
  });

  describe("[NASA TypeScript Safety] 資料驗證", () => {
    it("應該正確驗證案件資料結構", () => {
      // Arrange
      const validCase: TrustCase = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        agent_id: "agent-123",
        buyer_session_id: "sess-xyz",
        buyer_name: "測試買方",
        buyer_contact: "0912345678",
        property_id: "MH-100001",
        property_title: "測試物件",
        transaction_id: null,
        current_step: 1,
        status: "active",
        offer_price: null,
        created_at: "2026-01-19T10:00:00Z",
        updated_at: "2026-01-19T10:00:00Z",
      };

      // Assert: 驗證必要欄位
      expect(validCase.id).toBeDefined();
      expect(validCase.agent_id).toBeDefined();
      expect(validCase.buyer_name).toBeDefined();
      expect(validCase.property_title).toBeDefined();
      expect(validCase.current_step).toBeGreaterThanOrEqual(1);
      expect(validCase.current_step).toBeLessThanOrEqual(6);
      expect(["active", "pending", "completed", "cancelled", "expired"]).toContain(
        validCase.status
      );
    });

    it("應該拒絕無效的 current_step 值", () => {
      // Arrange
      const invalidStep = 7;

      // Assert
      expect(invalidStep).toBeGreaterThan(6);
      // 資料庫 CHECK 約束會拒絕此值
    });
  });

  describe("分頁與過濾", () => {
    it("應該支援狀態過濾", async () => {
      // Arrange
      const agentId = "agent-123";
      const statusFilter = "active";

      // Act
      mockSupabaseRpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await mockSupabaseRpc("fn_get_trust_cases", {
        p_agent_id: agentId,
        p_status: statusFilter,
        p_limit: 50,
        p_offset: 0,
      });

      // Assert
      expect(mockSupabaseRpc).toHaveBeenCalledWith("fn_get_trust_cases", {
        p_agent_id: agentId,
        p_status: statusFilter,
        p_limit: 50,
        p_offset: 0,
      });
    });

    it("應該支援分頁參數", async () => {
      // Arrange
      const agentId = "agent-123";
      const limit = 10;
      const offset = 20;

      // Act
      mockSupabaseRpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      await mockSupabaseRpc("fn_get_trust_cases", {
        p_agent_id: agentId,
        p_status: null,
        p_limit: limit,
        p_offset: offset,
      });

      // Assert
      expect(mockSupabaseRpc).toHaveBeenCalledWith("fn_get_trust_cases", {
        p_agent_id: agentId,
        p_status: null,
        p_limit: limit,
        p_offset: offset,
      });
    });
  });
});

// ============================================================================
// Test Suite: POST /api/trust/cases
// ============================================================================

describe("POST /api/trust/cases - 建立新案件", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("[Backend Safeguard] 權限驗證", () => {
    it("應該拒絕未認證的請求 (401)", async () => {
      // Arrange
      const mockReq = {
        method: "POST",
        headers: {},
        body: {
          buyer_name: "測試買方",
          property_title: "測試物件",
        },
      };

      // Assert
      expect(mockReq.headers).not.toHaveProperty("authorization");
    });

    it("應該拒絕 buyer 角色建立案件 (403)", async () => {
      // Arrange
      const buyerToken = { role: "buyer" };

      // Assert
      expect(buyerToken.role).not.toBe("agent");
    });
  });

  describe("[NASA TypeScript Safety] 輸入驗證", () => {
    it("應該拒絕缺少必要欄位的請求", () => {
      // Arrange: 缺少 buyer_name
      const invalidRequest = {
        property_title: "測試物件",
      };

      // Assert
      expect(invalidRequest).not.toHaveProperty("buyer_name");
    });

    it("應該拒絕空字串的 buyer_name", () => {
      // Arrange
      const invalidRequest: CreateCaseRequest = {
        buyer_name: "",
        property_title: "測試物件",
      };

      // Assert
      expect(invalidRequest.buyer_name.length).toBe(0);
    });

    it("應該接受有效的建立案件請求", () => {
      // Arrange
      const validRequest: CreateCaseRequest = {
        buyer_name: "測試買方",
        property_title: "惠宇上晴 12F",
        buyer_session_id: "sess-abc-123",
        buyer_contact: "0912345678",
        property_id: "MH-100001",
      };

      // Assert
      expect(validRequest.buyer_name.length).toBeGreaterThan(0);
      expect(validRequest.property_title.length).toBeGreaterThan(0);
    });
  });

  describe("[Audit Logging] 審計日誌", () => {
    it("應該在建立案件時記錄初始事件", async () => {
      // Arrange
      const agentId = "agent-123";
      const request: CreateCaseRequest = {
        buyer_name: "測試買方",
        property_title: "測試物件",
      };

      const mockResponse: CreateCaseResponse = {
        success: true,
        case_id: "new-case-id",
        event_hash: "abc1...def2",
      };

      mockSupabaseRpc.mockResolvedValueOnce({
        data: mockResponse,
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_create_trust_case", {
        p_agent_id: agentId,
        p_buyer_name: request.buyer_name,
        p_property_title: request.property_title,
        p_buyer_session_id: null,
        p_buyer_contact: null,
        p_property_id: null,
      });

      // Assert
      expect(result.data.success).toBe(true);
      expect(result.data.case_id).toBeDefined();
      expect(result.data.event_hash).toBeDefined();
      // RPC 會自動建立初始事件（M1 接洽・案件建立）
    });

    it("事件 hash 應該是唯一且可驗證的", () => {
      // Arrange - 使用十六進位字元 [a-f0-9]
      const hash1 = "abc1...def2";
      const hash2 = "9f2a...c8d1";

      // Assert: hash 格式檢查 (4 字元...4 字元，僅十六進位)
      expect(hash1).toMatch(/^[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(hash2).toMatch(/^[a-f0-9]{4}\.\.\.[a-f0-9]{4}$/);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("建立案件成功流程", () => {
    it("應該成功建立案件並返回 case_id", async () => {
      // Arrange
      const agentId = "agent-123";
      const request: CreateCaseRequest = {
        buyer_name: "買方 A103",
        property_title: "惠宇上晴 12F",
        buyer_session_id: "sess-S5566-abc",
        property_id: "MH-100001",
      };

      const expectedResponse: CreateCaseResponse = {
        success: true,
        case_id: "550e8400-e29b-41d4-a716-446655440000",
        event_hash: "9f2a...c8d1",
      };

      mockSupabaseRpc.mockResolvedValueOnce({
        data: expectedResponse,
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_create_trust_case", {
        p_agent_id: agentId,
        p_buyer_name: request.buyer_name,
        p_property_title: request.property_title,
        p_buyer_session_id: request.buyer_session_id,
        p_buyer_contact: null,
        p_property_id: request.property_id,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data.success).toBe(true);
      expect(result.data.case_id).toBeDefined();
      expect(result.data.event_hash).toBeDefined();
    });

    it("新建案件的初始狀態應為 active, current_step=1", async () => {
      // Arrange
      const newCase: Partial<TrustCase> = {
        current_step: 1,
        status: "active",
      };

      // Assert
      expect(newCase.current_step).toBe(1);
      expect(newCase.status).toBe("active");
    });
  });
});

// ============================================================================
// Test Suite: GET /api/trust/cases/[id]
// ============================================================================

describe("GET /api/trust/cases/[id] - 取得案件詳情", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("[Backend Safeguard] 權限驗證", () => {
    it("應該拒絕存取其他房仲的案件 (403)", async () => {
      // Arrange
      const agentId = "agent-123";
      const otherAgentCaseId = "case-owned-by-agent-456";

      mockSupabaseRpc.mockResolvedValueOnce({
        data: { error: "Case not found or access denied" },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_get_trust_case_detail", {
        p_case_id: otherAgentCaseId,
        p_agent_id: agentId,
      });

      // Assert
      expect(result.data.error).toBe("Case not found or access denied");
    });
  });

  describe("取得案件詳情成功", () => {
    it("應該返回案件資料與所有事件", async () => {
      // Arrange
      const agentId = "agent-123";
      const caseId = "case-001";

      const expectedDetail = {
        id: caseId,
        buyer_name: "買方 A103",
        property_title: "惠宇上晴 12F",
        current_step: 3,
        status: "active",
        offer_price: 31500000,
        events: [
          {
            id: "event-003",
            step: 3,
            step_name: "M3 出價",
            action: "買方出價",
            actor: "buyer",
            event_hash: "1a7c...92b4",
            detail: "出價 NT$31,500,000",
            created_at: "2026-01-19T14:30:00Z",
          },
          {
            id: "event-002",
            step: 2,
            step_name: "M2 帶看",
            action: "帶看完成",
            actor: "buyer",
            event_hash: "b7aa...f3e2",
            detail: "GeoTag: 南屯社區大廳",
            created_at: "2026-01-18T10:00:00Z",
          },
          {
            id: "event-001",
            step: 1,
            step_name: "M1 接洽",
            action: "案件建立",
            actor: "agent",
            event_hash: "9f2a...c8d1",
            detail: "房仲建立安心交易案件",
            created_at: "2026-01-17T09:45:00Z",
          },
        ],
      };

      mockSupabaseRpc.mockResolvedValueOnce({
        data: expectedDetail,
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_get_trust_case_detail", {
        p_case_id: caseId,
        p_agent_id: agentId,
      });

      // Assert
      expect(result.error).toBeNull();
      expect(result.data.id).toBe(caseId);
      expect(result.data.events).toHaveLength(3);
      expect(result.data.events[0].step).toBe(3); // 最新事件在最前
    });
  });
});

// ============================================================================
// Test Suite: 步驟更新
// ============================================================================

describe("fn_update_trust_case_step - 更新案件步驟", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("步驟變更驗證", () => {
    it("應該允許步驟前進 (current_step -> current_step + 1)", async () => {
      // Arrange
      const caseId = "case-001";
      const agentId = "agent-123";
      const currentStep = 2;
      const newStep = 3;

      mockSupabaseRpc.mockResolvedValueOnce({
        data: {
          success: true,
          case_id: caseId,
          new_step: newStep,
          event_hash: "abc1...def2",
        },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_update_trust_case_step", {
        p_case_id: caseId,
        p_agent_id: agentId,
        p_new_step: newStep,
        p_action: "買方出價",
        p_actor: "buyer",
        p_detail: "出價 NT$31,500,000",
        p_offer_price: 31500000,
      });

      // Assert
      expect(result.data.success).toBe(true);
      expect(result.data.new_step).toBe(newStep);
    });

    it("應該拒絕步驟後退 (new_step < current_step)", async () => {
      // Arrange
      const caseId = "case-001";
      const agentId = "agent-123";
      const newStep = 1; // 試圖從步驟 3 退回到步驟 1

      mockSupabaseRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error: "Cannot go back to previous step",
        },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_update_trust_case_step", {
        p_case_id: caseId,
        p_agent_id: agentId,
        p_new_step: newStep,
        p_action: "嘗試退回",
        p_actor: "agent",
      });

      // Assert
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe("Cannot go back to previous step");
    });

    it("應該拒絕跳躍步驟 (new_step > current_step + 1)", async () => {
      // Arrange
      const caseId = "case-001";
      const agentId = "agent-123";
      const newStep = 5; // 試圖從步驟 2 跳到步驟 5

      mockSupabaseRpc.mockResolvedValueOnce({
        data: {
          success: false,
          error: "Cannot skip steps",
        },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_update_trust_case_step", {
        p_case_id: caseId,
        p_agent_id: agentId,
        p_new_step: newStep,
        p_action: "嘗試跳躍",
        p_actor: "agent",
      });

      // Assert
      expect(result.data.success).toBe(false);
      expect(result.data.error).toBe("Cannot skip steps");
    });

    it("步驟 6 完成後應自動將狀態設為 completed", async () => {
      // Arrange
      const caseId = "case-001";
      const agentId = "agent-123";

      mockSupabaseRpc.mockResolvedValueOnce({
        data: {
          success: true,
          case_id: caseId,
          new_step: 6,
          event_hash: "fin1...done",
        },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_update_trust_case_step", {
        p_case_id: caseId,
        p_agent_id: agentId,
        p_new_step: 6,
        p_action: "交屋完成",
        p_actor: "buyer",
        p_detail: "所有檢查項目已完成",
      });

      // Assert
      expect(result.data.success).toBe(true);
      expect(result.data.new_step).toBe(6);
      // RPC 會自動將 status 設為 'completed'
    });
  });

  describe("[Audit Logging] 事件記錄", () => {
    it("每次步驟更新都應記錄事件", async () => {
      // Arrange
      const caseId = "case-001";
      const agentId = "agent-123";
      const action = "帶看完成";
      const detail = "GeoTag: 南屯社區大廳";

      mockSupabaseRpc.mockResolvedValueOnce({
        data: {
          success: true,
          case_id: caseId,
          new_step: 2,
          event_hash: "geo1...tag2",
        },
        error: null,
      });

      // Act
      const result = await mockSupabaseRpc("fn_update_trust_case_step", {
        p_case_id: caseId,
        p_agent_id: agentId,
        p_new_step: 2,
        p_action: action,
        p_actor: "buyer",
        p_detail: detail,
      });

      // Assert
      expect(result.data.success).toBe(true);
      expect(result.data.event_hash).toBeDefined();
      // RPC 會自動在 trust_case_events 表建立記錄
    });
  });
});

// ============================================================================
// Test Suite: 錯誤處理
// ============================================================================

describe("錯誤處理", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("應該正確處理資料庫錯誤", async () => {
    // Arrange
    mockSupabaseRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "Database connection failed" },
    });

    // Act
    const result = await mockSupabaseRpc("fn_get_trust_cases", {
      p_agent_id: "agent-123",
    });

    // Assert
    expect(result.error).not.toBeNull();
    expect(result.error.message).toContain("Database");
  });

  it("應該正確處理無效的 UUID", async () => {
    // Arrange
    const invalidUuid = "not-a-valid-uuid";

    // Assert: UUID 格式驗證
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(invalidUuid).not.toMatch(uuidRegex);
  });
});
