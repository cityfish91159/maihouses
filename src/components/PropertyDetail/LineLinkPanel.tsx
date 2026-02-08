import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { notify } from '../../lib/notify';
import { track } from '../../analytics/track';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { cn } from '../../lib/utils';
import { motionA11y } from '../../lib/motionA11y';
import { TrustAssureHint } from './TrustAssureHint';
import { LINE_BRAND_GREEN, LINE_BRAND_GREEN_HOVER, LINE_ID_PATTERN } from './constants';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const firstButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const fallbackInputId = useId();

  const lineBrandVars = {
    '--line-brand-green': LINE_BRAND_GREEN,
    '--line-brand-green-hover': LINE_BRAND_GREEN_HOVER,
  } as CSSProperties;

  // LINE ID: trim 後驗證 pattern，不合法視同無 lineId
  const trimmedLineId = agentLineId?.trim() ?? '';
  const hasLineId = LINE_ID_PATTERN.test(trimmedLineId);

  // isOpen 變 false 時重置狀態
  useEffect(() => {
    if (isOpen) return;
    setTrustChecked(false);
    setIsSubmitting(false);
    setFallbackLineId('');
  }, [isOpen]);

  useFocusTrap({
    containerRef: modalRef,
    initialFocusRef: firstButtonRef,
    onEscape: onClose,
    isActive: isOpen,
  });

  const runTrustAction = useCallback(async () => {
    if (!onTrustAction) return;
    await onTrustAction(trustChecked);
  }, [onTrustAction, trustChecked]);

  const handleLineOpen = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await runTrustAction();

      const lineUrl = `https://line.me/R/ti/p/${trimmedLineId}`;
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
  }, [isSubmitting, trimmedLineId, onClose, runTrustAction]);

  const handleFallback = useCallback(async () => {
    if (isSubmitting) return;
    const normalizedInputLineId = fallbackLineId.trim();
    if (!LINE_ID_PATTERN.test(normalizedInputLineId)) {
      notify.warning('請先輸入有效 LINE ID', '可使用英數、底線、點、連字號（3-64 字元）。');
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
      role="presentation"
      className="fixed inset-0 z-modal flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={lineBrandVars}
        className="w-full max-w-md rounded-2xl bg-bg-card shadow-2xl"
      >
        {/* Header - LINE 品牌漸層 */}
        <div className="bg-gradient-to-r from-[var(--line-brand-green)] to-[var(--line-brand-green-hover)] p-4 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 id={titleId} className="text-lg font-bold">
                加 LINE 聊聊
              </h3>
              <p className="text-sm opacity-90">
                {hasLineId
                  ? `點擊下方按鈕，直接加入 ${agentName} 的 LINE。`
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

        {/* Content */}
        <div className="p-4">
          {hasLineId ? (
            <div className="rounded-xl border border-border bg-bg-base p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-900">
                <MessageCircle size={18} className="text-[var(--line-brand-green)]" />
                LINE ID: @{trimmedLineId}
              </div>
              <button
                onClick={handleLineOpen}
                disabled={isSubmitting}
                className={cn(
                  'flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--line-brand-green)] py-3 font-bold text-white hover:bg-[var(--line-brand-green-hover)] disabled:cursor-not-allowed disabled:opacity-60',
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
                onChange={(e) => setFallbackLineId(e.target.value)}
                placeholder="例：maihouses_demo"
                className={cn(
                  'focus:ring-brand-200 mt-1 min-h-[44px] w-full rounded-xl border border-border bg-bg-card px-3 text-sm text-ink-900 outline-none placeholder:text-text-muted focus:border-brand-500 focus:ring-2',
                  motionA11y.transitionColors
                )}
              />
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
        </div>
      </div>
    </div>
  );
}
