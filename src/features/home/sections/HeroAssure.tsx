import { useState } from 'react';
import { ShieldCheck, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';
import { HomeCard } from '../components/HomeCard';
import { HeroStep } from '../components/HeroStep';

/** 手機版預設顯示的步驟數量 */
const MOBILE_VISIBLE_STEPS = 2;

export default function HeroAssure() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <HomeCard variant="hero" className="group/container relative overflow-hidden">

      {/* Header Area */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-6 md:flex-row md:gap-10">

        {/* Mascot: Wireframe House */}
        <div className="relative h-32 w-28 shrink-0">
          <MascotHouse />
        </div>

        {/* Text Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-700/20 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="mb-3 text-2xl font-black tracking-tight text-brand-700 md:text-3xl">
            安心留痕保障
          </h3>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] md:text-base">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block" />
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>

        <a href="/#policy" className="hidden shrink-0 items-center gap-2 rounded-xl border-2 border-brand-700 bg-white px-5 py-2.5 text-sm font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-700 hover:text-white md:flex">
          履保規範 <ArrowRight size={16} />
        </a>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-2 pl-2 md:mt-4 md:pl-0">

        {/* Connecting Line (Desktop) */}
        <div className="absolute left-0 top-8 -z-0 hidden h-0.5 w-full bg-border-light md:block"></div>

        {/* Connecting Line (Mobile) - 高度根據展開狀態調整 */}
        <div
          className="absolute left-7 top-0 -z-0 w-0.5 bg-border-light transition-all duration-300 md:hidden"
          style={{
            height: isExpanded
              ? `calc(100% - 3rem)`
              : `calc(${MOBILE_VISIBLE_STEPS} * 3.5rem)`
          }}
        />

        {/* Desktop: 顯示全部 6 步驟 */}
        <div className="hidden md:grid md:grid-cols-6 md:gap-2">
          {HERO_STEPS.map((step, index) => (
            <HeroStep
              key={step.id}
              {...step}
              index={index}
              isLast={index === HERO_STEPS.length - 1}
            />
          ))}
        </div>

        {/* Mobile: 可收合的時間軸 */}
        <div className="grid grid-cols-1 gap-3 md:hidden">
          {HERO_STEPS.slice(0, isExpanded ? HERO_STEPS.length : MOBILE_VISIBLE_STEPS).map((step, index, arr) => (
            <HeroStep
              key={step.id}
              {...step}
              index={index}
              isLast={index === arr.length - 1}
            />
          ))}

          {/* 展開/收合按鈕 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-border-light bg-bg-soft px-4 py-2.5 text-sm font-bold text-text-muted transition-all hover:border-brand hover:text-brand active:scale-[0.98]"
          >
            {isExpanded ? (
              <>
                收合流程 <ChevronUp size={16} />
              </>
            ) : (
              <>
                查看完整流程 ({HERO_STEPS.length - MOBILE_VISIBLE_STEPS} 步驟) <ChevronDown size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </HomeCard>
  );
}
