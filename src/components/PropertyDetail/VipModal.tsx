import { memo, useCallback, useId, useRef } from 'react';
import { Flame, CheckCircle, MessageCircle, Phone, X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../lib/utils';
import { motionA11y, withMotionSafety } from '../../lib/motionA11y';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
    onEscape: onClose,
    isActive: isOpen,
  });

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/60 p-4 sm:items-center"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={withMotionSafety(
          'animate-in slide-in-from-bottom-8 sm:zoom-in-95 max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl duration-300 sm:rounded-2xl',
          { animate: true }
        )}
      >
        {/* Header */}
        <div className="relative mb-4 text-center">
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="關閉 VIP 彈窗"
            className={cn(
              'absolute right-0 top-0 min-h-[44px] min-w-[44px] rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2',
              motionA11y.transitionColors
            )}
          >
            <X size={20} />
          </button>
          <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-600 to-red-600">
            <Flame size={32} className="text-white" />
          </div>
          <h3 id={titleId} className="text-xl font-bold text-slate-800">
            發現您對此物件很有興趣！
          </h3>
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
            className={cn(
              'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-line py-3 font-bold tracking-wide text-white shadow-lg shadow-green-500/20 duration-200 hover:bg-line-hover focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 active:scale-[0.98] motion-reduce:active:scale-100',
              motionA11y.transitionAll
            )}
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
            className={cn(
              'flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-bold tracking-wide text-white shadow-lg shadow-blue-900/20 duration-200 hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 active:scale-[0.98] motion-reduce:active:scale-100',
              motionA11y.transitionAll
            )}
          >
            <Phone size={20} />
            致電諮詢
          </button>

          <button
            onClick={onClose}
            className={cn(
              'min-h-[44px] w-full py-2 text-sm text-slate-400 hover:text-slate-600',
              motionA11y.transitionColors
            )}
          >
            稍後再說
          </button>
        </div>
      </div>
    </div>
  );
});
