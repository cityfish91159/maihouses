import { COMMUNITY_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'

export default function CommunityTeaser() {
  return (
    <HomeCard className="bg-white/96 backdrop-blur-md p-2.5">
      <div className="flex justify-between items-center gap-1.5 mb-3 px-1">
        <h3 className="text-lg font-extrabold m-0 text-brand tracking-wide">社區評價（聚合）</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>
      <a 
        className="mt-3 flex items-center gap-2.5 bg-gradient-to-r from-success/25 to-success/10 border border-success/40 p-3 rounded-[var(--r-sm)] font-black text-success no-underline relative lg:justify-center lg:text-center group hover:shadow-md transition-all duration-200" 
        href="/maihouses/community-wall_mvp.html" 
        aria-label="點我看更多社區評價"
      >
        <span className="text-[17px] tracking-wide lg:mx-auto max-sm:text-[15px]">👉 點我看更多社區評價</span>
        <span className="ml-auto bg-success text-white rounded-full text-sm px-3 py-2 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 max-sm:text-xs max-sm:px-2.5 max-sm:py-[7px] group-hover:bg-success/90 transition-colors shadow-sm">
          前往社區牆
        </span>
      </a>
    </HomeCard>
  )
}

