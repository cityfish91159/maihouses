/**
 * useAgentFeed
 *
 * Agent 專用 Feed Hook
 * P6-REFACTOR: Mock 資料已抽離至 mockData/posts/agent.ts
 */

import { useCallback, useMemo, useEffect } from 'react';
import { useFeedData } from '../../hooks/useFeedData';
import { notify } from '../../lib/notify';
import { STRINGS } from '../../constants/strings';
import {
  getAgentFeedData,
  getAgentUagSummary,
  getAgentPerformanceStats,
  getAgentTodoList,
} from './mockData';

const S = STRINGS.FEED;

export function useAgentFeed(userId?: string, forceMock?: boolean) {
  // P6-REFACTOR: Use Agent-specific mock data with deep copy
  const agentMockData = useMemo(() => getAgentFeedData(), []);

  const feed = useFeedData({
    persistMockState: true,
    initialMockData: agentMockData,
  });

  // P6-REFACTOR: UAG Data from external mockData (deep copy)
  const uagSummary = useMemo(() => getAgentUagSummary(), []);

  // P6-REFACTOR: Performance Stats from external mockData (deep copy)
  const performanceStats = useMemo(() => getAgentPerformanceStats(), []);

  // P6-REFACTOR: Todo List from external mockData (deep copy)
  const todoList = useMemo(() => getAgentTodoList(), []);

  const { createPost, toggleLike, isLiked, addComment, useMock, setUseMock, isAuthenticated } =
    feed;

  useEffect(() => {
    if (forceMock !== undefined) {
      setUseMock(forceMock);
    }
  }, [forceMock, setUseMock]);

  const handleComment = useCallback(
    async (postId: string | number, content: string) => {
      try {
        if (typeof addComment === 'function') {
          await addComment(postId, content);
        }
        notify.success('留言成功', '您的留言已發佈');
      } catch {
        notify.error('留言失敗', '請稍後再試');
      }
    },
    [addComment]
  );

  // Bug 2 修正：新增 handleReply 和 handleShare
  const handleReply = useCallback((_postId: string | number) => {
    // Agent 版 reply 只是 toggle 留言區，邏輯在 FeedPostCard 內
  }, []);

  const handleShare = useCallback(async (postId: string | number) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?post=${postId}`;
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        notify.success('連結已複製', '您可以將連結分享給朋友');
      } catch {
        notify.error('複製失敗', '請手動複製網址');
      }
    } else {
      notify.info('分享功能暫未支援', '請在瀏覽器中操作');
    }
  }, []);

  return {
    ...feed,
    uagSummary,
    performanceStats,
    todoList,
    handleComment,
    handleReply,
    handleShare,
  };
}
