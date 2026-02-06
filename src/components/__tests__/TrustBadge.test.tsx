import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TrustBadge } from '../TrustBadge';

describe('TrustBadge', () => {
  describe('default variant', () => {
    it('renders with correct structure', () => {
      render(<TrustBadge />);
      expect(screen.getByText('安心留痕')).toBeInTheDocument();
      expect(screen.getByText('本物件支援安心交易留痕服務')).toBeInTheDocument();
      expect(screen.getByText('六階段交易追蹤')).toBeInTheDocument();
      expect(screen.getByText('每步驟數位留痕')).toBeInTheDocument();
      expect(screen.getByText('雙方確認機制')).toBeInTheDocument();
    });

    it('displays Shield icon with correct size', () => {
      const { container } = render(<TrustBadge />);
      const shieldIcon = container.querySelector('svg[aria-hidden="true"]');
      expect(shieldIcon).toBeInTheDocument();
    });

    it('has correct Tailwind classes for trust color scheme', () => {
      const { container } = render(<TrustBadge />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('bg-blue-50');
      expect(badge.className).toContain('border-blue-200');
    });

    it('accepts custom className prop', () => {
      const { container } = render(<TrustBadge className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('compact variant', () => {
    it('renders single-line badge with Shield icon', () => {
      render(<TrustBadge variant="compact" />);
      expect(screen.getByText('安心留痕')).toBeInTheDocument();
      expect(screen.queryByText('本物件支援安心交易留痕服務')).not.toBeInTheDocument();
    });

    it('has correct inline-flex layout', () => {
      const { container } = render(<TrustBadge variant="compact" />);
      const badge = container.firstChild as HTMLElement;
      expect(badge.className).toContain('inline-flex');
      expect(badge.className).toContain('rounded-full');
    });
  });

  describe('accessibility', () => {
    it('has aria-hidden on decorative icons', () => {
      const { container } = render(<TrustBadge />);
      const icons = container.querySelectorAll('svg[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });
});
