import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import UAGPage from './index';
import { ROUTES, RouteUtils } from '../../constants/routes';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockedNavigate };
});

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

/**
 * #5a: usePageMode mock
 * 預設 'demo'，讓既有的 seed 資料測試正常運作
 */
type PageMode = 'visitor' | 'demo' | 'live';
const mockedUsePageMode = vi.hoisted(() => vi.fn<() => PageMode>().mockReturnValue('demo'));
vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: mockedUsePageMode,
  usePageModeWithAuthState: (isAuthenticated: boolean) =>
    isAuthenticated ? 'live' : mockedUsePageMode(),
}));

/**
 * #5a: useAuth mock — 控制 role 和 loading
 */
const mockedUseAuth = vi.hoisted(() =>
  vi.fn().mockReturnValue({
    session: null,
    user: null,
    role: 'guest',
    isAuthenticated: false,
    loading: false,
    error: null,
    signOut: vi.fn(),
  })
);
vi.mock('../../hooks/useAuth', () => ({
  useAuth: mockedUseAuth,
}));

/**
 * #5a #10: setDemoMode / reloadPage mock — 驗證 CTA 互動
 */
const mockedSetDemoMode = vi.hoisted(() => vi.fn(() => true));
const mockedReloadPage = vi.hoisted(() => vi.fn());
vi.mock('../../lib/pageMode', async () => {
  const actual = await vi.importActual('../../lib/pageMode');
  return {
    ...actual,
    setDemoMode: mockedSetDemoMode,
    reloadPage: mockedReloadPage,
  };
});

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
  mockedNotify.warning.mockClear();
  mockedNavigate.mockClear();
  mockedSetDemoMode.mockClear();
  mockedReloadPage.mockClear();
  mockedUsePageMode.mockReturnValue('demo');
  mockedUseAuth.mockReturnValue({
    session: null,
    user: null,
    role: 'guest',
    isAuthenticated: false,
    loading: false,
    error: null,
    signOut: vi.fn(),
  });
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
    expect(screen.getByRole('button', { name: /匯出報表/ })).toBeInTheDocument();
  });

  it('allows selecting and purchasing a lead', { timeout: 20000 }, async () => {
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

  describe('#5a visitor landing page', () => {
    beforeEach(() => {
      mockedUsePageMode.mockReturnValue('visitor');
    });

    it('shows landing page with CTA for visitor mode', () => {
      renderWithQueryClient();

      expect(screen.getByText('房仲專區')).toBeInTheDocument();
      expect(screen.getByText('成為合作房仲')).toBeInTheDocument();
      expect(screen.getByText('已有帳號？登入')).toBeInTheDocument();
      expect(screen.getByText('免費體驗演示')).toBeInTheDocument();
    });

    it('does not render radar or action panel for visitor', () => {
      renderWithQueryClient();

      expect(screen.queryByText(/請點擊上方雷達泡泡/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /匯出報表/ })).not.toBeInTheDocument();
    });

    it('calls setDemoMode and reloadPage when clicking demo CTA', () => {
      renderWithQueryClient();

      fireEvent.click(screen.getByText('免費體驗演示'));

      expect(mockedSetDemoMode).toHaveBeenCalledOnce();
      expect(mockedReloadPage).toHaveBeenCalledOnce();
    });

    it('shows error toast when setDemoMode fails', () => {
      mockedSetDemoMode.mockReturnValue(false);
      renderWithQueryClient();

      fireEvent.click(screen.getByText('免費體驗演示'));

      expect(mockedSetDemoMode).toHaveBeenCalledOnce();
      expect(mockedReloadPage).not.toHaveBeenCalled();
      expect(mockedNotify.error).toHaveBeenCalledWith(
        '無法進入演示模式',
        '您的瀏覽器不支援本地儲存，請關閉私密瀏覽後重試。'
      );
    });
  });

  describe('#5a live mode role guard', () => {
    it('does not redirect live + agent role', () => {
      mockedUsePageMode.mockReturnValue('live');
      mockedUseAuth.mockReturnValue({
        session: {},
        user: { id: 'test-uid', email: 'agent@test.com' },
        role: 'agent',
        isAuthenticated: true,
        loading: false,
        error: null,
        signOut: vi.fn(),
      });

      renderWithQueryClient();

      // agent 不應被 redirect，也不應看到 Landing Page
      expect(mockedNavigate).not.toHaveBeenCalled();
      expect(mockedNotify.warning).not.toHaveBeenCalled();
      expect(screen.queryByText('免費體驗演示')).not.toBeInTheDocument();
    });

    it('redirects live + consumer role to home with warning', async () => {
      mockedUsePageMode.mockReturnValue('live');
      mockedUseAuth.mockReturnValue({
        session: {},
        user: { id: 'test-uid', email: 'consumer@test.com' },
        role: 'consumer',
        isAuthenticated: true,
        loading: false,
        error: null,
        signOut: vi.fn(),
      });

      renderWithQueryClient();

      await waitFor(() => {
        expect(mockedNotify.warning).toHaveBeenCalledWith(
          '權限不足',
          '你的帳號角色無法存取 UAG 後台'
        );
      });
      expect(mockedNavigate).toHaveBeenCalledWith(RouteUtils.toNavigatePath(ROUTES.HOME), {
        replace: true,
      });
    });
  });

  it('#24a demo 模式點擊「查看對話」應開啟 MockChatModal 且不導頁', async () => {
    renderWithQueryClient();

    const viewChatButtons = await screen.findAllByRole('button', { name: '查看對話' });
    const firstViewChatButton = viewChatButtons[0];
    expect(firstViewChatButton).toBeDefined();

    fireEvent.click(firstViewChatButton!);

    expect(await screen.findByRole('dialog', { name: 'Mock 客戶對話' })).toBeInTheDocument();
    expect(mockedNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '關閉對話' }));
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Mock 客戶對話' })).not.toBeInTheDocument();
    });
  });
});
