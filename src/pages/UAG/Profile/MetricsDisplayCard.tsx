import React from 'react';
import { ShieldCheck, Star, BadgeCheck, Briefcase } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MetricsDisplayProps } from './MetricsDisplay';
import { buildMetricsDisplayViewModel } from './metricsDisplayUtils';

type MetricsDisplayCardProps = Pick<MetricsDisplayProps, 'profile' | 'className'>;

export const MetricsDisplayCard: React.FC<MetricsDisplayCardProps> = ({ profile, className }) => {
  const { ratingText, ratingCount, serviceYearsText } = buildMetricsDisplayViewModel(profile);

  return (
    <div className={cn('rounded-2xl border border-slate-100 bg-white p-5 shadow-sm', className)}>
      <h3 className="text-sm font-semibold text-slate-800">專業指標</h3>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-brand-700">
            <ShieldCheck size={16} className="text-brand-700" />
            信任分
          </div>
          <span className="text-base font-bold text-brand-700">{profile.trustScore}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Star size={16} className="text-amber-500" />
            服務評價
          </div>
          <span className="text-base font-bold text-slate-900">
            {ratingText}
            <span className="ml-1 text-xs text-slate-500">({ratingCount})</span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <BadgeCheck size={16} className="text-emerald-500" />
            完成案件
          </div>
          <span className="text-base font-bold text-slate-900">{profile.completedCases}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 transition-colors duration-200 hover:border-brand-300 motion-reduce:transition-none">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Briefcase size={16} className="text-indigo-500" />
            服務年資
          </div>
          <span className="text-base font-bold text-slate-900">{serviceYearsText}</span>
        </div>
      </div>
    </div>
  );
};
