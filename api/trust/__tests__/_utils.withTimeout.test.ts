/**
 * withTimeout Function - Unit Tests
 *
 * [Team 8 第三位修復] 測試 timeout 工具函數
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock environment variables before importing _utils
process.env.SUPABASE_URL = "https://test.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "test-key";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.SYSTEM_API_KEY = "test-system-key";

// Mock logger before importing _utils
vi.mock("../../lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock @supabase/supabase-js to prevent actual connection
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({})),
}));

// Import after mocking
const { withTimeout } = await import("../_utils");

describe("withTimeout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("應該在 Promise 成功完成時返回結果", async () => {
    const promise = Promise.resolve("成功結果");

    const resultPromise = withTimeout(promise, 1000);
    const result = await resultPromise;

    expect(result).toBe("成功結果");
  });

  it("應該在 Promise 失敗時拋出原始錯誤", async () => {
    const error = new Error("原始錯誤");
    const promise = Promise.reject(error);

    await expect(withTimeout(promise, 1000)).rejects.toThrow("原始錯誤");
  });

  it("應該在超時時拋出 timeout 錯誤", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve("延遲結果"), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000, "操作超時");

    // 快進到 timeout
    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow("操作超時");
  });

  it("應該使用預設錯誤訊息當未提供時", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve("延遲結果"), 2000);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow("Operation timed out");
  });

  it("應該清除 timeout 當 Promise 成功完成", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const promise = Promise.resolve("快速結果");
    await withTimeout(promise, 1000);

    // clearTimeout 應該被呼叫
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("應該清除 timeout 當 Promise 失敗", async () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

    const promise = Promise.reject(new Error("快速失敗"));

    try {
      await withTimeout(promise, 1000);
    } catch {
      // 預期的錯誤
    }

    // clearTimeout 應該被呼叫
    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it("應該處理非常短的 timeout (邊界條件)", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve("結果"), 100);
    });

    const timeoutPromise = withTimeout(promise, 10);

    vi.advanceTimersByTime(10);

    await expect(timeoutPromise).rejects.toThrow("Operation timed out");
  });

  it("應該處理非常長的 Promise (長時間運行)", async () => {
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve("長時間結果"), 100000);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    vi.advanceTimersByTime(1000);

    await expect(timeoutPromise).rejects.toThrow();
  });

  it("應該處理同時完成的 Promise 和 timeout (競態條件)", async () => {
    // [Team 8 第三位修復] Promise.race 在 vitest fake timers 下行為不確定
    // Promise 在 1000ms 完成，timeout 也在 1000ms，行為取決於事件循環順序
    const promise = new Promise((resolve) => {
      setTimeout(() => resolve("競態結果"), 999);
    });

    const timeoutPromise = withTimeout(promise, 1000);

    // 快進到 999ms（Promise 完成但 timeout 未觸發）
    vi.advanceTimersByTime(999);

    // Promise 應該先完成
    await expect(timeoutPromise).resolves.toBe("競態結果");
  });

  it("應該處理 Promise 返回 undefined", async () => {
    const promise = Promise.resolve(undefined);

    const result = await withTimeout(promise, 1000);

    expect(result).toBeUndefined();
  });

  it("應該處理 Promise 返回 null", async () => {
    const promise = Promise.resolve(null);

    const result = await withTimeout(promise, 1000);

    expect(result).toBeNull();
  });

  it("應該處理複雜物件返回值", async () => {
    const complexObject = {
      data: [1, 2, 3],
      nested: { key: "value" },
      fn: () => "test",
    };

    const promise = Promise.resolve(complexObject);

    const result = await withTimeout(promise, 1000);

    expect(result).toEqual(complexObject);
  });

  // [Team 8 第五位修復] 新增真實 async 測試（不用 fake timers）
  describe("真實 async 場景（不使用 fake timers）", () => {
    beforeEach(() => {
      vi.useRealTimers(); // 恢復真實 timers
    });

    afterEach(() => {
      vi.useFakeTimers(); // 恢復 fake timers for 其他測試
    });

    it("應該在真實 Promise 完成時返回結果", async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("真實結果"), 10);
      });

      const result = await withTimeout(promise, 100);

      expect(result).toBe("真實結果");
    });

    it("應該在真實 Promise 超時時拋出錯誤", async () => {
      const promise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("延遲結果"), 200);
      });

      await expect(withTimeout(promise, 50, "真實超時")).rejects.toThrow("真實超時");
    });

    it("應該處理真實的異步操作競態", async () => {
      // 模擬真實的 API 調用場景
      const fastPromise = new Promise<string>((resolve) => {
        setTimeout(() => resolve("快速回應"), 20);
      });

      const result = await withTimeout(fastPromise, 100);

      expect(result).toBe("快速回應");
    });
  });
});
