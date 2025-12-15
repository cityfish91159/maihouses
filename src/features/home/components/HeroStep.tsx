import React from 'react';
import { CheckCircle2, LucideIcon } from 'lucide-react';

interface HeroStepProps {
  id: string;
  index: number;
  title: string;
  desc: string;
  icon: LucideIcon;
  isLast: boolean;
}

export const HeroStep = React.memo(({ index, title, desc, icon: Icon, isLast }: HeroStepProps) => {
  return (
    // 修改 1: p-2 -> py-2 pl-2 pr-1 (微調右側空間), gap-4 -> gap-3 (拉近圖文距離)
    <div className="group relative flex cursor-default items-center gap-3 rounded-xl py-2 pl-2 pr-1 transition-colors duration-300 hover:bg-bg-soft md:flex-col md:items-center md:gap-4 md:p-2">

      {/* Icon Circle */}
      <div className="relative z-10 shrink-0">
        {/* 修改 2: size-12 -> size-10 (手機版縮小為 40px), md:size-12 (桌機維持 48px) */}
        <div className="flex size-10 items-center justify-center rounded-full border-2 border-border-light bg-white text-text-muted shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand group-hover:text-brand md:size-12">
          {/* 修改 3: Icon size 預設縮小一點 (18px)，桌機版再放大 */}
          <Icon size={18} className="md:h-5 md:w-5" />
        </div>

        {/* Step Number Badge */}
        {/* 修改 4: -top-1 -> -top-0.5 (微調 Badge 位置更貼合) */}
        <div className="absolute -right-1 -top-0.5 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white ring-2 ring-white">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:text-center">
        {/* 修改 5: mb-1 -> mb-0.5 (縮減標題與內文間距), text-base -> text-sm (手機標題改小一點), md:text-base (桌機維持) */}
        <h4 className="mb-0.5 text-sm font-black text-text-ink transition-colors group-hover:text-brand md:mb-1 md:text-base">
          {title}
        </h4>
        {/* 修改 6: text-xs -> text-[11px] (手機內文縮小一點點以容納更多字), md:text-xs (桌機維持) */}
        <p className="text-[11px] font-medium leading-relaxed text-text-muted md:text-xs">
          {desc}
        </p>
      </div>

      {/* Mobile Arrow */}
      <div className="ml-auto text-border-light transition-colors group-hover:text-brand md:hidden">
        {!isLast && <CheckCircle2 size={14} className="opacity-0 group-hover:opacity-20" />}
      </div>
    </div>
  );
});

HeroStep.displayName = 'HeroStep';
