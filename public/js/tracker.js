/**
 * @deprecated Legacy UAG tracker is sunset.
 *
 * Tracking has been migrated to the React tracker flow in `src/hooks/usePropertyTracker.ts`.
 *
 * This shim intentionally performs no network calls and keeps a stable
 * `window.uagTracker` shape to avoid runtime errors on legacy pages.
 */
(function initDeprecatedLegacyTracker(globalObject) {
  if (!globalObject || typeof globalObject !== 'object') {
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(globalObject, 'uagTracker')) {
    Object.defineProperty(globalObject, 'uagTracker', {
      configurable: true,
      enumerable: false,
      writable: false,
      value: null,
    });
  }
})(typeof window !== 'undefined' ? window : globalThis);
