import React, { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import { X, CheckCircle, Calendar } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
}

/** 預約時段選擇器 Modal (#5 從 AgentTrustCard 獨立) */
export const BookingModal: React.FC<BookingModalProps> = memo(function BookingModal({
  isOpen,
  onClose,
  agentName,
}) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);

  // P0 FocusTrap + Escape 支援
  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: handleClose,
    isActive: isOpen,
  });

  // #6 cleanup setTimeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // 生成未來 7 天的可用時段（計算輕量，無需 memoization）
  const getTimeSlots = () => {
    const slots: { date: string; day: string; times: string[] }[] = [];
    const days: string[] = ['日', '一', '二', '三', '四', '五', '六'];

    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dayStr = `${date.getMonth() + 1}/${date.getDate()}`;
      const dayName = days[date.getDay()] ?? '日';

      // 週末有更多時段
      const times =
        date.getDay() === 0 || date.getDay() === 6
          ? ['10:00', '11:00', '14:00', '15:00', '16:00']
          : ['14:00', '15:00', '19:00'];

      slots.push({ date: dayStr, day: dayName, times });
    }
    return slots;
  };

  const timeSlots = getTimeSlots();

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedSlot || !phone) return;
    setSubmitted(true);
    // #6 使用 ref 管理 timer，確保 unmount 時清除
    timerRef.current = setTimeout(() => {
      onClose();
      setSubmitted(false);
      setSelectedSlot(null);
      setPhone('');
      timerRef.current = null;
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-light p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 id="booking-modal-title" className="text-lg font-bold">
                預約看屋
              </h3>
              <p className="text-sm opacity-80">選擇方便的時段，{agentName} 將為您安排</p>
            </div>
            <button
              ref={firstButtonRef}
              onClick={onClose}
              aria-label="關閉"
              className="min-h-[44px] min-w-[44px] rounded-full p-2 transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/50"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="text-green-500" size={32} />
            </div>
            <h4 className="mb-2 text-xl font-bold text-ink-900">預約成功！</h4>
            <p className="text-text-muted">經紀人將盡快與您聯繫確認</p>
          </div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto p-4">
            {/* Time Slots */}
            <div className="mb-4 space-y-3">
              {timeSlots.slice(0, 4).map((slot) => (
                <div key={slot.date}>
                  <div className="mb-2 text-xs font-medium text-text-muted">
                    {slot.date} (週{slot.day})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {slot.times.map((time) => {
                      const slotId = `${slot.date}-${time}`;
                      const isSelected = selectedSlot === slotId;
                      return (
                        <button
                          key={slotId}
                          onClick={() => setSelectedSlot(slotId)}
                          className={`min-h-[44px] rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                            isSelected
                              ? 'bg-brand-700 text-white'
                              : 'bg-bg-base text-ink-900 hover:bg-border'
                          }`}
                        >
                          {time}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Phone Input */}
            <div className="mt-4">
              <label
                htmlFor="booking-phone"
                className="mb-1 block text-xs font-medium text-ink-600"
              >
                您的手機號碼
              </label>
              <input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                className="w-full rounded-xl border border-border p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!selectedSlot || !phone}
              className={`mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
                selectedSlot && phone
                  ? 'bg-brand-700 text-white hover:bg-brand-600 focus:ring-2 focus:ring-brand-500'
                  : 'cursor-not-allowed bg-bg-base text-text-muted'
              }`}
            >
              <Calendar size={18} />
              確認預約
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
