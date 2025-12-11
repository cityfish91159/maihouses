/**
 * FeedPostCard Component
 *
 * 信息流貼文卡片組件
 * 支援：住戶貼文、房仲物件、管理員公告、AI 快訊
 */

import { useState, useCallback, memo } from 'react';
import { Heart, MessageCircle, Share2, Calendar, Eye } from 'lucide-react';
import type { FeedPost } from '../../hooks/useFeedData';
import { STRINGS } from '../../constants/strings';
import { formatRelativeTime } from '../../utils/date';
import { CommentList } from './CommentList';
import { CommentInput } from './CommentInput';

const S = STRINGS.FEED.POST;

interface FeedPostCardProps {
  post: FeedPost;
  isLiked?: boolean;
  onLike?: (postId: string | number) => Promise<void>;
  onReply?: (postId: string | number) => void;
  onShare?: (postId: string | number) => void;
  onComment?: (postId: string | number, content: string) => Promise<void>; // P6 Phase 1: New prop
  className?: string;
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

export const FeedPostCard = memo(function FeedPostCard({
  post,
  isLiked = false,
  onLike,
  onReply,
  onShare,
  onComment,
  className = '',
}: FeedPostCardProps) {
  const [isLiking, setIsLiking] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false); // P6 Phase 1: Toggle state

  const handleLike = useCallback(async () => {
    if (!onLike || isLiking) return;
    setIsLiking(true);
    try {
      await onLike(post.id);
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
            <span className="truncate text-sm font-bold text-gray-900">
              {post.author}
            </span>
            {post.floor && (
              <span className="text-xs text-gray-500">{post.floor}</span>
            )}
            {authorBadge && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                {authorBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {post.communityName && (
              <span className="truncate">{post.communityName}</span>
            )}
            <span>·</span>
            <span>{formatRelativeTime(post.time)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="pt-3">
        {post.title && (
          <h3 className="mb-1 text-sm font-bold text-gray-900">{post.title}</h3>
        )}
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
          {post.content}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3">
        <button
          type="button"
          onClick={handleLike}
          disabled={isLiking}
          aria-pressed={isLiked}
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${isLiked
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
          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${isCommentsOpen
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

      {/* Comment Section (P6 Phase 1) */}
      {isCommentsOpen && (
        <div className="animate-fade-in">
          <CommentList comments={post.commentList || []} />
          <CommentInput onSubmit={handleSubmitComment} />
        </div>
      )}
    </article>
  );
});

export default FeedPostCard;
