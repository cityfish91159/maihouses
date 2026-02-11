import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDescription } from '../PropertyDescription';

describe('PropertyDescription - 功能測試', () => {
  describe('案例 1-4: 展開/收起功能', () => {
    it('案例 1: 短文本（<240字）不顯示展開按鈕', () => {
      const shortText = '這是一個簡短的描述';
      render(<PropertyDescription description={shortText} />);

      expect(screen.queryByText('展開全文')).not.toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('案例 2: 長文本（>240字）顯示展開按鈕和 gradient fade', () => {
      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);

      const button = screen.getByRole('button', { name: /展開完整描述/ });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('min-h-[44px]'); // 觸控目標

      const gradient = container.querySelector('.bg-gradient-to-t');
      expect(gradient).toBeInTheDocument();
      expect(gradient).toHaveAttribute('aria-hidden', 'true');
    });

    it('案例 3: 點擊展開按鈕顯示完整內容並移除 gradient', () => {
      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);

      const button = screen.getByRole('button', { name: /展開完整描述/ });
      fireEvent.click(button);

      expect(screen.getByRole('button', { name: /收起描述/ })).toBeInTheDocument();
      expect(container.querySelector('.bg-gradient-to-t')).not.toBeInTheDocument();
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('案例 4: 展開後點擊收起按鈕恢復 4 行 + gradient', () => {
      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);

      const expandButton = screen.getByRole('button', { name: /展開完整描述/ });
      fireEvent.click(expandButton);

      const collapseButton = screen.getByRole('button', { name: /收起描述/ });
      fireEvent.click(collapseButton);

      expect(screen.getByRole('button', { name: /展開完整描述/ })).toBeInTheDocument();
      expect(container.querySelector('.bg-gradient-to-t')).toBeInTheDocument();
    });
  });
});

describe('PropertyDescription - iOS 手機模擬', () => {
  beforeEach(() => {
    // 重置 window 尺寸
    global.innerWidth = 1024;
    global.innerHeight = 768;
  });

  describe('案例 14-16: iOS 螢幕尺寸適配', () => {
    it('案例 14: iPhone 14 Pro (393x852) 標準螢幕正常顯示', () => {
      global.innerWidth = 393;
      global.innerHeight = 852;
      window.dispatchEvent(new Event('resize'));

      const { container } = render(<PropertyDescription description={'A'.repeat(300)} />);
      const button = screen.getByRole('button');

      expect(button).toHaveClass('min-h-[44px]'); // 符合 iOS 觸控標準
      expect(button).toBeVisible();
    });

    it('案例 21: iOS VoiceOver 正確讀取 aria-expanded', () => {
      render(<PropertyDescription description={'A'.repeat(300)} />);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(button).toHaveAttribute('aria-label', '展開完整描述');

      fireEvent.click(button);

      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(button).toHaveAttribute('aria-label', '收起描述');
    });
  });
});
