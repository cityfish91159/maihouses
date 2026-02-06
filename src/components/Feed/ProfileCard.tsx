/**
 * ProfileCard Component
 *
 * 用戶個人資料卡片
 * 顯示頭像、名稱、社區、等級、統計數據
 */

import { memo } from 'react';
import { ArrowRight } from 'lucide-react';
import type { UserProfile } from '../../types/feed';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';

const S = STRINGS.FEED.PROFILE;

interface ProfileCardProps {
  profile: UserProfile;
  className?: string;
}

function getLevelLabel(role: UserProfile['role']): string {
  switch (role) {
    case 'resident':
      return STRINGS.FEED.PROFILE.LEVEL_RESIDENT;
    case 'agent':
      return STRINGS.FEED.PROFILE.LEVEL_AGENT;
    default:
      return STRINGS.FEED.PROFILE.LEVEL_MEMBER;
  }
}

/** 取得等級樣式 */
function getLevelStyle(role: UserProfile['role']): string {
  switch (role) {
    case 'resident':
      return 'bg-amber-100 text-amber-700 border-amber-300';
    case 'agent':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

export const ProfileCard = memo(function ProfileCard({
  profile,
  className = '',
}: ProfileCardProps) {
  // 簡單計算直接執行即可，無需 useMemo（成本 < 收益）
  const avatarLetter = profile.name.charAt(0).toUpperCase();
  const levelLabel = getLevelLabel(profile.role);
  const levelStyle = getLevelStyle(profile.role);
  const communityLabel = STRINGS.FEED.PROFILE.FROM(profile.communityName || '我的社區');

  return (
    <section className={`rounded-2xl border border-brand-100 bg-white p-4 shadow-sm ${className}`}>
      {/* User Info Row */}
      <div className="flex items-center gap-3.5">
        <div
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-white text-xl font-black text-brand-700 ring-1 ring-brand-100"
          aria-hidden="true"
        >
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-gray-900">{profile.name}</h3>
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <span className="truncate">{communityLabel}</span>
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold ${levelStyle}`}
            >
              👑 {levelLabel}
            </span>
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          📅 {S.STATS_DAYS} {profile.stats.days} 天
        </span>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          ❤️ {S.STATS_LIKED} {profile.stats.liked}
        </span>
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-gradient-to-b from-emerald-50 to-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
          ✍️ {S.STATS_CONTRIB} {profile.stats.contributions} 篇
        </span>
      </div>

      {/* Action Link */}
      {profile.communityId && (
        <div className="mt-4 flex justify-end">
          <a
            href={`${ROUTES.COMMUNITY_WALL(profile.communityId)}?from=consumer`}
            className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-all hover:bg-blue-100 hover:shadow-sm active:scale-95"
          >
            {STRINGS.FEED.PROFILE.VIEW_WALL}
            <ArrowRight size={14} />
          </a>
        </div>
      )}
    </section>
  );
});

export default ProfileCard;
