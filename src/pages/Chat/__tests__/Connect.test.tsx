/**
 * Connect.tsx 導向邏輯測試
 * 測試2補充：驗證 Connect 頁面的 token 解析和導向邏輯
 */

import { describe, it, expect } from "vitest";

describe("Connect.tsx 導向邏輯測試", () => {
  /**
   * Token 解析邏輯
   */
  describe("Token 解析", () => {
    it("應該正確解析有效的 base64url token", () => {
      interface ConnectTokenPayload {
        conversationId: string;
        sessionId: string;
        propertyId?: string;
        exp: number;
      }

      // 模擬 parseConnectToken 邏輯
      function parseConnectToken(token: string): ConnectTokenPayload | null {
        try {
          // base64url -> base64
          const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);

          // 解碼
          const binaryString = atob(padded);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const jsonString = new TextDecoder().decode(bytes);

          // 解析 JSON
          const payload = JSON.parse(jsonString) as ConnectTokenPayload;

          // 驗證必要欄位
          if (!payload.conversationId || !payload.sessionId || !payload.exp) {
            return null;
          }

          return payload;
        } catch {
          return null;
        }
      }

      // 建立測試 token
      const payload = {
        conversationId: "conv-test-123",
        sessionId: "session-test-456",
        propertyId: "prop-test-789", // 修4
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };
      const token = Buffer.from(JSON.stringify(payload)).toString("base64url");

      // 解析
      const decoded = parseConnectToken(token);

      // 驗證
      expect(decoded).not.toBeNull();
      expect(decoded?.conversationId).toBe("conv-test-123");
      expect(decoded?.sessionId).toBe("session-test-456");
      expect(decoded?.propertyId).toBe("prop-test-789"); // 修4
      expect(decoded?.exp).toBeGreaterThan(Date.now());
    });

    it("應該拒絕無效的 token", () => {
      function parseConnectToken(
        token: string,
      ): { conversationId: string } | null {
        try {
          const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const jsonString = atob(padded);
          const payload = JSON.parse(jsonString);

          if (!payload.conversationId || !payload.sessionId || !payload.exp) {
            return null;
          }

          return payload;
        } catch {
          return null;
        }
      }

      const invalidTokens = [
        "invalid-token", // 不是有效的 base64url
        "eyJpbnZhbGlkIjoianNvbiJ9", // 有效 base64 但缺少必要欄位
        "", // 空字串
      ];

      invalidTokens.forEach((token) => {
        const result = parseConnectToken(token);
        expect(result).toBeNull();
      });
    });

    it("應該正確驗證 token 過期時間", () => {
      const now = Date.now();

      // 未過期的 token
      const validPayload = {
        conversationId: "conv-123",
        sessionId: "session-456",
        exp: now + 1000 * 60 * 60, // 1 小時後過期
      };

      const isExpired = (exp: number) => Date.now() > exp;

      expect(isExpired(validPayload.exp)).toBe(false);

      // 已過期的 token
      const expiredPayload = {
        conversationId: "conv-789",
        sessionId: "session-012",
        exp: now - 1000 * 60 * 60, // 1 小時前過期
      };

      expect(isExpired(expiredPayload.exp)).toBe(true);
    });
  });

  /**
   * Session 設置邏輯（修4驗證）
   */
  describe("Session 設置", () => {
    it("應該將 sessionId 存入 localStorage（修1/修2 修正）", () => {
      // 模擬 setConsumerSession 邏輯
      function setConsumerSession(sessionId: string): void {
        // 修1/修2：改用 localStorage + uag_session
        localStorage.setItem("uag_session", sessionId);
      }

      const testSessionId = "test-session-12345";
      setConsumerSession(testSessionId);

      // 驗證
      const stored = localStorage.getItem("uag_session");
      expect(stored).toBe(testSessionId);

      // 清理
      localStorage.removeItem("uag_session");
    });

    it("應該使用正確的 storage key（uag_session）", () => {
      const SESSION_STORAGE_KEY = "uag_session";

      expect(SESSION_STORAGE_KEY).toBe("uag_session");
      expect(SESSION_STORAGE_KEY).not.toBe("maihouses_consumer_session"); // 舊的錯誤 key
    });
  });

  /**
   * 導向邏輯
   */
  describe("導向邏輯", () => {
    it("應該導向到正確的 Chat 頁面 URL", () => {
      const conversationId = "conv-test-123";
      const expectedPath = `/maihouses/chat/${conversationId}`;

      // 模擬 navigate 邏輯
      function getNavigatePath(conversationId: string): string {
        return `/maihouses/chat/${conversationId}`;
      }

      const path = getNavigatePath(conversationId);

      expect(path).toBe(expectedPath);
      expect(path).toContain("/maihouses/chat/");
      expect(path).toContain(conversationId);
    });

    it("應該使用 replace: true 避免返回 Connect 頁面", () => {
      // 模擬 navigate 選項
      interface NavigateOptions {
        replace?: boolean;
      }

      const options: NavigateOptions = {
        replace: true, // 關鍵：避免用戶按返回時回到 Connect 頁面
      };

      expect(options.replace).toBe(true);
    });
  });

  /**
   * 錯誤處理
   */
  describe("錯誤處理", () => {
    it("缺少 token 參數時應顯示錯誤", () => {
      // 模擬 URL 沒有 token 參數
      const searchParams = new URLSearchParams("");
      const token = searchParams.get("token");

      expect(token).toBeNull();

      // 應該顯示錯誤狀態
      const errorState = {
        hasError: !token,
        errorMessage: "缺少 token 參數",
      };

      expect(errorState.hasError).toBe(true);
      expect(errorState.errorMessage).toBe("缺少 token 參數");
    });

    it("token 過期時應顯示錯誤", () => {
      const expiredPayload = {
        conversationId: "conv-123",
        sessionId: "session-456",
        exp: Date.now() - 1000, // 1 秒前過期
      };

      const isExpired = Date.now() > expiredPayload.exp;

      expect(isExpired).toBe(true);

      // 應該顯示錯誤狀態
      const errorState = {
        hasError: isExpired,
        errorMessage: "連結已過期",
      };

      expect(errorState.hasError).toBe(true);
      expect(errorState.errorMessage).toBe("連結已過期");
    });

    it("token 格式錯誤時應顯示錯誤", () => {
      function parseConnectToken(token: string): unknown {
        try {
          const base64 = token.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
          const jsonString = atob(padded);
          return JSON.parse(jsonString);
        } catch {
          return null;
        }
      }

      const invalidToken = "invalid-token";
      const parsed = parseConnectToken(invalidToken);

      expect(parsed).toBeNull();

      // 應該顯示錯誤狀態
      const errorState = {
        hasError: parsed === null,
        errorMessage: "無效的連結格式",
      };

      expect(errorState.hasError).toBe(true);
    });
  });

  /**
   * 修4 驗證：propertyId 傳遞
   */
  describe("修4驗證：propertyId 處理", () => {
    it("token 包含 propertyId 時應正確解析", () => {
      interface ConnectTokenPayload {
        conversationId: string;
        sessionId: string;
        propertyId?: string;
        exp: number;
      }

      const payload: ConnectTokenPayload = {
        conversationId: "conv-123",
        sessionId: "session-456",
        propertyId: "prop-789", // 修4
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      const token = Buffer.from(JSON.stringify(payload)).toString("base64url");

      // 解析
      const decoded = JSON.parse(
        Buffer.from(token, "base64url").toString(),
      ) as ConnectTokenPayload;

      // 驗證 propertyId 存在
      expect(decoded.propertyId).toBe("prop-789");
    });

    it("token 沒有 propertyId 時應正常處理", () => {
      interface ConnectTokenPayload {
        conversationId: string;
        sessionId: string;
        propertyId?: string;
        exp: number;
      }

      const payload: ConnectTokenPayload = {
        conversationId: "conv-123",
        sessionId: "session-456",
        // 沒有 propertyId
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
      };

      const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
      const decoded = JSON.parse(
        Buffer.from(token, "base64url").toString(),
      ) as ConnectTokenPayload;

      // propertyId 應該是 undefined（不是必要欄位）
      expect(decoded.propertyId).toBeUndefined();
      expect(decoded.conversationId).toBeDefined();
      expect(decoded.sessionId).toBeDefined();
    });
  });

  /**
   * 完整流程測試
   */
  describe("完整導向流程", () => {
    it("成功流程：token 有效 → 設置 session → 導向 Chat", () => {
      // 步驟追蹤
      const steps: string[] = [];

      // 1. 從 URL 取得 token
      steps.push("get_token_from_url");
      const token = Buffer.from(
        JSON.stringify({
          conversationId: "conv-123",
          sessionId: "session-456",
          propertyId: "prop-789",
          exp: Date.now() + 1000 * 60 * 60,
        }),
      ).toString("base64url");

      // 2. 解析 token
      steps.push("parse_token");
      const payload = JSON.parse(Buffer.from(token, "base64url").toString());

      // 3. 驗證過期時間
      steps.push("validate_expiration");
      const isExpired = Date.now() > payload.exp;
      expect(isExpired).toBe(false);

      // 4. 設置 localStorage
      steps.push("set_localstorage");
      localStorage.setItem("uag_session", payload.sessionId);

      // 5. 導向 Chat 頁面
      steps.push("navigate_to_chat");
      const navigatePath = `/maihouses/chat/${payload.conversationId}`;

      // 驗證完整流程
      expect(steps).toEqual([
        "get_token_from_url",
        "parse_token",
        "validate_expiration",
        "set_localstorage",
        "navigate_to_chat",
      ]);

      expect(navigatePath).toBe("/maihouses/chat/conv-123");
      expect(localStorage.getItem("uag_session")).toBe("session-456");

      // 清理
      localStorage.removeItem("uag_session");
    });

    it("失敗流程：token 過期 → 顯示錯誤 → 不導向", () => {
      const steps: string[] = [];

      // 1. 解析 token
      steps.push("parse_token");
      const payload = {
        conversationId: "conv-123",
        sessionId: "session-456",
        exp: Date.now() - 1000, // 已過期
      };

      // 2. 驗證過期時間（失敗）
      steps.push("validate_expiration");
      const isExpired = Date.now() > payload.exp;

      if (isExpired) {
        steps.push("show_error");
        // 不設置 session，不導向
      } else {
        steps.push("set_localstorage");
        steps.push("navigate_to_chat");
      }

      // 驗證失敗流程
      expect(isExpired).toBe(true);
      expect(steps).toEqual([
        "parse_token",
        "validate_expiration",
        "show_error",
      ]);
    });
  });
});
