import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: '測試用戶' } },
    session: { access_token: 'token' },
  }),
}));

vi.mock('../../hooks/useTrustActions', () => ({
  useTrustActions: () => ({
    learnMore: vi.fn(),
    requestEnable: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock('../../hooks/usePropertyTracker', () => ({
  usePropertyTracker: () => ({
    trackPhotoClick: vi.fn(),
    trackLineClick: vi.fn(),
    trackCallClick: vi.fn(),
    trackMapClick: vi.fn(),
  }),
}));

vi.mock('../../hooks/useCommunityReviewLike', () => ({
  useCommunityReviewLike: () => ({
    toggleLike: {
      mutate: vi.fn(),
    },
  }),
}));

vi.mock('../../analytics/track', () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertyByPublicId: vi.fn(),
  },
  DEFAULT_PROPERTY: {
    id: 'test-id',
    publicId: 'MH-100001',
    title: '預設物件',
    price: 12800000,
    trustEnabled: true,
    address: '台北市信義區',
    description: '測試描述',
    images: ['https://example.com/image.jpg'],
    size: 30,
    rooms: 2,
    halls: 1,
    bathrooms: 1,
    floorCurrent: '3',
    floorTotal: 10,
    features: [],
    advantage1: '',
    advantage2: '',
    disadvantage: '',
    communityId: 'community-1',
    agent: {
      id: 'agent-001',
      internalCode: 12345,
      name: '游杰倫',
      avatarUrl: 'https://example.com/avatar.jpg',
      company: '邁房子',
      trustScore: 90,
      encouragementCount: 10,
      lineId: 'maihouses_demo',
      phone: '0912-345-678',
    },
  },
}));

const mockPropertyData = {
  id: 'test-id',
  publicId: 'MH-100001',
  title: '新光晴川 B1-12樓',
  price: 12800000,
  trustEnabled: true,
  address: '台北市信義區',
  description: '測試描述',
  images: ['https://example.com/image.jpg'],
  size: 30,
  rooms: 2,
  halls: 1,
  bathrooms: 1,
  floorCurrent: '3',
  floorTotal: 10,
  features: [],
  advantage1: '',
  advantage2: '',
  disadvantage: '',
  communityId: 'community-1',
  agent: {
    id: 'agent-001',
    internalCode: 12345,
    name: '游杰倫',
    phone: '0912-345-678',
    lineId: 'maihouses_demo',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '邁房子',
    trustScore: 95,
    encouragementCount: 50,
  },
};

const renderWithClient = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('PropertyDetailPage MaiMai integration (#18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { view_count: 10, trust_cases_count: 1 } }),
      })
    );
  });

  it('shows MaiMai loading state while property request is pending', () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockImplementation(
      () => new Promise(() => undefined)
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    expect(screen.getByText('正在幫你找房子資訊…')).toBeInTheDocument();
  });

  it('shows generic error title and retries successfully', async () => {
    const user = userEvent.setup();
    vi.mocked(propertyService.getPropertyByPublicId)
      .mockRejectedValueOnce(new Error('NetworkError: Failed to fetch'))
      .mockResolvedValueOnce(mockPropertyData as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('網路連線異常，請檢查網路後重試')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '再試一次' }));

    await waitFor(() => {
      expect(screen.getByText('新光晴川 B1-12樓')).toBeInTheDocument();
    });

    expect(propertyService.getPropertyByPublicId).toHaveBeenCalledTimes(2);
  });

  it('shows reloading copy after retry is triggered', async () => {
    const user = userEvent.setup();
    vi.mocked(propertyService.getPropertyByPublicId)
      .mockRejectedValueOnce(new Error('500 Internal Server Error'))
      .mockImplementationOnce(() => new Promise(() => undefined));

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '再試一次' }));

    await waitFor(() => {
      expect(screen.getByText('重新載入中…')).toBeInTheDocument();
    });
  });

  it('renders sidebar MaiMai companion below AgentTrustCard', async () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('新光晴川 B1-12樓')).toBeInTheDocument();
    });

    expect(screen.getAllByText('這位房仲有開啟安心留痕，交易更有保障').length).toBeGreaterThan(0);
  });
});
