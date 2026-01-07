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
import { useFeedData } from '../../../hooks/useFeedData';
import { notify } from '../../../lib/notify';

// Mock dependencies
vi.mock('../../../hooks/useAuth');
vi.mock('../../../hooks/useFeedData');
vi.mock('../../../lib/notify');

// Define specific types for mocks
type MockUseAuth = typeof useAuth;
type MockUseFeedData = typeof useFeedData;
type MockNotify = typeof notify;

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;
const mockUseFeedData = useFeedData as unknown as ReturnType<typeof vi.fn>;
const mockNotify = notify as unknown as MockNotify;

describe('useConsumer', () => {
    const defaultAuth = {
        user: { id: 'user-123', email: 'test@example.com', user_metadata: { name: 'Test User' } },
        isAuthenticated: true,
        role: 'resident',
        loading: false,
    };

    const defaultFeedData = {
        data: { posts: [], totalPosts: 0 },
        useMock: false,
        setUseMock: vi.fn(),
        isLoading: false,
        error: null,
        refresh: vi.fn(),
        toggleLike: vi.fn(),
        createPost: vi.fn(),
        isLiked: vi.fn(),
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
        mockUseAuth.mockReturnValue({ ...defaultAuth, isAuthenticated: false, user: null });

        // Simulate demo mode
        const { result } = renderHook(() => useConsumer('demo-001'));

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

        expect(defaultFeedData.createPost).toHaveBeenCalledWith('New Post', expect.any(String));
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
