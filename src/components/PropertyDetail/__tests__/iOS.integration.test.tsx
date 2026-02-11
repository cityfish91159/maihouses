import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDescription } from '../PropertyDescription';
import { MobileActionBar } from '../MobileActionBar';
import { useScrollDirection } from '../../../hooks/useScrollDirection';

vi.mock('../../../hooks/useScrollDirection');

const defaultActionBarProps = {
  onLineClick: vi.fn(),
  onCallClick: vi.fn(),
  socialProof: { currentViewers: 10, trustCasesCount: 3, isHot: true },
  trustEnabled: true,
  isVerified: true,
  isActionLocked: false,
};

describe('iOS 跨組件整合測試', () => {
  beforeEach(() => {
    // 模擬 iPhone 14 Pro
    global.innerWidth = 393;
    global.innerHeight = 852;
    window.dispatchEvent(new Event('resize'));
  });

  describe('案例 35-37: iOS 特殊場景整合', () => {
    it('案例 35: PropertyDescription + MobileActionBar 滾動方向響應', async () => {
      const longText = 'A'.repeat(300);

      // 測試場景 1: scrollDirection=up，ActionBar 顯示
      vi.mocked(useScrollDirection).mockReturnValue('up');
      const { container, unmount } = render(
        <div>
          <PropertyDescription description={longText} />
          <MobileActionBar {...defaultActionBarProps} />
        </div>
      );

      // PropertyDescription 應正常顯示展開按鈕
      let expandButton = screen.getByRole('button', { name: /展開完整描述/ });
      expect(expandButton).toBeInTheDocument();

      // MobileActionBar 應顯示（無 translate-y-full）
      let actionBar = container.querySelector('.fixed.bottom-0');
      expect(actionBar).toBeInTheDocument();
      expect(actionBar).not.toHaveClass('translate-y-full');

      unmount();

      // 測試場景 2: scrollDirection=down，ActionBar 隱藏
      vi.mocked(useScrollDirection).mockReturnValue('down');
      const { container: container2 } = render(
        <div>
          <PropertyDescription description={longText} />
          <MobileActionBar {...defaultActionBarProps} />
        </div>
      );

      actionBar = container2.querySelector('.fixed.bottom-0');
      expect(actionBar).toHaveClass('translate-y-full');

      // PropertyDescription 展開按鈕不受影響
      expandButton = screen.getByRole('button', { name: /展開完整描述/ });
      expect(expandButton).toBeInTheDocument();
    });

    it('案例 36: iOS viewport 高度變化時 MobileActionBar 保持可見', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');

      // 初始渲染（正常高度）
      global.innerHeight = 852;
      const { container, rerender } = render(<MobileActionBar {...defaultActionBarProps} />);
      let bar = container.querySelector('.fixed');

      expect(bar).toHaveClass('fixed');
      expect(bar).toHaveClass('bottom-0');
      expect(bar).toHaveClass('inset-x-0');

      // 模擬 iOS 鍵盤彈出（viewport 高度大幅減少）
      global.innerHeight = 400; // 原本 852，鍵盤佔 452px
      window.dispatchEvent(new Event('resize'));

      // 重新渲染以響應 resize
      rerender(<MobileActionBar {...defaultActionBarProps} />);
      bar = container.querySelector('.fixed');

      // ActionBar 應保持固定在底部（跟隨新的 viewport bottom）
      expect(bar).toHaveClass('fixed');
      expect(bar).toHaveClass('bottom-0');

      // 確認仍然顯示（scrollDirection=up）
      expect(bar?.className).not.toContain('translate-y-full');

      // 檢查按鈕仍可點擊
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('案例 37: PropertyDescription 展開/收起不影響 MobileActionBar', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');

      const longText = 'A'.repeat(300);
      const TestComponent = () => (
        <div>
          <PropertyDescription description={longText} />
          <MobileActionBar {...defaultActionBarProps} />
        </div>
      );

      const { container } = render(<TestComponent />);

      // 初始狀態：文字截斷，ActionBar 顯示
      const textContainer = container.querySelector('p');
      expect(textContainer).toHaveClass('line-clamp-4');

      let actionBar = container.querySelector('.fixed.bottom-0');
      expect(actionBar).toBeInTheDocument();
      expect(actionBar?.className).not.toContain('translate-y-full');

      // 展開文字
      const expandButton = screen.getByRole('button', { name: /展開完整描述/ });
      fireEvent.click(expandButton);

      // 文字應展開
      expect(screen.getByRole('button', { name: /收起描述/ })).toBeInTheDocument();
      expect(textContainer).not.toHaveClass('line-clamp-4');

      // ActionBar 應保持不變
      actionBar = container.querySelector('.fixed.bottom-0');
      expect(actionBar).toBeInTheDocument();
      expect(actionBar?.className).not.toContain('translate-y-full');

      // 收起文字
      const collapseButton = screen.getByRole('button', { name: /收起描述/ });
      fireEvent.click(collapseButton);

      // 文字應截斷
      expect(screen.getByRole('button', { name: /展開完整描述/ })).toBeInTheDocument();

      // ActionBar 仍保持不變
      expect(actionBar).toBeInTheDocument();
    });
  });
});
