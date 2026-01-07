import React from "react";
import { FeedComment } from "../../types/comment";
import { formatRelativeTime } from "../../utils/date";

interface CommentListProps {
  comments: FeedComment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (!comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 space-y-4 border-t border-gray-100/50 pt-4">
      {comments.map((comment) => (
        <div key={comment.id} className="flex gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">
            {comment.author.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="inline-block max-w-[90%] rounded-2xl rounded-tl-none bg-gray-50 px-4 py-2.5">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {comment.author}
                </span>
                {comment.role === "agent" && (
                  <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[10px] font-medium text-indigo-600">
                    房仲
                  </span>
                )}
                {comment.role === "resident" && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600">
                    住戶
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-gray-700">
                {comment.content}
              </p>
            </div>

            <div className="flex items-center gap-4 px-1">
              <span className="text-xs text-gray-400">
                {formatRelativeTime(comment.time)}
              </span>
              <button className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-800">
                讚
              </button>
              {comment.likes > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  • {comment.likes} 個讚
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
