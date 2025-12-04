# 社區牆 TODO（2025-12-04 全端診斷版）

> 依據 2025/12/03 全端診斷報告，僅列出「尚未實作」且會影響穩定性 / 維護成本的項目。已完成的 G~K 等修復不再重覆列出。

---

## 1. Mock / 型別 重複定義整併

- [ ] 1-1 刪除 `useCommunityWallData.ts` 內多餘的型別定義
   - **問題**：早期版本在 `useCommunityWallData.ts` 內自行宣告 `Post/Review/Question/CommunityInfo`，後來已經統一移到 `src/types/community.ts` 並由 `src/pages/Community/types.ts` re-export。
   - **目前狀態**：
      - `src/pages/Community/types.ts` 已經 export `Post/Review/Question/CommunityInfo/UnifiedWallData`。
      - `useCommunityWallData.ts` 現在已經改為 `import type { CommunityInfo, Post, Review, Question } from '../pages/Community/types';`，且沒有再宣告自己的型別。
   - **動作**：
      - 再次全檢 `useCommunityWallData.ts`，確認沒有殘留本地型別定義（目前已符合，**此項實作量為 0，只需確認即可勾選完成**）。

- [ ] 1-2 確認 MOCK_DATA 只存在一份來源
   - **問題**：診斷報告提到「MOCK_DATA 重複定義兩份（mockData.ts + useCommunityWallData.ts）」。
   - **目前狀態**：
      - `src/pages/Community/mockData.ts`：為唯一的 Mock 資料來源，定義 `export const MOCK_DATA` 與 `createMockPost/Question/Answer`。
      - `src/hooks/useCommunityWallData.ts`：僅 `import { MOCK_DATA, createMockPost, ... }`，**沒有再宣告另一份 MOCK_DATA**。
   - **動作**：
      - 再次 grep 專案內是否還有其他 `MOCK_DATA =` 定義；若沒有，標記此項完成即可。

> ✅ 上述兩小項主要是「確認沒有回頭長出第二份定義」，目前程式碼已符合診斷建議，預期只需做一次全域搜尋驗證即可結案。

---

## 2. API communityInfo / post.title / comments_count（後端 Schema & API）

- [ ] 2-1 後端 `getAll` communityInfo 與前端格式對齊
   - **問題**：
      - 診斷報告指出「API 模式下 communityInfo 永遠是假資料（惠宇上晴）」。
      - 目前前端 `convertApiData()` 會用 API 回傳的社區資訊（若存在），否則 fallback 到 `MOCK_DATA.communityInfo`。
      - 後端 `api/community/wall.ts` 的 `getAll()` 現在回傳：
         - `community: communityResult.data`（欄位：`id, name, address, two_good, one_fair, story_vibe, completeness_score`）。
   - **目標**：
      - 明確對齊前端 `CommunityInfo` 型別所需欄位（名稱 / 完工年分 / 戶數 / 管理費 / 建商 / 互動數等），決定：
         - 要在 DB `communities` / 相關 View 裡補足欄位，或
         - 在前端 `convertApiData()` 做欄位映射 + 合成。
   - **具體作法**：
      1. 檢視 `src/hooks/communityWallConverters.ts`（或同名檔案）中 `convertApiData` 實際使用 `community` 的欄位。
      2. 撰寫一份 SQL / 資料表調整提案：將 `communities` 表的欄位對齊 `CommunityInfo` 所需（只寫 SQL 檔，不直接改 DB）。
      3. 更新 `convertApiData`：優先使用 API 回傳的 `community`；不足欄位再 fallback `MOCK_DATA.communityInfo` 的單一欄位，而不是整包覆蓋。

- [ ] 2-2 Post `title` 與 `comments_count` 欄位對齊
   - **問題**：
      - Mock Post 有 `title` + `content`；真實 API 若只有 `content`，前端就得用 `content.slice(0, 20)` 硬切當作 title → 上線後會變成奇怪的標題。
      - 同時診斷報告建議補上 `comments_count`，讓熱門貼文排序有依據。
   - **目標**：
      - 後端 `community_posts` 表增加：
         - `title text not null`（或至少允許 null 但前端 UI 明確 fallback）。
         - `comments_count integer default 0`（可由 View 聚合或 trigger 維護）。
      - `api/community/wall.ts` 取得 posts 時，把這兩欄帶出。
   - **具體作法**：
      1. 在 `supabase/migrations/` 下新增 SQL 檔（只寫 SQL，不在代碼中直接改 DB）：
          - `ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS title text;`
          - `ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;`
      2. 前端 `CommunityPost` 型別（`src/services/communityService.ts`）補上 `title` 與 `comments_count`，並更新 `convertApiData`。
      3. UI 若有只顯示 title 的地方，檢查在無 title 時的 fallback 策略（例如顯示 content 前幾字）。

---

## 3. GUEST 可見數統一（GUEST_VISIBLE_COUNT）

- [ ] 3-1 重新定義統一常數
   - **問題**：診斷報告指出三個區塊（Reviews / Posts / QA）對訪客可見數不一致，且 Reviews 是拆 pros/cons 之後再 slice，視覺體驗不一致。
   - **目前程式**：
      - `src/pages/Community/types.ts` 定義 `export const GUEST_VISIBLE_COUNT = 2;`。
      - 三個 Section 檔案中各自有 `visibleCount` / `hiddenCount` 邏輯。
   - **目標**：
      - 統一為單一常數（例如 `GUEST_VISIBLE_ITEMS = 4`，實際值可與你再確認）。
      - 三個區塊都以「完整 item 為單位」計算，不再拆成 pros/cons 再 slice。
   - **具體作法**：
      1. 改寫 `types.ts`：加入 `GUEST_VISIBLE_ITEMS` 或調整 `GUEST_VISIBLE_COUNT` 並用註解說明「以 item 為單位」。
      2. 在 `ReviewsSection.tsx` 中，先 slice review 陣列，再在 UI 裡展開 pros/cons，而不是先展開再 slice。
      3. 在 `PostsSection.tsx` / `QASection.tsx` 中，確認訪客模式下使用相同常數與同一邏輯（例如統一用 `useLockedItems`，見下個大項）。

---

## 4. 置頂邏輯與 data 層重構（高收益重構）

- [ ] 4-1 統一 pinned / sort 邏輯
   - **問題**：診斷報告指出 Mock 與 API 各自排序 pinned，未來 API 正式支援置頂時容易打架。
   - **目標**：
      - 將「public/private 貼文排序（含 pinned）」集中到單一層（建議在 data 轉換層）。
   - **具體作法**：
      1. 在 `communityWallConverters.ts` 或新建 `data.ts` 中新增 `sortPostsWithPinned()`：
          - 傳入 `posts.public` / `posts.private`，回傳排序後的陣列。
      2. `useCommunityWallData` 的 `data` memo 中，對 Mock 與 API 統一呼叫這個排序函式。

- [ ] 4-2 規劃 data 層（可分階段進行）
   - **目標雛形**（來自診斷建議）：
      - `src/features/community-wall/data.ts`（或目前結構下對應位置）：
         - `getWallData(communityId, includePrivate): Promise<UnifiedWallData>`
         - 內部封裝 `Mock` / `API` 切換與轉換，`useCommunityWallData` 只專心處理 React 狀態與切換。
   - **本輪 TODO 重點**：
      - 先把排序與 visible/hidden 統一抽到 data 層，不必一次完成整個重構；確保變更小而可控。

---

## 5. 其他中小型優化（先列出，之後可再排期）

- [ ] 5-1 發文 UI 改掉 `prompt()`（改為 Modal）
   - 目前只在開發時可接受，上線前需改為正式 UI（可重用現有 Modal 或無障礙友善元件）。

- [ ] 5-2 `useLockedItems` 小型工具 hook（去重三個區塊的 slice/hiddenCount 邏輯）
   - 診斷建議的泛型 hook：
      - `const useLockedItems = <T,>(items: T[], canSeeAll: boolean) => { visible, hiddenCount, nextItem }`。
   - 不影響現有功能，但可減少重覆程式碼，未來維護一處即可。

> 註：上述第 5 點屬「優化級」，不影響目前線上穩定度，本輪可以先專注在 2 / 3 / 4 這些對資料結構與權限邏輯影響較大的項目。

   - 依序嘗試 main → [data-app-root] → #root → body
   - 每個元素都暫存原本 tabIndex 並在聚焦後還原
   - trapFocusWithinModal 當無可聚焦元素時，聚焦 dialog 本體
   - cleanup 時還原 dialog 的 tabIndex
4. **J: communityService includePrivate**
   - `getCommunityWall()` 現在會將 `includePrivate` 轉為查詢參數 `&includePrivate=1/0`
5. **K: Optimistic Like currentUserId**
   - `useCommunityWallData` 新增 `currentUserId` state
   - 透過 `supabase.auth.getUser()` 取得並監聽 `onAuthStateChange`
   - 傳給 `useCommunityWall({ currentUserId })`
   - 修正 `useCommunityWallQuery` 的類型定義
   - 測試檔案新增 supabase mock

### 驗證結果

- `npm run typecheck`: ✅ 0 錯誤
- `npm run test`: ✅ 29 passed
- `npm run build`: ✅ 17.75s

### 部署

- `git add -A && git commit && git push origin main`
- Vercel 自動觸發部署
- 線上網址：https://maihouses.vercel.app/maihouses/community/test-uuid/wall

---

*最後更新：2025/12/04 18:45*
