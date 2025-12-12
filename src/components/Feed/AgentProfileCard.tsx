import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../types/feed';
import type { PerformanceStats } from '../../types/agent';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

interface AgentProfileCardProps {
    profile: UserProfile;
    stats: PerformanceStats;
    className?: string;
}

export const AgentProfileCard = memo(function AgentProfileCard({
    profile,
    stats,
    className = '',
}: AgentProfileCardProps) {
    const avatarLetter = profile.name.charAt(0).toUpperCase();
    const communityLabel = profile.communityName || STRINGS.FEED.DEFAULT_COMMUNITY_NAME;

    return (
        <section className={`bg-white border border-[#e6edf7] rounded-2xl p-4 shadow-[0_4px_14px_rgba(0,51,102,0.04)] flex flex-col gap-3.5 ${className}`}>
            {/* Header Row */}
            <div className="flex items-center gap-3.5">
                <div className="flex w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#eef3ff] to-white border border-[#e6edf7] items-center justify-center font-black text-[#00385a] text-[22px]">
                    {avatarLetter}
                </div>
                <div className="flex-1">
                    <h3 className="m-0 mb-1 text-[18px] font-black text-[#0b214a]">{profile.name}</h3>
                    <p className="m-0 text-[13px] text-[#6c7b91] flex items-center gap-1">
                        {STRINGS.AGENT.PROFILE.FROM_STORE} |
                        <span className="inline-flex items-center px-2 py-[3px] rounded-md font-extrabold text-[11px] text-[#854d0e] bg-[#fef9c3] border border-[#fde047] align-middle">{STRINGS.AGENT.PROFILE.BADGE_GOLD}</span>
                        <span className="inline-flex items-center px-2 py-[3px] rounded-md font-extrabold text-[11px] text-[#854d0e] bg-[#fef9c3] border border-[#fde047] align-middle ml-1">{STRINGS.AGENT.PROFILE.BADGE_VERIFIED}</span>
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-2 flex-wrap">
                <span className="inline-flex items-center px-2.5 py-[5px] rounded-full border border-[#cbead4] bg-gradient-to-b from-[#f3fff8] to-[#e8faef] font-bold text-[12px] text-[#0e8d52]">
                    {STRINGS.AGENT.PROFILE.STATS_SCORE} {stats.score.toLocaleString()}
                </span>
                <span className="inline-flex items-center px-2.5 py-[5px] rounded-full border border-[#cbead4] bg-gradient-to-b from-[#f3fff8] to-[#e8faef] font-bold text-[12px] text-[#0e8d52]">
                    {STRINGS.AGENT.PROFILE.STATS_DAYS} {stats.days} 天
                </span>
                <span className="inline-flex items-center px-2.5 py-[5px] rounded-full border border-[#cbead4] bg-gradient-to-b from-[#f3fff8] to-[#e8faef] font-bold text-[12px] text-[#0e8d52]">
                    {STRINGS.AGENT.PROFILE.STATS_LIKED} {stats.liked}
                </span>
            </div>

            {/* Links Row */}
            <div className="flex gap-2.5 flex-wrap justify-start">
                <Link to={ROUTES.UAG} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border-none text-white bg-gradient-to-br from-[#00385a] to-[#005282] font-bold text-[13px] no-underline opacity-100 transition-all hover:opacity-100">
                    {STRINGS.AGENT.PROFILE.LINK_WORKBENCH}
                </Link>
                <Link
                    to={`/community/${profile.communityId || 'test-uuid'}/wall`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-[#bfdbfe] border-solid text-[#00385a] bg-[#eff6ff] font-bold text-[13px] no-underline opacity-100 transition-all ml-auto max-[400px]:ml-0 max-[400px]:w-full"
                >
                    {STRINGS.AGENT.PROFILE.LINK_WALL}
                </Link>
            </div>
        </section>
    );
});
