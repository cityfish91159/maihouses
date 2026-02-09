import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PropertyDetailPage, resolvePropertyDetailBackTarget } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 'user-1', email: 'tester@example.com', user_metadata: { name: 'tester' } },
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
    title: 'Default property',
    price: 12800000,
    trustEnabled: true,
    address: 'Xinyi District, Taipei',
    description: 'Default description',
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
      name: 'Agent Name',
      avatarUrl: 'https://example.com/avatar.jpg',
      company: 'Agent Co',
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
  title: 'Skyline B1-12',
  price: 12800000,
  trustEnabled: true,
  address: 'Xinyi District, Taipei',
  description: 'Property description',
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
    name: 'Agent Name',
    phone: '0912-345-678',
    lineId: 'maihouses_demo',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: 'Agent Co',
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

const setViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    writable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

describe('PropertyDetailPage header branding (#11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { view_count: 10, trust_cases_count: 3 } }),
      })
    );
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);
  });

  it('uses branded logo link and navigation semantics', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Skyline B1-12')).toBeInTheDocument();
    });

    const nav = screen.getByRole('navigation', { name: '物件導覽' });
    expect(nav.className).toContain('border-brand-100');

    const logoLink = screen.getByRole('link', { name: '回到邁房子首頁' });
    expect(logoLink).toHaveAttribute('href', '/maihouses/');
  });

  it('renders property id status above gallery (outside header)', async () => {
    const { container } = renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Skyline B1-12')).toBeInTheDocument();
    });

    const nav = screen.getByRole('navigation', { name: '物件導覽' });
    const propertyStatus = container.querySelector('[role="status"][aria-label*="MH-100001"]');
    expect(propertyStatus?.textContent).toContain('MH-100001');
    expect(propertyStatus?.getAttribute('aria-label')).toContain('MH-100001');
    expect(nav?.contains(propertyStatus as Node)).toBe(false);
  });

  it('clicking back button calls navigate with resolved target', async () => {
    const user = userEvent.setup();
    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Skyline B1-12')).toBeInTheDocument();
    });

    const expectedTarget = resolvePropertyDetailBackTarget(window.history.length);
    const backButton = screen.getByRole('button', { name: '返回上一頁' });
    await user.click(backButton);
    expect(mockNavigate).toHaveBeenCalledWith(expectedTarget);
  });

  it('resolves back target correctly for both history branches', () => {
    expect(resolvePropertyDetailBackTarget(1)).toBe('/maihouses/');
    expect(resolvePropertyDetailBackTarget(2)).toBe('/maihouses/');
    expect(resolvePropertyDetailBackTarget(3)).toBe(-1);
  });

  it('has no horizontal overflow on 320px viewport', async () => {
    setViewport(320, 568);
    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Skyline B1-12')).toBeInTheDocument();
    });

    expect(screen.getByRole('navigation', { name: '物件導覽' })).toBeInTheDocument();
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });
});
