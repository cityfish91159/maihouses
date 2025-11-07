import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCommunities } from '../../../services/api'
import { trackEvent } from '../../../services/uag'
import type { CommunityPreview } from '../../../types'

export default function CommunityTeaser() {
  const [communities, setCommunities] = useState<CommunityPreview[]>([])
  const nav = useNavigate()

  useEffect(() => {
    getCommunities().then((res) => {
      if (res.ok && res.data) {
        setCommunities(res.data.slice(0, 3))
      }
    })
  }, [])

  const goToWall = (id: string) => {
    trackEvent('community_wall_click', '/', id)
    nav(`/community/${id}/wall`)
  }

  return (
    <section className="bg-white rounded-[28px] shadow-[10px_10px_24px_rgba(9,15,30,.16),_-10px_-10px_24px_rgba(255,255,255,.9)] p-6 md:p-8 pt-5 md:pt-6 pb-6 md:pb-8 transition-shadow hover:shadow-[var(--shadow-hover)]">
      <h3
        className="font-bold text-[var(--text-primary)] mb-2"
        style={{ fontSize: 'clamp(19px, 2.4vw, 22px)', fontWeight: 900, marginTop: 0 }}
      >
        社區牆
      </h3>
      <p className="text-[var(--text-secondary)] mb-3" style={{ fontSize: 'var(--fs-sm)' }}>
        看看住戶怎麼說，快速了解生活圈與鄰居素質
      </p>

      {communities.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-tertiary)]" style={{ fontSize: 'var(--fs-sm)' }}>
          載入中...
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communities.map((c) => (
            <article
              key={c.id}
              className="border-2 border-[var(--border-default)] rounded-[var(--r-lg)] overflow-hidden cursor-pointer transition-all hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-1"
              onClick={() => goToWall(c.id)}
            >
              <div
                className="h-32 bg-cover bg-center"
                style={{ backgroundImage: `url(${c.cover})` }}
                aria-hidden="true"
              />
              <div className="p-4">
                <h4 className="font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: 'var(--fs-base)' }}>
                  {c.name}
                </h4>
                <div className="text-xs text-[var(--text-secondary)] mb-3">{c.location}</div>
                <div className="flex items-center gap-3">
                  <span className="text-[var(--brand)] font-bold" style={{ fontSize: 'var(--fs-base)' }}>
                    ★ {c.score.toFixed(1)}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)]">{c.reviewCount} 則評價</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
