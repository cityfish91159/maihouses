import { usePrefersReducedMotion } from './usePrefersReducedMotion';

/**
 * MaiMai 組件的無障礙動畫屬性
 *
 * 自動根據用戶的 prefers-reduced-motion 偏好設定動畫開關
 *
 * @returns 包含 animated 和 showEffects 的物件
 *
 * @example
 * ```tsx
 * const a11yProps = useMaiMaiA11yProps();
 * <MaiMaiBase mood="wave" size="xs" {...a11yProps} />
 * ```
 */
export function useMaiMaiA11yProps() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return {
    animated: !prefersReducedMotion,
    showEffects: !prefersReducedMotion,
  };
}
