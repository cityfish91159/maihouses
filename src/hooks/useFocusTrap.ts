import { useEffect, type RefObject } from 'react';

const DEFAULT_FOCUS_DELAY_MS = 50;
const DEFAULT_FOCUSABLE_SELECTOR =
  'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

type FocusTrapOptions = {
  containerRef: RefObject<HTMLElement>;
  initialFocusRef?: RefObject<HTMLElement>;
  isActive?: boolean;
  isEscapeEnabled?: boolean;
  onEscape?: () => void;
  focusDelayMs?: number;
  focusableSelector?: string;
};

export function useFocusTrap({
  containerRef,
  initialFocusRef,
  isActive = true,
  isEscapeEnabled = true,
  onEscape,
  focusDelayMs = DEFAULT_FOCUS_DELAY_MS,
  focusableSelector = DEFAULT_FOCUSABLE_SELECTOR,
}: FocusTrapOptions) {
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      initialFocusRef?.current?.focus();
    }, focusDelayMs);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape && isEscapeEnabled) {
        onEscape();
        return;
      }

      if (e.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    containerRef,
    initialFocusRef,
    isActive,
    isEscapeEnabled,
    onEscape,
    focusDelayMs,
    focusableSelector,
  ]);
}
