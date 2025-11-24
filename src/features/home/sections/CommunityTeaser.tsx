import { COMMUNITY_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'

export default function CommunityTeaser() {
  return (
    <HomeCard className="bg-white/96 backdrop-blur-md border border-[#E6EDF7] shadow-[0_4px_20px_rgba(0,56,90,0.03)] overflow-hidden p-0 pb-3">
      <div className="bg-[#00385a] px-4 py-3 mb-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-black m-0 text-white tracking-wide">社區評價</h3>
          <span className="text-xs font-bold text-[#00385a] bg-white px-2 py-0.5 rounded-full shadow-sm">聚合</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 px-3">
        {COMMUNITY_REVIEWS.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>
      <div className="px-3">
        <a
          className="mt-4 flex items-center gap-2.5 bg-gradient-to-b from-white to-[#F6F9FF] border border-[#E6EDF7] p-3.5 rounded-xl font-black text-[#00385a] no-underline relative lg:justify-center lg:text-center group hover:shadow-[0_4px_12px_rgba(0,56,90,0.08)] hover:border-[#00385a]/20 transition-all duration-200 active:translate-y-px"
          href="/maihouses/community-wall_mvp.html"
          aria-label="點我看更多社區評價"
        >
          <span className="text-[15px] tracking-wide lg:mx-auto group-hover:text-[#004E7C] transition-colors">
            查看更多真實住戶評價
          </span>
          <span className="ml-auto bg-[#00385a] text-white rounded-lg text-xs font-bold px-3 py-1.5 lg:absolute lg:right-[14px] lg:top-1/2 lg:-translate-y-1/2 lg:ml-0 group-hover:bg-[#004E7C] transition-colors shadow-sm">
            前往社區牆 →
          </span>
        </a>
      </div>
    </HomeCard>
  )
}

