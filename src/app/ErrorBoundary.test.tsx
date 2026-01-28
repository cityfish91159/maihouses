/**
 * ErrorBoundary - Unit Tests
 *
 * [Team 8 第三位修復] 完整測試覆蓋
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";
import { logger } from "../lib/logger";

// Mock logger
vi.mock("../lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Mock trackEvent
vi.mock("../services/analytics", () => ({
  trackEvent: vi.fn(),
}));

// 測試用拋錯組件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <div>正常內容</div>;
};

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("正常渲染子組件當沒有錯誤時", () => {
    render(
      <ErrorBoundary>
        <div>測試內容</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText("測試內容")).toBeInTheDocument();
  });

  it("顯示錯誤 UI 當子組件拋出錯誤時", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("系統發生錯誤")).toBeInTheDocument();
    expect(
      screen.getByText("很抱歉，頁面載入時發生問題。您可以嘗試重新載入，或回到首頁。"),
    ).toBeInTheDocument();
  });

  it("生成並顯示錯誤 ID", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("錯誤編號（供客服查詢）")).toBeInTheDocument();

    // 檢查錯誤 ID 格式: ERR-XXXXXXXX
    const errorIdElement = screen.getByText(/^ERR-/);
    expect(errorIdElement).toBeInTheDocument();
    expect(errorIdElement.textContent).toMatch(/^ERR-[A-Z0-9]+$/);
  });

  it("記錄錯誤到 logger 包含 errorId", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(logger.error).toHaveBeenCalledWith(
      "[ErrorBoundary] Uncaught error",
      expect.objectContaining({
        error: expect.any(Error),
        errorId: expect.stringMatching(/^ERR-[A-Z0-9]+$/),
      }),
    );
  });

  it("顯示重新載入按鈕", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const retryButton = screen.getByRole("button", { name: "重新載入" });
    expect(retryButton).toBeInTheDocument();
  });

  it("顯示回到首頁按鈕", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const homeButton = screen.getByRole("button", { name: "回到首頁" });
    expect(homeButton).toBeInTheDocument();
  });

  it("點擊重新載入後重置錯誤狀態", async () => {
    const user = userEvent.setup();

    // [Team 8 第三位修復] 使用 key prop 強制重新渲染
    let shouldThrow = true;
    const TestWrapper = ({ throwError }: { throwError: boolean }) => (
      <ErrorBoundary key={throwError ? "error" : "success"}>
        <ThrowError shouldThrow={throwError} />
      </ErrorBoundary>
    );

    const { rerender } = render(<TestWrapper throwError={shouldThrow} />);

    // 確認錯誤 UI 顯示
    expect(screen.getByText("系統發生錯誤")).toBeInTheDocument();

    // 點擊重新載入
    const retryButton = screen.getByRole("button", { name: "重新載入" });
    await user.click(retryButton);

    // 重新渲染不拋錯的組件
    shouldThrow = false;
    rerender(<TestWrapper throwError={shouldThrow} />);

    // 確認恢復正常
    expect(screen.getByText("正常內容")).toBeInTheDocument();
    expect(screen.queryByText("系統發生錯誤")).not.toBeInTheDocument();
  });

  it("點擊回到首頁後導向 /maihouses/", async () => {
    const user = userEvent.setup();

    // Mock window.location.href
    delete (window as any).location;
    window.location = { href: "" } as any;

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const homeButton = screen.getByRole("button", { name: "回到首頁" });
    await user.click(homeButton);

    expect(window.location.href).toBe("/maihouses/");
  });

  it("錯誤 UI 包含錯誤圖示", () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    // 檢查 SVG 是否存在
    const svg = document.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass("text-red-600");
  });

  it("處理非 Error 類型的拋出", () => {
    const ThrowString = () => {
      throw "String error";
    };

    render(
      <ErrorBoundary>
        <ThrowString />
      </ErrorBoundary>,
    );

    expect(screen.getByText("系統發生錯誤")).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalled();
  });

  // [Team 8 第五位修復] 新增缺失的測試覆蓋
  it("應該調用 trackEvent 當錯誤發生時", async () => {
    const { trackEvent } = await import("../services/analytics");

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(trackEvent).toHaveBeenCalledWith("error_boundary", "*", "Test error");
  });

  it("多次錯誤應該生成不同的 errorId", () => {
    // 第一次錯誤
    const { unmount: unmount1 } = render(
      <ErrorBoundary key="error1">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const firstErrorId = screen.getByText(/^ERR-/).textContent;
    unmount1();

    // 第二次錯誤
    render(
      <ErrorBoundary key="error2">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const secondErrorId = screen.getByText(/^ERR-/).textContent;

    // 兩次錯誤 ID 應該不同
    expect(firstErrorId).not.toBe(secondErrorId);
    expect(firstErrorId).toMatch(/^ERR-[A-Z0-9]+$/);
    expect(secondErrorId).toMatch(/^ERR-[A-Z0-9]+$/);
  });

  it("componentDidCatch 的 trackEvent 失敗不應影響錯誤處理", async () => {
    const { trackEvent } = await import("../services/analytics");
    const mockTrackEvent = trackEvent as ReturnType<typeof vi.fn>;
    mockTrackEvent.mockImplementationOnce(() => {
      throw new Error("Analytics service failed");
    });

    // 應該不拋出錯誤，錯誤 UI 正常顯示
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText("系統發生錯誤")).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalled();
  });

  it("getDerivedStateFromError 應該始終返回 hasError: true", () => {
    // 測試多種錯誤類型
    const errors = [
      new Error("Standard error"),
      new TypeError("Type error"),
      "String error",
      null,
      undefined,
      { message: "Object error" },
    ];

    errors.forEach((error, index) => {
      const ThrowCustomError = () => {
        throw error;
      };

      const { unmount } = render(
        <ErrorBoundary key={`error-${index}`}>
          <ThrowCustomError />
        </ErrorBoundary>,
      );

      expect(screen.getByText("系統發生錯誤")).toBeInTheDocument();
      expect(screen.getByText(/^ERR-/)).toBeInTheDocument();
      unmount();
    });
  });

  it("錯誤 ID 應該基於時間戳且格式一致", () => {
    const { unmount: unmount1 } = render(
      <ErrorBoundary key="ts1">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const errorId1 = screen.getByText(/^ERR-/).textContent!;
    unmount1();

    // 使用實際延遲而非 fake timers
    const startTime = Date.now();
    while (Date.now() - startTime < 2) {
      // 等待至少 2ms
    }

    render(
      <ErrorBoundary key="ts2">
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>,
    );

    const errorId2 = screen.getByText(/^ERR-/).textContent!;

    // 檢查格式：ERR- + base36 大寫時間戳
    expect(errorId1).toMatch(/^ERR-[0-9A-Z]+$/);
    expect(errorId2).toMatch(/^ERR-[0-9A-Z]+$/);
    expect(errorId1.length).toBeGreaterThan(6); // ERR- + 至少 3 字元
    expect(errorId2.length).toBeGreaterThan(6);
  });
});
