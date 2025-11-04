import { useEffect, useMemo, useState } from 'react'
import HeroAssure from '../features/home/sections/HeroAssure'
import SmartAsk from '../features/home/sections/SmartAsk'
import CommunityTeaser from '../features/home/sections/CommunityTeaser'
import PropertyGrid from '../features/home/sections/PropertyGrid'
import { getMeta } from '../services/api'
import { trackEvent } from '../services/uag'
import type { AppConfig, RuntimeOverrides } from '../app/config'

const cmp = (a: string, b: string) => {
  const pa = a.split('.').map((n) => +n || 0)
  const pb = b.split('.').map((n) => +n || 0)
  for (let i = 0; i < 3; i++) {
    if (pa[i] < pb[i]) return -1
    if (pa[i] > pb[i]) return 1
  }
  return 0
}

export default function Home({ config }: { config: AppConfig & RuntimeOverrides }) {
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    getMeta().then((r) => {
      if (r.ok && r.data) {
        if (r.data.maintenance || cmp(r.data.backendVersion, config.minBackend) < 0) {
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

  return (
    <main className="max-w-container mx-auto p-4 md:p-6 space-y-6">
      {banner && (
        <div className="bg-[var(--warning)] text-white rounded-[var(--r-md)] p-3 text-[var(--fs-sm)]">{banner}</div>
      )}
      {config.features.heroAssure ? <HeroAssure /> : <div>Hero Assure 功能未啟用</div>}
      {config.features.smartAsk ? <SmartAsk /> : <div>Smart Ask 功能未啟用</div>}
      {config.features.communityTeaser ? <CommunityTeaser /> : <div>Community Teaser 功能未啟用</div>}
      {config.features.propertyGrid ? <PropertyGrid q={q} /> : <div>Property Grid 功能未啟用</div>}
    </main>
  )
}
