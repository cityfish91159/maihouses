import { act, render, screen } from '@testing-library/react';
import { PropertyDetailMaiMai } from '../PropertyDetailMaiMai';
import { track } from '../../../analytics/track';

vi.mock('../../../analytics/track', () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../MaiMai', () => ({
  MaiMaiBase: ({
    mood,
    animated,
    showEffects,
  }: {
    mood: string;
    animated?: boolean;
    showEffects?: boolean;
  }) => (
    <div
      data-testid="maimai-base"
      data-mood={mood}
      data-animated={String(animated)}
      data-show-effects={String(showEffects)}
    />
  ),
  MaiMaiSpeech: ({ messages }: { messages: string[] }) => <div>{messages[0]}</div>,
  useMaiMaiMood: ({ externalMood }: { externalMood: string }) => ({ mood: externalMood }),
}));

type MatchMediaController = {
  setMatches: (nextValue: boolean) => void;
};

function installMatchMediaMock(initialValue: boolean): MatchMediaController {
  let matches = initialValue;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const matchMediaMock = vi.fn().mockImplementation((query: string): MediaQueryList => {
    const mediaQueryList = {
      get matches() {
        return matches;
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.add(listener as (event: MediaQueryListEvent) => void);
        }
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        if (typeof listener === 'function') {
          listeners.delete(listener as (event: MediaQueryListEvent) => void);
        }
      },
      addListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.add(listener);
      },
      removeListener: (listener: (event: MediaQueryListEvent) => void) => {
        listeners.delete(listener);
      },
      dispatchEvent: vi.fn(() => true),
    };

    return mediaQueryList as unknown as MediaQueryList;
  });

  vi.stubGlobal('matchMedia', matchMediaMock);

  return {
    setMatches: (nextValue: boolean) => {
      matches = nextValue;
      const event = {
        matches: nextValue,
        media: '(prefers-reduced-motion: reduce)',
      } as MediaQueryListEvent;
      listeners.forEach((listener) => listener(event));
    },
  };
}

describe('PropertyDetailMaiMai', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('shows default welcome copy when trust is disabled and not hot', () => {
    render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('嗨～歡迎看屋！游杰倫 正在線上等你')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({ propertyId: 'MH-100001', mood: 'idle', trigger: 'default' })
    );
  });

  it('shows trust-enabled copy', () => {
    render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('這位房仲有開啟安心留痕，交易更有保障')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({
        propertyId: 'MH-100001',
        mood: 'happy',
        trigger: 'trust_enabled',
      })
    );
  });

  it('keeps hot mood priority even after idle timeout', () => {
    vi.useFakeTimers();

    render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={true}
        trustCasesCount={5}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('這間好搶手！已經有 5 組在看了')).toBeInTheDocument();
    expect(screen.queryByText('還在考慮嗎？可以加 LINE 先聊聊看')).not.toBeInTheDocument();
  });

  it('clamps trust case count in hot message', () => {
    const { rerender } = render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={true}
        trustCasesCount={-5}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('這間物件很受關注，快來看看！')).toBeInTheDocument();

    rerender(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={true}
        trustCasesCount={99999}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    expect(screen.getByText('這間好搶手！已經有 999 組在看了')).toBeInTheDocument();
  });

  it('switches to thinking copy after idle timeout when not hot', () => {
    vi.useFakeTimers();

    render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    expect(screen.getByText('還在考慮嗎？可以加 LINE 先聊聊看')).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith(
      'maimai_property_mood',
      expect.objectContaining({ propertyId: 'MH-100001', mood: 'thinking', trigger: 'idle_timer' })
    );
  });

  it('updates animation flags when prefers-reduced-motion changes', () => {
    const mediaController = installMatchMediaMock(false);

    render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    const maimaiBase = screen.getByTestId('maimai-base');
    expect(maimaiBase).toHaveAttribute('data-animated', 'true');
    expect(maimaiBase).toHaveAttribute('data-show-effects', 'true');

    act(() => {
      mediaController.setMatches(true);
    });

    expect(maimaiBase).toHaveAttribute('data-animated', 'false');
    expect(maimaiBase).toHaveAttribute('data-show-effects', 'false');
  });

  it('does not track again when mood and trigger remain unchanged', () => {
    const { rerender } = render(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    const initialCalls = vi
      .mocked(track)
      .mock.calls.filter(([eventName]) => eventName === 'maimai_property_mood').length;

    rerender(
      <PropertyDetailMaiMai
        trustEnabled={true}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    const finalCalls = vi
      .mocked(track)
      .mock.calls.filter(([eventName]) => eventName === 'maimai_property_mood').length;

    expect(finalCalls).toBe(initialCalls);
  });

  it('cleans idle timer and event listeners on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const removeWindowListenerSpy = vi.spyOn(window, 'removeEventListener');
    const removeDocumentListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeWindowListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(removeWindowListenerSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeWindowListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeWindowListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(removeDocumentListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
  });

  it('prevents state updates after unmount', () => {
    vi.useFakeTimers();
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { unmount } = render(
      <PropertyDetailMaiMai
        trustEnabled={false}
        isHot={false}
        trustCasesCount={0}
        agentName="游杰倫"
        propertyId="MH-100001"
      />
    );

    consoleErrorSpy.mockClear();
    unmount();

    act(() => {
      vi.advanceTimersByTime(30_000);
    });

    window.dispatchEvent(new Event('mousemove'));
    document.dispatchEvent(new Event('visibilitychange'));

    // unmount 後的 timer / event 不應觸發 React state update warning
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
