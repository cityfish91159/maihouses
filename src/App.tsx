import { useEffect, useState } from 'react'
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
            {/* 
            由於 basename 已統一設定為 /maihouses/，
            此處不需要額外的 /maihouses 路由，
            否則會變成匹配 /maihouses/maihouses 
          */}
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
        </MoodProvider>
      </QuietModeProvider>
    </QueryClientProvider>
  )
}
