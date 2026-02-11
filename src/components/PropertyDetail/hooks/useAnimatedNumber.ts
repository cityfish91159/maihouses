import { useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion';

interface UseAnimatedNumberOptions {
  durationMs?: number;
}

function normalizeTarget(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export function useAnimatedNumber(
  targetValue: number,
  { durationMs = 600 }: UseAnimatedNumberOptions = {}
): number {
  const prefersReducedMotion = usePrefersReducedMotion();
  const normalizedTarget = useMemo(() => normalizeTarget(targetValue), [targetValue]);
  const shouldAnimate = !prefersReducedMotion && durationMs > 0;
  const [displayValue, setDisplayValue] = useState<number>(() => (shouldAnimate ? 0 : normalizedTarget));
  const displayValueRef = useRef<number>(shouldAnimate ? 0 : normalizedTarget);

  useEffect(() => {
    displayValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    if (!shouldAnimate) return;

    const startValue = displayValueRef.current;
    if (startValue === normalizedTarget) return;

    const startTime = Date.now();
    let frameId = 0;

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, Math.max(0, elapsed / durationMs));
      const nextValue = Math.max(
        0,
        Math.round(startValue + (normalizedTarget - startValue) * progress)
      );
      setDisplayValue(nextValue);

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [durationMs, normalizedTarget, shouldAnimate]);

  return shouldAnimate ? displayValue : normalizedTarget;
}
