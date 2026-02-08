import { render, screen } from '@testing-library/react';
import type { PropertyData } from '../../../services/propertyService';
import { PropertyInfoCard } from '../PropertyInfoCard';

const baseProperty: PropertyData = {
  id: 'property-1',
  publicId: 'MH-100001',
  title: '信義區景觀宅',
  price: 2880,
  address: '台北市信義區松高路 1 號',
  description: '測試用物件描述',
  images: ['https://example.com/property.jpg'],
  agent: {
    id: 'agent-1',
    internalCode: 1001,
    name: '測試經紀人',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '測試房仲',
    trustScore: 92,
    encouragementCount: 18,
  },
};

const baseSocialProof = {
  currentViewers: 12,
  trustCasesCount: 4,
  isHot: true,
};

describe('PropertyInfoCard', () => {
  it('trustEnabled=false 時不應顯示熱門物件與已賞屋文案', () => {
    render(
      <PropertyInfoCard
        property={baseProperty}
        isFavorite={false}
        onFavoriteToggle={vi.fn()}
        onLineShare={vi.fn()}
        onMapClick={vi.fn()}
        capsuleTags={[]}
        socialProof={baseSocialProof}
        trustEnabled={false}
      />
    );

    expect(screen.queryByText('熱門物件')).not.toBeInTheDocument();
    expect(screen.queryByText(/組客戶已賞屋/)).not.toBeInTheDocument();
  });

  it('trustEnabled=true 且 isHot=true 時應顯示熱門物件', () => {
    const { container } = render(
      <PropertyInfoCard
        property={baseProperty}
        isFavorite={false}
        onFavoriteToggle={vi.fn()}
        onLineShare={vi.fn()}
        onMapClick={vi.fn()}
        capsuleTags={[]}
        socialProof={baseSocialProof}
        trustEnabled={true}
      />
    );

    expect(screen.getByText('熱門物件')).toBeInTheDocument();

    const hotBadge = container.querySelector('.animate-pulse');
    expect(hotBadge?.className).toContain('motion-reduce:animate-none');
  });
});
