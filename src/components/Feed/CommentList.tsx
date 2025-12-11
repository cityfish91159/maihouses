import React from 'react';
import { FeedComment } from '../../types/comment';
import { formatRelativeTime } from '../../utils/date';

interface CommentListProps {
    comments: FeedComment[];
}

export const CommentList: React.FC<CommentListProps> = ({ comments }) => {
    if (!comments || comments.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 pt-4 border-t border-gray-100/50 mt-4">
            {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-medium text-indigo-600 shrink-0">
                        {comment.author.charAt(0)}
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="bg-gray-50 rounded-2xl px-4 py-2.5 rounded-tl-none inline-block max-w-[90%]">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-gray-900">
                                    {comment.author}
                                </span>
                                {comment.role === 'agent' && (
                                    <span className="bg-indigo-100 text-indigo-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                        房仲
                                    </span>
                                )}
                                {comment.role === 'resident' && (
                                    <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">
                                        住戶
                                    </span>
                                )}
                            </div>
                            <p className="text-[14px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                                {comment.content}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 px-1">
                            <span className="text-xs text-gray-400">
                                {formatRelativeTime(comment.time)}
                            </span>
                            <button className="text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors">
                                讚
                            </button>
                            {comment.likes > 0 && (
                                <span className="text-xs text-gray-400 flex items-center gap-1">
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
