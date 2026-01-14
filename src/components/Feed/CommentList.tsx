import React, { useState, useCallback } from "react";
import { FeedComment } from "../../types/comment";
import { formatRelativeTime } from "../../utils/date";
import { notify } from "../../lib/notify";

interface CommentListProps {
  comments: FeedComment[];
  currentUserId: string | undefined;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLoadReplies: (commentId: string) => Promise<void>;
}

// 單一留言項目
interface CommentItemProps {
  comment: FeedComment;
  currentUserId: string | undefined;
  isReply?: boolean;
  onAddComment: (content: string, parentId?: string) => Promise<void>;
  onToggleLike: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onLoadReplies: (commentId: string) => Promise<void>;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  isReply = false,
  onAddComment,
  onToggleLike,
  onDeleteComment,
  onLoadReplies,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isLoadingReplies, setIsLoadingReplies] = useState(false);

  const authorName = comment.author.name || "匿名";
  const authorRole = comment.author.role;
  const isOwner = currentUserId && comment.author.id === currentUserId;
  const isLoggedIn = currentUserId !== undefined;
  const hasReplies = comment.repliesCount > 0;
  const repliesLoaded = comment.replies !== undefined;

  // Bug 1 修正：加入 try-catch 錯誤處理，移除 isLiking 依賴
  const handleToggleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onToggleLike(comment.id);
    } catch {
      // 錯誤已在 useComments 處理（notify + logger）
    } finally {
      setIsLiking(false);
    }
  }, [comment.id, onToggleLike]);

  const handleDelete = useCallback(async () => {
    if (!confirm("確定要刪除此留言嗎？")) return;
    setIsDeleting(true);
    try {
      await onDeleteComment(comment.id);
    } catch {
      // 錯誤已在 useComments 處理
    } finally {
      setIsDeleting(false);
    }
  }, [comment.id, onDeleteComment]);

  // Bug 2 修正：加入 try-catch，失敗時不展開
  const handleToggleReplies = useCallback(async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }

    if (hasReplies && !repliesLoaded) {
      setIsLoadingReplies(true);
      try {
        await onLoadReplies(comment.id);
        setShowReplies(true);
      } catch {
        // 錯誤已在 useComments 處理，不展開
      } finally {
        setIsLoadingReplies(false);
      }
    } else {
      setShowReplies(true);
    }
  }, [showReplies, hasReplies, repliesLoaded, comment.id, onLoadReplies]);

  const handleSubmitReply = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!replyContent.trim() || isSubmitting) return;

      setIsSubmitting(true);
      try {
        await onAddComment(replyContent, comment.id);
        setReplyContent("");
        setShowReplyInput(false);
        setShowReplies(true);
      } catch {
        // 錯誤已在 useComments 處理，保留輸入內容
      } finally {
        setIsSubmitting(false);
      }
    },
    [replyContent, isSubmitting, onAddComment, comment.id],
  );

  const handleReplyKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmitReply(e);
      }
      if (e.key === "Escape") {
        setShowReplyInput(false);
        setReplyContent("");
      }
    },
    [handleSubmitReply],
  );

  // Bug 5 修正：空字串處理
  const avatarInitial = authorName.charAt(0) || "?";

  return (
    <div className={`flex gap-3 ${isReply ? "ml-11" : ""}`}>
      {/* Avatar */}
      <div
        className={`flex shrink-0 items-center justify-center rounded-full text-xs font-medium ${
          isReply
            ? "size-6 bg-gray-100 text-gray-600"
            : "size-8 bg-indigo-50 text-indigo-600"
        }`}
      >
        {avatarInitial}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Bubble */}
        <div className="inline-block max-w-[90%] rounded-2xl rounded-tl-none bg-gray-50 px-4 py-2.5">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900">
              {authorName}
            </span>
            {authorRole === "agent" && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                房仲
              </span>
            )}
            {authorRole === "resident" && (
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                住戶
              </span>
            )}
            {authorRole === "official" && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600">
                官方
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 px-1">
          <span className="text-xs text-gray-400">
            {formatRelativeTime(comment.createdAt)}
          </span>

          {/* Like button - 登入才能按讚 */}
          <button
            onClick={handleToggleLike}
            disabled={!isLoggedIn || isLiking}
            className={`text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              comment.isLiked
                ? "text-red-500 hover:text-red-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
            title={isLoggedIn ? undefined : "請先登入"}
          >
            {isLiking ? "..." : comment.isLiked ? "已讚" : "讚"}
          </button>

          {comment.likesCount > 0 && (
            <span className="text-xs text-gray-400">
              {comment.likesCount} 個讚
            </span>
          )}

          {/* Reply button - 登入才能回覆，只有頂層留言顯示 */}
          {!isReply && (
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  notify.error("請先登入", "登入後才能回覆");
                  return;
                }
                setShowReplyInput(!showReplyInput);
              }}
              className={`text-xs font-medium transition-colors ${
                isLoggedIn
                  ? "text-gray-500 hover:text-gray-800"
                  : "cursor-not-allowed text-gray-400"
              }`}
            >
              回覆
            </button>
          )}

          {/* Delete button (only for owner) */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-xs font-medium text-gray-400 transition-colors hover:text-red-500 disabled:opacity-50"
            >
              {isDeleting ? "刪除中..." : "刪除"}
            </button>
          )}
        </div>

        {/* Show replies toggle - Bug 6 修正：使用區域 isLoadingReplies */}
        {!isReply && hasReplies && (
          <button
            onClick={handleToggleReplies}
            disabled={isLoadingReplies}
            className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-600 transition-colors hover:text-indigo-800 disabled:opacity-50"
          >
            {isLoadingReplies ? (
              <>
                <LoadingSpinner />
                載入中...
              </>
            ) : (
              <>
                <ChevronIcon expanded={showReplies} />
                {showReplies
                  ? "收起回覆"
                  : `查看 ${comment.repliesCount} 則回覆`}
              </>
            )}
          </button>
        )}

        {/* Reply input */}
        {showReplyInput && (
          <form onSubmit={handleSubmitReply} className="mt-2 flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              placeholder={`回覆 ${authorName}...`}
              disabled={isSubmitting}
              className="min-w-0 flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none transition-all focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="submit"
              disabled={!replyContent.trim() || isSubmitting}
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "..." : "送出"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowReplyInput(false);
                setReplyContent("");
              }}
              className="rounded-full px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100"
            >
              取消
            </button>
          </form>
        )}

        {/* Replies list - replies !== undefined 且有內容時顯示 */}
        {showReplies && comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                isReply={true}
                onAddComment={onAddComment}
                onToggleLike={onToggleLike}
                onDeleteComment={onDeleteComment}
                onLoadReplies={onLoadReplies}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Loading spinner
const LoadingSpinner: React.FC = () => (
  <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// Chevron icon
const ChevronIcon: React.FC<{ expanded: boolean }> = ({ expanded }) => (
  <svg
    className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

// Main CommentList component
export const CommentList: React.FC<CommentListProps> = ({
  comments,
  currentUserId,
  onAddComment,
  onToggleLike,
  onDeleteComment,
  onLoadReplies,
}) => {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100/50 pt-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onAddComment={onAddComment}
          onToggleLike={onToggleLike}
          onDeleteComment={onDeleteComment}
          onLoadReplies={onLoadReplies}
        />
      ))}
    </div>
  );
};
