import { memo, useCallback } from 'react';
import { FocusTrap } from '../ui/FocusTrap';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

interface LoginPromptProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const LoginPrompt = memo(function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <FocusTrap isActive={isOpen}>
      <div
        className="fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-xl">
          <h3 id="login-title" className="mb-2 text-xl font-bold text-gray-900">
            {STRINGS.COMPOSER.LOGIN_TITLE}
          </h3>
          <p className="mb-6 text-gray-600">{STRINGS.COMPOSER.LOGIN_DESC}</p>
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100"
            >
              {STRINGS.COMPOSER.CANCEL}
            </button>
            <a
              href={ROUTES.AUTH}
              className="rounded-lg bg-brand-600 px-4 py-2 text-white transition-colors hover:bg-brand-700"
            >
              {STRINGS.COMPOSER.GO_LOGIN}
            </a>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
});
