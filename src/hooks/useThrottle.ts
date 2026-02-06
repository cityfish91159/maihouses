import { useCallback, useRef, useEffect } from 'react';

/**
 * useThrottle Hook
 *
 * 限制函數在指定時間內只能執行一次
 *
 * @param callback 要執行的函數
 * @param delay 冷卻時間 (ms)
 * @returns 節流後的函數
 */
export interface UseThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number,
  options: UseThrottleOptions = {}
): (...args: Parameters<T>) => void {
  const { leading = true, trailing = false } = options;
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastArgsRef = useRef<Parameters<T> | null>(null);
  const callbackRef = useRef(callback);

  // 保持 callback 最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 節流函數（使用 useCallback，允許內部使用 Date.now()）
  const throttled = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      lastArgsRef.current = args;

      const invoke = () => {
        if (lastArgsRef.current) {
          callbackRef.current(...lastArgsRef.current);
          lastRun.current = Date.now();
          lastArgsRef.current = null;
        }
      };

      const remaining = delay - (now - lastRun.current);

      if (remaining <= 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (leading) {
          invoke();
        } else if (trailing) {
          timeoutRef.current = setTimeout(() => {
            timeoutRef.current = null;
            invoke();
          }, delay);
        }
        return;
      }

      if (trailing && !timeoutRef.current) {
        timeoutRef.current = setTimeout(() => {
          timeoutRef.current = null;
          invoke();
        }, remaining);
      }
    },
    [delay, leading, trailing]
  );

  return throttled;
}
