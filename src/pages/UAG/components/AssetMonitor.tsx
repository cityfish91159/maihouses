import { Lead } from "../types/uag.types";
import styles from "../UAG.module.css";
import { GRADE_PROTECTION_HOURS } from "../uag-config";

interface AssetMonitorProps {
  readonly leads: Lead[];
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

type NotificationStatus =
  | "sent"
  | "no_line"
  | "unreachable"
  | "pending"
  | "failed"
  | "skipped";

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
        bgColor: "#f0fdf4",
        textColor: "#16a34a",
      };
    case "no_line":
      return {
        text: "僅站內信",
        bgColor: "var(--ink-500)",
        textColor: "var(--ink-100)",
      };
    case "unreachable":
      return {
        text: "LINE 無法送達",
        bgColor: "#fff7ed",
        textColor: "#ea580c",
      };
    case "pending":
      return {
        text: "待發送",
        bgColor: "#fefce8",
        textColor: "#ca8a04",
      };
    case "failed":
      return {
        text: "LINE 發送失敗",
        bgColor: "#fef2f2",
        textColor: "#dc2626",
      };
    case "skipped":
      return {
        text: "僅站內信",
        bgColor: "var(--ink-500)",
        textColor: "var(--ink-100)",
      };
    default:
      // 預設：尚未發送或舊資料
      return {
        text: "站內信已發送",
        bgColor: "#f0fdf4",
        textColor: "#16a34a",
      };
  }
};

export default function AssetMonitor({ leads }: AssetMonitorProps) {
  const boughtLeads = leads.filter((l) => l.status === "purchased");

  return (
    <section className={`${styles["uag-card"]} ${styles["k-span-6"]}`}>
      <div className={styles["uag-card-header"]}>
        <div>
          <div className={styles["uag-card-title"]}>已購客戶資產與保護監控</div>
          <div className={styles["uag-card-sub"]}>
            S 級 120hr / A 級 72hr 獨家倒數｜B/C/F 級 14 天防撞
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
                    color: "#94a3b8",
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
                            color: "#fff",
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
                        const notifStatus = (lead as Record<string, unknown>)
                          .notification_status as
                          | NotificationStatus
                          | undefined;
                        const display = getNotificationDisplay(notifStatus);
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
                      <button
                        className={`${styles["uag-btn"]} ${styles["primary"]}`}
                        style={{ padding: "4px 12px", fontSize: "12px" }}
                      >
                        寫紀錄 / 預約
                      </button>
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
