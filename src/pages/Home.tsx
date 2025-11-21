import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header/Header'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
import LegacyPropertyGrid from '../features/home/sections/LegacyPropertyGrid'
import { getMeta } from '../services/api'
import { trackEvent } from '../services/analytics'
import type { AppConfig, RuntimeOverrides } from '../app/config'
import { WarmWelcomeBar } from '../components/WarmWelcomeBar'
import { cmp } from '../lib/utils'

export default function Home({ config }: { config: AppConfig & RuntimeOverrides }) {
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    getMeta().then((r) => {
      if (r.ok && r.data) {
        if (r.data.maintenance || cmp(r.data.backendVersion, config.minBackend) < 0) {
          console.warn('版本不相容或維護中')
          setBanner('版本不相容或維護中')
        }
      }
    })
  }, [config.minBackend])

  useEffect(() => {
    const onRej = (e: PromiseRejectionEvent) => {
      try {
        trackEvent('unhandled_promise_rejection', '/', e.reason?.message || String(e.reason))
      } catch {}
    }
    window.addEventListener('unhandledrejection', onRej)
    return () => window.removeEventListener('unhandledrejection', onRej)
  }, [])

  const features = config.features || {}

  return (
    <>
      <Header />
      <WarmWelcomeBar />
      {/* Blue background layer for top section */}
      <div className="absolute top-0 left-0 w-full h-80 bg-brand -z-10" />
      
      {banner && (
        <div className="mx-auto mt-4 max-w-container rounded-md bg-yellow-500 p-3 text-sm text-white">{banner}</div>
      )}
      <main className="mx-auto max-w-container space-y-6 p-4 md:space-y-8 md:p-6 relative">
        {features.heroAssure !== false && (
          <section className="rounded-lg bg-white p-6 shadow-[0_12px_32px_rgba(0,78,124,0.15)] transition-all duration-200 hover:shadow-[0_16px_40px_rgba(0,78,124,0.2)] md:p-8">
            <HeroAssure />
          </section>
        )}
        {features.smartAsk !== false && (
          <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] md:p-8">
            <SmartAsk />
          </section>
        )}
        <section className="rounded-lg bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] md:p-8">
          <CommunityTeaser />
        </section>
        {features.propertyGrid !== false && (
          <LegacyPropertyGrid />
        )}
      </main>
    </>
  )
}

