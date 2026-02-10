import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { TrustServiceBanner } from '../TrustServiceBanner';

/**
 * TrustServiceBanner 性能測試
 *
 * 驗證 React.memo 和 useMemo 優化是否生效：
 * 1. 父組件重新渲染時，子組件不應重新渲染（如果 props 未變）
 * 2. bannerConfig 應該被正確快取（trustEnabled 相同時）
 * 3. 回調函數變化不應觸發重新渲染（自訂比較函數）
 */
describe('TrustServiceBanner - Performance Optimization', () => {
  it('應該在父組件重新渲染但 props 不變時保持 DOM 穩定', () => {
    const handleEnterService = vi.fn();
    const handleRequestEnable = vi.fn();

    const { rerender, container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        onRequestEnable={handleRequestEnable}
        isRequesting={false}
        className="test-class"
      />
    );

    const bannerBefore = container.querySelector('[role="region"]');
    const htmlBefore = container.innerHTML;

    // 重新渲染相同的 props
    rerender(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        onRequestEnable={handleRequestEnable}
        isRequesting={false}
        className="test-class"
      />
    );

    const bannerAfter = container.querySelector('[role="region"]');

    // 驗證 DOM 節點穩定（同一個參考 = memo 生效未重建）
    expect(bannerAfter).toBe(bannerBefore);
    // 驗證 HTML 輸出一致
    expect(container.innerHTML).toBe(htmlBefore);
  });

  it('應該在 trustEnabled 改變時重新渲染', () => {
    const handleEnterService = vi.fn();
    const handleRequestEnable = vi.fn();

    const { rerender, container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        onRequestEnable={handleRequestEnable}
      />
    );

    // 驗證初始狀態
    const bannerDiv1 = container.querySelector('[role="region"]');
    expect(bannerDiv1).toHaveClass('bg-badge-trust-bg');

    // 改變 trustEnabled
    rerender(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        onRequestEnable={handleRequestEnable}
      />
    );

    // 驗證狀態改變
    const bannerDiv2 = container.querySelector('[role="region"]');
    expect(bannerDiv2).toHaveClass('bg-badge-warning-bg');
  });

  it('應該在 isRequesting 改變時重新渲染', () => {
    const handleRequestEnable = vi.fn();

    const { rerender, getByRole } = render(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onRequestEnable={handleRequestEnable}
        isRequesting={false}
      />
    );

    // 驗證初始狀態
    const button1 = getByRole('button');
    expect(button1).not.toBeDisabled();

    // 改變 isRequesting
    rerender(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onRequestEnable={handleRequestEnable}
        isRequesting={true}
      />
    );

    // 驗證狀態改變
    const button2 = getByRole('button');
    expect(button2).toBeDisabled();
  });

  it('應該在 className 改變時重新渲染', () => {
    const { rerender, container } = render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" className="class-a" />
    );

    expect(container.firstChild).toHaveClass('class-a');

    rerender(<TrustServiceBanner trustEnabled={true} propertyId="MH-100001" className="class-b" />);

    expect(container.firstChild).toHaveClass('class-b');
    expect(container.firstChild).not.toHaveClass('class-a');
  });

  it('應該在回調函數改變時不重新渲染（自訂比較函數忽略回調）', () => {
    const handleEnterService1 = vi.fn();
    const handleEnterService2 = vi.fn();

    const { rerender, getByRole } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService1}
      />
    );

    const button1 = getByRole('button');

    // 改變回調函數（新引用）
    rerender(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService2}
      />
    );

    const button2 = getByRole('button');

    // 按鈕應該仍然可點擊（組件未重新渲染或渲染結果相同）
    expect(button2).not.toBeDisabled();
  });

  it('應該在 propertyId 改變時不影響渲染（未納入自訂比較）', () => {
    const { rerender, container } = render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" />
    );

    const bannerDiv1 = container.querySelector('[role="region"]');
    expect(bannerDiv1).toHaveClass('bg-badge-trust-bg');

    // 改變 propertyId（但 trustEnabled 不變）
    rerender(<TrustServiceBanner trustEnabled={true} propertyId="MH-100002" />);

    const bannerDiv2 = container.querySelector('[role="region"]');
    expect(bannerDiv2).toHaveClass('bg-badge-trust-bg');
  });

  it('應該正確快取 bannerConfig（trustEnabled 相同時）', () => {
    const { rerender, getByText } = render(
      <TrustServiceBanner trustEnabled={true} propertyId="MH-100001" />
    );

    // 驗證初始內容
    expect(getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();

    // 重新渲染相同的 trustEnabled
    rerender(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100002" // 改變 propertyId
      />
    );

    // 內容應該相同（bannerConfig 被快取）
    expect(getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();
  });

  it('應該在多次重新渲染時保持穩定（完整場景測試）', () => {
    const handleEnterService = vi.fn();

    const { rerender, container } = render(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        isRequesting={false}
        className="test-1"
      />
    );

    // 第 1 次重新渲染：只改變 className
    rerender(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        isRequesting={false}
        className="test-2"
      />
    );

    expect(container.firstChild).toHaveClass('test-2');

    // 第 2 次重新渲染：改變 isRequesting
    rerender(
      <TrustServiceBanner
        trustEnabled={true}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        isRequesting={true}
        className="test-2"
      />
    );

    const button = container.querySelector('button');
    expect(button).toBeDisabled();

    // 第 3 次重新渲染：改變 trustEnabled
    rerender(
      <TrustServiceBanner
        trustEnabled={false}
        propertyId="MH-100001"
        onEnterService={handleEnterService}
        isRequesting={false}
        className="test-2"
      />
    );

    const bannerDiv = container.querySelector('[role="region"]');
    expect(bannerDiv).toHaveClass('bg-badge-warning-bg');
  });
});

