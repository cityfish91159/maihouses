import React, { useMemo } from "react";
import { Lead } from "../types/uag.types";
import styles from "../UAG.module.css";

export interface RadarClusterProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

/** 簡單的種子隨機數生成器，基於 lead ID 產生穩定的隨機值 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // 正規化到 0-1 範圍
  return Math.abs((Math.sin(hash) * 10000) % 1);
}

export default function RadarCluster({
  leads,
  onSelectLead,
}: RadarClusterProps) {
  const liveLeads = leads.filter((l) => l.status === "new");

  // 預先計算每個 lead 的動畫時長（基於 lead ID 產生穩定的隨機值）
  const floatDurations = useMemo(() => {
    const durations: Record<string, string> = {};
    for (const lead of liveLeads) {
      const randomOffset = seededRandom(lead.id) * 3; // 0-3 範圍
      durations[lead.id] = 5 + randomOffset + "s";
    }
    return durations;
  }, [liveLeads]);

  // 產生「等級-序號」標籤（例如 S-01, A-05）
  const leadLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    const gradeCounters: Record<string, number> = {
      S: 0,
      A: 0,
      B: 0,
      C: 0,
      F: 0,
    };

    // 依照等級排序，確保序號順序一致
    const sortedLeads = [...liveLeads].sort((a, b) => {
      const gradeOrder: Record<string, number> = {
        S: 1,
        A: 2,
        B: 3,
        C: 4,
        F: 5,
      };
      return (gradeOrder[a.grade] || 99) - (gradeOrder[b.grade] || 99);
    });

    for (const lead of sortedLeads) {
      gradeCounters[lead.grade] = (gradeCounters[lead.grade] || 0) + 1;
      const seq = String(gradeCounters[lead.grade]).padStart(2, "0");
      labels[lead.id] = `${lead.grade}-${seq}`;
    }
    return labels;
  }, [liveLeads]);

  return (
    <section
      className={`${styles["uag-card"]} ${styles["k-span-6"]}`}
      id="radar-section"
      style={{ minHeight: "450px" }}
    >
      <div className={styles["uag-card-header"]}>
        <div>
          <div className={styles["uag-card-title"]}>UAG 精準導客雷達</div>
          <div className={styles["uag-card-sub"]}>
            S/A 級獨家聯絡權｜B/C/F 級點數兌換
          </div>
        </div>
        <div className={styles["uag-actions"]} style={{ gap: "4px" }}>
          {/* Quota display is handled in parent or separate component, but for now static or passed props */}
        </div>
      </div>
      <div className={styles["uag-cluster"]} id="radar-container">
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: "300px",
            height: "300px",
            border: "1px dashed #cbd5e1",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: "150px",
            height: "150px",
            border: "1px dashed #cbd5e1",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            left: "16px",
            top: "16px",
            background: "rgba(255,255,255,0.9)",
            padding: "6px 12px",
            borderRadius: "20px",
            fontSize: "12px",
            color: "var(--ink)",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            zIndex: 5,
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              background: "#22c55e",
              borderRadius: "50%",
              display: "inline-block",
              marginRight: "4px",
            }}
          ></span>
          <span style={{ fontWeight: 700 }}>Live 監控中</span>
        </div>

        {liveLeads.map((lead) => {
          const x = lead.x != null ? lead.x : 50;
          const y = lead.y != null ? lead.y : 50;
          const size =
            lead.grade === "S"
              ? 120
              : lead.grade === "A"
                ? 100
                : lead.grade === "B"
                  ? 90
                  : lead.grade === "C"
                    ? 80
                    : 60;
          const floatDuration = floatDurations[lead.id] ?? "6s";

          return (
            <div
              key={lead.id}
              className={styles["uag-bubble"]}
              data-grade={lead.grade}
              role="button"
              aria-label={`${lead.name || lead.id} - ${lead.grade}級`}
              tabIndex={0}
              style={
                {
                  "--w": size + "px",
                  "--float": floatDuration,
                  left: x + "%",
                  top: y + "%",
                } as React.CSSProperties
              }
              onClick={() => onSelectLead(lead)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onSelectLead(lead);
                }
              }}
            >
              <div
                className={styles["uag-bubble-grade"]}
                style={{
                  background: `var(--grade-${lead.grade.toLowerCase()})`,
                  color: "#fff",
                }}
              >
                {lead.grade}
              </div>
              <div style={{ textAlign: "center", lineHeight: 1.2 }}>
                <div style={{ fontWeight: 800, fontSize: "14px" }}>
                  {leadLabels[lead.id] || lead.grade}
                </div>
                <div style={{ fontSize: "11px", color: "var(--ink-300)" }}>
                  {lead.intent}%
                </div>
              </div>
              <div className={styles["uag-bubble-label"]}>{lead.prop}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
