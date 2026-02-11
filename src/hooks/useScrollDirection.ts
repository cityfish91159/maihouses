import { useState, useRef, useEffect } from 'react';

/**
 * 偵測滾動方向的 Hook
 *
 * @param threshold - 最小滾動距離閾值（預設 10px）
 * @returns 'up' | 'down'
 *
 * @remarks
 * - 使用 passive: true 提升滾動效能
 * - 閾值機制避免微小滾動觸發狀態更新
 * - 符合 ux-guidelines #36（固定元素可自動隱藏）
 *
 * @example
 * ```tsx
 * const direction = useScrollDirection(10);
 * const isVisible = direction === 'up';
 * ```
 */
export function useScrollDirection(threshold = 10): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const lastY = useRef(0);

  useEffect(() => {
    // 初始化：同步當前滾動位置，避免首次觸發時誤判
    lastY.current = window.scrollY;

    const handler = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) > threshold) {
        setDirection(y > lastY.current ? 'down' : 'up');
        lastY.current = y;
      }
    };

    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);

  return direction;
}
