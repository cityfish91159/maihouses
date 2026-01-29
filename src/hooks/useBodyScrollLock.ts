import { useEffect } from 'react';

interface BodyScrollLockOptions {
  inertTargetId?: string;
}

/**
 * useBodyScrollLock
 *
 * 鎖定 Body 滾動並對背景設置 inert/aria-hidden，避免移動端滾動穿透與螢幕閱讀器誤讀。
 */
export function useBodyScrollLock(isLocked: boolean, options?: BodyScrollLockOptions) {
  useEffect(() => {
    if (!isLocked) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const inertTarget = options?.inertTargetId
      ? document.getElementById(options.inertTargetId)
      : document.getElementById('root');

    const previousAriaHidden = inertTarget?.getAttribute('aria-hidden') ?? null;
    const hadInert = inertTarget?.hasAttribute('inert') ?? false;

    if (inertTarget) {
      inertTarget.setAttribute('aria-hidden', 'true');
      inertTarget.setAttribute('inert', 'true');
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      if (inertTarget) {
        if (previousAriaHidden === null) {
          inertTarget.removeAttribute('aria-hidden');
        } else {
          inertTarget.setAttribute('aria-hidden', previousAriaHidden);
        }

        if (!hadInert) {
          inertTarget.removeAttribute('inert');
        }
      }
    };
  }, [isLocked, options?.inertTargetId]);
}
