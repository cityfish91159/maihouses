import type { PageMode } from '../../../hooks/usePageMode';
import { CommentInput } from '../../../components/Feed/CommentInput';
import { CommentList } from '../../../components/Feed/CommentList';
import { usePostCommentModeState } from '../hooks/usePostCommentModeState';
import { notify } from '../../../lib/notify';
import { logger } from '../../../lib/logger';

type RegisterGuideHandler = (title: string, description: string) => void;

interface PostCommentSectionProps {
  postId: string;
  communityId: string;
  currentUserId: string | undefined;
  userInitial: string;
  mode: PageMode;
  onRegisterGuide?: RegisterGuideHandler;
}

export function PostCommentSection({
  postId,
  communityId,
  currentUserId,
  userInitial,
  mode,
  onRegisterGuide,
}: PostCommentSectionProps) {
  const {
    comments,
    isLoading,
    interactiveUserId,
    placeholder,
    addComment,
    toggleLike,
    deleteComment,
    loadReplies,
  } = usePostCommentModeState({
    postId,
    communityId,
    currentUserId,
    mode,
    onRegisterGuide,
  });

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
      <CommentInput
        onSubmit={async (content) => {
          try {
            await addComment(content);
          } catch (err) {
            logger.error('[PostCommentSection] 留言送出失敗', { postId, err });
            notify.error('留言送出失敗', '請稍後再試');
          }
        }}
        userInitial={userInitial}
        placeholder={placeholder}
      />
    </div>
  );
}
