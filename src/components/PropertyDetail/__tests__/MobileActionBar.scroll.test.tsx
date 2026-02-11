import { render, screen } from '@testing-library/react';
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

describe('MobileActionBar - 功能測試', () => {
  describe('案例 9-12: 毛玻璃與滾動隱藏', () => {
    it('案例 9: 套用 Glassmorphism 毛玻璃樣式', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toHaveClass('bg-white/95');
      expect(bar).toHaveClass('backdrop-blur-xl');
      expect(bar).toHaveClass('border-t');
      expect(bar).toHaveClass('border-white/20');
    });

    it('案例 10: 社會證明 icon 尺寸為 14px', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      const { container } = render(<MobileActionBar {...defaultProps} />);

      const icons = container.querySelectorAll('svg');
      let hasCorrectSize = false;
      icons.forEach((icon) => {
        const width = icon.getAttribute('width');
        const height = icon.getAttribute('height');
        if (width === '14' || height === '14') {
          hasCorrectSize = true;
        }
      });
      expect(hasCorrectSize).toBe(true);
    });

    it('案例 11: scrollDirection=up 時顯示（無 translate-y-full）', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar?.className).not.toMatch(/translate-y-full(?!\s+motion-reduce)/);
    });

    it('案例 12: scrollDirection=down 時隱藏（有 translate-y-full）', () => {
      vi.mocked(useScrollDirection).mockReturnValue('down');
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toHaveClass('translate-y-full');
    });
  });
});

describe('MobileActionBar - iOS 手機模擬', () => {
  beforeEach(() => {
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  describe('案例 13-16: iOS Safari 兼容性', () => {
    it('案例 13: iPhone SE (375x667) 小螢幕適配', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      global.innerWidth = 375;
      global.innerHeight = 667;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('lg:hidden');
    });

    it('案例 15: iPhone 14 Pro Max (430x932) 大螢幕適配', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      global.innerWidth = 430;
      global.innerHeight = 932;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toHaveClass('backdrop-blur-xl');
      expect(bar).toBeVisible();
    });

    it('案例 19: iOS Safe Area 底部 pb-safe 正確套用', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.pb-safe');

      expect(bar).toBeInTheDocument();
      expect(bar).toHaveClass('fixed');
      expect(bar).toHaveClass('bottom-0');
    });

    it('案例 22: iOS 開啟 Reduce Motion 時停用滾動隱藏', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      vi.mocked(useScrollDirection).mockReturnValue('down');
      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toHaveClass('motion-reduce:translate-y-0');
    });
  });

  describe('案例 20: iOS 橫向螢幕適配', () => {
    it('iOS 橫向螢幕（landscape）全寬顯示', () => {
      vi.mocked(useScrollDirection).mockReturnValue('up');
      global.innerWidth = 844;
      global.innerHeight = 390;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<MobileActionBar {...defaultProps} />);
      const bar = container.querySelector('.fixed');

      expect(bar).toBeVisible();
      expect(bar).toHaveClass('inset-x-0');
    });
  });
});
