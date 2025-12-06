# 🏠 社區牆 待辦清單

> 最後更新：2025-12-06 13:45

---

## 📊 總覽

| 狀態 | 數量 |
|------|------|
| ✅ 已完成 | 13 |
| 🔴 待處理（程式碼） | 1 |
| 🟡 待處理（人工操作） | 3 |

---

## 🔴 待處理 - 程式碼（Google 首席處長審計）

### 1️⃣ 樂觀更新後 invalidate 太快（未處理）
- **檔案**：`src/hooks/useCommunityWallQuery.ts`
- **問題**：樂觀更新後立即 invalidate，可能在 API 回應前就重新 fetch，導致閃回舊狀態
- **引導**：
  1. 在 `onMutate` 取消進行中的 queries
  2. 在 `onSettled` 才 invalidate，不要在 `onSuccess`
  3. 將樂觀 state 與 server 回應 reconcile，避免閃爍

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
