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

vi.mock('../../analytics/track', () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

const renderWithClient = (ui: ReactElement) => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
};

describe('PropertyDetailPage DEFAULT_PROPERTY fallback (#5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(propertyService, 'getPropertyByPublicId').mockResolvedValue(null);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { view_count: 20, trust_cases_count: 1 } }),
      })
    );
  });

  it('當 propertyService 回傳 null 時應顯示 DEFAULT_PROPERTY 的 mock agent 資料', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('游杰倫')).toBeInTheDocument();
      expect(screen.getAllByText('邁房子').length).toBeGreaterThan(0);
    });
  });

  it('LINE 面板應使用 DEFAULT_PROPERTY.lineId 並顯示開啟 LINE（非 fallback）', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('游杰倫')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-line-button'));

    expect(await screen.findByRole('button', { name: '開啟 LINE' })).toBeInTheDocument();
    expect(screen.queryByLabelText('你的 LINE ID')).not.toBeInTheDocument();
  });

  it('致電面板應使用 DEFAULT_PROPERTY.phone 並顯示號碼（非 fallback）', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('游杰倫')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-call-button'));

    expect(await screen.findByText('0912345678')).toBeInTheDocument();
    expect(screen.queryByLabelText('你的電話')).not.toBeInTheDocument();
  });
});
