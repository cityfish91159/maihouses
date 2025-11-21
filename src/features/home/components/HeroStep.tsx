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
    <div className="group relative flex md:flex-col items-center md:items-center gap-4 md:gap-4 p-2 rounded-xl hover:bg-bg-soft transition-colors duration-300 cursor-default">
      {/* Icon Circle */}
      <div className="relative z-10 flex-shrink-0">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-border-light text-text-muted flex items-center justify-center group-hover:border-brand group-hover:text-brand group-hover:scale-110 transition-all duration-300 shadow-sm">
          <Icon size={20} />
        </div>
        {/* Step Number Badge */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
          {index + 1}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 md:text-center">
        <h4 className="text-base font-black text-text-ink mb-1 group-hover:text-brand transition-colors">
          {title}
        </h4>
        <p className="text-xs text-text-muted font-medium leading-relaxed">
          {desc}
        </p>
      </div>

      {/* Mobile Arrow (Visual aid) */}
      <div className="md:hidden ml-auto text-border-light group-hover:text-brand transition-colors">
        {!isLast && <CheckCircle2 size={16} className="opacity-0 group-hover:opacity-20"/>}
      </div>
    </div>
  );
});

HeroStep.displayName = 'HeroStep';
