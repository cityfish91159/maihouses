import { fireEvent, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GlobalHeader } from './GlobalHeader';
import { ROUTES, RouteUtils } from '../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../constants/seed';

const mockNavigate = vi.fn();
const mockUsePageMode = vi.fn<() => 'visitor' | 'demo' | 'live'>();

const authMocks = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as { id: string } | null,
  signOut: vi.fn(),
  role: 'guest' as const,
}));

const userCommunityMocks = vi.hoisted(() => ({
  communityId: null as string | null,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
}));

const notificationsMocks = vi.hoisted(() => ({
  count: 0,
  notifications: [],
  isLoading: false,
  isStale: false,
  refresh: vi.fn(),
}));

const demoExitMocks = vi.hoisted(() => ({
  requestDemoExit: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../hooks/usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => authMocks,
}));

vi.mock('../../hooks/useUserCommunity', () => ({
  useUserCommunity: () => userCommunityMocks,
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: () => notificationsMocks,
}));

vi.mock('../../hooks/useDemoExit', () => ({
  useDemoExit: () => demoExitMocks,
}));

describe('GlobalHeader community navigation (#12b)', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    mockUsePageMode.mockReset();
    mockUsePageMode.mockReturnValue('visitor');

    authMocks.isAuthenticated = false;
    authMocks.user = null;
    authMocks.signOut.mockReset();

    userCommunityMocks.communityId = null;
    userCommunityMocks.isLoading = false;
    userCommunityMocks.isError = false;
    userCommunityMocks.refetch.mockReset();

    notificationsMocks.count = 0;
    notificationsMocks.notifications = [];
    notificationsMocks.isLoading = false;
    notificationsMocks.isStale = false;
    notificationsMocks.refresh.mockReset();

    demoExitMocks.requestDemoExit.mockReset();
  });

  it('visitor 點社區評價導向探索頁', () => {
    const { getByRole } = render(<GlobalHeader mode="consumer" />);

    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_EXPLORE));
  });

  it('demo 點社區評價導向 seed 社區牆', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole } = render(<GlobalHeader mode="consumer" />);

    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID))
    );
  });

  it('live 且有社區歸屬時導向對應社區牆', () => {
    mockUsePageMode.mockReturnValue('live');
    authMocks.isAuthenticated = true;
    authMocks.user = { id: 'user-1' };
    userCommunityMocks.communityId = '11111111-1111-4111-8111-111111111111';

    const { getByRole } = render(<GlobalHeader mode="consumer" />);
    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(
      RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL('11111111-1111-4111-8111-111111111111'))
    );
  });

  it('live 載入社區歸屬中時回退探索頁', () => {
    mockUsePageMode.mockReturnValue('live');
    authMocks.isAuthenticated = true;
    authMocks.user = { id: 'user-1' };
    userCommunityMocks.communityId = '11111111-1111-4111-8111-111111111111';
    userCommunityMocks.isLoading = true;

    const { getByRole } = render(<GlobalHeader mode="consumer" />);
    fireEvent.click(getByRole('button', { name: '社區評價' }));

    expect(mockNavigate).toHaveBeenCalledWith(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_EXPLORE));
  });

  it('demo 模式顯示退出演示按鈕且隱藏登入入口', () => {
    mockUsePageMode.mockReturnValue('demo');
    const { getByRole, queryByText } = render(<GlobalHeader mode="consumer" />);

    const exitButton = getByRole('button', { name: '退出演示' });
    expect(exitButton).toBeDefined();
    expect(queryByText('登入')).toBeNull();

    fireEvent.click(exitButton);
    expect(demoExitMocks.requestDemoExit).toHaveBeenCalledTimes(1);
  });
});
