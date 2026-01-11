/**
 * UAG ActionPanel 購買按鈕 UI/UX Pro Max 優化 Demo
 *
 * 專注優化：
 * 1. 「獲取聯絡權限 (LINE/站內信)」按鈕 - 有 🚀 emoji
 * 2. 「確定花費 X 點?」確認按鈕
 * 3. 「✨ 此客戶包含獨家訊息聯絡權 ✨」badge
 * 4. 「👆」空狀態圖標
 */

import { useState } from "react";
import {
  Rocket,
  Sparkles,
  MousePointerClick,
  Coins,
  X,
  Send,
} from "lucide-react";

/**
 * ============================================================================
 * UI/UX Pro Max 來源對照表
 * ============================================================================
 *
 * 【來源 1】SKILL.md - Common Rules - Icons & Visual Elements
 * 位置：.claude/skills/ui-ux-pro-max/SKILL.md 第 159-166 行
 * 規則：
 *   | **No emoji icons** | Use SVG icons (Heroicons, Lucide, Simple Icons) |
 *   | Use emojis like 🎨 🚀 ⚙️ as UI icons | → 禁止
 *
 * 【來源 2】SKILL.md - Common Rules - Interaction & Cursor
 * 位置：.claude/skills/ui-ux-pro-max/SKILL.md 第 168-174 行
 * 規則：
 *   | **Cursor pointer** | Add cursor-pointer to all clickable elements |
 *   | **Hover feedback** | Provide visual feedback (color, shadow, border) |
 *   | **Smooth transitions** | Use transition-colors duration-200 |
 *
 * 【來源 3】colors.csv - SaaS 配色
 * 搜尋指令：python search.py "saas" --domain color
 * 結果：
 *   - Primary: #2563EB (藍)
 *   - CTA: #F97316 (橘)
 *   - Text: #1E293B
 *   - Border: #E2E8F0
 *
 * 【來源 4】ux-guidelines.csv - Forms/Submit Feedback
 * 搜尋指令：python search.py "confirm danger" --domain ux
 * 結果：
 *   - Category: Forms - Submit Feedback
 *   - Do: Show loading then success/error state
 *   - Don't: No feedback after submit
 *   - Severity: High
 *
 * 【來源 5】SKILL.md - Pre-Delivery Checklist
 * 位置：.claude/skills/ui-ux-pro-max/SKILL.md 第 195-228 行
 * 規則：
 *   - [ ] No emojis used as icons (use SVG instead)
 *   - [ ] All clickable elements have cursor-pointer
 *   - [ ] Hover states provide clear visual feedback
 *   - [ ] Transitions are smooth (150-300ms)
 *   - [ ] Focus states visible for keyboard navigation
 */

// =============================================================================
// Styles
// =============================================================================

const styles = {
  container: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Inter", "Noto Sans TC", sans-serif',
    padding: "32px",
    maxWidth: "1000px",
    margin: "0 auto",
    background: "#f8fafc",
    minHeight: "100vh",
  } as React.CSSProperties,

  title: {
    fontSize: "24px",
    fontWeight: 900,
    color: "var(--ink-100)",
    marginBottom: "8px",
  } as React.CSSProperties,

  subtitle: {
    fontSize: "14px",
    color: "var(--ink-300)",
    marginBottom: "32px",
    lineHeight: 1.6,
  } as React.CSSProperties,

  section: {
    marginBottom: "48px",
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: "18px",
    fontWeight: 800,
    color: "var(--ink-100)",
    marginBottom: "16px",
    borderLeft: "4px solid var(--uag-brand-light)",
    paddingLeft: "12px",
  } as React.CSSProperties,

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  } as React.CSSProperties,

  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "24px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
  } as React.CSSProperties,

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e2e8f0",
  } as React.CSSProperties,

  badgeBefore: {
    background: "#fef2f2",
    color: "#dc2626",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  } as React.CSSProperties,

  badgeAfter: {
    background: "#f0fdf4",
    color: "#16a34a",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: 700,
  } as React.CSSProperties,

  sourceBox: {
    background: "#f1f5f9",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "11px",
    color: "#475569",
    marginTop: "16px",
    fontFamily: "monospace",
    lineHeight: 1.6,
  } as React.CSSProperties,

  problemBox: {
    padding: "12px",
    background: "#fef2f2",
    borderRadius: "8px",
    fontSize: "12px",
    marginTop: "16px",
    border: "1px solid #fecaca",
  } as React.CSSProperties,

  fixBox: {
    padding: "12px",
    background: "#f0fdf4",
    borderRadius: "8px",
    fontSize: "12px",
    marginTop: "16px",
    border: "1px solid #bbf7d0",
  } as React.CSSProperties,
};

// =============================================================================
// Demo 1: 空狀態 👆 → MousePointer
// =============================================================================

function EmptyStateDemo() {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        1. 空狀態圖標：👆 → Lucide MousePointerClick
      </h2>
      <p style={{ fontSize: "13px", color: "var(--ink-300)", marginBottom: "16px" }}>
        位置：<code>ActionPanel.tsx:61</code>
      </p>

      <div style={styles.grid}>
        {/* BEFORE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeBefore}>BEFORE</span>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>👆</div>
            <div style={{ color: "var(--ink-300)", fontSize: "13px" }}>
              請點擊上方雷達泡泡
              <br />
              查看分析與購買
            </div>
          </div>

          <div style={styles.problemBox}>
            <strong>問題：</strong>使用 emoji 👆 作為 UI 圖標
          </div>

          <div style={styles.sourceBox}>
            <strong>❌ 違反 SKILL.md 第 163 行：</strong>
            <br />
            「No emoji icons - Use SVG icons (Heroicons, Lucide)」
            <br />
            「Use emojis like 🎨 🚀 ⚙️ as UI icons」→ 禁止
          </div>
        </div>

        {/* AFTER */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeAfter}>AFTER</span>
          </div>

          <div
            style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <MousePointerClick
              size={40}
              strokeWidth={1.5}
              style={{ color: "var(--ink-400)", marginBottom: "10px" }}
            />
            <div style={{ color: "var(--ink-300)", fontSize: "13px" }}>
              請點擊上方雷達泡泡
              <br />
              查看分析與購買
            </div>
          </div>

          <div style={styles.fixBox}>
            <strong>修正：</strong>使用 Lucide{" "}
            <code>&lt;MousePointerClick /&gt;</code>
          </div>

          <div style={styles.sourceBox}>
            <strong>✅ 遵循 SKILL.md 第 163 行：</strong>
            <br />
            「Use SVG icons (Heroicons, Lucide, Simple Icons)」
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Demo 2: 獨家權益 ✨ → Sparkles
// =============================================================================

function ExclusiveBadgeDemo() {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>2. 獨家權益標籤：✨ → Lucide Sparkles</h2>
      <p style={{ fontSize: "13px", color: "var(--ink-300)", marginBottom: "16px" }}>
        位置：<code>ActionPanel.tsx:134</code>
      </p>

      <div style={styles.grid}>
        {/* BEFORE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeBefore}>BEFORE</span>
          </div>

          <div
            style={{
              background: "#fff7ed",
              color: "#ea580c",
              fontWeight: 700,
              fontSize: "12px",
              textAlign: "center",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ffedd5",
            }}
          >
            ✨ 此客戶包含獨家訊息聯絡權 ✨
          </div>

          <div style={styles.problemBox}>
            <strong>問題：</strong>使用 emoji ✨ 裝飾文字
          </div>

          <div style={styles.sourceBox}>
            <strong>❌ 違反 SKILL.md 第 163 行：</strong>
            <br />
            「No emoji icons」
          </div>
        </div>

        {/* AFTER */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeAfter}>AFTER</span>
          </div>

          <div
            style={{
              background: "#fff7ed",
              color: "#ea580c",
              fontWeight: 700,
              fontSize: "12px",
              textAlign: "center",
              padding: "10px",
              borderRadius: "6px",
              border: "1px solid #ffedd5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} />
            此客戶包含獨家訊息聯絡權
            <Sparkles size={14} />
          </div>

          <div style={styles.fixBox}>
            <strong>修正：</strong>使用 Lucide <code>&lt;Sparkles /&gt;</code>
          </div>

          <div style={styles.sourceBox}>
            <strong>✅ 遵循 SKILL.md 第 163 行：</strong>
            <br />
            「Use SVG icons (Heroicons, Lucide, Simple Icons)」
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Demo 3: 獲取聯絡權限按鈕 🚀 → Rocket
// =============================================================================

function BuyButtonDemo() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>
        3. 購買按鈕：🚀 → Lucide Rocket + Hover 優化
      </h2>
      <p style={{ fontSize: "13px", color: "var(--ink-300)", marginBottom: "16px" }}>
        位置：<code>ActionPanel.tsx:144</code>
      </p>

      <div style={styles.grid}>
        {/* BEFORE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeBefore}>BEFORE</span>
          </div>

          <button
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #1749d7, #2563eb)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: "0 16px 36px rgba(37, 99, 235, 0.45)",
            }}
          >
            🚀 獲取聯絡權限 (LINE/站內信)
          </button>

          <div style={styles.problemBox}>
            <strong>問題：</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>使用 emoji 🚀</li>
              <li>無 hover 視覺回饋</li>
              <li>無 focus 狀態</li>
            </ul>
          </div>

          <div style={styles.sourceBox}>
            <strong>❌ 違反 SKILL.md：</strong>
            <br />
            第 163 行：「No emoji icons」
            <br />
            第 173 行：「Hover feedback - Provide visual feedback」
            <br />第 210 行 Checklist：「Focus states visible for keyboard
            navigation」
          </div>
        </div>

        {/* AFTER */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeAfter}>AFTER</span>
          </div>

          <button
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              width: "100%",
              padding: "16px",
              border: "none",
              borderRadius: "12px",
              background: isHovered
                ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                : "linear-gradient(135deg, #1749d7, #2563eb)",
              color: "#fff",
              fontWeight: 800,
              fontSize: "16px",
              cursor: "pointer",
              boxShadow: isHovered
                ? "0 20px 40px rgba(37, 99, 235, 0.55)"
                : "0 16px 36px rgba(37, 99, 235, 0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s ease-out",
              transform: isHovered ? "translateY(-2px)" : "translateY(0)",
              outline: "none",
            }}
          >
            <Rocket size={18} />
            獲取聯絡權限 (LINE/站內信)
          </button>

          <div style={styles.fixBox}>
            <strong>修正：</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>
                <code>&lt;Rocket /&gt;</code> 替換 🚀
              </li>
              <li>hover: 顏色變亮 + shadow 加深 + translateY(-2px)</li>
              <li>transition: 0.2s (符合 150-300ms 規範)</li>
            </ul>
          </div>

          <div style={styles.sourceBox}>
            <strong>✅ 遵循 SKILL.md：</strong>
            <br />
            第 163 行：「Use SVG icons (Lucide)」
            <br />
            第 173 行：「Provide visual feedback (color, shadow, border)」
            <br />第 174 行：「transition-colors duration-200」
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Demo 4: 確認購買按鈕
// =============================================================================

function ConfirmButtonDemo() {
  const [step, setStep] = useState<"initial" | "confirm" | "loading">(
    "initial",
  );

  const handleBuy = () => setStep("confirm");
  const handleConfirm = () => {
    setStep("loading");
    setTimeout(() => setStep("initial"), 1500);
  };
  const handleCancel = () => setStep("initial");

  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle}>4. 確認購買按鈕：樣式 + Loading 狀態</h2>
      <p style={{ fontSize: "13px", color: "var(--ink-300)", marginBottom: "16px" }}>
        位置：<code>ActionPanel.tsx:146-166</code>
      </p>

      <div style={styles.grid}>
        {/* BEFORE */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeBefore}>BEFORE</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              style={{
                flex: 1,
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: "#ef4444",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              確定花費 3 點?
            </button>
            <button
              style={{
                flex: 1,
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: "#94a3b8",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              取消
            </button>
          </div>

          <div style={styles.problemBox}>
            <strong>問題：</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>無 hover 效果</li>
              <li>無 loading 狀態反饋</li>
              <li>確認按鈕無圖標區分</li>
            </ul>
          </div>

          <div style={styles.sourceBox}>
            <strong>❌ 違反：</strong>
            <br />
            SKILL.md 第 173 行：「Hover feedback」
            <br />
            ux-guidelines.csv (搜尋 --domain ux &quot;confirm danger&quot;)：
            <br />
            「Forms/Submit Feedback - Show loading then success/error state」
          </div>
        </div>

        {/* AFTER */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.badgeAfter}>AFTER</span>
          </div>

          {step === "initial" && (
            <button
              onClick={handleBuy}
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #1749d7, #2563eb)",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
              }}
            >
              <Rocket size={18} />
              獲取聯絡權限 (LINE/站內信)
            </button>
          )}

          {step === "confirm" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1,
                  padding: "16px",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #dc2626, #ef4444)",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                  boxShadow: "0 8px 20px rgba(239, 68, 68, 0.35)",
                }}
              >
                <Coins size={16} />
                確定花費 3 點
              </button>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1,
                  padding: "16px",
                  border: "1px solid var(--line-soft)",
                  borderRadius: "12px",
                  background: "#fff",
                  color: "var(--ink-300)",
                  fontWeight: 700,
                  fontSize: "15px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <X size={16} />
                取消
              </button>
            </div>
          )}

          {step === "loading" && (
            <button
              disabled
              style={{
                width: "100%",
                padding: "16px",
                border: "none",
                borderRadius: "12px",
                background: "#94a3b8",
                color: "#fff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: "not-allowed",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  border: "2px solid #fff",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }}
              />
              處理中...
            </button>
          )}

          <div style={styles.fixBox}>
            <strong>修正：</strong>
            <ul style={{ margin: "8px 0 0 16px", padding: 0 }}>
              <li>
                確認按鈕添加 <code>&lt;Coins /&gt;</code> 圖標
              </li>
              <li>
                取消按鈕改為 outline 樣式 + <code>&lt;X /&gt;</code>
              </li>
              <li>添加 loading spinner 狀態</li>
              <li>按鈕有 box-shadow + transition</li>
            </ul>
          </div>

          <div style={styles.sourceBox}>
            <strong>✅ 遵循：</strong>
            <br />
            SKILL.md 第 163 行：「Use SVG icons」
            <br />
            SKILL.md 第 173-174 行：「Hover feedback + Smooth transitions」
            <br />
            ux-guidelines.csv：「Loading → Success message」
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// 來源總結表格
// =============================================================================

function SourceSummary() {
  return (
    <div
      style={{
        ...styles.card,
        background: "linear-gradient(135deg, #eff6ff, #eef2ff)",
        border: "2px solid #3b82f6",
      }}
    >
      <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
        UI/UX Pro Max 來源總結
      </h3>

      <table
        style={{
          width: "100%",
          marginTop: "16px",
          fontSize: "12px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr style={{ background: "#dbeafe" }}>
            <th style={{ padding: "10px", textAlign: "left" }}>修改項目</th>
            <th style={{ padding: "10px", textAlign: "left" }}>
              UI/UX Pro Max 來源
            </th>
            <th style={{ padding: "10px", textAlign: "left" }}>
              位置/搜尋指令
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              👆 → MousePointerClick
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              SKILL.md - No emoji icons
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 163 行
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              ✨ → Sparkles
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              SKILL.md - No emoji icons
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 163 行
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              🚀 → Rocket
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              SKILL.md - No emoji icons
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 163 行
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              Hover 視覺回饋
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              SKILL.md - Hover feedback
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 173 行
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              Transition 0.2s
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              SKILL.md - Smooth transitions
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 174 行
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              Loading 狀態
            </td>
            <td style={{ padding: "10px", borderBottom: "1px solid #e2e8f0" }}>
              ux-guidelines.csv - Submit Feedback
            </td>
            <td
              style={{
                padding: "10px",
                borderBottom: "1px solid #e2e8f0",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              --domain ux "confirm danger"
            </td>
          </tr>
          <tr>
            <td style={{ padding: "10px" }}>確認按鈕 Coins 圖標</td>
            <td style={{ padding: "10px" }}>SKILL.md - Use SVG icons</td>
            <td
              style={{
                padding: "10px",
                fontFamily: "monospace",
                fontSize: "11px",
              }}
            >
              SKILL.md 第 163 行
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// Main
// =============================================================================

export default function UIUXDemo() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>UAG ActionPanel 購買按鈕 UI/UX 優化 Demo</h1>
      <p style={styles.subtitle}>
        專注優化 ActionPanel 的 4 個 UI 元素，所有修改皆標註 /ui-ux-pro-max
        來源位置
      </p>

      <EmptyStateDemo />
      <ExclusiveBadgeDemo />
      <BuyButtonDemo />
      <ConfirmButtonDemo />
      <SourceSummary />
    </div>
  );
}
