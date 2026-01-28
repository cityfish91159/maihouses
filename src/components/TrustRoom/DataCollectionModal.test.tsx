/**
 * DataCollectionModal - Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DataCollectionModal } from "./DataCollectionModal";

describe("DataCollectionModal", () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("不顯示當 isOpen 為 false", () => {
    const { container } = render(
      <DataCollectionModal
        isOpen={false}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("顯示當 isOpen 為 true", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );
    expect(
      screen.getByText("請填寫基本資料以保全交易過程全貌"),
    ).toBeInTheDocument();
  });

  it("顯示必填欄位標記", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );
    const requiredMarks = screen.getAllByText("*");
    expect(requiredMarks.length).toBeGreaterThanOrEqual(2); // 姓名和電話
  });

  it("呼叫 onSkip 當點擊稍後再說按鈕", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );
    const skipButton = screen.getByText("稍後再說");
    fireEvent.click(skipButton);
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it("呼叫 onSkip 當點擊關閉按鈕", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );
    const closeButton = screen.getByLabelText("關閉");
    fireEvent.click(closeButton);
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it("驗證必填欄位 - 姓名為空", async () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    const phoneInput = screen.getByPlaceholderText("0912-345-678");
    fireEvent.change(phoneInput, { target: { value: "0912345678" } });

    const submitButton = screen.getByText("送出");
    fireEvent.click(submitButton);

    // HTML5 validation 會阻止表單提交
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("驗證必填欄位 - 電話為空", async () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    const nameInput = screen.getByPlaceholderText("請輸入您的姓名");
    fireEvent.change(nameInput, { target: { value: "測試用戶" } });

    const submitButton = screen.getByText("送出");
    fireEvent.click(submitButton);

    // HTML5 validation 會阻止表單提交
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("成功送出表單 - 只填寫必填欄位", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    const nameInput = screen.getByPlaceholderText("請輸入您的姓名");
    const phoneInput = screen.getByPlaceholderText("0912-345-678");

    fireEvent.change(nameInput, { target: { value: "測試用戶" } });
    fireEvent.change(phoneInput, { target: { value: "0912345678" } });

    const submitButton = screen.getByText("送出");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "測試用戶",
      phone: "0912345678",
      email: "",
    });
  });

  it("成功送出表單 - 包含選填的 Email", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    const nameInput = screen.getByPlaceholderText("請輸入您的姓名");
    const phoneInput = screen.getByPlaceholderText("0912-345-678");
    const emailInput = screen.getByPlaceholderText(
      "example@email.com (選填)",
    );

    fireEvent.change(nameInput, { target: { value: "測試用戶" } });
    fireEvent.change(phoneInput, { target: { value: "0912345678" } });
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    const submitButton = screen.getByText("送出");
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: "測試用戶",
      phone: "0912345678",
      email: "test@example.com",
    });
  });

  it("送出時禁用按鈕當 isSubmitting 為 true", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isSubmitting={true}
      />,
    );

    const submitButton = screen.getByText("送出中...");
    const skipButton = screen.getByText("稍後再說");
    const closeButton = screen.getByLabelText("關閉");

    expect(submitButton).toBeDisabled();
    expect(skipButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it("顯示隱私說明", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    expect(
      screen.getByText("此資訊僅供法律留痕使用，不會公開給房仲"),
    ).toBeInTheDocument();
  });

  it("有正確的 ARIA 屬性", () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "data-collection-title");
  });
});
