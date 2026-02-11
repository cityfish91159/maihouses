import { render, screen } from '@testing-library/react';
import { PropertyDescription } from '../PropertyDescription';

describe('PropertyDescription - iOS 深度測試', () => {
  describe('案例 28-31: iOS 特殊場景', () => {
    it('案例 28: iOS Dynamic Type 文字縮放適配', () => {
      // 模擬 iOS Dynamic Type（使用者放大文字）
      document.documentElement.style.fontSize = '20px'; // 預設 16px，放大到 20px

      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);
      const button = screen.getByRole('button');

      // 按鈕最小高度應該適配放大文字
      expect(button).toHaveClass('min-h-[44px]');
      expect(button).toBeVisible();

      // 清理
      document.documentElement.style.fontSize = '';
    });

    it('案例 29: iOS 深色模式文字對比度', () => {
      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);
      const text = container.querySelector('p');
      const button = screen.getByRole('button');

      // 檢查文字顏色類別（實際使用 slate-600）
      expect(text).toHaveClass('text-slate-600');
      expect(text).toHaveClass('leading-relaxed');

      // 檢查按鈕有足夠對比度的顏色（brand-700）
      expect(button).toHaveClass('text-brand-700');

      // 檢查 gradient fade 使用 design token 漸層（確保背景可見）
      const gradient = container.querySelector('.bg-gradient-to-t');
      expect(gradient).toHaveClass('from-bg-card');
      expect(gradient).toHaveClass('to-transparent');
    });

    it('案例 30: iOS touch 目標最小 44x44px', () => {
      const longText = 'A'.repeat(300);
      render(<PropertyDescription description={longText} />);
      const button = screen.getByRole('button', { name: /展開完整描述/ });

      // iOS Human Interface Guidelines: 最小觸控目標 44x44pt
      expect(button).toHaveClass('min-h-[44px]');

      // 檢查按鈕有 padding 確保點擊區域
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('py-2');

      // 檢查按鈕有 flex 和 items-center 確保內容垂直置中
      expect(button).toHaveClass('flex');
      expect(button).toHaveClass('items-center');

      // 檢查按鈕有適當的圓角和過渡效果
      expect(button).toHaveClass('rounded-lg');
      expect(button).toHaveClass('transition-all');
    });

    it('案例 31: iOS 橫向模式文字截斷處理', () => {
      // 模擬 iPhone 橫向模式（寬度較大但高度受限）
      global.innerWidth = 844;
      global.innerHeight = 390;
      window.dispatchEvent(new Event('resize'));

      const longText = 'A'.repeat(300);
      const { container } = render(<PropertyDescription description={longText} />);
      const textContainer = container.querySelector('p');

      // 橫向模式下仍然應該保持 line-clamp-4
      expect(textContainer).toHaveClass('line-clamp-4');
      expect(textContainer).toHaveClass('leading-relaxed');
      expect(textContainer).toHaveClass('whitespace-pre-line');

      // 檢查展開按鈕存在（證明文字確實被截斷）
      const button = screen.getByRole('button', { name: /展開完整描述/ });
      expect(button).toBeInTheDocument();

      // 檢查 gradient fade 存在（證明文字被截斷）
      const gradient = container.querySelector('.bg-gradient-to-t');
      expect(gradient).toBeInTheDocument();
      expect(gradient).toHaveClass('from-bg-card');
    });
  });
});
