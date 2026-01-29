import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrustToggleSection } from '../TrustToggleSection';

// Mock UploadContext
const mockSetForm = vi.fn();
let mockTrustEnabled = false;

vi.mock('../UploadContext', () => ({
  useUploadForm: () => ({
    form: { trustEnabled: mockTrustEnabled },
    setForm: mockSetForm,
  }),
}));

describe('TrustToggleSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrustEnabled = false;
  });

  it('renders with correct initial state (off)', () => {
    render(<TrustToggleSection />);

    // 標題存在
    expect(screen.getByText('安心留痕服務')).toBeInTheDocument();

    // Toggle 按鈕存在且為關閉狀態
    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // 顯示「開啟安心留痕」文字
    expect(screen.getByText('開啟安心留痕')).toBeInTheDocument();

    // 不顯示「已啟用」標籤
    expect(screen.queryByText('已啟用')).not.toBeInTheDocument();
  });

  it('renders with enabled state (on)', () => {
    mockTrustEnabled = true;
    render(<TrustToggleSection />);

    const toggle = screen.getByRole('switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');

    // 顯示「已開啟安心留痕」文字
    expect(screen.getByText('已開啟安心留痕')).toBeInTheDocument();

    // 顯示「已啟用」標籤
    expect(screen.getByText('已啟用')).toBeInTheDocument();
  });

  it('calls setForm when toggle is clicked', () => {
    render(<TrustToggleSection />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    // 確認 setForm 被呼叫
    expect(mockSetForm).toHaveBeenCalledTimes(1);

    // 確認傳入的是 updater function
    const callArg = mockSetForm.mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    expect(typeof callArg).toBe('function');

    // 執行 updater function，確認邏輯正確
    const updaterFn = callArg as (prev: { trustEnabled: boolean; otherField?: string }) => {
      trustEnabled: boolean;
      otherField?: string;
    };
    const prevState = { trustEnabled: false, otherField: 'keep' };
    const newState = updaterFn(prevState);
    expect(newState.trustEnabled).toBe(true);
    expect(newState.otherField).toBe('keep');
  });

  it('toggles from true to false', () => {
    mockTrustEnabled = true;
    render(<TrustToggleSection />);

    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);

    const callArg = mockSetForm.mock.calls[0]?.[0];
    expect(callArg).toBeDefined();
    const updaterFn = callArg as (prev: { trustEnabled: boolean }) => {
      trustEnabled: boolean;
    };
    const prevState = { trustEnabled: true };
    const newState = updaterFn(prevState);
    expect(newState.trustEnabled).toBe(false);
  });

  it('has correct ARIA attributes for accessibility', () => {
    render(<TrustToggleSection />);

    const toggle = screen.getByRole('switch');

    // aria-label 存在
    expect(toggle).toHaveAttribute('aria-label', '開啟安心留痕服務');

    // aria-checked 正確
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    // type 是 button（非 submit）
    expect(toggle).toHaveAttribute('type', 'button');
  });

  it('displays service description and fee info', () => {
    render(<TrustToggleSection />);

    // 服務說明
    expect(screen.getByText(/為消費者提供六階段交易追蹤/)).toBeInTheDocument();

    // 收費說明
    expect(screen.getByText(/僅在成交時收取服務費/)).toBeInTheDocument();
  });
});
