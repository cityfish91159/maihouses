import { renderHook, act } from '@testing-library/react';
import type { Mock } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCommunityWall, communityWallKeys } from '../useCommunityWallQuery';
import type { ReactNode } from 'react';
import type { CommunityWallData } from '../../services/communityService';
import {
  getCommunityWall,
  toggleLike as apiToggleLike,
  createPost as apiCreatePost,
  askQuestion as apiAskQuestion,
  answerQuestion as apiAnswerQuestion,
} from '../../services/communityService';

const mockUsePageMode = vi.fn();

vi.mock('../usePageMode', () => ({
  usePageMode: () => mockUsePageMode(),
}));

vi.mock('../../services/communityService', () => ({
  getCommunityWall: vi.fn(),
  toggleLike: vi.fn(),
  createPost: vi.fn(),
  askQuestion: vi.fn(),
  answerQuestion: vi.fn(),
}));

type WrapperProps = { children: ReactNode };

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const createWrapper =
  (client: QueryClient) =>
  ({ children }: WrapperProps) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

const createWallData = (): CommunityWallData => ({
  communityInfo: {
    name: 'Test',
    year: 2020,
    units: 10,
    managementFee: 100,
    builder: 'Builder',
  },
  posts: {
    public: [
      {
        id: 'post-1',
        community_id: 'community-1',
        author_id: 'author-1',
        content: 'content',
        visibility: 'public',
        likes_count: 0,
        liked_by: [],
        created_at: new Date().toISOString(),
      },
    ],
    private: [],
    publicTotal: 1,
    privateTotal: 0,
  },
  reviews: {
    items: [],
    total: 0,
  },
  questions: {
    items: [],
    total: 0,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePageMode.mockReturnValue('demo');
  (getCommunityWall as Mock).mockResolvedValue(createWallData());
  (apiToggleLike as Mock).mockResolvedValue(undefined);
  (apiCreatePost as Mock).mockResolvedValue(undefined);
  (apiAskQuestion as Mock).mockResolvedValue(undefined);
  (apiAnswerQuestion as Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('useCommunityWall - API mutations', () => {
  it('uses provided user id when toggling likes', async () => {
    const client = createQueryClient();
    const wrapper = createWrapper(client);
    const wallKey = communityWallKeys.wall('demo', 'community-1', false);
    client.setQueryData(wallKey, createWallData());

    const { result, unmount } = renderHook(
      () =>
        useCommunityWall('community-1', {
          enabled: false,
          currentUserId: 'user-123',
        }),
      { wrapper }
    );

    await act(async () => {
      await result.current.toggleLike('post-1');
    });

    expect(apiToggleLike).toHaveBeenCalled();
    const toggleMock = apiToggleLike as Mock;
    const firstCallArgs = toggleMock.mock.calls[0] ?? [];
    expect(firstCallArgs[0]).toBe('post-1');
    const updated = client.getQueryData<CommunityWallData>(wallKey);
    expect(updated?.posts.public[0]?.liked_by).toContain('user-123');
    expect(updated?.posts.public[0]?.likes_count).toBe(1);

    unmount();
    client.clear();
    client.getQueryCache().clear();
  });

  it('calls createPost API with provided arguments', async () => {
    const client = createQueryClient();
    const wrapper = createWrapper(client);
    const { result, unmount } = renderHook(
      () => useCommunityWall('community-1', { enabled: false }),
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.createPost('new post', 'private');
    });

    expect(apiCreatePost).toHaveBeenCalledWith('community-1', 'new post', 'private');
    unmount();
    client.clear();
    client.getQueryCache().clear();
  });

  it('calls askQuestion API', async () => {
    const client = createQueryClient();
    const wrapper = createWrapper(client);
    const { result, unmount } = renderHook(
      () => useCommunityWall('community-1', { enabled: false }),
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.askQuestion('Is parking easy?');
    });

    expect(apiAskQuestion).toHaveBeenCalledWith('community-1', 'Is parking easy?');
    unmount();
    client.clear();
    client.getQueryCache().clear();
  });

  it('calls answerQuestion API', async () => {
    const client = createQueryClient();
    const wrapper = createWrapper(client);
    const { result, unmount } = renderHook(
      () => useCommunityWall('community-1', { enabled: false }),
      {
        wrapper,
      }
    );

    await act(async () => {
      await result.current.answerQuestion('question-1', 'Answer');
    });

    expect(apiAnswerQuestion).toHaveBeenCalledWith('question-1', 'Answer');
    unmount();
    client.clear();
    client.getQueryCache().clear();
  });
});
