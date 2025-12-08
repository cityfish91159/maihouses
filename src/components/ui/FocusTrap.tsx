import { useEffect, useRef } from 'react';

interface FocusTrapProps {
  children: React.ReactNode;
  isActive: boolean;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

/**
 * FocusTrap Component
 * 
 * 實現無障礙焦點鎖定 (Focus Trap)
 * 1. 鎖定 Tab 鍵循環焦點
 * 2. 初始焦點設置
 * 3. 關閉時還原焦點
 * 4. 點擊外部不丟失焦點
 */
export function FocusTrap({ children, isActive, initialFocusRef }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 1. 儲存與還原焦點
  useEffect(() => {
    if (isActive) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // 嘗試設置初始焦點
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        // 尋找第一個可聚焦元素
        const focusable = containerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length > 0) {
          (focusable[0] as HTMLElement).focus();
        }
      }
    } else {
      // 還原焦點
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [isActive, initialFocusRef]);

  // 2. 攔截 Tab 鍵
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        // Shift + Tab: 如果當前是第一個，跳到最後一個
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: 如果當前是最後一個，跳到第一個
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return (
    <div ref={containerRef}>
      {children}
    </div>
  );
}
