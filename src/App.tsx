import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// Force Vercel Deploy: Source change in src/
import { getConfig, type AppConfig, type RuntimeOverrides } from './app/config'
import DevTools from './app/devtools'
import { trackEvent } from './services/analytics'
import Home from './pages/Home'
import Register from './pages/Auth/Register'
import Login from './pages/Auth/Login'
import Wall from './pages/Community/Wall'
import Suggested from './pages/Community/Suggested'
import Detail from './pages/Property/Detail'
import AssureDetail from './pages/Assure/Detail'
import ChatStandalone from './pages/Chat/Standalone'
import ErrorBoundary from './app/ErrorBoundary'
import { QuietModeProvider } from './context/QuietModeContext'
import { MoodProvider } from './context/MoodContext'
import { CookieConsent } from './components/CookieConsent'

import UAGPage from './pages/UAG'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  const [config, setConfig] = useState<(AppConfig & RuntimeOverrides) | null>(null)
  const loc = useLocation()

  useEffect(() => {
    getConfig().then(setConfig)
  }, [])

  useEffect(() => {
    if (config) trackEvent('page_view', loc.pathname)
  }, [loc, config])

  if (!config) {
    return (
      <div className="p-6 text-sm text-[var(--text-secondary)]">載入中…</div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <QuietModeProvider>
        <MoodProvider>
          <Routes key={loc.pathname}>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Home config={config} />
              </ErrorBoundary>
            }
          />
          <Route
          path="/maihouses"
          element={
            <ErrorBoundary>
              <Home config={config} />
            </ErrorBoundary>
          }
        />
        <Route
          path="/uag"
          element={
            <UAGPage />
          }
        />
        <Route
          path="/auth/register"
          element={
            <ErrorBoundary>
              <Register />
            </ErrorBoundary>
          }
        />
        <Route
          path="/auth/login"
          element={
            <ErrorBoundary>
              <Login />
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
          path="/community/suggested"
          element={
            <ErrorBoundary>
              <Suggested />
            </ErrorBoundary>
          }
        />
        <Route
          path="/property/:id"
          element={
            <ErrorBoundary>
              <Detail />
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
      </Routes>
      {config.devtools === '1' && <DevTools config={config} />}
      <CookieConsent />
      </MoodProvider>
    </QuietModeProvider>
    </QueryClientProvider>
  )
}
