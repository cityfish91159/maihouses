# 報告生成器修復工單

> 建立日期：2026-01-10
> 狀態：待執行

---

## 問題描述

UAG 報告生成器的「預覽」與「生成的報告頁面」完全不同，因為兩者從未真正連接。

---

## 現況分析

### 預覽 (Step 4)
- **位置**：`src/pages/UAG/components/ReportGenerator/index.tsx` 的 `renderStep4()`
- **樣式**：CSS Modules (`ReportGenerator.module.css`)
- **資料**：內部定義的 `PropertyData` 結構

### 生成的報告頁
- **位置**：`src/pages/Report/ReportPage.tsx`
- **路由**：`/r/:id`（在 `App.tsx` 定義）
- **樣式**：Tailwind CSS
- **資料**：`PropertyReportData` 結構（來自 `./types.ts`）

### 兩者的差異

| 項目 | 預覽 (ReportGenerator) | 報告頁 (ReportPage) |
|------|------------------------|---------------------|
| 價格格式 | `32880000` (原始數值) | `3680` (萬為單位) |
| 格局 | `"3房2廳2衛"` (字串) | `rooms: 3, halls: 2, bathrooms: 2` (分開數字) |
| 社區欄位 | `community` | `communityName` |
| 管理費 | `3500` (月費) | `80` (元/坪) |
| UI 風格 | 精簡手機卡片 | 完整頁面 + 圖片輪播 |
| 有月付試算 | ❌ | ✅ |
| 有亮點區塊 | ❌ (預覽不顯示) | ✅ (但用不同資料) |
| 有經紀人小卡 | 簡化版 | 完整版 + 評價 |

### URL 參數不對應

**ReportGenerator 生成的 URL**：
```
/maihouses/r/{id}?d={base64_encoded_data}
```

**ReportPage 讀取的參數**：
```typescript
const agentId = searchParams.get("aid");
const source = searchParams.get("src");
const highlights = searchParams.get("h");
// 完全不讀 ?d 參數！永遠用 DEFAULT_REPORT_DATA
```

---

## 根本原因

這兩個功能是分開開發的，從未整合：
1. ReportGenerator 有精美的預覽 UI
2. ReportPage 有自己的資料結構和 UI
3. `generateReport()` 生成的資料被 ReportPage 完全忽略

---

## 修復方案

### 方案 A：讓 ReportPage 讀取 `?d` 參數

**優點**：最小改動
**缺點**：需要資料轉換、兩套 UI 仍不同

**步驟**：
1. 在 ReportPage 新增解碼 `?d` 參數的邏輯
2. 將 ReportGenerator 的 PropertyData 轉換為 PropertyReportData
3. 用轉換後的資料渲染

### 方案 B：讓 ReportPage 的 UI 與預覽一致

**優點**：用戶體驗一致
**缺點**：需重寫 ReportPage UI

**步驟**：
1. 複製 ReportGenerator 的 renderStep4() 結構到 ReportPage
2. 複製對應的 CSS Modules 樣式
3. 調整為全螢幕手機版本

### 方案 C：統一資料結構 + UI（推薦）

**優點**：徹底解決、易維護
**缺點**：工作量最大

**步驟**：
1. 定義統一的 `ReportData` 類型
2. ReportGenerator 使用這個類型
3. ReportPage 讀取 `?d` 參數並使用同類型
4. 共用 UI 組件或確保 UI 一致

---

## 待確認事項

在開始修復前，需要與用戶確認：

- [ ] 報告頁面應該長得像預覽（精簡版）還是現在的 ReportPage（完整版）？
- [ ] 是否需要月付試算功能？
- [ ] 是否需要亮點區塊？（目前預覽沒顯示亮點）
- [ ] 是否需要經紀人評價資訊？
- [ ] 是否需要圖片輪播？（預覽只有一張圖）

---

## 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/pages/UAG/components/ReportGenerator/index.tsx` | 生成器主程式 |
| `src/pages/UAG/components/ReportGenerator/ReportGenerator.module.css` | 預覽樣式 |
| `src/pages/Report/ReportPage.tsx` | 報告頁面 |
| `src/pages/Report/types.ts` | 報告頁資料類型 |
| `src/pages/Report/index.ts` | 匯出 |
| `src/App.tsx:219` | `/r/:id` 路由定義 |

---

## 備註

這個問題不是「樣式不一致」，而是「兩個功能從未連接」。修復需要先確認產品方向。
