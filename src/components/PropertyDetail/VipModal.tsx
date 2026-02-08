import { memo } from 'react';
import { Flame, CheckCircle, MessageCircle, Phone } from 'lucide-react';

interface VipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLineClick: () => void;
  onCallClick: () => void;
  reason: string;
}

/**
 * VIP 高意願客戶攔截彈窗組件 (S-Grade) - #2 雙按鈕重構
 *
 * 功能:
 * - 顯示 VIP 專屬優惠
 * - 提供快速聯絡入口（LINE + 致電）
 * - 強化轉換動機
 *
 * @remarks
 * 使用 React.memo 優化
 * 當用戶行為達到 S 級評分時自動彈出
 * Calendar → Phone (移除預約看屋)
 */
export const VipModal = memo(function VipModal({
  isOpen,
  onClose,
  onLineClick,
  onCallClick,
  reason,
}: VipModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      role="button"
      tabIndex={0}
      aria-label="關閉 VIP 彈窗"
    >
      <div
        className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl duration-300"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        {/* Header */}
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-red-500">
            <Flame size={32} className="text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">發現您對此物件很有興趣！</h3>
          <p className="mt-1 text-sm text-slate-500">{reason || '專屬 VIP 服務為您優先安排'}</p>
        </div>

        {/* Benefits */}
        <div className="mb-4 space-y-2 rounded-xl bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="shrink-0 text-green-500" />
            <span>優先安排專人帶看</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="shrink-0 text-green-500" />
            <span>獨家議價空間資訊</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={16} className="shrink-0 text-green-500" />
            <span>相似物件即時通知</span>
          </div>
        </div>

        {/* CTA Buttons - 雙按鈕重構 (#2) */}
        <div className="space-y-2">
          {/* 主 CTA: LINE */}
          <button
            onClick={() => {
              onClose();
              onLineClick();
            }}
            aria-label="立即加 LINE 諮詢"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#06C755] py-3 font-bold text-white shadow-lg transition-colors duration-200 hover:bg-[#05b34c] motion-reduce:transition-none"
          >
            <MessageCircle size={20} />
            立即加 LINE 諮詢
          </button>

          {/* 次 CTA: 致電諮詢 (替代預約看屋) */}
          <button
            onClick={() => {
              onClose();
              onCallClick();
            }}
            aria-label="致電諮詢"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-bold text-white transition-colors duration-200 hover:bg-brand-600 motion-reduce:transition-none"
          >
            <Phone size={20} />
            致電諮詢
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-slate-400 transition-colors hover:text-slate-600"
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
});
