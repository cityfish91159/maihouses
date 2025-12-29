# 🏠 MaiMai 公仔互動 + 591 一鍵搬家 TODO (SSOT)

> **最後更新**: 2025-12-29
> **目標**: 將 MaiMai 從靜態吉祥物升級為「情緒化智能助理」，並實作「591 一鍵搬家」黑科技
> **首頁**: https://maihouses.vercel.app/maihouses/
> **上傳頁**: https://maihouses.vercel.app/maihouses/property/upload

---

## 📋 摘要 (Executive Summary)

| 優先級 | 任務 | 狀態 | 預估工時 | 審計分數 |
|:---:|:---|:---:|:---:|:---:|
| P0 | MM-1 MaiMai 原子組件整合 | ✅ | 2hr | 100/100 |
| P0 | MM-2 慶祝動畫 (canvas-confetti) | ✅ | 1hr | 100/100 |
| P0 | IM-1 智慧貼上監聽器 | ✅ | 2hr | 100/100 |
| P0 | IM-2 591 生產級解析器 | ✅ | 3hr | 100/100 |
| P1 | MM-3 情緒狀態機 (Mood FSM) | ✅ | 2hr | 100/100 |
| P1 | IM-3 重複匯入偵測 | ✅ | 1hr | 100/100 |
| P1 | IM-4 iOS 捷徑支援 | ⬜ | 1hr | - |
| P2 | MM-4 對話歷史氣泡 | ✅ | 1hr | 100/100 |
| P2 | IM-5 解析品質追蹤 API | ⬜ | 1hr | - |
| P3 | MM-5 MaiMai 全站統一實例 | ✅ | 2hr | 100/100 |

> **⚠️ 狀態說明**: ⬜ 未開始 | 🔧 進行中 | ⚠️ 需修正 | ✅ 完成 (100分)

---

## 🎭 MaiMai 公仔互動模組

### MM-1: MaiMai 原子組件整合 ✅ 100/100

**完成時間**: 2025-12-24
**最終更新**: 2025-12-24
**審計評分**: 100/100 (v3 所有缺失已修復，commit c0418a1)

**成果**:
- 新增 `src/components/MaiMai/` 目錄
- `types.ts`: MaiMaiMood 型別 (10種心情)
- `MaiMaiBase.tsx`: SVG 骨架 + 所有心情狀態渲染
- `useMaiMaiMood.ts`: 心情狀態機 Hook (優先級計算)
- `MaiMaiSpeech.tsx`: 對話氣泡組件
- `index.ts`: 統一匯出

**重構成果**:
| 組件 | 原行數 | 新行數 | 減少 |
|:---|:---:|:---:|:---:|
| MascotMaiMai.tsx | 97 | 35 | -64% |
| MascotInteractive.tsx | 510 | 86 | -83% |
| MascotHouse.tsx | 215 | 132 | -39% |

**驗證**: 324/324 測試通過，TypeScript 編譯通過

---

### MM-1.H 待修 (100/100) ✅

| # | 問題 | 修復方式 | 狀態 |
|:---:|:---|:---|:---:|
| H.1 | 模組層含 JSX | `extraType` 純資料標記 | ✅ |
| H.2 | 兩處姿態表 | 刪除重複，統一 SSOT | ✅ |
| H.3 | 對稱性硬編碼 | `mirrorPath()` 自動鏡像 | ✅ |
| H.4 | Magic Numbers | 30+ 座標常數 | ✅ |
| H.5 | 類型定義模糊 | JSDoc + `EyeData` 介面 | ✅ |

---

### MM-1.H.v2 待修 (92/100) ⚠️

| # | P | 問題 | 怎麼修 | 狀態 |
|:---:|:---:|:---|:---|:---:|
| v2.1 | 0 | `EFFECT_POSITIONS` 類型混亂 | 全改陣列 + discriminated union | ✅ |
| v2.2 | 0 | Antenna `+ 2` 魔數 | 抽 `ANTENNA_DROOP_PEAK_OFFSET` 常量並套用 | ✅ |
| v2.3 | 1 | `transition-all` 對 path d 無效 | 抽 `T_OPACITY` 常量；靜態元素移除 transition；12 處優化 | ✅ |
| v2.4 | 1 | Effects 用 emoji 文字 | `React.memo` + `useMemo` + 顏色常量化；獨立 `EffectStar/Sparkle/Confetti` 組件 | ✅ |
| v2.5 | 1 | `animate-wiggle` 未定義 | 刪除 index.css 重複定義，統一使用 tailwind.config.cjs SSOT | ✅ |
| v2.6 | 2 | `RenderEye` 沒 memo | 用 `React.memo(RenderEye)` 包 | ✅ |
| v2.7 | 2 | `ARM_POSES` 冗餘 | 內聯至 `MOOD_CONFIGS.arms`，刪除獨立常量 | ✅ |
| v2.8 | 3 | 常量沒註解 | 每個座標常量加 JSDoc 說明計算來源 | ✅ |

---

### MM-1.H.v3 待修 (100/100) ✅

| # | P | 問題 | 怎麼修 | 狀態 |
|:---:|:---:|:---|:---|:---:|
| v3.1 | 0 | arms 路徑 Magic Numbers | 定義 `ARM_OFFSET_*` 常量組 | ✅ |
| v3.2 | 0 | EffectConfetti 比例係數 | 定義 `CONFETTI_RECT_*` 常量組 | ✅ |
| v3.3 | 1 | JSDoc 範例硬編碼 | 刪除 `MaiMaiBase.tsx:214` 的 `-7`, `h 14` 範例 | ✅ |
| v3.4 | 1 | useConfetti Magic Numbers | 抽取至 `CONFETTI_CONFIG` | ✅ |
| v3.5 | 2 | types.ts 膨脹 | 拆分 types/constants/configs | ✅ |
| v3.6 | 2 | EffectStar 頂點計算 | 預計算 `STAR_UNIT_VERTICES` | ✅ |
| v3.7 | 2 | 空殼測試 | 刪除 `MaiMai.test.ts:82-95` 假測試，補 `EFFECT_POSITIONS`/`mirrorPath` 測試 | ✅ |
| v3.8 | 2 | sleep/wave 用 text | 確認合理 | ✅ |
| v3.9 | 3 | viewBox 硬編碼 | 改用 `CANVAS_*` 常量 | ✅ |
| v3.10 | 3 | transition 類名重複 | 抽取 `T_TRANSFORM` 常量 | ✅ |

---

### MM-2: 慶祝動畫 ✅ 100/100

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| MM-2.1 | 安裝依賴 | ✅ | 改用 `canvas-confetti` |
| MM-2.2 | 建立 `useConfetti.tsx` | ✅ | Hook 可用 |
| MM-2.3 | 整合 celebrate | ✅ | 心情變化時自動撒花 |
| MM-2.4 | 監聽事件 | ✅ | `mascot:celebrate` 可觸發 |

**修復紀錄**:

| # | 問題 | 怎麼修 | 狀態 |
|:---:|:---|:---|:---:|
| MM-2.H1 | 依賴混用 | `npm uninstall react-canvas-confetti && npm install canvas-confetti` | ✅ |
| MM-2.H2 | JSDoc 說謊 | `useConfetti.tsx:3` 註解改為 `canvas-confetti` | ✅ |

---

### MM-3: 情緒狀態機 (Mood FSM) ✅ 100/100

**完成時間**: 2025-12-24
**審計評分**: 100/100 (CSS 動畫 + 測試覆蓋)

**心情定義**: 10 種心情 (`types.ts`) ✅

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| MM-3.1 | 定義 `MaiMaiMood` 型別 | ✅ | `types.ts` 定義完整 |
| MM-3.2 | 實作 `useMaiMaiMood` Hook | ✅ | 優先級邏輯正確 |
| MM-3.3 | 加入心情轉換動畫 | ✅ | 使用 key 觸發的 `animate-fadeIn` CSS 動畫，移除 setTimeout |
| MM-3.4 | 整合 MascotInteractive 現有邏輯 | ✅ | 整合正常 |

**修復說明**:
1. **H1 真實過渡**: 改用 Tailwind `animate-fadeIn`，以 SVG `key` 重新掛載觸發淡入，移除延時。
2. **H2 零 timer 警告**: 刪除 `setTimeout` 與額外 state，避免 `act(...)` 警告。
3. **H3 邏輯矯正**: 立即使用最新 mood 繪製（`data-mood` 標註），無延遲。
4. **H4 測試補齊**: 新增 `MaiMaiBase.test.tsx` 覆蓋 CSS 動畫 class 與同步更新。

---

### MM-4: 對話歷史氣泡 ✅ 100/100

**完成時間**: 2025-12-24
**審計評分**: 100/100 (補齊無障礙 + 測試)

**設計**: 最近 3 句對話氣泡 ✅

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| MM-4.1 | 建立 `MaiMaiSpeech.tsx` | ✅ | 功能正常 |
| MM-4.2 | 舊訊息淡出樣式 | ✅ | `line-through` 效果正確 |
| MM-4.3 | 滑入動畫 | ✅ | `slide-in` 效果正確 |

**修復說明**:
1. **測試補齊**: 新增 `MaiMaiSpeech.test.tsx`，驗證只顯示最近 3 句、最新訊息粗體、舊訊息刪除線。
2. **無障礙 (A11y)**: 追加 `role="status"`、`aria-live="polite"`、`aria-atomic="true"` 與 aria label，螢幕閱讀器可即時朗讀。

---

### MM-5: MaiMai 全站統一實例 ✅ 100/100

**完成時間**: 2025-12-24
**審計評分**: 100/100 (功能完整，測試覆蓋充足)

**核心**: `MaiMaiContext.tsx` 全站狀態管理 ✅

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| MM-5.1 | 建立 Context | ✅ | 結構正確 |
| MM-5.2 | App Provider | ✅ | 已整合 |
| MM-5.3 | API 完整性 | ✅ | CRUD 完整 |

**✨ 優化項目**:
1. **資料驗證**: 已加入 `isValidMood(stored)` 運行時驗證，防止 localStorage 竄改導致崩潰。
2. **測試覆蓋**: 新增 11 個單元測試 (`MaiMaiContext.test.tsx`) 覆蓋所有邏輯。

---

## 🚚 591 一鍵搬家模組

### IM-1: 智慧貼上監聽器 ✅ 100/100

**完成時間**: 2025-12-24
**最終更新**: 2025-12-29
**審計評分**: 100/100 (v2 所有缺失已修復)

**核心理念**: 非侵入式監聽 `paste` 事件。若焦點在 `INPUT/TEXTAREA`，則不攔截。

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| IM-1.1 | 在 `PropertyUploadPage` 加入 `paste` 監聽 | ✅ | 事件處理器已綁定 |
| IM-1.2 | 排除 `INPUT/TEXTAREA` 焦點衝突 | ✅ | 在標題框內貼上不觸發自動填表 |
| IM-1.3 | 智慧偵測 591 內容 | ✅ | 包含「591」或「萬+坪」才觸發 |
| IM-1.4 | 顯示處理中 Loading 狀態 | ✅ | 用戶知道系統正在處理 |

**驗證**: TypeScript 編譯通過，所有 AC 已達成

---

### IM-1.H.v2 待修 (100/100) ✅

| # | P | 問題 | 怎麼修 | 狀態 |
|:---:|:---:|:---|:---|:---:|
| v2.1 | 0 | IM-AC3 未實作（自動滾動） | `PropertyUploadPage.tsx` 加入 `scrollIntoView` + 3s delay | ✅ |
| v2.2 | 0 | `TwoGoodsSection` 無 ID | 加入 `id="two-goods-section"` | ✅ |
| v2.3 | 1 | 解析失敗仍等 500ms | 重構：失敗立即回饋；高信心 500ms，低信心 200ms | ✅ |
| v2.4 | 2 | `useConfetti.tsx` 類型錯誤 | 早期已修：`ReturnType<typeof confetti.create>` | ✅ |

---

### IM-2: 591 生產級解析器 ✅ 100/100

**完成時間**: 2025-12-29
**審計評分**: 100/100 (已修復 Google v2.3 審查之 6 項建議)

**設計**: 帶「信心分數」的解析器，MaiMai 根據分數展現不同情緒。

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| IM-2.1 | 價格解析 (售/租通用) | ✅ | 已確保 simpleRentMatch 為萬/月 |
| IM-2.2 | 坪數解析 | ✅ | 已支援模糊格式 |
| IM-2.3 | 格局解析 | ✅ | 已支援 1+1房、2.5房 |
| IM-2.4 | 地址解析 (全台通用) | ✅ | 已支援無門牌寬鬆模式 |
| IM-2.5 | 標題擷取 | ✅ | 已放寬房產詞限制 |
| IM-2.6 | 591 物件 ID 擷取 | ✅ | 匹配 `detail/123456` 等 |
| IM-2.7 | 信心分數計算 | ✅ | fieldsFound 計分邏輯修正完畢 |

#### IM-2 審查 v2.3 (優化建議) ✅ 已全數修復

| P | 問題 | 建議方案 | 狀態 |
|:---:|:---|:---|:---:|
| P0 | 價格單位一致性 | `simpleRentMatch` 也需轉 `萬/月`，保持一致 | ✅ |
| P1 | 標題門檻過嚴 | 無房產詞但有正向詞（如景觀）應保留 | ✅ |
| P1 | 格局漏失效 | 支援 1+1房、2.5房 | ✅ |
| P1 | 地址寬鬆模式 | 支援僅有「區+路/街」無門牌 | ✅ |
| P1 | Detect591 租金偵測 | 「租金+地名」應加強計分 | ✅ |
| P2 | UX 延遲微調 | 高信心 500ms / 低信心 200ms | ✅ |


---

### IM-3: 重複匯入偵測 ✅ 100/100

**完成時間**: 2025-12-29
**實作方式**:
- 使用 `useRef` 記錄 `lastImportedId`
- ID 不同時使用 `window.confirm` 阻擋流程
- UX: 取消則保留原內容，確認則覆蓋

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| IM-3.1 | 記錄 `lastListingId` 狀態 | ✅ | `lastImportedIdRef` |
| IM-3.2 | 偵測新舊 ID 不同 | ✅ | `parsed.listingId !== ref.current` |
| IM-3.3 | 彈出確認對話框 | ✅ | `window.confirm` (符合 AC) |
| IM-3.4 | 支援強制覆蓋 `forceOverwrite` | ✅ | 確認後繼續執行匯入 |

**💡 首席架構師指引**:
> 「重複匯入的 UX 很重要。不要直接覆蓋，也不要每次都問。只有當 **ID 不同** 時才詢問。」

---

### IM-4: iOS 捷徑支援 ⬜

**設計**: 支援 iOS Shortcuts 直接傳遞 591 內容至上傳頁。

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| IM-4.1 | 監聽 URL `?importText=` 參數 | ⬜ | 頁面載入時自動觸發匯入 |
| IM-4.2 | 處理 URI decode | ⬜ | 正確解析中文字元 |
| IM-4.3 | 處理後清除 URL 參數 | ⬜ | 避免重新整理時重複匯入 |
| IM-4.4 | 防止重複處理 | ⬜ | 使用 `useRef` 記錄是否已處理 |

**💡 首席架構師指引**:
> 「iOS 捷徑的 URL 可能很長，記得用 `decodeURIComponent` 解碼。處理後用 `setSearchParams` 清除參數，且設定 `replace: true` 避免污染歷史紀錄。」

---

### IM-5: 解析品質追蹤 API ⬜

**設計**: 後端追蹤解析結果，用於優化 Regex。

| ID | 子任務 | 狀態 | 驗收標準 |
|:---|:---|:---:|:---|
| IM-5.1 | 建立 `api/analytics/import.ts` | ⬜ | Vercel Serverless 函數 |
| IM-5.2 | 記錄 `textLength`, `confidence`, `fieldsFound` | ⬜ | 可查詢哪個欄位最常失敗 |
| IM-5.3 | 寫入 Supabase analytics 表 | ⬜ | 每週可分析解析品質 |

**💡 首席架構師指引**:
> 「這是 P2 任務，先確保前端功能完善。追蹤 API 的價值在於 **發現 591 改版**：如果某週的價格解析成功率突然下降，就知道該更新 Regex 了。」

---

## 🎯 驗收標準 (Acceptance Criteria)

### 公仔互動驗收
1. **MM-AC1**: 點擊 MaiMai 5 次會觸發 `celebrate` 心情 + 撒花動畫
2. **MM-AC2**: 在 SmartAsk 輸入問題時，MaiMai 顯示 `thinking` 心情
3. **MM-AC3**: 問答成功後，MaiMai 顯示 `excited` 心情並撒花
4. **MM-AC4**: 對話氣泡顯示最近 3 句，最新一句粗體

### 一鍵搬家驗收
1. **IM-AC1**: 在空白處貼上 591 內容，自動填入價格、坪數、地址
2. **IM-AC2**: 在標題輸入框內貼上 591，**不會**觸發自動填表
3. **IM-AC3**: 匯入成功後 3 秒，自動滾動至「兩好一公道」區塊
4. **IM-AC4**: 貼上物件 A 後再貼上物件 B，彈出確認視窗
5. **IM-AC5**: iOS 用戶可透過捷徑直接分享 591 連結至上傳頁

---

## 📁 檔案變更預覽

```
src/
├── components/
│   └── MaiMai/                      # 新建目錄
│       ├── index.ts
│       ├── MaiMaiBase.tsx
│       ├── MaiMaiMood.tsx
│       ├── MaiMaiSpeech.tsx
│       ├── useMaiMaiMood.ts
│       ├── useConfetti.ts
│       └── types.ts
├── pages/
│   └── PropertyUploadPage.tsx       # 修改：加入貼上監聽
├── lib/
│   └── parse591.ts                  # 新建：解析器
api/
└── analytics/
    └── import.ts                    # 新建：追蹤 API
```

---

## 📊 測試計畫

| 測試類型 | 檔案 | 涵蓋範圍 |
|:---:|:---|:---|
| 單元測試 | `parse591.test.ts` | 各種 591 格式變體 |
| 單元測試 | `useMaiMaiMood.test.ts` | 心情狀態機優先級 |
| E2E 測試 | `import.spec.ts` | 貼上流程、重複偵測 |
| 視覺測試 | Storybook | MaiMai 各心情狀態 |

---

## 💡 開發順序建議

```
IM-2 (解析器) → IM-1 (監聽器) → MM-2 (撒花) → MM-3 (心情) → 其他
```

**原因**: 解析器是核心，沒有它其他功能都無法驗證。監聽器是入口，撒花是最有感的 UX 提升。

---

## 📜 舊任務存檔 (已完成)

| 任務 | 狀態 | 分數 |
|:---|:---:|:---:|
| UP-1 表單自動快照 | ✅ | 98/100 |
| UP-2 圖片前端壓縮 | ✅ | 100/100 |
| UP-3 圖片管理重構 | ✅ | 95/100 |
| UP-4 亮點膠囊分流 | ✅ | 100/100 |

> 完整歷史：見 `docs/COMMUNITY_WALL_DEV_LOG.md`
