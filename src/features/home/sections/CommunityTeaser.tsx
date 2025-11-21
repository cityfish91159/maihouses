import { COMMUNITY_REVIEWS } from '../../../constants/data'

export default function CommunityTeaser() {
  return (
    <section className="mh-card bg-white/96 backdrop-blur-md border border-border-light p-2.5">
      <div className="flex justify-between items-center gap-1.5 mb-1.5">
        <h3 className="text-lg font-extrabold m-0 text-brand tracking-wide">社區評價（聚合）</h3>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <article key={review.id} className="flex gap-2 border border-border-light rounded-[var(--r-sm)] p-1.5 bg-white relative">
            <div className="w-[34px] h-[34px] rounded-full bg-brand/10 border-2 border-brand flex items-center justify-center font-extrabold text-brand text-[17px] shrink-0">
              {review.id}
            </div>
            <div>
              <div className="font-extrabold text-sm text-text-ink">
                {review.name} <span className="text-yellow-400">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {review.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-[3px] rounded-full bg-green-500/10 border border-green-500/40 text-green-800 font-bold">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-1 text-sm leading-relaxed text-brand font-medium">
                {review.content}
              </p>
            </div>
          </article>
        ))}
      </div>
      <a 
        className="mt-2 flex items-center gap-2.5 bg-gradient-to-r from-green-500/25 to-green-500/10 border border-green-500/40 p-3 rounded-[var(--r-sm)] font-black text-green-900 no-underline relative lg:justify-center lg:text-center group" 
        href="/maihouses/community-wall_mvp.html" 
        aria-label="點我看更多社區評價"
      >
        <span className="text-[17px] tracking-wide lg:mx-auto max-sm:text-[15px]">👉 點我看更多社區評價</span>
        <span className="ml-auto bg-green-800 text-white rounded-full text-sm px-3 py-2 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 max-sm:text-xs max-sm:px-2.5 max-sm:py-[7px] group-hover:bg-green-900 transition-colors">
          前往社區牆
        </span>
      </a>
    </section>
  )
}

