import { COMMUNITY_REVIEWS } from '../../../constants/data'
import { HomeCard } from '../components/HomeCard'
import { ReviewCard } from '../components/ReviewCard'

export default function CommunityTeaser() {
  return (
    <HomeCard className="bg-white/96 border border-[#E6EDF7] p-3 shadow-[0_4px_20px_rgba(0,56,90,0.03)] backdrop-blur-md">
      <div className="relative mb-4 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-[#00385a] to-[#005585] px-4 py-3 shadow-[0_2px_8px_rgba(0,56,90,0.15)]">
        {/* Decorative circle for texture */}
        <div className="pointer-events-none absolute -right-6 -top-6 size-24 rounded-full bg-white/5 blur-2xl" />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="size-1.5 rounded-full bg-[#E63946] shadow-[0_0_8px_rgba(230,57,70,0.6)]" />
          <h3 className="text-shadow-sm m-0 text-lg font-black tracking-wide text-white">社區評價</h3>
          <span className="rounded-full border border-white/20 bg-white/95 px-2.5 py-0.5 text-[11px] font-bold text-[#00385a] shadow-sm backdrop-blur-sm">
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
        className="group relative mt-4 flex items-center gap-2.5 rounded-xl border border-[#E6EDF7] bg-gradient-to-b from-white to-[#F6F9FF] p-3.5 font-black text-[#00385a] no-underline transition-all duration-200 hover:border-[#00385a]/20 hover:shadow-[0_4px_12px_rgba(0,56,90,0.08)] active:translate-y-px lg:justify-center lg:text-center"
        href="/maihouses/community-wall_mvp.html"
        aria-label="點我看更多社區評價"
      >
        <span className="text-[15px] tracking-wide transition-colors group-hover:text-[#004E7C] lg:mx-auto">
          查看更多真實住戶評價
        </span>
        <span className="ml-auto rounded-lg bg-[#00385a] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors group-hover:bg-[#004E7C] lg:absolute lg:right-[14px] lg:top-1/2 lg:ml-0 lg:-translate-y-1/2">
          前往社區牆 →
        </span>
      </a>
    </HomeCard>
  )
}

