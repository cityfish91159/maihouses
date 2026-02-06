# PropertyDetailPage 性能修復報告

## 修復日期
2026-01-29

## 問題描述

### P1 嚴重性能問題：未穩定化的 Callbacks

`PropertyDetailPage` 組件傳遞給 `AgentTrustCard` 的 3 個 callback props 未使用 `useCallback` 包裝，導致：

1. **子組件 memo 優化完全無效**：`AgentTrustCard` 使用了 `React.memo`（第 177 行），但父組件每次重新渲染都會創建新的函數引用
2. **團隊協作浪費**：子組件開發者的性能優化工作被父組件的問題抵消
3. **不必要的重新渲染**：每次父組件狀態更新（如 `mockTrustEnabled`、`isFavorite`、`showContactModal` 等）都會觸發 `AgentTrustCard` 重新渲染

### 問題代碼（修復前）

```tsx
// 第 566-571 行
<AgentTrustCard
  agent={property.agent}
  onLineClick={() => openContactModal('sidebar')}      // ❌ 內聯函數
  onCallClick={() => openContactModal('sidebar')}      // ❌ 內聯函數
  onBookingClick={() => openContactModal('booking')}   // ❌ 內聯函數
/>
```

## 修復方案

### 1. 穩定化 `openContactModal` 函數

```tsx
// 第 244-256 行
const openContactModal = useCallback(
  (source: 'sidebar' | 'mobile_bar' | 'booking') => {
    setContactSource(source);
    setShowContactModal(true);
    // 同時追蹤點擊事件
    if (source === 'mobile_bar') {
      propertyTracker.trackLineClick();
    } else {
      propertyTracker.trackCallClick();
    }
  },
  [propertyTracker]  // ✅ 依賴 propertyTracker
);
```

### 2. 創建 AgentTrustCard 專用的穩定 Callbacks

```tsx
// 第 399-410 行
// AgentTrustCard 專用的穩定 callbacks
const handleAgentLineClick = useCallback(() => {
  openContactModal('sidebar');
}, [openContactModal]);

const handleAgentCallClick = useCallback(() => {
  openContactModal('sidebar');
}, [openContactModal]);

const handleAgentBookingClick = useCallback(() => {
  openContactModal('booking');
}, [openContactModal]);
```

### 3. 更新 AgentTrustCard 使用穩定引用

```tsx
// 第 582-587 行
<AgentTrustCard
  agent={property.agent}
  onLineClick={handleAgentLineClick}      // ✅ 穩定引用
  onCallClick={handleAgentCallClick}      // ✅ 穩定引用
  onBookingClick={handleAgentBookingClick} // ✅ 穩定引用
/>
```

## 修復效果

### 性能優化

1. **AgentTrustCard 只在必要時重新渲染**：
   - ✅ `agent` props 變化時（實際內容改變）
   - ❌ 父組件其他狀態變化時（如 `mockTrustEnabled`、`isFavorite` 等）

2. **減少不必要的 DOM 操作**：
   - AgentTrustCard 內部有多個 `useMemo` 計算（`isOnline`、`agentMetrics`、`trustBreakdown`）
   - 這些計算現在只在真正需要時執行

3. **提升團隊協作效率**：
   - 子組件的 `React.memo` 優化現在能正常工作
   - 符合 React 性能優化最佳實踐

### 依賴鏈分析

```
openContactModal (依賴: propertyTracker)
    ↓
handleAgentLineClick (依賴: openContactModal)
handleAgentCallClick (依賴: openContactModal)
handleAgentBookingClick (依賴: openContactModal)
    ↓
AgentTrustCard props (穩定引用)
```

當 `propertyTracker` 變化時（實際上它也是穩定的，因為 `usePropertyTracker` 返回的是穩定引用），整個依賴鏈才會更新。

## 驗證結果

### 類型檢查
```bash
npm run typecheck  # ✅ 通過
```

### 代碼風格檢查
```bash
npm run lint  # ✅ 通過
```

### 單元測試
```bash
npx vitest run src/pages/__tests__/PropertyDetailPage.test.tsx
# ✅ 7/7 測試通過
```

### 手動驗證
```bash
# 確認 callbacks 已被 useCallback 包裝
grep -A 2 "handleAgent.*Click.*useCallback" src/pages/PropertyDetailPage.tsx
# ✅ 3 個 callbacks 都已包裝

# 確認 AgentTrustCard 使用穩定引用
grep -A 3 "AgentTrustCard" src/pages/PropertyDetailPage.tsx | grep -E "(onLineClick|onCallClick|onBookingClick)"
# ✅ 使用 handleAgentLineClick, handleAgentCallClick, handleAgentBookingClick
```

## 相關檔案

- 主要修復：`src/pages/PropertyDetailPage.tsx`
- 子組件：`src/components/AgentTrustCard.tsx`（已使用 `React.memo`）

## 修復清單

- [x] 使用 `useCallback` 包裝 `openContactModal`
- [x] 創建 3 個穩定的 callback handlers：`handleAgentLineClick`、`handleAgentCallClick`、`handleAgentBookingClick`
- [x] 更新 `AgentTrustCard` props 使用穩定引用
- [x] 確保依賴陣列正確（`[openContactModal]` 和 `[propertyTracker]`）
- [x] 通過 TypeScript 類型檢查
- [x] 通過 ESLint 代碼檢查
- [x] 通過單元測試（7/7）
- [x] 驗證功能正常運作

## 影響範圍

- **破壞性變更**：無
- **行為變更**：無（僅性能優化）
- **API 變更**：無
- **測試影響**：所有測試通過，無需修改測試

## 後續建議

1. **檢查其他類似問題**：搜尋專案中其他使用 `React.memo` 的組件，確認父組件是否也正確使用 `useCallback`
2. **建立 ESLint 規則**：考慮添加 `eslint-plugin-react-hooks` 的 `exhaustive-deps` 規則
3. **性能監控**：在開發工具中使用 React DevTools Profiler 驗證優化效果

## 結論

此次修復解決了 P1 級別的性能問題，確保了父子組件之間的優化協作。修復後：
- ✅ `AgentTrustCard` 的 `React.memo` 優化正常工作
- ✅ 減少不必要的重新渲染
- ✅ 提升整體頁面性能
- ✅ 符合 React 最佳實踐
- ✅ 無任何破壞性變更或功能影響
