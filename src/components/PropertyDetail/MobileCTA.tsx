import { memo } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

interface MobileCTAProps {
  onLineClick: () => void;
  onCallClick: () => void;
  trustCasesCount?: number;
  isActionLocked?: boolean;
}

/**
 * 行動端首屏 CTA 組件（#2 雙按鈕重構）
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
 */
export const MobileCTA = memo(function MobileCTA({
  onLineClick,
  onCallClick,
  trustCasesCount = 0,
  isActionLocked,
}: MobileCTAProps) {
  return (
    <div className="mb-6 lg:hidden">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
        <div className="flex gap-3">
          {/* 加 LINE 聊聊 - 主 CTA */}
          <button
            onClick={onLineClick}
            aria-label="加 LINE 聊聊"
            disabled={isActionLocked}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 text-base font-bold tracking-wide text-white shadow-lg shadow-green-500/20 transition-all duration-200 hover:bg-[#05b34c] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <MessageCircle size={20} />
            加 LINE 聊聊
          </button>

          {/* 致電諮詢 - 次 CTA */}
          <button
            onClick={onCallClick}
            aria-label="致電諮詢"
            disabled={isActionLocked}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-base font-bold tracking-wide text-white shadow-lg shadow-blue-900/20 transition-all duration-200 hover:bg-brand-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none motion-reduce:active:scale-100"
          >
            <Phone size={20} />
            致電諮詢
          </button>
        </div>

        {/* 賞屋組數提示（#8 真實數據，trust_cases_count > 0 時顯示） + ARIA live 無障礙增強 */}
        {trustCasesCount > 0 && (
          <p
            className="mt-2 text-center text-xs text-slate-700"
            aria-live="polite"
            aria-atomic="true"
          >
            本物件 {trustCasesCount} 組客戶已賞屋，把握機會！
          </p>
        )}
      </div>
    </div>
  );
});
