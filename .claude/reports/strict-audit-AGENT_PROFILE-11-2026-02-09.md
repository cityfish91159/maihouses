# Strict Audit Report — AGENT PROFILE #11

## 基本資訊
- 稽核模式：`/strict-audit`
- 稽核目標：`.claude/tickets/AGENT PROFILE.md` 的 `[x] #11`
- 稽核日期：2026-02-09
- 稽核範圍：
  - `src/pages/PropertyDetailPage.tsx`
  - `src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx`
  - `src/pages/__tests__/PropertyDetailPage.phase11.test.tsx`
  - `.claude/tickets/AGENT PROFILE.md`（#11 區段）

## 已執行步驟（完整）
1. 讀取 `strict-audit` 技能規範，確認輸出格式與證據要求。
2. 讀取 `AGENT PROFILE.md` 的 #11 區段，整理驗收項與宣稱內容。
3. 全量檢視 `PropertyDetailPage.tsx` 相關程式碼路徑（Header、返回、Logo、物件編號位置、A11y 屬性）。
4. 全量檢視 #11 相關測試檔：
   - `PropertyDetailPage.header-branding.test.tsx`
   - `PropertyDetailPage.phase11.test.tsx`
5. 執行 #11 指定驗證命令並記錄結果：
   - `npm run test -- src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx src/pages/__tests__/PropertyDetailPage.phase11.test.tsx`（13/13 pass）
   - `npm run typecheck`（pass）
   - `npm run lint`（pass）
   - `npm run check:utf8`（pass）
6. 交叉比對工單紀錄與實際代碼是否一致（含 #17 已移除 FAB 的前後一致性）。

## Findings（依嚴重度排序）

### 1) Medium — #11 已勾選「320px 無溢出」，但沒有對應可驗證測試證據
- 證據：
  - `.claude/tickets/AGENT PROFILE.md:1394`（標記已完成：手機版 320px 無溢出）
  - `src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx:142-201`（無 viewport=320 的排版溢出驗證）
- 影響：
  - 目前只能依程式碼推定「大概率不溢出」，但無法防止後續 CSS 變更造成 320px 回歸。
  - 驗收勾選與可重現證據存在落差。
- 建議（最小修復）：
  - 新增 1 個 RWD 測試（建議 e2e/視覺回歸）：
    - viewport 320x568
    - 斷言 `document.documentElement.scrollWidth <= window.innerWidth`
    - 檢查 Header 區塊無水平滾動。

### 2) Medium — #11 的 A11y 驗收項被宣告完成，但測試只驗證「有 aria-label」，未驗證「正確語意名稱」
- 證據：
  - `.claude/tickets/AGENT PROFILE.md:1392`（宣稱 aria-label 完整）
  - `src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx:153-159,192-193`
    - 使用 `nav[aria-label]`、`a[href=\"/maihouses/\"][aria-label]`、`button[aria-label]`
    - 未檢查名稱是否為「物件導覽 / 回到邁房子首頁 / 返回上一頁」。
- 影響：
  - 若未來 aria-label 文案被誤改（例如空字串或無語意），現有測試仍可能通過。
- 建議（最小修復）：
  - 改用角色 + 可及名稱斷言：
    - `getByRole('navigation', { name: '物件導覽' })`
    - `getByRole('link', { name: '回到邁房子首頁' })`
    - `getByRole('button', { name: '返回上一頁' })`

### 3) Low — #11 工單敘述含過時項目（FAB 漸層），與已完成 #17 的「移除 FAB」衝突
- 證據：
  - `.claude/tickets/AGENT PROFILE.md:1359`（#11-C 仍記錄「報告 FAB 漸層」）
  - `.claude/tickets/AGENT PROFILE.md:41`（#17 已完成移除 FAB）
  - `src/pages/PropertyDetailPage.tsx` 中已無「生成報告 FAB」代碼（實際不存在可改動目標）
- 影響：
  - 施工紀錄可追溯性下降，後續維護者會被誤導到不存在的代碼路徑。
- 建議（最小修復）：
  - 在 #11 區段刪除該列，或加註「已被 #17 移除，改動不再適用」。

## 做得好的部分（簡述）
- #11 核心功能在代碼層面已正確落地：
  - Header 使用共用 `Logo`（`src/pages/PropertyDetailPage.tsx:569-574`）
  - 返回按鈕有可用邏輯與 a11y 屬性（`src/pages/PropertyDetailPage.tsx:561-566`）
  - 物件編號已從 Header 移至內容區並有 `role=\"status\"`（`src/pages/PropertyDetailPage.tsx:629-638`）
  - `border-brand-100` 等 token 化已生效（`src/pages/PropertyDetailPage.tsx:558,633`）
- 驗證命令均通過（測試、typecheck、lint、utf8）。

## 開放問題 / 假設
- 返回邏輯目前以 `window.history.length > 1` 判斷（`src/pages/PropertyDetailPage.tsx:53`）。
  - 假設：只要有歷史紀錄就應回上一頁（含站外頁）。
  - 若產品期望「避免返回站外」，需補規格明確化（目前工單未定義）。

## 殘餘風險與測試缺口
- 殘餘風險：RWD 回歸（320px）與 aria-label 文案回歸目前仍有漏網可能。
- 缺口總結：
  - 缺 viewport 320 排版溢出驗證
  - 缺 aria-label 文案精準斷言
  - 缺工單敘述與跨工單（#11 vs #17）一致性整理

## 稽核結論
- 功能可用性結論：`#11` 主要功能為「通過」。
- 嚴格交付結論：`#11` 在「證據完整性與文件一致性」仍有改善空間，建議先補上上述 3 點再視為高可信封板。
