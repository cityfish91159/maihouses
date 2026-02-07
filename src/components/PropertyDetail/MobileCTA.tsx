import { memo } from 'react';
import { Phone, MessageCircle, Calendar } from 'lucide-react';

interface MobileCTAProps {
  onLineClick: () => void;
  onCallClick: () => void;
  onBookingClick: () => void;
  weeklyBookings: number;
  isActionLocked?: boolean;
}

/**
 * 行動端首屏 CTA 組件
 *
 * 功能:
 * - 加 LINE 聊聊按鈕
 * - 致電諮詢按鈕
 * - 預約看屋按鈕
 * - 預約組數提示
 * - Action Lock 鎖定狀態
 *
 * @remarks
 * 使用 React.memo 優化
 * 僅在行動端顯示,位於圖片下方
 */
export const MobileCTA = memo(function MobileCTA({
  onLineClick,
  onCallClick,
  onBookingClick,
  weeklyBookings,
  isActionLocked,
}: MobileCTAProps) {
  const bookingText =
    weeklyBookings > 0
      ? `本物件 ${weeklyBookings} 組預約中，把握機會！`
      : '目前尚無預約，搶先安排看屋！';

  return (
    <div className="mb-6 lg:hidden">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={onLineClick}
            disabled={isActionLocked}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-[#05b34c] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <MessageCircle size={20} />
            加 LINE 聊聊
          </button>
          <button
            onClick={onCallClick}
            disabled={isActionLocked}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <Phone size={20} />
            致電諮詢
          </button>
          <button
            onClick={onBookingClick}
            disabled={isActionLocked}
            className="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 text-base font-bold text-white shadow-lg transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
          >
            <Calendar size={20} />
            預約看屋
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-700">
          {bookingText}
        </p>
      </div>
    </div>
  );
});
