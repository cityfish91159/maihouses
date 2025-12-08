import { FocusTrap } from '../ui/FocusTrap';
import { STRINGS } from '../../constants/strings';

interface LoginPromptProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginPrompt({ isOpen, onClose }: LoginPromptProps) {
  if (!isOpen) return null;

  return (
    <FocusTrap isActive={isOpen}>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
      >
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
          <h3 id="login-title" className="text-xl font-bold text-gray-900 mb-2">
            {STRINGS.COMPOSER.LOGIN_TITLE}
          </h3>
          <p className="text-gray-600 mb-6">
            {STRINGS.COMPOSER.LOGIN_DESC}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {STRINGS.COMPOSER.CANCEL}
            </button>
            <a
              href="/maihouses/auth.html"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
            >
              {STRINGS.COMPOSER.GO_LOGIN}
            </a>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
