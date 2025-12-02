/**
 * ReviewsSection Component
 * 
 * 社區評價區塊
 */

import { useMemo } from 'react';
import type { Role, Review, Permissions } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';

interface ReviewCardProps {
  item: { 
    text: string; 
    author: string; 
    company: string; 
    visits: number; 
    deals: number;
  };
  type: 'pro' | 'con';
}

function ReviewCard({ item, type }: ReviewCardProps) {
  const icon = type === 'pro' ? '✅' : '⚖️';
  const bgClass = type === 'pro' ? 'bg-gradient-to-br from-[#f6f9ff] to-[#eef3ff]' : 'bg-gradient-to-br from-[#f0f5ff] to-[#e6edf7]';
  
  return (
    <div className="rounded-[14px] border border-[var(--border-light)] bg-white p-3.5 transition-all hover:border-[rgba(0,56,90,0.15)] hover:shadow-[0_2px_8px_rgba(0,56,90,0.04)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-[var(--primary)] bg-gradient-to-br from-[#eef3ff] to-white text-sm font-extrabold text-[var(--primary)]" aria-hidden="true">
          {item.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold">{item.author}｜{item.company}</div>
          <div className="text-[11px] text-[var(--text-secondary)]">帶看 {item.visits} 次 · 成交 {item.deals} 戶</div>
        </div>
      </div>
      <div className={`flex items-start gap-2.5 rounded-[10px] p-2 text-[13px] leading-relaxed ${bgClass}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base" aria-hidden="true">{icon}</span>
        <span className="flex-1 text-[var(--text-primary)]">{item.text}</span>
      </div>
    </div>
  );
}

interface ReviewsSectionProps {
  role: Role;
  reviews: Review[];
}

export function ReviewsSection({ role, reviews }: ReviewsSectionProps) {
  const perm = getPermissions(role);

  // 拆成單項
  const allItems = useMemo(() => {
    const items: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number }[] = [];
    reviews.forEach(review => {
      review.pros.forEach(pro => {
        items.push({ type: 'pro', text: pro, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
      });
      items.push({ type: 'con', text: review.cons, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
    });
    return items;
  }, [reviews]);

  const totalCount = allItems.length;
  const visibleCount = perm.canSeeAllReviews ? totalCount : GUEST_VISIBLE_COUNT;
  const hiddenCount = totalCount - visibleCount;

  return (
    <section className="overflow-hidden rounded-[18px] border border-[var(--border-light)] bg-[rgba(255,255,255,0.98)] shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between border-b border-[rgba(0,56,90,0.05)] bg-gradient-to-br from-[rgba(0,56,90,0.08)] to-[rgba(0,82,130,0.04)] px-4 py-3.5">
        <div>
          <h2 id="reviews-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-[var(--primary-dark)]">⭐ 社區評價</h2>
          <p className="mt-0.5 text-[11px] text-[var(--text-secondary)]">來自最真實的評價</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-[var(--primary-light)] bg-[rgba(0,56,90,0.08)] px-2.5 py-1 text-[10px] font-bold text-[var(--primary)]">
          {totalCount} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {allItems.slice(0, visibleCount).map((item, idx) => (
          <ReviewCard key={idx} item={item} type={item.type} />
        ))}
        
        {hiddenCount > 0 && allItems[visibleCount] && (
          <div className="relative">
            <div className="pointer-events-none select-none blur-[4px]" aria-hidden="true">
              <ReviewCard item={allItems[visibleCount]} type={allItems[visibleCount].type} />
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-[rgba(255,255,255,0.85)] p-5 text-center">
              <h4 className="mb-1 text-sm font-extrabold text-[var(--primary-dark)]">🔒 還有 {hiddenCount} 則評價</h4>
              <p className="mb-2.5 text-xs text-[var(--text-secondary)]">✓ 查看全部評價　✓ 新回答通知</p>
              <button className="rounded-full bg-gradient-to-br from-[var(--primary)] to-[#005282] px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]">
                免費註冊 / 登入
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
