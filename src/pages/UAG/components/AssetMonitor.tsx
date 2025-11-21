import React from 'react';
import { Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { GRADE_HOURS } from '../uag-config';

interface AssetMonitorProps {
  leads: Lead[];
}

const calculateProtection = (lead: Lead) => {
  const total = GRADE_HOURS[lead.grade] ?? 336;
  const remaining = lead.remainingHours != null ? lead.remainingHours : total;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isExclusive = (lead.grade === 'S' || lead.grade === 'A');
  
  let timeDisplay = '';
  if (isExclusive) {
    timeDisplay = `${remaining.toFixed(1)} 小時`;
  } else {
    const days = (remaining / 24).toFixed(1);
    timeDisplay = `${days} 天`;
  }

  return { total, remaining, percent, isExclusive, timeDisplay };
};

export default function AssetMonitor({ leads }: AssetMonitorProps) {
  const boughtLeads = leads.filter(l => l.status === 'purchased');

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-6']}`}>
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>已購客戶資產與保護監控</div>
          <div className={styles['uag-card-sub']}>S 級 120hr / A 級 72hr 獨家倒數｜B/C/F 級 14 天防撞</div>
        </div>
        <div className={styles['uag-actions']}><button className={styles['uag-btn']}>匯出報表</button></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className={styles['monitor-table']}>
          <thead>
            <tr>
              <th style={{ width: '25%' }}>客戶等級/名稱</th>
              <th style={{ width: '35%' }}>保護期倒數</th>
              <th style={{ width: '20%' }}>目前狀態</th>
              <th style={{ width: '20%' }}>操作</th>
            </tr>
          </thead>
          <tbody id="asset-list">
            {boughtLeads.length === 0 ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>尚無已購資產，請從上方雷達進攻。</td></tr>
            ) : (
              boughtLeads.map(lead => {
                const { percent, isExclusive, timeDisplay } = calculateProtection(lead);
                const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;
                const protectText = isExclusive ? '獨家鎖定中' : '去重保護中';

                return (
                  <tr key={lead.id}>
                    <td data-label="客戶等級/名稱">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-grid', placeItems: 'center', width: '24px', height: '24px', borderRadius: '50%', fontSize: '11px', fontWeight: 900, color: '#fff', marginRight: '8px', background: colorVar }}>{lead.grade}</span>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--ink-100)' }}>{lead.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--ink-300)' }}>{lead.prop}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="保護期倒數">
                      <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: colorVar }}>{protectText}</span>
                        <span className={styles['t-countdown']}>{timeDisplay}</span>
                      </div>
                      <div className={styles['progress-bg']}><div className={styles['progress-fill']} style={{ width: `${percent}%`, background: colorVar }}></div></div>
                    </td>
                    <td data-label="目前狀態"><span className={styles['uag-badge']} style={{ background: '#f0fdf4', color: '#16a34a', border: 'none' }}>簡訊已發送</span></td>
                    <td data-label="操作"><button className={`${styles['uag-btn']} ${styles['primary']}`} style={{ padding: '4px 12px', fontSize: '12px' }}>寫紀錄 / 預約</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
