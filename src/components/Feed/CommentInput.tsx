import React, { useState } from 'react';

interface CommentInputProps {
    onSubmit: (content: string) => Promise<void>;
    placeholder?: string;
    userInitial?: string;
    disabled?: boolean;
}

export const CommentInput: React.FC<CommentInputProps> = ({
    onSubmit,
    placeholder = '寫下您的留言...',
    userInitial = 'U',
    disabled = false
}) => {
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit(content);
            setContent('');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-3 pt-4 border-t border-gray-100/50 mt-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-xs font-semibold text-white shadow-sm shrink-0">
                {userInitial}
            </div>
            <div className="flex-1 relative group">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled || isSubmitting}
                    rows={1}
                    className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white text-[14px] text-gray-800 rounded-[20px] px-4 py-2.5 outline-none border border-transparent focus:border-indigo-500/30 ring-0 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none overflow-hidden min-h-[42px]"
                    style={{ height: 'auto', minHeight: '42px' }}
                />
                <div className="absolute right-2 top-1.5 flex items-center gap-1">
                    {content.trim() && (
                        <button
                            type="submit"
                            disabled={disabled || isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-1.5 w-8 h-8 flex items-center justify-center transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
};
