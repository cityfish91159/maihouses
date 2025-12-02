/**
 * ReviewsSection Component
 * 
 * 社區評價區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useMemo } from 'react';
import type { Role, Review } from '../types';
import { getPermissions, GUEST_VISIBLE_COUNT } from '../types';
import { LockedOverlay } from './LockedOverlay';

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
  const bgClass = type === 'pro' 
    ? 'bg-gradient-to-br from-brand-50 to-brand-100/50' 
    : 'bg-gradient-to-br from-brand-100/30 to-brand-100';
  
  return (
    <div className="rounded-[14px] border border-border-light bg-white p-3.5 transition-all hover:border-brand/15 hover:shadow-[0_2px_8px_rgba(0,56,90,0.04)]">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div 
          className="flex h-[38px] w-[38px] items-center justify-center rounded-full border-2 border-brand bg-gradient-to-br from-brand-100/50 to-white text-sm font-extrabold text-brand" 
          aria-hidden="true"
        >
          {item.author.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-bold text-ink-900">{item.author}｜{item.company}</div>
          <div className="text-[11px] text-ink-600">帶看 {item.visits} 次 · 成交 {item.deals} 戶</div>
        </div>
      </div>
      <div className={`flex items-start gap-2.5 rounded-[10px] p-2 text-[13px] leading-relaxed ${bgClass}`}>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-base" aria-hidden="true">{icon}</span>
        <span className="flex-1 text-ink-900">{item.text}</span>
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
      // cons 可能是 string 或 array
      const consArray = Array.isArray(review.cons) ? review.cons : [review.cons];
      consArray.forEach(con => {
        if (con) {
          items.push({ type: 'con', text: con, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
        }
      });
    });
    return items;
  }, [reviews]);

  const totalCount = allItems.length;
  const visibleCount = perm.canSeeAllReviews ? totalCount : Math.min(GUEST_VISIBLE_COUNT, totalCount);
  const hiddenCount = Math.max(0, totalCount - visibleCount);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/8 to-brand-600/4 px-4 py-3.5">
        <div>
          <h2 id="reviews-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">⭐ 社區評價</h2>
          <p className="mt-0.5 text-[11px] text-ink-600">來自最真實的評價</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand/8 px-2.5 py-1 text-[10px] font-bold text-brand">
          {totalCount} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {allItems.slice(0, visibleCount).map((item, idx) => (
          <ReviewCard key={idx} item={item} type={item.type} />
        ))}
        
        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenCount > 0 && !!allItems[visibleCount]}
          hiddenCount={hiddenCount}
          countLabel="則評價"
          benefits={['查看全部評價', '新回答通知']}
        >
          {allItems[visibleCount] && (
            <ReviewCard item={allItems[visibleCount]} type={allItems[visibleCount].type} />
          )}
        </LockedOverlay>
      </div>
    </section>
  );
}
