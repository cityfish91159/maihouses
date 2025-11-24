import React from 'react';
import { Search, LogIn, UserPlus, List } from 'lucide-react';
import { Logo } from '../Logo/Logo';

export default function Header({ onOpenAIStudio }: { onOpenAIStudio?: () => void }) {
  return (
    <>
      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-brand-100 shadow-sm transition-all">
        <div className="max-w-[1120px] mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <Logo showSlogan={true} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          {/* Nav Actions - Redesigned 3 Columns */}

          {/* Nav Actions - Redesigned 3 Columns */}
          <nav className="flex items-center gap-1 md:gap-2" aria-label="主要動作">
            {/* Column 1: List */}
            <a href="/maihouses/property.html" className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-brand-700 font-bold text-[15px] hover:bg-brand-50/80 hover:text-brand-600 transition-all active:scale-[0.98]">
              <List size={18} strokeWidth={2.5} className="opacity-80" />
              <span>房地產列表</span>
            </a>

            {/* Column 2: Login */}
            <a href="/maihouses/auth.html?mode=login" className="hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl text-brand-700 font-bold text-[15px] hover:bg-brand-50/80 hover:text-brand-600 transition-all active:scale-[0.98]">
              <LogIn size={18} strokeWidth={2.5} className="opacity-80" />
              <span>登入</span>
            </a>

            {/* Column 3: Register (CTA) */}
            <a href="/maihouses/auth.html?mode=signup" className="ml-1 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 text-white font-bold text-[15px] shadow-md shadow-brand-700/10 border border-transparent hover:bg-brand-600 hover:shadow-lg hover:shadow-brand-700/20 hover:-translate-y-0.5 transition-all active:scale-[0.98]">
              <UserPlus size={18} strokeWidth={2.5} />
              <span>免費註冊</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-brand-50 border-b border-brand-100/50">

        {/* Content Container */}
        <div className="max-w-[1120px] mx-auto relative z-10 pt-24 pb-6 px-4">

          {/* Search Bar Area Wrapper */}
          <div className="max-w-3xl mx-auto relative">

            {/* Mascot & Bubble Group */}
            <div className="absolute -top-[44px] right-[5%] md:right-[10%] z-0 pointer-events-none select-none animate-float md:animate-float-desktop">

              {/* Speech Bubble */}
              <div className="absolute bottom-[92%] right-[55%] w-[260px] whitespace-normal md:w-auto md:max-w-none md:whitespace-nowrap md:bottom-[94%] md:right-[65%] bg-white border-2 border-brand-100 px-5 py-2 md:py-3 rounded-2xl rounded-br-none shadow-lg animate-fadeIn origin-bottom-right">
                <p className="text-[11px] md:text-sm font-bold text-ink-700 leading-relaxed text-left">
                  買房這麼大的事，先到 <span className="text-brand-700 font-black">邁鄰居</span>，為未來的家查口碑、找評價，最放心！
                </p>
                {/* Bubble Tail */}
                <div className="absolute -bottom-2.5 right-3 w-5 h-5 bg-white border-r-2 border-b-2 border-brand-100 transform rotate-45"></div>
              </div>

              {/* Mascot SVG */}
              <div className="w-20 h-20 md:w-24 md:h-24 relative z-10">
                <svg viewBox="0 0 200 240" className="w-full h-full drop-shadow-sm">
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
          </div>
        </div>

        {/* Search Box */}
        <div className="relative group z-20">
          <div className="flex items-center h-[60px] pl-[28px] pr-2 rounded-full transition-all duration-300 bg-white border border-brand-100 shadow-[0_8px_30px_rgba(0,56,90,0.08)] group-hover:shadow-[0_12px_40px_rgba(0,56,90,0.12)] focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50">

            {/* Search Icon */}
            <div className="pr-4 text-gray-400 group-focus-within:text-gray-600 transition-colors">
              <Search size={22} strokeWidth={2.5} />
            </div>

            {/* Input */}
            <input
              type="text"
              placeholder="找評價最高的社區、捷運站周邊好屋..."
              className="w-full h-full bg-transparent text-gray-700 font-bold text-lg placeholder:text-gray-400 placeholder:font-medium outline-none"
            />

            {/* Button */}
            <button className="h-[46px] px-8 bg-brand-700 text-white rounded-full font-bold text-base hover:bg-brand-600 transition-colors flex items-center justify-center tracking-wide shadow-md hover:shadow-lg active:translate-y-px whitespace-nowrap">
              搜尋
            </button>
          </div>
        </div>

        {/* Capsules */}
        <div className="grid grid-cols-3 gap-2 mt-6 relative z-10">
          {['社區評價', '房仲專區', '邁鄰居'].map((text) => {
            const href = text === '社區評價' ? '/maihouses/community-wall_mvp.html' :
              text === '房仲專區' ? 'https://maihouses.vercel.app/maihouses/uag' : '#';
            const target = text === '房仲專區' ? '_blank' : undefined;

            return (
              <a
                key={text}
                href={href}
                target={target}
                rel={target ? "noopener noreferrer" : undefined}
                className="flex items-center justify-center py-3 rounded-2xl bg-brand-700 border border-brand-700 text-white font-bold text-lg tracking-wide shadow-sm transition-all duration-200 hover:bg-brand-600 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
              >
                {text}
              </a>
            );
          })}
        </div>
      </div>

    </div >
    </div >
    </>
  );
}
