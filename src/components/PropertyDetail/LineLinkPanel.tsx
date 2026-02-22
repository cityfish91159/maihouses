import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { notify } from '../../lib/notify';
import { logger } from '../../lib/logger';
import { track } from '../../analytics/track';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { TrustAssureHint } from './TrustAssureHint';
import { LINE_ID_PATTERN, PANEL_SKELETON_DELAY_MS } from './constants';
import { MaiMaiBase } from '../MaiMai';
import { normalizeAgentName } from './agentName';
import { useMaiMaiA11yProps } from '../../hooks/useMaiMaiA11yProps';
import { usePanelWelcomeTrack } from './usePanelWelcomeTrack';
import { useDetailPanelShell } from './useDetailPanelShell';
import { usePanelContentReady } from './hooks/usePanelContentReady';

interface LineLinkPanelProps {
  isOpen: boolean;
  onClose: () => void;
  agentLineId?: string | null;
  agentName: string;
  isLoggedIn: boolean;
  trustEnabled: boolean;
  onTrustAction?: (checked: boolean) => Promise<void>;
  onFallbackContact?: (trustChecked: boolean) => void;
}

const LINE_ID_ERROR_DETAIL = '可使用英數、底線、點、連字號（3-64 字元）。';

function validateLineIdInput(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return '請輸入 LINE ID';
  if (!LINE_ID_PATTERN.test(trimmed)) return `LINE ID 格式不正確，${LINE_ID_ERROR_DETAIL}`;
  return null;
}

export function LineLinkPanel({
  isOpen,
  onClose,
  agentLineId,
  agentName,
  isLoggedIn,
  trustEnabled,
  onTrustAction,
  onFallbackContact,
}: LineLinkPanelProps) {
  const [trustChecked, setTrustChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fallbackLineId, setFallbackLineId] = useState('');
  const [fallbackLineIdTouched, setFallbackLineIdTouched] = useState(false);
  const [fallbackLineIdError, setFallbackLineIdError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fallbackInputId = useId();
  const fallbackErrorId = useId();

  const maiMaiA11yProps = useMaiMaiA11yProps();
  const safeAgentName = useMemo(() => normalizeAgentName(agentName), [agentName]);
  const isContentReady = usePanelContentReady(isOpen);

  const trimmedLineId = agentLineId?.trim() ?? '';
  const hasLineId = LINE_ID_PATTERN.test(trimmedLineId);

  useEffect(() => {
    if (isOpen) return;
    setTrustChecked(false);
    setIsSubmitting(false);
    setFallbackLineId('');
    setFallbackLineIdTouched(false);
    setFallbackLineIdError(null);
  }, [isOpen]);

  const panelReady = useDetailPanelShell({
    isOpen,
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: onClose,
  });

  usePanelWelcomeTrack({
    panelType: 'line',
    isOpen,
    hasContact: hasLineId,
  });

  const runTrustAction = useCallback(async () => {
    if (!onTrustAction) return;
    try {
      await onTrustAction(trustChecked);
    } catch (error) {
      logger.warn('[LineLinkPanel] runTrustAction failed', { error, trustChecked });
      throw error;
    }
  }, [onTrustAction, trustChecked]);

  const handleLineOpen = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await runTrustAction();

      const bareId = trimmedLineId.replace(/^@/, '');
      const lineUrl = `https://line.me/R/ti/p/${encodeURIComponent(bareId)}`;
      const newWindow = window.open(lineUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        window.location.href = lineUrl;
        notify.info('已為您開啟 LINE 連結');
      }

      void track('line_deeplink_open', { has_line_id: true });
      onClose();
    } catch {
      notify.warning('操作未完成', '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onClose, runTrustAction, trimmedLineId]);

  const handleFallback = useCallback(async () => {
    if (isSubmitting) return;

    setFallbackLineIdTouched(true);
    const validationError = validateLineIdInput(fallbackLineId);
    setFallbackLineIdError(validationError);
    if (validationError) {
      notify.warning('請先輸入有效 LINE ID', LINE_ID_ERROR_DETAIL);
      return;
    }

    setIsSubmitting(true);

    try {
      await runTrustAction();

      void track('line_deeplink_open', { has_line_id: false, user_line_id_provided: true });
      onClose();
      onFallbackContact?.(trustChecked);
    } catch {
      notify.warning('操作未完成', '請稍後再試');
    } finally {
      setIsSubmitting(false);
    }
  }, [fallbackLineId, isSubmitting, onClose, onFallbackContact, runTrustAction, trustChecked]);

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
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
        <div className="bg-gradient-to-r from-line to-line-hover p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id={titleId} className="text-lg font-bold">
                加 LINE 聊聊
              </h3>
              <p className="text-sm opacity-90">
                {hasLineId
                  ? `點擊下方按鈕，直接加入 ${safeAgentName} 的 LINE。`
                  : '經紀人尚未設定 LINE ID，可改用聯絡表單。'}
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
              data-testid="line-panel-skeleton"
              className={cn('space-y-3 rounded-xl bg-bg-base p-3', motionA11y.pulse)}
            >
              <div className="h-4 w-1/2 rounded bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-200" />
              <div className="h-11 w-full rounded-xl bg-slate-200" />
            </div>
          ) : (
            <>
              <div className="animate-in fade-in bg-brand-50/60 mb-4 flex items-center gap-3 rounded-xl p-3 duration-200 motion-reduce:transition-none">
                <MaiMaiBase mood={hasLineId ? 'wave' : 'thinking'} size="xs" {...maiMaiA11yProps} />
                <p className="text-sm text-ink-900">
                  {hasLineId ? '加 LINE 直接聊，回覆最快喔！' : '房仲還沒設定 LINE，用表單留言吧'}
                </p>
              </div>

              {hasLineId ? (
                <div className="rounded-xl border border-border bg-bg-base p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900">
                    <MessageCircle size={18} className="text-line" />
                    LINE ID: @{trimmedLineId}
                  </div>
                  <button
                    onClick={handleLineOpen}
                    disabled={isSubmitting}
                    className={cn(
                      'flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-line py-3 font-bold text-white hover:bg-line-hover disabled:cursor-not-allowed disabled:opacity-60',
                      motionA11y.transitionColors
                    )}
                  >
                    <MessageCircle size={18} />
                    開啟 LINE
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-bg-base p-4">
                  <p className="text-sm text-text-muted">
                    你仍可先送出聯絡需求，系統會通知經紀人主動與你聯繫。
                  </p>
                  <label
                    htmlFor={fallbackInputId}
                    className="mt-3 block text-sm font-medium text-ink-900"
                  >
                    你的 LINE ID
                  </label>
                  <input
                    id={fallbackInputId}
                    type="text"
                    value={fallbackLineId}
                    onChange={(event) => {
                      const nextValue = event.target.value;
                      setFallbackLineId(nextValue);
                      if (fallbackLineIdTouched) {
                        setFallbackLineIdError(validateLineIdInput(nextValue));
                      }
                    }}
                    onBlur={() => {
                      setFallbackLineIdTouched(true);
                      setFallbackLineIdError(validateLineIdInput(fallbackLineId));
                    }}
                    placeholder="例：maihouses_demo"
                    aria-invalid={Boolean(fallbackLineIdError)}
                    aria-describedby={fallbackLineIdError ? fallbackErrorId : undefined}
                    className={cn(
                      'mt-1 min-h-[44px] w-full rounded-xl border bg-bg-card px-3 text-sm text-ink-900 outline-none placeholder:text-text-muted focus:ring-2',
                      fallbackLineIdError
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-200 motion-safe:animate-shake'
                        : 'focus:ring-brand-200 border-border focus:border-brand-500',
                      motionA11y.transitionColors
                    )}
                  />
                  {fallbackLineIdError && (
                    <p id={fallbackErrorId} className="mt-1 text-sm text-red-600">
                      {fallbackLineIdError}
                    </p>
                  )}
                  <button
                    onClick={handleFallback}
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
