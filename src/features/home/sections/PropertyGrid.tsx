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
    <section className="rounded-[28px] bg-white p-6 pt-5 shadow-[10px_10px_24px_rgba(9,15,30,.16),_-10px_-10px_24px_rgba(255,255,255,.9)] transition-shadow hover:shadow-[var(--shadow-hover)] md:p-8 md:pt-6">
      <h3
        className="mb-2 font-bold text-[var(--text-primary)]"
        style={{ fontSize: 'clamp(19px, 2.4vw, 22px)', fontWeight: 900, marginTop: 0 }}
      >
        精選房源
      </h3>

      {/* 智能房源推薦標題（置於房源清單上方）*/}
      <div className="mh-reco-title" aria-label="智能房源推薦">
        <div className="mh-reco-title__pill">
          <span className="mh-reco-title__icon" aria-hidden="true">★</span>
          <span className="mh-reco-title__text">〔智能房源推薦〕</span>
          <span className="mh-reco-title__sub">依瀏覽行為與社區口碑輔助排序</span>
        </div>
        <div className="mh-reco-title__underline" aria-hidden="true" />
      </div>

      {items.length === 0 ? (
        <div className="py-16 text-center text-[var(--text-secondary)]" style={{ fontSize: 'var(--fs-base)' }}>
          {q ? (
            <>
              找不到含「<span className="font-semibold text-[var(--brand)]">{q}</span>」的物件
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
              className="rounded-[var(--r-lg)] border-2 border-[var(--border-default)] bg-white p-3 transition-all hover:-translate-y-1 hover:border-[var(--brand)] hover:shadow-[var(--shadow-hover)]"
              aria-labelledby={`t-${p.id}`}
            >
              <div
                className="mb-3 h-36 rounded-[var(--r-md)] bg-cover bg-center"
                style={{ backgroundImage: `url(${p.cover})` }}
                aria-hidden="true"
              />
              <h4 id={`t-${p.id}`} className="mb-1 font-bold text-[var(--text-primary)]" style={{ fontSize: 'var(--fs-base)' }}>
                {p.title}
              </h4>
              <div className="mb-2 text-xs text-[var(--text-secondary)]">{p.communityName}</div>
              <div className="mb-3 font-bold text-[var(--brand)]" style={{ fontSize: 'var(--fs-lg)' }}>
                NT$ {p.price} 萬
              </div>
              
              {p.highlights && p.highlights.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {p.highlights.map((h, i) => (
                    <span
                      key={i}
                      className="rounded-[var(--r-pill)] px-2 py-1 font-medium transition-all hover:-translate-y-0.5"
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
              
              {/* 住戶真實留言（新卡樣式） */}
              <div className="reviews-mini">
                <div className="reviews-mini__title">住戶真實留言</div>
                {p.reviewsTop2.slice(0, 2).map((r, idx) => {
                  const avatar = (r.authorMask || '住').charAt(0).toUpperCase()
                  // 嘗試以 highlights 當作標籤，沒有則略過
                  const tag = (p.highlights && p.highlights[idx]) || ''
                  return (
                    <div className="reviews-mini__item" key={r.id}>
                      <div className="reviews-mini__avatar" aria-hidden="true">{avatar}</div>
                      <div className="reviews-mini__content">
                        <div className="reviews-mini__head">
                          <span className="reviews-mini__name">{r.authorMask}</span>
                          <span className="reviews-mini__dot" />
                          {tag ? <span className="reviews-mini__tag">{tag}</span> : null}
                        </div>
                        <div className="reviews-mini__text">{r.content}</div>
                      </div>
                    </div>
                  )
                })}
                <button
                  className="reviews-mini__more"
                  type="button"
                  onClick={() => memberCTA(p.id)}
                  aria-label="註冊後看更多評價"
                >
                  註冊後看更多評價
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center justify-center gap-3">
        <button
          className="rounded-[var(--r-lg)] border-2 border-[var(--border-default)] px-5 py-2 font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
          style={{ fontSize: 'var(--fs-sm)' }}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="上一頁"
        >
          ← 上一頁
        </button>
        <span className="font-medium text-[var(--text-secondary)]" style={{ fontSize: 'var(--fs-sm)' }}>
          第 {page} / {maxPage} 頁
        </span>
        <button
          className="rounded-[var(--r-lg)] border-2 border-[var(--border-default)] px-5 py-2 font-medium transition-all hover:-translate-y-0.5 hover:border-[var(--brand)] hover:text-[var(--brand)] active:translate-y-0 disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
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
