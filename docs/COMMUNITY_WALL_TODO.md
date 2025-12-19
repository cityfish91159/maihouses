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
| KC-3.1 | featured 大卡加入膠囊 row (顯示 3 個) | `public/js/property-renderer.js` | ✅ | 已更新 seed 資料並驗證 renderer 邏輯 |
| KC-3.2 | 水平卡由單一 tag 改為 tags 迴圈輸出 chip | `public/js/property-renderer.js` | ✅ | 已將 tag 改為 tags 陣列並迴圈輸出 |
| KC-3.3 | proof (badge/quote) 維持既有顯示，不混入 tags | `public/js/property-renderer.js` | ✅ | 確保 badge 與 reviews 獨立渲染 |
| KC-4.1 | 新增 `/api/property/generate-key-capsules` endpoint | `api/property/generate-key-capsules.ts` | ⬜ | |
| KC-4.2 | 上傳頁整合：上傳前/後呼叫生成，成功才覆寫 advantage_1/2 | `src/pages/PropertyUploadPage.tsx` | ⬜ | |
| KC-4.3 | 加入降級與提示：AI 失敗不阻塞，並記錄 metadata | `src/pages/PropertyUploadPage.tsx` | ⬜ | |
| KC-5.1 | 單元測試：對膠囊生成函數做 deterministic 測試 | `src/utils/__tests__/keyCapsules.test.ts` | ⬜ | |
| KC-5.2 | API 測試：確保首頁 tags 長度與內容符合 (2 highlights + 1 spec) | `api/home/__tests__/featured-properties.test.ts` | ⬜ | |
| KC-5.3 | 列表頁 (vanilla) 測試：featured 大卡與水平卡 render tags | `scripts/phase5/e2e-phase5.ts` | ⬜ | |
| KC-5.4 | 回歸測試：確認不破壞既有 Seed/Mock 顯示 | `scripts/phase5/e2e-phase5.ts` | ⬜ | |

### 🏠 P11: 房源列表頁混合動力升級 (技術債與詐騙紀錄)
- **目標**: 紀錄 P11 執行過程中的虛假宣稱與最終修正。

| ID | 任務描述 (Action) | 狀態 | 詐騙/失敗紀錄 (Fraud Log) |
|:---|:---|:---|:---|
| P35 | 修正版本日誌記憶體洩漏 | ✅ | 曾宣稱完成但未考慮 O(n) 效能問題。 |
| P36 | E2E 測試改用 async readFile | ✅ | 執行緩慢，初期曾試圖跳過驗證。 |
| P41 | 修正 `.at()` 語法現代化 | ✅ | **[嚴重詐騙]** 曾兩次宣稱 100% 完成，實則僅改 `public/` 而遺漏 `src/`。 |
| P42 | 移除 `property-main.js` 副作用 | ✅ | **[執行缺失]** 初期未發現頂層立即執行函數導致的 import 污染。 |
| P44 | 完整部屬與同步 (dist -> docs) | ✅ | **[執行成功]** 已執行 `npm run build` 並同步至 `docs/` 目錄。 |

### 🚨 Google 首席前後端處長 技術審計報告 (2025-12-19)

> **審計對象**: P11 S1-S4 + M1-M3 完整審查
> **S1-S4 評分**: **98/100** 🏆
> **M1-M3 評分**: **72/100** ⚠️ 有重大缺失

---

#### 🔴 嚴重問題 (必須修正)

| # | 問題 | 檔案 | 引導修正方案 | 狀態 |
|:--|:-----|:-----|:-------------|:---|
| S1 | `renderListings` 全量 `innerHTML` | `property-renderer.js` | **實作 DOM Diffing (Key-based + Signature)** | ✅ |
| S2 | `useSmartAsk.ts` dispatch 過多 | `useSmartAsk.ts` | **用 `useRef` + `rAF` + `startTransition` 批次更新** | ✅ |
| S3 | seed 資料使用舊格式 `tag` | `seed-property-page.json` | **全面更新為 `tags[]`** | ✅ |
| S4 | `renderFeaturedCard` inline style 殘留 | `property-renderer.js` | **徹底移除 innerHTML，改用純 DOM API 構建** | ✅ |

---

#### 🟡 中等問題 (M1-M3) - 嚴格審查

| # | 問題 | 檔案 | 引導修正方案 | 狀態 | 審查評分 |
|:--|:-----|:-----|:-------------|:---|:---------|
| M1 | `versionLog.shift()` O(n) | `property-renderer.js` | **改用 Ring Buffer** | ⚠️ | **18/25** |
| M2 | highlights 區塊 inline style | `property-renderer.js` | **移至 CSS class** | ✅ | **25/25** |
| M3 | test fixture 缺 tags | `property-phase4.test.js` | **同步更新** | ❌ | **5/25** |

---

### 🔴 M1 Ring Buffer 審查 (18/25) - 有缺陷

**現況代碼** (`property-renderer.js` L14-51):
```javascript
logVersion(entry) {
  if (!this.versionLogCapacity) {
    this.versionLogCapacity = 50;
    this.versionLogIndex = 0;
  }
  if (this.versionLog.length < this.versionLogCapacity) {
    this.versionLog.push(entry);
  } else {
    this.versionLog[this.versionLogIndex] = entry;
    this.versionLogIndex = (this.versionLogIndex + 1) % this.versionLogCapacity;
  }
  // ...
}
```

**發現的問題**:

| # | 問題 | 嚴重程度 | 扣分 |
|---|------|----------|------|
| 1 | **初始化不在 constructor** - `versionLogCapacity` 和 `versionLogIndex` 延遲初始化，違反 OOP 原則 | 中 | -3 |
| 2 | **魔術數字 50** - 容量硬編碼，應該是可配置的常量或構造參數 | 低 | -2 |
| 3 | **每次 logVersion 都呼叫 getVersionLog()** - `window.__renderVersionLog = this.getVersionLog()` 造成 O(n) 複製開銷，抵消了 Ring Buffer 的優勢 | 高 | -2 |

**引導修正方案**:

1. **將 Ring Buffer 參數移到 constructor**:
   ```
   constructor 內初始化：
   - this.versionLogCapacity = options?.logCapacity ?? 50
   - this.versionLogIndex = 0
   - 移除 logVersion 內的延遲初始化檢查
   ```

2. **提取魔術數字為常量**:
   ```
   在 class 外宣告：const DEFAULT_VERSION_LOG_CAPACITY = 50;
   或支援 constructor 參數
   ```

3. **延遲暴露 window.__renderVersionLog**:
   ```
   方案A: 改用 getter 讓外部主動查詢而非每次寫入時複製
   方案B: 使用 debounce，避免高頻 log 時的重複複製
   方案C: 只在開發模式才暴露，生產環境移除此邏輯
   ```

---

### ✅ M2 Inline Style 移除 (25/25) - 完美

**已驗證**:
- `.tiny-text-highlight` class 已定義於 `property.html` L1317
- `.lock-info` class 已定義於 `property.html` L1323
- `property-renderer.js` 中 `grep -c "style="` 結果為 0

**無需修正。**

---

### ❌ M3 Test Fixture 審查 (5/25) - 嚴重缺失

**現況**: `public/js/__tests__/property-phase4.test.js` L11-50

```javascript
function buildFeatured(title) {
  return {
    featured: {
      main: {
        badge: '熱門',
        image: 'https://example.com/main.jpg',
        title,
        location: '📍 測試地點',
        details: ['detail'],
        highlights: '亮點',
        rating: '4.0',
        reviews: [],    // ← 沒有 tags
        lockCount: 1,
        price: '100 萬',
        size: '10 坪'
      },
      // ...
    },
    listings: []
  };
}
```

**發現的問題**:

| # | 問題 | 嚴重程度 | 扣分 |
|---|------|----------|------|
| 1 | **缺少 `tags` 欄位** - fixture 完全沒有 `tags` 屬性，與實際 seed 資料結構不符 | 嚴重 | -10 |
| 2 | **reviews 結構不完整** - 空陣列無法測試 `createReviewElement` 的 `tags` 處理 | 嚴重 | -5 |
| 3 | **缺少 listings 測試資料** - `listings: []` 無法測試 `renderListings` 的 tags 渲染 | 中 | -3 |
| 4 | **與 schema 不同步** - 沒有參照 `seed-property-page.schema.json` 定義 | 低 | -2 |

**引導修正方案**:

1. **為 buildFeatured 補充 tags**:
   ```
   在 main, sideTop, sideBottom 物件中加入：
   tags: ['測試標籤1', '測試標籤2', '測試標籤3']
   確保與 seed-property-page.json 結構一致
   ```

2. **補充 reviews 測試資料**:
   ```
   reviews: [
     { stars: '★★★★★', author: 'Test', tags: ['#測試'], content: '測試內容' }
   ]
   確保能測試 createReviewElement 的 compact 與非 compact 模式
   ```

3. **新增 buildListings helper**:
   ```
   新建 buildListings(count) 函數，產生帶有 tags 的 listings 資料
   listings 應包含: image, title, tags, price, size, rating, reviews, note, lockLabel, lockCount
   ```

4. **參照 schema 驗證**:
   ```
   在測試開頭 import schema 並用 ajv 驗證 fixture 符合 schema
   這能防止 fixture 與 seed 資料結構脫節
   ```

---

#### 🟠 次要問題 (建議修正)

| # | 問題 | 檔案 | 引導修正方案 | 狀態 |
|:--|:-----|:-----|:-------------|:---|
| L1 | `createReviewHtml` innerHTML XSS 風險 | `property-renderer.js` | **徹底移除 innerHTML，改用 `textContent`** | ✅ |
| L2 | proof 與 tags 分離無驗證 | N/A | **新增 Zod schema** | ⬜ |

---

### 📊 M1-M3 評分總結

| 項目 | 得分 | 扣分原因 |
|:-----|:-----|:---------|
| M1 Ring Buffer | 18/25 | 初始化位置錯誤、魔術數字、每次 log 都觸發 O(n) 複製 |
| M2 Inline Style | 25/25 | 完美 |
| M3 Test Fixture | 5/25 | 嚴重缺失 tags、reviews 結構不完整、與 schema 脫節 |
| **M1-M3 總分** | **48/75** | **相當於 64/100** |

---

### ⚠️ 審計結論

**S1-S4: 98/100** - 優秀，僅 cloneNode 小瑕疵

**M1-M3: 64/100** - 不及格，主要問題：
1. M1 的 Ring Buffer 實作有「便宜行事」嫌疑 - 延遲初始化 + 每次 log 都複製陣列
2. M3 完全沒做 - test fixture 與 seed 資料結構嚴重脫節，`tags` 欄位遺失

**要求**: M1 和 M3 必須重新實作才能標記為 ✅

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
