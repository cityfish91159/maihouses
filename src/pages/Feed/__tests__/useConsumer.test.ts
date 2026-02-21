import { renderHook, act } from '@testing-library/react';

// Mock env before imports that use it
vi.mock('../../../config/env', () => ({
  env: {
    VITE_SUPABASE_URL: 'https://mock.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'mock-key',
    VITE_API_URL: 'http://localhost:3000',
    MODE: 'development',
  },
}));

import { useConsumer } from '../useConsumer';
import { useAuth } from '../../../hooks/useAuth';
import { useFeedData, type UseFeedDataReturn } from '../../../hooks/useFeedData';
import { notify } from '../../../lib/notify';
import type { User } from '@supabase/supabase-js';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useFeedData');
vi.mock('../../../lib/notify');

// Define specific types for mocks
const mockUseAuth = vi.mocked(useAuth);
const mockUseFeedData = vi.mocked(useFeedData);
const mockNotify = vi.mocked(notify);

describe('useConsumer', () => {
  const defaultUser: User = {
    id: 'user-123',
    app_metadata: {},
    user_metadata: { name: 'Test User' },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    email: 'test@example.com',
  };

  const defaultAuth = {
    user: defaultUser,
    session: null,
    isAuthenticated: true,
    role: 'resident' as const,
    loading: false,
    error: null,
    signOut: vi.fn().mockResolvedValue(undefined),
  };

  const defaultFeedData: UseFeedDataReturn = {
    data: { posts: [], totalPosts: 0, sidebarData: { hotPosts: [], saleItems: [] } },
    useMock: false,
    setUseMock: vi.fn(),
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    toggleLike: vi.fn(),
    createPost: vi.fn(),
    addComment: vi.fn().mockResolvedValue(undefined),
    isLiked: vi.fn(),
    viewerRole: 'resident',
    isAuthenticated: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuth);
    mockUseFeedData.mockReturnValue(defaultFeedData);
  });

  it('should return default values', () => {
    const { result } = renderHook(() => useConsumer());

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userProfile?.name).toBe('Test User');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle simulated auth in demo mode', () => {
    mockUseAuth.mockReturnValue({
      ...defaultAuth,
      isAuthenticated: false,
      user: null,
    });

    // Simulate demo mode
    const { result } = renderHook(() => useConsumer(undefined, 'demo'));

    expect(result.current.isAuthenticated).toBe(true); // Should be true due to demo mode
    expect(result.current.userProfile?.id).toBe('demo-user');
  });

  it('should require login for createPost if not authenticated', async () => {
    mockUseAuth.mockReturnValue({ ...defaultAuth, isAuthenticated: false });

    const { result } = renderHook(() => useConsumer());

    await act(async () => {
      await result.current.handleCreatePost('New Post');
    });

    expect(mockNotify.error).toHaveBeenCalledWith(expect.any(String), expect.any(String));
    expect(defaultFeedData.createPost).not.toHaveBeenCalled();
  });

  it('should call createPost when authenticated', async () => {
    const { result } = renderHook(() => useConsumer());

    await act(async () => {
      await result.current.handleCreatePost('New Post');
    });

    expect(defaultFeedData.createPost).toHaveBeenCalledWith('New Post', expect.any(String), undefined);
  });

  it('should handle reply as no-op (P6 Phase 1: UI handles toggle)', () => {
    const { result } = renderHook(() => useConsumer());

    act(() => {
      result.current.handleReply('1');
    });
    // P6 Phase 1: handleReply is now a no-op, UI handles comment toggle
    expect(mockNotify.info).not.toHaveBeenCalled();
  });

  it('should notify WIP for share', () => {
    const { result } = renderHook(() => useConsumer());

    act(() => {
      result.current.handleShare('1');
    });
    expect(mockNotify.info).toHaveBeenCalledTimes(1);
  });
});
