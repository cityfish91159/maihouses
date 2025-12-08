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
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRun = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();

      if (now - lastRun.current >= delay) {
        callbackRef.current(...args);
        lastRun.current = now;
      } else {
        // 如果還在冷卻中，不執行 (Leading edge throttle)
        // 如果需要 trailing edge，可以在這裡設置 timeout
      }
    },
    [delay]
  );
}
