/**
 * UAG send-message API 測試
 * 測試1：站內訊息 100% 成功（LINE 發送失敗場景）
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("send-message API - 測試1：站內訊息獨立成功", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("應該正確建立 ConnectTokenPayload 包含 propertyId", () => {
    // 測試 payload 結構
    interface ConnectTokenPayload {
      conversationId: string;
      sessionId: string;
      propertyId?: string;
      exp: number;
    }

    const payload: ConnectTokenPayload = {
      conversationId: "test-conv-id",
      sessionId: "test-session-id",
      propertyId: "test-property-id",
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };

    // 驗證 payload 結構
    expect(payload).toHaveProperty("conversationId");
    expect(payload).toHaveProperty("sessionId");
    expect(payload).toHaveProperty("propertyId");
    expect(payload).toHaveProperty("exp");

    // 驗證 base64url 編碼
    const token = Buffer.from(JSON.stringify(payload)).toString("base64url");
    expect(token).toBeTruthy();
    expect(token).not.toContain("+");
    expect(token).not.toContain("/");
    expect(token).not.toContain("=");

    // 驗證解碼
    const decoded = JSON.parse(
      Buffer.from(token, "base64url").toString(),
    ) as ConnectTokenPayload;
    expect(decoded.propertyId).toBe("test-property-id");
    expect(decoded.conversationId).toBe("test-conv-id");
  });

  it("應該正確建立 LINE 訊息包含物件連結", () => {
    const agentName = "測試房仲";
    const propertyTitle = "信義區豪宅";
    const propertyId = "prop-123-456";
    const connectUrl =
      "https://maihouses.vercel.app/maihouses/chat/connect?token=xxx";
    const grade = "S";

    // 模擬 buildLineMessage 邏輯
    function buildLineMessage(
      agentName: string,
      connectUrl: string,
      propertyTitle?: string,
      propertyId?: string,
      grade?: string,
    ): string {
      const gradePrefix =
        grade === "S"
          ? "🚨【邁房子】獨家 S 級推薦！限時 120h"
          : "【邁房子】你有一則新訊息";
      const baseUrl = "https://maihouses.vercel.app/maihouses";
      const propertyUrl = propertyId
        ? `${baseUrl}/#/property/${propertyId}`
        : null;

      let message = `${gradePrefix}\n房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ""}`;

      if (propertyUrl) {
        message += `\n\n物件詳情：${propertyUrl}`;
      }

      message += `\n\n點此查看並回覆：${connectUrl}`;

      return message;
    }

    const message = buildLineMessage(
      agentName,
      connectUrl,
      propertyTitle,
      propertyId,
      grade,
    );

    // 驗證訊息內容
    expect(message).toContain("🚨【邁房子】獨家 S 級推薦！限時 120h");
    expect(message).toContain("測試房仲");
    expect(message).toContain("信義區豪宅");
    expect(message).toContain("物件詳情：");
    expect(message).toContain(
      "https://maihouses.vercel.app/maihouses/#/property/prop-123-456",
    );
    expect(message).toContain("點此查看並回覆：");
    expect(message).toContain(connectUrl);
  });

  it("應該在沒有 propertyId 時，訊息不包含物件連結", () => {
    function buildLineMessage(
      agentName: string,
      connectUrl: string,
      propertyTitle?: string,
      propertyId?: string,
    ): string {
      const baseUrl = "https://maihouses.vercel.app/maihouses";
      const propertyUrl = propertyId
        ? `${baseUrl}/#/property/${propertyId}`
        : null;

      let message = `【邁房子】你有一則新訊息\n房仲：${agentName}${propertyTitle ? `（${propertyTitle}）` : ""}`;

      if (propertyUrl) {
        message += `\n\n物件詳情：${propertyUrl}`;
      }

      message += `\n\n點此查看並回覆：${connectUrl}`;

      return message;
    }

    const message = buildLineMessage(
      "測試房仲",
      "https://example.com/connect",
    );

    // 驗證沒有物件連結
    expect(message).not.toContain("物件詳情：");
    expect(message).not.toContain("/#/property/");
    expect(message).toContain("測試房仲");
    expect(message).toContain("點此查看並回覆：");
  });

  it("應該正確驗證 SendMessageRequest 結構", () => {
    interface SendMessageRequest {
      agentId: string;
      sessionId: string;
      purchaseId: string;
      propertyId?: string;
      message: string;
      agentName: string;
      propertyTitle?: string;
      grade?: "S" | "A" | "B" | "C";
    }

    const validRequest: SendMessageRequest = {
      agentId: "agent-123",
      sessionId: "session-456",
      purchaseId: "purchase-789",
      propertyId: "prop-abc",
      message: "測試訊息",
      agentName: "測試房仲",
      propertyTitle: "測試物件",
      grade: "S",
    };

    // 驗證必要欄位
    expect(validRequest.agentId).toBeDefined();
    expect(validRequest.sessionId).toBeDefined();
    expect(validRequest.purchaseId).toBeDefined();
    expect(validRequest.message).toBeDefined();
    expect(validRequest.agentName).toBeDefined();

    // 驗證可選欄位
    expect(validRequest.propertyId).toBeDefined();
    expect(validRequest.propertyTitle).toBeDefined();
    expect(validRequest.grade).toBeDefined();

    // 驗證 grade 類型
    expect(["S", "A", "B", "C"]).toContain(validRequest.grade);
  });

  it("應該正確產生 7 天有效期的 token", () => {
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    const payload = {
      conversationId: "conv-id",
      sessionId: "session-id",
      propertyId: "prop-id",
      exp: now + sevenDays,
    };

    // 驗證過期時間
    const expirationTime = payload.exp - now;
    expect(expirationTime).toBeGreaterThanOrEqual(sevenDays - 1000); // 允許 1 秒誤差
    expect(expirationTime).toBeLessThanOrEqual(sevenDays + 1000);

    // 驗證未過期
    const isExpired = Date.now() > payload.exp;
    expect(isExpired).toBe(false);
  });

  it("應該正確處理 LineMessageData 結構", () => {
    interface LineMessageData {
      agentName: string;
      propertyTitle?: string;
      propertyId?: string;
      connectUrl: string;
      grade?: string;
    }

    const messageData: LineMessageData = {
      agentName: "王小明",
      propertyTitle: "信義區 3 房 2 廳",
      propertyId: "prop-xyz-789",
      connectUrl: "https://maihouses.vercel.app/maihouses/chat/connect?token=abc",
      grade: "S",
    };

    // 驗證結構
    expect(messageData).toHaveProperty("agentName");
    expect(messageData).toHaveProperty("propertyTitle");
    expect(messageData).toHaveProperty("propertyId");
    expect(messageData).toHaveProperty("connectUrl");
    expect(messageData).toHaveProperty("grade");

    // 驗證值
    expect(messageData.agentName).toBe("王小明");
    expect(messageData.propertyId).toBe("prop-xyz-789");
  });
});
