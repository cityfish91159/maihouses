import { useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useComposer, ComposerData } from '../../hooks/useComposer';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { notify } from '../../lib/notify';
import { FocusTrap } from '../ui/FocusTrap';
import { LoginPrompt } from './LoginPrompt';
import { STRINGS } from '../../constants/strings';

const FOCUS_DELAY_MS = 50; // 延遲讓 textarea 正確聚焦

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
    maxLength,
    minLength,
  } = useComposer({
    onSubmit,
    onSuccess: () => {
      notify.success(STRINGS.COMPOSER.SUCCESS);
      onClose();
    },
    onError: (err) => {
      notify.error(STRINGS.COMPOSER.ERROR_TITLE, err.message);
    },
    initialVisibility,
  });

  // Body scroll lock & inert background
  useBodyScrollLock(isOpen, { inertTargetId: 'root' });

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

  // Close on Escape & Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
      // P4-A6: 支援 Ctrl+Enter 送出
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (isValid && !isSubmitting) {
          submit();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting, isValid, submit]);

  // Focus on open
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, FOCUS_DELAY_MS);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Not logged in state
  if (!isAuthenticated) {
    return <LoginPrompt isOpen={isOpen} onClose={onClose} />;
  }

  const isPrivate = visibility === 'private';
  const displayPlaceholder = placeholder || (
    mode === 'community' 
      ? (isPrivate ? STRINGS.COMPOSER.PLACEHOLDER_COMMUNITY_PRIVATE : STRINGS.COMPOSER.PLACEHOLDER_COMMUNITY_PUBLIC)
      : STRINGS.COMPOSER.PLACEHOLDER_FEED
  );

  return (
    <FocusTrap isActive={isOpen} initialFocusRef={textareaRef}>
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-sm border-0 cursor-default"
          onClick={() => !isSubmitting && onClose()}
          aria-label={STRINGS.COMPOSER.CLOSE}
          tabIndex={-1}
        />

        {/* Dialog Content */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="composer-title"
          className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90dvh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2 id="composer-title" className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {mode === 'community' && isPrivate ? STRINGS.COMPOSER.TITLE_PRIVATE : STRINGS.COMPOSER.TITLE_PUBLIC}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label={STRINGS.COMPOSER.CLOSE}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            >
              {STRINGS.COMPOSER.CLOSE_ICON}
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
                  {STRINGS.COMPOSER.VISIBILITY_PUBLIC}
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
                  {STRINGS.COMPOSER.VISIBILITY_PRIVATE}
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
              minLength={minLength}
              maxLength={maxLength}
              aria-describedby="composer-counter"
            />

            {/* Image Upload Placeholder (P4-5) */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => notify.dev(STRINGS.COMPOSER.UPLOAD_IMAGE_DEV)}
                className="inline-flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-50"
              >
                {STRINGS.COMPOSER.UPLOAD_IMAGE}
              </button>
            </div>

            {error && (
              <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-3 flex items-center justify-between bg-gray-50 rounded-b-2xl">
            <span
              id="composer-counter"
              className={`text-xs ${charCount > maxLength ? 'text-red-500' : 'text-gray-400'}`}
            >
              {charCount} / {maxLength}
            </span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                {STRINGS.COMPOSER.CANCEL}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isValid || isSubmitting}
                className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
              >
                {isSubmitting ? STRINGS.COMPOSER.SUBMITTING : STRINGS.COMPOSER.SUBMIT}
              </button>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
