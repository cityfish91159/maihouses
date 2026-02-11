import { Lead } from '../types/uag.types';
import styles from '../UAG.module.css';
import { calculateProtectionInfo, getProtectionText } from '../utils/leadHelpers';
import { getNotificationDisplay } from '../utils/notificationDisplay';

interface AssetMonitorProps {
  readonly leads: Lead[];
  // 修8/修9: 動態按鈕回調（optional，待實作）
  readonly onSendMessage?: (lead: Lead) => void;
  readonly onViewChat?: (conversationId: string) => void;
}

export default function AssetMonitor({ leads, onSendMessage, onViewChat }: AssetMonitorProps) {
  const boughtLeads = leads.filter((l) => l.status === 'purchased');

  return (
    <section className={`${styles['uag-card']} ${styles['k-span-6']}`} id="asset-monitor-container">
      <div className={styles['uag-card-header']}>
        <div>
          <div className={styles['uag-card-title']}>已購客戶資產與保護監控</div>
          <div className={styles['uag-card-sub']}>
            S 級 72hr / A 級 48hr 獨家倒數｜B 級 24hr / C 級 12hr 去重
          </div>
        </div>
        <div className={styles['uag-actions']}>
          <button className={styles['uag-btn']}>匯出報表</button>
        </div>
      </div>
      <div className={styles['asset-monitor-scroll']}>
        <table className={styles['monitor-table']}>
          <thead>
            <tr>
              <th className={styles['monitor-col-25']}>客戶等級/名稱</th>
              <th className={styles['monitor-col-35']}>保護期倒數</th>
              <th className={styles['monitor-col-20']}>目前狀態</th>
              <th className={styles['monitor-col-20']}>操作</th>
            </tr>
          </thead>
          <tbody id="asset-list">
            {boughtLeads.length === 0 ? (
              <tr>
                <td colSpan={4} className={styles['monitor-empty-state']}>
                  尚無已購資產，請從上方雷達進攻。
                </td>
              </tr>
            ) : (
              boughtLeads.map((lead) => {
                const { percent, timeDisplay } = calculateProtectionInfo(lead);
                const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;
                const protectText = getProtectionText(lead);
                const gradeClass =
                  styles[`lead-grade-${lead.grade.toLowerCase()}`] ?? styles['lead-grade-f'];

                return (
                  <tr key={lead.id}>
                    <td data-label="客戶等級/名稱">
                      <div className={styles['lead-identity-row']}>
                        {/* 工單 6: 等級徽章圓角優化 */}
                        {/* 規則: html-tailwind.csv Row 38 - Card structure */}
                        {/* Code: rounded-lg (8px) 風格，避免圓形 AI 感 */}
                        <span className={`${styles['lead-grade-pill']} ${gradeClass}`}>
                          {lead.grade}
                        </span>
                        <div>
                          <div className={styles['lead-name']}>{lead.name}</div>
                          <div className={styles['lead-prop']}>{lead.prop}</div>
                        </div>
                      </div>
                    </td>
                    <td data-label="保護期倒數">
                      <div className={styles['protect-meta-row']}>
                        <span style={{ color: colorVar }}>{protectText}</span>
                        <span className={styles['t-countdown']}>{timeDisplay}</span>
                      </div>
                      <div className={styles['progress-bg']}>
                        <div
                          className={styles['progress-fill']}
                          style={{ width: `${percent}%`, background: colorVar }}
                        ></div>
                      </div>
                    </td>
                    <td data-label="目前狀態">
                      {(() => {
                        const display = getNotificationDisplay(lead.notification_status);
                        return (
                          <span
                            className={styles['uag-badge']}
                            style={{
                              background: display.bgColor,
                              color: display.textColor,
                              border: 'none',
                            }}
                          >
                            {display.text}
                          </span>
                        );
                      })()}
                    </td>
                    <td data-label="操作">
                      {lead.conversation_id ? (
                        <button
                          className={`${styles['uag-btn']} ${styles['secondary']}`}
                          onClick={() => {
                            if (lead.conversation_id) {
                              onViewChat?.(lead.conversation_id);
                            }
                          }}
                        >
                          查看對話
                        </button>
                      ) : (
                        <button
                          className={`${styles['uag-btn']} ${styles['primary']} ${styles['small']}`}
                          onClick={() => onSendMessage?.(lead)}
                        >
                          發送訊息
                        </button>
                      )}
                    </td>
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
