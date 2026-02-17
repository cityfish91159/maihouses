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
- [x] **#8b** 社區牆：發文/留言本地化 + LockedOverlay/BottomCTA 引導修正（3 檔）✅ 2026-02-17

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
- [x] **#27** UAG 新房仲空狀態 + MaiMai 引導（1 新組件）✅ 2026-02-17

### P2 — 房源列表頁三模式重構（`PropertyListPage`）

- [ ] **#30a** PropertyListPage 頁面骨架 + 6 區塊 Section 組件 + 三模式接入（需 `/ui-ux-pro-max`）
- [ ] **#30a2** L/M/S 三層卡片 React 組件 + Schema 擴充 + seed 擴充
- [ ] **#30b** PropertyListPage MaiMai React 組件 + 動畫
- [ ] **#30c** PropertyListPage 三模式互動（愛心收藏 + 評價鎖定 + ModeBreakBlock）

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

#12 Header 三模式 UI ──→ #13 PropertyListPage Header 統一
#13 ──────────────────→ #30a PropertyListPage 頁面骨架 + 6 區塊
#1a usePageMode ───────→ #30a（三模式驅動）
#30a ─────────────────┬→ #30a2 L/M/S 三層卡片組件（可部分平行）
                       ├→ #30b MaiMai React 組件 + 動畫
                       └→ #9 移除 docs/property.html（新增依賴）
#30a2 ────────────────→ #30c 三模式互動（愛心收藏 + 評價鎖定）
#1b useModeAwareAction → #30c（愛心收藏三模式派發）
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
| Wave 4-PL | #30a | 頁面骨架 + 6 區塊 Section（依賴 #13）|
| Wave 4-PL | #30a2 | L/M/S 卡片組件 + Schema + seed（可與 #30a 部分平行）|
| Wave 4-PL+1 | #30b、#30c | MaiMai + 三模式互動（依賴 #30a/#30a2）|

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

**已完成** 2026-02-16（第二輪修正：2026-02-16；strict-audit Phase 4：2026-02-16；第三輪修正：2026-02-17；第四輪 /superpowers 再審核：2026-02-17）

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
- `useFeedData` 移除 `as SupabasePostRow` 斷言，改為使用 `parsedRows` 直接推導 liked 狀態
- `Feed/index.tsx` 刪除不可達的 `!userId && !isDemoRoute` 防禦分支與重複分支
- `Consumer` 手機版補掛 `BottomNav`，避免既有底部導航元件閒置
- `useConsumer.handleCreatePost` 改為單一路徑呼叫（`createPost(content, communityId, images)`），由 `createPost` 內部處理可選圖片
- Feed 相關註解用語統一為「資訊流」
- `useAgentFeed` 移除 `useMemo(() => getAgentFeedData(), [])`，改 lazy `useState` 初始化，避免 Hook 過度優化寫法不一致

**驗證**：
- [x] `rg "DEMO_IDS" src/` → 0 筆
- [x] `npm run check:utf8`
- [x] `npm run typecheck`
- [x] `npm run gate`
- [x] `cmd /c npm run test -- src/pages/Feed/__tests__/FeedIntegration.test.tsx src/pages/Feed/__tests__/FeedRouting.test.tsx src/pages/Feed/__tests__/useAgentFeed.test.ts src/pages/Feed/__tests__/useConsumer.test.ts`（16 passed）
- [x] `cmd /c npm run test -- src/pages/Feed/__tests__/FeedRouting.test.tsx src/pages/Feed/__tests__/useAgentFeed.test.ts src/pages/Feed/__tests__/useConsumer.test.ts`（12 passed）
- [x] `rg "useMemo\\(\\(\\) => getAgentFeedData\\(\\), \\[\\]\\)" src/pages/Feed/useAgentFeed.ts` → 0 筆
- [x] `npm run check:utf8`

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

### #8b ✅ 社區牆互動本地化

**已完成** 2026-02-17

**目標**：發文/留言本地化 + LockedOverlay/BottomCTA 引導

**依賴**：#8a、#14b、#15

**新增/修改**：
- `src/pages/Community/components/PostsSection.tsx`
- `src/pages/Community/components/BottomCTA.tsx`
- `src/pages/Community/Wall.tsx`

**核心變更**：
- `PostsSection` 發文入口改用 `useModeAwareAction` 分流：`visitor -> 註冊引導`、`demo/live -> 開啟發文流程`
- `PostCommentSection` 留言操作改用 `useModeAwareAction` 分流：`visitor -> 註冊引導`、`demo -> 本地留言 state`、`live -> API`
- `PostCommentSection` demo 模式支援本地 `add / like / delete`（不打 API）
- `BottomCTA` 註冊導向統一改 `getAuthUrl('signup', getCurrentPath())`，移除社區頁面內硬編碼 `auth.html` 依賴
- `PostsSection` 補接 `onRegisterGuide`，留言引導文案對齊「註冊後即可參與討論」
- 第二輪修正（2026-02-17）：
  - `Wall.tsx` 移除 inline `<style>`，主內容動畫改用 `animate-fadeIn`；`handleAskQuestion/handleAnswerQuestion` 補齊 `useModeAwareAction` 三模式分流；錯誤區按鈕補 `type="button"`
  - `BottomCTA.tsx` 導向改為 `navigateToAuth('signup', getCurrentPath())`，不再直接操作 `window.location.href`
  - `PostsSection.tsx` 移除重複權限判斷（`openPostWithPermissionCheck`），改由單一路徑派發；拆分 `PostCard.tsx`、`PostCommentSection.tsx` 與 `usePostCommentModeState.ts`，降低單一元件複雜度
  - `QASection.tsx` 抽出 `useQAModalState`，並以 `useModeAwareAction` 控制發問/回答 modal 入口
  - `LockedOverlay.tsx` `benefits.map` 改用內容值作為 key；`ReviewsSection.tsx` 鎖定文案改讀 `STRINGS.COMMUNITY` 常量

**驗證**：
- [x] `npm run check:utf8`
- [x] `npm run typecheck`
- [x] `rg "auth\\.html" src/pages/Community/`（0 筆）
- [x] `npm run gate`

---

### #9 移除靜態 HTML mock 頁

**目標**：清理靜態 HTML 殘留

**依賴**：#2、#6b、#30a

**移除**：
- `public/community-wall_mvp.html`
- `public/maihouses/community-wall_mvp.html`
- `public/feed-agent.html`
- `public/feed-consumer.html`
- `docs/property.html`（1223 行靜態 HTML，#30a React 版完成後移除）

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

### #27 ✅ UAG 新房仲空狀態 MaiMai 歡迎引導卡片

**目標**：新 agent 進 UAG 看到 MaiMai 引導而非空白頁

**依賴**：#5a

**已完成** 2026-02-17

**Context**：新房仲註冊後第一次進入 UAG 頁面（`/maihouses/uag`），因為還沒上架任何物件，leads 和 listings 都是空的，整頁除了空區塊什麼都沒有。需要一個 MaiMai 歡迎卡片引導新房仲去上架第一筆物件。

上架物件後系統才能追蹤消費者瀏覽行為，雷達才會有泡泡。所以引導方向是「去上架物件」。

**修改檔案清單**：

| 操作 | 檔案 | 用途 |
|------|------|------|
| 新增 | `src/pages/UAG/components/UAGEmptyState.tsx` | 歡迎卡片組件 |
| 修改 | `src/pages/UAG/index.tsx` (L268) | 在 uag-grid 最上方條件渲染卡片 |
| 修改 | `src/pages/UAG/UAG.module.css` | 新增歡迎卡片樣式 |

**不動的東西**：`routes.ts`（不新增常數，CTA 用 `<Link to="/property/upload">`，照 `ListingFeed.tsx:186` 既有 pattern）

---

#### 步驟 1：新增 UAGEmptyState.tsx

**Props**：
```typescript
interface UAGEmptyStateProps {
  onDismiss: () => void;
}
```

**顯示邏輯（由父組件 index.tsx 控制）**：
- `appData.leads.length === 0 && appData.listings.length === 0 && !dismissed`
- dismissed 狀態用 `useState(false)`，關閉時寫 `sessionStorage.setItem('uag-welcome-dismissed', '1')`
- 初始化時讀 sessionStorage 判斷是否已關閉

**使用的分子素材**：
- `MaiMaiBase` from `src/components/MaiMai`（mood="wave", size="md", showEffects={true}）
- `usePrefersReducedMotion` from `src/hooks/usePrefersReducedMotion`（控制 animated prop）
- `X` from `lucide-react`（關閉按鈕）
- `Link` from `react-router-dom`（CTA 導航）

**佈局**：
- 桌面：水平左右（左 MaiMai、右文案）
- 平板（<1024px）：垂直排列（上 MaiMai、下文案）
- 手機（<768px）：MaiMai 改用 `size="sm"`（80px），減少垂直佔用
- Grid 定位：CSS class `k-span-6`（全寬），在 RadarCluster 之前

**配色（首頁主色系 —— `src/index.css` :root 變數，全部用 CSS Module 實作，UAG 頁面零 Tailwind）**：

| 元素 | CSS 變數 | 色碼 |
|------|---------|------|
| 卡片背景 | `#fff` | #ffffff |
| 卡片邊框 | `var(--border)` | #e6edf7 |
| 標題文字 | `var(--text-primary)` | #0a2246 |
| 說明文字 | `var(--text-secondary)` | #526070 |
| CTA 按鈕背景 | `var(--brand)` | #00385a |
| CTA 按鈕文字 | `#fff` | #fff |
| CTA hover 背景 | `var(--primary-dark)` | #002a44 |
| CTA hover 陰影 | `0 4px 12px rgba(0,56,90,0.2)` | — |
| 「知道了」文字 | `var(--text-secondary)` | #526070 |
| 關閉按鈕 | `var(--text-muted)` | #6c7b91 |

**文案**：
- 標題：嗨！歡迎加入 MaiHouses！
- 內文：你的買家雷達已經就緒。當有消費者在看你負責的物件，我會馬上通知你。
- 引導：現在先去上架你的第一筆物件吧！
- CTA：上架物件
- 次要：知道了（語意誠實，dismiss 後不會自動再顯示）

**動畫**：
- 卡片進場：CSS Module `animation: fadeIn 0.3s cubic-bezier(0.4,0,0.2,1) forwards`（`@keyframes fadeIn` 需在 UAG.module.css 中新增，UAG.module.css 目前無此 keyframe）
- MaiMai：`animated={!prefersReducedMotion}` 浮動動畫
- prefers-reduced-motion 處理：
  - 用 `usePrefersReducedMotion()` hook 取得偏好
  - MaiMai `animated` prop 綁定 `!prefersReducedMotion`
  - 卡片 fadeIn 在 CSS Module 中加 `@media (prefers-reduced-motion: reduce)` 停用

**互動 transition**：
- CTA hover / 關閉按鈕 hover：`transition: all 0.2s ease`（與既有 `.uag-btn` 一致）
- 所有可點擊元素：`cursor: pointer`

**無障礙**：
- 關閉按鈕觸控區 min 44×44px
- 關閉按鈕 `aria-label="關閉歡迎引導"`
- 關閉按鈕 `focus-visible` 樣式：`outline: 2px solid var(--brand); outline-offset: 2px`
- CTA 按鈕 min-height 44px
- 「知道了」按鈕 min-height 44px
- 卡片 `role="region"` `aria-label="新手引導"`
- 文字對比度：說明文字用 `--text-secondary`(#526070) 對白底 = 5.2:1 ≥ WCAG AA 4.5:1

---

#### 步驟 2：修改 index.tsx

**新增 import**（放在 L29 `import ListingFeed` 之後）：
```typescript
import { UAGEmptyState } from './components/UAGEmptyState';
```

在 `UAGPageContent` 中：

1. 新增 state（放在 L59 `assetMessageLead` state 之後，與其他 state 同區）：
```typescript
const [welcomeDismissed, setWelcomeDismissed] = useState(
  () => sessionStorage.getItem('uag-welcome-dismissed') === '1'
);
```

2. 計算是否顯示（放在 L231 `if (!appData) return null` 之後、`const agentId` 之前）：
```typescript
const showWelcome = appData.leads.length === 0
  && appData.listings.length === 0
  && !welcomeDismissed;
```

> 注意：`showWelcome` 不是 hook，依賴 `appData`，所以放在 early return 之後是正確的。

3. dismiss handler（放在 `handleCreatePost` 之前）：
```typescript
const handleDismissWelcome = useCallback(() => {
  setWelcomeDismissed(true);
  try {
    sessionStorage.setItem('uag-welcome-dismissed', '1');
  } catch {
    // iOS Safari 私隱模式 sessionStorage 可能滿額（參考 #29）
  }
}, []);
```

4. 在 `<div className={styles['uag-grid']}>` 內、RadarCluster 之前插入：
```tsx
{showWelcome && <UAGEmptyState onDismiss={handleDismissWelcome} />}
```

---

#### 步驟 3：修改 UAG.module.css

新增歡迎卡片樣式 class（純 CSS Module，不用 Tailwind — 與 UAG 全頁面一致）：

```css
/* ====== #27: 歡迎引導卡片 ====== */
.welcome-card {
  background: #fff;
  border: 1px solid var(--border);         /* #e6edf7 */
  border-radius: 16px;                     /* 與 .uag-card 一致 */
  padding: 24px;                           /* 桌機 */
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
  position: relative;
  animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

.welcome-card-inner {
  display: flex;
  align-items: center;
  gap: 24px;
}

.welcome-text {
  flex: 1;
  min-width: 0;
}

.welcome-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-primary);              /* #0a2246 */
  margin: 0 0 8px;
}

.welcome-desc {
  font-size: 14px;
  color: var(--text-secondary);            /* #526070, WCAG AA 5.2:1 */
  line-height: 1.6;
  margin: 0 0 16px;
}

.welcome-cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 10px 24px;
  border: none;
  border-radius: 12px;
  background: var(--brand);                /* #00385a */
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s ease;
}

.welcome-cta:hover {
  background: var(--primary-dark);         /* #002a44 */
  box-shadow: 0 4px 12px rgba(0, 56, 90, 0.2);
}

.welcome-dismiss {
  border: none;
  background: transparent;
  color: var(--text-secondary);            /* #526070 */
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 16px;
  min-height: 44px;
  transition: color 0.2s ease;
}

.welcome-dismiss:hover {
  color: var(--text-primary);
}

.welcome-close {
  position: absolute;
  top: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--text-muted);                /* #6c7b91 */
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.welcome-close:hover {
  background: var(--bg-alt);
}

.welcome-close:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

.welcome-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 平板/手機 */
@media (max-width: 1024px) {
  .welcome-card {
    padding: 16px;
  }
  .welcome-card-inner {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  .welcome-actions {
    justify-content: center;
  }
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .welcome-card {
    animation: none;
  }
}

/* fadeIn keyframe — UAG.module.css 目前無此定義，需新增 */
@keyframes fadeIn {
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0); }
}
```

---

#### UAGEmptyState.tsx import 順序

```typescript
import { Link } from 'react-router-dom';                   // 1. 路由
import { X } from 'lucide-react';                          // 2. 第三方 UI
import { MaiMaiBase } from '../../../components/MaiMai';   // 3. 內部元件
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'; // 4. 內部 hook
import styles from '../UAG.module.css';                    // 5. 樣式
```

> 不需 `import React` — 專案用 Vite + React 18 JSX transform，無需顯式 import。
> 不需 `useMemo` — 此組件是純展示組件，接收 `onDismiss` prop，無計算邏輯。

---

#### 驗證方式

1. `npm run gate` 通過（typecheck + lint）
2. 用 live 模式新帳號（或 mock 模式清空 leads/listings）訪問 `/maihouses/uag`
3. 確認卡片出現在 RadarCluster 上方、全寬
4. 確認 MaiMai wave 動畫正常
5. 點「上架物件」→ 導航到 `/property/upload`
6. 點「知道了」或 ✕ → 卡片消失
7. 重整頁面 → 卡片不再出現（sessionStorage）
8. 關閉瀏覽器重開 → 卡片重新出現（sessionStorage 清除）
9. 上架物件後回到 UAG → 卡片自動不顯示（listings > 0）
10. 手機 viewport（<768px）→ 確認垂直排列 + MaiMai 縮為 80px
11. prefers-reduced-motion → 確認 fadeIn 停用 + MaiMai 浮動停用
12. 關閉按鈕 Tab focus → 確認 focus-visible outline 可見
13. 「知道了」/ CTA 觸控區 ≥ 44px

#### 2026-02-17 施作紀錄（本輪）

**新增**：
- `src/pages/UAG/components/UAGEmptyState.tsx`
- `src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`

**修改**：
- `src/pages/UAG/index.tsx`
- `src/pages/UAG/UAG.module.css`

**本輪調整重點**：
- `UAGPageContent` 新增 `showWelcome` 條件渲染：`mode === 'live' && leads/listings 皆空 && !welcomeDismissed`。
- dismiss 持久化採用 `safeSessionStorage`（key: `uag-welcome-dismissed`），避免直接存取 `sessionStorage` 的環境風險。
- `UAGEmptyState` 使用既有分子素材 `MaiMaiBase`，動畫參數改用 `useMaiMaiA11yProps()` 統一接入 reduced-motion。
- 歡迎卡樣式完全使用 `UAG.module.css`（零 Tailwind），補齊 44px 觸控區、focus-visible、`prefers-reduced-motion`。
- CTA 維持既有 pattern：`<Link to="/property/upload">`（不新增 `routes.ts` 常數）。

**驗證摘要**：
- [x] `npm run check:utf8`
- [x] `cmd /c npm run test -- src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`
- [x] `npm run gate`

#### 2026-02-17 strict-audit 修正（第二輪）

**修改**：
- `src/pages/UAG/components/UAGEmptyState.tsx`
- `src/pages/UAG/UAG.module.css`

**修正項目**：
- `UAGEmptyState.tsx:42` 次要按鈕文案改回「知道了」（對齊規格 L963），修復 2 個測試失敗
- `UAGEmptyState.tsx` 新增 `useMediaQuery('(max-width: 767px)')` 驅動手機版 MaiMai `size="sm"` (80px)（對齊規格 L940）
- `UAG.module.css:456` `.welcome-card` border 改 `var(--border)`（對齊規格 `#e6edf7`，原用 `var(--line-soft)` `#e2e8f0`）
- `UAG.module.css` 8 處 hardcode 色碼改 CSS 變數：`.welcome-title` → `var(--text-primary)`、`.welcome-desc` → `var(--text-secondary)`、`.welcome-cta` → `var(--brand)` / `var(--primary-dark)`、`.welcome-dismiss` → `var(--text-secondary)` / `var(--text-primary)`、`.welcome-close` → `var(--text-muted)`、`:focus-visible` → `var(--brand)`
- `UAG.module.css:494` `.welcome-desc` margin 改 `0 0 16px`（對齊規格，原為 `0 0 12px`）
- `UAG.module.css` 767px breakpoint 新增 `.welcome-maimai-wrap` 80px 容器限制

**驗證摘要**：
- [x] `npm run check:utf8`
- [x] `npx vitest run src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`（5 passed）
- [x] `npx tsc --noEmit`
- [x] `npm run gate`

---

#### 2026-02-17 strict-audit 修正（第三輪）

**修改**：
- `src/pages/UAG/UAG.module.css`
- `src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`

**修正項目**：
- `UAG.module.css:496` 新增 `.welcome-desc:last-of-type { margin-bottom: 0; }`，消除最後一段文案與 actions 之間多餘 16px 空白
- `UAGEmptyState.test.tsx` 新增 `useMediaQuery` mock（預設 `false` = 桌機），確保 isMobile 條件受測試控制
- `UAGEmptyState.test.tsx` 新增測試案例 `'uses size="sm" on mobile viewport'`：mock `useMediaQuery` 回傳 `true`，驗證 MaiMai `data-size="sm"`

**驗證摘要**：
- [x] `npm run check:utf8`
- [x] `npx vitest run src/pages/UAG/components/__tests__/UAGEmptyState.test.tsx`（6 passed）
- [x] `npx tsc --noEmit`
- [x] `npm run gate`

---

#### #27 可優化補充（規劃建議，未實作）

> 以下為 #27 可再提升的項目，先記錄在工單供規劃與排程，不直接改碼。

| 優化項目 | 建議 | 目的 | 建議落點 |
|---|---|---|---|
| 素材一致性約束 | 明確規範卡片僅可用 `MaiMaiBase`（禁止手刻 SVG）且維持 Header `Logo` 現有分子元件 | 確保 Logo / MaiMai 使用完整正規分子素材，避免素材漂移 | `src/components/MaiMai`, `src/components/Logo/Logo.tsx` |
| 行為可觀測性 | 新增曝光/關閉/CTA 點擊事件（例：`uag_welcome_impression`、`uag_welcome_dismiss`、`uag_welcome_upload_click`） | 量化引導卡轉換成效，支援後續文案與版位優化 | `api/uag/track.ts`, `src/pages/UAG/index.tsx` |
| 測試覆蓋補強 | 增加 `UAGEmptyState` 與 `showWelcome` 條件測試（含 dismiss 持久化） | 降低回歸風險，確保 #27 長期可維護 | `src/pages/UAG/components/__tests__/*`, `src/pages/UAG/__tests__/*` |

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

### #30 React 房源列表頁三模式設計規格（共用上下文）

**參考截圖**：
- `C:\Users\陳世瑜\Downloads\www.realestate.com.au_buy_in-nsw_list-1.png`（Premier 大卡 + 標準卡片混排）
- `C:\Users\陳世瑜\Downloads\www.realestate.com.au_buy_in-nsw_list-1 (1).png`（列表模式 + 房仲頭像右上角）

**商業考量**：三層卡片呈現（大/小/表列）未來對應廣告費分級

**修改**：

| 檔案 | 動作 | 工單 |
|------|------|------|
| `src/pages/PropertyListPage.tsx` | 主頁面重構（接入 usePageMode） | #30a |
| `src/pages/Property/components/` | 6 區塊 Section 子組件重構/新增 | #30a |
| `src/styles/LegacyPropertyPage.css` | 遷移至 Tailwind 後移除 | #30a |
| `src/features/property/components/` | L/M/S 三層卡片組件重構 | #30a2 |
| `src/types/property-page.ts` | Schema 擴充（agent/scarcityTag/tier） | #30a2 |
| `src/features/property/data/seed.ts` | 擴充：房仲資料、11 筆完整卡片 | #30a2 |

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

### PropertyListPage 三模式視覺差異表

| 互動元素 | visitor | demo | live |
|----------|---------|------|------|
| **Header** | 登入/註冊按鈕（首頁 Header） | 退出演示按鈕 | 使用者頭像 + 下拉選單 |
| **搜尋框 + pills** | 正常使用 | 正常使用 | 正常使用 |
| **L/M 卡評價** | 2 則 + LockedOverlay blur 鎖定 | 全部解鎖（seed 完整顯示） | API 數據，全部解鎖 |
| **L/M 卡愛心收藏** | 點擊 → toast 引導註冊 | 本地 toggle（React state） | API 收藏（暫 = 本地 toggle） |
| **「查看詳情」導航** | → PropertyDetailPage（visitor） | → PropertyDetailPage（demo） | → PropertyDetailPage（live） |
| **模式中斷區塊** | 顯示：CTA 引導註冊（M 卡 #4~#5 間） | 不渲染 | 不渲染 |
| **CTA 區（§5）** | 「免費註冊」→ getAuthUrl | 「開始探索」→ 滾動回搜尋區 | 「聯繫我們」或隱藏（待定） |
| **Hero 副標數字** | seed 靜態數字 | seed + count-up 動畫 | API 真實數字 + count-up |
| **資料來源** | seed + API 背景更新 | seed（禁 API） | API 數據 |
| **DemoBadge** | 不顯示 | 右下角浮動標籤（#10a） | 不顯示 |
| **S 卡** | 正常顯示（無評價、無愛心） | 正常顯示 | 正常顯示 |

---

### #30a PropertyListPage 頁面骨架 + 6 區塊 Section 組件

**目標**：PropertyListPage 主頁面接入 usePageMode() + 6 區塊 Section 容器組件 + Tailwind 遷移。
Section 內部使用 #30a2 的卡片組件（施工期可先用 placeholder）。

**依賴**：#12（Header 三模式 UI）、#13（LegacyHeader → Header 替換）、#1a（usePageMode）

**修改**：

| 檔案 | 動作 |
|------|------|
| `src/pages/PropertyListPage.tsx` | 主頁面重構：接入 usePageMode，三模式資料來源，組合 6 區塊 |
| `src/pages/Property/components/HeroSection.tsx` | 新增：Hero 搜尋區 |
| `src/pages/Property/components/SearchBox.tsx` | 升級：Glassmorphism + 快捷 pills |
| `src/pages/Property/components/FeaturedSection.tsx` | 升級：2 欄容器（消費 PremierCard） |
| `src/pages/Property/components/ListingSection.tsx` | 升級：M+S 混合容器 + ModeBreakBlock 插入邏輯 |
| `src/pages/Property/components/ModeBreakBlock.tsx` | 新增：visitor CTA 區塊 |
| `src/pages/Property/components/CtaSection.tsx` | 新增：品牌色 CTA 區（三模式文案切換） |
| `src/pages/Property/components/FooterSection.tsx` | 新增：Footer |
| `src/styles/LegacyPropertyPage.css` | 遷移至 Tailwind 後移除 |

**ErrorBoundary**：頂層 `<ErrorBoundary>` 包裹 6 區塊（ref: react.csv #39），fallback 顯示品牌色錯誤卡片：「頁面載入異常，請重新整理」+ 重新整理按鈕（Primary 樣式）。

**三態處理**（ref: CONVENTIONS §5.3）：
- **Loading**：首次載入顯示 skeleton（Hero 區 pulse 背景 + 卡片區 3 個 skeleton 卡片 `animate-pulse`），不顯示空白頁面
- **Error**：API 失敗時顯示 inline 錯誤訊息 + 「重試」按鈕，不阻擋已載入的 seed 資料渲染
- **Empty**：搜尋/篩選結果為空時顯示空狀態插圖 + 「清除篩選條件」按鈕 + 文案「找不到符合條件的房源，試試其他關鍵字」

**6 區塊結構**：

1. **Sticky Header** → 使用首頁 `<Header />`（64px，#13 替換後自動繼承三模式）
2. **Hero 搜尋區** → `<HeroSection />`（大標 + 副標 + Glassmorphism 搜尋 + pills + MaiMai placeholder）
3. **精選推薦區** → `<FeaturedSection />`（2 欄 `PremierCard` 並排）
4. **房源列表區** → `<ListingSection />`（M `StandardCard` × 6 + `ModeBreakBlock` + S `CompactCard` × 3）
5. **CTA 區** → `<CtaSection />`（品牌色背景 + MaiMai celebrate + 文案依模式切換）
6. **Footer** → `<FooterSection />`

**Header 方案**：使用首頁 `Header.tsx`（`src/components/Header/Header.tsx`），高度統一 64px（`h-16`）。

**三模式資料來源**：
- visitor：SEED_DATA + API 背景更新（同現有邏輯）
- demo：SEED_DATA only（`mode !== 'live'` 時 skip fetch）
- live：API 數據（`GET /api/property/page-data`）

**CTA 區三模式**（保持顯示，文案切換）：
- visitor：「加入邁房子，解鎖所有評價」+「免費註冊」→ `getAuthUrl('signup')`
- demo：「喜歡這個體驗嗎？」+「開始探索」→ 滾動回搜尋區
- live：「找到心儀的房源了嗎？」+「聯繫房仲」→ 導向聯繫頁面（或隱藏，視需求）

**頁面結構（6 區塊精確規格）**：

#### 1. Sticky Header

高度: 64px（`h-16`，與首頁 Header 統一）。使用首頁 `<Header />`，三模式行為自動繼承。
`body padding-top: 64px`，防內容被 header 遮蔽。

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
- 輸入: 56px 高，focus `border-color: #00385a; ring-2 ring-[#00385a]/30`，`font-size: 16px`（防 iOS 自動縮放），`aria-label="搜尋社區或地址"`
- 搜尋按鈕: 44x44px 圓形 `#00385a`，白色搜尋 SVG，`aria-label="搜尋"`
- 快捷 pills:「3房以內」「30坪以下」「近捷運」「新成屋」水平可捲動，`gap: 8px`

MaiMai placeholder: 預留容器，由 #30b `<PropertyHeroMaiMai />` 填入。

#### 3. 精選推薦區

標題:「口碑精選」20px bold + 副標「住戶評價最高的房源」14px
桌面: 2 欄並排，gap 24px。手機: 單欄堆疊。
內容: 渲染 2 個 `<PremierCard />`（#30a2 提供）。

#### 4. 房源列表區

標題:「更多房源」20px bold +「共 248 筆」14px `#526070`
切換: 右側小 icon 切換卡片/表列模式（grid icon + list icon）
桌面: 單欄列表。手機: 圖上文下堆疊。
內容: 渲染 6 個 `<StandardCard />`（M 卡 #4~#5 間插入 `<ModeBreakBlock />`）+ 3 個 `<CompactCard />`（#30a2 提供）。
列表底部:「查看更多房源」Secondary 按鈕，居中。

#### 5. CTA 區（MaiMai celebrate）

```
背景: linear-gradient(135deg, #00385a 0%, #004E7C 50%, #005282 100%)
border-radius: 24px; padding: 48px 32px; margin: 0 16px
```

- 布局: 左 MaiMai celebrate + 右文案（手機上下排列居中）
- MaiMai: `<PropertyCtaMaiMai />`（#30b 實作）
- 標題/CTA 依三模式切換（見上方 CTA 區三模式）

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
| < 768px (iOS) | 單欄。搜尋全寬。卡片圖上文下。MaiMai 80px 不隱藏。觸控 ≥ 44px。`env(safe-area-inset-bottom)` 處理 Home Indicator |
| 768-1024px | 精選 2 欄，列表單欄 |
| ≥ 1024px | 完整設計。精選 2 欄。列表水平卡片 |

**iOS 特別處理**：
- `-webkit-tap-highlight-color: transparent`
- `padding-bottom: env(safe-area-inset-bottom)`（footer）
- 搜尋框: `font-size: 16px`（防止 iOS 自動縮放）
- 圖片: 響應式 `srcset` + `sizes`

**驗收**：
- [ ] usePageMode() 正確驅動三模式
- [ ] 6 區塊 Section 組件結構完整
- [ ] Header 顯示三模式 UI（首頁 Header，64px）
- [ ] CTA 區文案依三模式正確切換
- [ ] ModeBreakBlock 在 visitor 顯示、demo/live 隱藏
- [ ] LegacyPropertyPage.css 遷移至 Tailwind 完成
- [ ] ErrorBoundary 包裹 6 區塊，fallback UI 正確顯示
- [ ] Loading skeleton / Error 回退 / Empty 空狀態三態完整
- [ ] 搜尋框 focus ring 可見（`ring-2 ring-[#00385a]/30`）
- [ ] 搜尋按鈕 `aria-label="搜尋"` 存在
- [ ] 響應式：375(iPhone) / 768 / 1024 / 1440
- [ ] 品牌色 CSS 變數與 src/index.css 一致
- [ ] npm run gate 通過

---

### #30a2 L/M/S 三層卡片 React 組件 + Schema + seed 擴充

**目標**：實作 PremierCard（L）/ StandardCard（M）/ CompactCard（S）三種卡片 React 組件，
擴充 Schema 和 seed 資料。卡片本身為純展示組件，三模式互動邏輯由 #30c 接入。

**依賴**：#30a（Section 容器須先存在，但可部分平行開發）

**修改**：

| 檔案 | 動作 |
|------|------|
| `src/features/property/components/PremierCard.tsx` | 重構自 LegacyFeaturedCard：L 大卡 |
| `src/features/property/components/StandardCard.tsx` | 重構自 LegacyHorizontalCard：M 小卡 |
| `src/features/property/components/CompactCard.tsx` | 新增：S 表列卡片 |
| `src/types/property-page.ts` | 擴充：agent 物件、scarcityTag、tier |
| `src/features/property/data/seed.ts` | 擴充：房仲資料、11 筆完整卡片 |

**三層卡片規格**：

| 層級 | 名稱 | 商業 | 視覺規格 |
|------|------|------|---------|
| **L** | Premier 推廣 | 付費最高曝光 | 全寬大圖(16:10) + `Premier` badge 左上 + 愛心收藏右上 + 房仲圓形頭像右上角(56px白邊框+陰影) + 房仲姓名/公司名/頭銜 + 2 則評價 + 註冊看更多 + 品牌色左邊框 4px |
| **M** | 標準展示 | 標準刊登 | 桌面水平(圖左文右)、手機圖上文下 + 愛心收藏 + 房仲圓形頭像(40px) + 房仲姓名/公司名 + 2 則評價 + 註冊看更多 + 評分星星（`--star-color: #FBB424`） |
| **S** | 精簡列表 | 免費/基本 | 單行：60px 縮圖 + 標題 + 價格 + specs icon。無評價無房仲頭像 |

**L 大卡結構**（PremierCard）:
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
│ 「管委反應快，公設打理乾淨。」             │  ← 評價 1 blockquote, line-height: 1.6
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

**M 小卡結構**（StandardCard，桌面水平排列）:
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

**S 表列結構**（CompactCard）:
```
┌───┬─────────────────────────────────────┐
│ □ │ 七張站旁｜電梯兩房  22.1坪 2房  838萬 │  ← 60px 縮圖 + 單行
└───┴─────────────────────────────────────┘
```

**共用卡片規格**：

L/M 卡圖片底部 scrim: `linear-gradient(transparent 60%, rgba(0,0,0,0.3))`

L/M 卡稀缺性標籤: 圖片左下角 `absolute; bottom: 8px; left: 8px`，`padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 700; color: white`。底色：`剛上架` `#16A34A`（綠）、`熱門關注` `#EA580C`（橘）、`本週新增` `#2563EB`（藍）、`多人收藏` `#9333EA`（紫）。對比均 ≥ 4.5:1

愛心收藏按鈕（純 UI，點擊 handler 由 #30c 注入）:
- L 卡位置: `top: 12px; right: 80px`（避開房仲頭像），M 卡: `top: 8px; right: 8px`
- 尺寸: 36x36px 圓形白色半透明背景 `rgba(255,255,255,0.9)`
- Icon: 空心愛心 SVG 20x20，hover 填充 `#E63946`
- 觸控: min 44px hit area
- `aria-label="收藏{社區名}"`（動態帶入社區名稱，ref: ux-guidelines #40）

L/M 卡 focus-visible: `outline: 2px solid #00385a; outline-offset: 2px`（鍵盤焦點環，ref: ux-guidelines #28）。愛心按鈕/搜尋按鈕同規格。快捷 pills: `focus-visible:ring-2 focus-visible:ring-[#00385a]/50`

L/M 卡 hover: `box-shadow: 0 4px 16px rgba(0,56,90,0.12); transition: box-shadow 200ms ease`

L/M 卡圖片 alt: `alt="{社區名}—{標題}"`（動態帶入，ref: ux-guidelines #38）。S 卡縮圖: `alt="{社區名}"`

L/M 卡圖片 lazy loading: `loading="lazy"`（ref: ux-guidelines #47）。例外：精選推薦區前 2 張 L 大卡為 above-fold，使用 `loading="eager"`

L/M 卡防禦性截斷: 標題 `-webkit-line-clamp: 2`、地址 `text-overflow: ellipsis` 單行、缺圖 fallback `background: #E6EDF7` + 房子 SVG 佔位

**Schema 擴充**（`src/types/property-page.ts`）：
- `agent: { name: string; company: string; title: string; avatarUrl: string }`
- `scarcityTag: '剛上架' | '熱門關注' | '本週新增' | '多人收藏' | null`
- `tier: 'L' | 'M' | 'S'`

**seed 擴充**（`src/features/property/data/seed.ts`）：
- 現有 6 筆 PROPERTIES 補充 agent 物件
- 新增 5 筆（竹北高鐵/台中七期/林口三井/桃園藝文/新莊副都心）
- 共 11 筆，每筆含 tier/agent/scarcityTag/badge

**Props 設計原則**：
- 愛心收藏：`onFavoriteClick?: (id: string) => void`、`isFavorited?: boolean`（handler 由父組件或 #30c 注入）
- 評價鎖定：`reviews: Review[]`、`maxVisibleReviews?: number`、`onLockedClick?: () => void`（鎖定邏輯由 #30c 控制）
- 卡片本身為**純展示組件**，不直接 import usePageMode / useModeAwareAction

**驗收**：
- [ ] PremierCard 渲染正確（Premier badge、房仲頭像 56px、左邊框 4px）
- [ ] StandardCard 渲染正確（水平布局、房仲頭像 40px、分隔線）
- [ ] CompactCard 渲染正確（60px 縮圖、單行）
- [ ] Schema property-page.ts 型別完整（agent/scarcityTag/tier）
- [ ] seed.ts 11 筆資料完整且 deepFreeze
- [ ] 星級顏色 `#FBB424`
- [ ] L/M 卡圖片 `alt="{社區名}—{標題}"` 動態帶入
- [ ] S 卡縮圖 `alt="{社區名}"` 動態帶入
- [ ] 愛心按鈕 `aria-label="收藏{社區名}"` 動態帶入
- [ ] L/M 卡 `focus-visible: outline 2px solid #00385a`
- [ ] 列表區卡片圖片 `loading="lazy"`，精選區 L 卡 `loading="eager"`
- [ ] 響應式卡片：375 / 768 / 1024
- [ ] npm run gate 通過

---

### #30b PropertyListPage MaiMai React 組件 + 動畫

**目標**：Hero wave + CTA celebrate 的 MaiMai 以 React 組件實作，
使用現有 `MaiMaiBase` + IntersectionObserver

**依賴**：#30a（Hero/CTA 區塊容器須先存在）

**新增**：

| 檔案 | 說明 |
|------|------|
| `src/pages/Property/components/PropertyHeroMaiMai.tsx` | Hero 區 MaiMai wave（復用 MaiMaiBase） |
| `src/pages/Property/components/PropertyCtaMaiMai.tsx` | CTA 區 MaiMai celebrate（復用 MaiMaiBase） |
| `src/pages/Property/hooks/useScrollTriggered.ts` | IntersectionObserver 封裝（scroll 觸發動畫） |

**實作方式**：復用 `src/components/MaiMai/MaiMaiBase.tsx`，
通過 `mood` prop 控制 wave/celebrate。不需要手動畫 SVG path。

**MaiMai 角色分配（2 處，符合 ux-guidelines #7 每視圖 max 1-2 動畫）**：

| 位置 | Mood | 尺寸 | 角色 |
|------|------|------|------|
| Hero 搜尋區右側 | wave | 120x144px（桌面）80x96px（手機居中） | 引導角色：對話氣泡「找房子？讓鄰居告訴你真相」|
| CTA 區 | celebrate | 120x144px（白色） | 慶祝角色：鼓勵註冊解鎖評價 |

> ~~卡片 hover MaiMai 彩蛋~~ 已移除：違反 ux-guidelines #7（每視圖 max 1-2 動畫）和 #11（hover 在觸控裝置無效）

**MaiMai 三模式差異**：

| 元素 | visitor | demo | live |
|------|---------|------|------|
| Hero MaiMai wave | 氣泡 3 句（含「免費註冊解鎖」） | 氣泡 3 句（第 3 句改「正在體驗演示模式」） | 氣泡 2 句（移除註冊引導） |
| CTA MaiMai celebrate | 顯示 + confetti | 顯示（文案不同） | 顯示（文案不同） |
| count-up 數字 | seed 固定 | seed + count-up | API + count-up |

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
| wave 手臂揮動 | `@keyframes wave-arm { 0%,100% { rotate(0) } 25% { rotate(-20deg) } 75% { rotate(20deg) } }` | 右手臂循環揮動，transform-origin 在肩膀。**限制**：僅 viewport 內播放，離開視窗後 `animation-play-state: paused`（ref: ux-guidelines #12 連續動畫限 loading，此為裝飾性例外，以 viewport 限制降低干擾）|
| wave 揮手圈 | `@keyframes wave-circle { 0%,100% { opacity:0.2 } 50% { opacity:0.6 } }` | 揮手時的波紋效果 |
| celebrate jump | `@keyframes jump { 0%,100% { translateY(0) } 30% { translateY(-20px) } 50% { translateY(-25px) } }` | 跳躍，**一次性播放**非循環 |
| confetti | `@keyframes confetti-fall` | 紙花下落，**一次性播放** |
| antenna wiggle | `@keyframes wiggle` | 天線搖擺 |
| count-up | React `useScrollTriggered` | Hero 副標「2,847」數字從 0 滾動到目標值 |
| reduced-motion | `@media (prefers-reduced-motion: reduce) { * { animation: none !important } }` | 停止所有動畫（`!important` 為無障礙業界慣例，屬 CONVENTIONS §十一.5 例外）|

**MaiMai 互動規格**：

1. **Hero MaiMai scroll-triggered 入場**：
   - `useScrollTriggered` 偵測 Hero MaiMai 容器進入視窗
   - 入場動畫：`scale(0) → scale(1)` 0.4s ease-out + 對話氣泡 `opacity(0) → opacity(1)` 0.3s delay 0.3s
   - 入場完成後才啟動手臂 wave 循環
   - 只觸發一次（`{ once: true }`）

2. **Hero MaiMai 點擊氣泡切換**：
   - 點擊 MaiMai → 氣泡文字循環切換（觸控友好，44px+ hit area）
   - 3 句循環（visitor）：「找房子？讓鄰居告訴你真相」→「已有 2,847 位鄰居分享心得」→「免費註冊解鎖所有評價」
   - 切換動畫：fade-out 0.15s → 換文字 → fade-in 0.15s
   - 切換時觸發天線 wiggle 一次（0.6s）

3. **CTA MaiMai scroll-triggered 入場**：
   - `useScrollTriggered` 偵測 CTA MaiMai 容器進入視窗
   - 入場觸發 **一次性** `animate-jump` + confetti 爆發
   - 結束後靜止在 celebrate 姿勢，不循環
   - 只觸發一次

4. **CTA MaiMai 點擊 re-celebrate**：
   - 點擊 → 再次觸發 confetti 爆發 + jump 一次
   - 節流 2 秒（防連點）

**驗收**：
- [ ] 使用現有 MaiMaiBase 組件（非手動 SVG）
- [ ] IntersectionObserver 正確觸發入場動畫
- [ ] prefers-reduced-motion 停止所有動畫
- [ ] wave 循環動畫離開 viewport 後 paused
- [ ] 三模式 MaiMai 氣泡文案正確切換
- [ ] npm run gate 通過

---

### #30c PropertyListPage 三模式互動（愛心收藏 + 評價鎖定 + ModeBreakBlock）

**目標**：為 #30a2 的卡片組件接入三模式互動邏輯（愛心收藏/評價鎖定/模式中斷區塊），
全部使用 useModeAwareAction + usePageMode

**依賴**：#30a2（卡片組件須先存在）、#1b（useModeAwareAction）

**修改**：

| 檔案 | 動作 |
|------|------|
| `src/features/property/components/PremierCard.tsx` | 接入三模式：愛心收藏 + 評價鎖定 |
| `src/features/property/components/StandardCard.tsx` | 接入三模式：愛心收藏 + 評價鎖定 |
| `src/features/property/components/CompactCard.tsx` | 基本渲染（無評價、無愛心） |
| `src/pages/Property/components/ModeBreakBlock.tsx` | visitor CTA（usePageMode 驅動） |
| `src/pages/Property/components/ListingSection.tsx` | M 卡 #4~#5 間插入 ModeBreakBlock |

**Seed 資料來源**：
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

**愛心收藏三模式**（`useModeAwareAction`）：

| mode | 行為 |
|------|------|
| visitor | toast 引導註冊（「登入後即可收藏房源」） |
| demo | 本地 toggle（`useState<Set<string>>`，重新整理消失） |
| live | API 收藏（暫與 demo 相同，待收藏 API 工單） |

**評價鎖定三模式**：

| mode | 可見評價數 | 鎖定 UI |
|------|-----------|---------|
| visitor | 2 則 | 第 3 則起 blur + LockedOverlay |
| demo | 全部（seed） | 無鎖定 |
| live | 全部（API） | 無鎖定 |

**模式中斷區塊**（`ModeBreakBlock`）：
- visitor：M 卡 #4 與 #5 之間顯示 CTA（「免費註冊解鎖全部評價」+ MaiMai thinking）
- demo/live：不渲染（`return null`）
- 只插入一次

**分頁**：
- 列表底部「查看更多房源」按鈕
- 點擊觸發 React 分頁邏輯（載入更多 seed/API 數據）

**驗收**：
- [ ] L×2 + M×6 + S×3 = 11 張卡片全部渲染
- [ ] visitor：愛心點擊觸發註冊引導 toast
- [ ] visitor：評價只顯示 2 則 + LockedOverlay
- [ ] visitor：ModeBreakBlock 在 M 卡 #4~#5 間顯示
- [ ] demo：愛心本地 toggle、評價全解鎖、無 ModeBreakBlock
- [ ] live：愛心本地 toggle（暫）、評價全解鎖、無 ModeBreakBlock
- [ ] 稀缺性標籤顯示正確
- [ ] 星級顏色 `#FBB424`
- [ ] npm run gate 通過

**`/ui-ux-pro-max` 規範合規摘要（#30a/#30b/#30c 共用）**：

已逐條檢查以下 CSV：
- **ux-guidelines.csv**: #7 動畫 max 1-2（Hero+CTA 合規）、#9 reduced-motion、#11 hover→onClick、#12 連續動畫（wave viewport 限制）、#22 touch 44px、#28 focus ring（全互動元素 focus-visible）、#38 alt text（L/M/S 卡動態 alt）、#40 aria-label（搜尋按鈕+愛心按鈕）、#47 lazy loading（列表卡片 lazy / 精選 eager）
- **react.csv**: React 組件拆分、Tailwind class 統一、usePageMode 三模式驅動、#39 ErrorBoundary（頂層包裹 6 區塊）
- **CONVENTIONS §5.3**: Loading skeleton / Error 回退 / Empty 空狀態三態完整
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
11. 補圖片 `srcset`（React `<img>` 響應式）
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
- [ ] 語意 React 組件: header/nav/main/section/article/footer
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
