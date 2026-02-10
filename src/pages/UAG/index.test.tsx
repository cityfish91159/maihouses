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
  Element.prototype.scrollIntoView = vi.fn();

  Object.defineProperty(globalThis, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
}

beforeEach(() => {
  mockedNotify.success.mockClear();
  mockedNotify.error.mockClear();
  setViewportWidth(1024);
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
  it('renders radar layout and desktop footer by default', async () => {
    renderWithQueryClient();

    expect(await screen.findByText('UAG 精準導客雷達')).toBeInTheDocument();
    expect(screen.getByText(/請點擊上方雷達泡泡/)).toBeInTheDocument();
    expect(screen.getByText('點數')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'UAG 行動分頁' })).not.toBeInTheDocument();
  });

  it('shows mobile tab bar and switches 4 tabs on mobile', async () => {
    setViewportWidth(375);
    renderWithQueryClient();

    const tabBar = await screen.findByRole('navigation', { name: 'UAG 行動分頁' });
    expect(tabBar).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '概覽' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '商機' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '監控' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '設定' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '商機' }));
    expect(await screen.findByText('我的房源總覽')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '監控' }));
    expect(await screen.findByText('已購客戶資產與保護監控')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '設定' }));
    expect(await screen.findByText('工作台設定')).toBeInTheDocument();
  });

  it('allows selecting and purchasing a lead', { timeout: 20000 }, async () => {
    renderWithQueryClient();

    const leadBubble = await screen.findByLabelText(/買家 B218/);
    fireEvent.click(leadBubble);

    expect(screen.getAllByText('S級｜買家 B218').length).toBeGreaterThan(0);

    const purchaseButtons = screen.getAllByRole('button', { name: /獲取聯絡權限/ });
    fireEvent.click(purchaseButtons[0]!);
    const confirmButtons = await screen.findAllByRole('button', {
      name: /確定花費 20 點/,
    });
    fireEvent.click(confirmButtons[0]!);

    await waitFor(() => {
      expect(mockedNotify.success).toHaveBeenCalledWith('購買成功');
    });

    await waitFor(() => {
      expect(screen.queryAllByText('S級｜買家 B218')).toHaveLength(0);
    });
  });
});
