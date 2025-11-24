import { COMMUNITY_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'

export default function CommunityTeaser() {
  return (
    <HomeCard className="bg-white/96 backdrop-blur-md border border-[#E6EDF7] shadow-[0_4px_20px_rgba(0,56,90,0.03)] p-3">
      <div className="bg-gradient-to-r from-[#00385a] to-[#005585] rounded-2xl px-4 py-3 mb-4 flex justify-between items-center shadow-[0_2px_8px_rgba(0,56,90,0.15)] relative overflow-hidden">
        {/* Decorative circle for texture */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2.5 relative z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.6)]" />
          <h3 className="text-lg font-black m-0 text-white tracking-wide text-shadow-sm">社區評價</h3>
          <span className="text-[11px] font-bold text-[#00385a] bg-white/95 backdrop-blur-sm px-2.5 py-0.5 rounded-full shadow-sm border border-white/20">
            聚合
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {COMMUNITY_REVIEWS.map((review) => (
          <ReviewCard key={review.id} {...review} />
        ))}
      </div>

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
    </HomeCard>
  )
}

