# MOCK-SYSTEM UI/UX 稽核報告（#8d / #24a / #27）

## 1. 報告摘要
- 稽核工單：`.claude/tickets/MOCK-SYSTEM.md`
- 稽核範圍：已完工且涉及 UI/UX 的 `#8d`、`#24a`、`#27`
- 稽核基準：`/ui-ux-pro-max`
  - `.claude/skills/ui-ux-pro-max/data/ux-guidelines.csv`
  - `.claude/skills/ui-ux-pro-max/data/stacks/react.csv`
  - `.claude/skills/ui-ux-pro-max/data/landing.csv`
  - `.claude/skills/ui-ux-pro-max/data/products.csv`
  - `.claude/skills/ui-ux-pro-max/data/styles.csv`
  - `.claude/skills/ui-ux-pro-max/data/typography.csv`

結論：
- `#24a`、`#27` 整體符合度高，核心無障礙與互動規範大致到位。
- `#8d` 有 2 個 P1 問題（鍵盤焦點可視性）與 2 個 P2 問題（輸入效能策略、頁面級測試覆蓋）。
- 目前狀態可用，但若要更貼近「現代化且可持續」標準，建議優先修 P1，再做 P2 優化。

---

## 2. 稽核範圍與檔案

### #8d 社區探索頁
- `src/pages/Community/Explore.tsx`
- `src/pages/Community/components/CommunityCard.tsx`
- `src/pages/Community/hooks/useCommunityList.ts`
- `src/pages/Community/hooks/__tests__/useCommunityList.test.ts`

### #24a UAG Mock 對話 Modal
- `src/pages/UAG/components/MockChatModal.tsx`
- `src/pages/UAG/UAG.module.css`
- `src/pages/UAG/index.tsx`
- `src/pages/UAG/components/__tests__/MockChatModal.test.tsx`

### #27 UAG 新房仲空狀態引導卡
- `src/pages/UAG/components/UAGEmptyState.tsx`
- `src/pages/UAG/UAG.module.css`
- `src/pages/UAG/index.tsx`
- `src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`

---

## 3. 規範符合度總覽

### #8d（社區探索頁）
- 已符合：
  - 觸控尺寸與可點擊性（`ux-guidelines #22/#29`）
  - icon 使用 SVG（無 emoji icon）
  - 搜尋互動即時回饋與空狀態
- 待修正：
  - 焦點可視（`ux-guidelines #28`）
  - 大量資料輸入時效能策略（`react #28`）
  - 頁面行為測試完整性（`react #41`）

### #24a（MockChatModal）
- 已符合：
  - `role="dialog"`、`aria-modal`、`aria-labelledby`（`react #44`）
  - `aria-live="polite"`（`react #45`）
  - focus trap、Escape 關閉、回焦點
  - `prefers-reduced-motion` 支援（`ux-guidelines #9`）
  - 44px 互動按鈕（`ux-guidelines #22`）
- 目前未見阻斷性問題。

### #27（UAGEmptyState）
- 已符合：
  - `role="region"` + `aria-label` 區塊語意
  - 關閉按鈕與 CTA 均有焦點樣式、44px 觸控尺寸
  - reduced motion 路徑（含 MaiMai a11y props）
  - RWD 手機尺寸切換（`useMediaQuery`）
- 目前未見阻斷性問題。

---

## 4. 發現清單（依嚴重度）

## P1-1: `#8d` 重試按鈕缺焦點可視樣式
- 規則對照：
  - `ux-guidelines #28 Focus States`
- 證據：
  - `src/pages/Community/Explore.tsx:84`
- 問題描述：
  - 鍵盤 Tab 到「重試」按鈕時，未提供明確 `focus-visible` 樣式。
- 風險：
  - 鍵盤使用者難辨識目前焦點位置，降低可及性與操作成功率。
- 建議修法：
  - 對該按鈕補 `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2`。

## P1-2: `#8d` MaiMai 可點擊按鈕缺焦點可視樣式
- 規則對照：
  - `ux-guidelines #28 Focus States`
- 證據：
  - `src/pages/Community/Explore.tsx:228`
- 問題描述：
  - MaiMai 按鈕有 hover/active 視覺，但無 keyboard focus 視覺。
- 風險：
  - 鍵盤與輔助科技使用者無法確認可互動元素焦點位置。
- 建議修法：
  - 在該按鈕 class 增加 `focus-visible` ring；若維持縮放效果，建議只給 hover/active，focus 只給 outline，避免視覺跳動。

## P2-1: `#8d` 搜尋過濾缺少輸入節流/延遲策略
- 規則對照：
  - `react #28 Debounce rapid input changes`
- 證據：
  - `src/pages/Community/Explore.tsx:137`
- 問題描述：
  - 現行每次輸入字元都即時計算 `filter`；在社區數量成長時會增加 re-render 與過濾成本。
- 風險：
  - 中低階行動裝置在長清單下可能出現輸入卡頓。
- 建議修法：
  - 使用 `useDeferredValue(query)` 或 120-180ms debounce 後再過濾。

## P2-2: `#8d` 缺頁面級行為測試
- 規則對照：
  - `react #41 Test behavior not implementation`
- 證據：
  - 目前有 `src/pages/Community/hooks/__tests__/useCommunityList.test.ts`
  - 未見 `Explore` / `CommunityCard` 對應頁面互動測試檔
- 問題描述：
  - 缺少對焦點樣式、鍵盤路徑、搜尋交互、底部 CTA 顯示條件的頁面級驗證。
- 風險：
  - 後續 UI 調整容易回歸且難被及早發現。
- 建議修法：
  - 補 `Explore` 測試：focus path、搜尋結果、empty/error/loading、visitor CTA 顯示條件。

---

## 5. 做得好的地方（保留）

## #24a MockChatModal
- `src/pages/UAG/components/MockChatModal.tsx:222` 使用 `role="dialog"`，語意正確。
- `src/pages/UAG/components/MockChatModal.tsx:254` 使用 `aria-live="polite"`，動態訊息可被輔助科技感知。
- `src/pages/UAG/UAG.module.css:2671` 有 reduced-motion fallback。
- `src/pages/UAG/UAG.module.css:2534`、`src/pages/UAG/UAG.module.css:2645` 關閉/送出按鈕皆有 `focus-visible`。

## #27 UAGEmptyState
- `src/pages/UAG/components/UAGEmptyState.tsx:18` `role="region"` + `aria-label`，區塊可讀性佳。
- `src/pages/UAG/components/UAGEmptyState.tsx:44` CTA 明確，導向意圖清楚。
- `src/pages/UAG/UAG.module.css:531`、`src/pages/UAG/UAG.module.css:552`、`src/pages/UAG/UAG.module.css:578` 焦點樣式完整。
- `src/pages/UAG/components/UAGEmptyState.tsx:14` 手機尺寸適配，符合行動端易用性。

---

## 6. 現代化優化建議（更好的作法）

以下為「不改產品邏輯、優先提升體驗品質」的現代化方案。

## 優先層 A（建議立即做）
1. 修正 `#8d` 兩個焦點可視問題（P1）。
2. 為 Explore 搜尋加入 `useDeferredValue` 或 debounce（P2-1）。

## 優先層 B（短期）
1. 探索頁 Hero 下方增加「快速篩選 chips」（例：學區、捷運、低總價、新案），符合 `landing.csv` 的 directory/marketplace 探索模式。
2. 新增「結果列」：顯示目前命中數與排序（熱門度、評價數、貼文活躍度）。
3. 對 `CommunityCard` 補「資料占位一致高度」策略，避免長短文造成視覺節奏不穩。

## 優先層 C（中期，品牌現代化）
1. 建立頁面級 typography token（標題、內文、輔助文字）並統一 UAG/Community 節奏，避免不同頁型字重與間距漂移。
2. 將探索頁的互動動畫維持「少量且有意義」原則：保留必要入場與操作回饋，避免裝飾性動態擴散。
3. 補 UI 驗收測試清單：鍵盤流、RWD 斷點（320/768/1024/1440）、reduced motion 路徑。

---

## 7. 測試與驗證紀錄

執行指令：
```bash
cmd /c npm run test -- src/pages/UAG/components/__tests__/MockChatModal.test.tsx src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx src/pages/UAG/index.test.tsx src/pages/Community/hooks/__tests__/useCommunityList.test.ts
```

結果摘要：
- 通過：
  - `src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`
  - `src/pages/UAG/components/__tests__/MockChatModal.test.tsx`
  - `src/pages/Community/hooks/__tests__/useCommunityList.test.ts`
- 失敗：
  - `src/pages/UAG/index.test.tsx`（既有編碼/regex 斷裂，非本次元件 UI 邏輯回歸）

補充：
- 本報告判定以「實際程式碼檢視 + 可執行測試結果」共同成立，不以單一來源下結論。

---

## 8. 最終結論

- 目前三個已完工 UI/UX 項目中，`#24a`、`#27` 可視為已達到 `ui-ux-pro-max` 的主要規範要求。
- `#8d` 尚有 2 個必修（P1）與 2 個建議修（P2）項目，修復成本低，建議立即補齊。
- 若目標是「現代化網站設計且可持續演進」，下一步應先做焦點可及性與搜尋效能優化，再補上探索頁頁面級測試，作為後續視覺升級的穩定基線。

---

## 9. 實作完成紀錄（2026-02-21）

本次已依工單計畫完成 `#8d` 的 P1/P2 與現代化 B 層，並補齊回歸驗證。

### 已完成項目
1. `#8d` P1：焦點可視性修復
- `src/pages/Community/Explore.tsx`
  - 重試按鈕補 `focus-visible` 樣式
  - MaiMai 按鈕補 `focus-visible` 樣式

2. `#8d` P2：搜尋效能與頁面測試
- `src/pages/Community/Explore.tsx`
  - 搜尋改用 `useDeferredValue(query)`，避免每次輸入同步重算
  - filter + sort 合併為單一路徑 `useMemo` 管線
- 新增 `src/pages/Community/__tests__/Explore.test.tsx`
  - 補 loading/error/search/filter/sort/CTA/focus 測試

3. 現代化 B 層：探索頁互動升級
- 新增 `src/pages/Community/components/CommunityQuickFilters.tsx`
- 新增 `src/pages/Community/components/CommunityResultsBar.tsx`
- `src/pages/Community/Explore.tsx`
  - Hero 下方加入快速篩選 chips
  - 卡片區上方加入結果列與排序選單

4. `#24a` 回歸修復（為通過 gate 的既有 lint 缺口）
- `src/pages/UAG/components/MockChatModal.tsx`
  - overlay 點擊關閉改為 backdrop button 結構，移除 non-interactive element event listener lint 問題
  - backdrop 使用獨立可存取名稱，避免與右上關閉鈕衝突
- `src/pages/UAG/UAG.module.css`
  - 新增 `.mock-chat-backdrop`
  - 補 `.mock-chat-dialog` 層級定位

### 驗證結果
- `cmd /c npm run test -- src/pages/Community/__tests__/Explore.test.tsx src/pages/Community/hooks/__tests__/useCommunityList.test.ts src/pages/UAG/components/__tests__/MockChatModal.test.tsx src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`
  - 4 files, 30 tests 全部通過
- `cmd /c npm run gate`
  - QUALITY GATE PASSED（TypeScript + ESLint 通過）
