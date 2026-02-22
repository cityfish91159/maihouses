import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Header from './Header';
import { ROUTES, RouteUtils } from '../../constants/routes';

const mockUsePageMode = vi.fn<() => 'visitor' | 'demo' | 'live'>();
const mockNavigate = vi.fn();

const notifyMocks = vi.hoisted(() => ({
  info: vi.fn(),
}));

const demoExitMocks = vi.hoisted(() => ({
  requestDemoExit: vi.fn(),
}));

const maimaiContextMocks = vi.hoisted(() => ({
  addMessage: vi.fn(),
  setMood: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null,
  role: 'guest' as const,
  signOut: vi.fn(),
  loading: false,
}));

const userCommunityMocks = vi.hoisted(() => ({
  communityId: null as string | null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => authMocks,
}));

vi.mock('../../hooks/useUserCommunity', () => ({
  useUserCommunity: () => userCommunityMocks,
}));

vi.mock('../../hooks/useDemoExit', () => ({
  useDemoExit: () => demoExitMocks,
}));

vi.mock('../../lib/notify', () => ({
  notify: {
    info: notifyMocks.info,
  },
}));

vi.mock('../../context/MaiMaiContext', () => ({
  useMaiMai: () => maimaiContextMocks,
}));

vi.mock('../MaiMai', () => ({
  MaiMaiBase: () => <div data-testid="maimai-base" />,
}));

function wasCanceledByHandler(target: Element): boolean {
  let wasPrevented = false;

  window.addEventListener(
    'click',
    (event) => {
      wasPrevented = event.defaultPrevented;
      event.preventDefault();
    },
    { once: true }
  );

  fireEvent.click(target);
  return wasPrevented;
}

describe('Header + DemoGate integration', () => {
  beforeEach(() => {
    mockUsePageMode.mockReset();
    mockUsePageMode.mockReturnValue('visitor');
    notifyMocks.info.mockReset();
    demoExitMocks.requestDemoExit.mockReset();
    maimaiContextMocks.addMessage.mockReset();
    maimaiContextMocks.setMood.mockReset();
    userCommunityMocks.communityId = null;
    userCommunityMocks.isLoading = false;
    userCommunityMocks.isError = false;
    userCommunityMocks.refetch.mockReset();
    authMocks.isAuthenticated = false;
    authMocks.user = null;
    authMocks.role = 'guest';
    authMocks.loading = false;
    authMocks.signOut.mockReset();
    mockNavigate.mockReset();

    Object.defineProperty(window, 'scrollTo', {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  it('visitor 點 Logo 一次不應被攔截（保留按鈕預設行為）', () => {
    const { getByRole } = render(<Header />);
    const logoButton = getByRole('link', { name: /邁房子/ });

    const isCanceled = wasCanceledByHandler(logoButton);

    expect(isCanceled).toBe(false);
    expect(notifyMocks.info).not.toHaveBeenCalled();
  });

  it('visitor 點 Logo 五次時，第五次應觸發 DemoGate 攔截', () => {
    const { getByRole } = render(<Header />);
    const logoButton = getByRole('link', { name: /邁房子/ });

    for (let index = 0; index < 4; index += 1) {
      const canceled = wasCanceledByHandler(logoButton);
      expect(canceled).toBe(false);
    }

    const canceledOnFifth = wasCanceledByHandler(logoButton);
    expect(canceledOnFifth).toBe(true);
    expect(notifyMocks.info).toHaveBeenCalledWith(
      '已解鎖演示模式',
      '點擊「進入演示」後會重新整理頁面。',
      expect.any(Object)
    );
  });

  it('demo 模式不應顯示登入/註冊按鈕', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { container } = render(<Header />);

    const loginAnchor = container.querySelector('a[href*="auth.html?mode=login"]');
    const signupAnchor = container.querySelector('a[href*="auth.html?mode=signup"]');
    expect(loginAnchor).toBeNull();
    expect(signupAnchor).toBeNull();
  });

  it('demo 模式應顯示退出演示按鈕', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<Header />);

    const exitButton = getByRole('button', { name: /退出演示/ });
    expect(exitButton).toBeDefined();
  });

  it('點擊退出演示按鈕應呼叫 requestDemoExit', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<Header />);

    const exitButton = getByRole('button', { name: /退出演示/ });
    fireEvent.click(exitButton);

    expect(demoExitMocks.requestDemoExit).toHaveBeenCalledTimes(1);
  });

  it('visitor 點社區評價應導向社區探索頁', () => {
    const { getByRole } = render(<Header />);

    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_EXPLORE)
    );
  });

  it('demo 點社區評價應導向 seed 社區牆', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<Header />);

    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL('test-uuid'))
    );
  });

  it('live 且有社區歸屬時，點社區評價導向對應社區牆', () => {
    mockUsePageMode.mockReturnValue('live');
    authMocks.isAuthenticated = true;
    userCommunityMocks.communityId = '11111111-1111-4111-8111-111111111111';

    const { getByRole } = render(<Header />);
    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL('11111111-1111-4111-8111-111111111111'))
    );
  });

  it('live 社區資料 loading 期間，點社區評價回退到探索頁', () => {
    mockUsePageMode.mockReturnValue('live');
    authMocks.isAuthenticated = true;
    userCommunityMocks.communityId = '11111111-1111-4111-8111-111111111111';
    userCommunityMocks.isLoading = true;

    const { getByRole } = render(<Header />);
    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_EXPLORE)
    );
  });
});
