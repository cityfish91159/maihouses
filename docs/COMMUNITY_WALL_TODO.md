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
| ✅ 已完成 | 0 |
| 🟡 進行中 | 0 |
| 🔴 待處理 | 3 |
| ⚠️ 受阻 | 0 |

---

## 🔴 待處理

_目前無待處理任務_

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
