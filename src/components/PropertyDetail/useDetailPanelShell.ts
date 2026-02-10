import { type RefObject } from 'react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface UseDetailPanelShellParams {
  isOpen: boolean;
  containerRef: RefObject<HTMLDivElement>;
  initialFocusRef: RefObject<HTMLButtonElement>;
  onEscape: () => void;
}

export function useDetailPanelShell({
  isOpen,
  containerRef,
  initialFocusRef,
  onEscape,
}: UseDetailPanelShellParams): boolean {
  useFocusTrap({
    containerRef,
    initialFocusRef,
    onEscape,
    isActive: isOpen,
  });

  return isOpen;
}
