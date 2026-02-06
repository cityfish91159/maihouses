import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { UserProfile } from '../../types/feed';
import type { PerformanceStats } from '../../types/agent';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

// 問題 #16 修復：使用常數替代硬編碼
const DEFAULT_COMMUNITY_ID = STRINGS.FEED.DEFAULT_COMMUNITY_ID;

// 共用的 Badge 樣式（避免重複定義）
const BADGE_CLASS =
  'inline-flex items-center rounded-md border border-[#fde047] bg-[#fef9c3] px-2 py-[3px] align-middle text-[11px] font-extrabold text-[#854d0e]';

// 共用的統計標籤樣式
const STAT_BADGE_CLASS =
  'inline-flex items-center rounded-full border border-green-200 bg-gradient-to-b from-[#f3fff8] to-green-50 px-2.5 py-[5px] text-[12px] font-bold text-[#0e8d52]';

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

  // 快取格式化的統計數據
  const formattedScore = useMemo(() => stats.score.toLocaleString(), [stats.score]);

  // 快取 Badge 渲染（避免每次重新創建 JSX）
  const badges = useMemo(
    () => (
      <>
        <span className={BADGE_CLASS}>{STRINGS.AGENT.PROFILE.BADGE_GOLD}</span>
        <span className={`ml-1 ${BADGE_CLASS}`}>{STRINGS.AGENT.PROFILE.BADGE_VERIFIED}</span>
      </>
    ),
    []
  );

  // 快取統計數據渲染
  const statsDisplay = useMemo(
    () => (
      <>
        <span className={STAT_BADGE_CLASS}>
          {STRINGS.AGENT.PROFILE.STATS_SCORE} {formattedScore}
        </span>
        <span className={STAT_BADGE_CLASS}>
          {STRINGS.AGENT.PROFILE.STATS_DAYS} {stats.days} 天
        </span>
        <span className={STAT_BADGE_CLASS}>
          {STRINGS.AGENT.PROFILE.STATS_LIKED} {stats.liked}
        </span>
      </>
    ),
    [formattedScore, stats.days, stats.liked]
  );

  return (
    <section
      className={`flex flex-col gap-3.5 rounded-2xl border border-brand-100 bg-white p-4 shadow-card ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-center gap-3.5">
        <div className="flex size-[60px] items-center justify-center rounded-full border border-brand-100 bg-gradient-to-br from-[#eef3ff] to-white text-[22px] font-black text-brand-700">
          {avatarLetter}
        </div>
        <div className="flex-1">
          <h3 className="m-0 mb-1 text-[18px] font-black text-[#0b214a]">{profile.name}</h3>
          <p className="m-0 flex items-center gap-1 text-[13px] text-slate-500">
            {STRINGS.AGENT.PROFILE.FROM_STORE} | {badges}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex flex-wrap gap-2">{statsDisplay}</div>

      {/* Links Row */}
      <div className="flex flex-wrap justify-start gap-2.5">
        <Link
          to={ROUTES.UAG}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border-none bg-gradient-to-br from-brand-700 to-brand-500 px-4 py-2.5 text-[13px] font-bold text-white no-underline opacity-100 transition-all hover:opacity-100"
        >
          {STRINGS.AGENT.PROFILE.LINK_WORKBENCH}
        </Link>
        <Link
          to={`/community/${profile.communityId || DEFAULT_COMMUNITY_ID}/wall`}
          className="ml-auto inline-flex items-center justify-center gap-1.5 rounded-full border border-solid border-[#bfdbfe] bg-[#eff6ff] px-4 py-2.5 text-[13px] font-bold text-brand-700 no-underline opacity-100 transition-all max-[400px]:ml-0 max-[400px]:w-full"
        >
          {STRINGS.AGENT.PROFILE.LINK_WALL}
        </Link>
      </div>
    </section>
  );
});
