# Mobile UX Specialist — 手機端 UX 實戰審核

**觸發指令:** 審核中包含「手機」「mobile」「行動端」「RWD」關鍵字時自動載入

---

## 職責

專門審核 320px~414px 手機端使用者體驗。不做美學判斷（那是 ui_perfection 的事），只做「手機上能不能用」的實戰檢查。

---

## 強制檢查清單（10 項）

### 1. 觸控目標 >= 44px

**規則:** 所有可互動元素（button, a, input, checkbox, select）的可觸控區域必須 >= 44x44 CSS px。

**量化計算方式:**
```
實際觸控高度 = padding-top + padding-bottom + content-height (font-size * line-height)
實際觸控寬度 = padding-left + padding-right + content-width
```

**常見違規模式:**
```tsx
// BAD: p-1.5 (6px) + icon 22px = 34px < 44px
<button className="p-1.5"><X size={22} /></button>

// GOOD: min-h-[44px] min-w-[44px] 強制保底
<button className="min-h-[44px] min-w-[44px] p-2"><X size={20} /></button>
```

**掃描方式:** Grep `className=` 中的 button/a 元素，計算 padding + size。

---

### 2. 最小字體 >= 12px (text-xs)

**規則:** 手機端任何可見文字不得低於 12px。`text-[10px]` 和 `text-[11px]` 在手機上不可讀。

**例外:** 完全裝飾性文字（如 watermark）。

**違規模式:**
```tsx
// BAD
text-[10px]
text-[11px]
fontSize: '10px'

// GOOD: 最低用 text-xs (12px)
text-xs
```

---

### 3. Fixed Bottom Bar 安全區

**規則:** `fixed bottom-0` 的元素必須有 `pb-safe` 或 `padding-bottom: env(safe-area-inset-bottom)` 防止被 iPhone 底部橫條遮擋。

**檢查:** Grep `fixed.*bottom-0` 或 `fixed.*inset-x-0.*bottom`，確認有 `pb-safe` class。

---

### 4. Z-Index 衝突檢測

**規則:** 同時存在多個 `fixed` 或 `sticky` 元素時，z-index 必須有明確層級關係，不得互相遮蓋。

**必須檢查:**
- 頂部 nav (sticky top-0)
- 底部 action bar (fixed bottom-0)
- Modal overlay (fixed inset-0)
- 浮動按鈕 (fixed bottom-X right-X)
- Toast 通知

**層級建議:**
```
nav:          z-sticky (20)
floating-btn: z-40
bottom-bar:   z-overlay (30)
modal:        z-modal (50)
toast:        z-toast (60)
```

---

### 5. 按鈕間距 >= 8px

**規則:** 相鄰可點擊元素間距至少 8px (gap-2)，防止誤觸。

**違規模式:**
```tsx
// BAD: gap-1 (4px) 太窄
<div className="flex gap-1">
  <button>A</button>
  <button>B</button>
</div>

// GOOD
<div className="flex gap-2">
```

---

### 6. Modal 手機端 Bottom Sheet 模式

**規則:** 手機端 Modal 應從底部滑入（`items-end`），桌面端置中（`sm:items-center`）。

**正確模式:**
```tsx
<div className="fixed inset-0 flex items-end sm:items-center">
```

**檢查:** 所有 `fixed inset-0` 的 Modal，是否有 `items-end` + `sm:items-center` 的響應式設計。

---

### 7. 文字對比度（小字體加嚴）

**規則:**
- 正常文字 (>= 14px): WCAG AA 4.5:1
- 小字體 (12-13px): 建議 Enhanced AA 7:1
- 10px 以下: 禁止使用

**常見問題色:**
```
text-slate-400 (#94a3b8) on white: 3.0:1 ❌
text-slate-500 (#64748b) on white: 4.6:1 ⚠️ (正常文字 OK，小字體不夠)
text-slate-600 (#475569) on white: 7.0:1 ✅
```

---

### 8. 橫向溢出檢測

**規則:** 任何元素不得導致 320px 螢幕出現水平滾動條。

**常見原因:**
- `grid-cols-3` 內容文字太長
- `max-w-lg` (512px) 在手機上溢出
- 固定寬度 (`w-48`, `w-64`) 超出螢幕
- `flex` 沒有 `flex-wrap` 且子元素有 `min-w`

---

### 9. 手機鍵盤彈出時佈局

**規則:** `type="tel"` / `type="text"` 的 input 被 focus 時，手機鍵盤會佔據底部 ~40% 螢幕。Fixed bottom bar 和 submit button 不得被鍵盤遮擋。

**檢查:** Form 內的 submit button 是否在 scroll 區域內（而非 fixed 在底部）。

---

### 10. 手機端 `100vh` 問題

**規則:** iOS Safari 的 `100vh` 包含地址欄高度，會導致底部內容被遮擋。

**正確做法:**
```tsx
// BAD
className="h-screen"  // 手機上會超出可視區

// GOOD
className="min-h-dvh"  // 動態 viewport height
className="min-h-[100svh]"  // small viewport height
```

---

## 評分規則

- 每項檢查通過: +10 分
- 每項不通過: 0 分
- 滿分 100

**低於 70 分 = 手機端體驗不可接受**

---

## 輸出格式

```markdown
## Mobile UX Specialist 審核報告

| # | 檢查項 | 結果 | 問題數 | 扣分 |
|---|--------|------|--------|------|
| 1 | 觸控目標 >= 44px | ❌ | 3 處 | -10 |
| 2 | 最小字體 >= 12px | ❌ | 8 處 | -10 |
| ...

**手機端分數: XX / 100**
```

---

**版本:** 1.0
**最後更新:** 2026-02-06
