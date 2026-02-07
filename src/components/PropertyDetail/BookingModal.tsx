import { useState, useMemo, useEffect, useRef, memo, useCallback, useId } from 'react';
import { X, CheckCircle, Calendar } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { notify } from '../../lib/notify';
import { buildTimeSlots, sanitizePhoneInput, isValidPhone } from './bookingUtils';
import { TrustAssureHint } from './TrustAssureHint';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentName: string;
  onSubmitBooking: (data: {
    selectedSlot: string;
    phone: string;
    trustAssureChecked: boolean;
  }) => Promise<void>;
  isLoggedIn?: boolean;
  trustEnabled?: boolean;
  onTrustAction?: (checked: boolean) => Promise<void>;
}

/** 預約時段選擇器 Modal */
export const BookingModal = memo(function BookingModal({
  isOpen,
  onClose,
  agentName,
  onSubmitBooking,
  isLoggedIn = false,
  trustEnabled = false,
  onTrustAction,
}: BookingModalProps) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [phone, setPhone] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trustAssureChecked, setTrustAssureChecked] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const resetForm = useCallback(() => {
    setSelectedSlot(null);
    setPhone('');
    setSubmitted(false);
    setIsSubmitting(false);
    setTrustAssureChecked(false);
  }, []);

  const handleClose = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // FocusTrap + Escape 支援
  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: handleClose,
    isActive: isOpen,
  });

  // cleanup setTimeout on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const timeSlots = useMemo(() => buildTimeSlots(), []);

  const sanitizedPhone = sanitizePhoneInput(phone);
  const isPhoneValid = isValidPhone(sanitizedPhone);
  const canSubmit = Boolean(selectedSlot) && isPhoneValid;

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    if (!selectedSlot || !isPhoneValid) return;

    setIsSubmitting(true);

    try {
      await onSubmitBooking({
        selectedSlot,
        phone: sanitizedPhone,
        trustAssureChecked,
      });
    } catch {
      notify.error('預約送出失敗', '請稍後再試');
      setIsSubmitting(false);
      return;
    }

    setSubmitted(true);

    if (trustAssureChecked && onTrustAction) {
      try {
        await onTrustAction(true);
      } catch {
        notify.warning('預約已送出', '安心留痕未完成，你可以稍後再試一次。');
      }
    }

    timerRef.current = setTimeout(() => {
      handleClose();
    }, 2000);

    setIsSubmitting(false);
  }, [
    handleClose,
    isPhoneValid,
    isSubmitting,
    onSubmitBooking,
    onTrustAction,
    sanitizedPhone,
    selectedSlot,
    trustAssureChecked,
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-bg-card shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand-700 to-brand-light p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 id={titleId} className="text-lg font-bold">
                預約看屋
              </h3>
              <p className="text-sm opacity-80">
                選擇方便的時段，{agentName} 將為你安排
              </p>
            </div>
            <button
              ref={firstButtonRef}
              onClick={handleClose}
              aria-label="關閉"
              className="min-h-[44px] min-w-[44px] cursor-pointer rounded-full p-2 transition-colors hover:bg-white/20 focus:ring-2 focus:ring-white/50"
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
            <p className="text-text-muted">經紀人將盡快與你聯繫確認</p>
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
                          name={time}
                          onClick={() => setSelectedSlot(slotId)}
                          className={`min-h-[44px] cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
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
                你的手機號碼
              </label>
              <input
                id="booking-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912-345-678"
                inputMode="numeric"
                className="w-full rounded-xl border border-border p-3 outline-none focus:border-transparent focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Trust Assure Hint */}
            <TrustAssureHint
              isLoggedIn={isLoggedIn}
              trustEnabled={trustEnabled}
              checked={trustAssureChecked}
              onCheckedChange={setTrustAssureChecked}
            />

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`mt-4 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-3 font-bold transition-all ${
                canSubmit && !isSubmitting
                  ? 'cursor-pointer bg-brand-700 text-white hover:bg-brand-600 focus:ring-2 focus:ring-brand-500'
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
