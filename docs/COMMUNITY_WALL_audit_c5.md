
### 🟢 C5: useFeedData.ts ESLint (2025-12-13 17:20)

**Status**: Fixed & Verified (Type B Evidence)

**Changes**:
1.  **Removed Suppression**: Deleted `// eslint-disable-next-line react-hooks/exhaustive-deps`.
2.  **Fixed Logic**: Added `canViewPrivate` to dependency arrays of `useEffect` and `fetchApiData`.

**Evidence (Code Diff)**:
```typescript
// Before
useEffect(() => {
    // ...
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [useMock, persistMockState, resolvedInitialMockData]);

// After
useEffect(() => {
    // ...
}, [useMock, persistMockState, resolvedInitialMockData, canViewPrivate]);
```

**Evidence (Runtime Output)**:
```bash
> npx eslint src/hooks/useFeedData.ts
(No output means pass)
```
