import { useCallback, useRef, useSyncExternalStore } from 'react';

function supportsMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function getSnapshot(query: string, fallbackValue: boolean): boolean {
  if (!supportsMatchMedia()) return fallbackValue;
  return window.matchMedia(query).matches;
}

function subscribe(query: string, onStoreChange: () => void): () => void {
  if (!supportsMatchMedia()) return () => {};

  const mediaQueryList = window.matchMedia(query);

  if (typeof mediaQueryList.addEventListener === 'function') {
    mediaQueryList.addEventListener('change', onStoreChange);
    return () => mediaQueryList.removeEventListener('change', onStoreChange);
  }

  mediaQueryList.addListener(onStoreChange);
  return () => mediaQueryList.removeListener(onStoreChange);
}

function queueStoreUpdate(onStoreChange: () => void) {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(onStoreChange);
    return;
  }
  Promise.resolve().then(onStoreChange);
}

export function useMediaQuery(query: string, ssrDefault = false): boolean {
  const hasHydratedRef = useRef(false);

  const subscribeToQuery = useCallback(
    (onStoreChange: () => void) => {
      const unsubscribe = subscribe(query, onStoreChange);
      if (!hasHydratedRef.current) {
        queueStoreUpdate(() => {
          hasHydratedRef.current = true;
          onStoreChange();
        });
      }
      return unsubscribe;
    },
    [query]
  );

  const getClientSnapshot = useCallback(() => {
    if (!hasHydratedRef.current) {
      return ssrDefault;
    }
    return getSnapshot(query, ssrDefault);
  }, [query, ssrDefault]);

  const getServerSnapshot = useCallback(() => ssrDefault, [ssrDefault]);

  return useSyncExternalStore(subscribeToQuery, getClientSnapshot, getServerSnapshot);
}
