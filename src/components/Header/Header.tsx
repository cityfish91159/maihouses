import React, { useState, useCallback, useEffect } from 'react';
import { Search, LogIn, LogOut, UserPlus, List, Menu, X, ChevronDown, User } from 'lucide-react';
import clsx from 'clsx';
import { Logo } from '../Logo/Logo';
import { DemoGate } from '../DemoGate/DemoGate';
import { ROUTES, RouteUtils } from '../../constants/routes';
import { SEED_COMMUNITY_ID } from '../../constants/seed';
import { getCurrentPath, getLoginUrl, getSignupUrl } from '../../lib/authUtils';
import { notify } from '../../lib/notify';
import { MaiMaiBase } from '../MaiMai';
import { useMaiMai } from '../../context/MaiMaiContext';
import { TUTORIAL_CONFIG } from '../../constants/tutorial';
import { usePageMode } from '../../hooks/usePageMode';
import { useDemoExit } from '../../hooks/useDemoExit';
import { useAuth } from '../../hooks/useAuth';
import { HEADER_STRINGS } from '../../constants/header';
import { getErrorMessage } from '../../lib/error';
import { logger } from '../../lib/logger';
import type { Role } from '../../types/community';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [clickCount, setClickCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const mode = usePageMode();
  const { requestDemoExit } = useDemoExit();
  const { setMood, addMessage } = useMaiMai();
  const { isAuthenticated, user, role, signOut, loading } = useAuth();
  const authReturnPath = getCurrentPath();
  const loginUrl = getLoginUrl(authReturnPath);
  const signupUrl = getSignupUrl(authReturnPath);

  const handleAuthEntryClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (mode !== 'demo') return;

      event.preventDefault();
      notify.info('演示模式中暫停登入', '演示期間不開放登入，請先完成體驗。');
    },
    [mode]
  );

  /** 取得角色標籤文字 */
  const getRoleLabel = (role: Role | undefined): string => {
    if (role === 'resident') return HEADER_STRINGS.ROLE_RESIDENT;
    if (role === 'agent') return HEADER_STRINGS.ROLE_AGENT;
    if (role === 'official') return HEADER_STRINGS.ROLE_OFFICIAL;
    if (role === 'guest') return HEADER_STRINGS.ROLE_GUEST;
    return HEADER_STRINGS.ROLE_MEMBER;
  };

  /** 登出處理 */
  const handleSignOut = useCallback(async (): Promise<void> => {
    try {
      await signOut();
      notify.success(HEADER_STRINGS.MSG_LOGOUT_SUCCESS, HEADER_STRINGS.MSG_LOGOUT_DESC);
      setUserMenuOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      logger.error('Header.handleSignOut.failed', {
        error: errorMessage,
        userId: user?.id,
      });
      notify.error(HEADER_STRINGS.MSG_LOGOUT_ERROR, HEADER_STRINGS.MSG_LOGOUT_RETRY);
    }
  }, [signOut, user?.id]);

  /** 執行搜尋:導航到房源列表頁帶上搜尋參數 */
  const handleSearch = useCallback(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) {
      window.location.href = RouteUtils.withQuery(ROUTES.PROPERTY_LIST, {
        q: trimmed,
      });
    } else {
      window.location.href = ROUTES.PROPERTY_LIST;
    }
  }, [searchQuery]);

  /** 鍵盤事件:Enter 觸發搜尋 */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch();
      }
    },
    [handleSearch]
  );

  /** MaiMai 點擊處理：計數並觸發 celebrate */
  const handleMaiMaiClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= TUTORIAL_CONFIG.CELEBRATE_CLICK_COUNT_THRESHOLD) {
      setMood('celebrate');
      addMessage(TUTORIAL_CONFIG.MESSAGES.CELEBRATE);
      window.dispatchEvent(new CustomEvent('mascot:celebrate', { detail: { clicks: newCount } }));
      setClickCount(0); // 重置計數器
    }
  }, [clickCount, setMood, addMessage]);

  /** 搜尋框 focus 處理：觸發搜尋提示 */
  const handleSearchFocus = useCallback(() => {
    setMood('thinking');
    addMessage(TUTORIAL_CONFIG.MESSAGES.SEARCH_HINT);
  }, [setMood, addMessage]);

  /** 使用者選單事件監聽：Escape 鍵與點擊外部關閉（無障礙功能） */
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleEscapeKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent): void => {
      const target = e.target;

      // Type guard: 確保 target 是 HTMLElement
      if (!(target instanceof HTMLElement)) return;

      // 檢查點擊是否在選單內部
      const isInsideMenu =
        target.closest('#home-user-menu-btn') ||
        target.closest('#home-user-menu-btn-mobile') ||
        target.closest('#home-user-menu-dropdown');
      if (!isInsideMenu) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

  return (
    <>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-overlay border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur-sm transition-all">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4">
          {/* Logo Section */}
          <DemoGate>
            <Logo
              showSlogan={true}
              showBadge={true}
              href=""
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            />
          </DemoGate>

          {/* Desktop Nav - 桌面版 */}
          <nav className="hidden items-center gap-1 md:flex md:gap-2" aria-label="主要動作">
            {/* Column 1: List */}
            <a
              href={ROUTES.PROPERTY_LIST}
              className="hover:bg-brand-50/80 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98]"
            >
              <List size={18} strokeWidth={2.5} className="opacity-80" />
              <span>房地產列表</span>
            </a>

            {loading ? null : mode === 'demo' ? (
              <button
                type="button"
                onClick={requestDemoExit}
                className="ml-1 flex items-center gap-2 rounded-xl border border-brand-700 bg-white px-5 py-2.5 text-[15px] font-bold text-brand-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-brand-50 hover:shadow-md active:scale-[0.98]"
              >
                <LogOut size={18} strokeWidth={2.5} />
                <span>退出演示</span>
              </button>
            ) : mode === 'live' && isAuthenticated ? (
              // Live 模式 UI（Glassmorphism + Real Estate Palette）
              <div className="relative">
                <button
                  id="home-user-menu-btn"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/80 py-1.5 pl-1.5 pr-3 shadow-sm shadow-teal-100/50 backdrop-blur-md transition-all duration-200 hover:bg-white/90 hover:shadow-md hover:shadow-teal-100/60 active:scale-95"
                  aria-label={HEADER_STRINGS.LABEL_AVATAR}
                  aria-expanded={userMenuOpen}
                >
                  {/* 頭像圓形（Real Estate Teal） */}
                  <div className="flex size-9 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100/50">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  {/* 使用者名稱（桌面版才顯示，Teal 色系） */}
                  <span className="hidden max-w-[90px] truncate text-sm font-semibold text-teal-800 md:block">
                    {user?.user_metadata?.name || user?.email || '我的'}
                  </span>

                  {/* Chevron 圖標（Teal 色系） */}
                  <ChevronDown
                    size={16}
                    className={clsx(
                      'text-teal-600 transition-transform duration-200',
                      userMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* 下拉選單（Glassmorphism 毛玻璃效果） */}
                {userMenuOpen && (
                  <div
                    id="home-user-menu-dropdown"
                    className="animate-in fade-in zoom-in-95 absolute right-0 top-full mt-3 w-52 origin-top-right rounded-2xl border border-white/20 bg-white/95 p-2 shadow-xl shadow-teal-100/50 ring-1 ring-teal-100/20 backdrop-blur-lg duration-200"
                    role="menu"
                  >
                    {/* Email 和角色標籤 */}
                    <div className="mb-2 border-b border-teal-50 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-teal-900">{user?.email}</p>
                      <p className="mt-0.5 text-xs text-teal-600">{getRoleLabel(role)}</p>
                    </div>

                    {/* 個人檔案按鈕 */}
                    <button
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-teal-800 transition-all duration-150 hover:bg-teal-50/80 hover:text-teal-900"
                      role="menuitem"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setUserMenuOpen(false);
                      }}
                    >
                      <User size={18} className="text-teal-600" />
                      {HEADER_STRINGS.MENU_PROFILE}
                    </button>

                    {/* 登出按鈕 */}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 transition-all duration-150 hover:bg-red-50/80 hover:text-red-800"
                      role="menuitem"
                    >
                      <LogOut size={18} className="text-red-600" />
                      {HEADER_STRINGS.BTN_LOGOUT}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Column 2: Login */}
                <a
                  href={loginUrl}
                  onClick={handleAuthEntryClick}
                  className="hover:bg-brand-50/80 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98]"
                >
                  <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
                  <span>登入</span>
                </a>

                {/* Column 3: Register (CTA) */}
                <a
                  href={signupUrl}
                  onClick={handleAuthEntryClick}
                  className="shadow-brand-700/10 hover:shadow-brand-700/20 ml-1 flex items-center gap-2 rounded-xl border border-transparent bg-brand-700 px-5 py-2.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:scale-[0.98]"
                >
                  <UserPlus size={18} strokeWidth={2.5} />
                  <span>免費註冊</span>
                </a>
              </>
            )}
          </nav>

          {/* Mobile Nav - 手機版 */}
          <div className="flex items-center gap-2 md:hidden">
            {loading ? null : mode === 'demo' ? (
              <button
                type="button"
                onClick={requestDemoExit}
                className="flex items-center gap-1.5 rounded-lg border border-brand-700 bg-white px-3 py-2 text-sm font-bold text-brand-700 shadow-sm transition-all hover:bg-brand-50 active:scale-95"
              >
                <LogOut size={16} strokeWidth={2.5} />
                <span>退出</span>
              </button>
            ) : mode === 'live' && isAuthenticated ? (
              // Live 模式簡化 UI（Glassmorphism + 44x44px 觸控友善）
              <div className="relative">
                <button
                  id="home-user-menu-btn-mobile"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/80 shadow-sm shadow-teal-100/50 backdrop-blur-md transition-all duration-200 hover:bg-white/90 hover:shadow-md active:scale-95"
                  aria-label={HEADER_STRINGS.LABEL_AVATAR}
                  aria-expanded={userMenuOpen}
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700 ring-1 ring-teal-100/50">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                </button>

                {/* 下拉選單（Glassmorphism 毛玻璃效果，與桌面版一致） */}
                {userMenuOpen && (
                  <div
                    id="home-user-menu-dropdown"
                    className="animate-in fade-in zoom-in-95 absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-white/20 bg-white/95 p-2 shadow-xl shadow-teal-100/50 ring-1 ring-teal-100/20 backdrop-blur-lg duration-200"
                    role="menu"
                  >
                    {/* Email 和角色標籤 */}
                    <div className="mb-2 border-b border-teal-50 px-3 py-2">
                      <p className="truncate text-xs font-semibold text-teal-900">{user?.email}</p>
                      <p className="mt-0.5 text-[10px] text-teal-600">{getRoleLabel(role)}</p>
                    </div>

                    {/* 個人檔案按鈕 */}
                    <button
                      className="flex w-full items-center gap-2.5 rounded-xl p-3 text-sm font-semibold text-teal-800 transition-all duration-150 hover:bg-teal-50/80 hover:text-teal-900"
                      role="menuitem"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setUserMenuOpen(false);
                      }}
                    >
                      <User size={16} className="text-teal-600" />
                      {HEADER_STRINGS.MENU_PROFILE}
                    </button>

                    {/* 登出按鈕 */}
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 rounded-xl p-3 text-sm font-semibold text-red-700 transition-all duration-150 hover:bg-red-50/80 hover:text-red-800"
                      role="menuitem"
                    >
                      <LogOut size={16} className="text-red-600" />
                      {HEADER_STRINGS.BTN_LOGOUT}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* 登入按鈕 - 手機版精簡 */}
                <a
                  href={loginUrl}
                  onClick={handleAuthEntryClick}
                  className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50 active:scale-95"
                >
                  <LogIn size={18} strokeWidth={2.5} />
                </a>

                {/* 註冊按鈕 - 手機版精簡 */}
                <a
                  href={signupUrl}
                  onClick={handleAuthEntryClick}
                  className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-95"
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                  <span>註冊</span>
                </a>
              </>
            )}

            {/* 漢堡選單按鈕 */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex items-center justify-center rounded-lg p-2 text-brand-700 transition-all hover:bg-brand-50 active:scale-95"
              aria-label="開啟選單"
            >
              {mobileMenuOpen ? (
                <X size={22} strokeWidth={2.5} />
              ) : (
                <Menu size={22} strokeWidth={2.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu - 手機版下拉選單 */}
        {mobileMenuOpen && (
          <div className="absolute inset-x-0 top-full border-b border-brand-100 bg-white shadow-lg md:hidden">
            <nav className="mx-auto max-w-[1120px] px-4 py-3">
              <a
                href={ROUTES.PROPERTY_LIST}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <List size={20} strokeWidth={2.5} className="opacity-80" />
                <span>房地產列表</span>
              </a>
              <a
                href={ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="size-5 opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span>社區評價</span>
              </a>
              <a
                href={ROUTES.UAG}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                <svg
                  className="size-5 opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>房仲專區</span>
              </a>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="border-brand-100/50 relative border-b bg-brand-50">
        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-[1120px] px-4 pb-6 pt-24">
          {/* Search Bar Area Wrapper */}
          <div className="relative mx-auto max-w-3xl">
            {/* Mascot & Bubble Group */}
            <div className="absolute right-[5%] top-[-60px] z-0 animate-float select-none md:right-[10%] md:animate-float-desktop">
              {/* Speech Bubble */}
              <div className="md:bottom-4/5 pointer-events-none absolute bottom-3/4 right-[55%] w-[260px] origin-bottom-right animate-fadeIn whitespace-normal rounded-2xl rounded-br-none border-2 border-brand-100 bg-white px-5 py-2 shadow-lg md:right-[65%] md:w-auto md:max-w-none md:whitespace-nowrap md:py-3">
                <p className="text-left text-[11px] font-bold leading-relaxed text-ink-700 md:text-sm">
                  買房這麼大的事，先到 <span className="font-black text-brand-700">邁鄰居</span>
                  ，為未來的家查口碑、找評價，最放心！
                </p>
                {/* Bubble Tail */}
                <div className="absolute -bottom-2.5 right-3 size-5 rotate-45 border-b-2 border-r-2 border-brand-100 bg-white"></div>
              </div>

              {/* Mascot - MaiMaiBase Component (可點擊) */}
              <button
                type="button"
                onClick={handleMaiMaiClick}
                className="pointer-events-auto relative z-10 size-20 cursor-pointer transition-transform hover:scale-105 active:scale-95 md:size-24"
                aria-label="點擊邁邁查看提示"
              >
                <MaiMaiBase
                  mood="header"
                  className="size-full [--maimai-body-fill:#F6F9FF]"
                  animated={false}
                  showEffects={false}
                />
              </button>
            </div>

            {/* Search Box */}
            <div className="group relative z-20">
              <div className="flex h-[60px] items-center rounded-full border border-brand-100 bg-white pl-[28px] pr-2 shadow-brand-lg transition-all duration-300 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 group-hover:shadow-brand-xl">
                {/* Search Icon */}
                <div className="pr-4 text-gray-400 transition-colors group-focus-within:text-gray-600">
                  <Search size={22} strokeWidth={2.5} />
                </div>

                {/* Input */}
                <input
                  id="homepage-search"
                  name="search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={handleSearchFocus}
                  placeholder="找評價最高的社區、捷運站周邊好屋..."
                  className="size-full bg-transparent text-lg font-bold text-gray-700 outline-none placeholder:font-medium placeholder:text-gray-400"
                />

                {/* Button */}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="flex h-[46px] items-center justify-center whitespace-nowrap rounded-full bg-brand-700 px-8 text-base font-bold tracking-wide text-white shadow-md transition-colors hover:bg-brand-600 hover:shadow-lg active:translate-y-px"
                >
                  搜尋
                </button>
              </div>
            </div>

            {/* Capsules */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
              {['社區評價', '房仲專區', '邁鄰居'].map((text) => {
                const getHref = (label: string) => {
                  if (label === '社區評價') return ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID);
                  if (label === '房仲專區') return ROUTES.UAG;
                  return '#';
                };
                const href = getHref(text);
                const target = text === '房仲專區' ? '_blank' : undefined;

                return (
                  <a
                    key={text}
                    href={href}
                    target={target}
                    rel={target ? 'noopener noreferrer' : undefined}
                    className="flex items-center justify-center rounded-2xl border border-brand-700 bg-brand-700 py-3 text-lg font-bold tracking-wide text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-md active:scale-[0.98]"
                  >
                    {text}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
