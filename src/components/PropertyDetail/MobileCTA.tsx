import { memo } from 'react';
import { Phone, MessageCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';

interface MobileCTAProps {
  onLineClick: () => void;
  onCallClick: () => void;
  socialProof: {
    currentViewers: number;
    trustCasesCount: number;
    isHot: boolean;
  };
  trustEnabled: boolean; // #8 控制賞屋組數顯示
  isActionLocked?: boolean;
}

/**
 * 行動端首屏 CTA 組件（#2 雙按鈕重構 + #20b-D9 Glassmorphism）
 *
 * 功能:
 * - 加 LINE 聊聊按鈕（主 CTA）
 * - 致電諮詢按鈕（次 CTA）
 * - 賞屋組數提示（#8 真實數據）
 * - Action Lock 鎖定狀態
 *
 * @remarks
 * 使用 React.memo 優化
 * 僅在行動端顯示,位於圖片下方
 * 觸控目標 >= 44px (ux-guidelines #22)
 * #20b-D9: 套用 Glassmorphism 設計語言（glass-card）
 */
export const MobileCTA = memo(function MobileCTA({
  onLineClick,
  onCallClick,
  socialProof,
  trustEnabled,
  isActionLocked,
}: MobileCTAProps) {
  return (
    <div className="mb-6 lg:hidden">
      <div className="rounded-2xl p-4 glass-card">
        <div className="flex gap-3">
          {/* 加 LINE 聊聊 - 主 CTA */}
          <button
            onClick={onLineClick}
            aria-label="加 LINE 聊聊"
            disabled={isActionLocked}
            className={cn(
              'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-line py-3 text-base font-bold tracking-wide text-white shadow-lg shadow-green-500/20 duration-200 hover:bg-line-hover focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100',
              motionA11y.transitionAll
            )}
          >
            <MessageCircle size={20} />加 LINE 聊聊
          </button>

          {/* 致電諮詢 - 次 CTA */}
          <button
            onClick={onCallClick}
            aria-label="致電諮詢"
            disabled={isActionLocked}
            className={cn(
              'flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-base font-bold tracking-wide text-white shadow-lg shadow-blue-900/20 duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:active:scale-100',
              motionA11y.transitionAll
            )}
          >
            <Phone size={20} />
            致電諮詢
          </button>
        </div>

        {/* 賞屋組數提示（#8 真實數據，有開啟安心留痕服務 且 案件數 > 0 時才顯示） */}
        {trustEnabled && socialProof.trustCasesCount > 0 && (
          <p
            className="mt-2 text-center text-xs text-slate-700"
            aria-live="polite"
            aria-atomic="true"
          >
            本物件 {socialProof.trustCasesCount} 組客戶已賞屋，把握機會！
          </p>
        )}
      </div>
    </div>
  );
});
