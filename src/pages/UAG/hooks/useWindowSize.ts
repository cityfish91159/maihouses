import { useState, useEffect } from 'react';

// Debounce helper
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = debounce(() => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 150);

    window.addEventListener('resize', handleResize);
    // Initial size set is handled by state init, but we can call it once to be sure if needed.
    // handleResize(); // Debounced, so it will run later. State is already init.

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
