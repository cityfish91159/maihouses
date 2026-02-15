/**
 * GlobalHeader Component
 *
 * 三分頁共用頂部導航列 (P3)
 * 適用範圍：社區牆 (Community Wall)、Feed 頁面
 * 注意：首頁 (Home) 使用獨立的 Header 組件，不在此組件管理範圍內。
 */

import { useNavigate } from 'react-router-dom';
import { User, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { getCurrentPath, getLoginUrl } from '../../lib/authUtils';
import { HEADER_STRINGS, GlobalHeaderMode } from '../../constants/header';
import { STRINGS } from '../../constants/strings';
import { ROUTES, RouteUtils } from '../../constants/routes';
import { UserMenu } from './GlobalHeader/UserMenu';
import { NotificationButton } from './GlobalHeader/NotificationButton';
import { LeftSection } from './GlobalHeader/LeftSection';
import { CenterSection } from './GlobalHeader/CenterSection';

interface GlobalHeaderProps {
  /** 顯示模式：社區牆 | 消費者端 | 房仲端 */
  mode: GlobalHeaderMode;
  /** 標題 (僅在 community 模式下顯示) */
  title?: string;
  /** 額外樣式 */
  className?: string;
}

export function GlobalHeader({ mode, title, className = '' }: GlobalHeaderProps) {
  const { isAuthenticated, user, signOut, role } = useAuth();
  const {
    count: notificationCount,
    notifications,
    isLoading: notificationsLoading,
    isStale,
    refresh,
  } = useNotifications();
  const navigate = useNavigate();

  // 產生當前頁面的登入 URL（含 return 參數）
  const loginUrl = getLoginUrl(getCurrentPath());

  // 處理通知點擊跳轉（使用 React Router）
  const handleNotificationClick = (conversationId: string) => {
    navigate(RouteUtils.toNavigatePath(ROUTES.CHAT(conversationId)));
  };

  return (
    <header
      className={`sticky top-0 z-overlay border-b border-brand-100 bg-white/95 backdrop-blur-md transition-all ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-2.5 px-4">
        {/* Left */}
        <LeftSection mode={mode} />

        {/* Center */}
        <CenterSection mode={mode} title={title} />

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {mode === 'agent' && (
            <a
              href={ROUTES.UAG}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-95"
              aria-label={STRINGS.AGENT.PROFILE.LINK_WORKBENCH}
            >
              <span className="hidden sm:inline">{STRINGS.AGENT.PROFILE.LINK_WORKBENCH}</span>
              <ExternalLink size={14} strokeWidth={2.5} />
            </a>
          )}

          {/* Notifications */}
          <NotificationButton
            notificationCount={notificationCount}
            notifications={notifications}
            isLoading={notificationsLoading}
            isStale={isStale}
            onNotificationClick={handleNotificationClick}
            onRefresh={refresh}
          />

          {/* User Menu */}
          {isAuthenticated ? (
            <UserMenu user={user} role={role} signOut={signOut} />
          ) : (
            <a
              href={loginUrl}
              className="flex items-center gap-1 rounded-xl bg-brand-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-600 hover:shadow-md active:scale-95"
            >
              <User size={14} strokeWidth={2.5} />
              <span>{HEADER_STRINGS.BTN_LOGIN}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
