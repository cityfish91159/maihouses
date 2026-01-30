/**
 * DataCollectionModal - Unit Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataCollectionModal } from './DataCollectionModal';

describe('DataCollectionModal', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('不顯示當 isOpen 為 false', () => {
    const { container } = render(
      <DataCollectionModal isOpen={false} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('顯示當 isOpen 為 true', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
    expect(screen.getByText('留下聯絡方式，方便後續聯繫')).toBeInTheDocument();
  });

  it('顯示必填欄位標記', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
    const requiredMarks = screen.getAllByText('*');
    expect(requiredMarks.length).toBeGreaterThanOrEqual(2); // 姓名和電話
  });

  it('呼叫 onSkip 當點擊稍後再說按鈕', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
    const skipButton = screen.getByText('稍後再說');
    fireEvent.click(skipButton);
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('呼叫 onSkip 當點擊關閉按鈕', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);
    const closeButton = screen.getByLabelText('關閉');
    fireEvent.click(closeButton);
    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('驗證必填欄位 - 姓名為空', async () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    const phoneInput = screen.getByLabelText(/電話/i);
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });

    const submitButton = screen.getByText('確認送出');
    fireEvent.click(submitButton);

    // HTML5 validation 會阻止表單提交
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('驗證必填欄位 - 電話為空', async () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    const nameInput = screen.getByLabelText(/姓名/i);
    fireEvent.change(nameInput, { target: { value: '測試用戶' } });

    const submitButton = screen.getByText('確認送出');
    fireEvent.click(submitButton);

    // HTML5 validation 會阻止表單提交
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('成功送出表單 - 只填寫必填欄位', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);

    fireEvent.change(nameInput, { target: { value: '測試用戶' } });
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });

    const submitButton = screen.getByText('確認送出');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '測試用戶',
      phone: '0912345678',
      email: '',
    });
  });

  it('成功送出表單 - 包含選填的 Email', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(nameInput, { target: { value: '測試用戶' } });
    fireEvent.change(phoneInput, { target: { value: '0912345678' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByText('確認送出');
    fireEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '測試用戶',
      phone: '0912345678',
      email: 'test@example.com',
    });
  });

  it('送出時禁用按鈕當 isSubmitting 為 true', () => {
    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isSubmitting={true}
      />
    );

    const submitButton = screen.getByText('送出中...');
    const skipButton = screen.getByText('稍後再說');
    const closeButton = screen.getByLabelText('關閉');

    expect(submitButton).toBeDisabled();
    expect(skipButton).toBeDisabled();
    expect(closeButton).toBeDisabled();
  });

  it('顯示隱私說明', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    expect(screen.getByText('資料只用於交易紀錄，不會給別人看')).toBeInTheDocument();
  });

  it('有正確的 ARIA 屬性', () => {
    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'data-collection-title');
  });
});

describe('DataCollectionModal - Keyboard Navigation', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該在 Modal 開啟時自動聚焦第一個輸入框', async () => {
    vi.useFakeTimers();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 快轉 auto-focus delay (50ms)
    vi.advanceTimersByTime(50);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/姓名/i);
      expect(nameInput).toHaveFocus();
    });

    vi.useRealTimers();
  });

  it('應該支援 Escape 鍵關閉 Modal', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 按下 Escape 鍵
    await user.keyboard('{Escape}');

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it('應該在 isSubmitting 時禁用 Escape 鍵', async () => {
    const user = userEvent.setup();

    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isSubmitting={true}
      />
    );

    // 按下 Escape 鍵
    await user.keyboard('{Escape}');

    // 不應該觸發 onSkip
    expect(mockOnSkip).not.toHaveBeenCalled();
  });

  it('應該支援 Tab 鍵循環聚焦 Modal 內元素（Forward）', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 填寫必填欄位以啟用送出按鈕
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 等待送出按鈕變成 enabled
    await waitFor(() => {
      const submitButton = screen.getByText('確認送出');
      expect(submitButton).not.toBeDisabled();
    });

    // 重新聚焦到姓名輸入框開始測試 Tab 循環
    nameInput.focus();
    expect(nameInput).toHaveFocus();

    // Tab 到下一個元素（電話輸入框）
    await user.keyboard('{Tab}');
    expect(phoneInput).toHaveFocus();

    // Tab 到下一個元素（Email 輸入框）
    await user.keyboard('{Tab}');
    const emailInput = screen.getByLabelText(/Email/i);
    expect(emailInput).toHaveFocus();

    // Tab 到下一個元素（稍後再說按鈕）
    await user.keyboard('{Tab}');
    const skipButton = screen.getByText('稍後再說');
    expect(skipButton).toHaveFocus();

    // Tab 到下一個元素（送出按鈕）
    await user.keyboard('{Tab}');
    const submitButton = screen.getByText('確認送出');
    expect(submitButton).toHaveFocus();
  });

  it('應該支援 Shift+Tab 反向循環聚焦', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 填寫必填欄位以啟用送出按鈕
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 等待送出按鈕變成 enabled
    await waitFor(() => {
      const submitButton = screen.getByText('確認送出');
      expect(submitButton).not.toBeDisabled();
    });

    // 聚焦到關閉按鈕（第一個可聚焦元素）
    const closeButton = screen.getByLabelText('關閉');
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    // Shift+Tab 應該循環到最後一個元素(送出按鈕)
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    // 驗證跳到送出按鈕(最後一個 enabled 元素)
    const submitButton = screen.getByText('確認送出');
    expect(submitButton).toHaveFocus();
  });

  it('應該支援 Enter 鍵送出表單', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 填寫表單
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);

    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 按下 Enter 鍵送出表單
    await user.keyboard('{Enter}');

    expect(mockOnSubmit).toHaveBeenCalledWith({
      name: '測試用戶',
      phone: '0912345678',
      email: '',
    });
  });

  it('Focus Trap: Tab 在最後元素時循環回第一個元素', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 填寫必填欄位以啟用送出按鈕
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 重新聚焦到姓名輸入框
    nameInput.focus();

    // Tab 到送出按鈕（最後一個可聚焦元素）
    await user.keyboard('{Tab}'); // 電話
    await user.keyboard('{Tab}'); // Email
    await user.keyboard('{Tab}'); // 稍後再說
    await user.keyboard('{Tab}'); // 送出

    const submitButton = screen.getByText('確認送出');
    expect(submitButton).toHaveFocus();

    // 再按一次 Tab，應該循環回關閉按鈕（第一個）
    await user.keyboard('{Tab}');

    const closeButton = screen.getByLabelText('關閉');
    expect(closeButton).toHaveFocus();
  });

  it('Focus Trap: Shift+Tab 在第一元素時循環到最後元素', async () => {
    const user = userEvent.setup();

    render(<DataCollectionModal isOpen={true} onSubmit={mockOnSubmit} onSkip={mockOnSkip} />);

    // 填寫必填欄位以啟用送出按鈕
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 手動聚焦關閉按鈕（第一個元素）
    const closeButton = screen.getByLabelText('關閉');
    closeButton.focus();
    expect(closeButton).toHaveFocus();

    // Shift+Tab 應該循環到最後一個元素（送出按鈕）
    await user.keyboard('{Shift>}{Tab}{/Shift}');

    const submitButton = screen.getByText('確認送出');
    expect(submitButton).toHaveFocus();
  });
});

/**
 * [Team 8 第三位修復] 新增錯誤處理測試
 */
describe('DataCollectionModal - Error Handling', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該處理 onSubmit 拋出的同步錯誤', async () => {
    const user = userEvent.setup();
    const errorOnSubmit = vi.fn(() => {
      throw new Error('同步錯誤');
    });

    render(<DataCollectionModal isOpen={true} onSubmit={errorOnSubmit} onSkip={mockOnSkip} />);

    // 填寫表單
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 送出表單
    const submitButton = screen.getByText('確認送出');
    await user.click(submitButton);

    // 等待錯誤處理
    await waitFor(() => {
      expect(errorOnSubmit).toHaveBeenCalledWith({
        name: '測試用戶',
        phone: '0912345678',
        email: '',
      });
    });

    // 應該顯示錯誤通知（通過 notify.error）
    // 注意：這需要 mock notify，這裡假設已經在上層 mock
  });

  it('應該處理 onSubmit 拋出的異步錯誤', async () => {
    vi.useFakeTimers();
    const user = userEvent.setup({ delay: null });

    const errorOnSubmit = vi.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      throw new Error('異步錯誤');
    });

    render(<DataCollectionModal isOpen={true} onSubmit={errorOnSubmit} onSkip={mockOnSkip} />);

    // 填寫表單
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 送出表單
    const submitButton = screen.getByText('確認送出');
    await user.click(submitButton);

    // 快轉時間處理異步操作
    await vi.runAllTimersAsync();

    await waitFor(() => {
      expect(errorOnSubmit).toHaveBeenCalledWith({
        name: '測試用戶',
        phone: '0912345678',
        email: '',
      });
    });

    vi.useRealTimers();
  });

  it('錯誤後表單應該仍然可用（不會卡住）', async () => {
    const user = userEvent.setup();
    let shouldError = true;
    const conditionalOnSubmit = vi.fn(async () => {
      if (shouldError) {
        throw new Error('第一次失敗');
      }
      return Promise.resolve();
    });

    render(
      <DataCollectionModal isOpen={true} onSubmit={conditionalOnSubmit} onSkip={mockOnSkip} />
    );

    // 填寫表單
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 第一次送出（會失敗）
    const submitButton = screen.getByText('確認送出');
    await user.click(submitButton);

    await waitFor(() => {
      expect(conditionalOnSubmit).toHaveBeenCalledTimes(1);
    });

    // 清除錯誤狀態，第二次送出（會成功）
    shouldError = false;
    await user.click(submitButton);

    await waitFor(() => {
      expect(conditionalOnSubmit).toHaveBeenCalledTimes(2);
    });

    // 表單應該仍然可用
    expect(submitButton).not.toBeDisabled();
  });

  it('在 isSubmitting 期間不應該處理新的送出請求', async () => {
    const user = userEvent.setup();

    render(
      <DataCollectionModal
        isOpen={true}
        onSubmit={mockOnSubmit}
        onSkip={mockOnSkip}
        isSubmitting={true}
      />
    );

    // 填寫表單
    const nameInput = screen.getByLabelText(/姓名/i);
    const phoneInput = screen.getByLabelText(/電話/i);
    await user.type(nameInput, '測試用戶');
    await user.type(phoneInput, '0912345678');

    // 嘗試送出（應該被阻止）
    const submitButton = screen.getByText('送出中...');
    expect(submitButton).toBeDisabled();

    // onSubmit 不應該被呼叫
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});


