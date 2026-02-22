import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'sonner';
import { getConfig, type AppConfig, type RuntimeOverrides } from './app/config';
import DevTools from './app/devtools';
import { trackEvent } from './services/analytics';
import { getErrorMessage } from './lib/error';
import { logger } from './lib/logger';
import { cleanupAuthState } from './lib/authUtils';
import { isDemoMode } from './lib/pageMode';
import { notify } from './lib/notify';
import { supabase } from './lib/supabase';
import Home from './pages/Home';
import Feed from './pages/Feed';
import Wall from './pages/Community/Wall';
import Explore from './pages/Community/Explore';
import Suggested from './pages/Community/Suggested';
import Detail from './pages/Property/Detail';
import AssureDetail from './pages/Assure/Detail';
import ChatPage from './pages/Chat';
import ChatConnect from './pages/Chat/Connect';
import ChatStandalone from './pages/Chat/Standalone';
import ErrorBoundary from './app/ErrorBoundary';
import { QuietModeProvider } from './context/QuietModeContext';
import { MoodProvider } from './context/MoodContext';
import { MaiMaiProvider } from './context/MaiMaiContext';
import { CookieConsent } from './components/CookieConsent';

import UAGPage from './pages/UAG';
import UAGDeAIDemo from './pages/UAG/UAGDeAIDemo';
import UAGDeAIDemoV2 from './pages/UAG/UAGDeAIDemoV2';
import UIUXDemo from './pages/UAG/demo/UIUXDemo';
import UAGProfilePage from './pages/UAG/Profile';
import { PropertyDetailPage } from './pages/PropertyDetailPage';
import { PropertyUploadPage } from './pages/PropertyUploadPage';
import PropertyListPage from './pages/PropertyListPage';
import { PropertyEditPage } from './pages/PropertyEditPage';
import NotFoundPage from './pages/NotFoundPage';
import MusePage from './pages/Muse/MusePage';
import GodView from './pages/Admin/GodView';
import SharedReportPreviewPage from './pages/UAG/SharedReportPreviewPage';
import { useDemoTimer } from './hooks/useDemoTimer';
import { ROUTES, RouteUtils } from './constants/routes';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      const message = getErrorMessage(error);

      if (isDemoMode()) {
        logger.warn('[Demo] Unexpected API error', { error: message });
        return;
      }

      logger.error('[Query] Unexpected API error', { error: message });
      notify.error('載入失敗', message === 'Unknown error' ? '請稍後再試' : message);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// 🔒 私密功能開關 - deploy 分支強制啟用
const ENABLE_PRIVATE_FEATURES = true;

// 🎭 MUSE 獨立部署模式
const MUSE_STANDALONE = import.meta.env.VITE_MUSE_STANDALONE === 'true';

function DemoRuntimeBridge() {
  useDemoTimer();
  return null;
}

export default function App() {
  const [config, setConfig] = useState<(AppConfig & RuntimeOverrides) | null>(null);
  const loc = useLocation();

  useEffect(() => {
    getConfig()
      .then(setConfig)
      .catch((error: unknown) => {
        logger.error('[App] 設定檔載入失敗', { error });
      });
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        queryClient.clear();
        return;
      }

      if (event === 'SIGNED_OUT') {
        cleanupAuthState(queryClient);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (config) trackEvent('page_view', loc.pathname);
  }, [loc, config]);

  if (!config) {
    return <div className="p-6 text-sm text-[var(--text-secondary)]">載入中…</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <DemoRuntimeBridge />
      <QuietModeProvider>
        <MoodProvider>
          <MaiMaiProvider>
            <Toaster
              position="top-right"
              theme="light"
              richColors
              closeButton
              toastOptions={{ duration: 3200 }}
            />
            <Routes key={loc.pathname}>
              <Route
                path="/"
                element={
                  MUSE_STANDALONE ? (
                    <Navigate to="/muse" replace />
                  ) : (
                    <ErrorBoundary>
                      <Home config={config} />
                    </ErrorBoundary>
                  )
                }
              />
              {/* 路由常數含 /maihouses 前綴，需經 RouteUtils.toNavigatePath 避免 basename 重複 */}
              <Route
                path={RouteUtils.toNavigatePath(ROUTES.FEED_DEMO)}
                element={
                  <ErrorBoundary>
                    <Feed />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/feed/:userId"
                element={
                  <ErrorBoundary>
                    <Feed />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/uag"
                element={
                  <ErrorBoundary>
                    <UAGPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/uag/profile"
                element={
                  <ErrorBoundary>
                    <UAGProfilePage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/share/report/:id"
                element={
                  <ErrorBoundary>
                    <SharedReportPreviewPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/uag-deai"
                element={
                  <ErrorBoundary>
                    <UAGDeAIDemo />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/uag-deai-v2"
                element={
                  <ErrorBoundary>
                    <UAGDeAIDemoV2 />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/uag-uiux-demo"
                element={
                  <ErrorBoundary>
                    <UIUXDemo />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/community/suggested"
                element={
                  <ErrorBoundary>
                    <Suggested />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/community/:id/wall"
                element={
                  <ErrorBoundary>
                    <Wall />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/community"
                element={
                  <ErrorBoundary>
                    <Explore />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/property/upload"
                element={
                  <ErrorBoundary>
                    <PropertyUploadPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/property/:publicId/edit"
                element={
                  <ErrorBoundary>
                    <PropertyEditPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/property.html"
                element={
                  <ErrorBoundary>
                    <PropertyListPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/property/:id"
                element={
                  <ErrorBoundary>
                    <PropertyDetailPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/p/:id"
                element={
                  <ErrorBoundary>
                    <Detail />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/maihouses/trust/room"
                element={
                  <ErrorBoundary>
                    <AssureDetail />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/assure"
                element={
                  <ErrorBoundary>
                    <AssureDetail />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/chat"
                element={
                  <ErrorBoundary>
                    <ChatStandalone />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/chat/connect"
                element={
                  <ErrorBoundary>
                    <ChatConnect />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/chat/:conversationId"
                element={
                  <ErrorBoundary>
                    <ChatPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/feed/consumer/chat/:conversationId"
                element={
                  <ErrorBoundary>
                    <ChatPage />
                  </ErrorBoundary>
                }
              />
              <Route
                path="/feed/agent/chat/:conversationId"
                element={
                  <ErrorBoundary>
                    <ChatPage />
                  </ErrorBoundary>
                }
              />
              {/* 🔒 私密功能路由 - 僅在啟用時可見 */}
              {ENABLE_PRIVATE_FEATURES && (
                <>
                  <Route
                    path="/muse"
                    element={
                      <ErrorBoundary>
                        <MusePage />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/god-view"
                    element={
                      <ErrorBoundary>
                        <GodView />
                      </ErrorBoundary>
                    }
                  />
                  <Route
                    path="/admin/god-view"
                    element={
                      <ErrorBoundary>
                        <GodView />
                      </ErrorBoundary>
                    }
                  />
                </>
              )}
              <Route
                path="*"
                element={
                  <ErrorBoundary>
                    <NotFoundPage />
                  </ErrorBoundary>
                }
              />
            </Routes>
            {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            {config.devtools === '1' && <DevTools config={config} />}
            <CookieConsent />
          </MaiMaiProvider>
        </MoodProvider>
      </QuietModeProvider>
    </QueryClientProvider>
  );
}
