# 🏠 社區牆 待辦清單

> 本文件供 AI Agent 與開發者協作使用，請嚴格遵循以下格式。

---

## 📋 工作流程指引（給 AI Agent）

### 🔴 收到新任務時

1. **先讀取本文件**，了解目前待處理項目
2. **新增任務到「待處理」區塊**，格式如下：
   ```markdown
   ### [編號] 任務標題
   - **狀態**：🔴 待處理
   - **檔案**：`相關檔案路徑`
   - **描述**：任務說明
   - **驗收條件**：
     - [ ] 條件 1
     - [ ] 條件 2
   ```
3. 開始執行任務

### 🟡 執行任務中

1. 將任務狀態改為 `🟡 進行中`
2. 每完成一個驗收條件，打勾 `[x]`
3. 若發現新問題，新增子任務或獨立任務

### ✅ 完成任務時

1. 將任務**整個區塊移到「已完成」區塊**
2. 狀態改為 `✅ 已完成`
3. 補上完成日期：`- **完成日期**：YYYY-MM-DD`
4. **更新 DEV_LOG.md**，紀錄變更內容

### ⚠️ 任務受阻時

1. 狀態改為 `⚠️ 受阻`
2. 補上受阻原因：`- **受阻原因**：說明`
3. 通知開發者處理

---

## 📊 總覽

| 狀態 | 數量 |
|------|------|
| ✅ 已完成 | 0 |
| 🟡 進行中 | 0 |
| 🔴 待處理 | 0 |
| ⚠️ 受阻 | 0 |

---

## 🔴 待處理

<!-- 
範例格式：
### 1️⃣ 任務標題
- **狀態**：🔴 待處理
- **檔案**：`src/xxx.ts`
- **描述**：任務說明
- **驗收條件**：
  - [ ] 條件 1
  - [ ] 條件 2
-->

_目前無待處理任務_

---

## 🟡 進行中

_目前無進行中任務_

---

## ⚠️ 受阻

_目前無受阻任務_

---

## ✅ 已完成

<!--
完成的任務移到這裡，格式：
### [編號] 任務標題
- **狀態**：✅ 已完成
- **完成日期**：YYYY-MM-DD
- **檔案**：`src/xxx.ts`
- **描述**：任務說明
-->

_歷史任務請參閱 DEV_LOG.md_

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `docs/COMMUNITY_WALL_DEV_LOG.md` | 開發紀錄（每次變更必須更新） |
| `api/community/wall.ts` | 後端 API |
| `src/hooks/useCommunityWallQuery.ts` | React Query Hook |
| `src/hooks/communityWallConverters.ts` | 資料轉換器 |
| `src/pages/Community/` | 社區牆頁面組件 |

---

## 🏷️ 狀態圖例

| 圖示 | 狀態 | 說明 |
|------|------|------|
| 🔴 | 待處理 | 尚未開始 |
| 🟡 | 進行中 | 正在執行 |
| ✅ | 已完成 | 已完成並驗證 |
| ⚠️ | 受阻 | 需要人工介入 |
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
