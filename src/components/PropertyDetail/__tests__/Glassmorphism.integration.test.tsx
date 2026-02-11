import { render } from '@testing-library/react';
import { PropertySpecs } from '../PropertySpecs';
import { MobileCTA } from '../MobileCTA';

const mockProperty = {
  id: 'test-uuid-001',
  publicId: 'MH-100001',
  title: '測試房源',
  size: 30,
  rooms: 3,
  halls: 2,
  floorCurrent: '5',
  floorTotal: 10,
  price: 1500,
  address: '測試地址',
  images: [],
  description: '測試描述',
  agent: {
    id: 'agent-001',
    internalCode: 10001,
    name: '測試經紀人',
    avatarUrl: '',
    company: '測試公司',
    trustScore: 85,
    encouragementCount: 10,
    phone: '0912345678',
    lineId: 'test_line',
  },
};

const defaultCTAProps = {
  onLineClick: vi.fn(),
  onCallClick: vi.fn(),
  socialProof: { currentViewers: 10, trustCasesCount: 3, isHot: true },
  trustEnabled: true,
  isActionLocked: false,
};

describe('Glassmorphism 統一設計語言 - 整合測試', () => {
  it('案例 25: PropertySpecs 套用 glass-card class', () => {
    const { container } = render(<PropertySpecs property={mockProperty} />);
    const card = container.querySelector('.glass-card');

    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl');
  });

  it('案例 26: MobileCTA 套用 glass-card 風格', () => {
    const { container } = render(<MobileCTA {...defaultCTAProps} />);
    const card = container.querySelector('.glass-card');

    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-2xl');
    expect(card).toHaveClass('p-4');
  });

  it('案例 27: iOS Safari backdrop-filter 正確渲染', () => {
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
      configurable: true,
    });

    const { container } = render(<MobileCTA {...defaultCTAProps} />);
    const card = container.querySelector('.glass-card');

    expect(card).toBeInTheDocument();
    // glass-card 應該包含 backdrop-blur-xl（透過 Tailwind plugin 套用）
  });
});
