# 社區牆 TODO（整理自 2025-12-04 審計）

適用頁面：`https://maihouses.vercel.app/maihouses/community/test-uuid/wall`

## 🎯 核心目標
- 讀完《COMMUNITY_WALL_COMPLETE_CODE.md》《code_analysis.md》《implementation_guide.md》等附件後，聚焦「先能跑、再優化」的原則。
- 優先修補實際功能缺口（後端 API、權限、型別轉換），確保線上網址可驗證同樣行為。
- 同步整理驗收步驟，避免只更新文件沒有實作。

---

## P0｜立即修正（沒有這些系統不可用）

### 1. 後端 API 落地
- [ ] **建立 `api/community/` Vercel Functions**：補齊 `wall`, `post`, `like`, `question`, `answer` 路由，沿用附件中的 Express 範例轉成 `@vercel/node` 寫法。
- [ ] **Schema & RLS**：依 `code_analysis.md` 的 SQL 提示新增 Supabase migration（`supabase/migrations/20251204_community_wall.sql`），涵蓋 `community_info`、`community_posts`, `community_reviews`, `community_questions` 欄位與索引。
- [ ] **權限中介層**：加入 `checkAuth`、`checkPostPermission`、`checkCanAccessPrivateWall`，確保私密牆、按讚、提問都驗證 user/role。
- [ ] **統一回應格式**：所有 API 回傳 `{ success, data, error?, timestamp }`，失敗時附 `code`。
- [ ] **驗證**：以 `curl` 或 `rest.http` 實際打 API，附成功與錯誤範例到 PR 描述。

### 2. 型別統一 + Adapter 層
- [ ] **Source of Truth**：在 `src/types/api/community.ts` 定義 Supabase 衍生型別（短期可用 `zod` 驗證，長期接 `supabase gen types`）。
- [ ] **Domain 型別**：`src/types/community.ts` 只保留前端消費的 `Post`, `Review`, `Question`, `CommunityInfo`，禁止再出現第三種定義。
- [ ] **Adapter**：新增 `src/adapters/community/`（post/review/question/community adapter），所有資料進入口徑固定從 adapter 走，刪除散落在 hooks、components 的手寫轉換。
- [ ] **測試**：為每個 adapter 編寫最少 1 筆 happy path + 1 筆缺欄位 case（可使用 Vitest）。

### 3. 真實資料取代 Mock 假值
- [ ] **Community Info**：後端 `/wall/:id` 直接回傳 `community` 物件，移除前端 `MOCK_DATA.communityInfo` fallback，並處理 `null` → UI 顯示「尚未提供」。
- [ ] **Review/Company**：後端 JOIN `users`、`property_views`、`transactions`，帶出 `author_name`, `company`, `visits`, `deals`，前端不再硬寫「匿名房仲/房仲公司」。
- [ ] **Mock Like 狀態**：`toggleLike` 在 mock 模式同步維護 `liked_by` 陣列與 `likes`，實作 `getMockUserId()`（localStorage seed）。
- [ ] **驗證**：切換 `useMock=false`，確認頁面資料與 API 同步變化；再切回 mock，確認按讚新增 `liked_by`。

### 4. 互動 UX 修復
- [ ] **PostModal**：完成 `PostModal.tsx`，`PostsSection` 不再使用 `prompt()`；包含字數限制、可上傳圖片 placeholder、送出 loading state。
- [ ] **樂觀更新**：`useCommunityWallQuery` 內的 like/question mutation 先檢查 `includePrivate` 與權限，再更新 `public/private` 陣列，避免訪客誤更新私密牆。
- [ ] **LockedOverlay**：改成 `opacity/visibility` 控制，保留 layout；`hiddenCount=0` 時才卸載，避免佈局跳動。

---

## P1｜兩天內完成（維護性 / 數據正確性）

| 編號 | 事項 | 具體作法 |
|------|------|-----------|
| A | `sortPostsWithPinned` 穩定排序 | 以 `pinned`、`pinned_at`、`created_at` 多鍵排序，最後加 `id` 當 deterministic fallback，並補單元測試。 |
| E | `community_info` 欄位補真值 | Migration 後更新 `api/community/wall.ts` 查詢與 `Sidebar` 顯示函式，遇到 `null` 顯示「尚未提供」。 |
| F | 權限 Context | 在 `src/contexts/PermissionContext.tsx` 集中計算 `permissions`，`PostsSection`/`QASection` 改用 `usePermissions()` 取得，刪除重複邏輯。 |
| G | Placeholder 公司名稱 | 建 `PLACEHOLDER_COMPANY_NAMES` 常數（放 `src/constants/community.ts`）並加註解來源；API 層優先清理，不得在 UI 硬判斷。 |

---

## P2｜本週可排（效能 / 體驗）

1. **LRU Cache**：`communityService` 改用 `lru-cache` 套件（max=100, ttl=5m），避免 Map 無限制成長；提供 `cache.clear()` 供 API revalidate。
2. **虛擬滾動 / 分頁**：對貼文列表導入 `react-window` 或後端分頁 API（`?page=1&size=20`），確保大社區載入穩定。
3. **Sidebar 排序 useMemo**：`hotPosts`、`displayQuestions` 包在 `useMemo`，減少每次 render sort cost。
4. **QA Badge 重構**：`Answer` 型別拆成 `authorType` + `isOfficial` + `isExpert`，`QACard` 用 `getBadges()` 統一顯示規則。

---

## 文件 / 排程同步

- [ ] **Issues Summary 對齊**：逐條比對 `docs/issues_summary.csv` 與本 TODO；若缺少條目或有狀態差異，雙方都更新並在 PR 中附 diff 截圖。
- [ ] **Project Timeline 落地**：參考 `docs/project_timeline.md` 制定 4 週實作排程，明確到每日任務與負責人；完成後在 `docs/COMMUNITY_WALL_DEV_LOG.md` 開新段落記錄，並同步在專案管理工具（如 Linear/Trello）。

---

## 驗收步驟

1. `npm run lint && npm run typecheck`：確認無型別錯誤。
2. `npm run test -- community-wall`：至少涵蓋 adapter/permissions hook 測試。
3. `npm run dev` + 手動操作官方網址，錄製：
   - Mock 模式與 API 模式切換
   - 發佈貼文 / 提問 / 回答流程
   - 私密牆權限檢查（未登入 vs 登入）
4. `curl` 驗證 API success/failure 範例，上傳至 PR。
5. 部署至 Vercel Preview，截圖證明資料與 API 同步且無 mock 假值。

---

## 參考檔案 & 下一步
- `docs/COMMUNITY_WALL_COMPLETE_CODE.md`
- `docs/code_analysis.md`
- `docs/implementation_guide.md`
- `docs/project_timeline.md`
- `docs/issues_summary.csv`
- `docs/COMMUNITY_WALL_DEV_LOG.md`

> 每次勾選 TODO 前，請先對照上述檔案確認需求一致，並在 PR 描述中列出「修改檔案、驗證步驟、對應網址」。
