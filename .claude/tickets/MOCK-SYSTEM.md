# MOCK-SYSTEM-UNIFY: 全站三模式架構設計

## 實作進度總覽

### P0 — 基礎建設

- [x] **#1a** `usePageMode()` hook — 模式判斷 + localStorage TTL + 跨分頁同步（1 新檔案）✅ 2026-02-12
- [x] **#1b** `useModeAwareAction` hook — 三模式行為派發 + cache key 規範（1 新檔案）✅ 2026-02-13
- [x] **#1c** `DemoGate.tsx` — Logo 連按 5 次觸發演示模式（1 新檔案）✅ 2026-02-13
- [x] **#2** 全站靜態 HTML 連結改 React 路由 + `SEED_COMMUNITY_ID`（7 檔 16 處）✅ 2026-02-13
- [x] **#3** 按讚三模式行為分離 — mode guard 優先於 auth guard（2 檔）✅ 2026-02-13
- [x] **#14a** 確認 Toast 支援 action button（前置條件）✅ 2026-02-12
- [ ] **#14b** `useRegisterGuide()` hook — 訪客引導註冊 8 場景（1 新檔案）
- [x] **#15** `getAuthUrl()` 工具函數 — 統一 auth 跳轉 + `?return=` + `?role=`（1 新檔案 + 7 處重構）✅ 2026-02-12

### P1 — 逐頁接入

- [x] **#4a** 房產詳情頁：移除 `isDemoPropertyId` 改用 usePageMode（5 檔）✅ 2026-02-15
- [x] **#4b** 房產詳情頁：社區牆 + 註冊查看連結修正（3 檔）✅ 2026-02-15
- [x] **#5a** UAG：訪客 Landing Page + 角色守衛（6 新檔案 + 2 修改）✅ 2026-02-13
- [x] **#5b** UAG：移除 `uagModeStore`，改用 usePageMode（6 檔）✅ 2026-02-15
- [x] **#6a** Feed：Logo 導航修復 + 廢棄路由清理（4 檔）✅ 2026-02-15
- [x] **#6b** Feed：移除 `DEMO_IDS` + 新增 `/feed/demo` 路由（7 檔 + 4 測試）✅ 2026-02-16
- [ ] **#7** 登入後重定向 — agent→UAG、consumer→首頁（auth.html）

### P1 — 跨頁面

- [ ] **#12** 首頁 Header 三模式 UI — visitor 登入/註冊、demo 隱藏、live 頭像下拉（Header.tsx + GlobalHeader.tsx）
- [ ] **#13** PropertyListPage Header 統一（LegacyHeader → Header）

### P1 — 程式碼品質

- [x] **#17** `src/lib/error.ts` 統一錯誤處理工具（1 新檔案 + 17 測試）✅ 2026-02-12
- [x] **#18** 3 檔 catch 改用 `getErrorMessage()`（config / track / MaiMaiContext）✅ 2026-02-13
- [x] **#19** [P1] 砍舊路徑：前端 `tracker` 由 `/api/uag-track` 切到 `/api/uag/track`，下線 deprecated JS 版 ✅ 2026-02-12
- [x] **#20** 整合分散 Mock Data + seed 不可變 `Object.freeze`（19 檔）✅ 2026-02-15
- [ ] **#28** 已完成工單防禦強化 — Zod 收緊 + SSR guard + `as` 斷言消除（5 檔）
- [ ] **#29** 跨裝置三模式驗證修復 — iOS Safari + 手機版 + 私隱模式（12 檔）

### P1 — 社區牆三模式（極限測試升級）

- [x] **#8a** 社區牆：`useEffectiveRole` hook + 按讚改用 useModeAwareAction + **demo mode 完全未接入**（3 檔）✅ 2026-02-16
- [ ] **#8b** 社區牆：發文/留言本地化 + LockedOverlay/BottomCTA 引導修正（3 檔）

### P2 — 社區牆導航修正

- [ ] **#8c** 社區列表 API — `GET /api/community/list`（1 新檔案）
- [ ] **#8d** 社區探索頁 — visitor/無歸屬會員的著陸頁（1 新頁面 + 路由，需 `/ui-ux-pro-max`）
- [ ] **#12b** Header 社區導航分層 — `useUserCommunity` + `api/community/my` + 導航規則（依賴 #8d + #12）

### P2 — 收尾清理
- [ ] **#9** 移除靜態 HTML mock 頁 + vercel.json 同步（6 檔）
- [ ] **#10a** `DemoBadge.tsx` 浮動標籤 UI（1 新檔案，需 `/ui-ux-pro-max`）
- [ ] **#10b** `exitDemoMode()` 退出清理 + 確認 dialog
- [ ] **#11** Feed 產品定位確認（待決策）
- [ ] **#16** 全站文案健康檢查 — 亂碼 + emoji + CI lint
- [ ] **#21** 全站 `console.log` 改用 `logger`（整合 getErrorMessage）
- [ ] **#22** Tailwind classnames 排序修復（2 檔）
- [ ] **#23** React Hook 依賴陣列優化（1 檔）

### P2 — 跨頁面三模式 + 清理

- [ ] **#24** Chat 三模式支持（`Chat/index.tsx`）
- [ ] **#25** Assure 三模式支持 — `isMock` → usePageMode（`Assure/Detail.tsx`）
- [ ] **#26** 登出清理 — `cleanupAuthState()` 統一函數 + onAuthStateChange（2 檔）
- [ ] **#27** UAG 新房仲空狀態 + MaiMai 引導（1 新組件）

### P2 — 靜態頁重構（`docs/property.html`）

- [ ] **#30a** HTML 結構 + CSS Design System — 6 區塊骨架 + 三層卡片(L/M/S) + 房仲頭像 + 品牌色 + 響應式（需 `/ui-ux-pro-max`）
- [ ] **#30b** MaiMai SVG + 動畫 + 互動 — wave/celebrate 精確座標 + scroll-triggered 入場 + 點擊氣泡切換 + confetti
- [ ] **#30c** JS 資料驅動 + 卡片渲染 — 11 筆 Mock 資料 + L/M/S 三層 JS 渲染 + 愛心收藏 + 分頁

---

## 施工依賴圖

```
#1a usePageMode ───────┬→ #1b useModeAwareAction
                       ├→ #1c DemoGate
                       ├→ #3 按讚分離
                       ├→ #4a isDemoPropertyId 移除
                       ├→ #5b uagModeStore 遷移
                       ├→ #6b DEMO_IDS 移除
                       ├→ #8a 社區牆重構
                       ├→ #10a DemoBadge
                       ├→ #12 Header 三模式 UI
                       ├→ #20 Mock 整合
                       ├→ #24 Chat / #25 Assure
                       └→ #26 登出清理

#1b useModeAwareAction ✅ ┬→ #3 按讚 / #8a 社區牆按讚 / #5b UAG Lead
#1c DemoGate ──────────→ #10a DemoBadge
#14a Toast 確認 ───────→ #14b useRegisterGuide
#14b useRegisterGuide ─┬→ #3 visitor 引導 / #8b handleUnlock / #6b Feed
#15 getAuthUrl ────────┬→ #2 連結統一 / #4b 詳情頁 / #6a GlobalHeader / #8b BottomCTA
#8a 權限重構 ──────────→ #8b 互動本地化
#10a DemoBadge ────────→ #10b 退出清理
#17 error.ts ──────────┬→ #18 錯誤重構 / #21 logger 整合
#2 連結清理 ───────────→ #9 移除 HTML 頁
#5a UAG Landing ───────┬→ #5b 遷移 / #27 空狀態
#12 Header UI ─────────→ #26 登出清理
#1a + #10b + #14b ─────→ #29 跨裝置驗證修復

#8c 社區列表 API ──────┬→ #8d 社區探索頁
                        └→ #7 註冊加社區選擇（復用 list API）
#8d 社區探索頁 ─┬──────→ #12b Header 社區導航分層（探索頁須先存在）
#12 Header UI ──┘

#30a HTML+CSS 骨架 ────── 無依賴（獨立靜態 HTML，可隨時施工）
#30a ─────────────────┬→ #30b MaiMai SVG + 動畫
                       └→ #30c JS 資料驅動 + 卡片渲染
```

## 施工順序

| 波次 | 工單 | 說明 |
|------|------|------|
| Wave 0 ✅ | #17、#19 | 基礎工具（已完成）|
| Wave 1 | #1a ✅、#1b ✅、#14a ✅、#15 ✅、#18 ✅ | 核心 hook + authUtils |
| Wave 1B | #1c、#14b | DemoGate + useRegisterGuide |
| Wave 2 | #2、#3、#5a、#12、#20 | 可平行（#12 只做三模式 UI，不含導航分層）|
| Wave 3 | #4a、#4b、#5b、#6a、#6b、#8a、#27 | 逐頁接入（#8a 升 P1 併入）|
| Wave 3B | #8b | 依賴 #8a |
| Wave 4 | #8c、#9、#10a、#13、#16、#21、#22、#23 | 收尾清理 + 社區列表 API |
| Wave 4B | #8d、#10b、#24、#25、#29 | 社區探索頁 + 退出清理 + Chat/Assure + 跨裝置修復 |
| Wave 4C | #12b、#26 | Header 社區導航分層（依賴 #8d + #12）+ 登出清理 |
| Wave 5 | #7、#11 | 登入重定向 + 註冊加社區選擇（依賴 #8c）+ 產品方向確認 |
| Wave Any-1 | #30a | HTML+CSS 骨架（無依賴，可隨時插入）|
| Wave Any-2 | #30b、#30c | MaiMai 動畫 + JS 渲染（依賴 #30a）|

---

## 三模式定義

```
已登入（Supabase session）                → live（最高優先）
未登入 + localStorage 演示驗證（TTL 內）  → demo
未登入                                    → visitor
```

| 行為 | visitor | demo | live |
|------|---------|------|------|
| 資料來源 | seed + API 補位 | seed（禁 API）| API |
| 瀏覽 | 部分 + LockedOverlay | 全部 | 依角色 |
| 按讚 | toast 引導註冊 | 本地 toggle | API |
| 發文/留言 | toast 引導註冊 | 本地新增 | API |
| LINE/電話 | 正常 | 正常 | 正常 |
| 第 3 則評價 | blur + Lock | 解鎖 | 解鎖 |
| UI 標示 | 無 | 浮動標籤 | 無 |

---

## 子工單規格

---

### #1a ✅ `usePageMode()` hook

**已完成** 2026-02-12

新增：`src/lib/pageMode.ts`、`src/hooks/usePageMode.ts`、`src/hooks/useDemoTimer.ts`
修改：`src/App.tsx`、`src/analytics/track.ts`、`src/hooks/usePropertyTracker.ts`

**已知缺口**：
- 登入時 `clearDemoMode()` 未同步 `queryClient.clear()`，演示期間 cache 可能短暫殘留 → 歸 #10b 處理。
- `useDemoTimer.ts:45` warn 條件 `warnDelay > 0 || remaining > WARN_SKIP_THRESHOLD_MS` 在 remaining 介於 30s~5min 時會立即觸發 warn toast，應改為 `warnDelay > 0 && remaining > WARN_SKIP_THRESHOLD_MS` → 歸 #29。
- iOS Safari 私隱模式 `safeStorage` 探測可能通過但後續寫入失敗，`setDemoMode()` 靜默失敗 → 歸 #29。
- iOS Safari 背景分頁 `setTimeout` 暫停，`useDemoTimer` 到期不觸發 → 歸 #29。
- iOS Safari `StorageEvent` 在 App 背景回前景時不觸發，跨分頁同步失效 → 歸 #29。

---

### #1b ✅ `useModeAwareAction` + cache key 規範

**已完成** 2026-02-13

新增：`src/hooks/useModeAwareAction.ts`
修改：6 個 React Query hook 的 queryKey 加入 mode、`src/pages/UAG/index.tsx` cache key 對齊

**API 簽名**（施工時參考）：
```typescript
function useModeAwareAction<T>(handlers: {
  visitor: (data: T) => void | Promise<void>
  demo: (data: T) => void | Promise<void>
  live: (data: T) => void | Promise<void>
}): (data: T) => Promise<{ ok: true } | { ok: false; error: string }>
```

**規則**：本地操作全存 React state（重新整理消失），唯一例外 Feed RoleToggle 存 sessionStorage。

<details><summary>施工紀錄（2 輪收斂）</summary>

**Round 1**：核心 hook + 6 個 queryKey 加 mode
**Round 2（尾差）**：UAG `setQueryData` / `invalidateQueries` 對齊 `uagDataQueryKey(mode, userId)`

修改檔案：`useModeAwareAction.ts`、`useCommunityWallQuery`、`useCommunityReviewLike`、`useAgentReviews`、`useAgentProfile`、`useUAGData`、`getFeaturedHomeReviews`、`UAG/index.tsx`

驗證：`npm run gate` ✅ · `rg "\\['uagData'.*useMock" src/pages/UAG` → 0 筆 ✅
</details>

---

### #1c ✅ `DemoGate.tsx` 觸發元件

**已完成** 2026-02-13

**目標**：首頁 Logo 連按 5 次進入演示模式

**依賴**：#1a

**新增**：`src/components/DemoGate/DemoGate.tsx`

**修改**：`src/components/Header/Header.tsx`

**施工重點**：

1. `DemoGate` 以 click-capture 實作 1500ms 內 5 連按判定，達標後顯示確認 toast（含 action button）。
2. 確認 action 執行 `setDemoMode()` + `reloadPage()`，符合 #1c 進入 demo 流程。
3. 觸發成功時加入 `motion-safe:animate-shake` 視覺回饋（500ms），提供可見反饋。
4. 僅 `visitor` 可觸發；`demo/live` 狀態不重複觸發。
5. 首頁 Header 的登入/註冊按鈕加入 demo 攔截，點擊只提示、不進入 auth 流程。

**驗收**：
- [x] 連按 5 次（1500ms 內）可觸發演示模式確認 toast
- [x] 點擊確認後執行 `setDemoMode()` + reload
- [x] 觸發時有 shake 視覺回饋
- [x] 已在 demo 不重複觸發
- [x] demo 下點「登入」被攔截

**驗證結果**：
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過
- [x] `npm run test -- src/pages/Home.test.tsx` 通過

---

### #2 ✅ 靜態 HTML 連結改 React 路由

**已完成** 2026-02-13

新增：`src/constants/seed.ts`（`SEED_COMMUNITY_ID`）、`RouteUtils.toNavigatePath()`
修改：`CommunityTeaser.tsx`、`Header.tsx`、`CommunityWallCard.tsx`、`CommunityReviews.tsx`、`routes.ts`（共 7 檔 16 處）
移除：`ROUTES.COMMUNITY_WALL_MVP`

<details><summary>施工紀錄</summary>

- `SEED_COMMUNITY_ID = 'test-uuid'`（`Object.freeze`）集中管理
- 首頁 CommunityTeaser / Header / CommunityWallCard 全部從 `community-wall_mvp.html` 改走 React Router
- `CommunityReviews.handleCommunityWall` 依模式路由：有 id 直達、demo fallback seed、live 無 id 顯示 notify
- `RouteUtils.toNavigatePath()` 處理 `basename` 相容，避免雙前綴

驗證：`rg "COMMUNITY_WALL_MVP|community-wall_mvp" src` → 0 筆 ✅ · `npm run gate` ✅
</details>

---

### #3 ✅ 按讚三模式行為分離

**已完成** 2026-02-13

修改：`CommunityReviews.tsx`、`AgentReviewListModal.tsx`、`useComments.ts`、`useCommunityReviews.ts`、`commentService.ts`（新增）
核心：mode guard 優先於 auth guard → `visitor→引導註冊` / `demo→本地 toggle` / `live→API`

<details><summary>施工紀錄（3 輪收斂）</summary>

**Round 1**：按讚改 `useModeAwareAction`、移除 `disabled={!isLoggedIn}`、LockedReviewCard CTA 改 DIP、`useComments.toggleLike` 補防重入 guard
**Round 2**：移除 `isDemo` prop（統一 usePageMode）、useComments API 回應改 Zod safeParse、AgentReviewListModal 分頁累積修正
**Round 3**：移除 `as` 斷言（RefObject cast、distribution cast、IntersectionObserver mock）

驗證：`rg "disabled={!isLoggedIn}" src` → 0 筆 ✅ · 31 tests ✅ · `npm run gate` ✅
</details>

---

### #4a ✅ 房產詳情頁：移除 `isDemoPropertyId`

**已完成** 2026-02-15

修改：`property.ts`、`propertyService.ts`、`PropertyDetailPage.tsx`、`AgentReviewListModal.tsx`、`PropertyDetailActionLayer.tsx`、`AgentTrustCard.tsx`、`usePropertyTracker.ts`（共 7 檔）
移除：`DEMO_PROPERTY_ID` + `isDemoPropertyId()`，統一用 `usePageMode()`

驗證：`rg "isDemoPropertyId" src/` → 0 筆 ✅

---

### #4b ✅ 房產詳情頁：連結修正

**已完成** 2026-02-15

修改：`CommunityReviews.tsx`、`CommunityWallCard.tsx`、`ChatMessage.tsx`（共 3 檔）
核心：社區牆導流統一 `RouteUtils.toNavigatePath()`、auth 跳轉統一 `navigateToAuth()`、ChatMessage 支援新舊雙格式標記

驗證：16 tests ✅ · `rg "community-wall_mvp|auth\\.html" src/components/PropertyDetail` → 0 筆 ✅

#### 2026-02-15 strict-audit 收斂（壞味道修復）

- [x] `PropertyDetailPage.tsx`：`/maihouses/assure` 改為 `navigate(RouteUtils.toNavigatePath(ROUTES.ASSURE))`，移除 `window.location.href` 全頁重載。
- [x] `CommunityReviews.test.tsx`：社區牆按鈕改用可存取名稱查找（`getByRole('button', { name: '前往社區牆' })`），不再靠 className 選擇器。
- [x] `ChatMessage.tsx`：社區牆/物件卡片 key 改為語意 key + 次數去重，移除純 index key。

---

### #5a ✅ UAG：訪客 Landing Page + 角色守衛

**已完成** 2026-02-13

新增：`UAGLandingPage.tsx` + 4 個 landing 子元件（Hero/Features/Steps/CTA）
修改：`UAG/index.tsx`（加 `UAGGuard`）
守衛：visitor→Landing / demo→seed / live+agent→API / live+其他→導回首頁

驗證：4 tests ✅ · `tsc --noEmit` ✅

---

### #5b ✅ UAG：移除 `uagModeStore` + usePageMode

**已完成** 2026-02-15

移除：`src/stores/uagModeStore.ts`
新增：`usePageModeWithAuthState()`（可重用 mode 推導）、`mockProfile.ts`
修改：`useUAGData.ts`、`useAgentProfile.ts`、`TrustFlow/index.tsx`、`Profile/index.tsx`、`UAGHeader.tsx`（共 6 檔 + 測試）
核心：所有 `uagModeStore` / `selectUseMock` / `?mock=true` 替換為 `usePageMode()`

**遺留 follow-up**：
- `TrustFlow/index.tsx`、`Profile/index.tsx`、`UAGHeader.tsx` 皆超 80 行，拆檔建議以獨立工單執行

#### 2026-02-15 strict-audit 收斂（cache key 一致性）

- [x] `Profile/hooks/useAgentProfile.ts`：query key 改為共用 `uagAgentProfileQueryKey(mode, userId)`，與 UAG 主流程一致。
- [x] `Profile/hooks/useAgentProfile.ts`：`enabled` 條件收斂為 `isMockMode || (mode === 'live' && !!user?.id)`，避免 live 未完成鑑別時提早發請求。

<details><summary>施工紀錄（3 輪收斂）</summary>

**Round 1**：刪 store、6 檔改用 usePageMode、TrustFlow toggleMode 改唯讀
**Round 2（strict-audit）**：useUAGData/UAGGuard 共用 auth 狀態推導、Profile 加 `?mock=true` 清洗、移除 `as unknown as Location`
**Round 3（衛生）**：移除 `as const`/`as CSSProperties`/`as User` 斷言、magic number 抽常數、mock 抽 `mockProfile.ts`、清 notification 殘碼

驗證：`rg "uagModeStore|selectUseMock" src` → 0 筆 ✅ · `rg "mock=true" src/pages/UAG` → 0 筆 ✅ · 70 tests ✅ · `npm run gate` ✅
</details>

---

### #6a ✅ Feed：Logo 導航 + 廢棄路由

**已完成** 2026-02-15

修改：`GlobalHeader.tsx`、`AgentConversationList.tsx`、`routes.ts`（共 3 檔）
移除：`FEED_AGENT`、`FEED_CONSUMER`、`FEED_AGENT_LEGACY`、`FEED_CONSUMER_LEGACY` 路由常數
核心：Logo + 個人檔案統一導向 `ROUTES.HOME`

驗證：`rg "FEED_AGENT|FEED_CONSUMER" src/` → 0 筆 ✅ · `npm run gate` ✅

---

### #6b ✅ Feed：移除 `DEMO_IDS` + usePageMode

**已完成** 2026-02-16（第二輪修正：2026-02-16；strict-audit Phase 4：2026-02-16）

新增：`App.tsx` `/feed/demo` 靜態路由、`ROUTES.FEED_DEMO`
修改：`Feed/index.tsx`、`useFeedData.ts`、`useConsumer.ts`、`useAgentFeed.ts`、`Agent.tsx`、`Consumer.tsx` + 測試同步
核心：
- 移除 `DEMO_IDS` 與 feed 頁面的 `?mock=true` 入口依賴，統一由 `usePageMode()` 驅動
- `/feed/demo`：已登入直接導回 `/feed/{realUserId}`；非 demo（含演示到期）使用 `navigate(RouteUtils.toNavigatePath(ROUTES.HOME), { replace: true })`
- feed demo 角色切換持久化到 `feed-demo-role`（sessionStorage）
- `useFeedData` 新增 `mode` 選項，`useMock` 依 mode 同步（demo=true / 其他=false）
- `useFeedData` mode override / `mhEnv` fallback 合併為單一 `useEffect`，並移除不可追溯註解
- `useAgentFeed` 改為顯式 `feedOptions`，移除條件式 spread
- `Agent` 移除無效 `viewerRole` fallback；`Consumer` 的 deep-link 依賴改為 `filteredPosts`
- `Consumer` 發文 `onSubmit` 改為直接傳遞可選 `images`
- `safeStorage` 補 `logger.warn`，避免 storage 不可用時靜默失敗

**驗證**：
- [x] `rg "DEMO_IDS" src/` → 0 筆
- [x] `npm run check:utf8`
- [x] `npm run typecheck`
- [x] `npm run gate`
- [x] `cmd /c npm run test -- src/pages/Feed/__tests__/FeedIntegration.test.tsx src/pages/Feed/__tests__/FeedRouting.test.tsx src/pages/Feed/__tests__/useAgentFeed.test.ts src/pages/Feed/__tests__/useConsumer.test.ts`（16 passed）

---

### #7 登入後重定向 + 註冊加社區選擇

**目標**：agent→UAG、consumer→首頁；註冊成功後可選社區選擇步驟，建立使用者與社區的關聯

**依賴**：#8c（復用 `GET /api/community/list`）

**檔案**：`public/auth.html` :1620-1660

**重定向邏輯**：
```javascript
function successRedirect(user) {
  try { localStorage.removeItem('mai-demo-verified') } catch {}
  const returnPath = getSafeReturnPath()
  if (returnPath) { go(returnPath); return }
  if (user.user_metadata?.role === 'agent') go('/maihouses/uag')
  else go('/maihouses/')
}
```

**註冊加社區選擇（可選步驟）**：

背景：`community_members` 表存在但註冊時不寫入，使用者與社區關聯為空。

- 註冊成功後新增可選步驟（可跳過）
- 買家（member）：「你想了解哪個社區？」→ 搜尋/選擇 → 寫入 `community_members`（role: `member`）
- 業務（agent）：「你服務哪些社區？」→ 多選 → 寫入 `community_members`（role: `agent`）
- 「跳過」按鈕 → 直接進入首頁/UAG
- 社區搜尋復用 `GET /api/community/list`（#8c）

**驗收**：
- agent→UAG、consumer→首頁
- localStorage 無 `mai-demo-verified` 殘留
- 註冊後可選擇社區，跳過不影響註冊完成
- 選擇後 `community_members` 正確寫入
- `npm run gate` 通過

---

### #8a ✅ [P1] 社區牆權限重構（P2→P1 升級）

**已完成** 2026-02-16（第二輪修正：2026-02-16）

**依賴**：#1a、#1b

**新增**：`src/hooks/useEffectiveRole.ts`、`src/hooks/__tests__/useEffectiveRole.test.tsx`

**修改**：`src/pages/Community/Wall.tsx`

**核心變更**：
- `useEffectiveRole` 統一角色推導：`loading -> guest`、`demo -> resident`、`DEV + devRole -> override`、其餘走 auth role
- `UseEffectiveRoleOptions.urlRole` 更名為 `devRole`，避免 state 值被誤解為 URL 來源
- `useEffectiveRole` 內部判斷改為單次 `resolveEffectiveRole(...)` 呼叫，避免 `undefined` optional prop 進入 options
- `useEffectiveRole` 測試改為只驗證公開 API（`renderHook` + `vi.stubEnv('DEV', true/false)`）
- `Wall.tsx` 新增 `useDemoModeMockSync`，集中處理 demo/prod 的 mock 強制同步
- `Wall.tsx` `initialRole` 的 `useMemo([])` 補註解，明確說明只讀初始值、後續由 effect 同步
- `handleLike` 使用 `useModeAwareAction`：`visitor -> 註冊引導`、`demo/live -> toggleLike`
- `handleUnlock` 使用統一註冊引導（含 action button）
- `useEffectiveRole` 的 options 建構改為顯式物件 + `if` 指派，移除條件式 spread
- `useDemoModeMockSync` 的 ticket 功能註解移到 hook 定義處，呼叫處改為簡短註解
- `dispatchToggleLike.visitor` 抽為具名 `showLikeRegisterGuide` callback
- `roleState` 型別守衛更名 `isValidWallRole`，語義與用途一致
- `useModeAwareAction` 補 JSDoc，明確說明 handlers 建議 memoize
- `useEffectiveRole` DEV/PROD 測試名稱精準化，並明確覆蓋未登入場景

**驗證**：
- [x] `npm run check:utf8`
- [x] `cmd /c npm run test -- src/hooks/__tests__/useEffectiveRole.test.tsx src/pages/Community/lib/__tests__/roleState.test.ts`（12 passed）
- [x] `npm run typecheck`
- [x] `npm run gate`

---

### #8b 社區牆互動本地化

**目標**：發文/留言本地化 + LockedOverlay/BottomCTA 引導

**依賴**：#8a、#14b、#15

**修改**：
| 檔案 | 改動 |
|------|------|
| `PostsSection.tsx` | 移除 `disabled={!isLoggedIn}` → `useModeAwareAction` |
| `BottomCTA.tsx` | `auth.html` → `getAuthUrl()` |
| LockedOverlay | CTA 改 `onCtaClick` 由父組件注入 |

**驗收**：
- `rg "auth\\.html" src/pages/Community/` → 0 筆
- `npm run gate` 通過

---

### #9 移除靜態 HTML mock 頁

**目標**：清理靜態 HTML 殘留

**依賴**：#2、#6b

**移除**：
- `public/community-wall_mvp.html`
- `public/maihouses/community-wall_mvp.html`
- `public/feed-agent.html`
- `public/feed-consumer.html`

**修改**：`vercel.json`（同步 rewrite + 新增 301 `/feed/demo-:id` → `/feed/demo`）

**驗收**：
- 上述 4 檔不存在
- `npm run gate` 通過

---

### #10a `DemoBadge.tsx` 浮動標籤

**目標**：演示模式右下角「演示模式」浮動標籤 + 退出按鈕

**依賴**：#1a

**新增**：`src/components/DemoGate/DemoBadge.tsx`

**修改**：`App.tsx`（根據 `mode === 'demo'` 條件渲染）

**手機版定位**：`bottom-[calc(80px+env(safe-area-inset-bottom,20px))]`（避免遮擋 Feed MobileActionBar）

**驗收**：
- demo 模式看到浮動標籤，visitor/live 不顯示
- UI 設計需 `/ui-ux-pro-max`
- `npm run gate` 通過

---

### #10b `exitDemoMode()` 退出清理

**目標**：退出時完整清理所有殘留（含跨分頁）

**依賴**：#10a

**清理順序**（防 Race Condition）：

```typescript
function exitDemoMode(queryClient: QueryClient) {
  clearDemoMode()                                    // 1. localStorage
  try { localStorage.removeItem('mai-uag-mode') } catch {}
  try { sessionStorage.removeItem('feed-demo-role') } catch {}
  queryClient.clear()                                // 2. React Query cache
  window.location.replace('/')                       // 3. 跳首頁
}
```

**跨分頁處理**：storage event handler 中也需呼叫 `queryClient.clear()` 再 reload，否則非觸發分頁的 cache 殘留。

**多分頁競態**：分頁 A 到期 → `handleDemoExpire` → 清 localStorage → 分頁 B 的 storage event 收到刪除 → 但 B 可能正在 API 呼叫中。`handleDemoExpire` 需先檢查 `mode === 'demo'` 再清理，避免已登入分頁被誤清。

**iOS reload 延遲**：`location.reload()` 在 iOS Safari 有 500ms+ 延遲，期間 React Query `onError` 可能對已清空 cache 觸發 visitor API 呼叫。reload 前先設 `window.__DEMO_EXPIRING = true` flag 或改用 `location.replace('/')` 避免返回鍵回到失效頁。

**登入清理**：`usePageMode` 的 `clearDemoMode()` 需同步 `queryClient.clear()`。

**驗收**：退出後 localStorage/sessionStorage 無殘留、多分頁場景 cache 乾淨

---

### #11 Feed 產品定位確認

**目標**：決定 Feed 是「登入後首頁」還是「獨立社群功能」

**依賴**：無（待產品決策）

**驗收**：產出 Feed 定位文件，後續工單依此展開

---

### #12 首頁 Header 三模式 UI

**目標**：Header 根據 `usePageMode()` + `useAuth()` 顯示對應 UI，取代目前的固定登入/註冊按鈕

**依賴**：#1a

**修改**：
- `src/components/Header/Header.tsx`
- `src/components/Header/GlobalHeader.tsx`

**三模式行為**：

| mode | Header 行為 |
|------|-----------|
| visitor | 登入/註冊按鈕（現有行為，保持不變）|
| demo | 隱藏登入/註冊，顯示退出演示按鈕 |
| live | 顯示使用者頭像/帳號 + 下拉選單（個人檔案、登出）|

**施工重點**：
- 本工單**不改社區評價導航**（社區評價按鈕仍維持 `SEED_COMMUNITY_ID`，待 #12b 處理）
- `useAuth()` loading 期間防 FOUC：先隱藏登入/註冊區塊，loading 結束再渲染
- UI 設計需 `/ui-ux-pro-max`

**驗收**：
- visitor：看到登入 + 註冊按鈕
- demo：看到退出演示按鈕，無登入/註冊
- live：看到頭像/帳號下拉，可登出
- `npm run gate` 通過

---

### #12b Header 社區導航分層

**目標**：「社區評價」按鈕根據使用者狀態導向正確目的地，取代 hardcode `SEED_COMMUNITY_ID`

**依賴**：#12、#8d（探索頁須先存在）

**背景**：`Header.tsx:389`（手機選單）和 `Header.tsx:506`（Hero 膠囊）兩處寫死 `ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)`，不論使用者身份一律導向 mock 社區。

**新增**：
1. `src/hooks/useUserCommunity.ts`
   - 已登入 → React Query `GET /api/community/my` 取得使用者所屬社區 ID
   - 未登入 → 回傳 `null`
   - staleTime 5 分鐘
2. `api/community/my.ts`
   - 驗證 JWT → 查詢 `community_members WHERE user_id = ?`
   - 回傳使用者所屬社區 ID（取最近加入的）
   - 未登入回 401，無歸屬回 `{ data: null }`

**修改**：
- `src/components/Header/Header.tsx` — 手機選單（L389）+ Hero 膠囊（L506）兩處都要改
- `src/components/Header/GlobalHeader.tsx` — 同步修正

**導航規則**：

| 使用者狀態 | 導向 |
|-----------|------|
| demo 模式 | `ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)` |
| 已登入 + 有社區歸屬 | `ROUTES.COMMUNITY_WALL(userCommunityId)` |
| 已登入 + 無社區歸屬 | `ROUTES.COMMUNITY_EXPLORE` |
| visitor（未登入） | `ROUTES.COMMUNITY_EXPLORE` |

**施工備註**：
- Hero 膠囊目前用 `<a href>`（靜態），需改為 `<button onClick>` + `useNavigate` 以配合非同步 hook
- `useUserCommunity` loading 期間點擊：fallback 導向探索頁（安全），**不可導向 SEED_COMMUNITY_ID**

**驗收**：
- `rg "SEED_COMMUNITY_ID" src/components/Header/` → 僅在 `mode === 'demo'` 分支內出現
- visitor 點擊 → 社區探索頁
- 已登入無歸屬 → 社區探索頁
- 已登入有歸屬 → 對應社區牆
- demo → seed 社區（不變）
- API loading 期間點擊 → 不導向 test-uuid
- `npm run gate` 通過

---

### #13 PropertyListPage Header 統一

**目標**：`LegacyHeader` → 統一 `<Header />`

**依賴**：#12

**修改**：`src/pages/PropertyListPage.tsx`（L75-104）

**驗收**：
- PropertyListPage 使用統一 `<Header />`，自動繼承三模式行為
- `npm run gate` 通過

---

### #14a ✅ Toast action button 確認

**已完成** 2026-02-12

修改：`src/lib/notify.ts`（`NotifyOptions` 新增 `action` 欄位）
測試：`src/lib/__tests__/notify.test.ts`（2 tests passed）

---

### #14b `useRegisterGuide()` hook

**目標**：統一全站「引導註冊」toast

**依賴**：#14a、#15

**新增**：`src/hooks/useRegisterGuide.ts`

```typescript
function useRegisterGuide() {
  const location = useLocation()
  return {
    showGuide: ({ message, returnPath }: { message: string; returnPath?: string }) => {
      toast({
        message,
        action: {
          label: '免費註冊',
          onClick: () => {
            window.location.href = getAuthUrl('signup',
              returnPath ?? `${location.pathname}${location.search}${location.hash}`)
          }
        },
        duration: 5000
      })
    }
  }
}
```

**8 個場景**：

| # | 場景 | 文案 | 位置 | 歸屬 |
|---|------|------|------|------|
| 1 | 按讚（詳情頁）| 註冊後即可鼓勵評價 | `CommunityReviews.tsx:250` | #3 |
| 2 | 按讚（社區牆）| 註冊後即可鼓勵評價 | `Wall.tsx:241` | #8a |
| 3 | 留言（社區牆）| 註冊後即可參與討論 | `PostsSection.tsx:279` | #8b |
| 4 | 留言（Feed）| 註冊後即可參與討論 | `FeedPostCard.tsx:110` | #6b |
| 5 | LockedOverlay | 註冊解鎖完整社區評價 | `CommunityReviews.tsx:358` | #3 |
| 6 | 發文（Feed）| 註冊後即可發表動態 | Feed 發文按鈕 | #6b |
| 7 | BottomCTA | 免費註冊查看完整社區 | `BottomCTA.tsx:32` | #8b |
| 8 | Feed 私密牆 | 註冊後查看私密動態 | `PrivateWallLocked.tsx:23` | #6a |

現有多處 toast「請先登入」無 action button → 施工時全部改用 `useRegisterGuide()`。

**手機版觸控目標**：Sonner action button 預設高度約 28px，不符 Apple HIG 44px 最小觸控目標。`notify` 的 `mapOptions` 需覆寫 action button className 加 `min-h-[44px] min-w-[44px]`。手機版 toast position 改 `top-center`（避免虛擬鍵盤遮擋底部 toast）。

**驗收**：8 個場景全部接入、所有跳轉帶 `?return=`

---

### #15 ✅ `getAuthUrl()` 工具函數

**已完成** 2026-02-12

新增：`src/lib/authUtils.ts`（`getAuthUrl` / `getLoginUrl` / `getSignupUrl` / `navigateToAuth` / `getCurrentPath` / `normalizeReturnPath`）
修改：`TrustManager.tsx`、`GlobalHeader.tsx`、`CommunityReviews.tsx`、`Chat/index.tsx`、`BottomCTA.tsx`、`PropertyListPage.tsx`、`Header.tsx`、`LoginPrompt.tsx`、`PrivateWallLocked.tsx`、`Wall.tsx`、`PropertyUploadPage.tsx`、`WallErrorBoundary.tsx`（共 12 檔）

**規則**：禁止 `navigate()` 導向 `auth.html`，統一 `window.location.href = getAuthUrl(...)`

<details><summary>施工紀錄（3 輪收斂）</summary>

**Round 1**：核心 authUtils 建立 + 7 檔改用 getAuthUrl
**Round 2（補強）**：`normalizeReturnPath()` 防不安全路徑、Header 4 處硬編碼改 getLoginUrl/getSignupUrl、LoginPrompt/PrivateWallLocked/Wall 統一
**Round 3（尾差）**：PropertyUploadPage + WallErrorBoundary 的 `/auth` 入口收斂、GlobalHeader returnPath 改 `getCurrentPath()`

驗證：`rg "navigate.*auth\\.html" src/` → 0 筆 ✅ · 27 tests ✅ · `npm run gate` ✅
</details>

---

### #16 全站 UTF-8/文案健康檢查

**目標**：清除亂碼/非預期 Unicode/emoji 混用，建立 CI 檢查

**依賴**：無

**驗收**：
- `npm run check:utf8` 通過
- CI 加入 UTF-8 lint 步驟
- `npm run gate` 通過

---

### #17 ✅ `src/lib/error.ts` 統一錯誤處理

**已完成** 2026-02-12

新增：`src/lib/error.ts`（`getErrorMessage` / `getErrorInfo` / `safeAsync` / `safeSync`）
測試：`src/lib/__tests__/error.test.ts`（17 tests passed）

---

### #18 ✅ 3 檔 catch 改用 `getErrorMessage()`

**已完成** 2026-02-13

修改：`config.ts`、`uag/track.ts`、`MaiMaiContext.tsx`（共 3 檔）
核心：所有 catch 統一 `getErrorMessage()` + 繁中日誌、移除空 catch、補 API 邊界測試

驗證：13 tests ✅ · `npm run gate` ✅

---

### #19 ✅ 砍舊路徑 `/api/uag-track`

**已完成** 2026-02-12

修改：`public/js/tracker.js`、`src/hooks/usePropertyTracker.ts`
移除：`api/uag-track.js`

---

### #20 ✅ 整合分散 Mock Data

**已完成** 2026-02-15

新增：`deepFreeze.ts`、`src/constants/mock/`（community / agentReviews / chatProperty / index）
修改：4 個消費端改讀集中 mock、`seed.ts`/`strings.ts`/`communities.ts` 收斂 SEED_COMMUNITY_ID、6 個 mock 檔案加 `deepFreeze`（共 19 檔）

<details><summary>施工紀錄（2 輪收斂）</summary>

**Round 1**：建立集中 mock 模組 + 消費端切換 + seed/mock 全數 deepFreeze
**Round 2（strict-audit）**：deepFreeze 移除 `as` 斷言改 type guard、mock 移除 `.default!`、useCommunityReviews 移除多餘淺拷貝、Community mockData 工廠改 deepFreeze
**Round 3（strict-audit）**：新增 `MOCK_AGENT_PROFILE_ME` 作為 UAG Profile mock 單一來源、`mockProfile.ts` 改 re-export 避免重複定義漂移、Community mock factory id 改 `createMockEntityId()` 降低同毫秒碰撞風險

驗證：20 tests ✅ · `npm run typecheck` ✅
</details>

---

### #21 全站 `console.log` → `logger`

**目標**：所有 `console.log` 改用 `src/lib/logger.ts`

**依賴**：#17、#18

**驗收**：
- `rg "console\\.log" src/ --type ts --type tsx` → 0 筆
- `npm run gate` 通過

---

### #22 Tailwind classnames 排序

**目標**：統一 Tailwind class 排序（2 檔）

**驗收**：`npm run gate` 通過

---

### #23 React Hook 依賴陣列優化

**目標**：修正 ESLint exhaustive-deps 警告（1 檔）

**驗收**：`npm run gate` 通過

---

### #24 Chat 三模式

**目標**：Chat 接入 `usePageMode()`

**依賴**：#1a

**修改**：`src/pages/Chat/index.tsx`

| mode | 行為 |
|------|------|
| visitor | 顯示登入提示 |
| demo | 本地化聊天（React state）|
| live | 現有邏輯 |

**驗收**：
- `rg "usePageMode" src/pages/Chat/` → 有結果
- `npm run gate` 通過

---

### #25 Assure 三模式

**目標**：`isMock` → `usePageMode()`

**依賴**：#1a

**修改**：`src/pages/Assure/Detail.tsx`

**驗收**：
- `rg "isMock" src/pages/Assure/` → 0 筆
- `npm run gate` 通過

---

### #26 登出完整清理

**目標**：統一 `cleanupAuthState()` + `onAuthStateChange` 防禦

**依賴**：#12、#10b

**新增位置**：`src/lib/authUtils.ts`（與 #15 同檔）

```typescript
const AUTH_CLEANUP_KEYS = [
  'mh.auth.pending_role', 'uag_session', 'uag_session_created',
  'uag_last_aid', 'mai-uag-mode', 'mai-demo-verified', 'maimai-mood-v1',
] as const

function cleanupAuthState(queryClient: QueryClient) {
  queryClient.clear()
  AUTH_CLEANUP_KEYS.forEach(k => { try { localStorage.removeItem(k) } catch {} })
  try { sessionStorage.removeItem('feed-demo-role') } catch {}
}
```

GlobalHeader + UAG 的 `handleSignOut` 統一呼叫。
App.tsx 加 `onAuthStateChange('SIGNED_IN')` → `queryClient.clear()`。

---

### #27 UAG 新房仲空狀態

**目標**：新 agent 進 UAG 看到 MaiMai 引導而非空白頁

**依賴**：#5a

**新增**：`src/pages/UAG/components/UAGEmptyState.tsx`

UI 設計需 `/ui-ux-pro-max`。

### #28 已完成工單防禦強化

**目標**：收緊 #1a/#14a/#15/#18 已完成工單的型別安全與防禦邏輯

**依賴**：無（獨立修復）

| 檔案 | 改動 |
|------|------|
| `src/context/MaiMaiContext.tsx` | `JSON.parse` 改 Zod `safeParse` 驗證 |
| `src/app/config.ts` | `fetchJson` 消除 implicit any + `window.location` SSR 安全 |
| `api/uag/track.ts` | 移除冗餘 `getErrorMessage(err)` 傳參 |
| `src/lib/__tests__/authUtils.test.ts` | `Reflect.apply` 改明確型別轉換 |
| `src/lib/__tests__/notify.test.ts` | 測試描述改繁中 |

**驗收**：`npm run gate` 通過、相關測試通過

---

### #29 跨裝置三模式驗證修復

**目標**：修復 iOS Safari / 手機版 / 私隱模式下三模式運作的 18 項問題

**依賴**：#1a、#10b、#14b

**分類**：

#### P0 — 功能不可用

| # | 檔案 | 行號 | 問題 | 修復 | 狀態 |
|---|------|------|------|------|------|
| 1 | `src/lib/safeStorage.ts` | 47-49 | iOS 私隱模式探測寫入通過但後續 `setItem` 配額超限靜默失敗 | 探測改 64 字元回讀驗證 + `setDemoMode` 回傳 boolean | ✅ |
| 2 | `src/hooks/useDemoTimer.ts` | 45 | `\|\|` 邏輯錯誤：remaining 30s~5min 立即觸發 warn | 改為 `&&` | ✅ |
| 3 | `src/hooks/useDemoTimer.ts` | 54-58 | iOS 背景分頁 `setTimeout` 暫停，到期不觸發 | 加 `visibilitychange` 補償 | ✅ |
| 4 | `src/hooks/usePageMode.ts` | 29-35 | iOS `StorageEvent` 背景回前景不觸發 | 透過 `subscribeDemoModeStorageSync` 的 `visibilitychange` 補償 | ✅ |

#### P1 — 體驗降級

| # | 檔案 | 行號 | 問題 | 修復 | 狀態 |
|---|------|------|------|------|------|
| 5 | `src/lib/pageMode.ts` | 73-98 | `subscribeDemoModeStorageSync` iOS 可能漏觸發 | 加 `visibilitychange` 回前景主動 `onSync()` | ✅ |
| 6 | `src/lib/authUtils.ts` | 105-108 | `origin` 在 iOS WebView 回傳 `"null"` 字串 | `!origin \|\| origin === 'null'` | ✅ |
| 7 | `src/app/config.ts` | 74 | 同上 `origin` 問題 | SSR guard + `origin === 'null'` fallback | ✅ |
| 8 | `LegacyPropertyPage.css` | 60 | `100vh` iOS 包含 URL bar | 改 `100dvh` | |
| 9 | `UAG-deai-v2.module.css` | 105 | 同上 | 改 `100dvh` | |
| 10 | `UIUXDemo.module.css` | 11 | 同上 | 改 `100dvh` | |
| 11 | `src/pages/UAG/Profile/index.tsx` | 114 | `env(safe-area-inset-bottom)` 無 fallback | 加 fallback `20px` | |
| 12 | `src/lib/notify.ts` | `mapOptions` | Sonner action button 預設 28px 不符 Apple HIG 44px | `actionButtonStyle: { minHeight: 44, minWidth: 44 }` | ✅ |

#### P2 — 歷史觀察（已歸入各對應工單，#29 不再追蹤）

> 以下項目在 #29 審計時發現，已分別歸入對應工單處理。#13 在 #2 修復 ✅、#14/#16 在 #3 修復 ✅、#17 歸 #8a、#18 歸 #5b ✅。

**剩餘施工項**（P1 #8-11，歸 Wave 4B）：
- `LegacyPropertyPage.css:60` / `UAG-deai-v2.module.css:105` / `UIUXDemo.module.css:11` — `100vh` → `100dvh`
- `UAG/Profile/index.tsx:114` — `env(safe-area-inset-bottom)` 加 fallback `20px`

<details><summary>施工紀錄 2026-02-13（P0 + P1 部分，共 8 項）</summary>

修改：`safeStorage.ts`（64 字元回讀驗證）、`pageMode.ts`（setDemoMode 回傳 boolean + visibilitychange）、`useDemoTimer.ts`（`||`→`&&` + visibilitychange）、`authUtils.ts`（`origin === 'null'`）、`config.ts`（SSR guard）、`notify.ts`（actionButton 44px）

驗證：`npm run gate` ✅ · notify 13 tests ✅ · authUtils 27 tests ✅ · pageMode 13 tests ✅ · useDemoTimer 3 tests ✅
</details>

**驗收**：
- iOS Safari 私隱模式：DemoGate 正確進入演示
- iOS 背景分頁回前景：`useDemoTimer` 補償觸發
- 跨分頁同步：分頁 A 退出 → 分頁 B 即時反應
- `rg "100vh" src/ --glob "*.css" --glob "*.module.css"` → 0 筆
- `env(safe-area-inset-bottom)` 全部有 fallback

---

### #8c 社區列表 API

**目標**：提供公開社區清單，作為社區探索頁的資料來源

**依賴**：無

**新增**：`api/community/list.ts`

**規格**：
- `GET /api/community/list`
- 查詢參數：`offset`（預設 0）、`limit`（預設 20）
- 查詢 `communities` 表，回傳有公開內容的社區
- 回傳欄位：`id`, `name`, `address`, `image`, `post_count`, `review_count`
- Zod schema 驗證回傳格式
- 無內容時回傳空陣列（非 404）

**驗收**：
- API 回傳正確 JSON，Zod 驗證通過
- `npm run gate` 通過
- 新增 API 測試

---

### #8d 社區探索頁

**目標**：visitor 和無社區歸屬的已登入會員的社區牆著陸頁

**依賴**：#8c

**背景**：Header「社區評價」按鈕目前 hardcode 導向 `SEED_COMMUNITY_ID`（test-uuid），所有使用者看到同一個 mock 社區。visitor 和已登入無歸屬會員不應被丟進假資料社區，應有「社區探索」頁面供選擇。

**新增**：
- `src/pages/Community/Explore.tsx` — 社區探索頁
- `src/constants/routes.ts` — 新增 `COMMUNITY_EXPLORE: '/maihouses/community'`
- `src/App.tsx` — 新增 `<Route path="/community" element={<Explore />} />`

**UI 規格**（需 `/ui-ux-pro-max`）：
- 使用 `<GlobalHeader />`（mode 由 `usePageMode()` 自動判定，不需傳 prop）
- 呼叫 `GET /api/community/list` 取得社區清單
- 社區卡片列表（名稱 + 地址 + 評價數 + 貼文數）
- 點擊卡片 → 導向 `/community/{id}/wall`
- 空狀態：「目前暫無社區資料」
- 響應式：320px / 768px / 1024px / 1440px
- 觸控目標 ≥ 44px

**驗收**：
- 頁面可正常載入並顯示社區列表
- 點擊卡片正確導向對應社區牆
- `npm run gate` 通過

---

### #30 房產聚合頁重構（共用上下文）

**參考截圖**：
- `C:\Users\陳世瑜\Downloads\www.realestate.com.au_buy_in-nsw_list-1.png`（Premier 大卡 + 標準卡片混排）
- `C:\Users\陳世瑜\Downloads\www.realestate.com.au_buy_in-nsw_list-1 (1).png`（列表模式 + 房仲頭像右上角）

**商業考量**：三層卡片呈現（大/小/表列）未來對應廣告費分級

**修改**：

| 檔案 | 動作 |
|------|------|
| `docs/property.html` | 完整重寫（唯一目標）|

**realestate.com.au 特色 → MaiHouses 改造對照**：

| 原站特色 | 我們怎麼用 |
|---------|-----------|
| 房仲圓形頭像（右上角，建立信任）| L 大卡(56px) + M 小卡(40px) 都放房仲圓形照片 |
| 極簡白底 + 單一品牌色（紅）| 白底 + `#00385a` 深藍強調，文字 `#0a2246` / `#526070` |
| 卡片用底線分隔（非陰影）| `border-bottom: 1px solid #E6EDF7` |
| 圖片佔 50%+ 面積（16:10）| `aspect-ratio: 16/10; object-fit: cover` |
| specs icon 化（bed/bath/car）| 坪數/房/衛/樓層用 SVG icon + 數字 |
| 篩選 pills 水平排列 | 快捷標籤：3房以內 / 30坪以下 / 近捷運 / 新成屋 |
| Premier 大卡 vs 普通小卡分層 | 三層：大卡(L) + 小卡(M) + 表列(S) |
| 固定搜尋列 sticky top | Header + 搜尋框 sticky |
| 價格最醒目 | 28px bold `#00385a`，卡片最上方 |
| 愛心收藏按鈕（圖片右上） | L/M 卡圖片右上愛心 icon，visitor 點擊→引導註冊 |
| "Premier" 文字 badge（圖片左上）| L 大卡圖片左上 `Premier` 品牌 badge |
| 搜尋結果數量（列表上方） | 列表標題旁「共 248 筆」 |
| Pagination / Load more | 列表底部「查看更多房源」按鈕 |
| 房仲公司名（頭像下方） | 頭像下方：姓名 + 「公司名 · 頭銜」 |

**品牌色彩（已驗證 index.css）**：

```css
--brand: #00385a;
--brand-600: #004E7C;
--brand-500: #005282;
--brand-light: #009FE8;
--text-primary: #0A2246;
--text-secondary: #526070;
--bg-page: #EEF2F7;
--bg-base: #F6F9FF;
--border: #E6EDF7;
--star-color: #FBB424;
--font-brand: 'Noto Serif TC', Georgia, "Times New Roman", serif;
--font-body: "Noto Sans TC", system-ui, sans-serif;
```

**按鈕層次**：

| 層級 | 樣式 |
|------|------|
| Primary | `bg: #00385a; color: white; border-radius: 999px; hover: #004E7C` |
| Secondary | `bg: white; color: #00385a; border: 2px solid #00385a; hover: bg #F6F9FF` |
| Ghost | `bg: transparent; color: #00385a; hover: underline` |
| Pill/Tag | `border: 1px solid #E6EDF7; border-radius: 999px; hover: border-color #00385a` |

---

### #30a HTML 結構 + CSS Design System

**目標**：建立 6 區塊 HTML 骨架 + 三層卡片 CSS + 品牌色 + 響應式，不含 MaiMai SVG 和 JS 渲染

**依賴**：無（獨立靜態 HTML）

**三層卡片規格**：

| 層級 | 名稱 | 商業 | 視覺規格 |
|------|------|------|---------|
| **L** | Premier 推廣 | 付費最高曝光 | 全寬大圖(16:10) + `Premier` badge 左上 + 愛心收藏右上 + 房仲圓形頭像右上角(56px白邊框+陰影) + 房仲姓名/公司名/頭銜 + 2 則評價 + 註冊看更多 + 品牌色左邊框 4px |
| **M** | 標準展示 | 標準刊登 | 桌面水平(圖左文右)、手機圖上文下 + 愛心收藏 + 房仲圓形頭像(40px) + 房仲姓名/公司名 + 2 則評價 + 註冊看更多 + 評分星星（`--star-color: #FBB424`） |
| **S** | 精簡列表 | 免費/基本 | 單行：60px 縮圖 + 標題 + 價格 + specs icon。無評價無房仲頭像 |

**頁面結構（6 區塊）**：

#### 1. Sticky Header

```
高度: 56px (手機 48px)
背景: white + border-bottom: 1px solid #E6EDF7
z-index: 100
body padding-top: 56px (手機 48px)，防內容被 header 遮蔽（ux-guidelines #2 Sticky Navigation）
```

- Skip link: `<a class="skip-link" href="#main">跳至主要內容</a>`（視覺隱藏，`:focus` 時顯示）
- Logo: 42x42px 深藍漸層方形 + 白色房子 SVG +「邁房子」+ slogan（桌面顯示）
- 導航:「精選社區」「房源列表」（桌面）
- 右側: 搜尋 icon +「登入」ghost +「免費註冊」primary 按鈕

Logo 精確規格（對齊 `src/components/Logo/Logo.tsx`）:
- 圖標: `border-radius: 12px`, `background: linear-gradient(to bottom right, #00385a, #004E7C)`
- SVG: `viewBox="0 0 24 24"` stroke="white" strokeWidth="2.5"
  - 房子: `M3 9.5L12 3L21 9.5V20.5C21 21.0523 20.5523 21.5 20 21.5H4C3.44772 21.5 3 21.0523 3 20.5V9.5Z`
  - 門: `M9 21.5V13H15V21.5`
- 紅點: 6x6px `#f87171`（對齊 Logo.tsx `bg-red-400`）右上角，`box-shadow: 0 0 0 1.5px #004E7C`
- 文字: `font-family: 'Noto Serif TC', Georgia, serif; font-size: 24px; font-weight: bold; color: #00385a`
- Slogan: `15px; font-weight: 700; letter-spacing: 0.15em; color: #005282`

#### 2. Hero 搜尋區

```
背景: linear-gradient(180deg, #F6F9FF 0%, #E6EDF7 100%)
padding: 64px 0 48px (手機 40px 0 24px)
```

布局: 桌面左文字右 MaiMai (60/40)。手機單欄，MaiMai 80px 居中在搜尋上方。

文案:
- 大標:「找到你的理想鄰居，再決定買哪間」32px bold (手機 22px)
- 副標:「2,847 位真實住戶的匿名評價」15px `#526070`（數字部分由 #30b 加 count-up 動畫）

搜尋框:
- 容器: `bg: rgba(255,255,255,0.85); backdrop-filter: blur(24px); border-radius: 16px; border: 1px solid #E6EDF7`
- 輸入: 56px 高，focus `border-color: #00385a`，`font-size: 16px`（防 iOS 自動縮放），`aria-label="搜尋社區或地址"`
- 搜尋按鈕: 44x44px 圓形 `#00385a`，白色搜尋 SVG
- 快捷 pills:「3房以內」「30坪以下」「近捷運」「新成屋」水平可捲動，`gap: 8px`

MaiMai placeholder: 預留 `<div class="hero-maimai">` 容器，SVG 由 #30b 填入。

#### 3. 精選推薦區（2 張 L 大卡）

標題:「口碑精選」20px bold + 副標「住戶評價最高的房源」14px

L 大卡結構:
```
┌────────────────────────────────────────┐
│ [圖片 16:10 全寬]                         │
│ badge: "Premier"左上      ♡ 愛心右上     │
│                               ┌────────┐ │
│ 左下: 圖片數量 "1/8"          │ ○ 房仲  │ │  ← 56px, 白邊框3px + 陰影
│                               │ 照片   │ │
│                               │ 王大明  │ │  ← 姓名 12px bold
│                               │信義房屋 │ │  ← 公司 12px #526070
│                               │ 經紀人  │ │  ← 頭銜 12px #526070
│                               └────────┘ │
├────────────────────────────────────────┤
│ 1,288 萬                    ★ 4.8 (15則) │  ← 價格左 + 評分右（星 #FBB424）
│ 新板特區｜三房雙衛，捷運步行3分鐘          │
│ 新北市板橋區 · 中山路一段                  │
│ 🛏3  🛁2  📐34.2坪  🏢高樓層              │  ← SVG icon 化
│ ─────────────────────────────────────── │
│ 「管委反應快，公設打理乾淨。」             │  ← 評價 1 blockquote, line-height: 1.6（ux-guidelines #72）
│  — 王小姐, 3年住戶                        │
│ 「坡道寬、指示清楚，不太需要繞圈找位。」   │  ← 評價 2 blockquote
│  — 林先生, 屋主                           │
│ 🔒 註冊看更多評價                         │  ← 統一鎖定提示 + 登入解鎖
│ 左邊框 4px solid #00385a                  │  ← 品牌色識別為 Premier
└────────────────────────────────────────┘
```

房仲圓形頭像規格（L 大卡）:
- 尺寸: 56px 圓形（手機 48px）
- 邊框: `border: 3px solid white; box-shadow: 0 2px 8px rgba(0,56,90,0.15)`
- 位置: 圖片區域右上角，`position: absolute; top: 12px; right: 12px`
- 下方文字: 姓名 12px bold `#0A2246` + 公司名 12px `#526070` + 頭銜 12px `#526070`，居中對齊
- Mock 照片: `https://i.pravatar.cc/112?img=N`

L/M 卡圖片底部 scrim: `linear-gradient(transparent 60%, rgba(0,0,0,0.3))`，確保 `1/8` 數量文字在淺色照片上可讀（ux-guidelines #36 Color Contrast）

L/M 卡稀缺性標籤: 圖片左下角 `position: absolute; bottom: 8px; left: 8px`，`padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; color: white`。底色依類型：`剛上架` `#16A34A`（綠）、`熱門關注` `#EA580C`（橘）、`本週新增` `#2563EB`（藍）、`多人收藏` `#9333EA`（紫）。對比均 ≥ 4.5:1（styles #21 urgency + ux-guidelines #36 contrast）

愛心收藏按鈕:
- 位置: 圖片右上角 `top: 12px; right: 80px`（L 卡避開房仲頭像），M 卡 `top: 8px; right: 8px`
- 尺寸: 36x36px 圓形白色半透明背景 `rgba(255,255,255,0.9)`
- Icon: 空心愛心 SVG 20x20，hover 填充 `#E63946`
- 觸控: min 44px hit area

桌面: 2 欄並排，gap 24px。手機: 單欄堆疊。

L/M 卡 hover: `box-shadow: 0 4px 16px rgba(0,56,90,0.12); transition: box-shadow 200ms ease`（html-tailwind #38 Card hover states）

L/M 卡防禦性截斷: 標題 `-webkit-line-clamp: 2`、地址 `text-overflow: ellipsis` 單行、缺圖 fallback `background: #E6EDF7` + 房子 SVG 佔位（html-tailwind #19 Text truncation）

#### 4. 房源列表區（M 小卡 × 6 + S 表列 × 3）

標題:「更多房源」20px bold +「共 248 筆」14px `#526070`
切換: 右側小 icon 切換卡片/表列模式（grid icon + list icon）

M 小卡結構（桌面水平排列）:
```
┌──────────┬──────────────────────────────┐
│ [圖片]    │ 1,052 萬    ★ 4.6    ○ 房仲 │  ← 40px 圓形房仲頭像
│ 180x130  │ 民生社區｜邊間大兩房    陳經紀  │
│ 16:10    │ 永慶房屋 · 經紀人             │  ← 公司名 + 頭銜
│  ♡ 愛心  │ 台北市松山區                  │
│          │ 🛏2  🛁2  📐28.6坪            │
│          │ ──────────────────────────── │
│          │ 「鄰里友善，社區群組活躍」     │  ← 評價 1
│          │  — 陳太太, 5年住戶             │
│          │ 「走路3分鐘有超市，買菜方便」   │  ← 評價 2
│          │  — 賴先生, 上班族              │
│          │ 🔒 註冊看更多評價              │  ← 統一鎖定提示
└──────────┴──────────────────────────────┘
  border-bottom: 1px solid #E6EDF7（分隔線代替陰影）
```

M 卡房仲頭像規格:
- 尺寸: 40px 圓形（手機 36px）
- 邊框: `border: 2px solid white; box-shadow: 0 1px 4px rgba(0,56,90,0.12)`
- 位置: 文字區右上角

桌面: 單欄列表（像 realestate.com.au 一樣）。手機: 圖上文下堆疊。

#### 4.5 模式中斷區塊（M 卡第 3~4 張之間插入）

插入位置: M 卡 #5（東湖站旁）與 #6（橋和站旁）之間，打斷 6 張 M 卡的視覺疲勞（Von Restorff 效應）

```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📖 買房前必看    │ ⭐ 如何讀懂      │ 🏠 房仲選擇      │
│  3 件事         │  社區評價        │  指南            │
│ 1行描述文字      │ 1行描述文字      │ 1行描述文字      │
│ 了解更多 →      │ 了解更多 →      │ 了解更多 →      │
└─────────────────┴─────────────────┴─────────────────┘
```

- 布局: 桌面 3 欄 `grid-template-columns: repeat(3, 1fr); gap: 16px`，手機單欄堆疊
- 背景: `#F6F9FF`（與 Hero 同色系），`border-radius: 16px; padding: 24px`
- 圖示: SVG icon 24x24 `#00385a`，標題 16px bold，描述 14px `#526070`
- 連結: `了解更多 →` 14px `#00385a` bold，hover `#004E7C`（`#` placeholder）
- 觸控: 每欄可點擊，min 44px 高（html-tailwind #34）

S 表列結構:
```
┌───┬─────────────────────────────────────┐
│ □ │ 七張站旁｜電梯兩房  22.1坪 2房  838萬 │  ← 60px 縮圖 + 單行
└───┴─────────────────────────────────────┘
```

列表底部:「查看更多房源」Secondary 按鈕，居中

#### 5. CTA 區（MaiMai celebrate）

```
背景: linear-gradient(135deg, #00385a 0%, #004E7C 50%, #005282 100%)
border-radius: 24px; padding: 48px 32px; margin: 0 16px
```

- 布局: 左 MaiMai celebrate + 右文案（手機上下排列居中）
- MaiMai placeholder: `<div class="cta-maimai">`，SVG 由 #30b 填入
- 標題:「加入邁房子，解鎖所有評價」28px bold 白色
- CTA:「免費註冊」白色背景 + brand 文字，48px 高圓角

#### 6. Footer

```
背景: #00385a; padding: 48px 0 32px; color: white
padding-bottom: calc(32px + env(safe-area-inset-bottom, 0px))
```

- Logo 白色版 + 導航連結 + © 2026

**Heading Hierarchy**：

| 區塊 | 標籤 | 內容 |
|------|------|------|
| Hero 大標 | `<h1>` | 找到你的理想鄰居，再決定買哪間 |
| 口碑精選 | `<h2>` | 口碑精選 |
| 更多房源 | `<h2>` | 更多房源 |
| CTA | `<h2>` | 加入邁房子，解鎖所有評價 |

**響應式（iOS 優先）**：

| 斷點 | 布局重點 |
|------|---------|
| < 768px (iOS) | 單欄。搜尋全寬。卡片圖上文下。MaiMai 80px 不隱藏。觸控 ≥ 44px。`env(safe-area-inset-bottom)` 處理 Home Indicator。`-webkit-overflow-scrolling: touch` |
| 768-1024px | 精選 2 欄，列表單欄 |
| ≥ 1024px | 完整設計。精選 2 欄。列表水平卡片 |

**iOS 特別處理**：
- `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`
- `-webkit-tap-highlight-color: transparent`
- `padding-bottom: env(safe-area-inset-bottom)`（footer）
- scroll pills: `-webkit-overflow-scrolling: touch`
- 搜尋框: `font-size: 16px`（防止 iOS 自動縮放）
- 圖片: `srcset` + `sizes` 響應式（html-tailwind #15）

**驗收**：
- [ ] 6 區塊 HTML 結構完整，語意標籤 header/nav/main/section/article/footer
- [ ] 品牌色 CSS 變數與 `src/index.css` 一致（含 `--star-color: #FBB424`）
- [ ] Logo: 42x42 深藍漸層 + `'Noto Serif TC'` serif + 紅點 `#f87171`
- [ ] 三層卡片 CSS 差異明確（L 左邊框 + Premier badge / M 水平 / S 單行）
- [ ] L/M 卡房仲圓形頭像 + 姓名/公司名/頭銜
- [ ] L/M 卡愛心收藏按鈕
- [ ] 列表標題顯示結果數量
- [ ] 列表底部「查看更多房源」按鈕
- [ ] DevTools 測 375(iPhone) / 768 / 1024 / 1440
- [ ] `:focus-visible` outline ring + `prefers-reduced-motion`
- [ ] 觸控目標 ≥ 44px
- [ ] 圖片 `loading="lazy"` + `alt` + `srcset`

---

### #30b MaiMai SVG + 動畫 + 互動

**目標**：填入 Hero wave 和 CTA celebrate 的 MaiMai SVG，加入 scroll-triggered 入場動畫和點擊互動

**依賴**：#30a（HTML 骨架中的 MaiMai placeholder 容器）

**MaiMai 角色分配（2 處，符合 ux-guidelines #7 每視圖 max 1-2 動畫）**：

| 位置 | Mood | 尺寸 | 角色 |
|------|------|------|------|
| Hero 搜尋區右側 | wave | 120x144px（桌面）80x96px（手機居中） | 引導角色：對話氣泡「找房子？讓鄰居告訴你真相」|
| CTA 區 | celebrate | 120x144px（白色） | 慶祝角色：鼓勵註冊解鎖評價 |

> ~~卡片 hover MaiMai 彩蛋~~ 已移除：違反 ux-guidelines #7（每視圖 max 1-2 動畫）和 #11（hover 在觸控裝置無效）

**MaiMai SVG 精確規格**（對齊 `src/components/MaiMai/constants.ts` + `configs.ts`）：

Wave mood（Hero 區）:
```
viewBox="0 0 200 240", stroke="currentColor"
天線: M 85 40 L 85 15 L 100 30 L 115 15 L 115 40
屋頂: M 40 80 L 100 40 L 160 80
身體: rect x=55 y=80 w=90 h=100 rx=4
眉毛(neutral): M 78 110 Q 85 105 92 110 / M 108 110 Q 115 105 122 110
眼(happy): M 80 125 Q 85 120 90 125 / M 110 125 Q 115 120 120 125
嘴(happy): M 85 145 Q 100 160 115 145
左臂(wave up): M 55 130 L 38 112
右臂(wave): M 145 130 L 175 98
揮手圈(ArmExtra wave): circle cx=26 cy=90 r=8 + circle cx=180 cy=90 r=8（animate-wave）
腿: M 85 180 L 85 215 L 75 215 / M 115 180 L 115 215 L 125 215
特效(EFFECT_POSITIONS.wave): ellipse cx=175 cy=60 rx=20 ry=15 + text "Hi!" x=175 y=65
```

Celebrate mood（CTA 區）:
```
viewBox="0 0 200 240", stroke="currentColor", color="white"
天線/屋頂/身體: 同 wave
眉毛(raised): M 76 105 Q 85 98 101 105 / M 106 105 Q 115 98 131 105
眼(excited): M 78 118 Q 85 110 92 118 (sw=4) / M 108 118 Q 115 110 122 118
嘴(excited): M 80 140 Q 100 165 120 140
左臂(celebrate up): M 55 130 L 15 82
右臂(mirror): M 145 130 L 185 82
腿(jumping): M 85 180 L 75 200 L 55 205 / M 115 180 L 125 200 L 145 205
整體動畫: animate-jump（對齊 MaiMaiBase.tsx 的 celebrate 行為）
特效(EFFECT_POSITIONS.celebrate): confetti ×2 + sparkle + star
```

**動畫規格**：

| 動畫 | CSS | 說明 |
|------|-----|------|
| wave 手臂揮動 | `@keyframes wave-arm { 0%,100% { rotate(0) } 25% { rotate(-20deg) } 75% { rotate(20deg) } }` | 右手臂循環揮動，transform-origin 在肩膀 |
| wave 揮手圈 | `@keyframes wave-circle { 0%,100% { opacity:0.2 } 50% { opacity:0.6 } }` | 揮手時的波紋效果 |
| celebrate jump | `@keyframes jump { 0%,100% { translateY(0) } 30% { translateY(-20px) } 50% { translateY(-25px) } }` | 跳躍，**一次性播放**非循環 |
| confetti | `@keyframes confetti-fall` | 紙花下落，**一次性播放** |
| antenna wiggle | `@keyframes wiggle` | 天線搖擺 |
| count-up | JS `IntersectionObserver` | Hero 副標「2,847」數字從 0 滾動到目標值 |
| reduced-motion | `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }` | 停止所有動畫（`!important` 為無障礙業界慣例，屬 CONVENTIONS §十一.5 例外）|

**MaiMai 互動規格**：

1. **Hero MaiMai scroll-triggered 入場**：
   - `IntersectionObserver` 偵測 `.hero-maimai` 進入視窗
   - 入場動畫：`scale(0) → scale(1)` 0.4s ease-out + 對話氣泡 `opacity(0) → opacity(1)` 0.3s delay 0.3s
   - 入場完成後才啟動手臂 wave 循環
   - 只觸發一次（`{ once: true }`）

2. **Hero MaiMai 點擊氣泡切換**：
   - 點擊 MaiMai → 氣泡文字循環切換（觸控友好，44px+ hit area）
   - 3 句循環：「找房子？讓鄰居告訴你真相 👋」→「已有 2,847 位鄰居分享心得」→「免費註冊解鎖所有評價」
   - 切換動畫：fade-out 0.15s → 換文字 → fade-in 0.15s
   - 切換時觸發天線 wiggle 一次（0.6s）

3. **CTA MaiMai scroll-triggered 入場**：
   - `IntersectionObserver` 偵測 `.cta-maimai` 進入視窗
   - 入場觸發 **一次性** `animate-jump` + confetti 爆發
   - 結束後靜止在 celebrate 姿勢，不循環
   - 只觸發一次

4. **CTA MaiMai 點擊 re-celebrate**：
   - 點擊 → 再次觸發 confetti 爆發 + jump 一次
   - 節流 2 秒（防連點）

**驗收**：
- [ ] Hero MaiMai wave SVG 座標對齊 constants.ts（揮手圈 cx=26/180 cy=90）
- [ ] CTA MaiMai celebrate SVG 座標對齊 configs.ts（含 jump 動畫）
- [ ] Hero 入場：scroll 到位 → scale-in + 氣泡 fade-in → 手臂 wave 啟動
- [ ] Hero 點擊：氣泡文字循環 3 句 + 天線 wiggle
- [ ] CTA 入場：scroll 到位 → jump + confetti 一次性
- [ ] CTA 點擊：re-celebrate（節流 2s）
- [ ] Hero 副標「2,847」count-up 動畫（IntersectionObserver）
- [ ] `prefers-reduced-motion: reduce` 停止所有動畫
- [ ] 手機版 MaiMai 可見（80px 不隱藏）、觸控目標 44px+

---

### #30c JS 資料驅動 + 卡片渲染

**目標**：11 筆 Mock 資料 JS 渲染三層卡片（L×2 + M×6 + S×3）+ 愛心收藏互動 + 分頁

**依賴**：#30a（HTML 骨架 + CSS class）

**Mock 資料來源**：
- #1~#6：來自 `src/constants/data.ts` PROPERTIES 陣列（6 筆 seed）
- #7~#11：手動補充 5 筆（對齊 SeedProperty 介面）
- 評價：來自 seed 資料的 reviews + BACKUP_REVIEWS
- 房仲照片：`https://i.pravatar.cc/112?img=N`（每張卡不同 N）

**卡片分配**：

| 卡片 | 層級 | Seed 來源 | badge | tag（稀缺性標籤） |
|------|------|----------|-------|-----------------|
| #1 | L | PROPERTIES[0] 新板特區 | 捷運3分鐘 | 剛上架（綠） |
| #2 | L | PROPERTIES[3] 大直水岸 | 河岸景觀 | 熱門關注（橘） |
| #3 | M | PROPERTIES[1] 民生社區 | 社區中庭 | 本週新增（藍） |
| #4 | M | PROPERTIES[2] 七張站旁 | 學區首選 | — |
| #5 | M | PROPERTIES[4] 東湖站旁 | 公園第一排 | 多人收藏（紫） |
| #6 | M | PROPERTIES[5] 橋和站旁 | 捷運生活圈 | — |
| #7 | M | 手動補充 竹北高鐵 | 近高鐵 | 本週新增（藍） |
| #8 | M | 手動補充 台中七期 | 飯店式管理 | — |
| #9 | S | 手動補充 林口三井 | — | — |
| #10 | S | 手動補充 桃園藝文 | — | — |
| #11 | S | 手動補充 新莊副都心 | — | — |

**評價規則（嚴守）**：

| 卡片 | 層級 | 可見評價 | 鎖定提示 |
|------|------|---------|---------|
| #1~#2 | L | 2 則 | 🔒 註冊看更多評價 |
| #3~#8 | M | 2 則 | 🔒 註冊看更多評價 |
| #9~#11 | S | 無 | — |

**愛心收藏互動**：
- L/M 卡圖片區域有愛心 icon button
- 點擊 toggle 填充/空心狀態（純前端 state）
- 填充色: `#E63946`，空心: white stroke
- 靜態 HTML 無登入系統，toggle 僅視覺效果

**分頁**：
- 列表底部「查看更多房源」按鈕
- 靜態 HTML 點擊無動作（placeholder，未來接 API）

**JS 渲染邏輯**：
- L 大卡：硬編碼 HTML（精選推薦區，2 張）
- M 小卡：JS `LISTINGS` 陣列 loop 渲染到 `#listings-grid`，第 3~4 張之間插入模式中斷區塊（硬編碼 HTML）
- M 小卡稀缺性標籤：`LISTINGS` 每筆含 `tag` 欄位（`string | null`），非 null 時渲染圖片左下角標籤
- S 表列：JS `COMPACT_LISTINGS` 陣列 loop 渲染到 `#compact-grid`
- Header scroll shadow：`requestAnimationFrame` + `scrollY > 10` toggle `.scrolled`
- **禁止 `console.log`**：debug 用 `// DEBUG:` 註解標記，正式碼不得殘留

**驗收**：
- [ ] L×2 + M×6 + S×3 = 11 張卡片全部渲染
- [ ] 每張卡片評價內容不同（來自不同 seed reviews）
- [ ] 每張卡片 badge 不同
- [ ] 每張卡片房仲頭像不同（pravatar img 參數不同）
- [ ] L/M 卡嚴守 2 則評價 + 🔒 註冊看更多
- [ ] S 卡無評價
- [ ] 愛心收藏 toggle 正常
- [ ] 星級顏色 `#FBB424`
- [ ] 「查看更多房源」按鈕存在
- [ ] L/M 卡稀缺性標籤顯示正確（有 tag 的卡片顯示、無 tag 的不顯示）
- [ ] 模式中斷區塊在 M 卡 #5 與 #6 之間，3 欄桌面 / 單欄手機

**`/ui-ux-pro-max` 規範合規摘要（#30a/#30b/#30c 共用）**：

已逐條檢查以下 CSV：
- **ux-guidelines.csv**: #7 動畫 max 1-2（Hero+CTA 合規）、#9 reduced-motion、#11 hover→onClick、#22 touch 44px、#28 focus ring
- **html-tailwind.csv**: #2 bounce 限單一 CTA、#14 lazy loading、#15 srcset、#34 touch 44px
- **landing.csv**: #2 Hero+Testimonials、#22 Marketplace 搜尋為核心、#19 Reviews 星級金色、#24 Social Proof count-up
- **colors.csv**: #38 Real Estate（Trust Blue `#00385a` + Gold `#FBB424` + White）
- **styles.csv**: #3 Glassmorphism（搜尋框）、#8 Accessible（WCAG AA + 44px + focus）、#24 Social Proof（評價 + 星級 + count-up）

修正項（相比原 #30）:
1. ~~卡片 hover MaiMai~~ → 移除（#7 過多動畫 + #11 hover 觸控無效）
2. 評價統一 2 則 + 鎖定（用戶明確要求）
3. M 小卡加上房仲圓形頭像（用戶明確要求）
4. Logo 紅點色改 `#f87171`（對齊 Logo.tsx `bg-red-400`）
5. Logo 字體改 `'Noto Serif TC', Georgia, serif`（對齊 Tailwind `font-serif`）
6. MaiMai wave 動畫改為「手臂 animate-wave + 揮手圈」（非 body float）
7. MaiMai wave 特效揮手圈座標改 `cx=26/180 cy=90`（對齊 ArmExtra）
8. MaiMai celebrate 補 `animate-jump` 跳躍動畫
9. MaiMai 互動優化：scroll-triggered 入場 + 點擊氣泡切換 + CTA 一次性 confetti
10. 補 `--star-color: #FBB424` 星級金色
11. 補圖片 `srcset`（html-tailwind #15）
12. 補愛心收藏按鈕（截圖特色）
13. 補 `Premier` 文字 badge（截圖特色）
14. 補搜尋結果數量 + 分頁按鈕（截圖特色）
15. 補房仲公司名（截圖特色）
16. 補 Hero 副標 count-up 數字動畫（landing #24）

**無障礙 checklist（#30a/#30b/#30c 共用）**：
- [ ] WCAG AA 對比 4.5:1
- [ ] 所有 icon button 有 `aria-label`
- [ ] `:focus-visible` outline ring
- [ ] `prefers-reduced-motion: reduce` 停止所有動畫
- [ ] 語意 HTML: header/nav/main/section/article/footer
- [ ] 圖片 `loading="lazy"` + `alt` + `srcset`
- [ ] SVG 有 width/height 防 layout shift
- [ ] 觸控目標 ≥ 44px
- [ ] `scroll-behavior: smooth`
- [ ] `font-display: swap`

---

## 核心原則

1. **訪客 ≠ Mock** — 正式頁面的「未登入視角」
2. **演示 = 完整預覽** — 操作本地化，不寫 DB
3. **每個 disabled 都要解釋** — LockedOverlay 模式
4. **消滅 HTML 死路** — 所有頁面在 React app 內
5. **角色 ≠ 登入** — 處理「未登入」不假設身份
6. **演示不影響正式** — 登入自動退出演示
7. **統一錯誤處理** — `getErrorMessage()` 唯一入口
8. **三層防禦** — L1 query `enabled` → L2 hook 攔截 → L3 全局 onError 靜默
9. **進出清理完整** — 登入清標記、登出清 cache、退出清全部
10. **全站覆蓋** — Chat/Assure 也要接入

---

## 全局驗證

```bash
npm run gate
rg "isDemoPropertyId|DEMO_PROPERTY_ID" src/              # #4a 後 0 筆
rg "community-wall_mvp" src/                             # #2 後 0 筆
rg "disabled=\{!isLoggedIn\}" src/                       # #3/#8 後 0 筆
rg "navigate.*auth\.html" src/                           # #15 後 0 筆
rg "DEMO_IDS" src/                                       # #6b 後 0 筆
rg "uagModeStore|selectUseMock" src/                     # #5b 後 0 筆
rg "isMock" src/pages/Assure/                            # #25 後 0 筆
rg "usePageMode" src/pages/Chat/ src/pages/Assure/       # #24/#25 後有結果
rg "SEED_COMMUNITY_ID" src/components/Header/            # #12b 後僅存於 demo 分支
```

---

## Wave 注意事項

| Wave | 重點 | 狀態 |
|------|------|------|
| 1 | auth loading 中間態防 FOUC（#12 施工時注意） | 待施工 |
| 1B | Toast duration Infinity、`queryClient.clear()` vs `invalidateQueries`、Logo 連按 5 次（1500ms） | ✅ 已解決 |
| 2 | `SEED_COMMUNITY_ID` 已定值 ✅、SEO 勿索引 seed（#9 加 robots）、`Object.freeze` ✅ | 部分完成 |
| 3 | `getSafeReturnPath()` 加黑名單 `/uag`（#7）、auth 角色用 `app_metadata`（#7）、`?mock=true` 301（#9 vercel.json） | 待施工 |
| 4 | `maimai-mood-v1` / `uag_last_aid` 確認列入 #26 `AUTH_CLEANUP_KEYS` | 待驗證 |
| 4B/C | `exitDemoMode()` 順序：clear cache → 清 storage → `location.replace('/')`、跨分頁 storage handler 需清 cache（#10b） | 待施工 |
| 4B (#29) | P0 已修 ✅（visibilitychange 補償、safeStorage 探測、warn 條件）。剩餘：`100vh` → `dvh`（3 檔 CSS）+ `safe-area-inset-bottom` fallback（1 檔） | 部分完成 |
