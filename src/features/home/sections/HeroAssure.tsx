import { ShieldCheck, ArrowRight } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';
import { HomeCard } from '../components/HomeCard';
import { HeroStep } from '../components/HeroStep';

export default function HeroAssure() {
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
          <div className="border-[var(--brand)]/20 mb-3 inline-flex items-center gap-2 rounded-full border bg-[var(--bg-page)] px-3 py-1 text-xs font-bold text-[var(--brand)]">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="mb-3 text-2xl font-black tracking-tight text-[var(--brand)] md:text-3xl">
            安心留痕保障
          </h3>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] md:text-base">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block"/>
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>
        
        <a href="/#policy" className="hidden shrink-0 items-center gap-2 rounded-xl border-2 border-[var(--brand)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand)] shadow-sm transition-all hover:bg-[var(--brand)] hover:text-white md:flex">
          履保規範 <ArrowRight size={16} />
        </a>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-4 pl-2 md:pl-0">
        
        {/* Connecting Line (Desktop Horizontal) - Centered at top-8 (32px) to align with 48px circle center + 8px padding */}
        <div className="absolute left-0 top-8 -z-0 hidden h-0.5 w-full bg-border-light md:block"></div>
        
        {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
                {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
        <div className="absolute inset-y-0 left-8 -z-0 w-0.5 bg-border-light md:hidden"></div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 md:gap-2">
          {HERO_STEPS.map((step, index) => (
            <HeroStep 
              key={step.id} 
              {...step} 
              index={index} 
              isLast={index === HERO_STEPS.length - 1} 
            />
          ))}
        </div>
      </div>
    </HomeCard>
  );
}
