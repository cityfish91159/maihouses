/**
 * PostsSection Component
 *
 * 社區貼文區塊（公開牆/私密牆）
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useState, useCallback, useId, useMemo, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import type { Role, Post, WallTab } from '../types';
import { getPermissions } from '../types';
import { canPerformAction, getPermissionDeniedMessage } from '../lib';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
import { useThrottle } from '../../../hooks/useThrottle';
import { useComments } from '../../../hooks/useComments';
import { useModeAwareAction } from '../../../hooks/useModeAwareAction';
import type { PageMode } from '../../../hooks/usePageMode';
import { LockedOverlay } from './LockedOverlay';
import { ComposerModal } from '../../../components/Composer/ComposerModal';
import { CommentList } from '../../../components/Feed/CommentList';
import { CommentInput } from '../../../components/Feed/CommentInput';
import { formatRelativeTimeLabel } from '../../../lib/time';
import { notify } from '../../../lib/notify';
import { STRINGS } from '../../../constants/strings';
import { logger } from '../../../lib/logger';
import type { FeedComment } from '../../../types/comment';

// 解構 COMMUNITY 命名空間以簡化引用
const { COMMUNITY: S } = STRINGS;
const DEMO_COMMENT_AUTHOR_ID = 'demo-comment-user';
const DEMO_COMMENT_AUTHOR_NAME = '示範住戶';
const VISITOR_COMMENT_PROXY_ID = 'visitor-comment-proxy';

type RegisterGuideHandler = (title: string, description: string) => void;

// P2-UI-4: 封裝 Badge 邏輯
function PostBadge({ post }: { post: Post }) {
  const isAgent = post.type === 'agent';
  const isOfficial = post.type === 'official';

  if (isAgent) {
    return (
      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">
        {S.AGENT_BADGE}
      </span>
    );
  }
  if (isOfficial) {
    return (
      <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-bold text-brand">
        {S.OFFICIAL_BADGE}
      </span>
    );
  }
  if (post.floor) {
    return (
      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand">
        {post.floor}
        {S.RESIDENT_BADGE_SUFFIX}
      </span>
    );
  }
  return null;
}

interface PostCardProps {
  post: Post;
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
  onLike?: (postId: number | string) => Promise<void> | void;
}

function PostCard({
  post,
  communityId,
  currentUserId,
  userInitial,
  mode,
  onRegisterGuide,
  onLike,
}: PostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const isMountedRef = useRef(true);
  const isAgent = post.type === 'agent';
  const displayTime = formatRelativeTimeLabel(post.time);

  // P2-UI-2: 優化 Emoji 可訪問性
  const stats =
    post.likes !== undefined ? (
      <span className="flex items-center gap-1">
        <span role="img" aria-label="愛心">
          ❤️
        </span>{' '}
        {post.likes}
      </span>
    ) : post.views !== undefined ? (
      <span className="flex items-center gap-1">
        <span role="img" aria-label="觀看數">
          👁️
        </span>{' '}
        {post.views}
      </span>
    ) : null;
  const commentsStat =
    post.comments !== undefined ? (
      <span className="flex items-center gap-1">
        <span role="img" aria-label="留言數">
          💬
        </span>{' '}
        {post.comments}
      </span>
    ) : null;

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // P2-UI-3: 使用標準 Throttle Hook（leading+trailing，避免吞按）
  const handleLike = useThrottle(
    async () => {
      if (!onLike || isLiking) return;

      setIsLiking(true);
      try {
        await onLike(post.id);
      } catch (error) {
        logger.error('[PostsSection] Failed to toggle like', { error });
        notify.error('按讚失敗', '請稍後重試');
      } finally {
        if (isMountedRef.current) {
          setIsLiking(false);
        }
      }
    },
    1000,
    { trailing: true }
  );

  return (
    <article className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 transition-all hover:border-brand-600 hover:shadow-brand-sm">
      <div
        className={`from-brand-100/50 flex size-10 shrink-0 items-center justify-center rounded-full border-2 bg-gradient-to-br to-white text-base font-extrabold ${isAgent ? 'border-brand-light text-brand-600' : 'border-brand text-brand'}`}
        aria-hidden="true"
      >
        {post.author.charAt(0)}
      </div>
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-bold text-ink-900">{post.author}</span>
          <PostBadge post={post} />
          <span className="text-[11px] text-ink-600">{displayTime}</span>
        </div>
        <div className="text-[13px] leading-relaxed text-ink-900">
          <b>{post.title}</b>
          <br />
          {post.content}
        </div>
        <div className="flex gap-3 text-[11px] text-ink-600">
          {stats}
          {commentsStat}
          {post.private && (
            <span className="flex items-center gap-1">
              <span role="img" aria-label="鎖頭">
                🔒
              </span>{' '}
              {S.PRIVATE_POST_LABEL}
            </span>
          )}
        </div>
        <div className="mt-1 flex gap-2">
          {isAgent ? (
            <button
              className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all"
              aria-label={S.BTN_MSG_AGENT}
            >
              <span role="img" aria-label="信封">
                📩
              </span>{' '}
              {S.BTN_MSG_AGENT}
            </button>
          ) : (
            <>
              <button
                className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleLike}
                aria-label="按讚這則貼文"
                aria-busy={isLiking}
                disabled={isLiking}
              >
                {isLiking ? (
                  <>
                    <span role="img" aria-label="沙漏">
                      ⏳
                    </span>{' '}
                    {S.BTN_LIKING}
                  </>
                ) : (
                  <>
                    <span role="img" aria-label="愛心">
                      ❤️
                    </span>{' '}
                    {S.BTN_LIKE}
                  </>
                )}
              </button>
              <button
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
                  isCommentsOpen
                    ? 'bg-brand/12 border-brand text-brand'
                    : 'bg-brand/6 hover:bg-brand/12 border-brand/10 text-brand'
                }`}
                aria-label={S.BTN_REPLY_ARIA}
                aria-expanded={isCommentsOpen}
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              >
                <span role="img" aria-label="對話框">
                  💬
                </span>{' '}
                {S.BTN_REPLY}
              </button>
            </>
          )}
        </div>

        {/* 留言區塊 */}
        {isCommentsOpen && (
          <PostCommentSection
            postId={String(post.id)}
            communityId={communityId}
            currentUserId={currentUserId}
            userInitial={userInitial}
            mode={mode}
            {...(onRegisterGuide ? { onRegisterGuide } : {})}
          />
        )}
      </div>
    </article>
  );
}

// 留言區塊子組件（使用 useComments hook）
interface PostCommentSectionProps {
  postId: string;
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
}

function PostCommentSection({
  postId,
  communityId,
  currentUserId,
  userInitial,
  mode,
  onRegisterGuide,
}: PostCommentSectionProps) {
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

  // Bug 4 修正：只在首次載入時 refresh，避免重複載入
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
  const interactiveUserId =
    mode === 'visitor'
      ? VISITOR_COMMENT_PROXY_ID
      : currentUserId ?? (mode === 'demo' ? DEMO_COMMENT_AUTHOR_ID : undefined);

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

  type AddCommentPayload = { content: string; parentId?: string };

  const dispatchAddComment = useModeAwareAction<AddCommentPayload>({
    visitor: () => {
      showDiscussionRegisterGuide();
    },
    demo: ({ content, parentId }) => {
      addDemoComment(content, parentId);
    },
    live: ({ content, parentId }) => addLiveComment(content, parentId),
  });

  const dispatchToggleLike = useModeAwareAction<string>({
    visitor: () => {
      showDiscussionRegisterGuide();
    },
    demo: (commentId) => {
      toggleDemoCommentLike(commentId);
    },
    live: (commentId) => toggleLiveCommentLike(commentId),
  });

  const dispatchDeleteComment = useModeAwareAction<string>({
    visitor: () => {
      showDiscussionRegisterGuide();
    },
    demo: (commentId) => {
      deleteDemoComment(commentId);
    },
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
        logger.error('[PostsSection] Failed to add comment', { postId, error: result.error });
        throw new Error(result.error);
      }
    },
    [dispatchAddComment, postId]
  );

  const toggleLike = useCallback(
    async (commentId: string) => {
      const result = await dispatchToggleLike(commentId);
      if (!result.ok) {
        logger.error('[PostsSection] Failed to toggle comment like', {
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
        logger.error('[PostsSection] Failed to delete comment', {
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
        logger.error('[PostsSection] Failed to load replies', {
          postId,
          commentId,
          error: result.error,
        });
      }
    },
    [dispatchLoadReplies, postId]
  );

  if (isLoading && comments.length === 0) {
    return (
      <div className="mt-3 border-t border-border-light pt-3">
        <div className="flex items-center justify-center py-4 text-xs text-ink-600">
          <span className="animate-pulse">載入留言中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-border-light pt-3">
      <CommentList
        comments={comments}
        currentUserId={interactiveUserId}
        onAddComment={addComment}
        onToggleLike={toggleLike}
        onDeleteComment={deleteComment}
        onLoadReplies={loadReplies}
      />
      {/* Bug 1 & 3 修正：傳遞 userInitial 與登入提示文案 */}
      <CommentInput
        onSubmit={(content) => addComment(content)}
        userInitial={userInitial}
        placeholder={mode === 'visitor' ? '註冊後即可參與討論' : '寫下您的留言...'}
      />
    </div>
  );
}

interface PostsSectionProps {
  viewerRole: Role;
  currentTab: WallTab;
  onTabChange: (tab: WallTab) => void;
  publicPosts: Post[];
  privatePosts: Post[];
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
  onLike?: (postId: number | string) => Promise<void> | void;
  onCreatePost?: (content: string, visibility: 'public' | 'private') => void;
  onUnlock?: () => void;
}

export function PostsSection({
  viewerRole,
  currentTab,
  onTabChange,
  publicPosts,
  privatePosts,
  communityId,
  currentUserId,
  userInitial,
  mode,
  onRegisterGuide,
  onLike,
  onCreatePost,
  onUnlock,
}: PostsSectionProps) {
  const perm = getPermissions(viewerRole);
  // 角色已由父層統一計算，直接使用 perm 判斷訪客狀態
  const isGuest = perm.isGuest;
  const tabListId = useId();
  const publicTabId = `${tabListId}-public`;
  const privateTabId = `${tabListId}-private`;
  const panelId = `${tabListId}-panel`;
  const tabRefs = useRef<Record<WallTab, HTMLButtonElement | null>>({
    public: null,
    private: null,
  });

  // PostModal 狀態
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [postModalVisibility, setPostModalVisibility] = useState<'public' | 'private'>('public');

  const openPostComposer = useCallback(
    (visibility: 'public' | 'private') => {
      const action = visibility === 'public' ? 'post_public' : 'post_private';
      if (!canPerformAction(perm, action)) {
        const msg = getPermissionDeniedMessage(action);
        notify.error(msg.title, msg.description);
        return;
      }

      setPostModalVisibility(visibility);
      setPostModalOpen(true);
    },
    [perm]
  );

  const showCreatePostRegisterGuide = useCallback(() => {
    if (onRegisterGuide) {
      onRegisterGuide('註冊後即可發表貼文', '免費註冊即可分享社區生活與參與討論');
      return;
    }

    notify.error(S.NOTIFY_LOGIN_TITLE, S.NOTIFY_LOGIN_DESC);
  }, [onRegisterGuide]);

  const dispatchOpenPostModal = useModeAwareAction<'public' | 'private'>({
    visitor: () => {
      showCreatePostRegisterGuide();
    },
    demo: openPostComposer,
    live: openPostComposer,
  });

  // AUDIT-01 Phase 7: 使用統一權限檢查函數
  const openPostModal = useCallback(
    (visibility: 'public' | 'private') => {
      void dispatchOpenPostModal(visibility).then((result) => {
        if (!result.ok) {
          logger.error('[PostsSection] Failed to open post composer', {
            visibility,
            error: result.error,
          });
          notify.error('操作失敗', result.error);
        }
      });
    },
    [dispatchOpenPostModal]
  );

  const openPostWithPermissionCheck = (visibility: 'public' | 'private') => {
    const action = visibility === 'public' ? 'post_public' : 'post_private';
    if (!canPerformAction(perm, action)) {
      const msg = getPermissionDeniedMessage(action);
      notify.error(msg.title, msg.description);
      return;
    }
    openPostModal(visibility);
  };

  // 使用統一的 hook 處理訪客可見項目
  const {
    visible: visiblePublic,
    hiddenCount: hiddenPublicCount,
    nextHidden: nextHiddenPost,
  } = useGuestVisibleItems(publicPosts, perm.canSeeAllPosts);

  const focusTab = useCallback((tab: WallTab) => {
    tabRefs.current[tab]?.focus();
  }, []);

  const activeTabs = useMemo<WallTab[]>(() => {
    return canPerformAction(perm, 'view_private') ? ['public', 'private'] : ['public'];
  }, [perm]);

  const handlePrivateClick = () => {
    if (!canPerformAction(perm, 'view_private')) {
      notify.error(
        perm.isGuest ? S.NOTIFY_PRIVATE_ACCESS_DENIED : S.NOTIFY_VERIFY_REQUIRED,
        perm.isGuest
          ? `🔐 ${S.NOTIFY_PRIVATE_ACCESS_DENIED_DESC}`
          : `🏠 ${S.NOTIFY_VERIFY_REQUIRED_DESC}`
      );
      return;
    }
    onTabChange('private');
  };

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, current: WallTab) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }
      event.preventDefault();

      const lastAvailableTab = activeTabs.at(-1);

      if (event.key === 'Home') {
        focusTab('public');
        if (currentTab !== 'public') {
          onTabChange('public');
        }
        return;
      }

      if (event.key === 'End') {
        // 無論權限如何，跳到最後一個可用 Tab
        if (lastAvailableTab && lastAvailableTab !== currentTab) {
          focusTab(lastAvailableTab);
          onTabChange(lastAvailableTab);
        } else if (lastAvailableTab) {
          focusTab(lastAvailableTab);
        }
        return;
      }

      const currentIndex = activeTabs.indexOf(current);
      if (currentIndex === -1) return;

      const delta = event.key === 'ArrowLeft' ? -1 : 1;
      const nextIndex = (currentIndex + delta + activeTabs.length) % activeTabs.length;
      const nextTab = activeTabs[nextIndex];
      if (!nextTab) {
        return;
      }

      if (nextTab === 'private' && !canPerformAction(perm, 'view_private')) {
        focusTab('public');
        onTabChange('public');
        return;
      }

      focusTab(nextTab);
      onTabChange(nextTab);
    },
    [activeTabs, currentTab, focusTab, onTabChange, perm]
  );

  return (
    <section
      id="public-wall"
      className="bg-white/98 scroll-mt-20 overflow-hidden rounded-[18px] border border-border-light shadow-[0_2px_12px_rgba(0,51,102,0.04)]"
      aria-labelledby="posts-heading"
    >
      <div className="from-brand/3 to-brand-600/1 border-brand/5 flex items-center justify-between border-b bg-gradient-to-br px-4 py-3.5">
        <h2
          id="posts-heading"
          className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700"
        >
          <span role="img" aria-label="火焰">
            🔥
          </span>{' '}
          {S.SECTION_TITLE}
        </h2>
      </div>

      {/* Tabs */}
      <div
        className="flex flex-wrap gap-1.5 px-3.5 pb-3.5 pt-2"
        role="tablist"
        aria-label="社區牆分類"
      >
        <button
          role="tab"
          id={publicTabId}
          ref={(node) => {
            tabRefs.current.public = node;
          }}
          aria-selected={currentTab === 'public'}
          aria-controls={panelId}
          onClick={() => onTabChange('public')}
          onKeyDown={(event) => handleTabKeyDown(event, 'public')}
          tabIndex={currentTab === 'public' ? 0 : -1}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'public' ? 'bg-brand/10 border-brand-600 font-bold text-brand' : 'hover:bg-brand/8 bg-brand-100/80 border-transparent text-ink-600 hover:text-brand'}`}
        >
          {S.TAB_PUBLIC}
        </button>
        <button
          role="tab"
          id={privateTabId}
          ref={(node) => {
            tabRefs.current.private = node;
          }}
          aria-selected={currentTab === 'private'}
          aria-controls={panelId}
          aria-disabled={!canPerformAction(perm, 'view_private')}
          onClick={handlePrivateClick}
          onKeyDown={(event) => handleTabKeyDown(event, 'private')}
          tabIndex={
            canPerformAction(perm, 'view_private') ? (currentTab === 'private' ? 0 : -1) : -1
          }
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${currentTab === 'private' ? 'bg-brand/10 border-brand-600 font-bold text-brand' : 'hover:bg-brand/8 bg-brand-100/80 border-transparent text-ink-600 hover:text-brand'} ${!canPerformAction(perm, 'view_private') ? 'opacity-60' : ''}`}
        >
          {S.TAB_PRIVATE}{' '}
          {!canPerformAction(perm, 'view_private') && (
            <span role="img" aria-label="鎖頭">
              🔒
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div
        id={panelId}
        role="tabpanel"
        aria-labelledby={currentTab === 'public' ? publicTabId : privateTabId}
        tabIndex={0}
        className="flex flex-col gap-2.5 px-3.5 pb-3.5"
      >
        {currentTab === 'public' ? (
          <>
            {visiblePublic.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communityId={communityId}
                currentUserId={currentUserId}
                userInitial={userInitial}
                mode={mode}
                {...(onRegisterGuide ? { onRegisterGuide } : {})}
                {...(onLike ? { onLike } : {})}
              />
            ))}

            {/* 使用 LockedOverlay 組件 */}
            <LockedOverlay
              visible={hiddenPublicCount > 0 && !!nextHiddenPost}
              hiddenCount={hiddenPublicCount}
              countLabel={S.LOCKED_OVERLAY_COUNT_LABEL}
              benefits={[S.LOCKED_OVERLAY_BENEFIT_1, S.LOCKED_OVERLAY_BENEFIT_2]}
              showCta
              {...(onUnlock ? { onCtaClick: onUnlock } : {})}
            >
              {nextHiddenPost && (
                <PostCard
                  post={nextHiddenPost}
                  communityId={communityId}
                  currentUserId={currentUserId}
                  userInitial={userInitial}
                  mode={mode}
                  {...(onRegisterGuide ? { onRegisterGuide } : {})}
                />
              )}
            </LockedOverlay>

            {(canPerformAction(perm, 'post_public') || isGuest) && (
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button
                  onClick={() => openPostWithPermissionCheck('public')}
                  className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <span role="img" aria-label="鉛筆">
                    ✏️
                  </span>{' '}
                  {S.BTN_POST_PUBLIC}
                </button>
              </div>
            )}
          </>
        ) : canPerformAction(perm, 'view_private') ? (
          <>
            {privatePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                communityId={communityId}
                currentUserId={currentUserId}
                userInitial={userInitial}
                mode={mode}
                {...(onRegisterGuide ? { onRegisterGuide } : {})}
                {...(onLike ? { onLike } : {})}
              />
            ))}
            {canPerformAction(perm, 'post_private') ? (
              <div className="bg-brand/3 flex justify-center rounded-[14px] border border-dashed border-border-light p-5">
                <button
                  onClick={() => openPostWithPermissionCheck('private')}
                  className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex w-full items-center justify-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand"
                >
                  <span role="img" aria-label="鉛筆">
                    ✏️
                  </span>{' '}
                  {S.BTN_POST_PRIVATE}
                </button>
              </div>
            ) : (
              <p className="py-3 text-center text-[11px] text-ink-600">
                💡 {S.MSG_AGENT_VIEW_ONLY}
              </p>
            )}
          </>
        ) : (
          <div className="bg-brand/3 flex flex-col items-center justify-center rounded-[14px] px-5 py-10 text-center">
            <div className="mb-3 text-5xl opacity-50" aria-hidden="true">
              🔐
            </div>
            <h4 className="mb-1.5 text-sm font-bold text-brand-700">{S.LOCKED_TITLE}</h4>
            <p className="mb-4 text-xs text-ink-600">
              {perm.isGuest ? S.LOCKED_DESC_GUEST : S.LOCKED_DESC_USER}
            </p>
            <button
              onClick={onUnlock}
              className="rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-white"
            >
              {perm.isGuest ? S.BTN_UNLOCK_GUEST : S.BTN_UNLOCK_USER}
            </button>
          </div>
        )}
      </div>

      {/* 發文 Modal - B3: guest 時 openPostModal 已阻擋，此處傳 role 作為最後防線 */}
      <ComposerModal
        isOpen={postModalOpen}
        onClose={() => setPostModalOpen(false)}
        onSubmit={async (data) => {
          if (isGuest) {
            showCreatePostRegisterGuide();
            return;
          }
          if (onCreatePost) {
            await onCreatePost(data.content, data.visibility);
          }
        }}
        mode="community"
        initialVisibility={postModalVisibility}
      />
    </section>
  );
}
