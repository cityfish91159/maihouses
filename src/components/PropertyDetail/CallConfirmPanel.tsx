import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Phone, X } from 'lucide-react';
import { notify } from '../../lib/notify';
import { track } from '../../analytics/track';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { TrustAssureHint } from './TrustAssureHint';
import { isValidPhone, sanitizePhoneInput } from './contactUtils';

interface CallConfirmPanelProps {
  isOpen: boolean;
  onClose: () => void;
  agentPhone?: string | null;
  agentName: string;
  isLoggedIn: boolean;
  trustEnabled: boolean;
  onTrustAction?: (checked: boolean) => Promise<void>;
  onFallbackContact?: (trustChecked: boolean) => void;
}

export function CallConfirmPanel({
  isOpen,
  onClose,
  agentPhone,
  agentName,
  isLoggedIn,
  trustEnabled,
  onTrustAction,
  onFallbackContact,
}: CallConfirmPanelProps) {
  const [trustChecked, setTrustChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackPhone, setFallbackPhone] = useState('');
  const [panelReady, setPanelReady] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fallbackInputId = useId();

  const normalizedPhone = agentPhone?.trim() ?? '';
  const hasPhone = Boolean(normalizedPhone);

  useEffect(() => {
    if (isOpen) return;
    setTrustChecked(false);
    setIsSubmitting(false);
    setFallbackPhone('');
    setPanelReady(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setPanelReady(true);
  }, [isOpen]);

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: onClose,
    isActive: isOpen,
  });

  const handlePrimaryAction = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (hasPhone) {
        const sanitized = sanitizePhoneInput(normalizedPhone);
        const isValid = isValidPhone(normalizedPhone);

        if (!isValid) {
          notify.warning('電話格式有誤', '請改用聯絡表單留言給經紀人');
          onClose();
          onFallbackContact?.(trustChecked);
          return;
        }

        if (onTrustAction) {
          await onTrustAction(trustChecked);
        }

        const isMobile = /iPhone|Android|Mobile/i.test(navigator.userAgent);

        if (isMobile) {
          window.location.href = `tel:${sanitized}`;
          void track('call_dial_attempt', { has_phone: true, mode: 'tel' });
        } else {
          try {
            await navigator.clipboard.writeText(normalizedPhone);
            notify.info('已複製電話號碼', normalizedPhone);
          } catch {
            notify.info('請使用手機撥打', normalizedPhone);
          }
          void track('call_dial_attempt', { has_phone: true, mode: 'clipboard' });
        }

        onClose();
        return;
      }

      // 無電話
      const fallbackPhoneValid = isValidPhone(fallbackPhone);
      if (!fallbackPhoneValid) {
        notify.warning('電話格式有誤', '請輸入可聯絡的手機號碼');
        return;
      }

      void track('call_dial_attempt', { has_phone: false });
      onClose();
      onFallbackContact?.(trustChecked);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    fallbackPhone,
    hasPhone,
    isSubmitting,
    normalizedPhone,
    onClose,
    onFallbackContact,
    onTrustAction,
    trustChecked,
  ]);

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'w-full max-w-md rounded-2xl bg-bg-card shadow-2xl',
          'transform-gpu duration-200 ease-out',
          motionA11y.transitionTransform,
          motionA11y.transitionOpacity,
          panelReady ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0 sm:translate-y-2'
        )}
      >
        <div className="bg-gradient-to-r from-brand-700 to-brand-light p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id={titleId} className="text-lg font-bold">
                致電諮詢
              </h3>
              <p className="text-sm opacity-90">
                {hasPhone
                  ? `${agentName} 的聯絡電話已準備好，可一鍵撥打。`
                  : '經紀人尚未設定電話，可改用聯絡表單。'}
              </p>
            </div>
            <button
              ref={firstButtonRef}
              onClick={onClose}
              aria-label="關閉"
              className={cn(
                'min-h-[44px] min-w-[44px] cursor-pointer rounded-full p-2 hover:bg-white/20',
                motionA11y.transitionColors
              )}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {hasPhone ? (
            <div className="rounded-xl border border-border bg-bg-base p-4">
              <p className="text-sm text-text-muted">電話號碼</p>
              <p className="mt-1 text-lg font-bold text-ink-900">{normalizedPhone}</p>
              <button
                onClick={handlePrimaryAction}
                disabled={isSubmitting}
                className={cn(
                  'mt-3 flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-bold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60',
                  motionA11y.transitionColors
                )}
              >
                <Phone size={18} />
                撥打電話
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-bg-base p-4">
              <p className="text-sm text-text-muted">
                你仍可先送出聯絡需求，系統會通知經紀人儘快回電。
              </p>
              <label
                htmlFor={fallbackInputId}
                className="mt-3 block text-sm font-medium text-ink-900"
              >
                你的電話
              </label>
              <input
                id={fallbackInputId}
                type="tel"
                value={fallbackPhone}
                onChange={(e) => setFallbackPhone(e.target.value)}
                placeholder="例：0912-345-678"
                className={cn(
                  'focus:ring-brand-200 mt-1 min-h-[44px] w-full rounded-xl border border-border bg-bg-card px-3 text-sm text-ink-900 outline-none placeholder:text-text-muted focus:border-brand-500 focus:ring-2',
                  motionA11y.transitionColors
                )}
              />
              <button
                onClick={handlePrimaryAction}
                disabled={isSubmitting}
                className={cn(
                  'mt-3 min-h-[44px] w-full cursor-pointer rounded-xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60',
                  motionA11y.transitionColors
                )}
              >
                改用聯絡表單
              </button>
            </div>
          )}

          <TrustAssureHint
            isLoggedIn={isLoggedIn}
            trustEnabled={trustEnabled}
            checked={trustChecked}
            onCheckedChange={setTrustChecked}
          />
        </div>
      </div>
    </div>
  );
}
