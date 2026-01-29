/**
 * TrustServiceBanner React.memo 優化效能測試
 * 驗證：
 * 1. TrustServiceBanner 的 memo 生效
 * 2. useMemo 快取 bannerConfig 的效果
 * 3. 父組件重渲染時不重新渲染（相同 props）
 * 4. 回調函數引用變化的隔離效果
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { TrustServiceBanner } from '../TrustServiceBanner';

describe('TrustServiceBanner React.memo Performance', () => {
  const mockCallbacks = {
    onEnterService: vi.fn(),
    onRequestEnable: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基本 memo 隔離', () => {
    it('應該在父組件重渲染時不重新渲染（相同 props）', () => {
      const TestWrapper = () => {
        const [rerenderCount, setRerenderCount] = useState(0);

        return (
          <div>
            <button onClick={() => setRerenderCount((prev) => prev + 1)}>
              Trigger Parent Render
            </button>
            <div data-testid="rerender-count">{rerenderCount}</div>
            <TrustServiceBanner
              trustEnabled={true}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
              isRequesting={false}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      // 第一次渲染
      const firstBanner = document.querySelector('[role="region"]');
      expect(firstBanner).toBeInTheDocument();
      expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();

      // 觸發父組件重新渲染
      fireEvent.click(getByText('Trigger Parent Render'));

      // 驗證父組件確實重新渲染了
      expect(getByTestId('rerender-count').textContent).toBe('1');

      // TrustServiceBanner 應該沒有重新渲染（DOM 節點相同）
      const secondBanner = document.querySelector('[role="region"]');
      expect(secondBanner).toBe(firstBanner);
    });

    it('應該在多次父組件重渲染時保持 DOM 節點不變', () => {
      const TestWrapper = () => {
        const [count, setCount] = useState(0);

        return (
          <div>
            <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
            <div data-testid="count">{count}</div>
            <TrustServiceBanner
              trustEnabled={false}
              propertyId="MH-100002"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      const firstBanner = document.querySelector('[role="region"]');

      // 觸發多次父組件重渲染
      for (let i = 0; i < 5; i++) {
        fireEvent.click(getByText('Increment'));
      }

      // 驗證父組件確實更新了
      expect(getByTestId('count').textContent).toBe('5');

      // TrustServiceBanner 應該保持相同的 DOM 節點
      const finalBanner = document.querySelector('[role="region"]');
      expect(finalBanner).toBe(firstBanner);
    });
  });

  describe('trustEnabled 狀態變化', () => {
    it('應該在 trustEnabled 從 false 變為 true 時重新渲染', () => {
      const TestWrapper = () => {
        const [trustEnabled, setTrustEnabled] = useState(false);

        return (
          <div>
            <button onClick={() => setTrustEnabled(true)}>Enable Trust</button>
            <TrustServiceBanner
              trustEnabled={trustEnabled}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：未開啟
      expect(screen.getByText('本物件尚未開啟安心留痕服務')).toBeInTheDocument();
      expect(screen.getByText('要求房仲開啟')).toBeInTheDocument();
      expect(screen.queryByText('進入服務')).not.toBeInTheDocument();

      // 開啟信任服務
      fireEvent.click(getByText('Enable Trust'));

      // 驗證 UI 已更新
      expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();
      expect(screen.getByText('進入服務')).toBeInTheDocument();
      expect(screen.queryByText('要求房仲開啟')).not.toBeInTheDocument();
    });

    it('應該在 trustEnabled 從 true 變為 false 時重新渲染', () => {
      const TestWrapper = () => {
        const [trustEnabled, setTrustEnabled] = useState(true);

        return (
          <div>
            <button onClick={() => setTrustEnabled(false)}>Disable Trust</button>
            <TrustServiceBanner
              trustEnabled={trustEnabled}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：已開啟
      expect(screen.getByText('本物件已開啟安心留痕服務')).toBeInTheDocument();

      // 關閉信任服務
      fireEvent.click(getByText('Disable Trust'));

      // 驗證 UI 已更新
      expect(screen.getByText('本物件尚未開啟安心留痕服務')).toBeInTheDocument();
    });

    it('應該在 trustEnabled 切換時更新樣式類別', () => {
      const TestWrapper = () => {
        const [trustEnabled, setTrustEnabled] = useState(false);

        return (
          <div>
            <button onClick={() => setTrustEnabled(!trustEnabled)}>Toggle</button>
            <TrustServiceBanner
              trustEnabled={trustEnabled}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByText, container } = render(<TestWrapper />);

      // 初始狀態：警告色系
      let banner = container.querySelector('[role="region"]');
      expect(banner?.className).toContain('border-badge-warning-border');
      expect(banner?.className).toContain('bg-badge-warning-bg');

      // 切換狀態
      fireEvent.click(getByText('Toggle'));

      // 驗證樣式變為信任色系
      banner = container.querySelector('[role="region"]');
      expect(banner?.className).toContain('border-badge-trust-border');
      expect(banner?.className).toContain('bg-badge-trust-bg');
    });
  });

  describe('isRequesting 狀態變化', () => {
    it('應該在 isRequesting 從 false 變為 true 時重新渲染', () => {
      const TestWrapper = () => {
        const [isRequesting, setIsRequesting] = useState(false);

        return (
          <div>
            <button onClick={() => setIsRequesting(true)}>Start Request</button>
            <TrustServiceBanner
              trustEnabled={false}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
              isRequesting={isRequesting}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：正常按鈕
      expect(screen.getByText('要求房仲開啟')).toBeInTheDocument();
      expect(screen.queryByText('處理中...')).not.toBeInTheDocument();

      // 開始請求
      fireEvent.click(getByText('Start Request'));

      // 驗證 Loading 狀態
      expect(screen.getByText('處理中...')).toBeInTheDocument();
      expect(screen.queryByText('要求房仲開啟')).not.toBeInTheDocument();
    });

    it('應該在 isRequesting 為 true 時禁用按鈕', () => {
      const { container } = render(
        <TrustServiceBanner
          trustEnabled={false}
          propertyId="MH-100001"
          onEnterService={mockCallbacks.onEnterService}
          onRequestEnable={mockCallbacks.onRequestEnable}
          isRequesting={true}
        />
      );

      const button = container.querySelector('button[type="button"]');
      expect(button).toBeDisabled();
      expect(button?.getAttribute('aria-busy')).toBe('true');
    });

    it('應該在 isRequesting 從 true 變為 false 時重新渲染', () => {
      const TestWrapper = () => {
        const [isRequesting, setIsRequesting] = useState(true);

        return (
          <div>
            <button onClick={() => setIsRequesting(false)}>End Request</button>
            <TrustServiceBanner
              trustEnabled={false}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
              isRequesting={isRequesting}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：Loading
      expect(screen.getByText('處理中...')).toBeInTheDocument();

      // 結束請求
      fireEvent.click(getByText('End Request'));

      // 驗證恢復正常狀態
      expect(screen.getByText('要求房仲開啟')).toBeInTheDocument();
      expect(screen.queryByText('處理中...')).not.toBeInTheDocument();
    });
  });

  describe('className 變化', () => {
    it('應該在 className 改變時重新渲染', () => {
      const TestWrapper = () => {
        const [className, setClassName] = useState('test-class-1');

        return (
          <div>
            <button onClick={() => setClassName('test-class-2')}>Change Class</button>
            <TrustServiceBanner
              trustEnabled={true}
              propertyId="MH-100001"
              className={className}
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByText, container } = render(<TestWrapper />);

      // 初始狀態
      let wrapper = container.querySelector('.max-w-4xl');
      expect(wrapper?.className).toContain('test-class-1');

      // 改變 className
      fireEvent.click(getByText('Change Class'));

      // 驗證 className 已更新
      wrapper = container.querySelector('.max-w-4xl');
      expect(wrapper?.className).toContain('test-class-2');
      expect(wrapper?.className).not.toContain('test-class-1');
    });
  });

  describe('回調函數 memo 優化', () => {
    it('應該忽略 onEnterService 回調函數引用變化', () => {
      const TestWrapper = () => {
        const [callbackVersion, setCallbackVersion] = useState(0);

        // 每次父組件重新渲染，回調函數引用都會改變
        const handleEnterService = () => {};

        return (
          <div>
            <button onClick={() => setCallbackVersion((prev) => prev + 1)}>Change Callback</button>
            <div data-testid="callback-version">{callbackVersion}</div>
            <TrustServiceBanner
              trustEnabled={true}
              propertyId="MH-100001"
              onEnterService={handleEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      // 第一次渲染
      const firstBanner = document.querySelector('[role="region"]');

      // 改變回調函數引用
      fireEvent.click(getByText('Change Callback'));

      // 驗證父組件確實更新了
      expect(getByTestId('callback-version').textContent).toBe('1');

      // TrustServiceBanner 應該忽略回調函數引用變化
      const secondBanner = document.querySelector('[role="region"]');
      expect(secondBanner).toBe(firstBanner);
    });

    it('應該忽略 onRequestEnable 回調函數引用變化', () => {
      const TestWrapper = () => {
        const [callbackVersion, setCallbackVersion] = useState(0);

        const handleRequestEnable = () => {};

        return (
          <div>
            <button onClick={() => setCallbackVersion((prev) => prev + 1)}>Change Callback</button>
            <div data-testid="callback-version">{callbackVersion}</div>
            <TrustServiceBanner
              trustEnabled={false}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={handleRequestEnable}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      const firstBanner = document.querySelector('[role="region"]');

      fireEvent.click(getByText('Change Callback'));

      expect(getByTestId('callback-version').textContent).toBe('1');

      const secondBanner = document.querySelector('[role="region"]');
      expect(secondBanner).toBe(firstBanner);
    });

    it('應該在回調函數引用變化時仍能正確執行', () => {
      let callCount = 0;

      const TestWrapper = () => {
        const [version, setVersion] = useState(0);

        const handleEnterService = () => {
          callCount++;
        };

        return (
          <div>
            <button onClick={() => setVersion((prev) => prev + 1)}>Update Version</button>
            <TrustServiceBanner
              trustEnabled={true}
              propertyId="MH-100001"
              onEnterService={handleEnterService}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 改變回調函數引用
      fireEvent.click(getByText('Update Version'));

      // 點擊進入服務按鈕
      const enterButton = screen.getByText('進入服務');
      fireEvent.click(enterButton);

      // 驗證新的回調函數被執行
      expect(callCount).toBe(1);
    });
  });

  describe('useMemo bannerConfig 快取', () => {
    it('應該在 trustEnabled 相同時重用 bannerConfig', () => {
      const TestWrapper = () => {
        const [count, setCount] = useState(0);

        return (
          <div>
            <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
            <TrustServiceBanner
              trustEnabled={true}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 記錄初始渲染的文字
      const initialTitle = screen.getByText('本物件已開啟安心留痕服務');

      // 觸發父組件重渲染
      for (let i = 0; i < 3; i++) {
        fireEvent.click(getByText('Increment'));
      }

      // 驗證文字內容保持不變（bannerConfig 被重用）
      const finalTitle = screen.getByText('本物件已開啟安心留痕服務');
      expect(finalTitle).toBe(initialTitle);
    });

    it('應該在 trustEnabled 改變時重新計算 bannerConfig', () => {
      const TestWrapper = () => {
        const [trustEnabled, setTrustEnabled] = useState(false);

        return (
          <div>
            <button onClick={() => setTrustEnabled(!trustEnabled)}>Toggle</button>
            <TrustServiceBanner
              trustEnabled={trustEnabled}
              propertyId="MH-100001"
              onEnterService={mockCallbacks.onEnterService}
              onRequestEnable={mockCallbacks.onRequestEnable}
            />
          </div>
        );
      };

      const { getByText, container } = render(<TestWrapper />);

      // 記錄初始圖示
      const initialIcon = container.querySelector('svg');

      // 切換狀態
      fireEvent.click(getByText('Toggle'));

      // 驗證圖示已改變（Shield vs Info）
      const newIcon = container.querySelector('svg');
      expect(newIcon).not.toBe(initialIcon);
    });
  });

  describe('無障礙屬性', () => {
    it('應該設定正確的 role 和 aria-label', () => {
      const { container } = render(
        <TrustServiceBanner
          trustEnabled={true}
          propertyId="MH-100001"
          onEnterService={mockCallbacks.onEnterService}
        />
      );

      const region = container.querySelector('[role="region"]');
      expect(region).toHaveAttribute('aria-label', '安心留痕服務已啟用通知');
    });

    it('應該在 isRequesting 時更新 aria 屬性', () => {
      const { container } = render(
        <TrustServiceBanner
          trustEnabled={false}
          propertyId="MH-100001"
          onRequestEnable={mockCallbacks.onRequestEnable}
          isRequesting={true}
        />
      );

      const button = container.querySelector('button[type="button"]');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAttribute('aria-label', '處理中，請稍候');
    });
  });

  describe('按鈕點擊行為', () => {
    it('應該在 trustEnabled 為 true 時呼叫 onEnterService', () => {
      render(
        <TrustServiceBanner
          trustEnabled={true}
          propertyId="MH-100001"
          onEnterService={mockCallbacks.onEnterService}
        />
      );

      const button = screen.getByText('進入服務');
      fireEvent.click(button);

      expect(mockCallbacks.onEnterService).toHaveBeenCalledTimes(1);
    });

    it('應該在 trustEnabled 為 false 時呼叫 onRequestEnable', () => {
      render(
        <TrustServiceBanner
          trustEnabled={false}
          propertyId="MH-100001"
          onRequestEnable={mockCallbacks.onRequestEnable}
        />
      );

      const button = screen.getByText('要求房仲開啟');
      fireEvent.click(button);

      expect(mockCallbacks.onRequestEnable).toHaveBeenCalledTimes(1);
    });

    it('應該在 isRequesting 為 true 時防止重複點擊', () => {
      render(
        <TrustServiceBanner
          trustEnabled={false}
          propertyId="MH-100001"
          onRequestEnable={mockCallbacks.onRequestEnable}
          isRequesting={true}
        />
      );

      const button = screen.getByText('處理中...');
      fireEvent.click(button);

      // 不應該呼叫回調
      expect(mockCallbacks.onRequestEnable).not.toHaveBeenCalled();
    });
  });

  describe('預設 props 處理', () => {
    it('應該使用預設的 className', () => {
      const { container } = render(
        <TrustServiceBanner
          trustEnabled={true}
          propertyId="MH-100001"
          onEnterService={mockCallbacks.onEnterService}
        />
      );

      const wrapper = container.querySelector('.max-w-4xl');
      expect(wrapper?.className).toContain('mx-auto max-w-4xl px-4');
    });

    it('應該使用預設的 isRequesting 值（false）', () => {
      render(
        <TrustServiceBanner
          trustEnabled={false}
          propertyId="MH-100001"
          onRequestEnable={mockCallbacks.onRequestEnable}
        />
      );

      // 按鈕應該是啟用狀態
      const button = screen.getByText('要求房仲開啟');
      expect(button).not.toBeDisabled();
    });
  });
});
