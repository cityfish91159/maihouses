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
  const displayPlaceholder =
    placeholder ||
    (mode === 'community'
      ? isPrivate
        ? STRINGS.COMPOSER.PLACEHOLDER_COMMUNITY_PRIVATE
        : STRINGS.COMPOSER.PLACEHOLDER_COMMUNITY_PUBLIC
      : STRINGS.COMPOSER.PLACEHOLDER_FEED);

  return (
    <FocusTrap isActive={isOpen} initialFocusRef={textareaRef}>
      <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
        {/* Backdrop */}
        <button
          type="button"
          className="absolute inset-0 size-full cursor-default border-0 bg-black/50 backdrop-blur-sm"
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
          className="relative z-10 flex max-h-[90dvh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h2
              id="composer-title"
              className="flex items-center gap-2 text-lg font-bold text-gray-800"
            >
              {mode === 'community' && isPrivate
                ? STRINGS.COMPOSER.TITLE_PRIVATE
                : STRINGS.COMPOSER.TITLE_PUBLIC}
            </h2>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label={STRINGS.COMPOSER.CLOSE}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
            >
              {STRINGS.COMPOSER.CLOSE_ICON}
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Visibility Toggle (Community Mode Only) */}
            {mode === 'community' && (
              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('public')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    visibility === 'public'
                      ? 'border-brand-200 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {STRINGS.COMPOSER.VISIBILITY_PUBLIC}
                </button>
                <button
                  type="button"
                  onClick={() => setVisibility('private')}
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    visibility === 'private'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
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
              className="min-h-[150px] w-full resize-none text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
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
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-600"
              >
                {STRINGS.COMPOSER.UPLOAD_IMAGE}
              </button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600" role="alert">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between rounded-b-2xl border-t border-gray-100 bg-gray-50 px-4 py-3">
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
                className="rounded-lg px-4 py-2 font-medium text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                {STRINGS.COMPOSER.CANCEL}
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={!isValid || isSubmitting}
                className="rounded-lg bg-brand-600 px-6 py-2 font-bold text-white shadow-sm transition-colors hover:bg-brand-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
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
