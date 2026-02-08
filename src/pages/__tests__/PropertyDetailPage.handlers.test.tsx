import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';

// 移除舊的 spy 變數,Phase 11 已改為直接使用 useState 管理面板狀態

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

// PropertyDetailPage 直接使用 useState 管理面板狀態,不需要 mock useContactPanels

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

vi.mock('../../services/propertyService', () => ({
  propertyService: {
    getPropertyByPublicId: vi.fn(),
  },
  DEFAULT_PROPERTY: {
    id: 'test-id',
    publicId: 'MH-100001',
    title: '測試物件',
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
    agent: {
      id: 'agent-001',
      internalCode: 12345,
      name: '預設經紀人',
      avatarUrl: 'https://example.com/avatar.jpg',
      company: '預設公司',
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
  agent: {
    id: 'agent-001',
    internalCode: 12345,
    name: '測試經紀人',
    phone: '0912-345-678',
    lineId: 'maihouses_demo',
    avatarUrl: 'https://example.com/avatar.jpg',
    company: '測試房仲',
    trustScore: 95,
    encouragementCount: 50,
  },
  district: '信義區',
};

const renderWithClient = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

// Mock track 和 logger
vi.mock('../../analytics/track', () => ({
  track: vi.fn(),
}));

vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe('PropertyDetailPage sidebar handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handleAgentLineClick 應開啟 LineLinkPanel', async () => {
    const user = userEvent.setup();
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試經紀人')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-line-button'));

    // 驗證 LineLinkPanel 開啟 (dialog role)
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /加 LINE 聊聊/i })).toBeInTheDocument();
    });
  });

  it('handleAgentCallClick 應開啟 CallConfirmPanel', async () => {
    const user = userEvent.setup();
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(mockPropertyData as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試經紀人')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-call-button'));

    // 驗證 CallConfirmPanel 開啟
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /致電諮詢/i })).toBeInTheDocument();
    });
  });

});

