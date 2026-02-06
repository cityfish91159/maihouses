/**
 * GlobalHeader Component
 *
 * 三分頁共用頂部導航列 (P3)
 * 適用範圍：社區牆 (Community Wall)、消費者信息流 (Consumer Feed)、房仲信息流 (Agent Feed)
 * 注意：首頁 (Home) 使用獨立的 Header 組件，不在此組件管理範圍內。
 *
 * ⚠️ WARNING: 修改此組件時，請務必同步更新 public/feed-consumer.html 與 public/feed-agent.html
 * 靜態頁面的 Header 是手動複製的，若不同步會導致視覺與功能不一致。
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, ChevronDown, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { Logo } from '../Logo/Logo';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { HEADER_STRINGS, GlobalHeaderMode } from '../../constants/header';
import { STRINGS } from '../../constants/strings';
import { ROUTES } from '../../constants/routes';
import { MESSAGING_CONFIG } from '../../constants/messaging';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationErrorBoundary } from './NotificationErrorBoundary';

interface GlobalHeaderProps {
  /** 顯示模式：社區牆 | 消費者端 | 房仲端 */
  mode: GlobalHeaderMode;
  /** 標題 (僅在 community 模式下顯示) */
  title?: string;
  /** 額外樣式 */
  className?: string;
  /** 搜尋回調 (Optional) */
  onSearch?: (query: string) => void;
}

// Helper to map role to display string
const getRoleLabel = (role: string | undefined) => {
  switch (role) {
    case 'resident':
      return HEADER_STRINGS.ROLE_RESIDENT;
    case 'agent':
      return HEADER_STRINGS.ROLE_AGENT;
    case 'official':
      return HEADER_STRINGS.ROLE_OFFICIAL;
    case 'guest':
      return HEADER_STRINGS.ROLE_GUEST;
    default:
      return HEADER_STRINGS.ROLE_MEMBER;
  }
};

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  // 處理登出
  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success(HEADER_STRINGS.MSG_LOGOUT_SUCCESS, HEADER_STRINGS.MSG_LOGOUT_DESC);
      setUserMenuOpen(false);
      navigate(ROUTES.HOME);
    } catch (error) {
      logger.error('GlobalHeader.handleSignOut.failed', {
        error,
        userId: user?.id,
      });
      notify.error(HEADER_STRINGS.MSG_LOGOUT_ERROR, HEADER_STRINGS.MSG_LOGOUT_RETRY);
    }
  };

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // [NASA TypeScript Safety] 使用 instanceof 類型守衛驗證 DOM 元素
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      if (!target.closest('#gh-user-menu-btn') && !target.closest('#gh-user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
      if (!target.closest('#gh-notification-btn') && !target.closest('#gh-notification-dropdown')) {
        setNotificationMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // 處理通知點擊跳轉（使用 React Router）
  const handleNotificationClick = (conversationId: string) => {
    setNotificationMenuOpen(false);
    navigate(ROUTES.CHAT(conversationId));
  };

  // 渲染左側區域 (Logo)
  const renderLeft = () => {
    // P3-AUDIT-FIX: Smart Home Link based on role
    let homeLink: string = ROUTES.HOME;
    if (role === 'agent') {
      homeLink = ROUTES.FEED_AGENT;
    } else if (role === 'resident' || role === 'member') {
      homeLink = ROUTES.FEED_CONSUMER;
    }

    return (
      <div className="flex items-center gap-2">
        <Logo showSlogan={false} href={homeLink} showBadge={true} />
        {mode === 'agent' && (
          <span className="rounded bg-gradient-to-br from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            {HEADER_STRINGS.AGENT_BADGE}
          </span>
        )}
      </div>
    );
  };

  // 渲染中間區域 (標題)
  const renderCenter = () => {
    if (mode === 'community' && title) {
      return (
        <div className="flex-1 text-center">
          <h1 className="text-brand-900 m-0 text-base font-extrabold">{title}</h1>
          <p className="text-ink-500 m-0 text-[11px]">{HEADER_STRINGS.SUBTITLE_WALL}</p>
        </div>
      );
    }
    return <div className="flex-1" />;
  };

  return (
    <header
      className={`sticky top-0 z-overlay border-b border-brand-100 bg-white/95 backdrop-blur-md transition-all ${className}`}
    >
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-2.5 px-4">
        {/* Left */}
        {renderLeft()}

        {/* Center */}
        {renderCenter()}

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
          <div className="relative">
            <button
              id="gh-notification-btn"
              onClick={() => setNotificationMenuOpen(!notificationMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-xl border border-brand-100 bg-white p-2 text-brand-700 transition-all hover:bg-brand-50 active:scale-95"
              aria-label={HEADER_STRINGS.LABEL_NOTIFICATIONS}
              aria-expanded={notificationMenuOpen}
            >
              <Bell size={18} strokeWidth={2.5} />
              {notificationCount > 0 && (
                <span
                  className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-600 text-[10px] font-bold text-white shadow-sm"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {notificationCount > MESSAGING_CONFIG.UNREAD_BADGE_MAX
                    ? `${MESSAGING_CONFIG.UNREAD_BADGE_MAX}+`
                    : notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {notificationMenuOpen && (
              <div id="gh-notification-dropdown">
                <NotificationErrorBoundary onClose={() => setNotificationMenuOpen(false)}>
                  <NotificationDropdown
                    notifications={notifications}
                    isLoading={notificationsLoading}
                    isStale={isStale}
                    onClose={() => setNotificationMenuOpen(false)}
                    onNotificationClick={handleNotificationClick}
                    onRefresh={refresh}
                  />
                </NotificationErrorBoundary>
              </div>
            )}
          </div>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="relative">
              <button
                id="gh-user-menu-btn"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-1.5 rounded-xl border border-brand-100 bg-white py-1 pl-1 pr-2.5 transition-all hover:bg-brand-50 hover:shadow-sm active:scale-95"
                aria-label={HEADER_STRINGS.LABEL_AVATAR}
                aria-expanded={userMenuOpen}
              >
                <div className="flex size-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="hidden max-w-[80px] truncate text-xs font-bold text-brand-700 md:block">
                  {user?.user_metadata?.name || '我的'}
                </span>
                <ChevronDown
                  size={14}
                  className={`text-brand-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div
                  id="gh-user-menu-dropdown"
                  className="animate-in fade-in zoom-in-95 absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-brand-100 bg-white p-1 shadow-xl ring-1 ring-black/5 duration-100 focus:outline-none"
                  role="menu"
                >
                  <div className="mb-1 border-b border-gray-50 px-3 py-2">
                    <p className="text-brand-900 truncate text-xs font-bold">{user?.email}</p>
                    <p className="text-[10px] text-gray-500">{getRoleLabel(role)}</p>
                  </div>

                  <button
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                    role="menuitem"
                    onClick={() => {
                      // E5/F4 Fix: Robust Navigation
                      const targetPath = ROUTES.FEED_CONSUMER;
                      const targetHash = 'profile';

                      if (
                        location.pathname === targetPath ||
                        location.pathname.includes('/feed/consumer')
                      ) {
                        // Already on page: force hash update and scroll
                        window.location.hash = targetHash;
                        // Dispatch event for listeners just in case
                        window.dispatchEvent(new HashChangeEvent('hashchange'));
                        // Fallback manual scroll if listener misses it
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      } else {
                        // Navigate to page with hash
                        window.location.href = `${targetPath}#${targetHash}`;
                      }
                      setUserMenuOpen(false);
                    }}
                  >
                    <User size={16} />
                    {HEADER_STRINGS.MENU_PROFILE}
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                    role="menuitem"
                  >
                    <LogOut size={16} />
                    {HEADER_STRINGS.BTN_LOGOUT}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a
              href="/maihouses/auth.html?mode=login"
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
