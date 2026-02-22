import { useState, useCallback, useRef, useEffect } from 'react';
import type { FeedComment } from '../../../types/comment';
import { useComments } from '../../../hooks/useComments';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import type { PageMode } from '../../../hooks/usePageMode';
import { notify } from '../../../lib/notify';
import { logger } from '../../../lib/logger';

const DEMO_COMMENT_AUTHOR_ID = 'demo-comment-user';
const DEMO_COMMENT_AUTHOR_NAME = '示範住戶';
const VISITOR_COMMENT_PROXY_ID = 'visitor-comment-proxy';

type RegisterGuideHandler = (title: string, description: string) => void;
type AddCommentPayload = { content: string; parentId?: string };

interface UsePostCommentModeStateOptions {
  postId: string;
  communityId: string;
  currentUserId: string | undefined;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler | undefined;
}

interface UsePostCommentModeStateReturn {
  comments: FeedComment[];
  isLoading: boolean;
  interactiveUserId: string | undefined;
  placeholder: string;
  addComment: (content: string, parentId?: string) => Promise<void>;
  toggleLike: (commentId: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  loadReplies: (commentId: string) => Promise<void>;
}

export function usePostCommentModeState({
  postId,
  communityId,
  currentUserId,
  mode,
  onRegisterGuide,
}: UsePostCommentModeStateOptions): UsePostCommentModeStateReturn {
  const {
    comments: liveComments,
    isLoading: liveIsLoading,
    addComment: addLiveComment,
    toggleLike: toggleLiveCommentLike,
    deleteComment: deleteLiveComment,
    loadReplies: loadLiveReplies,
    refresh: refreshLiveComments,
  } = useComments({ postId, communityId });
  const [demoComments, setDemoComments] = useState<FeedComment[]>([]);
  const demoCommentSequenceRef = useRef(0);

  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      if (mode === 'live') {
        void refreshLiveComments();
      }
    }
  }, [mode, refreshLiveComments]);

  const comments = mode === 'demo' ? demoComments : liveComments;
  const isLoading = mode === 'live' ? liveIsLoading : false;
  const placeholder = mode === 'visitor' ? '註冊後即可參與討論' : '寫下您的留言...';
  const interactiveUserId =
    mode === 'visitor'
      ? VISITOR_COMMENT_PROXY_ID
      : (currentUserId ?? (mode === 'demo' ? DEMO_COMMENT_AUTHOR_ID : undefined));

  const showDiscussionRegisterGuide = useCallback(() => {
    if (onRegisterGuide) {
      onRegisterGuide('註冊後即可參與討論', '免費註冊即可留言並參與社區討論');
      return;
    }
    notify.error('註冊後即可參與討論', '免費註冊即可留言並參與社區討論');
  }, [onRegisterGuide]);

  const createDemoComment = useCallback(
    (content: string, parentId?: string): FeedComment => {
      demoCommentSequenceRef.current += 1;
      const now = new Date().toISOString();
      return {
        id: `demo-comment-${postId}-${Date.now()}-${demoCommentSequenceRef.current}`,
        postId,
        ...(parentId !== undefined ? { parentId } : {}),
        author: {
          id: DEMO_COMMENT_AUTHOR_ID,
          name: DEMO_COMMENT_AUTHOR_NAME,
          role: 'member',
        },
        content,
        createdAt: now,
        likesCount: 0,
        isLiked: false,
        repliesCount: 0,
        replies: [],
      };
    },
    [postId]
  );

  const addDemoComment = useCallback(
    (content: string, parentId?: string) => {
      const newComment = createDemoComment(content, parentId);

      setDemoComments((prev) => {
        if (!parentId) {
          return [...prev, newComment];
        }

        let parentFound = false;
        const next = prev.map((comment) => {
          if (comment.id !== parentId) {
            return comment;
          }

          parentFound = true;
          const currentReplies = comment.replies ?? [];
          return {
            ...comment,
            replies: [...currentReplies, newComment],
            repliesCount: comment.repliesCount + 1,
          };
        });

        return parentFound ? next : [...prev, newComment];
      });

      notify.success('留言成功');
    },
    [createDemoComment]
  );

  const toggleDemoCommentLike = useCallback((commentId: string) => {
    const applyLikeToggle = (list: FeedComment[]): FeedComment[] => {
      return list.map((comment) => {
        if (comment.id === commentId) {
          const nextLiked = !comment.isLiked;
          return {
            ...comment,
            isLiked: nextLiked,
            likesCount: nextLiked ? comment.likesCount + 1 : Math.max(0, comment.likesCount - 1),
          };
        }

        if (!comment.replies?.length) {
          return comment;
        }

        return {
          ...comment,
          replies: applyLikeToggle(comment.replies),
        };
      });
    };

    setDemoComments((prev) => applyLikeToggle(prev));
  }, []);

  const deleteDemoComment = useCallback((commentId: string) => {
    let deleted = false;

    setDemoComments((prev) => {
      const topLevel = prev.filter((comment) => comment.id !== commentId);
      if (topLevel.length !== prev.length) {
        deleted = true;
        return topLevel;
      }

      return prev.map((comment) => {
        if (!comment.replies?.length) {
          return comment;
        }

        const filteredReplies = comment.replies.filter((reply) => reply.id !== commentId);
        if (filteredReplies.length !== comment.replies.length) {
          deleted = true;
          return {
            ...comment,
            replies: filteredReplies,
            repliesCount: Math.max(0, comment.repliesCount - 1),
          };
        }

        return comment;
      });
    });

    if (deleted) {
      notify.success('留言已刪除');
    }
  }, []);

  const dispatchAddComment = useModeAwareAction<AddCommentPayload>({
    visitor: () => showDiscussionRegisterGuide(),
    demo: ({ content, parentId }) => addDemoComment(content, parentId),
    live: ({ content, parentId }) => addLiveComment(content, parentId),
  });

  const dispatchToggleLike = useModeAwareAction<string>({
    visitor: () => showDiscussionRegisterGuide(),
    demo: (commentId) => toggleDemoCommentLike(commentId),
    live: (commentId) => toggleLiveCommentLike(commentId),
  });

  const dispatchDeleteComment = useModeAwareAction<string>({
    visitor: () => showDiscussionRegisterGuide(),
    demo: (commentId) => deleteDemoComment(commentId),
    live: (commentId) => deleteLiveComment(commentId),
  });

  const dispatchLoadReplies = useModeAwareAction<string>({
    visitor: () => {},
    demo: () => {},
    live: (commentId) => loadLiveReplies(commentId),
  });

  const addComment = useCallback(
    async (content: string, parentId?: string) => {
      const result = await dispatchAddComment({ content, ...(parentId ? { parentId } : {}) });
      if (!result.ok) {
        logger.error('[PostCommentSection] Failed to add comment', { postId, error: result.error });
        throw new Error(result.error);
      }
    },
    [dispatchAddComment, postId]
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
      const result = await dispatchToggleLike(commentId);
      if (!result.ok) {
        logger.error('[PostCommentSection] Failed to toggle comment like', {
          postId,
          commentId,
          error: result.error,
        });
        throw new Error(result.error);
      }
    },
    [dispatchToggleLike, postId]
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const result = await dispatchDeleteComment(commentId);
      if (!result.ok) {
        logger.error('[PostCommentSection] Failed to delete comment', {
          postId,
          commentId,
          error: result.error,
        });
        throw new Error(result.error);
      }
    },
    [dispatchDeleteComment, postId]
  );

  const loadReplies = useCallback(
    async (commentId: string) => {
      const result = await dispatchLoadReplies(commentId);
      if (!result.ok) {
        logger.error('[PostCommentSection] Failed to load replies', {
          postId,
          commentId,
          error: result.error,
        });
      }
    },
    [dispatchLoadReplies, postId]
  );

  return {
    comments,
    isLoading,
    interactiveUserId,
    placeholder,
    addComment,
    toggleLike,
    deleteComment,
    loadReplies,
  };
}
