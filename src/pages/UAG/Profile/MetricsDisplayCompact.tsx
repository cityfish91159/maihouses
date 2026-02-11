import React from 'react';
import { ShieldCheck, Star, BadgeCheck, Briefcase } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MetricsDisplayProps } from './MetricsDisplay';

type MetricsDisplayCompactProps = Pick<MetricsDisplayProps, 'profile' | 'className'>;

export const MetricsDisplayCompact: React.FC<MetricsDisplayCompactProps> = ({ profile, className }) => {
  const hasRating = Number.isFinite(profile.serviceRating);
  const ratingText = hasRating ? profile.serviceRating.toFixed(1) : 'N/A';
  const serviceYearsText = Number.isFinite(profile.serviceYears) ? `${profile.serviceYears} 年` : 'N/A';

  return (
    <div className={cn('grid grid-cols-2 gap-2', className)}>
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
        <ShieldCheck size={16} className="text-slate-700" />
        <span className="mt-1 text-xs text-slate-600">信任分</span>
        <span className="mt-1 text-lg font-bold text-slate-900">{profile.trustScore}</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
        <Star size={16} className="text-amber-500" />
        <span className="mt-1 text-xs text-slate-600">服務評價</span>
        <span className="mt-1 text-lg font-bold text-slate-900">{ratingText}</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
        <BadgeCheck size={16} className="text-emerald-500" />
        <span className="mt-1 text-xs text-slate-600">完成案件</span>
        <span className="mt-1 text-lg font-bold text-slate-900">{profile.completedCases}</span>
      </div>
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
        <Briefcase size={16} className="text-indigo-500" />
        <span className="mt-1 text-xs text-slate-600">服務年資</span>
        <span className="mt-1 text-lg font-bold text-slate-900">{serviceYearsText}</span>
      </div>
    </div>
  );
};
