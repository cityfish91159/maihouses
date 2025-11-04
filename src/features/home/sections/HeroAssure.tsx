import { Link } from 'react-router-dom'

export default function HeroAssure() {
  return (
    <section className="bg-[var(--bg-card-hero)] rounded-[var(--r-xl)] shadow-[var(--shadow-card)] p-6 md:p-8">
      <h2 className="text-[var(--fs-3xl)] font-bold mb-2 text-[var(--text-primary)]">讓家，不只是地址</h2>
      <p className="text-[var(--text-secondary)] mb-4 text-[var(--fs-sm)]">
        留痕追蹤・社區評分・成交週期，一次看懂。
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        {['留痕追蹤', '社區評分', '成交週期'].map((t, i) => (
          <span
            key={i}
            className="px-3 py-1 rounded-[var(--r-pill)] bg-[var(--neutral-100)] text-[var(--fs-sm)] text-[var(--text-primary)]"
          >
            {t}
          </span>
        ))}
      </div>
      <Link
        to="/assure"
        className="inline-block px-4 py-2 rounded-[var(--r-pill)] bg-[var(--brand)] text-[var(--brand-fg)] text-[var(--fs-sm)] hover:opacity-90 transition-opacity"
        aria-label="了解安心保障"
      >
        了解安心保障
      </Link>
    </section>
  )
}
