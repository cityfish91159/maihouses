import React, { forwardRef, useState, useRef } from 'react';
import { MousePointerClick, Sparkles, Rocket, Coins, X, Loader2 } from 'lucide-react';
import { Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { isExclusiveLead } from '../utils/leadHelpers';

export interface ActionPanelProps {
  selectedLead: Lead | null;
  onBuyLead: (leadId: string) => void;
  isProcessing: boolean;
  purchaseResult?: 'success' | 'error' | null;
}

const StatItem = ({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) => (
  <div className={styles['ap-stat']}>
    <span>{label}</span>
    <b className={highlight ? styles['ap-stat-highlight'] : undefined}>{value}</b>
  </div>
);

const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(
  ({ selectedLead, onBuyLead, isProcessing, purchaseResult }, ref) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const prevLeadIdRef = useRef<string | null>(null);

    // Reset confirmation state when lead changes (at render time, not in effect)
    const currentLeadId = selectedLead?.id ?? null;
    if (currentLeadId !== prevLeadIdRef.current) {
      prevLeadIdRef.current = currentLeadId;
      if (isConfirming) {
        setIsConfirming(false);
      }
    }

    if (!selectedLead) {
      return (
        <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
          <div className={styles['uag-action-panel']} id="action-panel">
            <div className={styles['ap-empty-state']}>
              <div>
                <MousePointerClick size={40} strokeWidth={1.5} className={styles['ap-empty-icon']} />
                <div>
                  請點擊上方雷達泡泡
                  <br />
                  查看分析與購買
                </div>
              </div>
            </div>
          </div>
        </section>
      );
    }

    const isExclusive = isExclusiveLead(selectedLead);

    const handleBuyClick = () => {
      setIsConfirming(true);
    };

    const handleConfirm = () => {
      onBuyLead(selectedLead.id);
      setIsConfirming(false);
    };

    const handleCancel = () => {
      setIsConfirming(false);
    };

    const panelClasses = [
      styles['uag-action-panel'],
      purchaseResult === 'success' ? styles['animate-success'] : '',
      purchaseResult === 'error' ? styles['animate-shake'] : '',
    ].filter(Boolean).join(' ');

    return (
      <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
        <div className={panelClasses} id="action-panel">
          <div className={styles['ap-head']}>
            <span
              className={`${styles['uag-badge']} ${styles['uag-badge--' + selectedLead.grade.toLowerCase()]}`}
            >
              {selectedLead.grade}級｜{selectedLead.name}
            </span>
          </div>
          <div className={styles['ap-body']}>
            <div className={styles['ap-stats-group']}>
              <StatItem label="關注房源" value={selectedLead.prop} />
              <StatItem label="意向分數" value={`${selectedLead.intent}%`} highlight />
              <StatItem label="瀏覽次數" value={`${selectedLead.visit} 次`} />
              <StatItem label="購買成本" value={`${selectedLead.price} 點`} />
            </div>

            <div className={`${styles['ai-box']} ${styles['urgent']}`}>
              <div>{selectedLead.ai}</div>
            </div>

            <div className={styles['action-zone']}>
              {isExclusive && (
                <div className={styles['ap-exclusive-banner']}>
                  <Sparkles size={14} />
                  此客戶包含獨家訊息聯絡權
                  <Sparkles size={14} />
                </div>
              )}

              {!isConfirming ? (
                <button
                  className={styles['btn-attack']}
                  onClick={handleBuyClick}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    '處理中...'
                  ) : (
                    <>
                      <Rocket size={18} />
                      獲取聯絡權限 (LINE/站內信)
                    </>
                  )}
                </button>
              ) : (
                <div className={styles['ap-confirm-actions']}>
                  <button
                    className={`${styles['btn-attack']} ${styles['btn-confirm']}`}
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className={styles['spin']} />
                        處理中...
                      </>
                    ) : (
                      <>
                        <Coins size={16} />
                        確定花費 {selectedLead.price} 點
                      </>
                    )}
                  </button>
                  <button
                    className={`${styles['btn-attack']} ${styles['btn-cancel']}`}
                    onClick={handleCancel}
                    disabled={isProcessing}
                  >
                    <X size={16} />
                    取消
                  </button>
                </div>
              )}

              <div className={styles['ap-privacy-note']}>
                符合個資法規範：僅能以 LINE/站內信聯繫
                <br />
                系統將透過 LINE 通知客戶
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }
);

export default ActionPanel;
