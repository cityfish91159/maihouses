import React, { forwardRef } from 'react';
import { Lead } from '../mockData';
import styles from '../UAG.module.css';

interface ActionPanelProps {
  selectedLead: Lead | null;
  onBuyLead: (leadId: string) => void;
  isProcessing: boolean;
}

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
          <span className={`${styles['uag-badge']} ${styles[selectedLead.grade.toLowerCase()]}`}>{selectedLead.grade}級｜{selectedLead.name}</span>
        </div>
        <div className={styles['ap-body']}>
          <div className={styles['ap-stats-group']}>
            <div className={styles['ap-stat']}><span>關注房源</span><b>{selectedLead.prop}</b></div>
            <div className={styles['ap-stat']}><span>意向分數</span><b style={{ color: 'var(--uag-brand)' }}>{selectedLead.intent}%</b></div>
            <div className={styles['ap-stat']}><span>瀏覽次數</span><b>{selectedLead.visit} 次</b></div>
            <div className={styles['ap-stat']}><span>購買成本</span><b>{selectedLead.price} 點</b></div>
          </div>

          <div className={`${styles['ai-box']} ${styles['urgent']}`}>
            <div>{selectedLead.ai}</div>
          </div>

          <div className={styles['action-zone']}>
            {isExclusive && (
              <div style={{ background: '#fff7ed', color: '#ea580c', fontWeight: 700, fontSize: '12px', textAlign: 'center', padding: '6px', borderRadius: '4px', border: '1px solid #ffedd5', marginBottom: '10px' }}>
                ✨ 此客戶包含獨家聯絡權 ✨
              </div>
            )}
            <button
              className={styles['btn-attack']}
              onClick={() => onBuyLead(selectedLead.id)}
              disabled={isProcessing}
            >
              {isProcessing ? '處理中...' : '🚀 立即購買聯絡'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>符合個資法規範</div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default ActionPanel;
