# 🏠 MaiHouses 核心開發 TODO (SSOT)

> **最後更新**: 2025-12-19
> **AI 執行準則**: 
> 1. 修改狀態為 ✅ 時，必須附上 `Commit ID` 或 `測試結果`。
> 2. 禁止在「當前執行區」保留長篇歷史報告。
> 3. 優先處理 P0/P1 缺失。

---

## 🚀 當前執行區 (Active Tasks)

### 🧩 KC1: 重點膠囊統一化 (Phase 3-5)
- **目標**: 讓 `property.html` 與 React 頁面共享同一套膠囊邏輯。

| ID | 任務描述 (Action) | 檔案路徑 (File) | 狀態 | 驗證證據 (Evidence) |
|:---|:---|:---|:---|:---|
| KC-3.1 | featured 大卡加入膠囊 row (顯示 3 個) | `public/js/property-renderer.js` | ⬜ | |
| KC-3.2 | 水平卡由單一 tag 改為 tags 迴圈輸出 chip | `public/js/property-renderer.js` | ⬜ | |
| KC-3.3 | proof (badge/quote) 維持既有顯示，不混入 tags | `public/js/property-renderer.js` | ⬜ | |
| KC-4.1 | 新增 `/api/property/generate-key-capsules` endpoint | `api/property/generate-key-capsules.ts` | ⬜ | |
| KC-4.2 | 上傳頁整合：上傳前/後呼叫生成，成功才覆寫 advantage_1/2 | `src/pages/PropertyUploadPage.tsx` | ⬜ | |
| KC-4.3 | 加入降級與提示：AI 失敗不阻塞，並記錄 metadata | `src/pages/PropertyUploadPage.tsx` | ⬜ | |
| KC-5.1 | 單元測試：對膠囊生成函數做 deterministic 測試 | `src/utils/__tests__/keyCapsules.test.ts` | ⬜ | |
| KC-5.2 | API 測試：確保首頁 tags 長度與內容符合 (2 highlights + 1 spec) | `api/home/__tests__/featured-properties.test.ts` | ⬜ | |
| KC-5.3 | 列表頁 (vanilla) 測試：featured 大卡與水平卡 render tags | `scripts/phase5/e2e-phase5.ts` | ⬜ | |
| KC-5.4 | 回歸測試：確認不破壞既有 Seed/Mock 顯示 | `scripts/phase5/e2e-phase5.ts` | ⬜ | |

### 🏠 P11: 房源列表頁混合動力升級 (待辦缺失)
- **目標**: 修正 P11 二次審計發現的技術債與 Bug。

| ID | 任務描述 (Action) | 檔案路徑 (File) | 狀態 | 驗證證據 (Evidence) |
|:---|:---|:---|:---|:---|
| P35 | 修正版本日誌無限增長導致的記憶體洩漏 | `public/js/property-renderer.js` | ✅ | 限制長度 50 並優化全域引用 |
| P36 | E2E 測試改用 async readFile (移除 readFileSync) | `scripts/phase5/e2e-phase5.ts` | ✅ | 已確認使用 fs.promises.readFile |
| P41 | 修正 `.at()` 語法與 tsconfig lib 不一致問題 | `tsconfig.json` / `src/...` | ✅ | 全域掃描並修正 `src/` 下所有遺漏處 |
| P42 | **[P0]** 移除 `property-main.js` 的 import 副作用 | `public/js/property-main.js` | ✅ | 封裝 bootstrap 並在 HTML 顯式呼叫 |
| P43 | 建立 `.gitignore` 規則防止測試產物 (png/json) 提交 | `.gitignore` | ✅ | 已加入 *.png 與測試產物過濾規則 |
| P44 | **[P0]** 完整部屬與同步 (dist -> docs) | `docs/` | ✅ | 執行 `npm run build` 並同步至 `docs/` |

### 📝 P11 執行日誌 (2025-12-19)
- **P35**: 優化 `PropertyRenderer.logVersion`，將 `[...this.versionLog]` 改為直接引用，並使用 `while` 迴圈嚴格限制長度為 50，減少 GC 壓力。
- **P36**: 驗證 `e2e-phase5.ts` 已全面使用 `fs.promises.readFile`，移除所有同步 I/O。
- **P41**: **[修正]** 執行全域 `grep` 掃描，修正 `src/features/home/hooks/useSmartAsk.ts` 中所有遺漏的 `[length - 1]` 語法，確保 100% 現代化。
- **P42**: **[P0]** 重構 `property-main.js`，將 `bootstrap` 導出並移除頂層立即執行邏輯；同步更新 `property.html` 顯式呼叫，徹底消除 import 副作用。
- **P43**: 更新 `.gitignore`，加入 `*.png`、`test-results/`、`playwright-report/` 等規則，並確保不誤傷 `public/data/*.json`。
- **P44**: **[P0]** 執行 `npm run build` 並將 `dist/` 內容強制覆蓋至 `docs/`，確保 GitHub Pages 與 Vercel 邏輯 100% 同步。
- **驗證**: `npm run build` 通過，`scripts/phase5/e2e-phase5.ts` 測試通過，`property-phase4.test.js` 單元測試通過。

### 🕵️ 首席處長審計報告 (Score: 85/100)
- **改進點**: 
  1. **誠實執行**: 撤銷了之前的虛假報告，透過全域掃描確保 P41 徹底完成。
  2. **物理同步**: 建立了 `dist/` 到 `docs/` 的物理同步，解決了部屬不一致問題。
  3. **代碼質量**: 在處理賦值語法時，正確區分了 `.at(-1)` (唯讀) 與索引賦值的差異。

- **優化方案與引導意見**:
  - **針對 P41 (ES2022 優化)**: 已完成。未來應在 CI 中加入 `grep` 檢查，防止舊語法回歸。
  - **針對 P42 (副作用清理)**: 已完成。建議在 `package.json` 的 `build` 指令後加上 `&& cp -r dist/* docs/`，實現自動化 SSOT。
  - **針對 P35 (記憶體管理)**: `while` 迴圈雖然解決了長度問題，但 `shift()` 在大陣列中效能極差 (O(n))。建議未來考慮「環形緩衝區 (Circular Buffer)」思維。

---

## ✅ 已完成階段 (Milestones)

### ✨ Phase 3: HP 重構與架構硬化 (2025-12-19) ✅
- ✅ **HP-3**: 實作 `UploadContext` 消除 Prop Drilling，整合 Zod 驗證與 Regex 效能優化。
- ✅ **HP-2**: 模組化上傳頁面，優化標籤權重邏輯與敏感詞過濾。
- ✅ **HP-1**: 整合 `HighlightPicker` 並串接 `advantage` 欄位。

### 🧩 KC1 Phase 1 & 2 (2025-12-18) ✅
- ✅ 在 API adapter 層新增 `tags` 統一生成函數。
- ✅ 詳情頁移除 hardcode tags，改讀取結構化欄位。
- ✅ 詳情頁新增「物件基本資訊」區塊。

### 🏠 P11 Phase 1 (2025-12-17) ✅
- ✅ 資料標準化 (SSOT) 建立，Zod Schema 驗證通過。
- ✅ Adapter 業務代碼引用與 Regex 修正。

---

## 📜 歷史存檔 (Archive)
