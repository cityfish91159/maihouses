import React from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import MascotHouse from '../../../components/MascotHouse';
import { HERO_STEPS } from '../../../constants/data';

export default function HeroAssure() {
  return (
    <section className="mh-card mh-card--hero bg-gradient-to-br from-white to-brand-50 border border-border-light p-6 md:p-10 relative overflow-hidden group/container">
      
      {/* Header Area */}
      <div className="relative z-10 mb-10 flex flex-col items-center gap-6 md:flex-row md:gap-10">
        
        {/* Mascot: Wireframe House */}
        <div className="w-28 h-32 shrink-0 relative">
             <MascotHouse />
        </div>

        {/* Text Content */}
        <div className="text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand/20 bg-bg-soft text-brand text-xs font-bold mb-3">
            <ShieldCheck size={14} />
            <span>全程透明．安心留痕</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-black text-brand mb-3 tracking-tight">
            安心留痕保障
          </h3>
          <p className="text-text-muted font-medium text-sm md:text-base leading-relaxed max-w-2xl">
            介紹改從第一次電話聯絡開始，買賣雙方的每一通聯絡紀錄、每一句承諾與每項協議，
            都會經過雙方確認並完整留痕。<br className="hidden md:block"/>
            讓整個交易過程都有跡可循，保障雙方權益，直到圓滿交屋。
          </p>
        </div>
        
        <a href="#" className="hidden md:flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-xl bg-white border-2 border-brand text-brand font-bold text-sm hover:bg-brand hover:text-white transition-all shadow-sm">
          履保規範 <ArrowRight size={16} />
        </a>
      </div>

      {/* Process Timeline */}
      <div className="relative mt-4 pl-2 md:pl-0">
        
        {/* Connecting Line (Desktop Horizontal) - Centered at top-8 (32px) to align with 48px circle center + 8px padding */}
        <div className="hidden md:block absolute top-8 left-0 w-full h-0.5 bg-border-light -z-0"></div>
        
        {/* Connecting Line (Mobile Vertical) - Centered at left-8 (32px) */}
        <div className="md:hidden absolute left-8 top-0 bottom-0 w-0.5 bg-border-light -z-0"></div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 md:gap-2">
          {HERO_STEPS.map((step, index) => (
            <div key={step.id} className="group relative flex md:flex-col items-center md:items-center gap-4 md:gap-4 p-2 rounded-xl hover:bg-bg-soft transition-colors duration-300 cursor-default">
                
                {/* Icon Circle */}
                <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-border-light text-text-muted flex items-center justify-center group-hover:border-brand group-hover:text-brand group-hover:scale-110 transition-all duration-300 shadow-sm">
                        <step.icon size={20} />
                    </div>
                    {/* Step Number Badge */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                        {index + 1}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 md:text-center">
                    <h4 className="text-base font-black text-text-ink mb-1 group-hover:text-brand transition-colors">
                        {step.title}
                    </h4>
                    <p className="text-xs text-text-muted font-medium leading-relaxed">
                        {step.desc}
                    </p>
                </div>

                {/* Mobile Arrow (Visual aid) */}
                <div className="md:hidden ml-auto text-border-light group-hover:text-brand transition-colors">
                     {index < HERO_STEPS.length - 1 && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
                </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
