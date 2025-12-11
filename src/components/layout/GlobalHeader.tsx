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
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../Logo/Logo';
import { notify } from '../../lib/notify';
import { HEADER_STRINGS, GlobalHeaderMode } from '../../constants/header';
import { ROUTES } from '../../constants/routes';

interface GlobalHeaderProps {
  /** 顯示模式：社區牆 | 消費者端 | 房仲端 */
  mode: GlobalHeaderMode;
  /** 標題 (僅在 community 模式下顯示) */
  title?: string;
  /** 額外樣式 */
  className?: string;
  /** 通知數量 (Optional) */
  notificationCount?: number;
}

// Helper to map role to display string
const getRoleLabel = (role: string | undefined) => {
  switch (role) {
    case 'resident': return HEADER_STRINGS.ROLE_RESIDENT;
    case 'agent': return HEADER_STRINGS.ROLE_AGENT;
    case 'official': return HEADER_STRINGS.ROLE_OFFICIAL;
    case 'guest': return HEADER_STRINGS.ROLE_GUEST;
    default: return HEADER_STRINGS.ROLE_MEMBER;
  }
};

export function GlobalHeader({ mode, title, className = '', notificationCount = 0 }: GlobalHeaderProps) {
  const { isAuthenticated, user, signOut, role } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 處理登出
  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success(HEADER_STRINGS.MSG_LOGOUT_SUCCESS, HEADER_STRINGS.MSG_LOGOUT_DESC);
      setUserMenuOpen(false);
      // P3-AUDIT-FIX: Graceful redirect instead of reload
      window.location.href = ROUTES.HOME;
    } catch (error) {
      console.error('Logout failed:', error);
      notify.error(HEADER_STRINGS.MSG_LOGOUT_ERROR, HEADER_STRINGS.MSG_LOGOUT_RETRY);
    }
  };

  // 點擊外部關閉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#gh-user-menu-btn') && !target.closest('#gh-user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    <header className={`sticky top-0 z-overlay border-b border-brand-100 bg-white/95 backdrop-blur-md transition-all ${className}`}>
      <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-2.5 px-4">
        {/* Left */}
        {renderLeft()}

        {/* Center */}
        {renderCenter()}

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
        {/* Notifications */}
        <button 
          className="relative inline-flex items-center justify-center rounded-xl border border-brand-100 bg-white p-2 text-brand-700 transition-all hover:bg-brand-50"
          aria-label={HEADER_STRINGS.LABEL_NOTIFICATIONS}
        >
          <Bell size={18} strokeWidth={2.5} />
          {notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-600 text-[10px] font-bold text-white shadow-sm">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

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
              <ChevronDown size={14} className={`text-brand-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
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
                    notify.info(HEADER_STRINGS.MSG_FEATURE_DEV, HEADER_STRINGS.MSG_PROFILE_SOON);
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
