# 社區牆 TODO 摘要

> **最後更新**：2025/12/04 17:45  
> **狀態**：11 / 11 完成（全部審計缺失已修復）  
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

*最後更新：2025/12/04 17:45*
