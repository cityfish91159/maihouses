import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import CommunityTeaser from '../CommunityTeaser';
import { BACKUP_REVIEWS } from '../../../../constants/data';

const mockNavigate = vi.fn();
const mockUsePageMode = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

const mockUseQuery = vi.fn();
vi.mock('@tanstack/react-query', () => ({
  useQuery: (options: unknown) => mockUseQuery(options),
}));

vi.mock('../../../../services/communityService', () => ({
  getFeaturedHomeReviews: vi.fn(),
}));

vi.mock('../../../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../components/HomeCard', () => ({
  HomeCard: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="home-card" className={className}>
      {children}
    </div>
  ),
}));

vi.mock('../../components/ReviewCard', () => ({
  ReviewCard: ({ name, content }: { name: string; content: string }) => (
    <div data-testid="review-card">
      {name}: {content}
    </div>
  ),
}));

describe('CommunityTeaser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePageMode.mockReturnValue('demo');
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
  });

  it('passes mode-aware query key to useQuery', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CommunityTeaser />);

    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['featured-reviews', 'demo'],
      })
    );
  });

  it('renders loading skeleton when loading', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    });

    render(<CommunityTeaser />);

    const skeletons = document.getElementsByClassName('animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders API data when successful', () => {
    const mockData = [
      {
        id: 'uuid-1',
        displayId: 'A',
        name: 'Test User',
        rating: 5,
        tags: ['#Tag'],
        content: 'Great content',
        source: 'real',
        communityId: 'comm-1',
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    expect(screen.getByText('Test User: Great content')).toBeInTheDocument();
    expect(screen.queryByText('使用備用資料')).not.toBeInTheDocument();
  });

  it('renders backup data and error badge when API fails', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<CommunityTeaser />);

    expect(
      screen.getByText(`${BACKUP_REVIEWS[0]?.name}: ${BACKUP_REVIEWS[0]?.content}`)
    ).toBeInTheDocument();
    expect(screen.getByText('使用備用資料')).toBeInTheDocument();
  });

  it('navigates to community wall when clicking real review', () => {
    const mockData = [
      {
        id: 'uuid-1',
        displayId: 'A',
        name: 'Real User',
        rating: 5,
        tags: ['#Tag'],
        content: 'Real content',
        source: 'real',
        communityId: 'comm-123',
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    const card = screen.getByText('Real User: Real content').closest('div[role="button"]');
    fireEvent.click(card!);

    expect(mockNavigate).toHaveBeenCalledWith('/community/comm-123/wall');
  });

  it('redirects to static page when clicking seed review', () => {
    const mockData = [
      {
        id: 'seed-1',
        displayId: 'B',
        name: 'Seed User',
        rating: 5,
        tags: ['#Tag'],
        content: 'Seed content',
        source: 'seed',
        communityId: null,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: mockData,
      isLoading: false,
      isError: false,
    });

    render(<CommunityTeaser />);

    const card = screen.getByText('Seed User: Seed content').closest('div[role="button"]');
    fireEvent.click(card!);

    expect(window.location.href).toBe('/maihouses/community-wall_mvp.html');
  });
});
