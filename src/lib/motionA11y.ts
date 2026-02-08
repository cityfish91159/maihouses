import { cn } from './utils';

type MotionSafetyOptions = {
  animate?: boolean;
  transition?: boolean;
};

const REDUCED_MOTION_ANIMATE_NONE = 'motion-reduce:animate-none';
const REDUCED_MOTION_TRANSITION_NONE = 'motion-reduce:transition-none';

/**
 * 統一補齊 reduced-motion class，避免動畫/轉場在無障礙設定下持續播放。
 */
export function withMotionSafety(className: string, options: MotionSafetyOptions = {}): string {
  return cn(
    className,
    options.animate ? REDUCED_MOTION_ANIMATE_NONE : undefined,
    options.transition ? REDUCED_MOTION_TRANSITION_NONE : undefined
  );
}

export const motionA11y = {
  pulse: withMotionSafety('animate-pulse', { animate: true }),
  bounce: withMotionSafety('animate-bounce', { animate: true }),
  transitionAll: withMotionSafety('transition-all', { transition: true }),
  transitionColors: withMotionSafety('transition-colors', { transition: true }),
  transitionTransform: withMotionSafety('transition-transform', { transition: true }),
  transitionOpacity: withMotionSafety('transition-opacity', { transition: true }),
} as const;
