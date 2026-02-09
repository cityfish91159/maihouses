import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: '游杰倫' } },
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
    title: '測試物件',
    price: 1280,
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
  title: '測試物件',
  price: 1280,
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

describe('PropertyDetailPage viewport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { view_count: 10, trust_cases_count: 1 },
        }),
      })
    );
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);
  });

  it('uses dvh viewport class for iOS-safe height behavior', async () => {
    const { container } = renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試物件')).toBeInTheDocument();
    });

    const viewportRoot = Array.from(container.querySelectorAll('div')).find((node) =>
      node.className.includes('min-h-dvh')
    );

    expect(viewportRoot).toBeTruthy();
  });
});
