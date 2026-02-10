import { useEffect, useState } from 'react';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function getInitialPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    getInitialPrefersReducedMotion
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    const updateFromEvent = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateFromEvent);
      return () => mediaQuery.removeEventListener('change', updateFromEvent);
    }

    const legacyListener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addListener(legacyListener);
    return () => mediaQuery.removeListener(legacyListener);
  }, []);

  return prefersReducedMotion;
}
