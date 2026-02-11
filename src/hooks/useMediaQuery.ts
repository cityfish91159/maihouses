import { useSyncExternalStore } from 'react';

function supportsMatchMedia() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function';
}

function getSnapshot(query: string): boolean {
  if (!supportsMatchMedia()) return false;
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

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(query, onStoreChange),
    () => getSnapshot(query),
    () => false
  );
}
