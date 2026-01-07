
import { render, screen, fireEvent } from '@testing-library/react';
import Consumer from '../Consumer';

// Mock env
vi.mock('../../../config/env', () => ({
    env: {
        VITE_SUPABASE_URL: 'https://mock.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'mock-key',
        VITE_API_URL: 'http://localhost:3000',
        MODE: 'development',
    },
}));

// Mock hooks
const { mockUseConsumer } = vi.hoisted(() => {
    return { mockUseConsumer: vi.fn() };
});

vi.mock('../useConsumer', () => ({
    useConsumer: mockUseConsumer,
}));

// Mock child components
vi.mock('../../../components/layout/GlobalHeader', () => ({
    GlobalHeader: () => <div data-testid="global-header">GlobalHeader</div>,
}));

vi.mock('../../../components/Feed', () => ({
    FeedPostCard: ({ post, onLike }: { post: { id: string; title: string }; onLike: (id: string) => void }) => (
        <div data-testid={`post-${post.id}`}>
            {post.title}
            <button onClick={() => onLike(post.id)}>Like</button>
        </div>
    ),
    ProfileCard: ({ profile }: { profile: { name: string } }) => <div>Profile: {profile.name}</div>,
    TxBanner: () => <div>TxBanner</div>,
    FeedSidebar: () => <div>FeedSidebar</div>,
    InlineComposer: ({ onSubmit }: { onSubmit: (content: string) => void }) => (
        <div>
            <input data-testid="composer-input" />
            <button onClick={() => onSubmit('New Post')}>Submit Post</button>
        </div>
    ),
}));

vi.mock('../../../components/common/MockToggle', () => ({
    MockToggle: () => <div>MockToggle</div>,
}));

describe('Consumer Page', () => {
    const defaultMockReturn = {
        authLoading: false,
        activeTransaction: { hasActive: false },
        userProfile: { name: 'Test User' },
        userInitial: 'T',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        data: {
            posts: [
                { id: '1', title: 'Post 1' },
                { id: '2', title: 'Post 2' },
            ],
            sidebarData: { hotPosts: [], saleItems: [] },
        },
        sidebarData: { hotPosts: [], saleItems: [] },
        useMock: false,
        setUseMock: vi.fn(),
        refresh: vi.fn(),
        isLiked: vi.fn(),
        handleLike: vi.fn(),
        handleCreatePost: vi.fn(),
        handleReply: vi.fn(),
        handleComment: vi.fn(),
        handleShare: vi.fn(),
        latestNotification: null,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseConsumer.mockReturnValue(defaultMockReturn);
    });

    it('renders loading state', () => {
        mockUseConsumer.mockReturnValue({
            ...defaultMockReturn,
            isLoading: true,
            data: { posts: [], sidebarData: { hotPosts: [], saleItems: [] } },
        });
        render(<Consumer />);
        // Initial fetch loading skeleton check could be more specific if skeleton has testid
        // But here we just assume skeleton renders some distinct elements or we check absence of empty state
    });

    it('renders empty state', () => {
        mockUseConsumer.mockReturnValue({
            ...defaultMockReturn,
            data: { posts: [], sidebarData: { hotPosts: [], saleItems: [] } },
        });
        render(<Consumer />);
        expect(screen.getByText('還沒有貼文')).toBeDefined();
    });

    it('renders error state', () => {
        mockUseConsumer.mockReturnValue({
            ...defaultMockReturn,
            data: { posts: [], sidebarData: { hotPosts: [], saleItems: [] } },
            error: { message: 'Failed to load' },
        });
        render(<Consumer />);
        expect(screen.getByText('Failed to load')).toBeDefined();
    });

    it('renders posts and interactions', async () => {
        render(<Consumer />);

        expect(screen.getByText('Post 1')).toBeDefined();
        expect(screen.getByText('Post 2')).toBeDefined();

        // Test Like Interaction
        const likeBtn = screen.getByTestId('post-1').querySelector('button');
        fireEvent.click(likeBtn!);
        expect(defaultMockReturn.handleLike).toHaveBeenCalledWith('1');

        // Test Create Post Interaction
        const submitBtn = screen.getByText('Submit Post');
        fireEvent.click(submitBtn);
        expect(defaultMockReturn.handleCreatePost).toHaveBeenCalledWith('New Post');
    });

    it('handles auth loading', () => {
        mockUseConsumer.mockReturnValue({
            ...defaultMockReturn,
            authLoading: true,
        });
        render(<Consumer />);
        expect(screen.getByTestId('global-header')).toBeDefined();
    });
});
