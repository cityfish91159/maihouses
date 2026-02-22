import { render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authListenerRef = vi.hoisted(() => ({
  callback: null as null | ((event: string, session: unknown) => void),
}));
const unsubscribeMock = vi.hoisted(() => vi.fn());
const onAuthStateChangeMock = vi.hoisted(() =>
  vi.fn((callback: (event: string, session: unknown) => void) => {
    authListenerRef.callback = callback;
    return {
      data: {
        subscription: {
          unsubscribe: unsubscribeMock,
        },
      },
    };
  })
);
const queryClientClearMock = vi.hoisted(() => vi.fn());
const cleanupAuthStateMock = vi.hoisted(() => vi.fn());
const trackEventMock = vi.hoisted(() => vi.fn());

function passthroughProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

vi.mock('react-router-dom', () => ({
  Routes: ({ children }: { children?: ReactNode }) => <>{children}</>,
  Route: ({ element }: { element?: ReactNode }) => <>{element ?? null}</>,
  Navigate: () => null,
  useLocation: () => ({ pathname: '/' }),
}));

vi.mock('@tanstack/react-query', () => {
  class QueryClient {
    clear = queryClientClearMock;
  }

  class QueryCache {
    constructor(_options?: unknown) {}
  }

  return {
    QueryClient,
    QueryCache,
    QueryClientProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  };
});

vi.mock('@tanstack/react-query-devtools', () => ({
  ReactQueryDevtools: () => null,
}));

vi.mock('./app/config', () => ({
  getConfig: vi.fn(async () => ({ devtools: '0' })),
}));

vi.mock('./app/devtools', () => ({
  default: () => null,
}));

vi.mock('./services/analytics', () => ({
  trackEvent: trackEventMock,
}));

vi.mock('./lib/authUtils', () => ({
  cleanupAuthState: cleanupAuthStateMock,
}));

vi.mock('./lib/pageMode', () => ({
  isDemoMode: () => false,
}));

vi.mock('./lib/notify', () => ({
  notify: {
    error: vi.fn(),
  },
}));

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: onAuthStateChangeMock,
    },
  },
}));

vi.mock('./hooks/useDemoTimer', () => ({
  useDemoTimer: vi.fn(),
}));

vi.mock('./context/QuietModeContext', () => ({
  QuietModeProvider: passthroughProvider,
}));

vi.mock('./context/MoodContext', () => ({
  MoodProvider: passthroughProvider,
}));

vi.mock('./context/MaiMaiContext', () => ({
  MaiMaiProvider: passthroughProvider,
}));

vi.mock('./components/CookieConsent', () => ({
  CookieConsent: () => null,
}));

vi.mock('./pages/Home', () => ({
  default: () => <div>home</div>,
}));
vi.mock('./pages/Feed', () => ({
  default: () => <div>feed</div>,
}));
vi.mock('./pages/Community/Wall', () => ({
  default: () => <div>wall</div>,
}));
vi.mock('./pages/Community/Explore', () => ({
  default: () => <div>explore</div>,
}));
vi.mock('./pages/Community/Suggested', () => ({
  default: () => <div>suggested</div>,
}));
vi.mock('./pages/Property/Detail', () => ({
  default: () => <div>property-detail</div>,
}));
vi.mock('./pages/Assure/Detail', () => ({
  default: () => <div>assure</div>,
}));
vi.mock('./pages/Chat', () => ({
  default: () => <div>chat</div>,
}));
vi.mock('./pages/Chat/Connect', () => ({
  default: () => <div>chat-connect</div>,
}));
vi.mock('./pages/Chat/Standalone', () => ({
  default: () => <div>chat-standalone</div>,
}));
vi.mock('./pages/UAG', () => ({
  default: () => <div>uag</div>,
}));
vi.mock('./pages/UAG/UAGDeAIDemo', () => ({
  default: () => <div>uag-deai</div>,
}));
vi.mock('./pages/UAG/UAGDeAIDemoV2', () => ({
  default: () => <div>uag-deai-v2</div>,
}));
vi.mock('./pages/UAG/demo/UIUXDemo', () => ({
  default: () => <div>uag-uiux-demo</div>,
}));
vi.mock('./pages/UAG/Profile', () => ({
  default: () => <div>uag-profile</div>,
}));
vi.mock('./pages/PropertyDetailPage', () => ({
  PropertyDetailPage: () => <div>property-detail-page</div>,
}));
vi.mock('./pages/PropertyUploadPage', () => ({
  PropertyUploadPage: () => <div>property-upload</div>,
}));
vi.mock('./pages/PropertyListPage', () => ({
  default: () => <div>property-list</div>,
}));
vi.mock('./pages/PropertyEditPage', () => ({
  PropertyEditPage: () => <div>property-edit</div>,
}));
vi.mock('./pages/NotFoundPage', () => ({
  default: () => <div>not-found</div>,
}));
vi.mock('./pages/Muse/MusePage', () => ({
  default: () => <div>muse</div>,
}));
vi.mock('./pages/Admin/GodView', () => ({
  default: () => <div>god-view</div>,
}));
vi.mock('./pages/UAG/SharedReportPreviewPage', () => ({
  default: () => <div>shared-report</div>,
}));
vi.mock('./app/ErrorBoundary', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('./constants/routes', () => ({
  ROUTES: {
    FEED_DEMO: '/feed/demo',
    CHAT: (conversationId: string) => `/chat/${conversationId}`,
  },
  RouteUtils: {
    toNavigatePath: (path: string) => path,
  },
}));

import App from './App';

function emitAuthEvent(event: string): void {
  const callback = authListenerRef.callback;
  if (!callback) {
    throw new Error('Auth state callback was not registered');
  }
  callback(event, null);
}

describe('App auth state bridge (#26)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authListenerRef.callback = null;
  });

  it('clears query cache on SIGNED_IN event', async () => {
    render(<App />);

    await waitFor(() => {
      expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
    });

    emitAuthEvent('SIGNED_IN');

    expect(queryClientClearMock).toHaveBeenCalledTimes(1);
    expect(cleanupAuthStateMock).not.toHaveBeenCalled();
  });

  it('calls cleanupAuthState on SIGNED_OUT event', async () => {
    render(<App />);

    await waitFor(() => {
      expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
    });

    emitAuthEvent('SIGNED_OUT');

    expect(cleanupAuthStateMock).toHaveBeenCalledTimes(1);
    const firstCall = cleanupAuthStateMock.mock.calls[0];
    const queryClientLike = firstCall?.[0] as { clear?: () => void } | undefined;
    expect(typeof queryClientLike?.clear).toBe('function');
  });

  it('unsubscribes auth state listener on unmount', async () => {
    const rendered = render(<App />);

    await waitFor(() => {
      expect(onAuthStateChangeMock).toHaveBeenCalledTimes(1);
    });

    rendered.unmount();
    expect(unsubscribeMock).toHaveBeenCalledTimes(1);
  });
});
