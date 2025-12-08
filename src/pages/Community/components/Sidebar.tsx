/**
 * Sidebar Component
 * 
 * 側邊欄（社區資訊、數據、快速連結、問答、熱門貼文、公仔）
 */

import { useMemo } from 'react';
import {
  SIDEBAR_HOT_POSTS_COUNT,
  SIDEBAR_QUESTIONS_COUNT,
  type CommunityInfo,
  type Post,
  type Question,
} from '../types';

/** 格式化可能為 null 的數值 */
function formatValue(value: number | null | undefined, suffix = ''): string {
  if (value === null || value === undefined) return '-';
  return `${value}${suffix}`;
}

interface SidebarProps {
  info: CommunityInfo;
  questions: Question[] | { items: Question[] };
  posts: Post[];
}

export function Sidebar({ info, questions: questionsProp, posts }: SidebarProps) {
  // 統一 questions 格式
  const questions = useMemo(
    () => Array.isArray(questionsProp) ? questionsProp : (questionsProp?.items || []),
    [questionsProp]
  );

  // 只在 questions 變化時重新計算
  const displayQuestions = useMemo(
    () => questions.slice(0, SIDEBAR_QUESTIONS_COUNT),
    [questions]
  );

  // 只在 posts 變化時重新排序，避免每次 render 都 sort
  const hotPosts = useMemo(
    () => [...posts]
      .sort((a, b) => {
        const scoreA = (a.likes || 0) + (a.views || 0) * 0.1;
        const scoreB = (b.likes || 0) + (b.views || 0) * 0.1;
        return scoreB - scoreA;
      })
      .slice(0, SIDEBAR_HOT_POSTS_COUNT),
    [posts]
  );

  return (
    <aside className="hidden w-[280px] shrink-0 flex-col gap-3 self-start lg:sticky lg:top-[70px] lg:flex">
      {/* 社區數據 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">📊 社區數據</h4>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {[
            [formatValue(info.members), '已加入成員'],
            [formatValue(info.avgRating), '平均評分'],
            [formatValue(info.monthlyInteractions), '本月互動'],
            [formatValue(info.forSale), '待售物件'],
          ].map(([num, lbl]) => (
            <div key={lbl as string} className="rounded-[10px] bg-gradient-to-br from-[#f8faff] to-[#f0f5ff] p-3 text-center">
              <div className="text-xl font-black text-[var(--brand)]">{num}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快速連結 */}
      <nav className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]" aria-label="快速連結">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">🔗 快速連結</h4>
        <div className="flex flex-col gap-1">
          {['🏠 查看此社區物件', '📊 與其他社區比較', '🔔 追蹤此社區'].map(link => (
            <a key={link} href="#" className="flex items-center gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              {link}
            </a>
          ))}
        </div>
      </nav>

      {/* 最新問答 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">❓ 最新問答</h4>
        <div className="flex flex-col gap-1">
          {displayQuestions.map(q => (
            <a key={q.id} href="#qa-section" className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              <span className="shrink-0" aria-hidden="true">💬</span>
              <span className="truncate">{q.question.length > 18 ? q.question.substring(0, 18) + '...' : q.question}</span>
            </a>
          ))}
        </div>
        <a href="#qa-section" className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline">查看全部問答 →</a>
      </div>

      {/* 熱門貼文 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-white p-3.5 shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">🔥 熱門貼文</h4>
        <div className="flex flex-col gap-1">
          {hotPosts.map(p => (
            <a key={p.id} href="#public-wall" className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[#f0f7ff]">
              <span className="shrink-0" aria-hidden="true">❤️ {p.likes}</span>
              <span className="truncate">{p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}</span>
            </a>
          ))}
        </div>
        <a href="#public-wall" className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline">查看全部貼文 →</a>
      </div>

      {/* 公仔卡片 */}
      <div className="rounded-[14px] border border-[var(--line)] bg-gradient-to-br from-[#f0f7ff] to-[#e8f4ff] p-3.5 text-center shadow-[0_4px_14px_rgba(0,51,102,0.04)]">
        <svg className="mx-auto mb-2 h-24 w-20 text-[#00385a]" viewBox="0 0 200 240" aria-hidden="true">
          <path d="M 85 40 L 85 15 L 100 30 L 115 15 L 115 40" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 40 80 L 100 40 L 160 80" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="55" y="80" width="90" height="100" stroke="currentColor" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 78 110 Q 85 105 92 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <path d="M 108 110 Q 115 105 122 110" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
          <circle cx="85" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <circle cx="115" cy="125" r="4" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 90 145 Q 100 155 110 145" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round"/>
          <path d="M 55 130 L 25 110" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <path className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]" d="M 145 130 L 175 100" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
          <circle className="origin-[85%_60%] animate-[wave_2.5s_ease-in-out_infinite]" cx="180" cy="95" r="6" stroke="currentColor" strokeWidth="3" fill="none"/>
          <path d="M 85 180 L 85 210 L 75 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M 115 180 L 115 210 L 125 210" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="mb-2.5 text-[13px] font-bold text-[var(--brand)]">有問題？問問鄰居！</p>
        <a href="#qa-section" className="inline-block rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-bold text-white no-underline">前往問答區 →</a>
      </div>
    </aside>
  );
}
