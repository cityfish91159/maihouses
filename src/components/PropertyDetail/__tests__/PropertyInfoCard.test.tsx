import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { PropertyData } from '../../../services/propertyService';
import { PropertyInfoCard } from '../PropertyInfoCard';

const baseProperty: PropertyData = {
  id: 'property-1',
  publicId: 'MH-100001',
  title: '信義區景觀宅，採光極佳，近捷運與商圈，生活機能完整',
  price: 2880,
  address: '台北市信義區松高路 1 號 10 樓',
  description: '測試物件描述',
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

function renderPropertyInfoCard(
  options: {
    trustEnabled?: boolean;
    socialProof?: typeof baseSocialProof;
    isFavorite?: boolean;
    onFavoriteToggle?: () => void;
    onLineShare?: () => void;
  } = {}
) {
  const onFavoriteToggle = options.onFavoriteToggle ?? vi.fn();
  const onLineShare = options.onLineShare ?? vi.fn();

  render(
    <PropertyInfoCard
      property={baseProperty}
      isFavorite={options.isFavorite ?? false}
      onFavoriteToggle={onFavoriteToggle}
      onLineShare={onLineShare}
      capsuleTags={['近捷運', '採光佳']}
      socialProof={options.socialProof ?? baseSocialProof}
      trustEnabled={options.trustEnabled ?? true}
    />
  );

  return { onFavoriteToggle, onLineShare };
}

describe('PropertyInfoCard D5', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('hides hot and trust-cases text when trust is disabled', () => {
    renderPropertyInfoCard({ trustEnabled: false });

    expect(screen.queryByText('熱門物件')).not.toBeInTheDocument();
    expect(screen.queryByText(/本物件 \d+ 組客戶已賞屋/)).not.toBeInTheDocument();
  });

  it('shows hot and trust-cases text when trust is enabled', () => {
    renderPropertyInfoCard({ trustEnabled: true });

    expect(screen.getByText('熱門物件')).toBeInTheDocument();
    expect(screen.getByText('本物件 4 組客戶已賞屋')).toBeInTheDocument();
  });

  it('hides trust-cases text when trustCasesCount is 0', () => {
    renderPropertyInfoCard({
      trustEnabled: true,
      socialProof: {
        ...baseSocialProof,
        trustCasesCount: 0,
      },
    });

    expect(screen.queryByText(/本物件 \d+ 組客戶已賞屋/)).not.toBeInTheDocument();
  });

  it('uses two-line clamp for long title', () => {
    renderPropertyInfoCard();

    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveClass('line-clamp-2');
  });

  it('truncates address by default and expands after toggle click', () => {
    renderPropertyInfoCard();

    const toggle = screen.getByTestId('address-toggle');
    const addressText = screen.getByTestId('property-address-text');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(addressText).toHaveClass('truncate');

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(addressText).not.toHaveClass('truncate');
    expect(screen.getByText('收起地址')).toBeInTheDocument();
  });

  it('uses >=44px touch targets for share/favorite controls', () => {
    renderPropertyInfoCard();

    const actionGroup = screen.getByTestId('property-info-actions');
    const actionButtons = within(actionGroup).getAllByRole('button');

    actionButtons.forEach((button) => {
      expect(button.className).toContain('min-h-[44px]');
      expect(button.className).toContain('min-w-[44px]');
    });
  });

  it('calls onFavoriteToggle when favorite button is clicked', () => {
    const onFavoriteToggle = vi.fn();
    renderPropertyInfoCard({ onFavoriteToggle });

    fireEvent.click(screen.getByTestId('favorite-button'));

    expect(onFavoriteToggle).toHaveBeenCalledTimes(1);
  });

  it('calls onLineShare when line share button is clicked', () => {
    const onLineShare = vi.fn();
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    renderPropertyInfoCard({ onLineShare });

    const actionGroup = screen.getByTestId('property-info-actions');
    const buttons = within(actionGroup).getAllByRole('button');
    fireEvent.click(buttons[0]!);

    expect(onLineShare).toHaveBeenCalledTimes(1);
    windowOpenSpy.mockRestore();
  });

  it('animates current viewers number and settles at target value', async () => {
    renderPropertyInfoCard();

    expect(screen.getByTestId('current-viewers-count')).toHaveTextContent('0');

    await waitFor(
      () => {
        expect(screen.getByTestId('current-viewers-count')).toHaveTextContent('12');
      },
      { timeout: 2000 }
    );
  });
});
