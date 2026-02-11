import { act, renderHook, waitFor } from '@testing-library/react';
import { useMediaQuery } from '../useMediaQuery';

type MediaQueryChangeListener = (event: MediaQueryListEvent) => void;

function createMatchMediaController(initialMatches: boolean) {
  const listeners = new Set<MediaQueryChangeListener>();
  let matches = initialMatches;

  const matchMedia = vi.fn((query: string): MediaQueryList => {
    const mediaQueryList: MediaQueryList = {
      media: query,
      get matches() {
        return matches;
      },
      onchange: null,
      addEventListener: (
        eventName: string,
        listener: EventListenerOrEventListenerObject
      ) => {
        if (eventName !== 'change') return;
        listeners.add(listener as MediaQueryChangeListener);
      },
      removeEventListener: (
        eventName: string,
        listener: EventListenerOrEventListenerObject
      ) => {
        if (eventName !== 'change') return;
        listeners.delete(listener as MediaQueryChangeListener);
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: () => true,
    };
    return mediaQueryList;
  });

  const setMatches = (nextMatches: boolean) => {
    matches = nextMatches;
    const changeEvent = {
      matches: nextMatches,
      media: '(min-width: 1024px)',
    } as MediaQueryListEvent;
    listeners.forEach((listener) => listener(changeEvent));
  };

  return { matchMedia, setMatches };
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: originalMatchMedia,
    });
    vi.clearAllMocks();
  });

  it('returns ssrDefault when matchMedia is unavailable', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)', true));

    expect(result.current).toBe(true);
  });

  it('uses ssrDefault first to keep SSR/CSR initial render consistent', async () => {
    const controller = createMatchMediaController(true);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: controller.matchMedia,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)', false));

    expect(result.current).toBe(false);

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('responds to media query changes after mount', async () => {
    const controller = createMatchMediaController(false);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: controller.matchMedia,
    });

    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));

    expect(result.current).toBe(false);

    act(() => {
      controller.setMatches(true);
    });

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
