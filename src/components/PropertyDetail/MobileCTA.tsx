import { memo } from 'react';
import { Phone, MessageCircle } from 'lucide-react';

interface MobileCTAProps {
  onLineClick: () => void;
  onCallClick: () => void;
  weeklyBookings: number;
}

/**
 * 行動端首屏 CTA 組件
 *
 * 功能:
 * - 立即聯絡經紀人按鈕
 * - LINE 快速聯絡按鈕
 * - 預約組數提示
 *
 * @remarks
 * 使用 React.memo 優化
 * 僅在行動端顯示,位於圖片下方
 */
export const MobileCTA = memo(function MobileCTA({
  onLineClick,
  onCallClick,
  weeklyBookings,
}: MobileCTAProps) {
  return (
    <div className="mb-6 lg:hidden">
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-lg">
        <div className="flex gap-3">
          <button
            onClick={onCallClick}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#003366] py-4 text-base font-bold text-white shadow-lg"
          >
            <Phone size={20} />
            立即聯絡經紀人
          </button>
          <button
            onClick={onLineClick}
            className="flex w-14 items-center justify-center rounded-xl bg-[#06C755] text-white shadow-lg"
          >
            <MessageCircle size={22} />
          </button>
        </div>
        <p className="mt-2 text-center text-xs text-slate-500">
          🔥 本物件 {weeklyBookings} 組預約中，把握機會！
        </p>
      </div>
    </div>
  );
});
