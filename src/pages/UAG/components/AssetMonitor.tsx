import { Lead, NotificationStatus } from "../types/uag.types";
import styles from "../UAG.module.css";
import { GRADE_PROTECTION_HOURS } from "../uag-config";

interface AssetMonitorProps {
  readonly leads: Lead[];
  // 修8/修9: 動態按鈕回調（optional，待實作）
  readonly onSendMessage?: (lead: Lead) => void;
  readonly onViewChat?: (conversationId: string) => void;
}

const calculateProtection = (lead: Lead) => {
  const total = GRADE_PROTECTION_HOURS[lead.grade] ?? 336;
  const remaining = lead.remainingHours ?? total;
  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isExclusive = lead.grade === "S" || lead.grade === "A";

  let timeDisplay = "";
  if (isExclusive) {
    timeDisplay = `${remaining.toFixed(1)} 小時`;
  } else {
    const days = (remaining / 24).toFixed(1);
    timeDisplay = `${days} 天`;
  }

  return { total, remaining, percent, isExclusive, timeDisplay };
};

interface NotificationDisplay {
  text: string;
  bgColor: string;
  textColor: string;
}

/**
 * 根據通知狀態返回顯示配置
 */
const getNotificationDisplay = (
  status: NotificationStatus | undefined,
): NotificationDisplay => {
  switch (status) {
    case "sent":
      return {
        text: "LINE + 站內信",
        bgColor: "var(--notif-success-bg)",
        textColor: "var(--notif-success-text)",
      };
    case "no_line":
      return {
        text: "僅站內信",
        bgColor: "var(--bg-alt)",
        textColor: "var(--ink-300)",
      };
    case "unreachable":
      return {
        text: "LINE 無法送達",
        bgColor: "var(--notif-warning-bg)",
        textColor: "var(--notif-warning-text)",
      };
    case "pending":
      return {
        text: "待發送",
        bgColor: "var(--notif-pending-bg)",
        textColor: "var(--notif-pending-text)",
      };
    case "failed":
      return {
        text: "LINE 發送失敗",
        bgColor: "var(--notif-error-bg)",
        textColor: "var(--notif-error-text)",
      };
    case "skipped":
      return {
        text: "僅站內信",
        bgColor: "var(--bg-alt)",
        textColor: "var(--ink-300)",
      };
    default:
      // 預設：尚未發送或舊資料
      return {
        text: "站內信已發送",
        bgColor: "var(--notif-success-bg)",
        textColor: "var(--notif-success-text)",
      };
  }
};

export default function AssetMonitor({
  leads,
  onSendMessage,
  onViewChat,
}: AssetMonitorProps) {
  const boughtLeads = leads.filter((l) => l.status === "purchased");

  return (
    <section className={`${styles["uag-card"]} ${styles["k-span-6"]}`}>
      <div className={styles["uag-card-header"]}>
        <div>
          <div className={styles["uag-card-title"]}>已購客戶資產與保護監控</div>
          <div className={styles["uag-card-sub"]}>
            S 級 72hr / A 級 48hr 獨家倒數｜B 級 24hr / C 級 12hr 去重
          </div>
        </div>
        <div className={styles["uag-actions"]}>
          <button className={styles["uag-btn"]}>匯出報表</button>
        </div>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table className={styles["monitor-table"]}>
          <thead>
            <tr>
              <th style={{ width: "25%" }}>客戶等級/名稱</th>
              <th style={{ width: "35%" }}>保護期倒數</th>
              <th style={{ width: "20%" }}>目前狀態</th>
              <th style={{ width: "20%" }}>操作</th>
            </tr>
          </thead>
          <tbody id="asset-list">
            {boughtLeads.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "var(--ink-400)",
                  }}
                >
                  尚無已購資產，請從上方雷達進攻。
                </td>
              </tr>
            ) : (
              boughtLeads.map((lead) => {
                const { percent, isExclusive, timeDisplay } =
                  calculateProtection(lead);
                const colorVar = `var(--grade-${lead.grade.toLowerCase()})`;
                const protectText = isExclusive ? "獨家鎖定中" : "去重保護中";

                return (
                  <tr key={lead.id}>
                    <td data-label="客戶等級/名稱">
                      <div style={{ display: "flex", alignItems: "center" }}>
                        <span
                          style={{
                            display: "inline-grid",
                            placeItems: "center",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            fontSize: "11px",
                            fontWeight: 900,
                            color: "var(--bg-card)",
                            marginRight: "8px",
                            background: colorVar,
                          }}
                        >
                          {lead.grade}
                        </span>
                        <div>
                          <div
                            style={{ fontWeight: 800, color: "var(--ink-100)" }}
                          >
                            {lead.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--ink-300)",
                            }}
                          >
                            {lead.prop}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td data-label="保護期倒數">
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          marginBottom: "2px",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span style={{ color: colorVar }}>{protectText}</span>
                        <span className={styles["t-countdown"]}>
                          {timeDisplay}
                        </span>
                      </div>
                      <div className={styles["progress-bg"]}>
                        <div
                          className={styles["progress-fill"]}
                          style={{ width: `${percent}%`, background: colorVar }}
                        ></div>
                      </div>
                    </td>
                    <td data-label="目前狀態">
                      {(() => {
                        const display = getNotificationDisplay(
                          lead.notification_status,
                        );
                        return (
                          <span
                            className={styles["uag-badge"]}
                            style={{
                              background: display.bgColor,
                              color: display.textColor,
                              border: "none",
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
                          className={`${styles["uag-btn"]} ${styles["secondary"]}`}
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
                          className={`${styles["uag-btn"]} ${styles["primary"]} ${styles["small"]}`}
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
