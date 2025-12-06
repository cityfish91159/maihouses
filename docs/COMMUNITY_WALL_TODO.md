# 🏠 社區牆 待辦清單

> 最後更新：2025-12-06 14:15

---

## 📊 總覽

| 狀態 | 數量 |
|------|------|
| ✅ 已完成 | 17 |
| 🔴 待處理（程式碼） | 0 |
| 🟡 待處理（人工操作） | 0 |

---

## ✅ 已審計 - 樂觀更新無需修改

### 樂觀更新 invalidate 時機（2025-12-06 審計結論：已符合最佳實踐）

- **檔案**：`src/hooks/useCommunityWallQuery.ts`
- **原疑慮**：樂觀更新後立即 invalidate，可能在 API 回應前就重新 fetch
- **審計結論**：❌ 非問題。現有實作已正確：
  1. ✅ `onMutate` 先 `cancelQueries` 取消進行中 queries（第 111 行）
  2. ✅ `onMutate` 備份 `previousData` 用於回滾（第 116 行）
  3. ✅ `onMutate` 用 `setQueryData` 設置樂觀狀態（第 122 行）
  4. ✅ `onError` 用備份回滾（第 145 行）
  5. ✅ `onSettled`（而非 `onSuccess`）才 `invalidateQueries`（第 153 行）

這正是 **TanStack Query 官方推薦的樂觀更新模式**，無需修改。

---

## ✅ Supabase 人工操作（2025-12-06 執行完成）

| # | 項目 | 結果 |
|---|------|------|
| 1 | community_members 表 | ✅ 已存在（約束 `community_members_unique` 已建立） |
| 2 | Agent stats 欄位 | ✅ 已執行 `20251205_add_agent_stats_columns.sql` |
| 3 | community_reviews FK | ⚠️ 不適用（`community_reviews` 是 View 不是 Table，無法加 FK） |

---

## ✅ 已完成

| 日期 | 項目 |
|------|------|
| 12/06 | Supabase：community_members 表確認存在 |
| 12/06 | Supabase：agents 表新增 visit_count/deal_count 欄位 |
| 12/06 | Supabase：community_reviews FK 確認不適用（是 View） |
| 12/06 | 審計樂觀更新流程：確認已符合 TanStack Query 最佳實踐，無需修改 |
| 12/06 | 後端 `attachAuthorsToPosts` 型別化＋Zod 驗證 profiles |
| 12/06 | 後端問答 answers 加入作者 profiles 合併（API `getQuestions`/`getAll`） |
| 12/06 | `PostsSection` 按讚節流加入 isMounted 防呆，避免卸載後 setState |
| 12/06 | `communityWallConverters` 測試擴充（formatTimeAgo、sortPostsWithPinned、防禦） |
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

- 後端 `attachAuthorsToPosts` 型別化，profiles Zod 驗證，返回結構帶 `author: ProfileRow|null`
- 問答 API 增補 answers 的作者 profiles，避免前端 fallback 顯示假名
- `PostsSection` 節流加入 isMounted 防呆，避免卸載後 setState 競態
- Converter 測試擴充：時間格式、置頂排序穩定性、防禦空資料
- 全量測試（45/45）與 build 通過，已推 main 觸發 Vercel

---

## 🔍 驗證事項

部署後請檢查：
1. 打開 https://maihouses.vercel.app/maihouses/community/test-uuid/wall
2. 確認貼文作者顯示真實姓名（不是「用戶-xxxxxx」）
3. 如果 profiles 表沒有資料，會 fallback 顯示「用戶/房仲/會員-xxxxxx」

本地驗證證據：
- `npm run test` 通過（45/45）
- `npm run build` 通過
- 已推送 main（commit 5240515），Vercel 自動部署中

---

## 📁 相關檔案速查

```
api/community/wall.ts                              → 後端 API（posts/answers 均附 author profiles）
src/hooks/communityWallConverters.ts               → 前端轉換器（統一作者 fallback）
src/hooks/__tests__/communityWallConverters.test.ts → 測試覆蓋作者/時間/排序/防禦
src/pages/Community/components/PostsSection.tsx    → 貼文顯示（節流含 isMounted 防呆）
```
