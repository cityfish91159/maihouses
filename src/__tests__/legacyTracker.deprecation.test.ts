// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Script, createContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const LEGACY_HTML_PATH = resolve(process.cwd(), 'public/_legacy_property.html');
const LEGACY_TRACKER_PATH = resolve(process.cwd(), 'public/js/tracker.js');
const REACT_TRACKER_HOOK_PATH = resolve(process.cwd(), 'src/hooks/usePropertyTracker.ts');

const legacyHtml = readFileSync(LEGACY_HTML_PATH, 'utf8');
const legacyTrackerShim = readFileSync(LEGACY_TRACKER_PATH, 'utf8');
const reactTrackerHook = readFileSync(REACT_TRACKER_HOOK_PATH, 'utf8');

function runShimWithContext(context: Record<string, unknown>): Record<string, unknown> {
  const vmContext = createContext(context);
  const script = new Script(legacyTrackerShim, { filename: 'tracker.js' });
  script.runInContext(vmContext);
  return context;
}

describe('legacy tracker deprecation hardening', () => {
  it('removes tracker.js from legacy property page', () => {
    expect(legacyHtml).not.toContain('js/tracker.js');
  });

  it('keeps React tracker endpoint on /api/uag/track and rejects deprecated endpoint', () => {
    expect(reactTrackerHook).toContain("const UAG_TRACK_ENDPOINT = '/api/uag/track'");
    expect(reactTrackerHook).not.toContain('/api/uag-track');
  });

  it('keeps shim as no-network implementation', () => {
    expect(legacyTrackerShim).toContain('@deprecated');
    expect(legacyTrackerShim).not.toContain('/api/uag-track');
    expect(legacyTrackerShim).not.toContain('/api/uag/track');
    expect(legacyTrackerShim).not.toContain('sendBeacon(');
    expect(legacyTrackerShim).not.toContain('fetch(');
    expect(legacyTrackerShim).not.toContain('XMLHttpRequest');
  });

  it('creates a stable null uagTracker when window exists and key is missing', () => {
    const windowObject: Record<string, unknown> = {};

    runShimWithContext({
      window: windowObject,
      globalThis: windowObject,
      Object,
    });

    const descriptor = Object.getOwnPropertyDescriptor(windowObject, 'uagTracker');
    expect(descriptor).toBeDefined();
    expect(descriptor?.value).toBeNull();
    expect(descriptor?.enumerable).toBe(false);
    expect(descriptor?.writable).toBe(false);
    expect(descriptor?.configurable).toBe(true);
  });

  it('does not overwrite existing uagTracker value', () => {
    const existingTracker = { legacy: true };
    const windowObject: Record<string, unknown> = { uagTracker: existingTracker };

    runShimWithContext({
      window: windowObject,
      globalThis: windowObject,
      Object,
    });

    expect(windowObject.uagTracker).toBe(existingTracker);
  });

  it('falls back to globalThis when window is unavailable', () => {
    const globalObject: Record<string, unknown> = {};

    runShimWithContext({
      globalThis: globalObject,
      Object,
    });

    expect(globalObject.uagTracker).toBeNull();
  });

  it('is safe when window is explicitly null', () => {
    const globalObject: Record<string, unknown> = {};

    expect(() =>
      runShimWithContext({
        window: null,
        globalThis: globalObject,
        Object,
      })
    ).not.toThrow();
  });
});
