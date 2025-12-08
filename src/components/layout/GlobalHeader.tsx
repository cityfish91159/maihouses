/**
 * GlobalHeader Component
 * 
 * 三分頁共用頂部導航列 (P3)
 * 適用範圍：社區牆 (Community Wall)、消費者信息流 (Consumer Feed)、房仲信息流 (Agent Feed)
 * 注意：首頁 (Home) 使用獨立的 Header 組件，不在此組件管理範圍內。
 */

import { useState, useEffect } from 'react';
import { Bell, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from '../Logo/Logo';
import { notify } from '../../lib/notify';

export type GlobalHeaderMode = 'community' | 'consumer' | 'agent';

interface GlobalHeaderProps {
  /** 顯示模式：社區牆 | 消費者端 | 房仲端 */
  mode: GlobalHeaderMode;
  /** 標題 (僅在 community 模式下顯示) */
  title?: string;
  /** 額外樣式 */
  className?: string;
}

// UI 字串常數
const STRINGS = {
  BACK_HOME: '回首頁',
  SUBTITLE_WALL: '社區牆',
  AGENT_BADGE: '專業版',
  BTN_LOGIN: '登入',
  BTN_REGISTER: '免費註冊',
  BTN_LOGOUT: '登出',
  BTN_MY_ACCOUNT: '我的帳號',
  LABEL_NOTIFICATIONS: '通知',
  LABEL_AVATAR: '使用者選單',
  MENU_PROFILE: '個人檔案',
};

export function GlobalHeader({ mode, title, className = '' }: GlobalHeaderProps) {
  const { isAuthenticated, user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 處理登出
  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success('已登出', '期待下次見面！');
      setUserMenuOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
      notify.error('登出失敗', '請稍後再試');
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
    return (
      <div className="flex items-center gap-2">
        <Logo showSlogan={false} href="/maihouses/" showBadge={false} />
        {mode === 'agent' && (
          <span className="rounded bg-gradient-to-br from-amber-400 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
            {STRINGS.AGENT_BADGE}
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
          <p className="text-ink-500 m-0 text-[11px]">{STRINGS.SUBTITLE_WALL}</p>
        </div>
      );
    }
    return <div className="flex-1" />;
  };

  return (
    <header className={`sticky top-0 z-50 flex items-center gap-2.5 border-b border-brand-100 bg-white/95 px-4 py-2 backdrop-blur-md transition-all ${className}`}>
      {/* Left */}
      {renderLeft()}

      {/* Center */}
      {renderCenter()}

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications (Mock) */}
        <button 
          className="relative inline-flex items-center justify-center rounded-xl border border-brand-100 bg-white p-2 text-brand-700 transition-all hover:bg-brand-50"
          aria-label={STRINGS.LABEL_NOTIFICATIONS}
        >
          <Bell size={18} strokeWidth={2.5} />
          <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full border-2 border-white bg-red-600 text-[10px] font-bold text-white shadow-sm">2</span>
        </button>

        {/* User Menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              id="gh-user-menu-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-brand-100 bg-white py-1 pl-1 pr-2.5 transition-all hover:bg-brand-50 hover:shadow-sm active:scale-95"
              aria-label={STRINGS.LABEL_AVATAR}
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
                  <p className="text-[10px] text-gray-500">一般會員</p>
                </div>
                
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700"
                  role="menuitem"
                  onClick={() => {/* TODO: Profile Link */}}
                >
                  <User size={16} />
                  {STRINGS.MENU_PROFILE}
                </button>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 transition-colors hover:bg-red-50"
                  role="menuitem"
                >
                  <LogOut size={16} />
                  {STRINGS.BTN_LOGOUT}
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
            <span>{STRINGS.BTN_LOGIN}</span>
          </a>
        )}
      </div>
    </header>
  );
}
