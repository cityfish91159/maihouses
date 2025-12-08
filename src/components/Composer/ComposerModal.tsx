import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useComposer, ComposerData } from '../../hooks/useComposer';
import { notify } from '../../lib/notify';

interface ComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ComposerData) => Promise<void>;
  mode: 'feed' | 'community';
  initialVisibility?: 'public' | 'private';
  placeholder?: string;
}

export function ComposerModal({
  isOpen,
  onClose,
  onSubmit,
  mode,
  initialVisibility = 'public',
  placeholder,
}: ComposerModalProps) {
  const { isAuthenticated } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const {
    content,
    setContent,
    visibility,
    setVisibility,
    isSubmitting,
    error,
    submit,
    reset,
    isValid,
    charCount,
  } = useComposer({
    onSubmit,
    onSuccess: () => {
      notify.success('發布成功！');
      onClose();
    },
    onError: (err) => {
      notify.error('發布失敗', err.message);
    },
    initialVisibility,
  });

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content, isOpen]);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Focus on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      // Small delay to ensure render
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Not logged in state
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
          <h3 className="text-xl font-bold text-gray-900 mb-2">請先登入</h3>
          <p className="text-gray-600 mb-6">登入後即可參與討論與發布貼文</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              取消
            </button>
            <a
              href="/maihouses/auth.html"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              前往登入
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isPrivate = visibility === 'private';
  const displayPlaceholder = placeholder || (
    mode === 'community' 
      ? (isPrivate ? '分享只有住戶能看到的內容...' : '分享你的想法、社區生活...')
      : '分享你的新鮮事...'
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            {mode === 'community' && isPrivate ? '🔐 私密貼文' : '✏️ 發布貼文'}
          </h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {/* Visibility Toggle (Community Mode Only) */}
          {mode === 'community' && (
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setVisibility('public')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                  visibility === 'public'
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                🌍 公開牆
              </button>
              <button
                type="button"
                onClick={() => setVisibility('private')}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors border ${
                  visibility === 'private'
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                🔐 住戶專屬
              </button>
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={displayPlaceholder}
            className="w-full min-h-[150px] resize-none text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
            disabled={isSubmitting}
          />

          {/* Image Upload Placeholder (P4-5) */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => notify.dev('圖片上傳功能開發中')}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              📷 上傳圖片
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50 rounded-b-2xl">
          <span className={`text-xs ${charCount > 2000 ? 'text-red-500' : 'text-gray-400'}`}>
            {charCount} / 2000
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!isValid || isSubmitting}
              className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
            >
              {isSubmitting ? '發布中...' : '發布'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
