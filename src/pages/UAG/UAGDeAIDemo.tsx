/**
 * UAG De-AI Demo Page
 *
 * 完整示範去除 AI 感的 UAG 頁面設計
 *
 * 基於 ui-ux-pro-max 資料庫：
 * 1. Style: Minimalism & Swiss Style
 * 2. Typography: Corporate Trust (Lexend + Source Sans 3)
 * 3. Color: Brand #00385a + Swiss monochromatic
 * 4. UX: hover:bg-gray-100 cursor-pointer, 200-250ms transitions
 */

import React, { useState } from "react";
import styles from "./UAG-deai-demo.module.css";
import RadarClusterDeAI from "./components/RadarClusterDeAI";
import type { Lead } from "./types/uag.types";

// Mock data for demo - 符合 Lead 類型的完整資料
const mockLeads: Lead[] = [
  {
    id: "lead-001",
    session_id: "session-001",
    grade: "S",
    intent: 92,
    prop: "捷運共構 3 房",
    status: "new",
    x: 35,
    y: 35,
    name: "張先生",
    visit: 8,
    price: 1500,
    ai: "高意向客戶，近期有強烈購屋需求",
  },
  {
    id: "lead-002",
    session_id: "session-002",
    grade: "S",
    intent: 88,
    prop: "惠宇上晴 12F",
    status: "new",
    x: 22,
    y: 50,
    name: "李小姐",
    visit: 6,
    price: 1800,
    ai: "關注高樓層物件，預算充裕",
  },
  {
    id: "lead-003",
    session_id: "session-003",
    grade: "S",
    intent: 94,
    prop: "京城豪景",
    status: "new",
    x: 48,
    y: 42,
    name: "王先生",
    visit: 12,
    price: 2200,
    ai: "豪宅客群，多次瀏覽高價物件",
  },
  {
    id: "lead-004",
    session_id: "session-004",
    grade: "S",
    intent: 90,
    prop: "預售捷運宅",
    status: "new",
    x: 68,
    y: 55,
    name: "陳小姐",
    visit: 7,
    price: 1200,
    ai: "首購族，偏好交通便利區域",
  },
  {
    id: "lead-005",
    session_id: "session-005",
    grade: "A",
    intent: 69,
    prop: "公園首排",
    status: "new",
    x: 60,
    y: 28,
    name: "林先生",
    visit: 4,
    price: 1600,
    ai: "重視生活品質，偏好綠地環境",
  },
  {
    id: "lead-006",
    session_id: "session-006",
    grade: "A",
    intent: 75,
    prop: "南屯學區宅",
    status: "new",
    x: 72,
    y: 38,
    name: "黃小姐",
    visit: 5,
    price: 1400,
    ai: "家庭客群，學區為首要考量",
  },
  {
    id: "lead-007",
    session_id: "session-007",
    grade: "A",
    intent: 71,
    prop: "次高樓層 3 房",
    status: "new",
    x: 82,
    y: 45,
    name: "吳先生",
    visit: 3,
    price: 1350,
    ai: "換屋族，需要較大空間",
  },
  {
    id: "lead-008",
    session_id: "session-008",
    grade: "B",
    intent: 62,
    prop: "捷運生活圈",
    status: "new",
    x: 52,
    y: 58,
    name: "鄭小姐",
    visit: 2,
    price: 900,
    ai: "通勤族，交通便利優先",
  },
  {
    id: "lead-009",
    session_id: "session-009",
    grade: "B",
    intent: 58,
    prop: "小坪數投資宅",
    status: "new",
    x: 38,
    y: 62,
    name: "周先生",
    visit: 3,
    price: 600,
    ai: "投資客，關注租金報酬率",
  },
  {
    id: "lead-010",
    session_id: "session-010",
    grade: "C",
    intent: 48,
    prop: "老屋翻新",
    status: "new",
    x: 85,
    y: 58,
    name: "許小姐",
    visit: 1,
    price: 500,
    ai: "觀望中，偶爾瀏覽",
  },
  {
    id: "lead-011",
    session_id: "session-011",
    grade: "C",
    intent: 42,
    prop: "套房",
    status: "new",
    x: 88,
    y: 65,
    name: "蔡先生",
    visit: 1,
    price: 350,
    ai: "預算有限，尚在比較階段",
  },
  {
    id: "lead-012",
    session_id: "session-012",
    grade: "F",
    intent: 22,
    prop: "套房出租",
    status: "new",
    x: 62,
    y: 72,
    name: "劉小姐",
    visit: 0,
    price: 200,
    ai: "低意向，可能是租屋需求",
  },
  {
    id: "lead-013",
    session_id: "session-013",
    grade: "F",
    intent: 28,
    prop: "小坪數",
    status: "new",
    x: 75,
    y: 68,
    name: "謝先生",
    visit: 0,
    price: 280,
    ai: "低意向，尚未有明確需求",
  },
];

export default function UAGDeAIDemo() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
  };

  return (
    <div className={styles["deai-page"]}>
      {/* Header - Swiss Style: clean, minimal */}
      <header className={styles["deai-header"]}>
        <div className={styles["deai-header-inner"]}>
          {/* Logo area */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "6px",
                background: "var(--brand-primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--swiss-white)",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              M
            </div>
            <span
              style={{
                fontFamily: "Lexend, sans-serif",
                fontWeight: 600,
                fontSize: "18px",
                color: "#0A2246",
              }}
            >
              邁房子
            </span>
          </div>

          {/* Navigation */}
          <nav style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className={styles["deai-badge"]}
              style={{
                background: "var(--brand-primary)",
                color: "var(--swiss-white)",
                border: "none",
              }}
            >
              UAG 客戶雷達
            </span>
            <span style={{ color: "var(--swiss-gray-400)" }}>·</span>
            <span style={{ fontSize: "13px", color: "var(--swiss-gray-500)" }}>
              邁房子
            </span>
            <span style={{ color: "var(--swiss-gray-400)" }}>·</span>
            <span className={styles["deai-badge"]}>專業版 PRO</span>
          </nav>

          {/* User info placeholder */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "13px", color: "var(--swiss-gray-500)" }}>
              游杰倫
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: "var(--brand-primary)",
                color: "var(--swiss-white)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "12px",
              }}
            >
              游
            </div>
          </div>
        </div>
      </header>

      {/* Agent Bar */}
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "8px 24px",
          background: "rgba(0, 56, 90, 0.03)",
          borderBottom: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "var(--brand-primary)",
            color: "var(--swiss-white)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          游
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#0A2246",
            }}
          >
            游杰倫
            <span
              style={{
                fontSize: "11px",
                color: "var(--brand-primary)",
                fontWeight: 600,
              }}
            >
              #12345
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              fontSize: "11px",
              color: "var(--swiss-gray-500)",
              marginTop: "2px",
            }}
          >
            <span>
              <strong style={{ color: "#059669" }}>92</strong> 信任分
            </span>
            <span>
              <strong style={{ color: "#0A2246" }}>45</strong> 帶看
            </span>
            <span>
              <strong style={{ color: "#0A2246" }}>8</strong> 成交
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "24px",
          display: "grid",
          gridTemplateColumns: "1fr 380px",
          gap: "24px",
        }}
      >
        {/* Radar Cluster */}
        <RadarClusterDeAI leads={mockLeads} onSelectLead={handleSelectLead} />

        {/* Action Panel - Swiss Style */}
        <div className={styles["deai-action-panel"]}>
          <div className={styles["deai-action-panel-head"]}>
            {selectedLead
              ? `${selectedLead.grade}-${String(mockLeads.indexOf(selectedLead) + 1).padStart(2, "0")} 名單詳情`
              : "點選氣泡查看詳情"}
          </div>
          <div className={styles["deai-action-panel-body"]}>
            {selectedLead ? (
              <>
                {/* Stats */}
                <div className={styles["deai-stat"]}>
                  <span>等級</span>
                  <span className={styles["deai-stat-value"]}>
                    <span
                      className={
                        styles[
                          `deai-badge--${selectedLead.grade.toLowerCase()}`
                        ] || styles["deai-badge"]
                      }
                    >
                      {selectedLead.grade} 級
                    </span>
                  </span>
                </div>
                <div className={styles["deai-stat"]}>
                  <span>意向度</span>
                  <span className={styles["deai-stat-value"]}>
                    {selectedLead.intent}%
                  </span>
                </div>
                <div className={styles["deai-stat"]}>
                  <span>物件偏好</span>
                  <span className={styles["deai-stat-value"]}>
                    {selectedLead.prop}
                  </span>
                </div>
                <div className={styles["deai-stat"]}>
                  <span>預算範圍</span>
                  <span className={styles["deai-stat-value"]}>
                    1,200-1,500萬
                  </span>
                </div>

                {/* AI Recommendation - de-AI style */}
                <div
                  className={`${styles["deai-ai-box"]} ${
                    selectedLead.grade === "S" || selectedLead.grade === "A"
                      ? styles["deai-ai-box--success"]
                      : ""
                  }`}
                >
                  {selectedLead.grade === "S" || selectedLead.grade === "A"
                    ? "高意向客戶，建議優先聯繫。24小時內回覆可提升成交率 35%。"
                    : "建議持續追蹤，可透過物件推薦提升意向度。"}
                </div>

                {/* Action Button */}
                <button
                  className={styles["deai-btn--attack"]}
                  onClick={() => {
                    // Demo：實際功能請使用 UAG 正式頁面
                  }}
                >
                  {selectedLead.grade === "S" || selectedLead.grade === "A"
                    ? "購買獨家聯絡權"
                    : "用點數兌換"}
                </button>
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "200px",
                  color: "var(--swiss-gray-500)",
                  fontSize: "13px",
                }}
              >
                {/* SVG icon instead of emoji */}
                <svg
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  style={{ marginBottom: "12px" }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                點選左側雷達氣泡以查看名單詳情
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer - Swiss Style */}
      <footer className={styles["deai-footer"]}>
        <span style={{ fontSize: "12px", color: "var(--swiss-gray-500)" }}>
          系統模式：
          <span style={{ color: "var(--brand-primary)", fontWeight: 600 }}>
            Demo
          </span>
        </span>
        <button className={styles["deai-btn"]}>方案設定</button>
        <button
          className={`${styles["deai-btn"]} ${styles["deai-btn--primary"]}`}
        >
          加值點數
        </button>
        <span className={styles["deai-badge"]}>
          點數 <strong style={{ marginLeft: "4px" }}>1,280</strong>
        </span>
      </footer>
    </div>
  );
}
