/**
 * FeedPostCard Component
 *
 * 信息流貼文卡片組件
 * 支援：住戶貼文、房仲物件、管理員公告、AI 快訊
 *
 * Phase 7: 整合 useComments Hook
 */

import { useState, useCallback, useRef, useEffect, memo, useMemo } from 'react';
import { Heart, MessageCircle, Share2, Calendar, Eye } from 'lucide-react';
import type { FeedPost } from '../../hooks/useFeedData';
import { STRINGS } from '../../constants/strings';
import { formatRelativeTime } from '../../utils/date';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';
import { useComments } from '../../hooks/useComments';

const S = STRINGS.FEED.POST;

interface FeedPostCardProps {
  post: FeedPost;
  isLiked?: boolean;
  onLike?: (postId: string | number) => Promise<void>;
  onReply?: (postId: string | number) => void;
  onShare?: (postId: string | number) => void;
  onComment?: (postId: string | number, content: string) => Promise<void>;
  className?: string;
  // Phase 7: 新增留言系統必要 props
  communityId?: string | undefined;
  currentUserId?: string | undefined;
  userInitial?: string | undefined;
}

/** 根據作者類型取得 Avatar 樣式 */
function getAvatarStyle(type: FeedPost['type']): string {
  switch (type) {
    case 'agent':
      return 'bg-amber-100 text-amber-700 ring-amber-200';
    case 'official':
      return 'bg-brand-700 text-white ring-brand-300';
    default:
      return 'bg-brand-50 text-brand-700 ring-brand-100';
  }
}

function getAuthorBadge(type: FeedPost['type']): string | null {
  switch (type) {
    case 'agent':
      return S.BADGE_AGENT;
    case 'official':
      return S.BADGE_OFFICIAL;
    default:
      return null;
  }
}

/**
 * FeedPostCommentSection
 * Phase 7: 獨立留言區組件，整合 useComments Hook
 */
interface FeedPostCommentSectionProps {
  postId: string;
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
}

function FeedPostCommentSection({
  postId,
  communityId,
  currentUserId,
  userInitial,
}: FeedPostCommentSectionProps) {
  const { comments, isLoading, addComment, toggleLike, deleteComment, loadReplies, refresh } =
    useComments({ postId, communityId });

  // Phase 6 Bug 4 修正：hasLoadedRef 防止重複載入
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      refresh();
    }
  }, [refresh]);

  const isLoggedIn = useMemo(() => currentUserId !== undefined, [currentUserId]);

  if (isLoading && comments.length === 0) {
    return (
      <div className="mt-4 flex items-center justify-center py-4">
        <div className="size-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
        <span className="ml-2 text-sm text-gray-500">載入留言中...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <CommentList
        comments={comments}
        currentUserId={currentUserId}
        onAddComment={addComment}
        onToggleLike={toggleLike}
        onDeleteComment={deleteComment}
        onLoadReplies={loadReplies}
      />
      <CommentInput
        onSubmit={(content) => addComment(content)}
        disabled={!isLoggedIn}
        userInitial={userInitial}
        placeholder={isLoggedIn ? '寫下您的留言...' : '請先登入後留言'}
      />
    </div>
  );
}

export const FeedPostCard = memo(function FeedPostCard({
  post,
  isLiked = false,
  onLike,
  onReply,
  onShare,
  onComment,
  className = '',
  // Phase 7: 新增 props
  communityId,
  currentUserId,
  userInitial = 'U',
}: FeedPostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  const handleLike = useCallback(async () => {
    if (!onLike || isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
    } catch {
      // 錯誤已在 onLike 處理（Consumer/Agent hooks 有 notify）
    } finally {
      setIsLiking(false);
    }
  }, [onLike, post.id, isLiking]);

  const handleReplyClick = () => {
    setIsCommentsOpen(!isCommentsOpen);
    onReply?.(post.id);
  };

  const handleSubmitComment = async (content: string) => {
    if (onComment) {
      await onComment(post.id, content);
    }
  };

  const avatarStyle = getAvatarStyle(post.type);
  const authorBadge = getAuthorBadge(post.type);
  const avatarLetter = post.author.charAt(0).toUpperCase();

  return (
    <article
      className={`rounded-2xl border border-brand-100 bg-white p-4 shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-gray-50 pb-3">
        <div
          className={`flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-1 ${avatarStyle}`}
          aria-hidden="true"
        >
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-bold text-gray-900">{post.author}</span>
            {post.floor && <span className="text-xs text-gray-500">{post.floor}</span>}
            {authorBadge && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {authorBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {post.communityName && <span className="truncate">{post.communityName}</span>}
            <span>·</span>
            <span>{formatRelativeTime(post.time)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-3">
        {post.title && <h3 className="mb-1 text-sm font-bold text-gray-900">{post.title}</h3>}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">{post.content}</p>

        {/* Images (P6-REFACTOR) */}
        {/* Images (P6-REFACTOR) */}
        {post.images && post.images.length > 0 && (
          <div className={`mt-3 ${post.images.length === 1 ? 'block' : 'grid grid-cols-2 gap-2'}`}>
            {post.images.map((img, idx) => (
              <div
                key={`${post.id}-img-${idx}`}
                className="relative overflow-hidden rounded-lg bg-gray-100"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement?.classList.add(
                      'flex',
                      'items-center',
                      'justify-center',
                      'min-h-[200px]'
                    );
                    // Insert fallback text/icon
                    const span = document.createElement('span');
                    span.textContent = '無法載入圖片';
                    span.className = 'text-xs text-gray-400 font-medium';
                    e.currentTarget.parentElement?.appendChild(span);
                  }}
                  className={`object-cover transition-opacity duration-300 ${
                    post.images?.length === 1 ? 'max-h-80 w-full' : 'aspect-square w-full'
                  }`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-pressed={isLiked}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${
            isLiked
              ? 'border-red-200 bg-red-50 text-red-600'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
          <span>{isLiked ? S.LIKED_BTN : S.LIKE_BTN}</span>
          {typeof post.likes === 'number' && post.likes > 0 && (
            <span className="ml-0.5 text-gray-500">{post.likes}</span>
          )}
        </button>

        <button
          type="button"
          onClick={handleReplyClick}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
            isCommentsOpen
              ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          <MessageCircle size={14} fill={isCommentsOpen ? 'currentColor' : 'none'} />
          <span>{S.REPLY_BTN}</span>
          {typeof post.comments === 'number' && post.comments > 0 && (
            <span className="ml-0.5 text-gray-500">{post.comments}</span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onShare?.(post.id)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
        >
          <Share2 size={14} />
          <span>{S.SHARE_BTN}</span>
        </button>
      </div>

      {/* Stats (for agent posts) */}
      {post.type === 'agent' && typeof post.views === 'number' && (
        <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Eye size={12} />
            {S.VIEWS(post.views)}
          </span>
          {post.pinned && (
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {S.PINNED}
            </span>
          )}
        </div>
      )}

      {/* Phase 7: 整合 useComments Hook 的留言區 */}
      {isCommentsOpen && communityId && (
        <FeedPostCommentSection
          postId={String(post.id)}
          communityId={communityId}
          currentUserId={currentUserId}
          userInitial={userInitial}
        />
      )}
      {/* Bug 1 修正：若無 communityId，顯示提示而非 no-op fallback */}
      {isCommentsOpen && !communityId && (
        <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
          留言功能暫時無法使用
        </div>
      )}
    </article>
  );
});

export default FeedPostCard;
