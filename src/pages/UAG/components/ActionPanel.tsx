import React, { forwardRef } from 'react';
import { Lead } from '../mockData';
import styles from '../UAG.module.css';

export interface ActionPanelProps {
  selectedLead: Lead | null;
  onBuyLead: (leadId: string) => void;
  isProcessing: boolean;
}

const StatItem = ({ label, value, highlight = false }: { label: string; value: React.ReactNode; highlight?: boolean }) => (
  <div className={styles['ap-stat']}>
    <span>{label}</span>
    <b style={highlight ? { color: 'var(--uag-brand)' } : {}}>{value}</b>
  </div>
);

const ActionPanel = forwardRef<HTMLDivElement, ActionPanelProps>(({ selectedLead, onBuyLead, isProcessing }, ref) => {
  if (!selectedLead) {
    return (
      <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
        <div className={styles['uag-action-panel']} id="action-panel">
          <div style={{ height: '100%', minHeight: '200px', display: 'grid', placeItems: 'center', color: 'var(--ink-300)', textAlign: 'center', padding: '40px 20px' }}>
            <div>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>👆</div>
              <div>請點擊上方雷達泡泡<br />查看分析與購買</div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const isExclusive = (selectedLead.grade === 'S' || selectedLead.grade === 'A');

  return (
    <section className={styles['k-span-6']} id="action-panel-container" ref={ref}>
      <div className={styles['uag-action-panel']} id="action-panel">
        <div className={styles['ap-head']}>
          <span className={`${styles['uag-badge']} ${styles['uag-badge--' + selectedLead.grade.toLowerCase()]}`}>{selectedLead.grade}級｜{selectedLead.name}</span>
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
              <div style={{ background: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '12px', textAlign: 'center', padding: '6px', borderRadius: '4px', border: '1px solid #ffedd5', marginBottom: '10px' }}>
                ✨ 此客戶包含獨家訊息聯絡權 ✨
              </div>
            )}
            <button
              className={styles['btn-attack']}
              onClick={() => onBuyLead(selectedLead.id)}
              disabled={isProcessing}
            >
              {isProcessing ? '處理中...' : '🚀 獲取聯絡權限 (簡訊/站內信)'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
              符合個資法規範：僅能以簡訊/站內信聯繫<br />
              系統將自動發送您的名片與電話給客戶
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ActionPanel;
