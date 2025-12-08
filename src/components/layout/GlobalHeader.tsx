/**
 * GlobalHeader Component
 * 
 * 三分頁共用頂部導航列 (P3)
 * 適用範圍：社區牆 (Community Wall)、消費者信息流 (Consumer Feed)、房仲信息流 (Agent Feed)
 * 注意：首頁 (Home) 使用獨立的 Header 組件，不在此組件管理範圍內。
 */

import { useState, useEffect, useMemo } from 'react';
import { Bell, User, LogOut, ChevronDown, ArrowLeft } from 'lucide-react';
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
  ROLE_AGENT: '認證房仲',
  ROLE_RESIDENT: '住戶',
  ROLE_MEMBER: '一般會員',
  ROLE_GUEST: '訪客',
};

export function GlobalHeader({ mode, title, className = '' }: GlobalHeaderProps) {
  const { isAuthenticated, user, role, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // 根據角色決定首頁連結 (Smart Home Link)
  const homeLink = useMemo(() => {
    if (role === 'agent') return '/maihouses/feed-agent.html';
    if (role === 'resident' || role === 'member') return '/maihouses/feed-consumer.html';
    return '/maihouses/';
  }, [role]);

  // 根據角色決定個人檔案連結 (Smart Profile Link)
  const profileLink = useMemo(() => {
    // 目前先導向對應的 Feed 頁面，未來可改為專屬 Profile 頁面
    if (role === 'agent') return '/maihouses/feed-agent.html';
    return '/maihouses/feed-consumer.html';
  }, [role]);

  // 取得角色顯示名稱
  const roleLabel = useMemo(() => {
    switch (role) {
      case 'agent': return STRINGS.ROLE_AGENT;
      case 'resident': return STRINGS.ROLE_RESIDENT;
      case 'member': return STRINGS.ROLE_MEMBER;
      default: return STRINGS.ROLE_GUEST;
    }
  }, [role]);

  // 處理登出
  const handleSignOut = async () => {
    try {
      await signOut();
      notify.success('已登出', '期待下次見面！');
      setUserMenuOpen(false);
      // 優雅登出：導回首頁
      window.location.href = '/maihouses/';
    } catch (error) {
      console.error('Logout failed:', error);
      notify.error('登出失敗', '請稍後再試');
    }
  };

  // 點擊外部或按 ESC 關閉選單
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#gh-user-menu-btn') && !target.closest('#gh-user-menu-dropdown')) {
        setUserMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 渲染左側區域 (Logo 或 返回按鈕)
  const renderLeft = () => {
    if (mode === 'community') {
      return (
        <a 
          href={homeLink}
          className="flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-sm font-bold text-brand-700 no-underline transition-colors hover:bg-brand-50"
          aria-label={STRINGS.BACK_HOME}
        >
          <ArrowLeft size={18} strokeWidth={2.5} />
          <span>{STRINGS.BACK_HOME}</span>
        </a>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Logo showSlogan={false} href={homeLink} />
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
          <h1 className="m-0 text-base font-extrabold text-brand-900">{title}</h1>
          <p className="m-0 text-[11px] text-ink-500">{STRINGS.SUBTITLE_WALL}</p>
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
        {/* Notifications (Real Data or Hidden if 0) */}
        <button 
          className="relative inline-flex items-center justify-center rounded-xl border border-brand-100 bg-white p-2 text-brand-700 transition-all hover:bg-brand-50"
          aria-label={STRINGS.LABEL_NOTIFICATIONS}
        >
          <Bell size={18} strokeWidth={2.5} />
        </button>

        {/* User Menu */}
        {isAuthenticated ? (
          <div className="relative">
            <button
              id="gh-user-menu-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 rounded-xl border border-brand-100 bg-white pl-1 pr-2.5 py-1 transition-all hover:bg-brand-50 hover:shadow-sm active:scale-95"
              aria-label={STRINGS.LABEL_AVATAR}
              aria-expanded={userMenuOpen}
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
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
                className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-xl border border-brand-100 bg-white p-1 shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-3 py-2 border-b border-gray-50 mb-1">
                  <p className="truncate text-xs font-bold text-brand-900">{user?.email}</p>
                  <p className="text-[10px] text-gray-500">{roleLabel}</p>
                </div>
                
                <a
                  href={profileLink}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors no-underline"
                  role="menuitem"
                >
                  <User size={16} />
                  {STRINGS.MENU_PROFILE}
                </a>
                
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
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
