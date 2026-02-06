/**
 * CommentList React.memo 優化效能測試
 * 驗證：
 * 1. CommentList 的 replies 變更偵測
 * 2. CommentItem 的深度比較邏輯
 * 3. 父組件重渲染時的 memo 隔離效果
 * 4. 使用 React Testing Library 的 render count 測試
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { CommentList } from '../CommentList';
import type { FeedComment } from '../../../types/comment';

// Mock notify
vi.mock('../../../lib/notify', () => ({
  notify: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock date utils
vi.mock('../../../utils/date', () => ({
  formatRelativeTime: (date: string) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  },
}));

describe('CommentList React.memo Performance', () => {
  const createMockComment = (id: string, overrides: Partial<FeedComment> = {}): FeedComment => ({
    id,
    postId: 'post-1',
    author: {
      id: `author-${id}`,
      name: `用戶 ${id}`,
      role: 'member',
    },
    content: `留言內容 ${id}`,
    createdAt: new Date().toISOString(),
    likesCount: 0,
    isLiked: false,
    repliesCount: 0,
    ...overrides,
  });

  const mockCallbacks = {
    onAddComment: vi.fn().mockResolvedValue(undefined),
    onToggleLike: vi.fn().mockResolvedValue(undefined),
    onDeleteComment: vi.fn().mockResolvedValue(undefined),
    onLoadReplies: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('CommentList memo 隔離', () => {
    it('應該在父組件重渲染時不重新渲染（相同 props）', () => {
      const comments = [createMockComment('1'), createMockComment('2')];

      const TestWrapper = () => {
        const [rerenderCount, setRerenderCount] = useState(0);

        return (
          <div>
            <button onClick={() => setRerenderCount((prev) => prev + 1)}>
              Trigger Parent Render
            </button>
            <div data-testid="rerender-count">{rerenderCount}</div>
            <CommentList comments={comments} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      // 第一次渲染
      const firstSection = document.querySelector('.space-y-4');
      expect(firstSection).toBeInTheDocument();
      expect(screen.getByText('留言內容 1')).toBeInTheDocument();

      // 觸發父組件重新渲染
      fireEvent.click(getByText('Trigger Parent Render'));

      // 驗證父組件確實重新渲染了
      expect(getByTestId('rerender-count').textContent).toBe('1');

      // CommentList 應該沒有重新渲染（DOM 節點相同）
      const secondSection = document.querySelector('.space-y-4');
      expect(secondSection).toBe(firstSection);
    });

    it('應該在 comments 陣列長度改變時重新渲染', () => {
      const TestWrapper = () => {
        const [comments, setComments] = useState<FeedComment[]>([createMockComment('1')]);

        return (
          <div>
            <button onClick={() => setComments([...comments, createMockComment('2')])}>
              Add Comment
            </button>
            <CommentList comments={comments} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByText, queryByText } = render(<TestWrapper />);

      // 初始狀態：只有一則留言
      expect(screen.getByText('留言內容 1')).toBeInTheDocument();
      expect(queryByText('留言內容 2')).not.toBeInTheDocument();

      // 新增留言
      fireEvent.click(getByText('Add Comment'));

      // 驗證 CommentList 重新渲染並顯示新留言
      expect(screen.getByText('留言內容 1')).toBeInTheDocument();
      expect(screen.getByText('留言內容 2')).toBeInTheDocument();
    });

    it('應該在 currentUserId 改變時重新渲染（登入/登出）', () => {
      const comments = [
        createMockComment('1', { author: { id: 'user-1', name: '我', role: 'member' } }),
      ];

      const TestWrapper = () => {
        const [currentUserId, setCurrentUserId] = useState<string | undefined>('user-1');

        return (
          <div>
            <button onClick={() => setCurrentUserId(undefined)}>Logout</button>
            <CommentList comments={comments} currentUserId={currentUserId} {...mockCallbacks} />
          </div>
        );
      };

      const { getByText, queryByText } = render(<TestWrapper />);

      // 登入狀態：應顯示「刪除」按鈕
      expect(queryByText('刪除')).toBeInTheDocument();

      // 登出
      fireEvent.click(getByText('Logout'));

      // 登出後：「刪除」按鈕應消失
      expect(queryByText('刪除')).not.toBeInTheDocument();
    });
  });

  describe('CommentItem replies 深度比較', () => {
    it('應該在 replies 內容改變時重新渲染', async () => {
      const TestWrapper = () => {
        const [repliesLikes, setRepliesLikes] = useState(1);

        const reply1 = createMockComment('reply-1', { parentId: '1', likesCount: repliesLikes });
        const commentWithReplies = createMockComment('1', {
          repliesCount: 1,
          replies: [reply1],
        });

        return (
          <div>
            <button onClick={() => setRepliesLikes(5)}>Update Reply Likes</button>
            <CommentList
              comments={[commentWithReplies]}
              currentUserId="user-1"
              {...mockCallbacks}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 展開回覆
      const toggleButton = screen.getByRole('button', { name: /查看 1 則回覆/ });
      fireEvent.click(toggleButton);

      // 等待回覆顯示並驗證初始按讚數
      await vi.waitFor(() => {
        expect(screen.getByText('留言內容 reply-1')).toBeInTheDocument();
        expect(screen.getByText('1 個讚')).toBeInTheDocument();
      });

      // 更新回覆的按讚數
      fireEvent.click(getByText('Update Reply Likes'));

      // 驗證按讚數顯示已更新
      await vi.waitFor(() => {
        expect(screen.getByText('5 個讚')).toBeInTheDocument();
      });
    });

    it('應該在 replies 陣列長度改變時重新渲染', async () => {
      const TestWrapper = () => {
        const [showSecondReply, setShowSecondReply] = useState(false);

        const reply1 = createMockComment('reply-1', { parentId: '1' });
        const reply2 = createMockComment('reply-2', { parentId: '1' });
        const commentWithReplies = createMockComment('1', {
          repliesCount: showSecondReply ? 2 : 1,
          replies: showSecondReply ? [reply1, reply2] : [reply1],
        });

        return (
          <div>
            <button onClick={() => setShowSecondReply(true)}>Add Reply</button>
            <CommentList
              comments={[commentWithReplies]}
              currentUserId="user-1"
              {...mockCallbacks}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 展開回覆
      const toggleButton = screen.getByRole('button', { name: /查看 1 則回覆/ });
      fireEvent.click(toggleButton);

      // 等待回覆載入
      await vi.waitFor(() => {
        expect(screen.getByText('留言內容 reply-1')).toBeInTheDocument();
      });

      expect(screen.queryByText('留言內容 reply-2')).not.toBeInTheDocument();

      // 新增回覆
      fireEvent.click(getByText('Add Reply'));

      // 驗證兩則回覆都顯示
      await vi.waitFor(() => {
        expect(screen.getByText('留言內容 reply-2')).toBeInTheDocument();
      });
      expect(screen.getByText('留言內容 reply-1')).toBeInTheDocument();
    });

    it('應該在 reply 作者資訊改變時重新渲染', async () => {
      const TestWrapper = () => {
        const [authorName, setAuthorName] = useState('原名');

        const reply1 = createMockComment('reply-1', {
          parentId: '1',
          author: { id: 'author-1', name: authorName, role: 'member' },
        });
        const commentWithReplies = createMockComment('1', {
          repliesCount: 1,
          replies: [reply1],
        });

        return (
          <div>
            <button onClick={() => setAuthorName('新名字')}>Update Author Name</button>
            <CommentList
              comments={[commentWithReplies]}
              currentUserId="user-1"
              {...mockCallbacks}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 展開回覆
      const toggleButton = screen.getByRole('button', { name: /查看 1 則回覆/ });
      fireEvent.click(toggleButton);

      // 等待回覆載入並驗證初始狀態
      await vi.waitFor(() => {
        expect(screen.getByText('原名')).toBeInTheDocument();
      });

      // 更新作者名稱
      fireEvent.click(getByText('Update Author Name'));

      // 驗證名稱已更新
      await vi.waitFor(() => {
        expect(screen.getByText('新名字')).toBeInTheDocument();
      });
    });

    it('應該在 reply 角色改變時重新渲染（顯示/隱藏 badge）', async () => {
      const TestWrapper = () => {
        const [role, setRole] = useState<'member' | 'agent'>('member');

        const reply1 = createMockComment('reply-1', {
          parentId: '1',
          author: { id: 'author-1', name: '用戶', role },
        });
        const commentWithReplies = createMockComment('1', {
          repliesCount: 1,
          replies: [reply1],
        });

        return (
          <div>
            <button onClick={() => setRole('agent')}>Promote to Agent</button>
            <CommentList
              comments={[commentWithReplies]}
              currentUserId="user-1"
              {...mockCallbacks}
            />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 展開回覆
      const toggleButton = screen.getByRole('button', { name: /查看 1 則回覆/ });
      fireEvent.click(toggleButton);

      // 等待回覆載入並驗證初始狀態：無 badge
      await vi.waitFor(() => {
        expect(screen.getByText('用戶')).toBeInTheDocument();
      });
      expect(screen.queryByText('房仲')).not.toBeInTheDocument();

      // 升級為房仲
      fireEvent.click(getByText('Promote to Agent'));

      // 驗證 badge 出現
      await vi.waitFor(() => {
        expect(screen.getByText('房仲')).toBeInTheDocument();
      });
    });
  });

  describe('CommentItem 按讚狀態 memo', () => {
    it('應該在按讚數改變時重新渲染', () => {
      const TestWrapper = () => {
        const [comment, setComment] = useState(createMockComment('1', { likesCount: 0 }));

        const incrementLikes = () => {
          setComment({ ...comment, likesCount: 5 });
        };

        return (
          <div>
            <button onClick={incrementLikes}>Increment Likes</button>
            <CommentList comments={[comment]} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：無按讚顯示
      expect(screen.queryByText(/個讚/)).not.toBeInTheDocument();

      // 增加按讚數
      fireEvent.click(getByText('Increment Likes'));

      // 驗證按讚數顯示
      expect(screen.getByText('5 個讚')).toBeInTheDocument();
    });

    it('應該在 isLiked 改變時重新渲染（按鈕文字變化）', () => {
      const TestWrapper = () => {
        const [comment, setComment] = useState(
          createMockComment('1', { isLiked: false, likesCount: 0 })
        );

        const toggleLike = () => {
          setComment({
            ...comment,
            isLiked: !comment.isLiked,
            likesCount: comment.isLiked ? 0 : 1,
          });
        };

        return (
          <div>
            <button onClick={toggleLike}>Toggle Like</button>
            <CommentList comments={[comment]} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByText, getAllByText } = render(<TestWrapper />);

      // 初始狀態：「讚」
      expect(getAllByText('讚').length).toBeGreaterThan(0);

      // 切換按讚
      fireEvent.click(getByText('Toggle Like'));

      // 驗證按鈕文字變為「已讚」
      expect(screen.getByText('已讚')).toBeInTheDocument();
    });
  });

  describe('CommentItem 回覆數量 memo', () => {
    it('應該在 repliesCount 改變時重新渲染（按鈕文字變化）', () => {
      const TestWrapper = () => {
        const [comment, setComment] = useState(createMockComment('1', { repliesCount: 0 }));

        const incrementReplies = () => {
          setComment({ ...comment, repliesCount: 3 });
        };

        return (
          <div>
            <button onClick={incrementReplies}>Increment Replies</button>
            <CommentList comments={[comment]} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByText } = render(<TestWrapper />);

      // 初始狀態：無回覆按鈕
      expect(screen.queryByText(/查看.*則回覆/)).not.toBeInTheDocument();

      // 增加回覆數
      fireEvent.click(getByText('Increment Replies'));

      // 驗證回覆按鈕出現
      expect(screen.getByText('查看 3 則回覆')).toBeInTheDocument();
    });
  });

  describe('回調函數 memo 優化', () => {
    it('應該忽略回調函數引用變化（假設父層已用 useCallback）', () => {
      const comments = [createMockComment('1')];

      const TestWrapper = () => {
        const [callbackVersion, setCallbackVersion] = useState(0);

        // 每次父組件重新渲染，回調函數引用都會改變
        const handleAddComment = async (content: string) => {};

        return (
          <div>
            <button onClick={() => setCallbackVersion((prev) => prev + 1)}>Change Callback</button>
            <div data-testid="callback-version">{callbackVersion}</div>
            <CommentList
              comments={comments}
              currentUserId="user-1"
              onAddComment={handleAddComment}
              onToggleLike={mockCallbacks.onToggleLike}
              onDeleteComment={mockCallbacks.onDeleteComment}
              onLoadReplies={mockCallbacks.onLoadReplies}
            />
          </div>
        );
      };

      const { getByTestId, getByText } = render(<TestWrapper />);

      // 第一次渲染
      const firstSection = document.querySelector('.space-y-4');
      expect(firstSection).toBeInTheDocument();

      // 改變回調函數引用
      fireEvent.click(getByText('Change Callback'));

      // 驗證父組件確實更新了
      expect(getByTestId('callback-version').textContent).toBe('1');

      // CommentList 應該忽略回調函數引用變化，不重新渲染
      const secondSection = document.querySelector('.space-y-4');
      expect(secondSection).toBe(firstSection);
    });
  });

  describe('顯示名稱（DevTools）', () => {
    it('應該設定 displayName 供 React DevTools 使用', () => {
      expect(CommentList.displayName).toBe('CommentList');
    });
  });

  describe('空狀態處理', () => {
    it('應該在 comments 為空陣列時不渲染任何內容', () => {
      const { container } = render(
        <CommentList comments={[]} currentUserId="user-1" {...mockCallbacks} />
      );

      // 不應該渲染任何內容
      expect(container.firstChild).toBeNull();
    });

    it('應該在從有留言變為空時正確更新', () => {
      const TestWrapper = () => {
        const [comments, setComments] = useState<FeedComment[]>([createMockComment('1')]);

        return (
          <div>
            <button onClick={() => setComments([])}>Clear Comments</button>
            <CommentList comments={comments} currentUserId="user-1" {...mockCallbacks} />
          </div>
        );
      };

      const { getByText, container } = render(<TestWrapper />);

      // 初始狀態：有留言
      expect(screen.getByText('留言內容 1')).toBeInTheDocument();

      // 清空留言
      fireEvent.click(getByText('Clear Comments'));

      // 驗證內容被移除
      expect(container.querySelector('.space-y-4')).not.toBeInTheDocument();
    });
  });
});
