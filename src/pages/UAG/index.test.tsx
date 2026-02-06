import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import UAGPage from './index';

const mockedNotify = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  loading: vi.fn(() => 'toast-id'),
  dev: vi.fn(),
  dismiss: vi.fn(),
}));

vi.mock('../../lib/notify', () => ({
  notify: mockedNotify,
}));

// Mock Supabase client to avoid environment variable issues
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => ({ data: {}, error: null })),
        or: vi.fn(() => ({ data: [], error: null })),
        order: vi.fn(() => ({
          limit: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
    })),
    rpc: vi.fn(),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn(),
          },
        },
      })),
    },
  },
}));

beforeAll(() => {
  // jsdom does not implement scrollIntoView by default
  Element.prototype.scrollIntoView = vi.fn();

  // Mock matchMedia for components that expect it (jsdom lacks implementation)
  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

beforeEach(() => {
  mockedNotify.success.mockClear();
  mockedNotify.error.mockClear();
});

const renderWithQueryClient = () => {
  const queryClient = new QueryClient();
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <UAGPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
};

describe('UAGPage', () => {
  it('renders radar layout and default action panel', async () => {
    renderWithQueryClient();

    expect(await screen.findByText('UAG 精準導客雷達')).toBeInTheDocument();
    expect(screen.getByText(/請點擊上方雷達泡泡/)).toBeInTheDocument();
    expect(screen.getByText('點數')).toBeInTheDocument();
  });

  it('allows selecting and purchasing a lead', async () => {
    renderWithQueryClient();

    // Wait for data to load (mock mode is default)
    const leadBubble = await screen.findByLabelText(/買家 B218/);
    fireEvent.click(leadBubble);

    expect(screen.getByText('S級｜買家 B218')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /獲取聯絡權限/ }));
    const confirmButton = await screen.findByRole('button', {
      name: /確定花費 20 點/,
    });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockedNotify.success).toHaveBeenCalledWith('購買成功');
    });

    await waitFor(() => {
      expect(screen.queryByText('S級｜買家 B218')).not.toBeInTheDocument();
    });
  });
});
