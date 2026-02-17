import { memo } from 'react';
import { MessageCircle, Phone, Shield, Eye, Flame, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { useScrollDirection } from '../../hooks/useScrollDirection';

const DEFAULT_SOCIAL_PROOF = { currentViewers: 0, trustCasesCount: 0, isHot: false } as const;

interface MobileActionBarProps {
  onLineClick: () => void;
  onCallClick: () => void;
  socialProof?: {
    currentViewers: number;
    trustCasesCount: number; // #8 新增
    isHot: boolean;
  };
  trustEnabled: boolean; // #8 控制賞屋組數顯示
  isVerified?: boolean;
  isActionLocked?: boolean;
}

/**
 * 行動端底部操作欄組件（#2 雙按鈕重構 + var(--mh-color-2200bb)-D4 毛玻璃+滾動隱藏）
 *
 * 功能:
 * - 加 LINE 聊聊按鈕（主 CTA）
 * - 致電諮詢按鈕（次 CTA）
 * - 社會證明資訊（瀏覽人數、熱門標記，icon 14px）
 * - Action Lock 狀態控制
 * - Glassmorphism 毛玻璃背景（bg-white/95 + backdrop-blur-xl）
 * - 滾動隱藏：上滑隱藏、下滑顯示
 *
 * @remarks
 * 使用 React.memo 優化渲染
 * 固定在螢幕底部（僅行動端顯示，lg 以上隱藏）
 * 觸控目標 >= 44px (ux-guidelines #22)
 * 符合 products.csv #38 Real Estate Glassmorphism 風格
 * 符合 ux-guidelines #36（固定元素可自動隱藏）
 * 符合 ux-guidelines #82（prefers-reduced-motion）
 */
export const MobileActionBar = memo(function MobileActionBar({
  onLineClick,
  onCallClick,
  socialProof = DEFAULT_SOCIAL_PROOF,
  trustEnabled,
  isVerified = false,
  isActionLocked = false,
}: MobileActionBarProps) {
  const scrollDirection = useScrollDirection(10);
  const isVisible = scrollDirection === 'up';

  return (
    <div
      className={cn(
        'pb-safe fixed inset-x-0 bottom-0 z-overlay border-t border-white/20 bg-white/95 p-3 backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden',
        !isVisible && 'translate-y-full motion-reduce:translate-y-0'
      )}
    >
      {/* 社會證明資訊（#8 真實數據 + var(--mh-color-2200bb)-D4 icon 升級至 14px） */}
      <div className="mb-2 flex items-center justify-center gap-4 text-xs text-slate-500">
        {isVerified && (
          <span className="flex items-center gap-1">
            <Shield size={14} className="text-green-500" />
            認證經紀人
          </span>
        )}
        {/* 瀏覽人數 — 永遠顯示 */}
        <span className="flex items-center gap-1">
          <Eye size={14} className="text-blue-500" />
          {socialProof.currentViewers} 人瀏覽中
        </span>
        {/* 賞屋組數 — trustEnabled && trustCasesCount > 0 才顯示 */}
        {trustEnabled && socialProof.trustCasesCount > 0 && (
          <span className="flex items-center gap-1">
            <Users size={14} className="text-green-500" />
            {socialProof.trustCasesCount} 組已賞屋
          </span>
        )}
        {/* 熱門標記 — trustEnabled && trustCasesCount >= 3 才顯示 */}
        {trustEnabled && socialProof.isHot && (
          <span className="flex items-center gap-1 font-medium text-orange-500">
            <Flame size={14} />
            熱門
          </span>
        )}
      </div>

      {/* 雙主按鈕（#2 UX 重構） */}
      <div className="flex gap-2">
        {/* 加 LINE 聊聊 - 主 CTA */}
        <button
          onClick={onLineClick}
          aria-label="加 LINE 聊聊"
          disabled={isActionLocked}
          className={cn(
            'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-line py-3 font-bold tracking-wide text-white shadow-lg shadow-green-500/20 duration-200 hover:bg-line-hover focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100',
            motionA11y.transitionAll
          )}
        >
          <MessageCircle size={18} />加 LINE 聊聊
        </button>

        {/* 致電諮詢 - 次 CTA */}
        <button
          onClick={onCallClick}
          aria-label="致電諮詢"
          disabled={isActionLocked}
          className={cn(
            'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-bold tracking-wide text-white shadow-lg shadow-blue-900/20 duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100',
            motionA11y.transitionAll
          )}
        >
          <Phone size={18} />
          致電諮詢
        </button>
      </div>
    </div>
  );
});
