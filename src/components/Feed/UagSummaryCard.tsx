import React from 'react';
import { Link } from 'react-router-dom';
import type { UagSummary } from '../../types/agent';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

interface UagSummaryCardProps {
    data: UagSummary;
    className?: string; // Standardize prop
}

export const UagSummaryCard: React.FC<UagSummaryCardProps> = ({ data, className = '' }) => {
    return (
        <article className={`bg-white border border-[#e6edf7] rounded-2xl p-4 flex flex-col gap-3 shadow-[0_4px_14px_rgba(12,34,80,0.04)] animate-in fade-in slide-in-from-bottom-4 duration-500 ${className}`}>
            <div className="flex gap-3 items-center border-b border-[#f1f5f9] pb-2.5">
                <div className="w-10 h-10 rounded-full bg-[#faefe5] flex items-center justify-center text-[#92400e] font-black border border-[#e6edf7]">客</div>
                <div className="flex-1 leading-[1.3]">
                    <b className="block text-[15px] text-[#0f172a]">{STRINGS.AGENT.UAG.TITLE}</b>
                    <div className="text-[12px] text-[#6c7b91]">UAG 精準獲客 · 即時</div>
                </div>
            </div>

            <div className="pt-1">
                {/* 3-column grid for metrics */}
                <div className="grid grid-cols-3 gap-2">
                    {/* S Grade */}
                    <div className="flex items-center justify-center h-[34px] border border-[#cbead4] rounded-full text-[14px] font-semibold bg-[#e8faef] text-[#107a39]">
                        S {data.grade === 'S' ? '2' : '0'}
                    </div>
                    {/* A Grade */}
                    <div className="flex items-center justify-center h-[34px] border border-[#cbead4] rounded-full text-[14px] font-semibold bg-[#e8faef] text-[#107a39]">
                        A {data.grade === 'S' ? '1' : '0'}
                    </div>
                    {/* B Grade */}
                    <div className="flex items-center justify-center h-[34px] border border-[#e6edf7] rounded-full text-[14px] font-semibold text-[#64748b]">
                        B 0
                    </div>
                    {/* No Reply */}
                    <div className="flex items-center justify-center h-[34px] border border-[#e6edf7] rounded-full text-[14px] font-semibold text-[#64748b]">
                        未回覆 1
                    </div>
                    {/* Overdue */}
                    <div className="flex items-center justify-center h-[34px] border border-[#e6edf7] rounded-full text-[14px] font-semibold text-[#64748b]">
                        逾時 0
                    </div>
                    {/* New */}
                    <div className="flex items-center justify-center h-[34px] border border-[#e6edf7] rounded-full text-[14px] font-semibold text-[#64748b]">
                        近7日新增 {data.growth}
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-2.5">
                <Link
                    to={ROUTES.UAG}
                    className="px-3 py-2 rounded-xl bg-[#00385a] text-white no-underline border-none font-bold text-[14px] hover:bg-[#002840] transition-colors"
                >
                    {STRINGS.AGENT.UAG.LINK_WORKBENCH}
                </Link>
            </div>
        </article>
    );
};
