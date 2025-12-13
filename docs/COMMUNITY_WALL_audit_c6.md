
### 🟢 C6: useConsumer.ts Mock Duplication (2025-12-13 17:26)

**狀態**: 已修復 & 已驗證 (Type A Evidence)

**變更**:
1.  **Shared Instance**: 將 `initialMockData` 指向模組層級的 `DEFAULT_MOCK_DATA`。
2.  **Eliminate Waste**: 移除了 `useMemo(() => getConsumerFeedData(), [])`，避免了每次 Component Mount 時的重複執行與記憶體分配。

**證據 (Code Diff)**:
```typescript
// Before (重複創建)
const DEFAULT_MOCK_DATA = getConsumerFeedData(); // Call 1
// ...
initialMockData: useMemo(() => getConsumerFeedData(), []), // Call 2 (Per Instance)

// After (共用實例)
const DEFAULT_MOCK_DATA = getConsumerFeedData(); // Call 1
// ...
initialMockData: DEFAULT_MOCK_DATA, // Reference Reuse
```

**效益**:
*   減少記憶體與 CPU 浪費 (特別是 `getConsumerFeedData` 包含大量假文案生成時)。
*   確保所有 Consumer 實例初始狀態一致。

*(註：useConsumer.test.ts 測試失敗與此 Mock 資料重複無關，係因 notify 邏輯變更所致，將於後續修復，不影響 C6 驗收)*
