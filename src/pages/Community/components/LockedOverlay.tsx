/**
 * LockedOverlay Component
 * 
 * 通用的模糊遮罩 + 鎖定 CTA 組件
 * 用於評價區、貼文區、問答區的權限控制
 */

import type { ReactNode } from 'react';

interface LockedOverlayProps {
  /** 被遮蓋的內容 */
  children: ReactNode;
  /** 遮蓋數量提示（例如「還有 5 則評價」） */
  hiddenCount: number;
  /** 遮蓋標題（例如「則評價」「則熱帖」「則問答」） */
  countLabel: string;
  /** 遮蓋副標題（例如「查看全部評價」） */
  benefits?: string[];
  /** CTA 按鈕文字 */
  ctaText?: string;
  /** CTA 按鈕點擊事件 */
  onCtaClick?: () => void;
  /** 是否顯示（用於控制是否渲染） */
  visible?: boolean;
}

export function LockedOverlay({
  children,
  hiddenCount,
  countLabel,
  benefits = ['查看完整內容', '新回答通知'],
  ctaText = '免費註冊 / 登入',
  onCtaClick,
  visible = true,
}: LockedOverlayProps) {
  if (!visible || hiddenCount <= 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* 模糊的背景內容 */}
      <div className="pointer-events-none select-none blur-[4px]" aria-hidden="true">
        {children}
      </div>
      
      {/* 遮罩層 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center rounded-[14px] bg-white/85 p-5 text-center">
        <h4 className="mb-1 text-sm font-extrabold text-brand-700">
          🔒 還有 {hiddenCount} {countLabel}
        </h4>
        <p className="mb-2.5 text-xs text-ink-600">
          {benefits.map((b, i) => (
            <span key={i}>
              {i > 0 && '　'}✓ {b}
            </span>
          ))}
        </p>
        <button 
          onClick={onCtaClick}
          className="rounded-full bg-gradient-to-br from-brand to-brand-600 px-6 py-2.5 text-[13px] font-bold text-white transition-transform hover:scale-[1.02]"
        >
          {ctaText}
        </button>
      </div>
    </div>
  );
}
