import { memo } from 'react';
import { MessageCircle, Calendar, Shield, Eye, Flame } from 'lucide-react';

interface MobileActionBarProps {
  onLineClick: () => void;
  onBookingClick: () => void;
  socialProof: {
    currentViewers: number;
    isHot: boolean;
  };
}

/**
 * 行動端底部操作欄組件
 *
 * 功能:
 * - 加 LINE 諮詢按鈕
 * - 預約看屋按鈕
 * - 社會證明資訊
 *
 * @remarks
 * 使用 React.memo 優化
 * 固定在螢幕底部 (僅行動端顯示)
 */
export const MobileActionBar = memo(function MobileActionBar({
  onLineClick,
  onBookingClick,
  socialProof,
}: MobileActionBarProps) {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-overlay border-t border-slate-100 bg-white p-3 lg:hidden">
      {/* 經紀人驗證資訊 */}
      <div className="mb-2 flex items-center justify-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <Shield size={10} className="text-green-500" />
          認證經紀人
        </span>
        <span className="flex items-center gap-1">
          <Eye size={10} className="text-blue-500" />
          {socialProof.currentViewers} 人瀏覽中
        </span>
        {socialProof.isHot && (
          <span className="flex items-center gap-1 font-medium text-orange-500">
            <Flame size={10} />
            熱門
          </span>
        )}
      </div>

      {/* 雙主按鈕 */}
      <div className="flex gap-2">
        {/* 左按鈕：加 LINE（低門檻）*/}
        <button
          onClick={onLineClick}
          className="flex flex-[4] items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 font-bold text-white shadow-lg shadow-green-500/20"
        >
          <MessageCircle size={20} />加 LINE 諮詢
        </button>

        {/* 右按鈕：預約看屋（高意圖）*/}
        <button
          onClick={onBookingClick}
          className="flex flex-[6] items-center justify-center gap-2 rounded-xl bg-[#003366] py-3 font-bold text-white shadow-lg shadow-blue-900/20"
        >
          <Calendar size={20} />
          預約看屋
        </button>
      </div>
    </div>
  );
});
