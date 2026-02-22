/**
 * CaseSelector - 案件選擇器組件
 *
 * [code-simplifier] 從 TrustFlow.tsx 抽取的子組件
 */

import React from 'react';
import { Plus } from 'lucide-react';
import type { TrustCase } from './types';
import { formatRelativeTime } from './utils';
import { getBuyerDisplayName } from '../../../../lib/trustPrivacy';

interface CaseSelectorProps {
  cases: TrustCase[];
  selectedCaseId: string | null;
  onSelectCase: (id: string) => void;
  onCreateNew: () => void;
}

export function CaseSelector({
  cases,
  selectedCaseId,
  onSelectCase,
  onCreateNew,
}: CaseSelectorProps) {
  if (cases.length === 0) return null;

  return (
    <div className="mb-1 flex flex-wrap gap-2">
      {cases.map((c) => {
        const isActive = c.id === selectedCaseId;
        const buyerDisplay = getBuyerDisplayName(c, 'agent');
        const statusBadgeClass = (() => {
          switch (c.status) {
            case 'active':
              return 'bg-green-100 text-green-600';
            case 'dormant':
            case 'pending':
              return 'bg-amber-100 text-amber-600';
            case 'completed':
              return 'bg-blue-100 text-blue-600';
            case 'expired':
              return 'bg-red-100 text-red-600';
            case 'closed':
            default:
              return 'bg-gray-100 text-gray-500';
          }
        })();

        return (
          <button
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className={`min-w-[140px] cursor-pointer rounded-lg px-3 py-2 text-left transition-all duration-200 ${
              isActive ? 'border-2 border-brand bg-indigo-50' : 'border border-slate-200 bg-white'
            }`}
          >
            <div
              className={`mb-0.5 text-xs font-bold ${isActive ? 'text-brand' : 'text-slate-700'}`}
            >
              {buyerDisplay.name}
            </div>
            <div className="text-ink-300 mb-1 max-w-[120px] truncate whitespace-nowrap text-[11px]">
              {c.propertyTitle}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}
              >
                M{c.currentStep}
              </span>
              <span className="text-[10px] text-slate-400">{formatRelativeTime(c.lastUpdate)}</span>
            </div>
          </button>
        );
      })}
      <button
        className="text-ink-300 flex min-w-[60px] cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2"
        onClick={onCreateNew}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
