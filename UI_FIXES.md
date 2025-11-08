UI 檢查與修正建議

本檔總結 `check-ui.sh` 與 ESLint (tailwindcss plugin) 的檢查結果，並提供具體修正建議與可執行指令。

1) 執行檢查（快速）

```bash
# 在專案根目錄
npm run lint:ui
npx eslint "src/**/*.{ts,tsx,js,jsx}" || true
```

---

2) 發現重點（自動掃到的）

- CSS/SCSS 內部多處重複宣告字體屬性：
  - `src/index.css`（77 次相關條目）
  - `src/features/home/sections/HeroAssure.css`（37 次）
  - `src/components/Header/Header.css`（29 次）

- `!important` 熱點（可能阻止新樣式生效）：
  - `src/index.css` 行：157, 235, 305, 328, 368, 679-694
  - 建議逐一評估並移除不必要的 `!important`（若是第三方/全域樣式導致，可改提高特異性或用 Tailwind utility）。

- Tailwind ESLint 警告（主要已自動修正可修正項目）：
  - 多數為 class ordering 與 shorthand 建議（ESLint 可自動修正）。
  - 原先 `no-custom-classname` 對 `menu-icon`、`pill-*` 等自訂類名產生警告，已於 ESLint 設定中關閉該規則；若你想更嚴格，可改為用 whitelist/regex。

---

3) 建議修正步驟（優先順序）

A. 先用 ESLint 自動修：

```bash
npx eslint --fix "src/**/*.{ts,tsx,js,jsx}"
```

B. 檢查並手動處理 `!important`：
- 開啟 `src/index.css`，定位上面列出的行數，理解該樣式為何使用 `!important`。
- 若為調整間距或字型大小，請改用 Tailwind utility（例如 p-4 / text-lg / font-bold），或把樣式移到最後載入的 CSS，避免使用 `!important`。
- 範例：把 `padding: 8px 16px !important;` 改成在 component 層使用 `className="px-4 py-2"`。

C. 如果你用到動態 class（Template string / 連接），請把可能的類名加入 `tailwind.config.cjs` 的 `safelist`，或改寫為靜態類名。

```js
// tailwind.config.cjs
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  safelist: [
    'menu-icon',
    'pill-community',
    'pill-location',
    'pill-transit'
  ],
  // ...existing
}
```

D. 強制重建與清除快取：

```bash
npm run dev:force
# 或
npx vite --force
# 若仍看不到變化，請清除瀏覽器快取或用無痕模式檢查
```

---

4) 追蹤建議修正（快速 checklist）

- [ ] 用 ESLint --fix 自動修 class ordering
- [x] 檢查並修正 `!important`（在 `src/index.css` 中）
- [ ] 將自訂類名加入 Tailwind safelist (若需要)
- [ ] 強制重建並透過瀏覽器檢查結果

---

如要我代為逐一移除 `!important` 或把特定樣式改為 Tailwind utility（或改寫 `tailwind.config.cjs` 的 safelist），我可以直接在 repo 中編輯並跑一次重建檢查。請回覆你想下一步我直接做哪幾件事。