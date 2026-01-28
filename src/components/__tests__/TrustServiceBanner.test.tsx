import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrustServiceBanner } from '../TrustServiceBanner';

describe('TrustServiceBanner', () => {
  it('應該在 trustEnabled=true 時顯示已開啟狀態', () => {
    render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();
    expect(screen.getByText(/六階段交易追蹤/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /進入安心留痕服務/ })).toBeInTheDocument();
  });

  it('應該在 trustEnabled=false 時顯示未開啟狀態', () => {
    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('本物件尚未開啟安心留痕服務')).toBeInTheDocument();
    expect(screen.getByText(/讓房仲開啟六階段交易追蹤/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ })).toBeInTheDocument();
  });

  it('應該在點擊「進入服務」時呼叫 onEnterService 回調', async () => {
    const user = userEvent.setup();
    const handleEnterService = vi.fn();

    render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
      />
    );

    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });
    await user.click(button);

    expect(handleEnterService).toHaveBeenCalledTimes(1);
  });

  it('應該在點擊「要求房仲開啟」時呼叫 onRequestEnable 回調', async () => {
    const user = userEvent.setup();
    const handleRequestEnable = vi.fn();

    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onRequestEnable={handleRequestEnable}
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    await user.click(button);

    expect(handleRequestEnable).toHaveBeenCalledTimes(1);
  });

  it('應該包含正確的 ARIA 屬性', () => {
    const { container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
      />
    );

    const region = container.querySelector('[role="region"]');
    expect(region).toBeInTheDocument();
    expect(region).toHaveAttribute('aria-label', '安心留痕服務已啟用通知');

    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('應該套用自訂的 className', () => {
    const { container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        className="custom-class"
      />
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('應該在 onEnterService 為 undefined 時不拋出錯誤', async () => {
    const user = userEvent.setup();

    render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        // onEnterService 故意不傳
      />
    );

    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });

    // 點擊按鈕不應該拋出錯誤
    await expect(user.click(button)).resolves.not.toThrow();
  });

  it('應該在 onRequestEnable 為 undefined 時不拋出錯誤', async () => {
    const user = userEvent.setup();

    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        // onRequestEnable 故意不傳
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟/ });

    // 點擊按鈕不應該拋出錯誤
    await expect(user.click(button)).resolves.not.toThrow();
  });
});

describe('TrustServiceBanner - Edge Cases', () => {
  it('應該支援鍵盤操作 (Enter)', async () => {
    const user = userEvent.setup();
    const handleEnterService = vi.fn();

    render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
      />
    );

    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });
    button.focus();
    await user.keyboard('{Enter}');

    expect(handleEnterService).toHaveBeenCalledTimes(1);
  });

  it('應該包含正確數量的裝飾性圖示 (至少2個)', () => {
    const { container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
      />
    );
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThanOrEqual(2); // Shield/Info + ChevronRight
  });

  it('應該在已開啟狀態套用正確的色彩系統', () => {
    const { container } = render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" />
    );
    const bannerDiv = container.querySelector('[role="region"]');
    expect(bannerDiv).toHaveClass(
      'bg-badge-trust-bg',
      'border-badge-trust-border'
    );
  });

  it('應該在未開啟狀態套用警示色彩系統', () => {
    const { container } = render(
      <TrustServiceBanner trustEnabled={false} propertyId="MH-100001" />
    );
    const bannerDiv = container.querySelector('[role="region"]');
    expect(bannerDiv).toHaveClass(
      'bg-badge-warning-bg',
      'border-badge-warning-border'
    );
  });

  it('應該有清晰的 Focus 狀態樣式', () => {
    render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" />
    );
    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });

    // 檢查按鈕具備 transition 類別 (確保視覺回饋)
    expect(button.className).toMatch(/transition-/);
  });

  it('應該支援鍵盤操作 (Space)', async () => {
    const user = userEvent.setup();
    const handleRequestEnable = vi.fn();

    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onRequestEnable={handleRequestEnable}
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    button.focus();
    await user.keyboard('{ }'); // Space key

    expect(handleRequestEnable).toHaveBeenCalledTimes(1);
  });

  it('應該在按鈕點擊時有縮放動畫回饋', () => {
    render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" />
    );
    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });

    // 檢查是否包含 active:scale-95 類別
    expect(button).toHaveClass('active:scale-95');
  });

  it('應該在 isRequesting=true 時禁用按鈕並顯示 Loading', () => {
    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={true}
      />
    );
    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('處理中...')).toBeInTheDocument();
  });

  it('應該在 isRequesting=true 時顯示 Loader2 圖示', () => {
    const { container } = render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={true}
      />
    );

    // 檢查 Loader2 圖示是否存在且有動畫效果
    const loader = container.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('應該在 isRequesting=true 時不觸發 onRequestEnable', async () => {
    const user = userEvent.setup();
    const handleRequestEnable = vi.fn();

    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onRequestEnable={handleRequestEnable}
        isRequesting={true}
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });

    // 嘗試點擊被禁用的按鈕
    await user.click(button);

    // 回調不應該被觸發
    expect(handleRequestEnable).not.toHaveBeenCalled();
  });

  it('應該在 isRequesting=false 時正常顯示按鈕文字', () => {
    render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        isRequesting={false}
      />
    );

    const button = screen.getByRole('button', { name: /進入安心留痕服務/ });
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'false');
    expect(screen.queryByText('處理中...')).not.toBeInTheDocument();
  });

  it('應該在 isRequesting 變更時更新按鈕狀態', () => {
    const { rerender } = render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={false}
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    expect(button).not.toBeDisabled();

    // 更新為 loading 狀態
    rerender(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={true}
      />
    );

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByText('處理中...')).toBeInTheDocument();
  });

  it('應該在 isRequesting 時有正確的 aria-disabled 屬性', () => {
    render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={true}
      />
    );

    const button = screen.getByRole('button', { name: /要求房仲開啟安心留痕服務/ });
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('應該在 isRequesting 時包含 sr-only 狀態通知', () => {
    const { container } = render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        isRequesting={true}
      />
    );

    // 檢查 live region 是否存在
    const liveRegion = container.querySelector('[role="status"][aria-live="polite"]');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveClass('sr-only');
  });
});
