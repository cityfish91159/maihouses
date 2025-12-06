# 🏠 社區牆 待辦清單

> 供 AI Agent 與開發者協作使用

---

## 📋 Agent 工作流程

| 階段 | 動作 |
|------|------|
| 🔴 收到任務 | 新增到「待處理」→ 狀態設 `🔴` |
| 🟡 執行中 | 移到「進行中」→ 狀態改 `🟡` → 逐項打勾驗收 |
| ✅ 完成 | 移到「已完成」→ 狀態改 `✅` → 補完成日期 → 更新 DEV_LOG.md |
| ⚠️ 受阻 | 狀態改 `⚠️` → 補受阻原因 → 通知開發者 |

**任務格式：**
```
### [編號] 標題
- **狀態**：🔴/🟡/✅/⚠️
- **檔案**：`路徑`
- **描述**：說明
- **驗收條件**：
  - [ ] 條件
```

---

## 📊 總覽

| 狀態 | 數量 |
|------|------|
| ✅ 已完成 | 3 |
| 🟡 進行中 | 0 |
| 🔴 待處理 | 6 |
| ⚠️ 受阻 | 0 |

---

## 🔴 待處理

> ⚠️ **以下為 2025-12-06 審計發現的遺漏與問題，由 Claude 首席工程師整理**

### 4️⃣ P0-3：修復重複 JSDoc 註解語法錯誤
- **狀態**：🔴 待處理
- **嚴重度**：🔴 阻斷（潛在編譯警告）
- **檔案**：`api/community/wall.ts`
- **描述**：第 391-392 行出現連續兩個 `/**` 開頭的 JSDoc，中間沒有正確關閉
- **問題原文**：
  ```typescript
  /**
  /**
   * 查詢房仲資訊並處理欄位尚未建立時的降級情境。
  ```
- **引導修正**：
  1. 刪除第 391 行的孤立 `/**`
  2. 只保留第 392-394 行正確的 JSDoc 區塊
  3. 執行 `npm run build` 確認無 TS 警告

---

### 5️⃣ P1-3：測試涵蓋不足——缺少負面測試
- **狀態**：🔴 待處理
- **嚴重度**：🟡 中
- **檔案**：`api/community/__tests__/wall.test.ts`
- **描述**：現有測試只覆蓋 happy path，缺乏以下場景：
  - `content` 為 `null` 或 `undefined`
  - `content.pros` 非陣列（例如字串或數字）
  - `source_platform` 缺失時的 fallback 邏輯
- **引導修正**：
  1. 新增 `it('handles null content gracefully')` 測試 `withDefaults({ content: null })`
  2. 新增 `it('handles malformed pros array')` 測試 `content: { pros: '不是陣列' }`
  3. 新增 `it('defaults source to resident when source_platform missing')` 確認 fallback
  4. 執行 `npm run test` 確認所有測試通過

---

### 6️⃣ P1-4：移除 API 內殘留的 hiddenCount 計算
- **狀態**：🔴 待處理
- **嚴重度**：🟡 中
- **檔案**：`api/community/wall.ts`
- **描述**：`getReviews()` 第 656 行仍計算 `hiddenCount`，但 TODO 已說明由前端負責
- **問題原文**：
  ```typescript
  const hiddenCount = !isAuthenticated ? Math.max(0, reviewResult.total - reviewResult.items.length) : 0;
  ```
- **引導修正**：
  1. 移除 `hiddenCount` 變數計算
  2. 移除 JSON 回傳中的 `hiddenCount` 欄位
  3. 保持 `total` 讓前端自行計算 hidden
  4. 確認前端 `useGuestVisibleItems` 已自行處理

---

### 7️⃣ P1-5：EMPTY_WALL_DATA 命名與邏輯問題
- **狀態**：🔴 待處理
- **嚴重度**：🟡 中
- **檔案**：`src/hooks/useCommunityWallData.ts`
- **描述**：`EMPTY_WALL_DATA.communityInfo.name = '尚未載入'` 語意不精確，且 API 錯誤時應顯示「載入失敗」而非「尚未載入」
- **引導修正**：
  1. 將 `EMPTY_WALL_DATA` 拆成兩個常數：
     - `LOADING_WALL_DATA`（name: '載入中...'）
     - `ERROR_WALL_DATA`（name: '載入失敗'）
  2. `useMemo` 內根據 `apiError` 狀態選用正確的 fallback
  3. 或者維持單一常數但 name 改為空字串，由 UI 層判斷顯示

---

### 8️⃣ P2-1：lastApiDataRef 可能造成 stale data
- **狀態**：🔴 待處理
- **嚴重度**：🟢 低
- **檔案**：`src/hooks/useCommunityWallData.ts`
- **描述**：切換社區時僅 `lastApiDataRef.current = null`，但若新社區 API 仍在載入，`useMemo` 會回傳 `EMPTY_WALL_DATA`；若 API 失敗，永遠卡在空資料
- **引導修正**：
  1. 考慮在 `communityId` 變化時同時 `apiRefresh()` 強制重載
  2. 或在 `useMemo` 內加入 `apiLoading` 條件，載入中時回傳 loading 專用資料
  3. 確保 UI 能正確顯示「重試」按鈕

---

### 9️⃣ P2-2：API 錯誤訊息未在前端充分顯示
- **狀態**：🔴 待處理
- **嚴重度**：🟢 低
- **檔案**：`src/pages/Community/Wall.tsx`
- **描述**：TODO 說「API 錯誤時顯示錯誤訊息」，但實際前端僅顯示「載入失敗，請稍後再試」，未呈現後端回傳的 `error.message`
- **引導修正**：
  1. 在錯誤區塊加入 `{import.meta.env.DEV && <pre>{error.message}</pre>}` 便於除錯
  2. 生產環境可保持友善訊息，但 console 應 log 完整錯誤
  3. 確認 `apiError` 有正確傳遞後端訊息

---

## 🟡 進行中

_目前無進行中任務_

---

## ⚠️ 受阻

_目前無受阻任務_

---

## ✅ 已完成

### 2025-12-06 - 1️⃣ P0-1：修復 community_reviews VIEW 欄位查詢
- **狀態**：✅ 已完成
- **檔案**：`api/community/wall.ts`
- **描述**：後端改為查詢 `author_id/content/source_platform`，並解析 JSONB 內容避免 500 錯誤
- **驗收條件**：
  - [x] 修改 API 查詢使用正確的 VIEW 欄位
  - [x] 從 `content` JSONB 解析 pros/cons
  - [x] API 模式不再回傳 500 錯誤

### 2025-12-06 - 2️⃣ P0-2：移除 API 的 GUEST_LIMIT 限制
- **狀態**：✅ 已完成
- **檔案**：`api/community/wall.ts`
- **描述**：移除 `GUEST_LIMIT` 常數與相關欄位，由前端 `useGuestVisibleItems` 控制顯示數量
- **驗收條件**：
  - [x] 移除 `wall.ts` 內 posts 的 GUEST_LIMIT 限制
  - [x] 移除 reviews 查詢的 GUEST_LIMIT 限制
  - [x] 非會員仍可取得完整資料供 LockedOverlay 顯示

### 2025-12-06 - 3️⃣ P1-2：移除 API 錯誤自動 fallback 到 Mock
- **狀態**：✅ 已完成
- **檔案**：`src/hooks/useCommunityWallData.ts`
- **描述**：API 模式僅在成功時更新資料，錯誤改顯示提示並保持使用者選擇
- **驗收條件**：
  - [x] 移除自動切換 Mock 的行為
  - [x] API 錯誤時顯示錯誤訊息，不自動切換
  - [x] 用戶可手動切換 Mock/API 模式

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `docs/COMMUNITY_WALL_DEV_LOG.md` | 開發紀錄 |
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
