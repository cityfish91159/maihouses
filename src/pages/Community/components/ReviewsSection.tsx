/**
 * ReviewsSection Component
 * 
 * 社區評價區塊
 * 重構：使用 LockedOverlay + Tailwind brand 色系
 */

import { useMemo } from 'react';
import type { Role, Review } from '../types';
import { getPermissions } from '../types';
import { useGuestVisibleItems } from '../../../hooks/useGuestVisibleItems';
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
  const hasVisits = item.visits > 0;
  const hasDeals = item.deals > 0;
  
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
          <div className="text-[13px] font-bold text-ink-900">{item.author}{item.company ? `｜${item.company}` : ''}</div>
          {(hasVisits || hasDeals) && (
            <div className="text-[11px] text-ink-600">
              {hasVisits && `帶看 ${item.visits} 次`}
              {hasVisits && hasDeals && ' · '}
              {hasDeals && `成交 ${item.deals} 戶`}
            </div>
          )}
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
  reviews: Review[] | { items: Review[] };
  onUnlock?: () => void;
}

export function ReviewsSection({ role, reviews: reviewsProp, onUnlock }: ReviewsSectionProps) {
  const reviews = Array.isArray(reviewsProp) ? reviewsProp : (reviewsProp?.items ?? []);
  const perm = getPermissions(role);

  // 使用統一的 hook 處理訪客可見項目
  const { visible: visibleReviews, hiddenCount: hiddenReviewCount, nextHidden: nextHiddenReview } = 
    useGuestVisibleItems(reviews, perm.canSeeAllReviews);
  
  // 把可見的 reviews 拆成單項（pros/cons）
  const visibleItems = useMemo(() => {
    const items: { type: 'pro' | 'con'; text: string; author: string; company: string; visits: number; deals: number }[] = [];
    visibleReviews.forEach(review => {
      review.pros.forEach(pro => {
        items.push({ type: 'pro', text: pro, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
      });
      const consArray = Array.isArray(review.cons) ? review.cons : [review.cons];
      consArray.forEach(con => {
        if (con) {
          items.push({ type: 'con', text: con, author: review.author, company: review.company, visits: review.visits, deals: review.deals });
        }
      });
    });
    return items;
  }, [visibleReviews]);

  // 取得下一則被隱藏的 review 的第一個項目（用於 LockedOverlay 預覽）
  const nextHiddenItem = useMemo(() => {
    if (!nextHiddenReview) return null;
    // 優先顯示 pros 的第一項
    const firstPro = nextHiddenReview.pros[0];
    if (firstPro) {
      return { type: 'pro' as const, text: firstPro, author: nextHiddenReview.author, company: nextHiddenReview.company, visits: nextHiddenReview.visits, deals: nextHiddenReview.deals };
    }
    const consArray = Array.isArray(nextHiddenReview.cons) ? nextHiddenReview.cons : [nextHiddenReview.cons];
    const firstCon = consArray[0];
    if (firstCon) {
      return { type: 'con' as const, text: firstCon, author: nextHiddenReview.author, company: nextHiddenReview.company, visits: nextHiddenReview.visits, deals: nextHiddenReview.deals };
    }
    return null;
  }, [nextHiddenReview]);

  return (
    <section className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 shadow-[0_2px_12px_rgba(0,51,102,0.04)]" aria-labelledby="reviews-heading">
      <div className="flex items-center justify-between border-b border-brand/5 bg-gradient-to-br from-brand/8 to-brand-600/4 px-4 py-3.5">
        <div>
          <h2 id="reviews-heading" className="flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700">⭐ 社區評價</h2>
          <p className="mt-0.5 text-[11px] text-ink-600">來自最真實的評價</p>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-brand-600 bg-brand/8 px-2.5 py-1 text-[10px] font-bold text-brand">
          {reviews.length} 則評價
        </span>
      </div>
      <div className="flex flex-col gap-2.5 p-3.5">
        {visibleItems.map((item, idx) => (
          <ReviewCard key={idx} item={item} type={item.type} />
        ))}
        
        {/* 使用 LockedOverlay 組件 */}
        <LockedOverlay
          visible={hiddenReviewCount > 0 && !!nextHiddenItem}
          hiddenCount={hiddenReviewCount}
          countLabel="則評價"
          benefits={['看完所有鄰居真實評價', '社區有新評論時通知你']}
          {...(onUnlock ? { onCtaClick: onUnlock } : {})}
        >
          {nextHiddenItem && (
            <ReviewCard item={nextHiddenItem} type={nextHiddenItem.type} />
          )}
        </LockedOverlay>
      </div>
    </section>
  );
}
