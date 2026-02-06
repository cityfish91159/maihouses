# 經驗教訓

## TypeScript 陷阱

1. **`noUncheckedIndexedAccess: true`** — 陣列/物件索引回傳 `T | undefined`，必須先檢查
   ```ts
   // ❌ const item = arr[0].name
   // ✅ const item = arr[0]; if (item) { item.name }
   ```

2. **`exactOptionalPropertyTypes: true`** — `prop?: string` 不等於 `prop: string | undefined`
   - 不能顯式賦值 `undefined`，要用 `delete` 或不傳

3. **禁止 `as` 斷言** — 全部用 Zod `safeParse` 取代
   - 已清理 168+ 處危險斷言，剩 120 處為必要斷言（CSSProperties, Navigator 擴展, const）

4. **Supabase 查詢結果** — 永遠要用型別守衛檢查，不要用 `as`
   ```ts
   // ✅ 用 isValidDBProperty(row) 型別守衛
   ```

## 測試陷阱

1. **JSDOM 不支援** — `window.matchMedia`, `IntersectionObserver`, `ResizeObserver` 需要 mock
2. **Mock hoisting** — `vi.mock()` 會被提升到檔案頂部，mock 內不能引用外部變數
3. **Vitest 非同步** — `waitFor` + `act` 組合處理狀態更新，避免 act warning
4. **測試永不刪除** — 測試失敗要修復，不可刪除；重構時同步更新測試

## 架構決策

| 決策 | 原因 |
|------|------|
| TrustFlow 拆分 8 模組 | 原 813 行單檔，拆為 constants/types/utils/子組件 |
| useUAG facade hook | UAG 頁面邏輯集中，子組件只接收 props |
| Zod Schema 統一驗證 | API 輸入/DB 輸出都用 Zod，型別安全貫穿全棧 |
| RPC 取代直接 SQL | 複雜操作用 Supabase RPC，確保原子性 |
| 非阻塞通知 | `void sendNotification()` 不 await，避免阻塞主流程 |

## 效能注意

- `useMemo` / `useCallback` — 只用在實際有效能問題的地方，不要預防性添加
- `React.memo` — 用於不常變化 props 的組件（如 TxBanner, AgentProfileCard）
- 圖片 — 使用 imgix 壓縮 + lazy loading
- 大列表 — Community Wall QASection 使用虛擬化
