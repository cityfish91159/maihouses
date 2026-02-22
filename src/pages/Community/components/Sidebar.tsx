/**
 * Sidebar Component
 *
 * 側邊欄（社區資訊、數據、快速連結、問答、熱門貼文、公仔）
 */

import { useMemo } from 'react';
import {
  BarChart3,
  Link2,
  Home,
  Bell,
  HelpCircle,
  MessageCircle,
  Flame,
  Heart,
} from 'lucide-react';
import {
  SIDEBAR_HOT_POSTS_COUNT,
  SIDEBAR_QUESTIONS_COUNT,
  type CommunityInfo,
  type Post,
  type Question,
} from '../types';
import { SidebarMascot } from './SidebarMascot';

const CARD_SHADOW = 'shadow-[0_4px_14px_var(--mh-shadow-card)]';

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
    () => (Array.isArray(questionsProp) ? questionsProp : questionsProp?.items || []),
    [questionsProp]
  );

  // 只在 questions 變化時重新計算
  const displayQuestions = useMemo(() => questions.slice(0, SIDEBAR_QUESTIONS_COUNT), [questions]);

  // 只在 posts 變化時重新排序，避免每次 render 都 sort
  const hotPosts = useMemo(
    () =>
      [...posts]
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
      <div className={`rounded-[14px] border border-[var(--line)] bg-white p-3.5 ${CARD_SHADOW}`}>
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">
          <BarChart3 size={14} aria-hidden="true" />
          社區數據
        </h4>
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          {[
            { num: formatValue(info.members), lbl: '已加入成員' },
            { num: formatValue(info.avgRating), lbl: '平均評分' },
            { num: formatValue(info.monthlyInteractions), lbl: '本月互動' },
            { num: formatValue(info.forSale), lbl: '待售物件' },
          ].map(({ num, lbl }) => (
            <div
              key={lbl}
              className="rounded-[10px] bg-gradient-to-br from-[var(--mh-color-f8faff)] to-[var(--mh-color-f0f5ff)] p-3 text-center"
            >
              <div className="text-xl font-black text-[var(--brand)]">{num}</div>
              <div className="mt-0.5 text-[11px] text-[var(--text-secondary)]">{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快速連結 */}
      <nav
        className={`rounded-[14px] border border-[var(--line)] bg-white p-3.5 ${CARD_SHADOW}`}
        aria-label="快速連結"
      >
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">
          <Link2 size={14} aria-hidden="true" />
          快速連結
        </h4>
        <div className="flex flex-col gap-1">
          {[
            { icon: <Home size={14} aria-hidden="true" />, label: '查看此社區物件' },
            { icon: <BarChart3 size={14} aria-hidden="true" />, label: '與其他社區比較' },
            { icon: <Bell size={14} aria-hidden="true" />, label: '追蹤此社區' },
          ].map((link) => (
            <button
              key={link.label}
              type="button"
              className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2.5 text-left text-[13px] font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--mh-color-f0f7ff)]"
            >
              {link.icon}
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      {/* 最新問答 */}
      <div className={`rounded-[14px] border border-[var(--line)] bg-white p-3.5 ${CARD_SHADOW}`}>
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">
          <HelpCircle size={14} aria-hidden="true" />
          最新問答
        </h4>
        <div className="flex flex-col gap-1">
          {displayQuestions.map((q) => (
            <a
              key={q.id}
              href="#qa-section"
              className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[var(--mh-color-f0f7ff)]"
            >
              <MessageCircle size={12} className="shrink-0" aria-hidden="true" />
              <span className="truncate">
                {q.question.length > 18 ? q.question.substring(0, 18) + '...' : q.question}
              </span>
            </a>
          ))}
        </div>
        <a
          href="#qa-section"
          className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline"
        >
          查看全部問答 →
        </a>
      </div>

      {/* 熱門貼文 */}
      <div className={`rounded-[14px] border border-[var(--line)] bg-white p-3.5 ${CARD_SHADOW}`}>
        <h4 className="mb-2.5 flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand)]">
          <Flame size={14} aria-hidden="true" />
          熱門貼文
        </h4>
        <div className="flex flex-col gap-1">
          {hotPosts.map((p) => (
            <a
              key={p.id}
              href="#public-wall"
              className="flex items-start gap-2 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)] no-underline transition-all hover:bg-[var(--mh-color-f0f7ff)]"
            >
              <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
                <Heart size={12} />
                {p.likes}
              </span>
              <span className="truncate">
                {p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title}
              </span>
            </a>
          ))}
        </div>
        <a
          href="#public-wall"
          className="mt-2 block text-center text-xs text-[var(--brand-light)] no-underline"
        >
          查看全部貼文 →
        </a>
      </div>

      {/* 公仔卡片 */}
      <SidebarMascot />
    </aside>
  );
}
