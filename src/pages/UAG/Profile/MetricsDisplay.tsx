import React from 'react';
import { ShieldCheck, Star, BadgeCheck, Briefcase } from 'lucide-react';
import type { AgentProfileMe } from '../../../types/agent.types';

interface MetricsDisplayProps {
  profile: AgentProfileMe;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ profile }) => {
  const hasRating = Number.isFinite(profile.serviceRating);
  const ratingText = hasRating ? profile.serviceRating.toFixed(1) : 'N/A';
  const ratingCount = Number.isFinite(profile.reviewCount) ? profile.reviewCount : 0;
  const serviceYearsText = Number.isFinite(profile.serviceYears)
    ? `${profile.serviceYears} 年`
    : 'N/A';

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-800">專業指標</h3>
      <div className="mt-4 grid gap-3">
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <ShieldCheck size={16} className="text-slate-700" />
            信任分
          </div>
          <span className="text-base font-bold text-slate-900">{profile.trustScore}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Star size={16} className="text-amber-500" />
            服務評價
          </div>
          <span className="text-base font-bold text-slate-900">
            {ratingText}
            <span className="ml-1 text-xs text-slate-500">({ratingCount})</span>
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <div className="flex items-center gap-3 text-sm text-slate-700">
            <BadgeCheck size={16} className="text-emerald-500" />
            完成案件
          </div>
          <span className="text-base font-bold text-slate-900">{profile.completedCases}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
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
