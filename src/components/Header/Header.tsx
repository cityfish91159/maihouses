import React from 'react';
import { Search, LogIn, UserPlus, List } from 'lucide-react';
import { Logo } from '../Logo/Logo';

interface HeaderProps {
  readonly onOpenAIStudio?: () => void;
}

export default function Header({ onOpenAIStudio }: HeaderProps) {
  return (
    <>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-brand-100 bg-white/95 shadow-sm backdrop-blur-sm transition-all">
        <div className="mx-auto flex h-16 max-w-[1120px] items-center justify-between px-4">
          {/* Logo Section */}
          <Logo showSlogan={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* Nav Actions - Redesigned 3 Columns */}

          {/* Nav Actions - Redesigned 3 Columns */}
          <nav className="flex items-center gap-1 md:gap-2" aria-label="主要動作">
            {/* Column 1: List */}
            <a href="/maihouses/property.html" className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50/80 hover:text-brand-600 active:scale-[0.98] md:flex">
              <List size={18} strokeWidth={2.5} className="opacity-80" />
              <span>房地產列表</span>
            </a>

            {/* Column 2: Login */}
            <a href="/maihouses/auth.html?mode=login" className="hidden items-center gap-2 rounded-xl px-4 py-2.5 text-[15px] font-bold text-brand-700 transition-all hover:bg-brand-50/80 hover:text-brand-600 active:scale-[0.98] md:flex">
              <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
              <span>登入</span>
            </a>

            {/* Column 3: Register (CTA) */}
            <a href="/maihouses/auth.html?mode=signup" className="ml-1 flex items-center gap-2 rounded-xl border border-transparent bg-brand-700 px-5 py-2.5 text-[15px] font-bold text-white shadow-md shadow-brand-700/10 transition-all hover:-translate-y-0.5 hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-700/20 active:scale-[0.98]">
              <UserPlus size={18} strokeWidth={2.5} />
              <span>免費註冊</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative border-b border-brand-100/50 bg-brand-50">

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-[1120px] px-4 pb-6 pt-24">

          {/* Search Bar Area Wrapper */}
          <div className="relative mx-auto max-w-3xl">

            {/* Mascot & Bubble Group */}
            <div className="pointer-events-none absolute top-[-44px] right-[5%] z-0 animate-float select-none md:right-[10%] md:animate-float-desktop">

              {/* Speech Bubble */}
              <div className="absolute bottom-[92%] right-[55%] w-[260px] origin-bottom-right animate-fadeIn whitespace-normal rounded-2xl rounded-br-none border-2 border-brand-100 bg-white px-5 py-2 shadow-lg md:bottom-[94%] md:right-[65%] md:w-auto md:max-w-none md:whitespace-nowrap md:py-3">
                <p className="text-left text-[11px] font-bold leading-relaxed text-ink-700 md:text-sm">
                  買房這麼大的事，先到 <span className="font-black text-brand-700">邁鄰居</span>，為未來的家查口碑、找評價，最放心！
                </p>
                {/* Bubble Tail */}
                <div className="absolute -bottom-2.5 right-3 size-5 rotate-45 border-b-2 border-r-2 border-brand-100 bg-white"></div>
              </div>

              {/* Mascot SVG */}
              <div className="relative z-10 size-20 md:size-24">
                <svg viewBox="0 0 200 240" className="size-full drop-shadow-sm">
                  {/* M-Antenna */}
                  <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40"
                    stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {/* House Body & Roof */}
                  <path d="M 40 80 L 100 40 L 160 80"
                    stroke="#00385a" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="55" y="80" width="90" height="100"
                    stroke="#00385a" strokeWidth="6" fill="#F6F9FF" strokeLinecap="round" strokeLinejoin="round" />
                  {/* Face */}
                  <path d="M 78 110 Q 85 105 92 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <path d="M 108 110 Q 115 105 122 110" stroke="#00385a" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <circle cx="85" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />
                  <circle cx="115" cy="125" r="4" stroke="#00385a" strokeWidth="3" fill="none" />
                  {/* Hands - Waving */}
                  <path d="M 55 130 L 35 100" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M 145 130 L 165 100" stroke="#00385a" strokeWidth="5" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>

            {/* Search Box */}
            <div className="group relative z-20">
              <div className="flex h-[60px] items-center rounded-full border border-brand-100 bg-white pl-[28px] pr-2 shadow-[0_8px_30px_rgba(0,56,90,0.08)] transition-all duration-300 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 group-hover:shadow-[0_12px_40px_rgba(0,56,90,0.12)]">

                {/* Search Icon */}
                <div className="pr-4 text-gray-400 transition-colors group-focus-within:text-gray-600">
                  <Search size={22} strokeWidth={2.5} />
                </div>

                {/* Input */}
                <input
                  type="text"
                  placeholder="找評價最高的社區、捷運站周邊好屋..."
                  className="size-full bg-transparent text-lg font-bold text-gray-700 outline-none placeholder:font-medium placeholder:text-gray-400"
                />

                {/* Button */}
                <button className="flex h-[46px] items-center justify-center whitespace-nowrap rounded-full bg-brand-700 px-8 text-base font-bold tracking-wide text-white shadow-md transition-colors hover:bg-brand-600 hover:shadow-lg active:translate-y-px">
                  搜尋
                </button>
              </div>
            </div>

            {/* Capsules */}
            <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
              {['社區評價', '房仲專區', '邁鄰居'].map((text) => {
                const getHref = (label: string) => {
                  if (label === '社區評價') return '/maihouses/community-wall_mvp.html';
                  if (label === '房仲專區') return 'https://maihouses.vercel.app/maihouses/uag';
                  return '#';
                };
                const href = getHref(text);
                const target = text === '房仲專區' ? '_blank' : undefined;

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
