# MOCK-SYSTEM 三模式審計報告（2026-02-22）

## 摘要
- [x] 已完成 `demo / visitor / live(註冊會員)` 三模式路由與顯示邏輯盤點（以 `MOCK-SYSTEM` 已完成工單為主）。
- [x] 已確認 demo 模式核心 mock 頁（UAG / Feed / Chat / Community Wall）都有明確 mock 分支，不會誤走正式 API。
- [x] 已確認 visitor 與註冊會員的差異化入口（Header/GlobalHeader、Community Explore、UAG Guard、Chat Guard）。
- [x] 已完成 #12b SQL 查詢設計檢視（目前可用，另附進一步優化建議）。

## 範圍與方法
- 範圍：`MOCK-SYSTEM.md` 已完成且與三模式直接相關工單（#1a、#5a、#5b、#6b、#8a、#8b、#8d、#12b、#24、#24a）。
- 方法：以程式碼路由分支 + 對應測試雙重驗證，並記錄 `file:line` 證據。
- 備註：#25（Assure 三模式）在工單總覽仍是未勾選狀態，本文僅記錄目前實作行為，不視為最終驗收完成。

## 三模式基準（Single Source of Truth）
- 工單定義：`live > demo > visitor` 優先序，見 `.claude/tickets/MOCK-SYSTEM.md:144`。
- 程式實作：`resolvePageMode(isAuthenticated)` 先判斷登入再判斷 demo，見 `src/lib/pageMode.ts:112`。
  - `isAuthenticated === true` → `live`（`src/lib/pageMode.ts:113`）
  - 未登入且 demo TTL 有效 → `demo`（`src/lib/pageMode.ts:114`）
  - 其餘 → `visitor`（`src/lib/pageMode.ts:115`）

## 三模式矩陣（重點頁面）
| 頁面/入口 | Demo（未登入 + demo 驗證） | Visitor（未登入） | Live（註冊會員） |
|---|---|---|---|
| 首頁 Header「社區評價」 | 固定導到 seed 社區牆 `COMMUNITY_WALL(SEED_COMMUNITY_ID)`，`src/components/Header/Header.tsx:53` | 導到 `COMMUNITY_EXPLORE`，`src/components/Header/Header.tsx:56` | 有社區歸屬導到個人社區牆，否則導探索頁，`src/components/Header/Header.tsx:57` |
| Header 右上操作（首頁） | 顯示「退出演示」，隱藏登入/註冊，`src/components/Header/Header.tsx:202` | 顯示登入/註冊（預設分支） | 顯示頭像選單，`src/components/Header/Header.tsx:211` |
| GlobalHeader（Feed/Chat/Community）社區導覽 | 導 seed 社區牆，`src/components/layout/GlobalHeader.tsx:61` | 導探索頁，`src/components/layout/GlobalHeader.tsx:63` | 有社區歸屬導社區牆，無歸屬導探索頁，`src/components/layout/GlobalHeader.tsx:64` |
| `/community`（Explore） | 顯示社區卡片，不顯示 visitor CTA 與 live 指引（條件分支） | 顯示底部「免費註冊」CTA，`src/pages/Community/Explore.tsx:454` | 顯示已登入引導區塊，`src/pages/Community/Explore.tsx:455` |
| `/community/:id/wall` | 強制 `useMock=true`，互動（按讚/發文/提問）走本地流程，`src/pages/Community/Wall.tsx:114`、`src/pages/Community/Wall.tsx:320` | 互動操作統一改為註冊引導，`src/pages/Community/Wall.tsx:321`、`src/pages/Community/Wall.tsx:371`、`src/pages/Community/Wall.tsx:403` | 互動走正式流程（同 `live` handler），`src/pages/Community/Wall.tsx:323`、`src/pages/Community/Wall.tsx:373` |
| `/feed/demo` | 留在 demo feed，並可 agent/member 切換，`src/pages/Feed/index.tsx:62`、`src/pages/Feed/index.tsx:133` | 非 demo 模式訪問 `/feed/demo` 直接回首頁，`src/pages/Feed/index.tsx:59`、`src/pages/Feed/index.tsx:60` | 若已登入，訪問 `/feed/demo` 會導回 `/feed/{realUserId}`，`src/pages/Feed/index.tsx:57`、`src/pages/Feed/index.tsx:58` |
| Feed 內資料來源 | `mode==='demo'` 時 `useFeedData` 強制 mock，`src/hooks/useFeedData.ts:184`、`src/hooks/useFeedData.ts:191` | visitor 在非 demo 走 API 分支，但互動受登入限制（Consumer hook 會阻擋），`src/pages/Feed/useConsumer.ts:138` | live 走 API（非 mock）資料流，`src/hooks/useFeedData.ts:354` |
| `/chat/:conversationId` | 直接走 `DemoChatView`（本地訊息，不呼叫 useChat），`src/pages/Chat/index.tsx:266` | 無有效 session 顯示登入提示，`src/pages/Chat/index.tsx:275`；有有效 session 例外可走 live chat，`src/pages/Chat/index.tsx:271` | 走 `LiveChatView`，`src/pages/Chat/index.tsx:271` |
| `/uag` | 可進入 UAG 後台，`useMock = mode==='demo'`，`src/pages/UAG/hooks/useUAGData.ts:79` | 顯示 UAGLandingPage（不進後台），`src/pages/UAG/index.tsx:405` | 僅 `agent/admin/official` 可進後台，其他角色導回首頁，`src/pages/UAG/index.tsx:395` |
| UAG「查看對話」 | demo + mock conversation 開啟內嵌 `MockChatModal`，不跳 Chat 頁，`src/pages/UAG/index.tsx:79` | visitor 本身在 UAG Landing，不會進到此按鈕流程 | live 走正常聊天室導航，`src/pages/UAG/index.tsx:90` |

## 註冊會員「有社區 / 無社區」行為（#12b 重點）
- Header 與 GlobalHeader 都只在 `mode==='live' && isAuthenticated` 時查 `useUserCommunity`，`src/components/Header/Header.tsx:45`、`src/components/layout/GlobalHeader.tsx:38`。
- `useUserCommunity` 成功時回傳 `communityId`，失敗或無資料回 `null`，`src/hooks/useUserCommunity.ts:66`。
- API `/api/community/my` 只取「最新 active 社區歸屬」：
  - 條件：`user_id` + `status='active'`，`api/community/my.ts:38`、`api/community/my.ts:39`
  - 排序：`joined_at desc`、`created_at desc`，`api/community/my.ts:40`、`api/community/my.ts:41`
  - `limit 1`，`api/community/my.ts:42`
- 因此 live 會員分兩種：
  - 有 active 社區歸屬：社區入口直達該社區牆。
  - 無 active 社區歸屬：社區入口導向 Explore（由使用者自行選擇）。

## SQL 設計檢視（#12b）
### 現況
- migration 已建立索引：`(user_id, status, joined_at DESC, created_at DESC)`，`supabase/migrations/20260222193000_community_members_latest_lookup_index.sql:5`。
- 與 API 查詢條件/排序完全對齊，能有效支撐「最新 active membership」查詢。

### 建議優化（可選，非阻塞）
- 若 `community_members` 規模再放大，可考慮改為 partial index：`WHERE status='active'`，降低索引體積。
- 可加 `INCLUDE (community_id)`（或把 `community_id` 放進索引末端）以提高 index-only scan 機率。

## 測試佐證（關鍵案例）
- Header 三模式導航：`src/components/Header/Header.demoGate.integration.test.tsx:173`、`src/components/Header/Header.demoGate.integration.test.tsx:194`。
- 註冊會員社區歸屬 hook：`src/hooks/__tests__/useUserCommunity.test.tsx:63`、`src/hooks/__tests__/useUserCommunity.test.tsx:120`。
- `/api/community/my` 最新 active membership 查詢：`api/community/__tests__/my.test.ts:152`。
- Explore 的 visitor/live 顯示差異：`src/pages/Community/__tests__/Explore.test.tsx:160`。
- Chat 三模式路由：`src/pages/Chat/__tests__/ChatModeRouting.test.tsx:119`、`src/pages/Chat/__tests__/ChatModeRouting.test.tsx:165`、`src/pages/Chat/__tests__/ChatModeRouting.test.tsx:183`。
- UAG visitor landing / live guard / demo mock chat：`src/pages/UAG/index.test.tsx:180`、`src/pages/UAG/index.test.tsx:225`、`src/pages/UAG/index.test.tsx:272`。
- Feed `/feed/demo` 分流：`src/pages/Feed/__tests__/FeedIntegration.test.tsx:129`、`src/pages/Feed/__tests__/FeedIntegration.test.tsx:146`。

## 施作紀錄
- [x] 盤點 `MOCK-SYSTEM` 已完成工單與路由。
- [x] 逐頁比對三模式分支（Header / Community / Feed / Chat / UAG / Assure 觀察）。
- [x] 製作本報告並附上程式與測試證據行號。
