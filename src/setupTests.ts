import '@testing-library/jest-dom';

const ORIGINAL_CONSOLE_WARN = console.warn.bind(console);

beforeAll(() => {
  vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
    const message = typeof args[0] === 'string' ? args[0] : '';
    if (message.includes('React Router Future Flag Warning')) {
      return;
    }
    ORIGINAL_CONSOLE_WARN(...(args as Parameters<typeof console.warn>));
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    constructor(_callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {}

    disconnect(): void {}

    observe(_target: Element): void {}

    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }

    unobserve(_target: Element): void {}
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}
