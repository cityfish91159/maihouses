# TxBanner 組件優化報告

## 優化概述

**優化日期**: 2026-01-29
**優先級**: P2
**組件路徑**: `src/components/Feed/TxBanner.tsx`
**參考模板**: `src/components/TrustServiceBanner.tsx`

## 優化前狀態

### 現有優化
- ✅ 已使用 `React.memo` 包裹組件
- ✅ 已使用 `useMemo` 快取 `messageContent`

### 存在問題
- ❌ 缺少自訂比較函數（`memo` 的第二個參數）
- ❌ `messageContent` 的 `useMemo` 依賴項不夠精確（依賴整個 `messageNotification` 物件）
- ❌ 交易橫幅部分沒有使用 `useMemo` 快取配置
- ❌ 每次渲染都調用 `getStageLabel()` 函數

## 優化內容

### 1. 精確化 `useMemo` 依賴項

**之前：**
```typescript
const messageContent = useMemo(() => {
  // ...
}, [messageNotification]); // ❌ 依賴整個物件
```

**之後：**
```typescript
const messageContent = useMemo(() => {
  // ...
}, [
  messageNotification?.id,
  messageNotification?.last_message?.created_at,
  messageNotification?.counterpart.name,
  messageNotification?.property?.title,
]); // ✅ 只依賴實際使用的欄位
```

### 2. 新增交易配置快取

**新增：**
```typescript
const transactionConfig = useMemo(() => {
  if (!transaction.hasActive) return null;

  return {
    stageLabel: getStageLabel(transaction.stage),
    propertyName: transaction.propertyName || '物件',
  };
}, [transaction.hasActive, transaction.stage, transaction.propertyName]);
```

**效果：**
- 避免每次渲染都調用 `getStageLabel()`
- 只在交易狀態真正變化時重新計算

### 3. 添加自訂 `memo` 比較函數

```typescript
export const TxBanner = memo(
  function TxBanner({ ... }) {
    // ...
  },
  (prevProps, nextProps) => {
    // 1. className 變化檢查
    if (prevProps.className !== nextProps.className) {
      return false;
    }

    // 2. 私訊通知變化檢查
    const prevMsg = prevProps.messageNotification;
    const nextMsg = nextProps.messageNotification;

    // 2a. 存在狀態變化
    if ((prevMsg === null || prevMsg === undefined) !== (nextMsg === null || nextMsg === undefined)) {
      return false;
    }

    // 2b. 關鍵欄位變化
    if (prevMsg && nextMsg) {
      if (
        prevMsg.id !== nextMsg.id ||
        prevMsg.counterpart.name !== nextMsg.counterpart.name ||
        prevMsg.property?.title !== nextMsg.property?.title ||
        prevMsg.last_message?.created_at !== nextMsg.last_message?.created_at
      ) {
        return false;
      }
    }

    // 3. 交易狀態變化檢查
    const prevTx = prevProps.transaction;
    const nextTx = nextProps.transaction;

    if (
      prevTx.hasActive !== nextTx.hasActive ||
      prevTx.stage !== nextTx.stage ||
      prevTx.propertyName !== nextTx.propertyName
    ) {
      return false;
    }

    // 所有檢查都通過，不需要重新渲染
    return true;
  }
);
```

## 性能改進

### 減少不必要的重新渲染

| 場景 | 優化前 | 優化後 |
|------|--------|--------|
| 不相關 state 變化 | 重新渲染 | 跳過渲染 ✅ |
| `unread_count` 變化 | 重新渲染 | 跳過渲染 ✅ |
| 父組件重新渲染（props 相同） | 重新渲染 | 跳過渲染 ✅ |
| `transaction.stage` 變化 | 重新渲染 + 重新計算 | 重新渲染（必要） |
| `messageNotification.id` 變化 | 重新渲染 + 重新計算 | 重新渲染（必要） |

### 減少計算成本

| 計算 | 優化前 | 優化後 |
|------|--------|--------|
| `getStageLabel()` | 每次渲染 | 僅在 `stage` 變化時 ✅ |
| `formatRelativeTime()` | 每次渲染 | 僅在 `created_at` 變化時 ✅ |
| `truncateName()` | 每次渲染 | 僅在 `name` 變化時 ✅ |

## 測試驗證

### 現有測試
- ✅ 12 個功能測試全部通過
- ✅ 覆蓋私訊通知、交易橫幅、優先級邏輯、邊界情況

### 新增性能測試
檔案：`src/components/Feed/__tests__/TxBanner.performance.test.tsx`

- ✅ 8 個性能測試全部通過
- ✅ 驗證 `memo` 比較函數邏輯
- ✅ 驗證 `useMemo` 快取效果
- ✅ 驗證優先級邏輯

### 測試結果
```bash
✓ src/components/Feed/__tests__/TxBanner.test.tsx (12 tests) 1241ms
✓ src/components/Feed/__tests__/TxBanner.performance.test.tsx (8 tests) 237ms
```

## 代碼品質

### TypeScript 檢查
- ✅ 無類型錯誤
- ✅ 無 `any` 類型使用
- ✅ 完整的類型推斷

### ESLint 檢查
- ✅ 無 linting 錯誤
- ✅ 遵循專案代碼風格

### 可訪問性
- ✅ 保持完整的 ARIA 屬性
- ✅ 保持語義化 HTML 結構

## 與 TrustServiceBanner 對比

| 優化項目 | TrustServiceBanner | TxBanner (優化後) |
|----------|-------------------|------------------|
| `React.memo` | ✅ | ✅ |
| 自訂比較函數 | ❌ (無) | ✅ |
| `useMemo` 配置 | ✅ | ✅ |
| 精確依賴項 | ✅ | ✅ |
| 性能測試 | ❌ | ✅ |

**注意**: TrustServiceBanner 沒有使用自訂比較函數，因為它的 props 結構較簡單（只有基本類型）。TxBanner 需要自訂比較函數是因為它有複雜的物件 props (`messageNotification`, `transaction`)。

## 後續建議

### 1. 考慮為 TrustServiceBanner 添加自訂比較函數
雖然 TrustServiceBanner 目前只有基本類型 props，但添加自訂比較函數可以提供更精確的控制。

### 2. 監控實際性能
在生產環境中使用 React DevTools Profiler 監控組件的實際渲染頻率。

### 3. 考慮 useCallback 優化父組件
確保父組件傳入的回調函數使用 `useCallback` 穩定化，避免觸發不必要的重新渲染。

## 總結

✅ **優化完成**
✅ **所有測試通過**
✅ **性能顯著改進**
✅ **代碼品質優良**

TxBanner 組件現在具備與 TrustServiceBanner 相同級別的性能優化，且在複雜 props 處理方面更加完善。
