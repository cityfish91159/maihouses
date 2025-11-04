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
    <section className="bg-white rounded-[var(--r-lg)] shadow-[var(--shadow-card)] p-4">
      <h3 className="font-semibold text-[var(--fs-lg)] mb-2 text-[var(--text-primary)]">社區牆</h3>
      <p className="text-[var(--fs-sm)] text-[var(--text-secondary)] mb-4">
        看看住戶怎麼說，快速了解生活圈與鄰居素質
      </p>

      {communities.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-tertiary)] text-[var(--fs-sm)]">載入中...</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {communities.map((c) => (
            <article
              key={c.id}
              className="border border-[var(--border-default)] rounded-[var(--r-md)] overflow-hidden cursor-pointer hover:shadow-[var(--shadow-hover)] transition-shadow"
              onClick={() => goToWall(c.id)}
            >
              <div
                className="h-28 bg-cover bg-center"
                style={{ backgroundImage: `url(${c.cover})` }}
                aria-hidden="true"
              />
              <div className="p-3">
                <h4 className="font-semibold text-[var(--fs-sm)] text-[var(--text-primary)] mb-1">{c.name}</h4>
                <div className="text-xs text-[var(--text-secondary)] mb-2">{c.location}</div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--brand)] font-semibold text-[var(--fs-sm)]">★ {c.score.toFixed(1)}</span>
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
