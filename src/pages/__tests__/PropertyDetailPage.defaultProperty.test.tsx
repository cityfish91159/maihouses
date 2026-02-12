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
    user: { id: 'user-1', email: 'test@example.com', user_metadata: { name: 'Test User' } },
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

  it('uses DEFAULT_PROPERTY fallback and still renders agent CTAs', async () => {
    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('agent-card-line-button')).toBeInTheDocument();
      expect(screen.getByTestId('agent-card-call-button')).toBeInTheDocument();
    });
  });

  it('LINE panel uses direct flow when fallback property has line id', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('agent-card-line-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-line-button'));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('call panel uses direct phone and does not require fallback input', async () => {
    const user = userEvent.setup();

    renderWithClient(
      <MemoryRouter initialEntries={['/maihouses/property/MH-100001']}>
        <PropertyDetailPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('agent-card-call-button')).toBeInTheDocument();
    });

    await user.click(screen.getByTestId('agent-card-call-button'));

    expect(await screen.findByText(/0912[- ]?345[- ]?678/)).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
