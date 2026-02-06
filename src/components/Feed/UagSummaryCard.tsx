import { Link } from 'react-router-dom';
import type { UagSummary } from '../../types/agent';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

interface UagSummaryCardProps {
  data: UagSummary;
  className?: string;
}

export function UagSummaryCard({ data, className = '' }: UagSummaryCardProps) {
  return (
    <article
      className={`animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-3 rounded-2xl border border-brand-100 bg-white p-4 shadow-card duration-500 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 pb-2.5">
        <div className="flex size-10 items-center justify-center rounded-full border border-badge-customer-border bg-badge-customer-bg font-black text-badge-customer-text">
          客
        </div>
        <div className="flex-1 leading-[1.3]">
          <b className="block text-[15px] text-ink-900">{STRINGS.AGENT.UAG.TITLE}</b>
          <div className="text-[12px] text-ink-600">UAG 精準獲客 · 即時</div>
        </div>
      </div>

      <div className="pt-1">
        {/* 3-column grid for metrics */}
        <div className="grid grid-cols-3 gap-2">
          {/* S Grade */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-s-border bg-grade-s-bg text-[14px] font-semibold text-grade-s-text">
            S {data.grade === 'S' ? '2' : '0'}
          </div>
          {/* A Grade */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-a-border bg-grade-a-bg text-[14px] font-semibold text-grade-a-text">
            A {data.grade === 'S' ? '1' : '0'}
          </div>
          {/* B Grade */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-b-border bg-grade-b-bg text-[14px] font-semibold text-grade-b-text">
            B 0
          </div>
          {/* No Reply */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-b-border bg-grade-b-bg text-[14px] font-semibold text-grade-b-text">
            未回覆 1
          </div>
          {/* Overdue */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-b-border bg-grade-b-bg text-[14px] font-semibold text-grade-b-text">
            逾時 0
          </div>
          {/* New */}
          <div className="flex h-[34px] items-center justify-center rounded-full border border-grade-b-border bg-grade-b-bg text-[14px] font-semibold text-grade-b-text">
            近7日新增 {data.growth}
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex justify-end">
        <Link
          to={ROUTES.UAG}
          className="rounded-xl border-none bg-brand-700 px-3 py-2 text-[14px] font-bold text-white no-underline transition-colors hover:bg-brand-dark"
        >
          {STRINGS.AGENT.UAG.LINK_WORKBENCH}
        </Link>
      </div>
    </article>
  );
}
