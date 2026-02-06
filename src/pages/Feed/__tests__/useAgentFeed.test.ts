import { renderHook, act } from '@testing-library/react';
import { useAgentFeed } from '../useAgentFeed';
import { notify } from '../../../lib/notify';

const mockSetUseMock = vi.fn();

// Mock useFeedData
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

// Mock notify
vi.mock('../../../lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useAgentFeed Hook', () => {
  beforeEach(() => {
    mockSetUseMock.mockClear();
  });
  it('should return combined feed data and agent stats', () => {
    const { result } = renderHook(() => useAgentFeed('agent-123'));

    // Verify inherited feed data
    expect(result.current.data.posts).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.viewerRole).toBe('agent');

    // Verify Agent specific data
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

  it('should apply forceMock to feed state', () => {
    renderHook(() => useAgentFeed('agent-123', true));
    expect(mockSetUseMock).toHaveBeenCalledWith(true);
  });
});
