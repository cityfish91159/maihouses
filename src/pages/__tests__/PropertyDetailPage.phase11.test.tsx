import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { PropertyDetailPage } from '../PropertyDetailPage';
import { propertyService } from '../../services/propertyService';
import { track } from '../../analytics/track';

const mockAuthState: {
  isAuthenticated: boolean;
  user: { id: string; email: string; user_metadata: { name: string } } | null;
  session: { access_token: string } | null;
} = {
  isAuthenticated: true,
  user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: '測試用戶' } },
  session: { access_token: 'token' },
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'MH-100001' }),
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
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

const mockPropertyWithoutLineId = {
  ...mockPropertyData,
  trustEnabled: false,
  agent: {
    ...mockPropertyData.agent,
    lineId: null,
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

const getPostRequestBodyByUrl = <TBody extends Record<string, unknown>>(url: string): TBody => {
  const fetchMock = vi.mocked(fetch);
  const matchedCall = fetchMock.mock.calls.find(
    ([requestUrl, init]) =>
      requestUrl === url && (init as { method?: string } | undefined)?.method === 'POST'
  );

  expect(matchedCall).toBeDefined();
  const body = (matchedCall?.[1] as { body?: string } | undefined)?.body;
  return JSON.parse(body ?? '{}') as TBody;
};

describe('PropertyDetailPage phase11 interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState.isAuthenticated = true;
    mockAuthState.user = { id: 'user-1', email: 'test@example.com', user_metadata: { name: '測試用戶' } };
    mockAuthState.session = { access_token: 'token' };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { case_id: 'case-1' } }),
      })
    );
  });

  it(
    '點擊加 LINE 後應開啟 LineLinkPanel',
    async () => {
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

    await user.click(screen.getAllByRole('button', { name: '加 LINE 聊聊' })[0]!);

      expect(
        await screen.findByRole('button', { name: '開啟 LINE' }, { timeout: 10000 })
      ).toBeInTheDocument();
    },
    15000
  );

  it('點擊致電後應開啟 CallConfirmPanel', async () => {
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

    await user.click(screen.getAllByRole('button', { name: '致電諮詢' })[0]!);

    expect(await screen.findByRole('button', { name: '撥打電話' })).toBeInTheDocument();
  });

  it('點擊側欄 LINE 按鈕應開啟 LineLinkPanel', async () => {
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

    expect(await screen.findByRole('button', { name: '開啟 LINE' })).toBeInTheDocument();
  });

  it('點擊側欄致電按鈕應開啟 CallConfirmPanel', async () => {
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

    expect(await screen.findByRole('button', { name: '撥打電話' })).toBeInTheDocument();
  });

  it('LINE fallback 且勾選安心留痕時，ContactModal 應顯示附帶需求提示', async () => {
    const user = userEvent.setup();
    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue(
      mockPropertyWithoutLineId as never
    );

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試經紀人')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-line-button'));
    await user.click(screen.getByRole('checkbox'));
    await user.type(screen.getByLabelText('你的 LINE ID'), 'fallback_line_id');
    await user.click(screen.getByRole('button', { name: '改用聯絡表單' }));

    expect(await screen.findByText('已附帶安心留痕需求')).toBeInTheDocument();
  });

  it('情境 A（登入+已開啟）勾選後應呼叫 auto-create-case-public 並追蹤 created', async () => {
    const user = userEvent.setup();
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    vi.spyOn(window, 'open').mockImplementation(openSpy);

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
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/trust/auto-create-case-public',
      expect.objectContaining({ method: 'POST' })
    );
    const requestBody = getPostRequestBodyByUrl<{
      propertyId?: string;
      userId?: string;
    }>('/api/trust/auto-create-case-public');
    expect(requestBody.propertyId).toBe('MH-100001');
    expect(requestBody.userId).toBe('user-1');
    expect(track).toHaveBeenCalledWith(
      'trust_assure_checked',
      expect.objectContaining({ scenario: 'A', panel: 'line' })
    );
    expect(track).toHaveBeenCalledWith(
      'trust_assure_created',
      expect.objectContaining({ scenario: 'A', property_id: 'MH-100001' })
    );
  });

  it('情境 B（登入+未開啟）勾選後應呼叫 enable-trust 並追蹤 requested', async () => {
    const user = userEvent.setup();
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    vi.spyOn(window, 'open').mockImplementation(openSpy);

    vi.mocked(propertyService.getPropertyByPublicId).mockResolvedValue({
      ...mockPropertyData,
      trustEnabled: false,
    } as never);

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('測試經紀人')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-line-button'));
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/property/enable-trust',
      expect.objectContaining({ method: 'POST' })
    );
    expect(track).toHaveBeenCalledWith(
      'trust_assure_requested',
      expect.objectContaining({ scenario: 'B', property_id: 'MH-100001' })
    );
  });

  it('情境 C（未登入+已開啟）勾選後應呼叫匿名 auto-create-case-public', async () => {
    const user = userEvent.setup();
    const openSpy = vi.fn().mockReturnValue({ closed: false });
    vi.spyOn(window, 'open').mockImplementation(openSpy);

    mockAuthState.isAuthenticated = false;
    mockAuthState.user = null;
    mockAuthState.session = null;

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
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: '開啟 LINE' }));

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/trust/auto-create-case-public',
      expect.objectContaining({ method: 'POST' })
    );
    const requestBody = getPostRequestBodyByUrl<{
      propertyId?: string;
      userId?: string;
    }>('/api/trust/auto-create-case-public');
    expect(requestBody.propertyId).toBe('MH-100001');
    expect(requestBody.userId).toBeUndefined();
    expect(track).toHaveBeenCalledWith(
      'trust_assure_created',
      expect.objectContaining({ scenario: 'C', property_id: 'MH-100001' })
    );
  });
});
