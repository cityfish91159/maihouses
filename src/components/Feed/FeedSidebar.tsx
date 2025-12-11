/**
 * FeedSidebar Component
 *
 * 桌面版側邊欄
 * 包含：快速導航、社區動態、待售物件
 */

import { memo } from 'react';
import { Home, Search, Star, Clock, ChevronRight } from 'lucide-react';
import type { SidebarData, HotPost, SaleItem } from '../../types/feed';
import { STRINGS } from '../../constants/strings';

const S = STRINGS.FEED.SIDEBAR;

interface FeedSidebarProps {
  data?: SidebarData;
  activeNav?: string;
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'my-community', label: '我的社區牆', icon: <Home size={16} />, href: '#my-community' },
  { id: 'explore', label: '探索其他社區', icon: <Search size={16} />, href: '#explore' },
  { id: 'fav', label: '我的收藏', icon: <Star size={16} />, href: '#fav' },
  { id: 'history', label: '瀏覽紀錄', icon: <Clock size={16} />, href: '#history' },
];

/** 側邊欄卡片容器 */
function SidebarCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-brand-100 bg-white p-3.5 shadow-sm">
      <h4 className="mb-2.5 text-sm font-bold text-brand-700">{title}</h4>
      {children}
    </div>
  );
}

/** 快速導航列表 */
function NavList({ activeNav }: { activeNav?: string }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = activeNav === item.id;
        return (
          <a
            key={item.id}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${isActive
              ? 'bg-gradient-to-r from-brand-700 to-brand-600 text-white shadow-sm'
              : 'text-gray-700 hover:bg-brand-50'
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}

/** 社區動態卡片 */
function HotPostsCard({ posts }: { posts: HotPost[] | undefined }) {
  if (!posts || posts.length === 0) {
    return (
      <SidebarCard title={`📊 ${S.HOT_TITLE}`}>
        <p className="text-sm text-gray-500">{S.HOT_EMPTY}</p>
      </SidebarCard>
    );
  }

  const totalPosts = posts.length;
  const uniqueCommunities = new Set(posts.map((p) => p.communityName)).size;

  return (
    <SidebarCard title={`📊 ${S.HOT_TITLE}`}>
      <p className="text-sm leading-relaxed text-gray-600">
        {S.HOT_NEW_POSTS}{' '}
        <span className="font-bold text-brand-700">{totalPosts}</span> {S.HOT_POSTS_UNIT}
        <br />
        {S.HOT_ACTIVE_COMMUNITIES}{' '}
        <span className="font-bold text-brand-700">{uniqueCommunities}</span> {S.HOT_COMMUNITIES_UNIT}
      </p>
    </SidebarCard>
  );
}

/** 待售物件卡片 */
function SaleItemsCard({ items }: { items: SaleItem[] | undefined }) {
  if (!items || items.length === 0) {
    return (
      <SidebarCard title={`🏠 ${S.SALE_TITLE}`}>
        <p className="text-sm text-gray-500">{S.SALE_EMPTY}</p>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard title={`🏠 ${S.SALE_TITLE}`}>
      <p className="text-sm leading-relaxed text-gray-600">
        {S.SALE_PREFIX}{' '}
        <span className="font-bold text-brand-700">{items.length}</span>{' '}
        {S.SALE_SUFFIX}
        <br />
        <a
          href="#sale-all"
          className="inline-flex items-center gap-0.5 text-xs text-brand-600 hover:underline"
        >
          {S.VIEW_ALL}
          <ChevronRight size={12} />
        </a>
      </p>
    </SidebarCard>
  );
}

export const FeedSidebar = memo(function FeedSidebar({
  data,
  activeNav = 'my-community',
  className = '',
}: FeedSidebarProps) {
  return (
    <aside
      className={`sticky top-[72px] hidden w-[280px] shrink-0 flex-col gap-3 self-start lg:flex ${className}`}
    >
      {/* 快速導航 */}
      <SidebarCard title={`🧭 ${S.NAV_TITLE}`}>
        <NavList activeNav={activeNav} />
      </SidebarCard>

      {/* 社區動態 */}
      <HotPostsCard posts={data?.hotPosts} />

      {/* 待售物件 */}
      <SaleItemsCard items={data?.saleItems} />
    </aside>
  );
});

export default FeedSidebar;
