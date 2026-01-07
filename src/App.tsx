import { useEffect, useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "sonner";
import { getConfig, type AppConfig, type RuntimeOverrides } from "./app/config";
import DevTools from "./app/devtools";
import { trackEvent } from "./services/analytics";
import Home from "./pages/Home";
import Feed from "./pages/Feed";
import Wall from "./pages/Community/Wall";
import Suggested from "./pages/Community/Suggested";
import Detail from "./pages/Property/Detail";
import AssureDetail from "./pages/Assure/Detail";
import ChatPage from "./pages/Chat";
import ChatStandalone from "./pages/Chat/Standalone";
import ErrorBoundary from "./app/ErrorBoundary";
import { QuietModeProvider } from "./context/QuietModeContext";
import { MoodProvider } from "./context/MoodContext";
import { MaiMaiProvider } from "./context/MaiMaiContext";
import { CookieConsent } from "./components/CookieConsent";

import UAGPage from "./pages/UAG";
import { PropertyDetailPage } from "./pages/PropertyDetailPage";
import { PropertyUploadPage } from "./pages/PropertyUploadPage";
import PropertyListPage from "./pages/PropertyListPage";
import { PropertyEditPage } from "./pages/PropertyEditPage";
import { ReportPage } from "./pages/Report";
import MusePage from "./pages/Muse/MusePage";
import GodView from "./pages/Admin/GodView";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// 🔒 私密功能開關 - deploy 分支強制啟用
const ENABLE_PRIVATE_FEATURES = true;

export default function App() {
  const [config, setConfig] = useState<(AppConfig & RuntimeOverrides) | null>(
    null,
  );
  const loc = useLocation();

  useEffect(() => {
    getConfig().then(setConfig);
  }, []);

  useEffect(() => {
    if (config) trackEvent("page_view", loc.pathname);
  }, [loc, config]);

  if (!config) {
    return (
      <div className="p-6 text-sm text-[var(--text-secondary)]">載入中…</div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
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
                  <ErrorBoundary>
                    <Home config={config} />
                  </ErrorBoundary>
                }
              />
              {/* 
            由於 basename 已統一設定為 /maihouses/，
            此處不需要額外的 /maihouses 路由，
            否則會變成匹配 /maihouses/maihouses 
          */}
              <Route
                path="/feed/:userId"
                element={
                  <ErrorBoundary>
                    <Feed />
                  </ErrorBoundary>
                }
              />
              <Route path="/uag" element={<UAGPage />} />
              <Route
                path="/community/:id/wall"
                element={
                  <ErrorBoundary>
                    <Wall />
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
              <Route
                path="/r/:id"
                element={
                  <ErrorBoundary>
                    <ReportPage />
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
            </Routes>
            {import.meta.env.DEV && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
            {config.devtools === "1" && <DevTools config={config} />}
            <CookieConsent />
          </MaiMaiProvider>
        </MoodProvider>
      </QuietModeProvider>
    </QueryClientProvider>
  );
}
