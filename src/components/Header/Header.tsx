import React, { useState, useCallback } from "react";
import { Search, LogIn, UserPlus, List, Menu, X } from "lucide-react";
import { Logo } from "../Logo/Logo";
import { ROUTES, RouteUtils } from "../../constants/routes";
import { MaiMaiBase } from "../MaiMai";
import { useMaiMai } from "../../context/MaiMaiContext";
import { TUTORIAL_CONFIG } from "../../constants/tutorial";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clickCount, setClickCount] = useState(0);
  const { setMood, addMessage } = useMaiMai();

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
      if (e.key === "Enter") {
        handleSearch();
      }
    },
    [handleSearch],
  );

  /** MaiMai 點擊處理：計數並觸發 celebrate */
  const handleMaiMaiClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= TUTORIAL_CONFIG.CELEBRATE_CLICK_COUNT_THRESHOLD) {
      setMood("celebrate");
      addMessage(TUTORIAL_CONFIG.MESSAGES.CELEBRATE);
      window.dispatchEvent(
        new CustomEvent("mascot:celebrate", { detail: { clicks: newCount } }),
      );
      setClickCount(0); // 重置計數器
    }
  }, [clickCount, setMood, addMessage]);

  /** 搜尋框 focus 處理：觸發搜尋提示 */
  const handleSearchFocus = useCallback(() => {
    setMood("thinking");
    addMessage(TUTORIAL_CONFIG.MESSAGES.SEARCH_HINT);
  }, [setMood, addMessage]);

  return (
    <>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-overlay border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur-sm transition-all">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4">
          {/* Logo Section */}
          <Logo
            showSlogan={true}
            showBadge={true}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />

          {/* Desktop Nav - 桌面版 */}
          <nav
            className="hidden items-center gap-1 md:flex md:gap-2"
            aria-label="主要動作"
          >
            {/* Column 1: List */}
            <a
              href={ROUTES.PROPERTY_LIST}
              className="hover:bg-brand-50/80 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98]"
            >
              <List size={18} strokeWidth={2.5} className="opacity-80" />
              <span>房地產列表</span>
            </a>

            {/* Column 2: Login */}
            <a
              href={`${ROUTES.AUTH}?mode=login`}
              className="hover:bg-brand-50/80 flex items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:text-brand-600 active:scale-[0.98]"
            >
              <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
              <span>登入</span>
            </a>

            {/* Column 3: Register (CTA) */}
            <a
              href={`${ROUTES.AUTH}?mode=signup`}
              className="shadow-brand-700/10 hover:shadow-brand-700/20 ml-1 flex items-center gap-2 rounded-xl border border-transparent bg-brand-700 px-5 py-2.5 text-[15px] font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg active:scale-[0.98]"
            >
              <UserPlus size={18} strokeWidth={2.5} />
              <span>免費註冊</span>
            </a>
          </nav>

          {/* Mobile Nav - 手機版 */}
          <div className="flex items-center gap-2 md:hidden">
            {/* 登入按鈕 - 手機版精簡 */}
            <a
              href={`${ROUTES.AUTH}?mode=login`}
              className="flex items-center justify-center rounded-lg px-3 py-2 text-sm font-bold text-brand-700 transition-all hover:bg-brand-50 active:scale-95"
            >
              <LogIn size={18} strokeWidth={2.5} />
            </a>

            {/* 註冊按鈕 - 手機版精簡 */}
            <a
              href={`${ROUTES.AUTH}?mode=signup`}
              className="flex items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-600 active:scale-95"
            >
              <UserPlus size={16} strokeWidth={2.5} />
              <span>註冊</span>
            </a>

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
                href={ROUTES.COMMUNITY_WALL_MVP}
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
              <div className="pointer-events-none absolute bottom-[75%] right-[55%] w-[260px] origin-bottom-right animate-fadeIn whitespace-normal rounded-2xl rounded-br-none border-2 border-brand-100 bg-white px-5 py-2 shadow-lg md:bottom-[80%] md:right-[65%] md:w-auto md:max-w-none md:whitespace-nowrap md:py-3">
                <p className="text-left text-[11px] font-bold leading-relaxed text-ink-700 md:text-sm">
                  買房這麼大的事，先到{" "}
                  <span className="font-black text-brand-700">邁鄰居</span>
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
                  className="size-full"
                  animated={false}
                  showEffects={false}
                  style={
                    { "--maimai-body-fill": "#F6F9FF" } as React.CSSProperties
                  }
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
              {["社區評價", "房仲專區", "邁鄰居"].map((text) => {
                const getHref = (label: string) => {
                  if (label === "社區評價") return ROUTES.COMMUNITY_WALL_MVP;
                  if (label === "房仲專區") return ROUTES.UAG;
                  return "#";
                };
                const href = getHref(text);
                const target = text === "房仲專區" ? "_blank" : undefined;

                return (
                  <a
                    key={text}
                    href={href}
                    target={target}
                    rel={target ? "noopener noreferrer" : undefined}
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
