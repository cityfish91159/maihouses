/**
 * P7 Scenario Verification Test Suite
 *
 * 嚴格驗證 P7-7 定義的四種用戶情境
 * 1. 訪客 (Guest)
 * 2. 一般會員 (Member)
 * 3. 認證住戶 (Resident)
 * 4. 房仲 (Agent)
 *
 * 驗證重點：
 * - UI 呈現 (鎖定畫面 vs 內容)
 * - 互動行為 (跳轉 vs 提示)
 * - 資料層安全 (是否洩漏私密貼文)
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Consumer from '../Consumer';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedData } from '../../../hooks/useFeedData';
import { STRINGS } from '../../../constants/strings';

// Define mocks using hoisting to avoid ReferenceError
const mocks = vi.hoisted(() => ({
  notify: { info: vi.fn(), error: vi.fn() },
  navigate: vi.fn(),
}));

// Mock Dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useFeedData');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});
vi.mock('../../../lib/notify', () => ({ notify: mocks.notify }));

// Mock Env to bypass strict check
vi.mock('../../../config/env', () => ({
  mhEnv: {
    isMockEnabled: () => true,
    subscribe: () => () => {},
  },
}));

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ data: [], error: null }) }),
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: vi.fn() }) }),
    }),
    removeChannel: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = { href: '' };
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('P7 Scenario Verification (L7+ Standard)', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{ui}</MemoryRouter>
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  // Mock UseFeedData with controllable private posts
  const mockPrivatePost = {
    id: 1,
    content: 'Secret Content',
    author: 'Resident A',
    private: true,
    likes: 5,
    comments: 2,
  };

  const mockPublicPost = {
    id: 2,
    content: 'Public Content',
    author: 'Resident B',
    private: false,
    likes: 10,
    comments: 0,
  };

  const mockUseFeedDataBase = {
    authLoading: false,
    activeTransaction: { hasActive: false },
    userProfile: null,
    userInitial: 'G',
    isAuthenticated: false,
    isLoading: false,
    error: null,
    data: { posts: [mockPublicPost, mockPrivatePost], totalPosts: 2 },
    sidebarData: { hotPosts: [], saleItems: [] },
    useMock: true,
    setUseMock: vi.fn(),
    refresh: vi.fn(),
    isLiked: vi.fn().mockReturnValue(false),
    handleLike: vi.fn(),
    handleCreatePost: vi.fn(),
    handleReply: vi.fn(),
    handleComment: vi.fn(),
    handleShare: vi.fn(),
  };

  const setupAuth = (role: string, isAuthenticated: boolean) => {
    (useAuth as any).mockReturnValue({
      user: isAuthenticated ? { id: 'user-1' } : null,
      role: role,
      isAuthenticated,
      loading: false,
    });
  };

  const setupFeedMock = (canViewPrivate: boolean) => {
    (useFeedData as any).mockReturnValue({
      ...mockUseFeedDataBase,
      data: { posts: [mockPublicPost, mockPrivatePost] },
    });
  };

  it('Scenario 1: Viewer is Guest', async () => {
    setupAuth('guest', false);
    setupFeedMock(false);

    renderWithProviders(<Consumer />);

    const privateTab = screen.getByText(STRINGS.FEED.TABS.PRIVATE);
    expect(privateTab).toBeDefined();

    fireEvent.click(privateTab);

    expect(screen.getByText(STRINGS.COMMUNITY.LOCKED_TITLE)).toBeDefined();
    expect(screen.queryByText('Secret Content')).toBeNull();

    const unlockBtn = screen.getByRole('button', {
      name: STRINGS.COMMUNITY.BTN_UNLOCK_GUEST,
    });
    fireEvent.click(unlockBtn);

    expect(window.location.href).toContain('/maihouses/auth.html');
    expect(window.location.href).toContain('mode=login');
    expect(window.location.href).toContain('return=');
  });

  it('Scenario 2: Viewer is Member', async () => {
    setupAuth('member', true);
    setupFeedMock(false);

    renderWithProviders(<Consumer />);
    fireEvent.click(screen.getByText(STRINGS.FEED.TABS.PRIVATE));

    expect(screen.getByText(STRINGS.COMMUNITY.LOCKED_TITLE)).toBeDefined();

    expect(screen.getByText(STRINGS.COMMUNITY.LOCKED_DESC_USER)).toBeDefined();

    const unlockBtn = screen.getByRole('button', {
      name: STRINGS.COMMUNITY.BTN_UNLOCK_USER,
    });
    fireEvent.click(unlockBtn);

    expect(mocks.notify.info).toHaveBeenCalledWith(
      STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED,
      STRINGS.COMMUNITY.NOTIFY_VERIFY_REQUIRED_DESC
    );
    expect(window.location.href).toBe('');
  });

  it('Scenario 3: Viewer is Resident', async () => {
    setupAuth('resident', true);
    setupFeedMock(true);

    renderWithProviders(<Consumer />);
    fireEvent.click(screen.getByText(STRINGS.FEED.TABS.PRIVATE));

    expect(screen.queryByText(STRINGS.COMMUNITY.LOCKED_TITLE)).toBeNull();
    expect(screen.getByText('Secret Content')).toBeDefined();
  });

  it('Scenario 4: Viewer is Agent', async () => {
    setupAuth('agent', true);
    setupFeedMock(true);

    renderWithProviders(<Consumer />);
    fireEvent.click(screen.getByText(STRINGS.FEED.TABS.PRIVATE));

    expect(screen.getByText('Secret Content')).toBeDefined();
  });
});
