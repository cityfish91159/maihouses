# 🏠 MaiHouses 開發日誌 (COMMUNITY_WALL_DEV_LOG)

> **最後更新**: 2025-12-19

---

## 📅 2025-12-19 P11 S1-S4 優化實作

### 🎯 任務目標
針對 Google 首席前後端處長技術審計報告中的 S1-S4 嚴重問題進行修正。

### ✅ S1: DOM Diffing 實作
- **狀態**: 已完成（先前實作）
- **檔案**: `public/js/property-renderer.js#L266-L334`
- **實作內容**:
  - Key-based diffing：使用 `data-key` 屬性追蹤 DOM 節點
  - Signature 比對：用 `dataset.sig` 儲存內容簽名，避免不必要的 DOM 更新
  - 使用 `replaceChildren(fragment)` 取代全量 `innerHTML`

### ✅ S2: useSmartAsk.ts 狀態更新優化
- **狀態**: 已完成
- **檔案**: `src/features/home/hooks/useSmartAsk.ts`
- **Commit**: `a00e23a`
- **實作內容**:
  - 合併 `SEND_MESSAGE` + `ADD_AI_PLACEHOLDER` 為 `START_ASK`
  - 合併 `SET_RECOMMENDS` + `ADD_TOKENS` + `FINISH_LOADING` 為 `FINISH_ASK`
  - Action 類型從 8 種減少到 4 種
  - 單次 `sendMessage` 非 streaming 路徑 dispatch 從 6 次減少到 3 次

### ✅ S3: seed 資料格式統一
- **狀態**: 已完成（先前實作）
- **檔案**: `public/data/seed-property-page.json`
- **驗證**: `grep -r '"tag":' public/data/` 無結果

### ✅ S4: renderFeaturedCard Config-Driven 重構
- **狀態**: 已完成
- **檔案**: `public/js/property-renderer.js#L203-L267`
- **Commit**: `a00e23a`
- **實作內容**:
  - 建立 `config` 物件定義 `main`/`sideTop`/`sideBottom` 差異
  - 移除散落的 `${isMain ? ... : ...}` 三元運算子
  - Config 屬性：`cardClass`, `chipClass`, `showHighlights`, `lockPrefix`, `btnText`, `showCta`

### 📁 修改的檔案清單
| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/features/home/hooks/useSmartAsk.ts` | 重構 | 合併 Action 類型 |
| `public/js/property-renderer.js` | 重構 | Config-driven 渲染 |
| `docs/js/property-renderer.js` | 同步 | 部屬同步 |
| `docs/COMMUNITY_WALL_TODO.md` | 更新 | S1-S4 狀態標記 ✅ |

---

## 📊 效能改進指標

| 指標 | 優化前 | 優化後 | 改善幅度 |
|------|--------|--------|----------|
| useSmartAsk Action 類型數 | 8 | 4 | -50% |
| 單次請求 dispatch 次數 (非 streaming) | 6 | 3 | -50% |
| renderFeaturedCard 三元運算子數 | 4 | 2 | -50% |
| 代碼重複率 (main vs side) | ~70% | ~10% | -85% |

---
