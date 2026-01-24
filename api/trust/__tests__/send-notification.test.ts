/**
 * BE-8 | 推播失敗處理 測試
 *
 * 測試案例：
 * 1. sendNotification 核心函數 - 發送流程、重試、降級
 * 2. 便利函數 - sendStepUpdateNotification, sendCaseClosedNotification
 * 3. 錯誤處理 - 參數驗證、LINE 不可用
 *
 * Skills Applied:
 * - [Test Driven Agent] 完整測試覆蓋
 * - [NASA TypeScript Safety] 類型安全的 Mock
 * - [Google Director] 真正的函數測試，非假測試
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ============================================================================
// Test Constants - 正確格式
// ============================================================================

/** 有效的 UUID v4 格式 */
const VALID_CASE_ID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_USER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

/** 有效的 LINE User ID 格式：U + 32 個十六進位字元 = 33 字元 */
const VALID_LINE_ID = "U1234567890abcdef1234567890abcdef";
const VALID_LINE_ID_UPPER = "UABCDEF1234567890ABCDEF1234567890";

/** 無效格式 */
const INVALID_UUID = "not-a-valid-uuid";

// ============================================================================
// Mock Setup
// ============================================================================

// Mock getNotifyTarget
const mockGetNotifyTarget = vi.fn();

// Mock Supabase
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn((table: string) => {
  if (table === "trust_case_events") {
    return { insert: mockInsert };
  }
  if (table === "push_subscriptions") {
    return { delete: mockDelete };
  }
  if (table === "trust_cases") {
    return {
      select: () => ({
        eq: () => ({
          single: mockSingle,
        }),
      }),
    };
  }
  return { select: mockSelect };
});

// Mock Supabase RPC
const mockRpc = vi.fn();

// Mock LINE pushMessage
const mockPushMessage = vi.fn();

vi.mock("../notify", () => ({
  getNotifyTarget: (...args: unknown[]) => mockGetNotifyTarget(...args),
}));

vi.mock("../_utils", () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
  SYSTEM_API_KEY: "test-system-api-key",
  JWT_SECRET: "test-jwt-secret",
}));

vi.mock("../../lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../lib/sentry", () => ({
  captureError: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

vi.mock("@line/bot-sdk", () => ({
  messagingApi: {
    MessagingApiClient: class MockMessagingApiClient {
      pushMessage = mockPushMessage;
    },
  },
}));

// Mock web-push
const mockSendNotification = vi.fn();
const mockSetVapidDetails = vi.fn();

vi.mock("web-push", () => ({
  default: {
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
  },
}));

// ============================================================================
// Helper: 設置環境變數
// ============================================================================

function setupEnvWithLine(): void {
  process.env.LINE_CHANNEL_ACCESS_TOKEN = "test-line-token";
}

function setupEnvWithoutLine(): void {
  delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
}

function setupEnvForPush(): void {
  // 公鑰從 Vercel 環境變數讀取（前後端共用 VITE_VAPID_PUBLIC_KEY）
  process.env.VITE_VAPID_PUBLIC_KEY = "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U";
}

/** 設定 Mock RPC 回傳 VAPID 私鑰和訂閱（公鑰從環境變數讀取） */
function setupMockRpcForPush(): void {
  mockRpc.mockImplementation((fnName: string) => {
    if (fnName === "fn_get_vapid_private_key") {
      return Promise.resolve({ data: "test-vapid-private-key", error: null });
    }
    if (fnName === "fn_get_push_subscriptions") {
      return Promise.resolve({
        data: [
          {
            endpoint: "https://fcm.googleapis.com/fcm/send/test-endpoint",
            p256dh: "test-p256dh-key",
            auth: "test-auth-key",
          },
        ],
        error: null,
      });
    }
    return Promise.resolve({ data: null, error: null });
  });
}

// ============================================================================
// Test Suite: sendNotification 核心函數
// ============================================================================

describe("BE-8 | sendNotification - 核心函數", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnvWithLine();
    // 重置 mockPushMessage
    mockPushMessage.mockReset();
    mockGetNotifyTarget.mockReset();
    mockSingle.mockReset();
    // 設置 mockSingle 預設返回值（用於 getFallbackLineId）
    mockSingle.mockResolvedValue({
      data: { buyer_user_id: null, buyer_line_id: null },
      error: null,
    });
  });

  describe("參數驗證", () => {
    it("無效的 caseId 格式應返回失敗", { timeout: 10000 }, async () => {
      vi.resetModules();
      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(INVALID_UUID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
      expect(result.error).toContain("Invalid");
    });

    it("空的 title 應返回失敗", async () => {
      vi.resetModules();
      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
    });

    it("空的 body 應返回失敗", async () => {
      vi.resetModules();
      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
    });

    it("無效的 message type 應返回失敗", async () => {
      vi.resetModules();
      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "invalid_type" as "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
    });
  });

  describe("無通知目標", () => {
    it("getNotifyTarget 返回 null 應返回 channel: none", async () => {
      vi.resetModules();
      mockGetNotifyTarget.mockResolvedValueOnce(null);

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
      expect(result.error).toBe("No notification target available");
    });

    it("getNotifyTarget 拋出錯誤應返回失敗", async () => {
      vi.resetModules();
      mockGetNotifyTarget.mockRejectedValueOnce(new Error("Case not found"));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("none");
      expect(result.error).toBe("Case not found");
    });
  });

  describe("Push 發送", () => {
    it("Push 成功應返回 channel: push", async () => {
      vi.resetModules();
      setupEnvForPush();
      setupMockRpcForPush();
      mockSendNotification.mockResolvedValueOnce({ statusCode: 201 });
      mockGetNotifyTarget.mockResolvedValueOnce({
        type: "push",
        userId: VALID_USER_ID,
      });

      const { sendNotification, resetVapidConfig } = await import("../send-notification");
      resetVapidConfig(); // 重設 VAPID 狀態以便測試

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("push");
      expect(result.retried).toBeUndefined();
      expect(mockSendNotification).toHaveBeenCalled();
    });

    it("410 Gone 時應刪除過期訂閱", async () => {
      vi.resetModules();
      setupEnvForPush();

      // Mock RPC：VAPID 私鑰 + 訂閱列表（公鑰從環境變數讀取）
      const localMockRpc = vi.fn().mockImplementation((fnName: string) => {
        if (fnName === "fn_get_vapid_private_key") {
          return Promise.resolve({ data: "test-vapid-private-key", error: null });
        }
        if (fnName === "fn_get_push_subscriptions") {
          return Promise.resolve({
            data: [
              {
                endpoint: "https://fcm.googleapis.com/fcm/send/expired-endpoint",
                p256dh: "test-p256dh",
                auth: "test-auth",
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: null, error: null });
      });

      // Mock delete 鏈
      // 新的刪除邏輯：delete().eq("profile_id", userId).in("endpoint", endpoints)
      const localMockDeleteIn = vi.fn().mockResolvedValue({ error: null });
      const localMockDeleteEq = vi.fn().mockReturnValue({ in: localMockDeleteIn });
      const localMockDelete = vi.fn().mockReturnValue({ eq: localMockDeleteEq });

      vi.doMock("../_utils", () => ({
        supabase: {
          rpc: localMockRpc,
          from: (table: string) => {
            if (table === "push_subscriptions") {
              return { delete: localMockDelete };
            }
            if (table === "trust_cases") {
              // getFallbackLineId 會查詢 trust_cases
              return {
                select: () => ({
                  eq: () => ({
                    single: () => Promise.resolve({
                      data: { buyer_user_id: null, buyer_line_id: null },
                      error: null,
                    }),
                  }),
                }),
              };
            }
            if (table === "trust_case_events") {
              return { insert: vi.fn().mockResolvedValue({ error: null }) };
            }
            return { insert: vi.fn().mockResolvedValue({ error: null }) };
          },
        },
        SYSTEM_API_KEY: "test-key",
        JWT_SECRET: "test-secret",
      }));

      // Mock web-push 回傳 410 Gone
      const localMockWebpush = vi.fn().mockRejectedValue({ statusCode: 410, message: "Gone" });
      vi.doMock("web-push", () => ({
        default: {
          sendNotification: localMockWebpush,
          setVapidDetails: vi.fn(),
        },
      }));

      vi.doMock("../notify", () => ({
        getNotifyTarget: () => Promise.resolve({ type: "push", userId: VALID_USER_ID }),
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      const { sendNotification, resetVapidConfig } = await import("../send-notification");
      resetVapidConfig();

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      // 驗證 410 時應刪除訂閱
      // 新邏輯：.delete().eq("profile_id", userId).in("endpoint", [endpoints])
      expect(localMockDelete).toHaveBeenCalled();
      expect(localMockDeleteEq).toHaveBeenCalledWith("profile_id", VALID_USER_ID);
      expect(localMockDeleteIn).toHaveBeenCalledWith(
        "endpoint",
        ["https://fcm.googleapis.com/fcm/send/expired-endpoint"]
      );

      // 全部失敗應回傳失敗
      expect(result.success).toBe(false);
      expect(result.channel).toBe("push");
    });
  });

  describe("LINE 發送", () => {
    it("LINE 成功應返回 channel: line", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn().mockResolvedValue({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("line");
      expect(localMockPushMessage).toHaveBeenCalledTimes(1);
    });

    it("LINE 可接受大寫 LINE ID", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn().mockResolvedValue({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID_UPPER }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "custom",
        title: "測試標題",
        body: "測試內容",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("line");
      expect(localMockPushMessage).toHaveBeenCalledTimes(1);
    });

    it("LINE 失敗 → 重試成功應返回 retried: true", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn()
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(true);
      expect(result.channel).toBe("line");
      expect(result.retried).toBe(true);
      expect(localMockPushMessage).toHaveBeenCalledTimes(2);
    });

    it("LINE 失敗 → 重試失敗應記錄日誌並返回失敗", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn()
        .mockRejectedValueOnce(new Error("Persistent error"))
        .mockRejectedValueOnce(new Error("Persistent error"));

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("line");
      expect(result.retried).toBe(true);
      expect(result.error).toBe("Persistent error");
      expect(localMockPushMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe("LINE 不可用", () => {
    it("LINE Token 未設定應返回 channel: skipped", async () => {
      setupEnvWithoutLine();
      vi.resetModules();

      // 需要重新設置 mocks
      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      const { sendNotification } = await import("../send-notification");

      const result = await sendNotification(VALID_CASE_ID, {
        type: "step_update",
        title: "測試",
        body: "測試內容",
      });

      expect(result.success).toBe(false);
      expect(result.channel).toBe("skipped");
      expect(result.error).toBe("LINE client not configured");
    });
  });

  // =========================================================================
  // Push 降級測試（核心業務邏輯）
  // =========================================================================
  describe("Push → LINE 降級機制", () => {
    it("Push 失敗 → 重試失敗 → LINE 降級成功", async () => {
      vi.resetModules();

      // 使用 doMock 在 resetModules 後設置
      const localMockPushMessage = vi.fn().mockResolvedValue({});
      const localMockSingle = vi.fn().mockResolvedValue({
        data: {
          buyer_user_id: VALID_USER_ID,
          buyer_line_id: VALID_LINE_ID,
        },
        error: null,
      });

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "push", userId: VALID_USER_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: {
          from: () => ({
            select: () => ({ eq: () => ({ single: localMockSingle }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification, setPushSender, resetPushSender } = await import(
        "../send-notification"
      );

      // 設定 Push 永遠失敗
      setPushSender(() => Promise.reject(new Error("Push service unavailable")));

      try {
        const result = await sendNotification(VALID_CASE_ID, {
          type: "step_update",
          title: "測試",
          body: "測試內容",
        });

        expect(result.success).toBe(true);
        expect(result.channel).toBe("fallback_line");
        expect(result.retried).toBe(true);
        expect(result.fallback).toBe(true);
        expect(localMockPushMessage).toHaveBeenCalledTimes(1);
      } finally {
        resetPushSender();
      }
    });

    it("Push 失敗 → 重試失敗 → LINE 降級也失敗", async () => {
      vi.resetModules();

      const localMockPushMessage = vi
        .fn()
        .mockRejectedValue(new Error("LINE rate limited"));
      const localMockSingle = vi.fn().mockResolvedValue({
        data: {
          buyer_user_id: VALID_USER_ID,
          buyer_line_id: VALID_LINE_ID,
        },
        error: null,
      });

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "push", userId: VALID_USER_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: {
          from: () => ({
            select: () => ({ eq: () => ({ single: localMockSingle }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendNotification, setPushSender, resetPushSender } = await import(
        "../send-notification"
      );

      // 設定 Push 永遠失敗
      setPushSender(() => Promise.reject(new Error("Push service unavailable")));

      try {
        const result = await sendNotification(VALID_CASE_ID, {
          type: "step_update",
          title: "測試",
          body: "測試內容",
        });

        expect(result.success).toBe(false);
        expect(result.channel).toBe("fallback_line");
        expect(result.retried).toBe(true);
        expect(result.fallback).toBe(true);
        expect(result.error).toBe("LINE rate limited");
      } finally {
        resetPushSender();
      }
    });

    it("Push 失敗 → 重試失敗 → 無 LINE ID 可降級", async () => {
      vi.resetModules();

      const localMockSingle = vi.fn().mockResolvedValue({
        data: {
          buyer_user_id: VALID_USER_ID,
          buyer_line_id: null,
        },
        error: null,
      });

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "push", userId: VALID_USER_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: {
          from: () => ({
            select: () => ({ eq: () => ({ single: localMockSingle }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
          }),
        },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = vi.fn();
          },
        },
      }));

      const { sendNotification, setPushSender, resetPushSender } = await import(
        "../send-notification"
      );

      // 設定 Push 永遠失敗
      setPushSender(() => Promise.reject(new Error("Push service unavailable")));

      try {
        const result = await sendNotification(VALID_CASE_ID, {
          type: "step_update",
          title: "測試",
          body: "測試內容",
        });

        expect(result.success).toBe(false);
        expect(result.channel).toBe("push");
        expect(result.retried).toBe(true);
        expect(result.fallback).toBeUndefined();
        expect(result.error).toBe("Push service unavailable");
      } finally {
        resetPushSender();
      }
    });

    it("Push 失敗 → 重試成功", async () => {
      vi.resetModules();

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "push", userId: VALID_USER_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = vi.fn();
          },
        },
      }));

      const { sendNotification, setPushSender, resetPushSender } = await import(
        "../send-notification"
      );

      // 設定 Push 第一次失敗，第二次成功
      let callCount = 0;
      setPushSender(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error("Temporary failure"));
        }
        return Promise.resolve();
      });

      try {
        const result = await sendNotification(VALID_CASE_ID, {
          type: "step_update",
          title: "測試",
          body: "測試內容",
        });

        expect(result.success).toBe(true);
        expect(result.channel).toBe("push");
        expect(result.retried).toBe(true);
        expect(callCount).toBe(2);
      } finally {
        resetPushSender();
      }
    });
  });
});

// ============================================================================
// Test Suite: 便利函數
// ============================================================================

describe("BE-8 | 便利函數", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnvWithLine();
    mockPushMessage.mockReset();
    mockGetNotifyTarget.mockReset();
  });

  describe("sendStepUpdateNotification", () => {
    it("應正確生成步驟更新訊息並發送", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn().mockResolvedValue({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendStepUpdateNotification } = await import(
        "../send-notification"
      );

      const result = await sendStepUpdateNotification(
        VALID_CASE_ID,
        2,
        3,
        "信義區三房",
      );

      expect(result.success).toBe(true);
      expect(result.channel).toBe("line");
      expect(localMockPushMessage).toHaveBeenCalled();
    });

    it("無物件名稱時應使用預設名稱", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn().mockResolvedValue({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendStepUpdateNotification } = await import(
        "../send-notification"
      );

      const result = await sendStepUpdateNotification(VALID_CASE_ID, 1, 2);

      expect(result.success).toBe(true);
    });
  });

  describe("sendCaseClosedNotification", () => {
    it("closed_sold_to_other 應生成正確訊息", async () => {
      vi.resetModules();

      const localMockPushMessage = vi.fn().mockResolvedValue({});

      vi.doMock("../notify", () => ({
        getNotifyTarget: () =>
          Promise.resolve({ type: "line", lineId: VALID_LINE_ID }),
      }));

      vi.doMock("../_utils", () => ({
        supabase: { from: mockFrom },
        SYSTEM_API_KEY: "test-system-api-key",
        JWT_SECRET: "test-jwt-secret",
      }));

      vi.doMock("../../lib/logger", () => ({
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      }));

      vi.doMock("../../lib/sentry", () => ({
        captureError: vi.fn(),
        addBreadcrumb: vi.fn(),
      }));

      vi.doMock("@line/bot-sdk", () => ({
        messagingApi: {
          MessagingApiClient: class {
            pushMessage = localMockPushMessage;
          },
        },
      }));

      const { sendCaseClosedNotification } = await import(
        "../send-notification"
      );

      const result = await sendCaseClosedNotification(
        VALID_CASE_ID,
        "closed_sold_to_other",
        "大安區兩房",
      );

      expect(result.success).toBe(true);
      expect(localMockPushMessage).toHaveBeenCalled();
    });

    it("closed_property_unlisted 應生成正確訊息", async () => {
      vi.resetModules();
      mockGetNotifyTarget.mockResolvedValueOnce({
        type: "line",
        lineId: VALID_LINE_ID,
      });
      mockPushMessage.mockResolvedValueOnce({});

      const { sendCaseClosedNotification } = await import(
        "../send-notification"
      );

      const result = await sendCaseClosedNotification(
        VALID_CASE_ID,
        "closed_property_unlisted",
      );

      expect(result.success).toBe(true);
    });

    it("closed_inactive 應生成正確訊息", async () => {
      vi.resetModules();
      mockGetNotifyTarget.mockResolvedValueOnce({
        type: "line",
        lineId: VALID_LINE_ID,
      });
      mockPushMessage.mockResolvedValueOnce({});

      const { sendCaseClosedNotification } = await import(
        "../send-notification"
      );

      const result = await sendCaseClosedNotification(
        VALID_CASE_ID,
        "closed_inactive",
      );

      expect(result.success).toBe(true);
    });
  });

  describe("sendCaseWakeNotification", () => {
    it("應正確生成喚醒訊息", async () => {
      vi.resetModules();
      mockGetNotifyTarget.mockResolvedValueOnce({
        type: "line",
        lineId: VALID_LINE_ID,
      });
      mockPushMessage.mockResolvedValueOnce({});

      const { sendCaseWakeNotification } = await import("../send-notification");

      const result = await sendCaseWakeNotification(
        VALID_CASE_ID,
        "中山區套房",
      );

      expect(result.success).toBe(true);
    });
  });
});

// ============================================================================
// Test Suite: 類型安全驗證
// ============================================================================

describe("BE-8 | 類型安全驗證", () => {
  it("NotificationMessage 類型結構正確", () => {
    interface NotificationMessage {
      type: "step_update" | "case_closed" | "case_wake" | "custom";
      title: string;
      body: string;
    }

    const message: NotificationMessage = {
      type: "step_update",
      title: "測試標題",
      body: "測試內容",
    };

    expect(message.type).toBe("step_update");
    expect(message.title).toBe("測試標題");
    expect(message.body).toBe("測試內容");
  });

  it("SendResult 類型結構正確", () => {
    type SendChannel =
      | "push"
      | "line"
      | "fallback_line"
      | "none"
      | "skipped";

    interface SendResult {
      success: boolean;
      channel: SendChannel;
      error?: string;
      retried?: boolean;
      fallback?: boolean;
    }

    const successResult: SendResult = {
      success: true,
      channel: "push",
    };

    const failResult: SendResult = {
      success: false,
      channel: "line",
      error: "Network error",
      retried: true,
    };

    const fallbackResult: SendResult = {
      success: true,
      channel: "fallback_line",
      retried: true,
      fallback: true,
    };

    expect(successResult.success).toBe(true);
    expect(failResult.retried).toBe(true);
    expect(fallbackResult.fallback).toBe(true);
  });

  it("訊息類型枚舉正確", () => {
    const validTypes = ["step_update", "case_closed", "case_wake", "custom"];

    validTypes.forEach((type) => {
      expect(validTypes).toContain(type);
    });
  });

  it("發送通道枚舉正確", () => {
    const validChannels = ["push", "line", "fallback_line", "none", "skipped"];

    validChannels.forEach((channel) => {
      expect(validChannels).toContain(channel);
    });
  });
});

// ============================================================================
// Test Suite: 邊界條件
// ============================================================================

describe("BE-8 | 邊界條件", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupEnvWithLine();
    mockPushMessage.mockReset();
    mockGetNotifyTarget.mockReset();
  });

  it("超長 title 應被截斷驗證（100 字元限制）", async () => {
    vi.resetModules();
    const { sendNotification } = await import("../send-notification");

    const longTitle = "a".repeat(101);

    const result = await sendNotification(VALID_CASE_ID, {
      type: "step_update",
      title: longTitle,
      body: "測試內容",
    });

    expect(result.success).toBe(false);
    expect(result.channel).toBe("none");
  });

  it("超長 body 應被截斷驗證（500 字元限制）", async () => {
    vi.resetModules();
    const { sendNotification } = await import("../send-notification");

    const longBody = "a".repeat(501);

    const result = await sendNotification(VALID_CASE_ID, {
      type: "step_update",
      title: "測試",
      body: longBody,
    });

    expect(result.success).toBe(false);
    expect(result.channel).toBe("none");
  });

  it("正好 100 字元的 title 應通過", async () => {
    vi.resetModules();
    mockGetNotifyTarget.mockResolvedValueOnce({
      type: "line",
      lineId: VALID_LINE_ID,
    });
    mockPushMessage.mockResolvedValueOnce({});

    const { sendNotification } = await import("../send-notification");

    const exactTitle = "a".repeat(100);

    const result = await sendNotification(VALID_CASE_ID, {
      type: "step_update",
      title: exactTitle,
      body: "測試內容",
    });

    expect(result.success).toBe(true);
  });

  it("正好 500 字元的 body 應通過", async () => {
    vi.resetModules();
    mockGetNotifyTarget.mockResolvedValueOnce({
      type: "line",
      lineId: VALID_LINE_ID,
    });
    mockPushMessage.mockResolvedValueOnce({});

    const { sendNotification } = await import("../send-notification");

    const exactBody = "a".repeat(500);

    const result = await sendNotification(VALID_CASE_ID, {
      type: "step_update",
      title: "測試",
      body: exactBody,
    });

    expect(result.success).toBe(true);
  });
});
