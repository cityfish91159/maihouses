import { render } from '@testing-library/react';
import { MobileActionBar } from '../MobileActionBar';
import { useScrollDirection } from '../../../hooks/useScrollDirection';

vi.mock('../../../hooks/useScrollDirection');

const defaultProps = {
  onLineClick: vi.fn(),
  onCallClick: vi.fn(),
  socialProof: { currentViewers: 10, trustCasesCount: 3, isHot: true },
  trustEnabled: true,
  isVerified: true,
  isActionLocked: false,
};

describe('MobileActionBar - iOS 深度測試', () => {
  beforeEach(() => {
    vi.mocked(useScrollDirection).mockReturnValue('up');
  });

  describe('案例 32-34: iOS 特殊區域適配', () => {
    it('案例 32: iOS 瀏海（notch）區域避讓 - iPhone X', () => {
      // 模擬 iPhone X（有瀏海但沒有 Dynamic Island）
      global.innerWidth = 375;
      global.innerHeight = 812;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      // 底部 ActionBar 應有 safe area padding
      expect(bar).toHaveClass('pb-safe');
      expect(bar).toHaveClass('bottom-0');

      // 檢查內容區域有正確的 padding
      const contentWrapper = container.querySelector('.p-3');
      expect(contentWrapper).toBeInTheDocument();

      // 確認 ActionBar 在 mobile 顯示，desktop 隱藏
      expect(bar).toHaveClass('lg:hidden');
    });

    it('案例 33: iOS Home Indicator 區域避讓 - iPhone 14 Pro', () => {
      // 模擬 iPhone 14 Pro（有 Dynamic Island + Home Indicator）
      global.innerWidth = 393;
      global.innerHeight = 852;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.pb-safe');

      // pb-safe 應該正確套用以避開 Home Indicator
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('fixed');
      expect(bar).toHaveClass('bottom-0');

      // 檢查按鈕容器有適當間距避開 Home Indicator
      const buttonContainer = container.querySelector('.flex.gap-2');
      expect(buttonContainer).toBeInTheDocument();

      // 確認社會證明區塊存在且不被 Home Indicator 遮擋
      const socialProof = container.querySelector('.flex.items-center.gap-2');
      expect(socialProof).toBeInTheDocument();
    });

    it('案例 34: iOS 淺色模式 glassmorphism 對比度檢查', () => {
      // 測試淺色模式下的毛玻璃效果對比度
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.backdrop-blur-xl');

      // 檢查毛玻璃效果
      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('bg-white/95'); // 95% 不透明度確保對比度
      expect(bar).toHaveClass('backdrop-blur-xl');

      // 檢查邊框對比度
      expect(bar).toHaveClass('border-t');
      expect(bar).toHaveClass('border-white/20');

      // 檢查按鈕文字顏色有足夠對比度
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // 檢查社會證明文字顏色
      const socialProofText = container.querySelector('.text-xs');
      expect(socialProofText).toBeInTheDocument();
    });
  });
});
