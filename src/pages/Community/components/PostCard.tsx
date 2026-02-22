import { useState, useRef, useEffect } from 'react';
import { Heart, MessageCircle, Eye, Lock, Mail, Loader2 } from 'lucide-react';
import type { Post } from '../types';
import type { PageMode } from '../../../hooks/usePageMode';
import { useThrottle } from '../../../hooks/useThrottle';
import { formatRelativeTimeLabel } from '../../../lib/time';
import { notify } from '../../../lib/notify';
import { STRINGS } from '../../../constants/strings';
import { logger } from '../../../lib/logger';
import { PostCommentSection } from './PostCommentSection';

const { COMMUNITY: S } = STRINGS;

type RegisterGuideHandler = (title: string, description: string) => void;

interface PostCardProps {
  post: Post;
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
  onLike?: (postId: number | string) => Promise<void> | void;
}

function PostBadge({ post }: { post: Post }) {
  if (post.type === 'agent') {
    return (
      <span className="rounded bg-brand-100 px-1.5 py-0.5 text-[9px] font-bold text-brand-600">
        {S.AGENT_BADGE}
      </span>
    );
  }

  if (post.type === 'official') {
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

function PostStats({ post }: { post: Post }) {
  return (
    <div className="flex gap-3 text-[11px] text-ink-600">
      {post.likes !== undefined && (
        <span className="flex items-center gap-1">
          <Heart size={12} aria-label="愛心" />
          {post.likes}
        </span>
      )}
      {post.comments !== undefined && (
        <span className="flex items-center gap-1">
          <MessageCircle size={12} aria-label="留言數" />
          {post.comments}
        </span>
      )}
      {post.views !== undefined && (
        <span className="flex items-center gap-1">
          <Eye size={12} aria-label="觀看數" />
          {post.views}
        </span>
      )}
      {post.private && (
        <span className="flex items-center gap-1">
          <Lock size={12} aria-label="鎖頭" />
          {S.PRIVATE_POST_LABEL}
        </span>
      )}
    </div>
  );
}

interface PostActionsProps {
  isAgent: boolean;
  isLiking: boolean;
  isCommentsOpen: boolean;
  onLike: () => void;
  onToggleComments: () => void;
}

function PostActions({
  isAgent,
  isLiking,
  isCommentsOpen,
  onLike,
  onToggleComments,
}: PostActionsProps) {
  if (isAgent) {
    return (
      <button
        type="button"
        className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all"
        aria-label={S.BTN_MSG_AGENT}
        aria-expanded={isCommentsOpen}
        onClick={onToggleComments}
      >
        <Mail size={12} aria-hidden="true" />{' '}
        {S.BTN_MSG_AGENT}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        className="bg-brand/6 hover:bg-brand/12 border-brand/10 flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-brand transition-all disabled:cursor-not-allowed disabled:opacity-60"
        onClick={onLike}
        aria-label="按讚這則貼文"
        aria-busy={isLiking}
        disabled={isLiking}
      >
        {isLiking ? (
          <>
            <Loader2 size={12} className="animate-spin" aria-hidden="true" />{' '}
            {S.BTN_LIKING}
          </>
        ) : (
          <>
            <Heart size={12} aria-hidden="true" />{' '}
            {S.BTN_LIKE}
          </>
        )}
      </button>
      <button
        type="button"
        className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition-all ${
          isCommentsOpen
            ? 'bg-brand/12 border-brand text-brand'
            : 'bg-brand/6 hover:bg-brand/12 border-brand/10 text-brand'
        }`}
        aria-label={S.BTN_REPLY_ARIA}
        aria-expanded={isCommentsOpen}
        onClick={onToggleComments}
      >
        <MessageCircle size={14} aria-label="對話框" />
        {S.BTN_REPLY}
      </button>
    </>
  );
}

export function PostCard({
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleLike = useThrottle(
    async () => {
      if (!onLike || isLiking) return;
      setIsLiking(true);
      try {
        await onLike(post.id);
      } catch (error) {
        logger.error('[PostCard] Failed to toggle like', { error });
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
        <PostStats post={post} />
        <div className="mt-1 flex gap-2">
          <PostActions
            isAgent={isAgent}
            isLiking={isLiking}
            isCommentsOpen={isCommentsOpen}
            onLike={handleLike}
            onToggleComments={() => setIsCommentsOpen((prev) => !prev)}
          />
        </div>

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
