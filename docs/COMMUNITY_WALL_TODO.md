# 社區牆 TODO 摘要

> **最後更新**：2025/12/04 17:45  
> **狀態**：11 / 11 完成（舊缺失已結案），新增 G ~ K 五項審計待補  
> **驗證結果**：`npm run typecheck` ✓ | `npm run test` ✓ (29 passed) | `npm run build` ✓

---

## ✅ 已完成的缺失

| # | 項目 | 狀態 |
|---|------|------|
| 1 | Mock URL 同步 | ✅ |
| 2 | 角色持久化 | ✅ |
| 3 | ErrorBoundary | ✅ |
| 4 | Loading Skeleton a11y | ✅ |
| 5 | QA Focus Trap | ✅ |
| 6 | Posts Tab A11y | ✅ |
| 7 | React Query DevTools | ✅ |
| 8 | useCommunityWallData JSDoc | ✅ |
| 9 | Mock 時間戳 | ✅ |
| 10 | Optimistic Update | ✅ |
| 11 | 環境變數驗證 | ✅ |

> ✅ 表示既有缺失已修補；以下列出的「待改善事項」為 2025/12/04 17:55 新發現的不足，請依指引追加優化。

---

## 🔴 首席處長嚴苛審計 - 修復紀錄

### 審計 A：env.ts 環境驗證 ✅

**修復內容**：
1. 新增 \`isValidHttpUrl()\` 函數驗證 URL 格式（防止 \`javascript:\` 注入）
2. PROD 環境缺少環境變數時顯示友善錯誤頁面而非白屏
3. \`VITE_SUPABASE_URL\` 必須是有效 HTTP(S) URL
4. \`VITE_API_BASE_URL\` 格式驗證（HTTP(S) 或 / 開頭路徑）

**檔案**：\`src/config/env.ts\`

---

### 審計 B：QASection Focus Trap ✅

**修復內容**：
1. cleanup 時檢查 \`restoreFocusRef.current\` 是否仍存在於 DOM
2. 若觸發按鈕已被移除，fallback focus 到 \`<main>\` 元素
3. 避免焦點跳到 \`<body>\` 造成輔助技術混亂

**檔案**：\`src/pages/Community/components/QASection.tsx\`

---

### 審計 C：PostsSection End 鍵 ✅

**修復內容**：
1. End 鍵無論權限如何都跳到最後一個可用 Tab
2. 用 \`activeTabs[activeTabs.length - 1]\` 取得最後可用 Tab
3. 訪客按 End 會跳到 public（因為只有這個 Tab）

**檔案**：\`src/pages/Community/components/PostsSection.tsx\`

---

### 審計 D：WallErrorBoundary error.cause ✅

**修復內容**：
1. 新增 \`getErrorMessage()\` 遞迴收集 \`error.cause\` chain
2. 支援 ES2022 Error Cause 規範
3. tsconfig.json lib 升級到 ES2022

**檔案**：
- \`src/pages/Community/components/WallErrorBoundary.tsx\`
- \`tsconfig.json\`

---

### 審計 E：toggleLike Optimistic Update ✅

**現況確認**：
- API 模式：\`useCommunityWallQuery.ts\` 的 \`likeMutation\` 已實作完整 Optimistic Update
- Mock 模式：\`useCommunityWallData.ts\` 的 \`toggleLike\` 立即更新 UI

**無需修改**：程式碼已正確實作

---

### 審計 F：Skeleton aria 衝突 ✅

**修復內容**：
1. 移除 \`PostSkeleton\` 的 \`aria-hidden="true"\`
2. 讓 \`WallSkeleton\` 統一管理 a11y（\`role="status"\`, \`aria-live\`, \`aria-busy\`）
3. 避免 live region 內含 hidden 子元素的衝突

**檔案**：\`src/pages/Community/components/PostSkeleton.tsx\`

---

## 🔁 待改善事項（2025/12/04 17:55 補充）

### G：env.ts 友善錯誤頁面 Base URL

- **問題**：友善錯誤頁面上的「回到首頁」連結硬寫成 `/`，在 Vercel 生產環境實際是掛在 `/maihouses/`。目前會導致使用者跳到空白頁。
- **最佳解法**：在 `src/config/env.ts` 增加 `resolveAppBaseHref()` helper，優先回傳 `import.meta.env.BASE_URL`、其次讀取 `<base>` 或 `document.baseURI`，最後 fallback `/maihouses/`。`showFriendlyErrorPage()` 中改用該 helper 組出 `href`（確保結尾只有一個 `/`），文案維持繁體中文。

### H：QASection Focus Trap 還原焦點細節

- **問題**：
	1. Modal 內若沒有任何可聚焦元素（極端情境），`trapFocusWithinModal` 直接 return，焦點仍可逃出。
	2. cleanup 時為了 fallback `main`，強制設置 `tabIndex = -1` 但沒有回復，長期會在 DOM 上留下多餘屬性。
- **最佳解法**：
	1. 當 `focusable.length === 0` 時，抓取 `dialog` 本體，暫存原本的 `tabIndex`（可用 `dataset.prevTabindex`），臨時設 `tabIndex = -1` 並 `focus()`；在 `useEffect` cleanup 時復原屬性。
	2. 在 `restoreFocusRef` cleanup 中也套用相同的暫存/還原機制，避免 `<main>` 永久掛著 `tabindex="-1"`。

### I：QASection Fallback 聚焦缺少安全檢查

- **問題**：目前 `main` 可能不存在或尚未掛載就被聚焦；程式直接呼叫 `main.focus()` 未捕捉例外。
- **最佳解法**：抽出 `focusSafeElement()` helper，先找 `<main>`，再找 `[data-app-root]`、`#root`、最後 `document.body`，每一步都檢查 `instanceof HTMLElement` 才呼叫 `focus()`，若全數失敗在 dev console 警告一次以利追蹤。

### J：communityService 忽略 includePrivate 旗標

- **問題**：`src/services/communityService.ts` 的 `getCommunityWall()` 雖然接受 `options.includePrivate`，但實際請求永遠是 `/wall?communityId=...&type=all`，導致訪客也會向 API 要求私密牆資料（回傳 403 或多餘 payload），與文件「只有通過驗證才拉私密貼文」不符。
- **最佳解法**：在 service 將 `includePrivate` 轉為查詢參數（例如 `&includePrivate=1/0` 或 `visibility=public`），同時更新 Vercel API route 接收該旗標並於授權不符時直接回傳公開資料。為避免 React Query cache 汙染，也應把旗標納入 key（現已處理）並補一份單元測試驗證 `includePrivate=false` 時 request URL 正確。

### K：Optimistic Like 永遠使用 anonymous-user

- **問題**：`useCommunityWallData()` 呼叫 `useCommunityWall()` 時沒有傳入登入者 ID，`useCommunityWallQuery` 只能 fallback `'anonymous-user'` 當 `optimisticUserId`，因此無法得知使用者是否已經按過讚。結果是「取消讚」也會先 +1，直到 refetch 後才跳回正確數字。
- **最佳解法**：在 `useCommunityWallData` 透過 `supabase.auth.getSession()` 或 `auth.getUser()` 取得 `user.id`，以 `useState`/`useEffect` 緩存並傳給 `useCommunityWall({ currentUserId })`。補一個 hook 測試：預先讓 `liked_by` 包含該 ID，再觸發 `toggleLike` 應先做 -1。Mock 模式仍沿用 `likedPosts` Set，不受影響。

## 🔍 驗證紀錄

\`\`\`bash
# TypeScript 類型檢查
npm run typecheck  # ✓ 無錯誤

# 單元測試
npm run test       # ✓ 29 passed (7 test files)

# 生產構建
npm run build      # ✓ 18.65s, 6 chunks
\`\`\`

---

## 📦 修改的檔案清單

| 檔案 | 變更說明 |
|------|----------|
| \`src/config/env.ts\` | URL 驗證 + 友善錯誤頁面 |
| \`src/pages/Community/components/QASection.tsx\` | Focus Trap cleanup 修正 |
| \`src/pages/Community/components/PostsSection.tsx\` | End 鍵處理修正 |
| \`src/pages/Community/components/WallErrorBoundary.tsx\` | error.cause 支援 |
| \`src/pages/Community/components/PostSkeleton.tsx\` | 移除 aria-hidden |
| \`tsconfig.json\` | lib 升級到 ES2022 |

---

*最後更新：2025/12/04 18:10*
