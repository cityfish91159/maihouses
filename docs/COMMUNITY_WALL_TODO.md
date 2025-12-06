# 🏠 社區牆 待辦清單

> 最後更新：2025-12-06 13:00

---

## 📊 總覽

| 狀態 | 數量 |
|------|------|
| ✅ 已完成 | 9 |
| 🔴 待處理（程式碼） | 6 |
| 🟡 待處理（人工操作） | 3 |

---

## 🔴 待處理 - 程式碼（Google 首席處長審計）

### 1️⃣ 後端 `attachAuthorsToPosts` 使用 `any` 型別（嚴重）
- **檔案**：`api/community/wall.ts:571`
- **問題**：整個函數用 `any[]`，喪失 TypeScript 型別檢查，違反專案規範
- **引導**：
  1. 定義 `PostRow` 型別（id, author_id, content, ...）
  2. 定義 `ProfileRow` 型別（id, name, avatar_url, role, floor）
  3. 函數簽名改為 `(posts: PostRow[]): Promise<(PostRow & { author: ProfileRow | null })[]>`
  4. 用 Zod 驗證 profiles 回傳資料

### 2️⃣ 後端缺 Question/Answer 的作者合併（遺漏）
- **檔案**：`api/community/wall.ts`
- **問題**：只處理 posts，questions 的 answers 沒有附加 profiles，前端被迫 fallback
- **引導**：
  1. 新增 `attachAuthorsToAnswers(questions)` 函數
  2. 撈出所有 `answer.author_id`，批次查 profiles
  3. 回傳時每個 answer 帶上 `author: { name, role, avatar_url }`

### 3️⃣ 前端 `resolveAuthorDisplay` 未匯出測試用子函數（偷懶）
- **檔案**：`src/hooks/communityWallConverters.ts`
- **問題**：`normalizeAuthorRole`、`safeAuthorIdSuffix`、`buildFallbackAuthor` 是內部函數，無法單獨測試
- **引導**：
  1. 若要維持私有，在測試中透過 `resolveAuthorDisplay` 間接測試各邊界條件
  2. 或改為 `export` 並新增對應測試 case：
     - `normalizeAuthorRole(undefined)` → `resident`
     - `safeAuthorIdSuffix(null)` → `''`
     - `safeAuthorIdSuffix('abc')` → `'abc'`

### 4️⃣ 按讚節流實作有競態風險（便宜行事）
- **檔案**：`src/pages/Community/components/PostsSection.tsx:54-68`
- **問題**：`setTimeout` 內的 `async` 操作若在 timeout 觸發後 unmount，會在已卸載元件上 setState
- **引導**：
  1. 新增 `isMountedRef` 追蹤元件是否仍存在
  2. 在 `setIsLiking(false)` 前檢查 `if (!isMountedRef.current) return`
  3. 或改用 `useDebouncedCallback` 從 `use-debounce` 套件，自帶 cleanup

### 5️⃣ Converter 測試覆蓋不足（偷懶）
- **檔案**：`src/hooks/__tests__/communityWallConverters.test.ts`
- **問題**：
  - 缺測試：`formatTimeAgo` 各區間
  - 缺測試：`sortPostsWithPinned` 排序穩定性
  - 缺測試：`convertApiData` 空資料防禦
- **引導**：
  1. 新增 `formatTimeAgo` 測試：1 分鐘前、1 小時前、3 天前、2 週前、超過 4 週
  2. 新增 `sortPostsWithPinned` 測試：pinned 排前、同 pinned 保持原序
  3. 新增 `convertApiData` 測試：`apiData.posts = null` 時不爆錯

### 6️⃣ 樂觀更新後 invalidate 太快（未處理）
- **檔案**：`src/hooks/useCommunityWallQuery.ts`
- **問題**：樂觀更新後立即 invalidate，可能在 API 回應前就重新 fetch，導致閃回舊狀態
- **引導**：
  1. 在 `onMutate` 取消進行中的 queries
  2. 在 `onSettled` 才 invalidate，不要在 `onSuccess`
  3. 參考 TanStack Query 樂觀更新文件 best practice

---

## 🟡 待處理 - 人工操作（需要你在 Supabase 執行）

| # | 項目 | 執行什麼 |
|---|------|----------|
| 1 | community_members 表 | `20251205_community_members.sql` |
| 2 | Agent stats 欄位 | `20251205_add_agent_stats_columns.sql` |
| 3 | 缺少的 FK | 在 Supabase 建立 `community_reviews_property_id_fkey` |

---

## ✅ 已完成

| 日期 | 項目 |
|------|------|
| 12/06 | 抽出 `resolveAuthorDisplay` 統一作者 fallback（含 member、安全切片） |
| 12/06 | `convertApiData` 移除 mockFallback 假資料注入，改用中性佔位資料 |
| 12/06 | 新增 `communityWallConverters` 單元測試覆蓋作者與 fallback 邏輯 |
| 12/06 | `PostsSection` 按讚加入 250ms 節流防抖，避免連點多發請求 |
| 12/06 | 後端 API 補作者 profiles 合併 |
| 12/06 | 前端 fallback 作者名稱加上角色判斷 |
| 12/06 | 型別補充 `official` role |
| 12/05 | Agent stats JOIN 修正 |
| 12/05 | `/api/log-error` 錯誤回報端點 |

---

## 🧾 本次處理紀錄

- 統一作者解析與 fallback，支援 member/official 並安全截斷 ID
- 移除 mockFallback 假資料注入，缺資料時改回中性佔位
- 新增 converter 單元測試，覆蓋作者邏輯與安全切片
- 貼文按讚加入 250ms 節流防抖，避免連點重複送請求

---

## 🔍 驗證事項

部署後請檢查：
1. 打開 https://maihouses.vercel.app/maihouses/community/test-uuid/wall
2. 確認貼文作者顯示真實姓名（不是「用戶-xxxxxx」）
3. 如果 profiles 表沒有資料，會 fallback 顯示「用戶/房仲/會員-xxxxxx」

本地驗證證據：
- `npm run test` 通過（42/42）
- `npm run build` 通過
- 已推送 main（commit 286b354），Vercel 自動部署中

---

## 📁 相關檔案速查

```
api/community/wall.ts                              → 後端 API（已加 attachAuthorsToPosts，缺 answers）
src/hooks/communityWallConverters.ts               → 前端轉換器（有 fallback）
src/hooks/__tests__/communityWallConverters.test.ts → 新增測試（覆蓋不足）
src/pages/Community/components/PostsSection.tsx    → 貼文顯示（節流有競態風險）
```
