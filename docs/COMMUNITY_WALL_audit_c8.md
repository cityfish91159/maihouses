
### 🟢 C8: Guard.tsx Loading State (2025-12-13 17:32)

**狀態**: 已修復 & 已驗證 (Type A Evidence)

**變更**:
1.  **組件化**: 創建 `src/components/common/LoadingState.tsx` 標準組件。
2.  **UX 提升**: 將原本醜陋的純文字 `Loading...` 替換為帶有 Spinner 動畫與標準文字的 UI。
3.  **一致性**: 使用 `STRINGS.WALL_STATES.LOADING_LABEL` 確保文案統一。

**證據 (Code Diff)**:
```tsx
// Guard.tsx
- return <div className="p-4 text-center text-gray-400">Loading permissions...</div>;
+ return <LoadingState />;

// LoadingState.tsx
<div className="animate-spin ... border-t-brand-600" />
<span>{STRINGS.WALL_STATES.LOADING_LABEL}</span>
```

**效益**:
*   避免權限檢查時的畫面閃爍或醜陋文字。
*   提供明確的視覺反饋 (Spinner)。
