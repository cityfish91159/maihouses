import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';

const { propertyDetailMaiMaiSpy, maimaiBaseSpy } = vi.hoisted(() => ({
  propertyDetailMaiMaiSpy: vi.fn(),
  maimaiBaseSpy: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

vi.mock('../../components/MaiMai', async () => {
  const actual =
    await vi.importActual<typeof import('../../components/MaiMai')>('../../components/MaiMai');

  return {
    ...actual,
    MaiMaiBase: ({
      mood,
      animated,
      showEffects,
    }: {
      mood: string;
      animated?: boolean;
      showEffects?: boolean;
    }) => {
      maimaiBaseSpy({ mood, animated, showEffects });
      return (
        <div
          data-testid="maimai-base"
          data-mood={mood}
          data-animated={String(animated)}
          data-show-effects={String(showEffects)}
        />
      );
    },
  };
});

vi.mock('../../components/PropertyDetail', async () => {
  const actual = await vi.importActual<typeof import('../../components/PropertyDetail')>(
    '../../components/PropertyDetail'
  );

  return {
    ...actual,
    PropertyDetailMaiMai: ({
      trustEnabled,
      isHot,
      trustCasesCount,
      agentName,
      propertyId,
    }: {
      trustEnabled: boolean;
      isHot: boolean;
      trustCasesCount: number;
      agentName: string;
      propertyId: string;
    }) => {
      propertyDetailMaiMaiSpy({ trustEnabled, isHot, trustCasesCount, agentName, propertyId });
      return (
        <div
          data-testid="property-detail-maimai"
          data-trust-enabled={String(trustEnabled)}
          data-is-hot={String(isHot)}
          data-trust-cases-count={String(trustCasesCount)}
          data-agent-name={agentName}
          data-property-id={propertyId}
        />
      );
    },
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

function stubMatchMedia(matches: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

describe('PropertyDetailPage MaiMai integration (#18)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    stubMatchMedia(false);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { view_count: 10, trust_cases_count: 1 } }),
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    expect(screen.getByTestId('maimai-base')).toHaveAttribute('data-mood', 'thinking');
  });

  it('respects prefers-reduced-motion in loading state', () => {
    stubMatchMedia(true);
    vi.mocked(propertyService.getPropertyByPublicId).mockImplementation(
      () => new Promise(() => undefined)
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    const loadingMaiMai = screen.getByTestId('maimai-base');
    expect(loadingMaiMai).toHaveAttribute('data-mood', 'thinking');
    expect(loadingMaiMai).toHaveAttribute('data-animated', 'false');
    expect(loadingMaiMai).toHaveAttribute('data-show-effects', 'false');
  });

  it('respects prefers-reduced-motion in error state', async () => {
    stubMatchMedia(true);
    vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValueOnce(
      new Error('network fail')
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });

    const errorMaiMai = screen.getByTestId('maimai-base');
    expect(errorMaiMai).toHaveAttribute('data-mood', 'shy');
    expect(errorMaiMai).toHaveAttribute('data-animated', 'false');
    expect(errorMaiMai).toHaveAttribute('data-show-effects', 'false');
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
      expect(screen.getByRole('button', { name: '再試一次' })).toBeInTheDocument();
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

  it('passes expected props to sidebar PropertyDetailMaiMai', async () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('property-detail-maimai')).toBeInTheDocument();
    });

    const sidebarMaiMai = screen.getByTestId('property-detail-maimai');
    expect(sidebarMaiMai).toHaveAttribute('data-trust-enabled', 'true');
    expect(sidebarMaiMai).toHaveAttribute('data-is-hot', 'false');
    expect(sidebarMaiMai).toHaveAttribute('data-trust-cases-count', '1');
    expect(sidebarMaiMai).toHaveAttribute('data-agent-name', '游杰倫');
    expect(sidebarMaiMai).toHaveAttribute('data-property-id', 'MH-100001');

    expect(propertyDetailMaiMaiSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        trustEnabled: true,
        isHot: false,
        trustCasesCount: 1,
        agentName: '游杰倫',
        propertyId: 'MH-100001',
      })
    );
  });

  it('shows network-specific error message when fetch fails', async () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValueOnce(
      new TypeError('Failed to fetch')
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('網路連線異常，請檢查網路後重試')).toBeInTheDocument();
    });
  });

  it('shows not-found error message when property does not exist', async () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValueOnce(
      new Error('404 not found')
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('此物件不存在或已下架')).toBeInTheDocument();
    });
  });

  it('shows server error message when 500 status', async () => {
    vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValueOnce(
      new Error('500 Internal Server Error')
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('伺服器異常，請稍後再試')).toBeInTheDocument();
    });
  });

  it('maintains reduced-motion setting across loading to error transition', async () => {
    stubMatchMedia(true);

    vi.mocked(propertyService.getPropertyByPublicId).mockRejectedValueOnce(
      new Error('Network error')
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
    });

    const errorMaiMai = screen.getByTestId('maimai-base');
    expect(errorMaiMai).toHaveAttribute('data-animated', 'false');
    expect(errorMaiMai).toHaveAttribute('data-show-effects', 'false');
  });

  it('maintains reduced-motion setting across error to retry loading transition', async () => {
    stubMatchMedia(true);
    const user = userEvent.setup();

    vi.mocked(propertyService.getPropertyByPublicId)
      .mockRejectedValueOnce(new Error('fail'))
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

    const loadingMaiMai = screen.getByTestId('maimai-base');
    expect(loadingMaiMai).toHaveAttribute('data-animated', 'false');
    expect(loadingMaiMai).toHaveAttribute('data-show-effects', 'false');
  });
});
