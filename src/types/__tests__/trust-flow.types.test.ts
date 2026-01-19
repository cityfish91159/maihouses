/**
 * Trust Flow Types 測試
 *
 * [Test Driven Agent] 五種強度測試
 * [NASA TypeScript Safety] Zod Schema 驗證
 */

import { describe, it, expect } from "vitest";
import {
  TrustCaseSchema,
  TrustCaseEventSchema,
  CreateCaseRequestSchema,
  UpdateStepRequestSchema,
  transformToLegacyCase,
  getStepName,
  getStepLabel,
  getStepIcon,
  isValidStep,
  formatCaseStatus,
  TRUST_STEP_NAMES,
} from "../trust-flow.types";

// ============================================================================
// 測試 1: Zod Schema 驗證測試 (基礎強度)
// ============================================================================

describe("Zod Schema 驗證", () => {
  describe("TrustCaseSchema", () => {
    it("應該接受有效的案件資料", () => {
      const validCase = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        buyer_session_id: "session-123",
        buyer_name: "買方 A",
        buyer_contact: "0912345678",
        property_id: "prop-123",
        property_title: "惠宇上晴 12F",
        transaction_id: null,
        current_step: 3,
        status: "active",
        offer_price: 31500000,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-02T00:00:00Z",
      };

      const result = TrustCaseSchema.safeParse(validCase);
      expect(result.success).toBe(true);
    });

    it("應該拒絕無效的 UUID", () => {
      const invalidCase = {
        id: "not-a-uuid",
        buyer_name: "買方",
        property_title: "物件",
        current_step: 1,
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = TrustCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });

    it("應該拒絕超出範圍的 current_step", () => {
      const invalidCase = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        buyer_name: "買方",
        property_title: "物件",
        current_step: 7, // 超出 1-6 範圍
        status: "active",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const result = TrustCaseSchema.safeParse(invalidCase);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateCaseRequestSchema", () => {
    it("應該接受最小必要欄位", () => {
      const minimal = {
        buyer_name: "買方名稱",
        property_title: "物件標題",
      };

      const result = CreateCaseRequestSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it("應該拒絕空的 buyer_name", () => {
      const invalid = {
        buyer_name: "",
        property_title: "物件標題",
      };

      const result = CreateCaseRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("應該拒絕超長的 buyer_name (>100)", () => {
      const invalid = {
        buyer_name: "a".repeat(101),
        property_title: "物件標題",
      };

      const result = CreateCaseRequestSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// 測試 2: 轉換函數測試 (中等強度)
// ============================================================================

describe("transformToLegacyCase 轉換函數", () => {
  it("應該正確轉換 API 回應為 Legacy 格式", () => {
    const apiCase = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      buyer_session_id: "session-abc",
      buyer_name: "王小明",
      buyer_contact: null,
      property_id: null,
      property_title: "惠宇上晴 12F",
      transaction_id: null,
      current_step: 3,
      status: "active" as const,
      offer_price: 31500000,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-02T12:00:00Z",
    };

    const result = transformToLegacyCase(apiCase, []);

    expect(result.id).toBe(apiCase.id);
    expect(result.buyerName).toBe("王小明");
    expect(result.propertyTitle).toBe("惠宇上晴 12F");
    expect(result.currentStep).toBe(3);
    expect(result.status).toBe("active");
    expect(result.offerPrice).toBe(31500000);
  });

  it("應該正確轉換事件列表", () => {
    const apiCase = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      buyer_session_id: null,
      buyer_name: "測試",
      buyer_contact: null,
      property_id: null,
      property_title: "測試物件",
      transaction_id: null,
      current_step: 2,
      status: "active" as const,
      offer_price: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const events = [
      {
        id: "event-1",
        step: 1,
        step_name: "M1 接洽",
        action: "初次接洽",
        actor: "agent" as const,
        event_hash: "abc1...def2",
        detail: "備註",
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const result = transformToLegacyCase(apiCase, events);

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.stepName).toBe("M1 接洽");
    expect(result.events[0]?.hash).toBe("abc1...def2");
    expect(result.events[0]?.detail).toBe("備註");
  });

  it("當 buyer_session_id 為 null 時應使用 id 前綴", () => {
    const apiCase = {
      id: "abcd4567-e89b-12d3-a456-426614174000",
      buyer_session_id: null,
      buyer_name: "測試",
      buyer_contact: null,
      property_id: null,
      property_title: "測試",
      transaction_id: null,
      current_step: 1,
      status: "active" as const,
      offer_price: null,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    };

    const result = transformToLegacyCase(apiCase, []);

    expect(result.buyerId).toBe("ABCD");
  });
});

// ============================================================================
// 測試 3: 工具函數測試 (輕量強度)
// ============================================================================

describe("工具函數", () => {
  describe("getStepName", () => {
    it("應該返回正確的步驟名稱", () => {
      expect(getStepName(1)).toBe("M1 接洽");
      expect(getStepName(6)).toBe("M6 交屋");
    });

    it("應該對無效步驟返回預設值", () => {
      expect(getStepName(0)).toBe("步驟 0");
      expect(getStepName(7)).toBe("步驟 7");
    });
  });

  describe("isValidStep", () => {
    it("應該正確驗證有效步驟", () => {
      expect(isValidStep(1)).toBe(true);
      expect(isValidStep(6)).toBe(true);
    });

    it("應該拒絕無效步驟", () => {
      expect(isValidStep(0)).toBe(false);
      expect(isValidStep(7)).toBe(false);
      expect(isValidStep(-1)).toBe(false);
    });
  });

  describe("formatCaseStatus", () => {
    it("應該返回正確的狀態格式", () => {
      const active = formatCaseStatus("active");
      expect(active.text).toBe("進行中");
      expect(active.color).toBe("#16a34a");

      const completed = formatCaseStatus("completed");
      expect(completed.text).toBe("已完成");
    });
  });

  describe("getStepIcon", () => {
    it("應該對每個步驟返回圖示", () => {
      expect(getStepIcon(1)).toBe("📞");
      expect(getStepIcon(5)).toBe("🤝");
      expect(getStepIcon(6)).toBe("🔑");
    });
  });
});

// ============================================================================
// 測試 4: 邊界條件測試 (高強度)
// ============================================================================

describe("邊界條件測試", () => {
  describe("UpdateStepRequestSchema", () => {
    it("應該接受邊界值 step=1", () => {
      const request = {
        new_step: 1,
        action: "初次接洽",
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("應該接受邊界值 step=6", () => {
      const request = {
        new_step: 6,
        action: "完成交屋",
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("應該拒絕 step=0", () => {
      const request = {
        new_step: 0,
        action: "測試",
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("應該拒絕 step=7", () => {
      const request = {
        new_step: 7,
        action: "測試",
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("應該拒絕負數的 offer_price", () => {
      const request = {
        new_step: 3,
        action: "出價",
        offer_price: -1000,
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(false);
    });

    it("應該接受正數的 offer_price", () => {
      const request = {
        new_step: 3,
        action: "出價",
        offer_price: 31500000,
      };
      const result = UpdateStepRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });

  describe("長度限制測試", () => {
    it("buyer_name 剛好 100 字應該通過", () => {
      const request = {
        buyer_name: "a".repeat(100),
        property_title: "物件",
      };
      const result = CreateCaseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });

    it("property_title 剛好 200 字應該通過", () => {
      const request = {
        buyer_name: "買方",
        property_title: "a".repeat(200),
      };
      const result = CreateCaseRequestSchema.safeParse(request);
      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// 測試 5: 完整流程整合測試 (最高強度)
// ============================================================================

describe("完整流程整合測試", () => {
  it("6 階段完整流程應該都有定義", () => {
    for (let step = 1; step <= 6; step++) {
      expect(TRUST_STEP_NAMES[step]).toBeDefined();
      expect(getStepName(step)).not.toContain("步驟");
      expect(getStepLabel(step)).not.toContain("步驟");
      expect(getStepIcon(step)).not.toBe("📋"); // 預設圖示
    }
  });

  it("從 API 到 Legacy 的完整轉換鏈應該無損", () => {
    // 模擬完整的 API 回應
    const fullApiCase = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      buyer_session_id: "sess-xyz",
      buyer_name: "張三",
      buyer_contact: "0912345678",
      property_id: "prop-001",
      property_title: "台北市信義區豪宅",
      transaction_id: "txn-001",
      current_step: 5,
      status: "active" as const,
      offer_price: 88000000,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-06-15T14:30:00Z",
    };

    const fullEvents = [
      {
        id: "e1",
        step: 1,
        step_name: "M1 接洽",
        action: "初次接洽",
        actor: "agent" as const,
        event_hash: "a1b2...c3d4",
        detail: null,
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "e2",
        step: 2,
        step_name: "M2 帶看",
        action: "帶看完成",
        actor: "buyer" as const,
        event_hash: "e5f6...g7h8",
        detail: "GeoTag 驗證",
        created_at: "2024-02-01T00:00:00Z",
      },
      {
        id: "e3",
        step: 3,
        step_name: "M3 出價",
        action: "買方出價",
        actor: "buyer" as const,
        event_hash: "i9j0...k1l2",
        detail: "出價 NT$88,000,000",
        created_at: "2024-03-01T00:00:00Z",
      },
      {
        id: "e4",
        step: 4,
        step_name: "M4 斡旋",
        action: "斡旋成功",
        actor: "agent" as const,
        event_hash: "m3n4...o5p6",
        detail: null,
        created_at: "2024-04-01T00:00:00Z",
      },
      {
        id: "e5",
        step: 5,
        step_name: "M5 成交",
        action: "簽約完成",
        actor: "system" as const,
        event_hash: "q7r8...s9t0",
        detail: "成交價 NT$88,000,000",
        created_at: "2024-05-01T00:00:00Z",
      },
    ];

    const legacy = transformToLegacyCase(fullApiCase, fullEvents);

    // 驗證主要欄位
    expect(legacy.id).toBe(fullApiCase.id);
    expect(legacy.buyerName).toBe("張三");
    expect(legacy.currentStep).toBe(5);
    expect(legacy.offerPrice).toBe(88000000);

    // 驗證事件轉換
    expect(legacy.events).toHaveLength(5);
    expect(legacy.events[0]?.stepName).toBe("M1 接洽");
    expect(legacy.events[4]?.stepName).toBe("M5 成交");

    // 驗證 null 值不會變成 undefined 屬性
    const event1 = legacy.events[0];
    const event2 = legacy.events[1];
    expect(event1?.hash).toBe("a1b2...c3d4");
    expect(event1).not.toHaveProperty("detail"); // null 轉換後不應該有此屬性
    expect(event2?.detail).toBe("GeoTag 驗證");
  });

  it("所有狀態應該都有對應的格式化函數", () => {
    const statuses = ["active", "pending", "completed", "cancelled", "expired"] as const;

    for (const status of statuses) {
      const formatted = formatCaseStatus(status);
      expect(formatted.text).toBeDefined();
      expect(formatted.bg).toBeDefined();
      expect(formatted.color).toBeDefined();
    }
  });
});
