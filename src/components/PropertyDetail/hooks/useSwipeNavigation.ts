import { useCallback, useRef, type TouchEvent } from 'react';

type SwipeDirection = 'next' | 'prev';

interface UseSwipeNavigationOptions {
  enabled: boolean;
  swipeThreshold: number;
  swipeIntentThreshold: number;
  swipeCooldownMs: number;
  onNavigate: (direction: SwipeDirection) => boolean;
}

interface SwipeNavigationHandlers {
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
}

export function useSwipeNavigation({
  enabled,
  swipeThreshold,
  swipeIntentThreshold,
  swipeCooldownMs,
  onNavigate,
}: UseSwipeNavigationOptions): SwipeNavigationHandlers {
  const touchStartXRef = useRef<number | null>(null);
  const touchCurrentXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);
  const lastSwipeAtRef = useRef(0);
  const lastSwipeDirectionRef = useRef<SwipeDirection | null>(null);

  const resetTouchState = useCallback(() => {
    touchStartXRef.current = null;
    touchCurrentXRef.current = null;
    touchStartYRef.current = null;
    touchCurrentYRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const startTouch = event.touches[0];
      if (!startTouch) return;

      touchStartXRef.current = startTouch.clientX;
      touchCurrentXRef.current = startTouch.clientX;
      touchStartYRef.current = startTouch.clientY;
      touchCurrentYRef.current = startTouch.clientY;
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (!enabled) return;

      const currentTouch = event.touches[0];
      if (!currentTouch) return;

      const startX = touchStartXRef.current;
      const startY = touchStartYRef.current;
      const currentX = currentTouch.clientX;
      const currentY = currentTouch.clientY;

      if (typeof startX === 'number' && typeof startY === 'number') {
        const deltaX = Math.abs(currentX - startX);
        const deltaY = Math.abs(currentY - startY);

        if (deltaX > swipeIntentThreshold && deltaX > deltaY) {
          event.preventDefault();
        }
      }

      touchCurrentXRef.current = currentX;
      touchCurrentYRef.current = currentY;
    },
    [enabled, swipeIntentThreshold]
  );

  const onTouchEnd = useCallback(() => {
    if (!enabled) {
      resetTouchState();
      return;
    }

    if (
      touchStartXRef.current === null ||
      touchCurrentXRef.current === null ||
      touchStartYRef.current === null ||
      touchCurrentYRef.current === null
    ) {
      resetTouchState();
      return;
    }

    const deltaX = touchCurrentXRef.current - touchStartXRef.current;
    const deltaY = touchCurrentYRef.current - touchStartYRef.current;
    const now = Date.now();
    resetTouchState();

    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    const isHorizontalSwipe = absDeltaX > swipeThreshold && absDeltaX > absDeltaY;
    if (!isHorizontalSwipe) return;

    const swipeDirection: SwipeDirection = deltaX < 0 ? 'next' : 'prev';
    const isRapidSameDirectionSwipe =
      now - lastSwipeAtRef.current < swipeCooldownMs &&
      lastSwipeDirectionRef.current === swipeDirection;
    if (isRapidSameDirectionSwipe) return;

    const hasNavigated = onNavigate(swipeDirection);
    if (hasNavigated) {
      lastSwipeAtRef.current = now;
      lastSwipeDirectionRef.current = swipeDirection;
    }
  }, [enabled, onNavigate, resetTouchState, swipeCooldownMs, swipeThreshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
