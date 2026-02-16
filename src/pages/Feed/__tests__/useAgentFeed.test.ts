import { renderHook, act } from '@testing-library/react';
import { useAgentFeed } from '../useAgentFeed';
import { notify } from '../../../lib/notify';
import { useFeedData } from '../../../hooks/useFeedData';

const mockSetUseMock = vi.fn();

vi.mock('../../../hooks/useFeedData', () => ({
  useFeedData: vi.fn(() => ({
    data: { posts: [], hasMore: false },
    isLoading: false,
    createPost: vi.fn(),
    toggleLike: vi.fn(),
    isLiked: vi.fn(() => false),
    viewerRole: 'agent',
    isAuthenticated: true,
    useMock: false,
    setUseMock: mockSetUseMock,
  })),
}));

vi.mock('../../../lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockUseFeedData = useFeedData as unknown as ReturnType<typeof vi.fn>;

describe('useAgentFeed Hook', () => {
  beforeEach(() => {
    mockSetUseMock.mockClear();
    mockUseFeedData.mockClear();
  });

  it('should return combined feed data and agent stats', () => {
    const { result } = renderHook(() => useAgentFeed('agent-123'));

    expect(result.current.data.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.viewerRole).toBe('agent');

    expect(result.current.uagSummary).toBeDefined();
    expect(result.current.uagSummary.grade).toBe('S');

    expect(result.current.performanceStats).toBeDefined();
    expect(result.current.performanceStats.score).toBe(2560);

    expect(result.current.todoList).toHaveLength(3);
  });

  it('handleComment should call notify on success', async () => {
    const { result } = renderHook(() => useAgentFeed('agent-123'));

    await act(async () => {
      await result.current.handleComment('post-1', 'Nice work!');
    });

    expect(notify.success).toHaveBeenCalledWith('留言成功', '您的留言已發佈');
  });

  it('should pass mode to useFeedData options', () => {
    renderHook(() => useAgentFeed('agent-123', 'demo'));
    expect(mockUseFeedData).toHaveBeenCalledWith(expect.objectContaining({ mode: 'demo' }));
  });
});
