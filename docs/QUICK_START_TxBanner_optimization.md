# TxBanner 組件優化快速指南

## 優化摘要

**檔案**: `src/components/Feed/TxBanner.tsx`
**日期**: 2026-01-29
**優先級**: P2
**狀態**: ✅ 完成

## 關鍵改進

### 1. 精確化 useMemo 依賴項
```typescript
// 之前：依賴整個物件
useMemo(() => { ... }, [messageNotification])

// 之後：只依賴實際使用的欄位
useMemo(() => { ... }, [
  messageNotification?.id,
  messageNotification?.last_message?.created_at,
  messageNotification?.counterpart.name,
  messageNotification?.property?.title,
])
```

### 2. 新增交易配置快取
```typescript
const transactionConfig = useMemo(() => {
  if (!transaction.hasActive) return null;
  return {
    stageLabel: getStageLabel(transaction.stage),
    propertyName: transaction.propertyName || '物件',
  };
}, [transaction.hasActive, transaction.stage, transaction.propertyName]);
```

### 3. 添加自訂 memo 比較函數
精確控制何時需要重新渲染，避免不必要的性能開銷。

## 測試結果

```bash
✅ 功能測試: 12/12 通過
✅ 性能測試: 8/8 通過
✅ TypeScript: 無錯誤
✅ 總測試: 20/20 通過
```

## 性能改進

| 優化項目 | 改進效果 |
|---------|---------|
| 減少不必要渲染 | ✅ 跳過不相關 props 變化 |
| 函數調用優化 | ✅ `getStageLabel()` 僅在必要時執行 |
| 時間格式化優化 | ✅ `formatRelativeTime()` 僅在時間變化時執行 |
| 記憶體優化 | ✅ 配置物件快取，減少物件創建 |

## 下一步

如需詳細技術報告，請參閱：
`docs/TxBanner-optimization-report.md`
