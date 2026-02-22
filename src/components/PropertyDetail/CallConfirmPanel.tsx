import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Phone, X } from 'lucide-react';
import { notify } from '../../lib/notify';
import { track } from '../../analytics/track';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { TrustAssureHint } from './TrustAssureHint';
import { formatPhoneForDisplay, isValidPhone, sanitizePhoneInput } from './contactUtils';
import { PANEL_SKELETON_DELAY_MS } from './constants';
import { MaiMaiBase } from '../MaiMai';
import { normalizeAgentName } from './agentName';
import { useMaiMaiA11yProps } from '../../hooks/useMaiMaiA11yProps';
import { usePanelWelcomeTrack } from './usePanelWelcomeTrack';
import { useDetailPanelShell } from './useDetailPanelShell';
import { usePanelContentReady } from './hooks/usePanelContentReady';

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

const FALLBACK_PHONE_ERROR_MESSAGE = '請輸入有效電話號碼（例如：0912-345-678）';

function validateFallbackPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '請輸入電話號碼';
  if (!isValidPhone(trimmed)) return FALLBACK_PHONE_ERROR_MESSAGE;
  return null;
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
  const [fallbackPhoneTouched, setFallbackPhoneTouched] = useState(false);
  const [fallbackPhoneError, setFallbackPhoneError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fallbackInputId = useId();
  const fallbackErrorId = useId();

  const normalizedPhone = agentPhone?.trim() ?? '';
  const hasPhone = Boolean(normalizedPhone);
  const displayedPhone = useMemo(() => formatPhoneForDisplay(normalizedPhone), [normalizedPhone]);
  const safeAgentName = useMemo(() => normalizeAgentName(agentName), [agentName]);
  const maiMaiA11yProps = useMaiMaiA11yProps();
  const isContentReady = usePanelContentReady(isOpen);

  useEffect(() => {
    if (isOpen) return;
    setTrustChecked(false);
    setIsSubmitting(false);
    setFallbackPhone('');
    setFallbackPhoneTouched(false);
    setFallbackPhoneError(null);
  }, [isOpen]);

  const panelReady = useDetailPanelShell({
    isOpen,
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: onClose,
  });

  usePanelWelcomeTrack({
    panelType: 'call',
    isOpen,
    hasContact: hasPhone,
  });

  const handleDirectCall = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const sanitized = sanitizePhoneInput(normalizedPhone);
      if (!isValidPhone(normalizedPhone)) {
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
          await navigator.clipboard.writeText(displayedPhone);
          notify.info('已複製電話號碼', displayedPhone);
        } catch {
          notify.info('請使用手機撥打', displayedPhone);
        }
        void track('call_dial_attempt', { has_phone: true, mode: 'clipboard' });
      }

      onClose();
    } catch {
      notify.warning('操作未完成', '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    displayedPhone,
    isSubmitting,
    normalizedPhone,
    onClose,
    onFallbackContact,
    onTrustAction,
    trustChecked,
  ]);

  const handleFallbackSubmit = useCallback(async () => {
    if (isSubmitting) return;

    setFallbackPhoneTouched(true);
    const validationError = validateFallbackPhone(fallbackPhone);
    setFallbackPhoneError(validationError);
    if (validationError) {
      notify.warning('電話格式有誤', FALLBACK_PHONE_ERROR_MESSAGE);
      return;
    }

    setIsSubmitting(true);
    try {
      void track('call_dial_attempt', { has_phone: false });
      onClose();
      onFallbackContact?.(trustChecked);
    } catch {
      notify.warning('操作未完成', '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [fallbackPhone, isSubmitting, onClose, onFallbackContact, trustChecked]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) onClose();
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
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
                  ? `${safeAgentName} 的聯絡電話已準備好，可一鍵撥打。`
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
          {!isContentReady ? (
            <div
              data-testid="call-panel-skeleton"
              className={cn('space-y-3 rounded-xl bg-bg-base p-3', motionA11y.pulse)}
            >
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-200" />
            </div>
          ) : (
            <>
              <div className="animate-in fade-in bg-brand-50/60 mb-4 flex items-center gap-3 rounded-xl p-3 duration-200 motion-reduce:transition-none">
                <MaiMaiBase mood={hasPhone ? 'happy' : 'thinking'} size="xs" {...maiMaiA11yProps} />
                <p className="text-sm text-ink-900">
                  {hasPhone ? '撥打電話前確認一下～' : '房仲還沒設定電話，用表單留言吧'}
                </p>
              </div>

              {hasPhone ? (
                <div className="rounded-xl border border-border bg-bg-base p-4">
                  <p className="text-sm text-text-muted">電話號碼</p>
                  <p className="mt-1 text-lg font-bold text-ink-900">{displayedPhone}</p>
                  <button
                    onClick={handleDirectCall}
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
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setFallbackPhone(nextValue);
                      if (fallbackPhoneTouched) {
                        setFallbackPhoneError(validateFallbackPhone(nextValue));
                      }
                    }}
                    onBlur={() => {
                      setFallbackPhoneTouched(true);
                      setFallbackPhoneError(validateFallbackPhone(fallbackPhone));
                    }}
                    placeholder="例：0912-345-678"
                    aria-invalid={Boolean(fallbackPhoneError)}
                    aria-describedby={fallbackPhoneError ? fallbackErrorId : undefined}
                    className={cn(
                      'mt-1 min-h-[44px] w-full rounded-xl border bg-bg-card px-3 text-sm text-ink-900 outline-none placeholder:text-text-muted focus:ring-2',
                      fallbackPhoneError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200 motion-safe:animate-shake'
                        : 'focus:ring-brand-200 border-border focus:border-brand-500',
                      motionA11y.transitionColors
                    )}
                  />
                  {fallbackPhoneError && (
                    <p id={fallbackErrorId} className="mt-1 text-sm text-red-600">
                      {fallbackPhoneError}
                    </p>
                  )}
                  <button
                    onClick={handleFallbackSubmit}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
