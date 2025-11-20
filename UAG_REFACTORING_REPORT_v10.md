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

## 6. 完整程式碼 (Complete Code)

### 6.1 src/App.tsx (Fix: Added QueryClientProvider)
```tsx
import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { getConfig, type AppConfig, type RuntimeOverrides } from './app/config'
import DevTools from './app/devtools'
import { trackEvent } from './services/uag'
import Home from './pages/Home'
import Register from './pages/Auth/Register'
import Login from './pages/Auth/Login'
import Wall from './pages/Community/Wall'
import Suggested from './pages/Community/Suggested'
import Detail from './pages/Property/Detail'
import AssureDetail from './pages/Assure/Detail'
import ChatStandalone from './pages/Chat/Standalone'
import ErrorBoundary from './app/ErrorBoundary'
import { QuietModeProvider } from './context/QuietModeContext'
import { MoodProvider } from './context/MoodContext'

import UAGPage from './pages/UAG'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
})

export default function App() {
  const [config, setConfig] = useState<(AppConfig & RuntimeOverrides) | null>(null)
  const loc = useLocation()

  useEffect(() => {
    getConfig().then(setConfig)
  }, [])

  useEffect(() => {
    if (config) trackEvent('page_view', loc.pathname)
  }, [loc, config])

  if (!config) {
    return (
      <div className="p-6 text-sm text-[var(--text-secondary)]">載入中…</div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <QuietModeProvider>
        <MoodProvider>
          <Routes key={loc.pathname}>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <Home config={config} />
              </ErrorBoundary>
            }
          />
          {/* ... other routes ... */}
          <Route
            path="/uag"
            element={
              <ErrorBoundary>
                <UAGPage />
              </ErrorBoundary>
            }
          />
          {/* ... other routes ... */}
      </Routes>
      {config.devtools === '1' && <DevTools config={config} />}
      </MoodProvider>
    </QuietModeProvider>
    </QueryClientProvider>
  )
}
```

### 6.2 src/pages/UAG/index.tsx (Main Container)
```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';
import { QueryErrorResetBoundary } from '@tanstack/react-query';

import styles from './UAG.module.css';
import { useUAG } from './hooks/useUAG';
import { useWindowSize } from './hooks/useWindowSize';
import { Lead } from './types/uag.types';
import { validateQuota } from './utils/validation';

import { UAGHeader } from './components/UAGHeader';
import { UAGFooter } from './components/UAGFooter';
import { UAGLoadingSkeleton } from './components/UAGLoadingSkeleton';
import { UAGErrorState } from './components/UAGErrorState';

import RadarCluster from './components/RadarCluster';
import ActionPanel from './components/ActionPanel';
import AssetMonitor from './components/AssetMonitor';
import ListingFeed from './components/ListingFeed';
import MaiCard from './components/MaiCard';
import TrustFlow from './components/TrustFlow';

function UAGPageContent() {
  const { data: appData, isLoading, error, buyLead, isBuying, useMock, toggleMode } = useUAG();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const actionPanelRef = useRef<HTMLDivElement>(null);
  const { width } = useWindowSize();

  // Handle window resize to close panel on desktop
  useEffect(() => {
    if (width > 768 && selectedLead) {
      // Optional: auto-close or adjust layout
    }
  }, [width, selectedLead]);

  const handleSelectLead = (lead: Lead) => {
    setSelectedLead(lead);
    // Scroll to action panel on mobile
    if (width <= 1024) {
      actionPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onBuyLead = async (leadId: string) => {
    if (!appData || isBuying) return;

    const lead = appData.leads.find(l => l.id === leadId);
    if (!lead) {
      toast.error("客戶不存在");
      return;
    }

    if (lead.status !== 'new') {
      toast.error("此客戶已被購買");
      return;
    }

    const { valid, error } = validateQuota(lead, appData.user);
    if (!valid) {
      toast.error(error || "配額不足");
      return;
    }

    const cost = lead.price || 10;
    if (appData.user.points < cost) {
      toast.error("點數不足");
      return;
    }

    if (!confirm(`確定要花費 ${cost} 點購買此客戶資料嗎？`)) return;

    buyLead({ leadId, cost, grade: lead.grade });
    setSelectedLead(null);
  };

  if (isLoading) return <UAGLoadingSkeleton />;
  if (error) throw error; // Let ErrorBoundary handle it
  if (!appData) return null;

  return (
    <div className={styles['uag-page']}>
      <Toaster position="top-center" />
      <UAGHeader />

      <main className={styles['uag-container']}>
        <div className={styles['uag-grid']}>
          {/* [1] UAG Radar */}
          <RadarCluster leads={appData.leads} onSelectLead={handleSelectLead} />

          {/* [Action Panel] */}
          <ActionPanel 
            ref={actionPanelRef}
            selectedLead={selectedLead} 
            onBuyLead={onBuyLead} 
            isProcessing={isBuying} 
          />

          {/* [2] Asset Monitor */}
          <AssetMonitor leads={appData.leads} />

          {/* [3] Listings & [4] Feed */}
          <ListingFeed listings={appData.listings} feed={appData.feed} />

          {/* [5] Mai Card */}
          <MaiCard />

          {/* [6] Trust Flow */}
          <TrustFlow />
        </div>
      </main>

      <UAGFooter user={appData.user} useMock={useMock} toggleMode={toggleMode} />
    </div>
  );
}

export default function UAGPage() {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          FallbackComponent={UAGErrorState}
        >
          <UAGPageContent />
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
```

## 7. Optimization Phase (Post-Review)

Based on the code review feedback, the following optimizations were applied to ensure production readiness:

### 7.1 Security & Safety
- **Mock Mode Protection**: Added `import.meta.env.PROD` check in `useUAG.ts` to strictly disable Mock Mode in production builds.
- **Validation Logic**: Moved business logic (Quota/Point validation) from `index.tsx` (UI layer) to `useUAG.ts` (Hook layer) to prevent bypass.

### 7.2 Performance & Stability
- **Stale Time Optimization**: Reduced `staleTime` from 5 minutes to **10 seconds** for `useQuery` to handle high-concurrency lead purchasing scenarios.
- **Error Handling**: Enhanced `uagService.ts` to use `safeParse` with error filtering. Invalid items are now logged and skipped instead of crashing the entire application.

### 7.3 UI/UX Improvements
- **Responsive Design**: Replaced hardcoded pixel values with a centralized `BREAKPOINTS` constant in `uag-config.ts`.
- **Interaction**: Replaced the native `window.confirm` dialog with an inline confirmation UI in `ActionPanel.tsx` for a smoother user experience.
- **Code Cleanup**: Removed redundant validation logic from `index.tsx`, making the container component cleaner and focused on layout.

## 8. 重新部署紀錄 (Redeployment Log)

**日期**: 2025-11-20
**狀態**: 準備就緒 (Ready for Deployment)

### 8.1 變更摘要 (Change Summary)
本次部署包含針對 v10 架構的關鍵優化與安全性修復：
1.  **安全性增強**: 強制生產環境禁用 Mock Mode，並將驗證邏輯移至 Hook 層。
2.  **效能優化**: 將 React Query 的 `staleTime` 調整為 10 秒，並優化錯誤處理機制 (`safeParse`)。
3.  **使用者體驗**: 引入 `BREAKPOINTS` 統一響應式設計，並將 `window.confirm` 替換為內嵌式確認 UI。
4.  **程式碼清理**: 大幅簡化 `index.tsx`，移除冗餘邏輯。

### 8.2 部署檢核點 (Deployment Checklist)
- [x] `useUAG.ts` 邏輯驗證完成。
- [x] `uagService.ts` 錯誤處理增強完成。
- [x] `ActionPanel.tsx` UI 互動優化完成。
- [x] `index.tsx` 程式碼重構完成。
- [ ] 執行 Build 測試 (`npm run build`)。
- [ ] 部署至 Vercel。

---
**下一步**: 請執行 `npm run build` 確認建置無誤後，推送到 main branch 觸發 Vercel 部署。

## 9. 最終部署前修正 (Final Pre-Deployment Fixes)

**日期**: 2025-11-20
**狀態**: 修正完成 (Fixes Applied)

### 9.1 修正項目 (Fix Items)
根據最後的代碼審查，執行了以下修正以解決衝突與重複問題：

1.  **路由衝突修復**:
    - 移除了 `App.tsx` 中 `/uag` 路由外層的 `ErrorBoundary`，保留 `UAGPage` 內部的 `QueryErrorResetBoundary` + `ErrorBoundary` 組合，避免錯誤被雙重攔截。

2.  **命名混淆修復**:
    - 將 `src/services/uag.ts` (Tracking Service) 重命名為 `src/services/analytics.ts`，明確區分其與 `src/pages/UAG/services/uagService.ts` (Business Logic) 的職責。
    - 更新了 `App.tsx` 中的引用路徑。

3.  **斷點與響應式邏輯統一**:
    - 在 `uag-config.ts` 中定義了 `BREAKPOINTS` (MOBILE: 768, TABLET: 1024)。
    - 修正 `index.tsx` 中的 `useEffect` 死碼，現在當視窗寬度大於 TABLET (1024px) 時，會自動關閉選中的 Lead 面板。
    - 統一使用 `BREAKPOINTS.TABLET` 作為 Mobile/Desktop 的行為分界點。

4.  **業務邏輯集中化**:
    - 確認 `useUAG.ts` 中的 `buyLead` 函式已包含完整的驗證邏輯 (Status, Quota, Points)。
    - `index.tsx` 僅負責 UI 呈現與呼叫 `buyLead`，不再處理業務規則。

### 9.2 部署準備 (Deployment Readiness)
所有已知問題皆已修復，程式碼庫已準備好進行最終建置與部署。

- [x] 移除重複的 ErrorBoundary。
- [x] 重命名 Analytics Service。
- [x] 統一 Breakpoints 與修復無效 useEffect。
- [x] 驗證業務邏輯集中化。

---
**執行部署**:
`npm run build`
`git push origin main`

## 10. Build 修復紀錄 (Build Fix Log)

**日期**: 2025-11-20
**狀態**: 建置成功 (Build Success)

### 10.1 錯誤修復 (Error Fixes)
在執行 `npm run build` 時遇到了以下錯誤並已修復：

1.  **模組找不到錯誤 (Module Not Found)**:
    - 原因：重命名 `services/uag.ts` 為 `services/analytics.ts` 後，部分檔案仍引用舊路徑。
    - 修復：更新了以下檔案的引用路徑：
        - `src/app/ErrorBoundary.tsx`
        - `src/features/home/sections/PropertyGrid.tsx`
        - `src/features/home/sections/SmartAsk.tsx`
        - `src/pages/Auth/Login.tsx`
        - `src/pages/Auth/Register.tsx`
        - `src/pages/Home.tsx`

2.  **語法錯誤 (Syntax Error)**:
    - 原因：在編輯 `ErrorBoundary.tsx` 時意外引入了語法錯誤。
    - 修復：修正了 `interface Props` 的定義。

3.  **匯出錯誤 (Export Error)**:
    - 原因：`SmartAsk.tsx` 的 `export default` 被意外移除。
    - 修復：恢復了 `export default function SmartAsk`。

### 10.2 建置結果 (Build Result)
- **Command**: `npm run build`
- **Result**: Success
- **Output**: `docs/assets/index-*.js` generated.

---
**現在可以安全地推送到 main 分支進行部署。**

## 11. v11 優化與部署 (v11 Optimization & Deployment)

**日期**: 2025-11-20
**狀態**: 部署中 (Deploying)

### 11.1 變更摘要 (Change Summary)
根據 v11 的優化建議，執行了以下關鍵改動：

1.  **移除冗餘錯誤拋出**:
    - 刪除了 `index.tsx` 中的 `if (error) throw error;`，完全依賴 `ErrorBoundary` 處理錯誤，淨化 Call Stack。

2.  **Hook 封裝選取邏輯**:
    - 新增 `useLeadSelection.ts` Hook，將 `selectedLead` 狀態管理與 RWD 自動滾動/關閉邏輯封裝起來。
    - `index.tsx` 現在只負責呼叫 `selectLead` 與 `close`，大幅簡化。

3.  **Mutation 層級驗證**:
    - 在 `useUAG.ts` 的 `onMutate` 中加入了 `validateQuota` 檢查。
    - 實現了「防禦性樂觀更新」：如果配額不足，直接在前端攔截並拋出錯誤，不執行樂觀更新，避免 UI 閃爍。

4.  **確認機制**:
    - 確認 `ActionPanel.tsx` 已實作內嵌式確認 UI (Inline Confirmation)，取代了過時的 `window.confirm`。

### 11.2 部署指令 (Deployment Command)
`npm run build && git push origin main`

## 12. 最終代碼審查與優化 (Final Code Review & Optimization)

**日期**: 2025-11-20
**狀態**: 部署完成 (Deployed)

### 12.1 衝突與重複檢測修復 (Conflict & Duplication Fixes)
根據詳細的代碼審查，執行了以下修復：

1.  **ErrorBoundary 雙重包裹**:
    - 確認已在第 9 步修復，移除了 `App.tsx` 中的外層 ErrorBoundary。

2.  **QueryClient 配置**:
    - 目前 `App.tsx` 為唯一創建點，暫無衝突。未來可考慮提取為單例。

3.  **型別與常數重複**:
    - 確認 `types/uag.types.ts` 與 `uag-config.ts` 為單一真理來源 (Single Source of Truth)。

### 12.2 效能優化 (Performance Optimizations)
1.  **useWindowSize 防抖 (Debounce)**:
    - 為 `useWindowSize` 加入了 150ms 的防抖機制，避免 Resize 時頻繁觸發重繪，提升效能。

2.  **useLeadSelection 穩定化**:
    - 使用 `useCallback` 包裹 `selectLead` 與 `close` 函式。
    - 改用 `requestAnimationFrame` 處理滾動邏輯，確保 DOM 更新後的流暢度。

### 12.3 部署狀態 (Deployment Status)
所有優化皆已應用並推送到 main 分支。

- [x] useWindowSize Debounce
- [x] useLeadSelection useCallback
- [x] ErrorBoundary Cleanup
- [x] Mutation Validation

**Current Version**: v11.1 (Optimized)
