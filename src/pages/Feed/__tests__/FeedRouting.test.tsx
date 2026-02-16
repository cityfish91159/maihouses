import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Consumer from '../Consumer';
import AgentPage from '../Agent';
import type { PageMode } from '../../../hooks/usePageMode';

vi.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    role: 'member',
    isAuthenticated: true,
    loading: false,
  }),
}));

vi.mock('../../../hooks/useFeedData', () => ({
  useFeedData: (options: { communityId?: string; mode?: PageMode }) => ({
    data: {
      posts: [
        {
          id: 'post-1',
          title: 'Test Post',
          content: 'Test Content',
          author: 'Test User',
          type: 'member',
          time: new Date().toISOString(),
          likes: 0,
          comments: 0,
          pinned: false,
          private: false,
        },
      ],
      totalPosts: 1,
      sidebarData: { hotPosts: [], saleItems: [] },
    },
    useMock: options?.mode === 'demo',
    setUseMock: vi.fn(),
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    toggleLike: vi.fn(),
    createPost: vi.fn(),
    addComment: vi.fn(),
    viewerRole: 'member',
    isAuthenticated: true,
    isLiked: vi.fn(() => false),
  }),
}));

vi.mock('../../../hooks/useNotifications', () => ({
  useNotifications: () => ({
    latestUnread: null,
    count: 0,
    notifications: [],
    isLoading: false,
    isStale: false,
    refresh: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useAgentConversations', () => ({
  useAgentConversations: () => ({
    conversations: [],
  }),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ data: [], error: null }),
    }),
    channel: () => ({
      on: () => ({ on: () => ({ subscribe: vi.fn() }) }),
    }),
    removeChannel: vi.fn(),
  },
}));

describe('FEED Routing Mode Verification', () => {
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
  });

  it('demo mode consumer should render mock content', () => {
    renderWithProviders(<Consumer mode="demo" />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('demo mode agent should render mock content', () => {
    renderWithProviders(<AgentPage mode="demo" />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });

  it('live mode consumer should render content without crashing', () => {
    renderWithProviders(<Consumer mode="live" />);
    expect(screen.getByText('Test Post')).toBeInTheDocument();
  });
});
