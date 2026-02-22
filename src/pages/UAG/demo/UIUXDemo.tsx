/**
 * UAG ActionPanel 購買按鈕 UI/UX Pro Max 優化 Demo
 *
 * 專注優化：
 * 1. 「獲取聯絡權限 (LINE/站內信)」按鈕 - 有 🚀 emoji
 * 2. 「確定花費 X 點?」確認按鈕
 * 3. 「✨ 此客戶包含獨家訊息聯絡權 ✨」badge
 * 4. 「👆」空狀態圖標
 */

import { useState } from 'react';
import { Rocket, Sparkles, MousePointerClick, Coins, X, Send } from 'lucide-react';
import css from './UIUXDemo.module.css';

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
 *   - Primary: var(--mh-color-2563eb) (藍)
 *   - CTA: var(--mh-color-f97316) (橘)
 *   - Text: var(--mh-color-1e293b)
 *   - Border: var(--mh-color-e2e8f0)
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
// Demo 1: 空狀態 👆 → MousePointer
// =============================================================================

function EmptyStateDemo() {
  return (
    <div className={css.demoSection}>
      <h2 className={css.demoSectionTitle}>1. 空狀態圖標：👆 → Lucide MousePointerClick</h2>
      <p className={css.demoLocationText}>
        位置：<code>ActionPanel.tsx:61</code>
      </p>

      <div className={css.demoGrid}>
        {/* BEFORE */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeBefore}>BEFORE</span>
          </div>

          <div className={css.demoEmptyBlock}>
            <div className={css.demoPointerEmoji}>👆</div>
            <div className={css.demoHintText}>
              請點擊上方雷達泡泡
              <br />
              查看分析與購買
            </div>
          </div>

          <div className={css.demoProblemBox}>
            <strong>問題：</strong>使用 emoji 👆 作為 UI 圖標
          </div>

          <div className={css.demoSourceBox}>
            <strong>❌ 違反 SKILL.md 第 163 行：</strong>
            <br />
            「No emoji icons - Use SVG icons (Heroicons, Lucide)」
            <br />
            「Use emojis like 🎨 🚀 ⚙️ as UI icons」→ 禁止
          </div>
        </div>

        {/* AFTER */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeAfter}>AFTER</span>
          </div>

          <div className={css.demoEmptyBlock}>
            <MousePointerClick size={40} strokeWidth={1.5} className={css.demoPointerIcon} />
            <div className={css.demoHintText}>
              請點擊上方雷達泡泡
              <br />
              查看分析與購買
            </div>
          </div>

          <div className={css.demoFixBox}>
            <strong>修正：</strong>使用 Lucide <code>&lt;MousePointerClick /&gt;</code>
          </div>

          <div className={css.demoSourceBox}>
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
    <div className={css.demoSection}>
      <h2 className={css.demoSectionTitle}>2. 獨家權益標籤：✨ → Lucide Sparkles</h2>
      <p className={css.demoLocationText}>
        位置：<code>ActionPanel.tsx:134</code>
      </p>

      <div className={css.demoGrid}>
        {/* BEFORE */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeBefore}>BEFORE</span>
          </div>

          <div className={css.demoExclusiveBadgeBefore}>✨ 此客戶包含獨家訊息聯絡權 ✨</div>

          <div className={css.demoProblemBox}>
            <strong>問題：</strong>使用 emoji ✨ 裝飾文字
          </div>

          <div className={css.demoSourceBox}>
            <strong>❌ 違反 SKILL.md 第 163 行：</strong>
            <br />
            「No emoji icons」
          </div>
        </div>

        {/* AFTER */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeAfter}>AFTER</span>
          </div>

          <div className={css.demoExclusiveBadgeAfter}>
            <Sparkles size={14} />
            此客戶包含獨家訊息聯絡權
            <Sparkles size={14} />
          </div>

          <div className={css.demoFixBox}>
            <strong>修正：</strong>使用 Lucide <code>&lt;Sparkles /&gt;</code>
          </div>

          <div className={css.demoSourceBox}>
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
  return (
    <div className={css.demoSection}>
      <h2 className={css.demoSectionTitle}>3. 購買按鈕：🚀 → Lucide Rocket + Hover 優化</h2>
      <p className={css.demoLocationText}>
        位置：<code>ActionPanel.tsx:144</code>
      </p>

      <div className={css.demoGrid}>
        {/* BEFORE */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeBefore}>BEFORE</span>
          </div>

          <button className={css.demoBuyBtnBefore}>🚀 獲取聯絡權限 (LINE/站內信)</button>

          <div className={css.demoProblemBox}>
            <strong>問題：</strong>
            <ul className={css.demoListTight}>
              <li>使用 emoji 🚀</li>
              <li>無 hover 視覺回饋</li>
              <li>無 focus 狀態</li>
            </ul>
          </div>

          <div className={css.demoSourceBox}>
            <strong>❌ 違反 SKILL.md：</strong>
            <br />
            第 163 行：「No emoji icons」
            <br />
            第 173 行：「Hover feedback - Provide visual feedback」
            <br />第 210 行 Checklist：「Focus states visible for keyboard navigation」
          </div>
        </div>

        {/* AFTER */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeAfter}>AFTER</span>
          </div>

          <button className={css.demoBuyBtnAfter}>
            <Rocket size={18} />
            獲取聯絡權限 (LINE/站內信)
          </button>

          <div className={css.demoFixBox}>
            <strong>修正：</strong>
            <ul className={css.demoListTight}>
              <li>
                <code>&lt;Rocket /&gt;</code> 替換 🚀
              </li>
              <li>hover: 顏色變亮 + shadow 加深 + translateY(-2px)</li>
              <li>transition: 0.2s (符合 150-300ms 規範)</li>
            </ul>
          </div>

          <div className={css.demoSourceBox}>
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
  const [step, setStep] = useState<'initial' | 'confirm' | 'loading'>('initial');

  const handleBuy = () => setStep('confirm');
  const handleConfirm = () => {
    setStep('loading');
    setTimeout(() => setStep('initial'), 1500);
  };
  const handleCancel = () => setStep('initial');

  return (
    <div className={css.demoSection}>
      <h2 className={css.demoSectionTitle}>4. 確認購買按鈕：樣式 + Loading 狀態</h2>
      <p className={css.demoLocationText}>
        位置：<code>ActionPanel.tsx:146-166</code>
      </p>

      <div className={css.demoGrid}>
        {/* BEFORE */}
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeBefore}>BEFORE</span>
          </div>

          <div className={css.demoButtonRow}>
            <button className={css.demoConfirmBeforeDanger}>確定花費 3 點?</button>
            <button className={css.demoConfirmBeforeCancel}>取消</button>
          </div>

          <div className={css.demoProblemBox}>
            <strong>問題：</strong>
            <ul className={css.demoListTight}>
              <li>無 hover 效果</li>
              <li>無 loading 狀態反饋</li>
              <li>確認按鈕無圖標區分</li>
            </ul>
          </div>

          <div className={css.demoSourceBox}>
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
        <div className={css.demoCard}>
          <div className={css.demoCardHeader}>
            <span className={css.demoBadgeAfter}>AFTER</span>
          </div>

          {step === 'initial' && (
            <button onClick={handleBuy} className={css.demoConfirmEntryButton}>
              <Rocket size={18} />
              獲取聯絡權限 (LINE/站內信)
            </button>
          )}

          {step === 'confirm' && (
            <div className={css.demoButtonRow}>
              <button onClick={handleConfirm} className={css.demoConfirmDangerButton}>
                <Coins size={16} />
                確定花費 3 點
              </button>
              <button onClick={handleCancel} className={css.demoConfirmCancelButton}>
                <X size={16} />
                取消
              </button>
            </div>
          )}

          {step === 'loading' && (
            <button disabled className={css.demoConfirmLoadingButton}>
              <div className={css.demoSpinner} />
              處理中...
            </button>
          )}

          <div className={css.demoFixBox}>
            <strong>修正：</strong>
            <ul className={css.demoListTight}>
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

          <div className={css.demoSourceBox}>
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
    </div>
  );
}

// =============================================================================
// 來源總結表格
// =============================================================================

function SourceSummary() {
  return (
    <div className={`${css.demoCard} ${css.demoSummaryCard}`}>
      <h3 className={css.demoSummaryTitle}>UI/UX Pro Max 來源總結</h3>

      <table className={css.demoSummaryTable}>
        <thead>
          <tr className={css.demoSummaryHeadRow}>
            <th className={css.demoSummaryHeadCell}>修改項目</th>
            <th className={css.demoSummaryHeadCell}>UI/UX Pro Max 來源</th>
            <th className={css.demoSummaryHeadCell}>位置/搜尋指令</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className={css.demoSummaryCell}>👆 → MousePointerClick</td>
            <td className={css.demoSummaryCell}>SKILL.md - No emoji icons</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 163 行</td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>✨ → Sparkles</td>
            <td className={css.demoSummaryCell}>SKILL.md - No emoji icons</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 163 行</td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>🚀 → Rocket</td>
            <td className={css.demoSummaryCell}>SKILL.md - No emoji icons</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 163 行</td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>Hover 視覺回饋</td>
            <td className={css.demoSummaryCell}>SKILL.md - Hover feedback</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 173 行</td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>Transition 0.2s</td>
            <td className={css.demoSummaryCell}>SKILL.md - Smooth transitions</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 174 行</td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>Loading 狀態</td>
            <td className={css.demoSummaryCell}>ux-guidelines.csv - Submit Feedback</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>
              --domain ux "confirm danger"
            </td>
          </tr>
          <tr>
            <td className={css.demoSummaryCell}>確認按鈕 Coins 圖標</td>
            <td className={css.demoSummaryCell}>SKILL.md - Use SVG icons</td>
            <td className={`${css.demoSummaryCell} ${css.demoSummaryMono}`}>SKILL.md 第 163 行</td>
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
    <div className={css.demoPage}>
      <h1 className={css.demoPageTitle}>UAG ActionPanel 購買按鈕 UI/UX 優化 Demo</h1>
      <p className={css.demoPageSubtitle}>
        專注優化 ActionPanel 的 4 個 UI 元素，所有修改皆標註 /ui-ux-pro-max 來源位置
      </p>

      <EmptyStateDemo />
      <ExclusiveBadgeDemo />
      <BuyButtonDemo />
      <ConfirmButtonDemo />
      <SourceSummary />
    </div>
  );
}
