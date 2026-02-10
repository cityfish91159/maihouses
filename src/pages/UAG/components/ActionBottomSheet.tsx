import { useEffect, useRef } from 'react';
import { MousePointerClick, Sparkles, Rocket, Coins, X, Loader2 } from 'lucide-react';
import type { Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { isExclusiveLead } from '../utils/leadHelpers';

export interface ActionBottomSheetProps {
  readonly lead: Lead | null;
  readonly onClose: () => void;
  readonly onPurchase: (leadId: string) => void;
  readonly isConfirming: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly isPurchasing: boolean;
}

/**
 * M3: ActionPanel → Bottom Sheet (手機版)
 * 點擊 Radar 泡泡後,ActionPanel 從底部滑出,避免用戶向下滾動
 * 規範引用: ux-guidelines #30 (手勢互動)、#7 (動畫 150-300ms)、#9 (prefers-reduced-motion)
 */
export default function ActionBottomSheet({
  lead,
  onClose,
  onPurchase,
  isConfirming,
  onConfirm,
  onCancel,
  isPurchasing,
}: ActionBottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (lead) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [lead]);

  // ESC key to close
  useEffect(() => {
    if (!lead) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lead, onClose]);

  if (!lead) return null;

  const isExclusive = isExclusiveLead(lead);

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className={`${styles['action-sheet-overlay']} ${styles.open}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`${styles['action-sheet']} ${styles.open}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-sheet-title"
      >
        {/* Drag handle */}
        <div className={styles['action-sheet-handle']} aria-hidden="true" />

        {/* Content */}
        <div className={styles['action-sheet-content']}>
          {/* Header */}
          <div className={styles['ap-head']} id="action-sheet-title">
            <span
              className={`${styles['uag-badge']} ${styles['uag-badge--' + lead.grade.toLowerCase()]}`}
            >
              {lead.grade}級｜{lead.name}
            </span>
          </div>

          {/* Stats */}
          <div className={styles['ap-stats-group']}>
            <div className={styles['ap-stat']}>
              <span>關注房源</span>
              <b>{lead.prop}</b>
            </div>
            <div className={styles['ap-stat']}>
              <span>意向分數</span>
              <b style={{ color: 'var(--uag-brand)' }}>{lead.intent}%</b>
            </div>
            <div className={styles['ap-stat']}>
              <span>瀏覽次數</span>
              <b>{lead.visit} 次</b>
            </div>
            <div className={styles['ap-stat']}>
              <span>購買成本</span>
              <b>{lead.price} 點</b>
            </div>
          </div>

          {/* AI Analysis */}
          <div className={`${styles['ai-box']} ${styles.urgent}`}>
            <div>{lead.ai}</div>
          </div>
        </div>

        {/* CTA (Sticky) */}
        <div className={styles['action-sheet-cta']}>
          {isExclusive && (
            <div className={styles['action-sheet-exclusive-badge']}>
              <Sparkles size={14} />
              此客戶包含獨家訊息聯絡權
              <Sparkles size={14} />
            </div>
          )}

          {!isConfirming ? (
            <button
              className={styles['btn-attack']}
              onClick={() => onPurchase(lead.id)}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                '處理中...'
              ) : (
                <>
                  <Rocket size={18} />
                  獲取聯絡權限 (LINE/站內信)
                </>
              )}
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                className={`${styles['btn-attack']} ${styles['btn-confirm']}`}
                onClick={onConfirm}
                disabled={isPurchasing}
              >
                {isPurchasing ? (
                  <>
                    <Loader2 size={16} className={styles.spin} />
                    處理中...
                  </>
                ) : (
                  <>
                    <Coins size={16} />
                    確定花費 {lead.price} 點
                  </>
                )}
              </button>
              <button
                className={`${styles['btn-attack']} ${styles['btn-cancel']}`}
                onClick={onCancel}
                disabled={isPurchasing}
              >
                <X size={16} />
                取消
              </button>
            </div>
          )}

          <div className={styles['action-sheet-disclaimer']}>
            符合個資法規範:僅能以 LINE/站內信聯繫
            <br />
            系統將透過 LINE 通知客戶
          </div>
        </div>
      </div>
    </>
  );
}
