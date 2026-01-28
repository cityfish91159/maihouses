/**
 * Unit tests for API Response utilities
 *
 * 測試統一 API 回應格式的功能
 */

import { describe, it, expect } from "vitest";
import {
  successResponse,
  errorResponse,
  API_ERROR_CODES,
  API_WARNING_CODES,
} from "../apiResponse";

describe("apiResponse", () => {
  describe("successResponse", () => {
    it("應返回成功格式並包含資料", () => {
      const data = { items: [], total: 0 };
      const result = successResponse(data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.error).toBeUndefined();
      expect(result.warnings).toBeUndefined();
    });

    it("應正確處理警告訊息", () => {
      const data = { items: [] };
      const warnings = [
        { code: "PARTIAL_FAILURE", message: "部分資料載入失敗" },
      ];
      const result = successResponse(data, warnings);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.warnings).toEqual(warnings);
    });

    it("應忽略空陣列警告", () => {
      const data = { items: [] };
      const result = successResponse(data, []);

      expect(result.success).toBe(true);
      expect(result.warnings).toBeUndefined();
    });

    it("應處理不同資料類型", () => {
      // 測試 null
      const result1 = successResponse(null);
      expect(result1.data).toBeNull();

      // 測試字串
      const result2 = successResponse("success");
      expect(result2.data).toBe("success");

      // 測試數字
      const result3 = successResponse(42);
      expect(result3.data).toBe(42);

      // 測試陣列
      const result4 = successResponse([1, 2, 3]);
      expect(result4.data).toEqual([1, 2, 3]);
    });

    it("應保留複雜物件結構", () => {
      const complexData = {
        communityInfo: { name: "測試社區", year: 2020 },
        posts: { public: [], private: [] },
        reviews: { items: [], total: 0 },
      };

      const result = successResponse(complexData);
      expect(result.data).toEqual(complexData);
    });
  });

  describe("errorResponse", () => {
    it("應返回錯誤格式", () => {
      const result = errorResponse("NOT_FOUND", "找不到資源");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe("NOT_FOUND");
      expect(result.error?.message).toBe("找不到資源");
      expect(result.error?.details).toBeUndefined();
      expect(result.data).toBeUndefined();
    });

    it("應包含額外細節（開發環境）", () => {
      const details = { field: "email", reason: "invalid format" };
      const result = errorResponse("VALIDATION_ERROR", "驗證失敗", details);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("VALIDATION_ERROR");
      expect(result.error?.message).toBe("驗證失敗");
      expect(result.error?.details).toEqual(details);
    });

    it("應正確處理各種錯誤碼", () => {
      Object.entries(API_ERROR_CODES).forEach(([key, code]) => {
        const result = errorResponse(code, `測試 ${key}`);
        expect(result.error?.code).toBe(code);
      });
    });

    it("應處理自訂錯誤碼", () => {
      const result = errorResponse("CUSTOM_ERROR", "自訂錯誤");
      expect(result.error?.code).toBe("CUSTOM_ERROR");
      expect(result.error?.message).toBe("自訂錯誤");
    });

    it("details 為 undefined 時不應包含 details 欄位", () => {
      const result = errorResponse("TEST", "測試", undefined);
      expect(result.error).toBeDefined();
      expect("details" in (result.error ?? {})).toBe(false);
    });

    it("details 為 null 時應包含 details 欄位", () => {
      const result = errorResponse("TEST", "測試", null);
      expect(result.error?.details).toBeNull();
    });
  });

  describe("API_ERROR_CODES", () => {
    it("應包含所有必要的錯誤碼", () => {
      expect(API_ERROR_CODES.INVALID_INPUT).toBe("INVALID_INPUT");
      expect(API_ERROR_CODES.INVALID_QUERY).toBe("INVALID_QUERY");
      expect(API_ERROR_CODES.NOT_FOUND).toBe("NOT_FOUND");
      expect(API_ERROR_CODES.PERMISSION_DENIED).toBe("PERMISSION_DENIED");
      expect(API_ERROR_CODES.UNAUTHORIZED).toBe("UNAUTHORIZED");
      expect(API_ERROR_CODES.FORBIDDEN).toBe("FORBIDDEN");
      expect(API_ERROR_CODES.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
      expect(API_ERROR_CODES.DATA_FETCH_FAILED).toBe("DATA_FETCH_FAILED");
      expect(API_ERROR_CODES.SERVICE_UNAVAILABLE).toBe("SERVICE_UNAVAILABLE");
    });

    it("應包含業務邏輯錯誤碼", () => {
      expect(API_ERROR_CODES.COMMUNITY_NOT_FOUND).toBe("COMMUNITY_NOT_FOUND");
      expect(API_ERROR_CODES.FORBIDDEN_PRIVATE_POSTS).toBe(
        "FORBIDDEN_PRIVATE_POSTS",
      );
      expect(API_ERROR_CODES.REVIEW_FETCH_FAILED).toBe("REVIEW_FETCH_FAILED");
      expect(API_ERROR_CODES.PROPERTY_FETCH_FAILED).toBe(
        "PROPERTY_FETCH_FAILED",
      );
      expect(API_ERROR_CODES.AGENT_FETCH_FAILED).toBe("AGENT_FETCH_FAILED");
    });
  });

  describe("API_WARNING_CODES", () => {
    it("應包含所有警告碼", () => {
      expect(API_WARNING_CODES.PARTIAL_FAILURE).toBe("PARTIAL_FAILURE");
      expect(API_WARNING_CODES.REVIEWS_FETCH_FAILED).toBe(
        "REVIEWS_FETCH_FAILED",
      );
      expect(API_WARNING_CODES.AGENT_DATA_UNAVAILABLE).toBe(
        "AGENT_DATA_UNAVAILABLE",
      );
      expect(API_WARNING_CODES.COMMUNITY_DATA_INCOMPLETE).toBe(
        "COMMUNITY_DATA_INCOMPLETE",
      );
    });
  });

  describe("TypeScript 類型推導", () => {
    it("successResponse 應正確推導泛型類型", () => {
      interface TestData {
        id: string;
        name: string;
      }

      const data: TestData = { id: "1", name: "test" };
      const result = successResponse(data);

      // TypeScript 應推導 result.data 為 TestData 類型
      expect(result.data?.id).toBe("1");
      expect(result.data?.name).toBe("test");
    });

    it("errorResponse 應返回 never 類型的 data", () => {
      const result = errorResponse("TEST", "測試");

      // TypeScript 應確保 result.data 為 never (不存在)
      expect(result.data).toBeUndefined();
    });
  });

  describe("實際使用場景", () => {
    it("應支援部分成功情境（成功 + 警告）", () => {
      const data = { items: [], total: 0 };
      const warnings = [
        { code: "REVIEWS_FETCH_FAILED", message: "評價載入失敗" },
        {
          code: "COMMUNITY_DATA_INCOMPLETE",
          message: "社區摘要資料載入失敗",
        },
      ];

      const result = successResponse(data, warnings);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(data);
      expect(result.warnings).toHaveLength(2);
      expect(result.warnings?.[0]?.code).toBe("REVIEWS_FETCH_FAILED");
    });

    it("應支援前端錯誤處理", () => {
      const result = errorResponse(
        API_ERROR_CODES.COMMUNITY_NOT_FOUND,
        "找不到對應的社區，請確認網址是否正確",
      );

      // 前端可以根據 success 判斷成功/失敗
      expect(result.success).toBe(false);

      // 前端可以根據 error.code 做特定錯誤處理
      if (result.error?.code === "COMMUNITY_NOT_FOUND") {
        expect(result.error.message).toContain("找不到");
      }
    });

    it("應支援開發環境調試", () => {
      const validationErrors = {
        fields: ["email", "password"],
        details: "Email format invalid",
      };

      const result = errorResponse(
        "VALIDATION_ERROR",
        "輸入格式錯誤",
        validationErrors,
      );

      // 開發環境可以看到詳細錯誤
      expect(result.error?.details).toEqual(validationErrors);

      // 但前端只看到友善訊息
      expect(result.error?.message).toBe("輸入格式錯誤");
    });
  });

  // ============================================================================
  // 修復 P5: 補充負面測試案例（邊界條件與安全性）
  // ============================================================================
  describe("邊界條件與負面測試", () => {
    it("warnings 為 undefined 時不應包含 warnings 欄位", () => {
      const result = successResponse({ data: "test" }, undefined);
      expect(result.success).toBe(true);
      expect("warnings" in result).toBe(false);
    });

    it("warnings 為空陣列時不應包含 warnings 欄位", () => {
      const result = successResponse({ data: "test" }, []);
      expect(result.success).toBe(true);
      expect("warnings" in result).toBe(false);
    });

    it("應處理極大的 details 物件（效能測試）", () => {
      const largeDetails = {
        data: "x".repeat(100000), // 100KB 字串
        array: new Array(1000).fill("test"),
      };

      expect(() => {
        const result = errorResponse("LARGE_DATA", "測試大型資料", largeDetails);
        expect(result.error?.details).toEqual(largeDetails);
      }).not.toThrow();
    });

    it("應安全處理循環引用的 details", () => {
      const circular: { a: number; b: number; self?: unknown } = { a: 1, b: 2 };
      circular.self = circular; // 循環引用

      // 建立回應不應崩潰
      expect(() => {
        errorResponse("CIRCULAR", "測試循環引用", circular);
      }).not.toThrow();
    });

    it("warnings 可以是包含多個項目的陣列", () => {
      const warnings = [
        { code: "WARNING_1", message: "警告 1" },
        { code: "WARNING_2", message: "警告 2" },
        { code: "WARNING_3", message: "警告 3" },
      ];
      const result = successResponse({ data: "test" }, warnings);
      expect(result.warnings).toHaveLength(3);
      expect(result.warnings?.[2]?.code).toBe("WARNING_3");
    });

    it("details 為 0 時應包含 details 欄位", () => {
      const result = errorResponse("TEST", "測試", 0);
      expect("details" in (result.error ?? {})).toBe(true);
      expect(result.error?.details).toBe(0);
    });

    it("details 為 false 時應包含 details 欄位", () => {
      const result = errorResponse("TEST", "測試", false);
      expect("details" in (result.error ?? {})).toBe(true);
      expect(result.error?.details).toBe(false);
    });

    it("details 為空字串時應包含 details 欄位", () => {
      const result = errorResponse("TEST", "測試", "");
      expect("details" in (result.error ?? {})).toBe(true);
      expect(result.error?.details).toBe("");
    });
  });

  // ============================================================================
  // 安全回歸測試（防止 PostgreSQL 洩露再次發生）
  // ============================================================================
  describe("安全回歸測試", () => {
    it("errorResponse 回應不應包含 hint 欄位", () => {
      const result = errorResponse("DB_ERROR", "資料庫錯誤", {
        some: "details",
      });
      const jsonString = JSON.stringify(result);

      // 確保回應中不包含 "hint" 關鍵字
      expect(jsonString).not.toContain('"hint"');
    });

    it("errorResponse 回應不應包含 PostgreSQL 錯誤結構", () => {
      const result = errorResponse("DB_ERROR", "資料庫錯誤");

      expect(result.error).toBeDefined();
      expect(result.error).not.toHaveProperty("hint");
      expect(result.error).not.toHaveProperty("cause");
    });

    it("successResponse 的 warnings 應使用語意化 code", () => {
      const result = successResponse(
        { data: "test" },
        [{ code: API_WARNING_CODES.PARTIAL_FAILURE, message: "測試" }],
      );

      expect(result.warnings?.[0]?.code).toBe("PARTIAL_FAILURE");
      // 確認使用的是常數，不是硬編碼字串
      expect(API_WARNING_CODES.PARTIAL_FAILURE).toBe("PARTIAL_FAILURE");
    });

    it("所有 API_ERROR_CODES 常數應為字串", () => {
      Object.values(API_ERROR_CODES).forEach((code) => {
        expect(typeof code).toBe("string");
        expect(code.length).toBeGreaterThan(0);
      });
    });

    it("所有 API_WARNING_CODES 常數應為字串", () => {
      Object.values(API_WARNING_CODES).forEach((code) => {
        expect(typeof code).toBe("string");
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });
});
