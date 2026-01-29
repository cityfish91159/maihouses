// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTelemetry } from '../property-main.js';

describe('Telemetry LCP/FCP', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('captures LCP when PerformanceObserver triggers', () => {
    let callback;
    class MockPerformanceObserver {
      constructor(cb) {
        callback = cb;
      }
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('PerformanceObserver', MockPerformanceObserver);

    const telemetry = createTelemetry();

    // Simulate LCP entry
    callback({
      getEntries: () => [{ startTime: 123.45 }],
    });

    const data = telemetry.expose();
    expect(data.lcp).toBe(123.45);
  });

  it('captures FCP from performance entries', () => {
    vi.stubGlobal('performance', {
      now: () => 1000,
      getEntriesByType: vi
        .fn()
        .mockReturnValue([{ name: 'first-contentful-paint', startTime: 45.67 }]),
    });

    const telemetry = createTelemetry();
    const data = telemetry.expose();
    expect(data.fcp).toBe(45.67);
  });

  it('logs events with timestamps', () => {
    const telemetry = createTelemetry();
    telemetry.log('test-event', { foo: 'bar' });

    const data = telemetry.expose();
    expect(data.events[0].name).toBe('test-event');
    expect(data.events[0].foo).toBe('bar');
    expect(typeof data.events[0].ts).toBe('number');
  });
});
