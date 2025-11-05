import { useEffect, useState } from 'react'
import { getProperties } from '../../../services/api'
import { trackEvent } from '../../../services/uag'
import type { PropertyCard } from '../../../types'

export default function PropertyGrid({ q }: { q?: string }) {
  const [items, setItems] = useState<PropertyCard[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 8
  const maxPage = Math.max(1, Math.ceil(total / pageSize))

  useEffect(() => {
    setPage(1)
  }, [q])

  useEffect(() => {
    getProperties(page, pageSize, q).then((res) => {
      if (res.ok && res.data) {
        setItems(res.data.items)
        setTotal(res.data.total)
      } else {
        setItems([])
        setTotal(0)
      }
    })
  }, [page, q])

  const memberCTA = (id: string) => {
    trackEvent('card_member_cta', '/', id)
    location.hash = '#/auth/register'
  }

  return (
    <section className="bg-white rounded-[28px] shadow-[10px_10px_24px_rgba(9,15,30,.16),_-10px_-10px_24px_rgba(255,255,255,.9)] p-4 md:p-6 transition-shadow hover:shadow-[var(--shadow-hover)]">
      <h3 className="font-bold text-[var(--text-primary)] mb-5" style={{ fontSize: 'var(--fs-xl)' }}>
        精選房源
      </h3>

      {items.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-16" style={{ fontSize: 'var(--fs-base)' }}>
          {q ? (
            <>
              找不到含「<span className="text-[var(--brand)] font-semibold">{q}</span>」的物件
            </>
          ) : (
            '暫無物件，稍後再試'
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((p) => (
            <article
              key={p.id}
              className="border-2 border-[var(--border-default)] rounded-[var(--r-lg)] p-3 bg-white transition-all hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)] hover:-translate-y-1"
              aria-labelledby={`t-${p.id}`}
            >
              <div
                className="h-36 mb-3 rounded-[var(--r-md)] bg-cover bg-center"
                style={{ backgroundImage: `url(${p.cover})` }}
                aria-hidden="true"
              />
              <h4 id={`t-${p.id}`} className="font-bold text-[var(--text-primary)] mb-1" style={{ fontSize: 'var(--fs-base)' }}>
                {p.title}
              </h4>
              <div className="text-xs text-[var(--text-secondary)] mb-2">{p.communityName}</div>
              <div className="text-[var(--brand)] font-bold mb-3" style={{ fontSize: 'var(--fs-lg)' }}>
                NT$ {p.price} 萬
              </div>
              
              {p.highlights && p.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {p.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-[var(--r-pill)] font-medium transition-all hover:-translate-y-0.5"
                      style={{ 
                        background: 'var(--gradient-badge)',
                        fontSize: '10px'
                      }}
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
              
              <ul className="text-xs text-[var(--text-secondary)] mb-3 space-y-1.5 bg-[var(--neutral-50)] rounded-[var(--r-md)] p-3">
                {p.reviewsTop2.slice(0, 2).map((r) => (
                  <li key={r.id} className="truncate leading-relaxed">
                    💬 「{r.content}」 — {r.authorMask}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => memberCTA(p.id)}
                className="w-full px-3 py-2 rounded-[var(--r-pill)] text-white font-medium text-xs shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                style={{ background: 'var(--gradient-button)' }}
                aria-label="註冊看更多評價"
              >
                註冊看更多評價 →
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mt-8">
        <button
          className="px-5 py-2 border-2 border-[var(--border-default)] rounded-[var(--r-lg)] font-medium transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ fontSize: 'var(--fs-sm)' }}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="上一頁"
        >
          ← 上一頁
        </button>
        <span className="text-[var(--text-secondary)] font-medium" style={{ fontSize: 'var(--fs-sm)' }}>
          第 {page} / {maxPage} 頁
        </span>
        <button
          className="px-5 py-2 border-2 border-[var(--border-default)] rounded-[var(--r-lg)] font-medium transition-all hover:border-[var(--brand)] hover:text-[var(--brand)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          style={{ fontSize: 'var(--fs-sm)' }}
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page >= maxPage}
          aria-label="下一頁"
        >
          下一頁 →
        </button>
      </div>
    </section>
  )
}
