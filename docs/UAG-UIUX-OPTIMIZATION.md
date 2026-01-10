# UAG ActionPanel UI/UX 優化工單

## 概述

根據 `/ui-ux-pro-max` 技能規範，優化 UAG 雷達採購流程的 UI 元素。

**Demo 頁面**: `/maihouses/uag-uiux-demo`

---

## 待修改檔案

| 檔案 | 路徑 |
|------|------|
| ActionPanel.tsx | `src/pages/UAG/components/ActionPanel.tsx` |
| UAG.module.css | `src/pages/UAG/UAG.module.css` |

---

## 修改項目清單

### 1. 空狀態圖標：👆 → MousePointerClick

| 項目 | 內容 |
|------|------|
| **檔案** | `ActionPanel.tsx` |
| **行號** | 61 |
| **問題** | 使用 emoji 👆 作為 UI 圖標 |
| **UI/UX Pro Max 來源** | SKILL.md 第 163 行 |
| **規則** | 「No emoji icons - Use SVG icons (Heroicons, Lucide, Simple Icons)」 |

**Before:**
```tsx
<div style={{ fontSize: "40px", marginBottom: "10px" }}>👆</div>
```

**After:**
```tsx
import { MousePointerClick } from "lucide-react";

<MousePointerClick
  size={40}
  strokeWidth={1.5}
  style={{ color: "var(--ink-300)", marginBottom: "10px" }}
/>
```

- [ ] 完成修改

---

### 2. 獨家權益標籤：✨ → Sparkles

| 項目 | 內容 |
|------|------|
| **檔案** | `ActionPanel.tsx` |
| **行號** | 134 |
| **問題** | 使用 emoji ✨ 裝飾文字 |
| **UI/UX Pro Max 來源** | SKILL.md 第 163 行 |
| **規則** | 「No emoji icons」 |

**Before:**
```tsx
✨ 此客戶包含獨家訊息聯絡權 ✨
```

**After:**
```tsx
import { Sparkles } from "lucide-react";

<div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
  <Sparkles size={14} />
  此客戶包含獨家訊息聯絡權
  <Sparkles size={14} />
</div>
```

- [ ] 完成修改

---

### 3. 購買按鈕：🚀 → Rocket + Hover 效果

| 項目 | 內容 |
|------|------|
| **檔案** | `ActionPanel.tsx` |
| **行號** | 144 |
| **問題** | 1. 使用 emoji 🚀<br>2. 無 hover 視覺回饋<br>3. 無 focus 狀態 |
| **UI/UX Pro Max 來源** | SKILL.md 第 163, 173, 174 行 |
| **規則** | 「No emoji icons」<br>「Hover feedback - Provide visual feedback (color, shadow, border)」<br>「Smooth transitions - Use transition-colors duration-200」 |

**Before:**
```tsx
<button className={styles["btn-attack"]} onClick={handleBuyClick} disabled={isProcessing}>
  {isProcessing ? "處理中..." : "🚀 獲取聯絡權限 (LINE/站內信)"}
</button>
```

**After:**
```tsx
import { Rocket } from "lucide-react";

<button className={styles["btn-attack"]} onClick={handleBuyClick} disabled={isProcessing}>
  {isProcessing ? (
    "處理中..."
  ) : (
    <>
      <Rocket size={18} />
      獲取聯絡權限 (LINE/站內信)
    </>
  )}
</button>
```

**CSS 修改 (UAG.module.css):**
```css
.btn-attack {
  /* 現有樣式... */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease-out;
}

.btn-attack:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.55);
}

.btn-attack:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}
```

- [ ] 完成 TSX 修改
- [ ] 完成 CSS 修改

---

### 4. 確認按鈕：添加圖標 + Loading 狀態

| 項目 | 內容 |
|------|------|
| **檔案** | `ActionPanel.tsx` |
| **行號** | 146-166 |
| **問題** | 1. 無 hover 效果<br>2. 無 loading 狀態反饋<br>3. 確認按鈕無圖標區分 |
| **UI/UX Pro Max 來源** | SKILL.md 第 163, 173-174 行<br>ux-guidelines.csv (搜尋 `--domain ux "confirm danger"`) |
| **規則** | 「Use SVG icons」<br>「Hover feedback + Smooth transitions」<br>「Forms/Submit Feedback - Show loading then success/error state」 |

**Before:**
```tsx
<div style={{ display: "flex", gap: "10px" }}>
  <button
    className={styles["btn-attack"]}
    style={{ background: "#ef4444", flex: 1 }}
    onClick={handleConfirm}
    disabled={isProcessing}
  >
    {isProcessing ? "處理中..." : `確定花費 ${selectedLead.price} 點?`}
  </button>
  <button
    className={styles["btn-attack"]}
    style={{ background: "#94a3b8", flex: 1 }}
    onClick={handleCancel}
    disabled={isProcessing}
  >
    取消
  </button>
</div>
```

**After:**
```tsx
import { Coins, X, Loader2 } from "lucide-react";

<div style={{ display: "flex", gap: "10px" }}>
  <button
    className={`${styles["btn-attack"]} ${styles["btn-confirm"]}`}
    onClick={handleConfirm}
    disabled={isProcessing}
  >
    {isProcessing ? (
      <>
        <Loader2 size={16} className={styles["spin"]} />
        處理中...
      </>
    ) : (
      <>
        <Coins size={16} />
        確定花費 {selectedLead.price} 點
      </>
    )}
  </button>
  <button
    className={`${styles["btn-attack"]} ${styles["btn-cancel"]}`}
    onClick={handleCancel}
    disabled={isProcessing}
  >
    <X size={16} />
    取消
  </button>
</div>
```

**CSS 新增 (UAG.module.css):**
```css
.btn-confirm {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  box-shadow: 0 8px 20px rgba(239, 68, 68, 0.35);
}

.btn-confirm:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c, #dc2626);
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.45);
}

.btn-cancel {
  background: #fff;
  color: #64748b;
  border: 1px solid #e2e8f0;
  box-shadow: none;
}

.btn-cancel:hover:not(:disabled) {
  background: #f8fafc;
  border-color: #cbd5e1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.spin {
  animation: spin 1s linear infinite;
}
```

- [ ] 完成 TSX 修改
- [ ] 完成 CSS 修改

---

### 5. 泡泡 Hover 動畫優化 (額外項目)

| 項目 | 內容 |
|------|------|
| **檔案** | `UAG.module.css` |
| **行號** | 638-650 |
| **問題** | 1. `scale(1.15)` 導致 Layout Shift<br>2. 雙重動畫 (float + pulse) 過度<br>3. 無 `prefers-reduced-motion` 支援 |
| **UI/UX Pro Max 來源** | SKILL.md 第 164 行<br>ux-guidelines.csv (搜尋 `--domain ux "reduced motion"`、`--domain ux "excessive motion"`) |
| **規則** | 「Stable hover states - Use color/opacity transitions on hover」<br>「Use scale transforms that shift layout」→ 禁止<br>「Animate 1-2 key elements per view maximum」<br>「Check prefers-reduced-motion media query」 |

**Before:**
```css
.uag-bubble {
  animation: float var(--float) ease-in-out infinite,
             pulse 2.6s ease-out infinite;
}

.uag-bubble:hover,
.uag-bubble.selected {
  transform: scale(1.15);
}
```

**After:**
```css
/* 無障礙：尊重使用者動畫偏好 */
@media (prefers-reduced-motion: reduce) {
  .uag-bubble {
    animation: none;
  }
}

.uag-bubble {
  /* 移除 pulse，僅保留 float */
  animation: float var(--float) ease-in-out infinite;
}

.uag-bubble:hover,
.uag-bubble.selected {
  /* 改用 translateY，不影響版面 */
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.25);
}
```

- [ ] 完成 CSS 修改

---

## UI/UX Pro Max 來源總結

| 修改項目 | 來源 | 位置/搜尋指令 |
|----------|------|---------------|
| 👆 → MousePointerClick | SKILL.md - No emoji icons | 第 163 行 |
| ✨ → Sparkles | SKILL.md - No emoji icons | 第 163 行 |
| 🚀 → Rocket | SKILL.md - No emoji icons | 第 163 行 |
| Hover 視覺回饋 | SKILL.md - Hover feedback | 第 173 行 |
| Transition 0.2s | SKILL.md - Smooth transitions | 第 174 行 |
| Loading 狀態 | ux-guidelines.csv - Submit Feedback | `--domain ux "confirm danger"` |
| 確認按鈕 Coins 圖標 | SKILL.md - Use SVG icons | 第 163 行 |
| 移除 scale hover | SKILL.md - Stable hover states | 第 164 行 |
| 移除 pulse 動畫 | ux-guidelines.csv - Excessive Motion | `--domain ux "excessive motion"` |
| prefers-reduced-motion | ux-guidelines.csv - Reduced Motion | `--domain ux "reduced motion"` |

---

## 驗證方式

### 1. TypeScript 檢查
```bash
npm run typecheck
```

### 2. ESLint 檢查
```bash
npm run lint
```

### 3. 視覺驗證
1. 開啟 `/maihouses/uag-uiux-demo` 確認 Demo 效果
2. 開啟 `/maihouses/uag` 確認實際頁面
3. 測試 Mock 模式購買流程：
   - 點擊雷達泡泡
   - 確認空狀態圖標為 SVG
   - 確認獨家權益標籤為 SVG
   - 點擊「獲取聯絡權限」按鈕
   - 確認按鈕有 hover 效果
   - 確認確認按鈕有 Coins 圖標
   - 確認 Loading 狀態有 spinner

### 4. 無障礙驗證
1. 開啟系統設定 → 減少動態效果
2. 確認泡泡動畫停止
3. 使用 Tab 鍵導航，確認 focus 狀態可見

---

## 完成狀態

- [ ] 1. 空狀態圖標 👆 → MousePointerClick
- [ ] 2. 獨家權益標籤 ✨ → Sparkles
- [ ] 3. 購買按鈕 🚀 → Rocket + Hover
- [ ] 4. 確認按鈕圖標 + Loading
- [ ] 5. 泡泡 Hover 動畫優化
- [ ] 6. TypeScript 檢查通過
- [ ] 7. ESLint 檢查通過
- [ ] 8. 視覺驗證通過
