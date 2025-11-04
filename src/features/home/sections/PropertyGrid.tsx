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
    <section className="bg-white rounded-[var(--r-lg)] shadow-[var(--shadow-card)] p-4">
      <h3 className="font-semibold text-[var(--fs-lg)] mb-4 text-[var(--text-primary)]">精選房源</h3>

      {items.length === 0 ? (
        <div className="text-center text-[var(--text-secondary)] py-12">
          {q ? (
            <>
              找不到含「<span className="text-[var(--brand)] font-medium">{q}</span>」的物件
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
              className="border border-[var(--border-default)] rounded-[var(--r-md)] p-3 bg-white hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)] transition-all"
              aria-labelledby={`t-${p.id}`}
            >
              <div
                className="h-32 mb-2 rounded-[var(--r-sm)] bg-cover bg-center"
                style={{ backgroundImage: `url(${p.cover})` }}
                aria-hidden="true"
              />
              <h4 id={`t-${p.id}`} className="font-semibold text-[var(--fs-sm)] text-[var(--text-primary)] mb-1">
                {p.title}
              </h4>
              <div className="text-xs text-[var(--text-secondary)] mb-2">{p.communityName}</div>
              <div className="text-[var(--fs-base)] mb-2 text-[var(--brand)] font-bold">NT$ {p.price} 萬</div>
              
              {p.highlights && p.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--neutral-100)] text-[10px] text-[var(--text-secondary)]"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              )}
              
              <ul className="text-xs text-[var(--text-secondary)] mb-3 space-y-1 bg-[var(--neutral-50)] rounded-[var(--r-sm)] p-2">
                {p.reviewsTop2.slice(0, 2).map((r) => (
                  <li key={r.id} className="truncate">
                    「{r.content}」 — {r.authorMask}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => memberCTA(p.id)}
                className="w-full px-3 py-1.5 rounded-[var(--r-pill)] bg-[var(--brand)] text-white text-xs hover:opacity-90 transition-opacity"
                aria-label="註冊看更多評價"
              >
                註冊看更多評價
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3 mt-6">
        <button
          className="px-4 py-1.5 border border-[var(--border-default)] rounded-[var(--r-md)] text-[var(--fs-sm)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="上一頁"
        >
          上一頁
        </button>
        <span className="text-[var(--fs-sm)] text-[var(--text-secondary)]">
          第 {page} / {maxPage} 頁
        </span>
        <button
          className="px-4 py-1.5 border border-[var(--border-default)] rounded-[var(--r-md)] text-[var(--fs-sm)] hover:border-[var(--brand)] hover:text-[var(--brand)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page >= maxPage}
          aria-label="下一頁"
        >
          下一頁
        </button>
      </div>
    </section>
  )
}
