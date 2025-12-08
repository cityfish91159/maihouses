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
    <div className="group relative flex cursor-default items-center gap-4 rounded-xl p-2 transition-colors duration-300 hover:bg-bg-soft md:flex-col md:items-center md:gap-4">
      {/* Icon Circle */}
      <div className="relative z-10 shrink-0">
        <div className="flex size-12 items-center justify-center rounded-full border-2 border-border-light bg-white text-text-muted shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-brand group-hover:text-brand">
          <Icon size={20} />
        </div>
        {/* Step Number Badge */}
        <div className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white ring-2 ring-white">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:text-center">
        <h4 className="mb-1 text-base font-black text-text-ink transition-colors group-hover:text-brand">
          {title}
        </h4>
        <p className="text-xs font-medium leading-relaxed text-text-muted">
          {desc}
        </p>
      </div>

      {/* Mobile Arrow (Visual aid) */}
      <div className="ml-auto text-border-light transition-colors group-hover:text-brand md:hidden">
        {!isLast && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
      </div>
    </div>
  );
});

HeroStep.displayName = 'HeroStep';
