import { useEffect, useMemo, useState } from 'react'
import Header from '../components/Header/Header'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
// import PropertyGrid from '../features/home/sections/PropertyGrid'
import { getMeta } from '../services/api'
import { trackEvent } from '../services/uag'
import type { AppConfig, RuntimeOverrides } from '../app/config'
import { WarmWelcomeBar } from '../components/WarmWelcomeBar'

const cmp = (a: string, b: string) => {
  const pa = a.split('.').map((n) => +n || 0)
  const pb = b.split('.').map((n) => +n || 0)
  for (let i = 0; i < 3; i++) {
    const paVal = pa[i] ?? 0
    const pbVal = pb[i] ?? 0
    if (paVal < pbVal) return -1
    if (paVal > pbVal) return 1
  }
  return 0
}

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

  const q = useMemo(() => config.q, [config.q])
  const baseUrl = (import.meta as any).env?.BASE_URL || '/'
  const features = config.features || {}

  return (
    <>
      <Header />
      <WarmWelcomeBar />
      {/* Blue background layer for top section */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-[var(--brand)] -z-10" />
      
      {banner && (
        <div className="mx-auto mt-4 max-w-container rounded-[var(--r-md)] bg-[var(--warning)] p-3 text-[var(--fs-sm)] text-white">{banner}</div>
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
          <section className="rounded-lg bg-white p-0 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] overflow-hidden">
            {/* 以 iframe 方式嵌入你上傳的完整房源清單 HTML，完全不改動其內文與排版 */}
            <iframe
              title="房源清單"
              src={`${baseUrl}maihouses_list_noheader.html`}
              style={{ width: '100%', border: 0, minHeight: '1400px' }}
              loading="lazy"
            />
          </section>
        )}
      </main>
    </>
  )
}
