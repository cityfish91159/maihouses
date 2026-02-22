/**
 * CommunityCard
 *
 * 社區探索頁的社區卡片組件
 * #8d 社區探索頁
 */
import { Star, MessageSquare } from 'lucide-react';
import type { CommunityListItem } from '../hooks/useCommunityList';

interface CommunityCardProps {
  community: CommunityListItem;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function CommunityCard({
  community,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: CommunityCardProps) {
  const { name, address, review_count, post_count } = community;

  return (
    // min-h-20 = 80px, keeps card height stable when title/address length differs.
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="focus-visible:ring-brand-400 min-h-20 w-full cursor-pointer rounded-[18px] border border-[var(--border)] bg-white p-5 text-left transition duration-200 hover:border-brand-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      aria-label={`查看 ${name} 社區牆`}
    >
      {/* 社區名稱 */}
      <h3 className="mb-1 text-base font-bold text-brand-700">{name}</h3>

      {/* 地址 */}
      {address && <p className="text-brand-700/60 mb-3 text-sm">{address}</p>}

      {/* 統計 pills */}
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
          <Star size={12} aria-hidden="true" />
          {review_count} 則評價
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-600">
          <MessageSquare size={12} aria-hidden="true" />
          {post_count} 則貼文
        </span>
      </div>

      {/* CTA */}
      <p className="text-sm font-semibold text-brand-700">查看社區牆 →</p>
    </button>
  );
}
