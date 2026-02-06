import React, { useState, memo } from 'react';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  userInitial?: string;
  disabled?: boolean;
}

export const CommentInput = memo(
  function CommentInput({
    onSubmit,
    placeholder = '寫下您的留言...',
    userInitial = 'U',
    disabled = false,
  }: CommentInputProps) {
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
      <form onSubmit={handleSubmit} className="mt-4 flex gap-3 border-t border-gray-100/50 pt-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 text-xs font-semibold text-white shadow-sm">
          {userInitial}
        </div>
        <div className="group relative flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isSubmitting}
            rows={1}
            className="min-h-[42px] w-full resize-none overflow-hidden rounded-[20px] border border-transparent bg-gray-50 px-4 py-2.5 text-[14px] text-gray-800 outline-none ring-0 transition-all hover:bg-gray-100 focus:border-indigo-500/30 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
            style={{ height: 'auto', minHeight: '42px' }}
          />
          <div className="absolute right-2 top-1.5 flex items-center gap-1">
            {content.trim() && (
              <button
                type="submit"
                disabled={disabled || isSubmitting}
                className="flex size-8 items-center justify-center rounded-full bg-indigo-600 p-1.5 text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <svg className="size-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="size-4 transition-transform group-hover:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 12h14M12 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    );
  },
  (prevProps, nextProps) => {
    // 自訂比較函數：只比較會影響 UI 的 props（忽略 onSubmit 函數）
    return (
      prevProps.placeholder === nextProps.placeholder &&
      prevProps.userInitial === nextProps.userInitial &&
      prevProps.disabled === nextProps.disabled
    );
  }
);

CommentInput.displayName = 'CommentInput';
