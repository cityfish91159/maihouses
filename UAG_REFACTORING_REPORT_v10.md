# UAG Dashboard v10 Ultimate Architecture Refactoring Report

## 1. 專案概述 (Project Overview)
本報告記錄了 UAG Dashboard 從 v8.x 升級至 v10 Ultimate Architecture 的重構過程。本次重構的目標是解決單一檔案 (`index.tsx`) 過於龐大、邏輯耦合嚴重、缺乏型別安全以及狀態管理混亂的問題。

## 2. 架構變更 (Architectural Changes)

### 2.1 核心架構 (Core Architecture)
- **Container/Presenter Pattern**: 將邏輯與 UI 分離。
  - `index.tsx`: 作為 Container，負責組裝元件與處理錯誤邊界。
  - `hooks/useUAG.ts`: 負責資料獲取與業務邏輯。
  - `components/*.tsx`: 純 UI 元件 (Presentational Components)。

### 2.2 狀態管理 (State Management)
- **React Query (@tanstack/react-query)**: 取代原本的 `useEffect` + `useState` 進行資料獲取。
  - 實作了 `staleTime` 與 `cacheTime` 管理。
  - 支援 **Optimistic Updates** (樂觀更新)，提升使用者體驗。
  - 支援 Mock Mode 與 Live Mode 的無縫切換。

### 2.3 型別系統與驗證 (Type System & Validation)
- **Zod Integration**: 引入 `zod` 進行 Runtime Validation。
  - 定義了 `LeadSchema`, `AppDataSchema` 等，確保後端回傳資料符合預期。
  - 在 `uagService.ts` 中自動驗證 API 回傳資料。
- **TypeScript**: 全面強化型別定義，消除 `any` 型別的使用。

### 2.4 服務層 (Service Layer)
- **UAGService**: 建立靜態類別 `UAGService` 封裝 Supabase 操作。
  - `fetchAppData`: 獲取並轉換資料。
  - `purchaseLead`: 處理購買邏輯。

## 3. 檔案結構變更 (File Structure Changes)

```
src/pages/UAG/
├── index.tsx                # Main Container (Refactored)
├── uag-config.ts            # Global Constants (New)
├── hooks/
│   ├── useUAG.ts            # Main Logic Hook (New)
│   └── useWindowSize.ts     # Utility Hook (New)
├── services/
│   └── uagService.ts        # API Service Layer (New)
├── types/
│   └── uag.types.ts         # Zod Schemas & TS Types (New)
├── utils/
│   └── validation.ts        # Business Logic Helpers (New)
├── components/              # UI Components (Extracted & Updated)
│   ├── UAGHeader.tsx
│   ├── UAGFooter.tsx
│   ├── UAGLoadingSkeleton.tsx
│   ├── UAGErrorState.tsx
│   ├── RadarCluster.tsx
│   ├── ActionPanel.tsx
│   ├── AssetMonitor.tsx
│   ├── ListingFeed.tsx
│   ├── MaiCard.tsx
│   └── TrustFlow.tsx
└── mockData.ts              # Updated Mock Data
```

## 4. 執行項目 (Execution Items)

1.  **拆分 `index.tsx`**: 將 400+ 行的程式碼拆解為模組化架構。
2.  **實作 React Query**: 建立 `useUAG` hook。
3.  **建立 Zod Schemas**: 在 `types/uag.types.ts` 中定義資料模型。
4.  **建立 Service Layer**: 在 `services/uagService.ts` 中實作 API 呼叫。
5.  **建立 UI 元件**: 抽離 Header, Footer, Skeleton, ErrorState。
6.  **更新 Mock Data**: 確保 Mock Data 符合新的型別定義。
7.  **清理程式碼**: 移除 `constants.ts`，整合至 `uag-config.ts`。

## 5. 下一步計畫 (Next Steps)
- 執行 `tsc` 檢查型別錯誤。
- 執行 `npm run build` 確保建置成功。
- 進行功能測試 (Mock Mode & Live Mode)。
