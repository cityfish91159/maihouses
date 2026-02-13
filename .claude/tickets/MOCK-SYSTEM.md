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

- [ ] **#4a** 房產詳情頁：移除 `isDemoPropertyId` 改用 usePageMode（5 檔）
- [ ] **#4b** 房產詳情頁：社區牆 + 註冊查看連結修正（2 檔）
- [ ] **#5a** UAG：訪客 Landing Page + 角色守衛（1 新檔案 + App.tsx）
- [ ] **#5b** UAG：移除 `uagModeStore`，改用 usePageMode（6 檔）
- [ ] **#6a** Feed：Logo 導航修復 + 廢棄路由清理（3 檔）
- [ ] **#6b** Feed：移除 `DEMO_IDS` + 新增 `/feed/demo` 路由（4 檔）
- [ ] **#7** 登入後重定向 — agent→UAG、consumer→首頁（auth.html）

### P1 — 跨頁面

- [ ] **#12** 首頁 Header 接入 useAuth + 三模式 UI（Header.tsx + GlobalHeader.tsx）
- [ ] **#13** PropertyListPage Header 統一（LegacyHeader → Header）

### P1 — 程式碼品質

- [x] **#17** `src/lib/error.ts` 統一錯誤處理工具（1 新檔案 + 17 測試）✅ 2026-02-12
- [x] **#18** 3 檔 catch 改用 `getErrorMessage()`（config / track / MaiMaiContext）✅ 2026-02-13
- [x] **#19** [P1] 砍舊路徑：前端 `tracker` 由 `/api/uag-track` 切到 `/api/uag/track`，下線 deprecated JS 版 ✅ 2026-02-12
- [ ] **#20** 整合分散 Mock Data + seed 不可變 `Object.freeze`（10+ 檔）
- [ ] **#28** 已完成工單防禦強化 — Zod 收緊 + SSR guard + `as` 斷言消除（5 檔）
- [ ] **#29** 跨裝置三模式驗證修復 — iOS Safari + 手機版 + 私隱模式（12 檔）

### P1 — 社區牆三模式（極限測試升級）

- [ ] **#8a** 社區牆：`useEffectiveRole` hook + 按讚改用 useModeAwareAction + **demo mode 完全未接入**（2 檔）⚠️ P2→P1 升級
- [ ] **#8b** 社區牆：發文/留言本地化 + LockedOverlay/BottomCTA 引導修正（3 檔）

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
                       ├→ #12 Header 三模式
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
#12 Header ────────────→ #26 登出清理
#1a + #10b + #14b ─────→ #29 跨裝置驗證修復
```

## 施工順序

| 波次 | 工單 | 說明 |
|------|------|------|
| Wave 0 ✅ | #17、#19 | 基礎工具（已完成）|
| Wave 1 | #1a ✅、#1b ✅、#14a ✅、#15 ✅、#18 ✅ | 核心 hook + authUtils |
| Wave 1B | #1c、#14b | DemoGate + useRegisterGuide |
| Wave 2 | #2、#3、#5a、#12、#20 | 可平行 |
| Wave 3 | #4a、#4b、#5b、#6a、#6b、#7、#8a、#27 | 逐頁接入（#8a 升 P1 併入）|
| Wave 3B | #8b | 依賴 #8a |
| Wave 4 | #9、#10a、#13、#16、#21、#22、#23 | 收尾清理 |
| Wave 4B | #10b、#24、#25、#29 | 退出清理 + Chat/Assure + 跨裝置修復 |
| Wave 4C | #26 | 登出清理（依賴 #12 + #10b）|
| Wave 5 | #11 | 產品方向確認 |

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

### #1b `useModeAwareAction` + cache key 規範

**目標**：統一「本地操作不寫 DB」+ React Query cache key 含 mode

**依賴**：#1a

**新增**：`src/hooks/useModeAwareAction.ts`

```typescript
function useModeAwareAction<T>(handlers: {
  visitor: (data: T) => void | Promise<void>
  demo: (data: T) => void | Promise<void>
  live: (data: T) => void | Promise<void>
}) {
  const mode = usePageMode()
  return async (data: T): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      await handlers[mode](data)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: getErrorMessage(error) }
    }
  }
}
```

**cache key 修改清單**：

| Hook | 現有 key | 改為 |
|------|---------|------|
| `useCommunityWallQuery` | `communityWallKeys.wall(id, private)` | 加 mode |
| `useCommunityReviewLike` | `reviewLikeQueryKey(propId)` | 加 mode |
| `useAgentReviews` | `['agent-reviews', agentId, ...]` | 加 mode |
| `useAgentProfile` (UAG) | `['agentProfile', userId, useMock]` | `['agentProfile', mode, userId]` |
| `useUAGData` | `[UAG_QUERY_KEY, useMock, userId]` | `[UAG_QUERY_KEY, mode, userId]` |
| `getFeaturedHomeReviews` | `['featured-reviews']` | `['featured-reviews', mode]` |

**本地操作持久化**：全部存 React state（重新整理消失），唯一例外 Feed RoleToggle 存 sessionStorage。

**驗收**：
- `useModeAwareAction` 正確派發三模式
- 所有 queryKey 含 mode
- `grep -r "queryKey.*\[" src/hooks/ --include="*.ts"` 確認

#### 2026-02-13 尾差修復（#1b 收斂）

**摘要**

- [x] UAG 頁面快取 key 對齊 `uagDataQueryKey(mode, userId)`，移除舊 `['uagData', useMock, userId]`
- [x] AssetMonitor 與購買後發訊息流程的 `setQueryData` 全部改用 mode-aware key
- [x] UAG 發文後 `invalidateQueries` 改為 mode-aware key，避免跨模式快取污染
- [x] #1b 工單完成紀錄與驗證結果補齊

**本次修改**

1. `src/pages/UAG/index.tsx`
   - 新增 `resolveUAGQueryMode` / `uagDataQueryKey` 匯入，集中產生 `uagCacheKey`。
   - 2 處 `queryClient.setQueryData` 改為 `queryClient.setQueryData(uagCacheKey, ...)`。
   - `handleCreatePost` 的 `invalidateQueries` 改為 `queryKey: uagCacheKey`。
2. `.claude/tickets/MOCK-SYSTEM.md`
   - 補登 #1b 尾差收斂內容（摘要 / 施工紀錄 / 驗證）。

**收斂驗證**

- [x] `npm run test -- src/hooks/__tests__/useModeAwareAction.test.tsx src/pages/UAG/hooks/__tests__/useUAG.test.ts src/pages/UAG/index.test.tsx`
- [x] `npm run check:utf8`
- [x] `npm run gate`
- [x] `rg -n "\\['uagData'\\s*,\\s*useMock|queryKey:\\s*\\['uagData'" src/pages/UAG` 無結果

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

**目標**：消滅 `community-wall_mvp.html` 死路，統一導向 React 社區牆路由

**依賴**：無（已定值 `SEED_COMMUNITY_ID`）

**摘要**

- [x] 新增 `SEED_COMMUNITY_ID` 並集中管理，消除硬編碼
- [x] 首頁 `CommunityTeaser` 的 seed 卡片與「查看更多」改走 React 路由
- [x] `Header` 社區評價入口（手機選單 + 膠囊）改走 React 路由
- [x] `CommunityWallCard` 靜態 HTML 連結改走 React 路由
- [x] `PropertyDetail/CommunityReviews` 前往社區牆改為動態路由（無 id 時 fallback `SEED_COMMUNITY_ID`）
- [x] 移除 `ROUTES.COMMUNITY_WALL_MVP`

**本次修改**

1. `src/constants/seed.ts`（新增）
   - 新增 `SEED_COMMUNITY_ID = 'test-uuid'`（`Object.freeze` 防止意外修改）。
2. `src/features/home/sections/CommunityTeaser.tsx`
   - 移除 `SEED_REVIEWS_URL = '/maihouses/community-wall_mvp.html'`。
   - 點擊 seed 評價與「查看更多真實住戶評價」統一改為 `navigate('/community/${SEED_COMMUNITY_ID}/wall')`。
   - 「查看更多」由 `<a>` 改為 `<button>`，避免靜態 HTML 導流。
3. `src/components/Header/Header.tsx`
   - `ROUTES.COMMUNITY_WALL_MVP` 改為 `ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)`。
4. `src/features/home/components/CommunityWallCard.tsx`
   - `communityWallUrl` 改為 `ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)`。
5. `src/components/PropertyDetail/CommunityReviews.tsx`
   - `handleCommunityWall` 改為 `ROUTES.COMMUNITY_WALL(communityId ?? SEED_COMMUNITY_ID)`。
6. `src/constants/routes.ts`
   - 移除 `COMMUNITY_WALL_MVP` 常數。
7. `src/features/home/sections/__tests__/CommunityTeaser.test.tsx`
   - seed 評價導向測試改為驗證 `mockNavigate('/community/test-uuid/wall')`。

**驗證結果**

- [x] `rg -n "COMMUNITY_WALL_MVP|community-wall_mvp" src` 無結果
- [x] `npm run test -- src/features/home/sections/__tests__/CommunityTeaser.test.tsx src/components/Header/Header.demoGate.integration.test.tsx` 通過
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過

---

### #3 按讚三模式行為分離

**目標**：按讚用 `useModeAwareAction`，移除 `disabled={!isLoggedIn}`

**依賴**：#1a、#1b

**核心**：Mode guard 在 auth guard 之前
```
visitor → showRegisterGuide()    ← 最先攔截
demo    → setLocalLikes(toggle)
live    → likeMutation.mutate()  ← auth guard 只在這裡
```

| 檔案 | 行號 | 改動 |
|------|------|------|
| `CommunityReviews.tsx` | 250-269 | `handleToggleLike` → `useModeAwareAction` |
| `CommunityReviews.tsx` | 310 | 移除 `disabled={!isLoggedIn}` |
| `CommunityReviews.tsx` | 313-318 | 移除 `cursor-not-allowed` 條件樣式 |
| `CommunityReviews.tsx` | 358-369 | LockedOverlay `onCtaClick` 由父組件注入（DIP） |
| `AgentReviewListModal.tsx` | 60, 71-77 | 移除獨立 isDemo 判斷 → usePageMode |

另：`useComments.ts` 的 `toggleLike` 缺 `isLiking` debounce（live 模式快速連點會重複 API），施工時一併補 guard。

**驗收**：`grep -r "disabled={!isLoggedIn}" src/` 回傳 0 筆

#### 2026-02-13 #3 收斂（mode guard 優先）

**摘要**

- [x] `CommunityReviews` 按讚改用 `useModeAwareAction`，visitor 先行攔截註冊引導
- [x] `CommunityReviews` 移除 `disabled={!isLoggedIn}` 與 `cursor-not-allowed` 條件樣式
- [x] `LockedReviewCard` CTA 改為 `onCtaClick` 由父層注入（DIP）
- [x] `AgentReviewListModal` 移除 agentId 推斷 demo，改由 `usePageMode()` 決定 mock/live
- [x] `useComments.toggleLike` 補 `inFlightLikeIdsRef` 防重入 guard，避免快速連點重複 API

**本次修改**

1. `src/components/PropertyDetail/CommunityReviews.tsx`
   - 匯入 `useModeAwareAction`、`usePageMode`、`notify`，將按讚改為三模式派發。
   - visitor：toast 引導註冊；demo：本地 toggle；live：保留 mutation 呼叫（auth guard 只在 live 分支）。
   - 移除 Like 按鈕 `disabled={!isLoggedIn}` 與 `cursor-not-allowed` 條件樣式。
   - `LockedReviewCard` 介面從 `onAuthRedirect` 改為 `onCtaClick`，由父層注入 CTA 行為。
2. `src/hooks/useCommunityReviews.ts`
   - demo 模式停止 API fetch，統一走 mock reviews。
   - 本地按讚覆蓋改為 `localLikeOverrides`，確保 demo 互動不寫 DB。
3. `src/components/AgentReviewListModal.tsx`
   - 移除 agentId 的 demo 推斷邏輯，改由 `usePageMode()` 控制是否使用 mock reviews。
4. `src/hooks/useComments.ts`
   - 新增 `inFlightLikeIdsRef`，同一留言在 API 進行中時忽略重入點擊。
5. 測試調整
   - `src/components/PropertyDetail/__tests__/CommunityReviews.test.tsx`
   - `src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx`
   - `src/components/__tests__/AgentReviewListModal.test.tsx`

**收斂驗證**

- [x] `npm run test -- src/components/PropertyDetail/__tests__/CommunityReviews.test.tsx src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx src/components/__tests__/AgentReviewListModal.test.tsx src/hooks/__tests__/useComments.raceCondition.test.ts` 通過（28 tests）
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過
- [x] `rg -n "disabled={!isLoggedIn}" src/components/PropertyDetail/CommunityReviews.tsx` 無結果
- [ ] `rg -n "disabled={!isLoggedIn}" src` 尚餘 2 筆（`src/components/Feed/FeedPostCard.tsx`、`src/pages/Community/components/PostsSection.tsx`），歸 #6b / #8b 施工

---

### #4a 房產詳情頁：移除 `isDemoPropertyId`

**目標**：消除雙重 demo 偵測（`isDemoPropertyId` vs `isDemoMode`），統一用 `usePageMode()`

**依賴**：#1a

| 檔案 | 行號 | 改動 |
|------|------|------|
| `src/constants/property.ts` | 1-4 | 移除 `DEMO_PROPERTY_ID` + `isDemoPropertyId()` |
| `propertyService.ts` | 5, 366 | 移除 import + `isDemo` 判斷 |
| `PropertyDetailPage.tsx` | 29, 127, 249, 292-294, 679-713, 774-785, 813 | 全部改 mode 判斷 |
| `AgentReviewListModal.tsx` | 60, 71-77 | 移除獨立 isDemo 判斷 |
| `PropertyDetailPage.tsx` | 294 | `window.location.href = '/maihouses/assure?mock=true'` 繞過三模式 → 改用 `usePageMode()` |
| `PropertyDetailActionLayer.tsx` | 86 | mode 判斷 isVerified |
| `AgentTrustCard.tsx` | interface | 移除 `isDemo?` prop → 內部用 `usePageMode()` |
| `usePropertyTracker.ts` | 92 | `isDemo` 一次性計算非 reactive → 改用 `usePageMode()` 即時判斷 |

**驗收**：`grep -r "isDemoPropertyId" src/` 回傳 0 筆

---

### #4b 房產詳情頁：連結修正

**目標**：詳情頁靜態 HTML 連結改 React 路由

**依賴**：#15

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `CommunityReviews.tsx` | 247 | `community-wall_mvp.html` | `/community/{id}/wall` |
| `CommunityReviews.tsx` | 243 | `auth.html?mode=login` | `showRegisterGuide()` 或 `getAuthUrl()` |
| `CommunityWallCard.tsx` | 70 | `community-wall_mvp.html` | `/community/{id}/wall` |

**驗收**：詳情頁相關檔案搜尋 `community-wall_mvp` 和 `auth.html` 回傳 0 筆

---

### #5a UAG：訪客 Landing Page + 角色守衛

**目標**：訪客看產品介紹，consumer 被導回首頁

**新增**：`src/pages/UAG/UAGLandingPage.tsx`

```
visitor                    → UAGLandingPage（功能介紹 + 截圖 + 「成為合作房仲」CTA）
demo                       → 現有 UAG 後台（seed）
live + agent               → 現有 UAG 後台（API）
live + consumer            → 「僅限合作房仲」→ 引導回首頁
```

**驗收**：訪客進 `/uag` 看不到任何 mock 資料

---

### #5b UAG：移除 `uagModeStore` + usePageMode

**目標**：消除 Zustand store 手動 mock/live toggle

**依賴**：#1a、#1b、#5a

| 檔案 | 改動 |
|------|------|
| `src/stores/uagModeStore.ts` | 整個移除 |
| `useUAGData.ts` | `useUAGModeStore` → `usePageMode()` |
| `useAgentProfile.ts` | `useMock` → `mode === 'demo'` |
| `TrustFlow/index.tsx` | `selectUseMock` → `usePageMode()` |
| `UAG/Profile/index.tsx` | `?mock=true` → `usePageMode()` |
| `Profile/hooks/useAgentProfile.ts` | mock 判斷 → mode |

**驗收**：`grep -r "uagModeStore\|selectUseMock" src/` 回傳 0 筆

---

### #6a Feed：Logo 導航 + 廢棄路由

**目標**：修復 Feed Logo 死路

**依賴**：#15

| 檔案 | 行號 | 改動 |
|------|------|------|
| `GlobalHeader.tsx` | 109-115 | Logo → `ROUTES.HOME` |
| `GlobalHeader.tsx` | 283 | `auth.html` → `getAuthUrl()` |
| `PrivateWallLocked.tsx` | 23 | 同上 |
| `routes.ts` | 16, 19, 22, 25 | 移除 `FEED_AGENT` / `FEED_CONSUMER` / legacy |

**驗收**：`grep -r "FEED_AGENT\|FEED_CONSUMER" src/` 回傳 0 筆

---

### #6b Feed：移除 `DEMO_IDS` + usePageMode

**目標**：消除 `DEMO_IDS` 白名單（完全繞過 usePageMode）

**依賴**：#1a、#1b

| 檔案 | 行號 | 改動 |
|------|------|------|
| `Feed/index.tsx` | 19 | 移除 `DEMO_IDS` 定義 |
| `Feed/index.tsx` | 30-32 | `isDemo`/`forceMock` → `usePageMode()` |
| `Feed/index.tsx` | 40-50, 84-87 | forceMock 分支 → mode 分支 |
| `FeedPostCard.tsx` | 110 | 移除 `disabled={!isLoggedIn}` |
| `useFeedData.ts` | 139, 183 | `useMock` → mode |

新增路由 `/feed/demo`（演示入口），`/feed/demo-:id` 舊 URL 301 → `/feed/demo`（`vercel.json`，歸 #9）。

已登入用戶進 `/feed/demo` → 重定向到 `/feed/{realUserId}`。
演示到期後 → `useDemoTimer` 改用 `location.replace('/')` 帶回首頁。

**驗收**：`grep -r "DEMO_IDS" src/` 回傳 0 筆

---

### #7 登入後重定向

**目標**：agent→UAG、consumer→首頁

**檔案**：`public/auth.html` :1620-1660

```javascript
function successRedirect(user) {
  try { localStorage.removeItem('mai-demo-verified') } catch {}
  const returnPath = getSafeReturnPath()
  if (returnPath) { go(returnPath); return }
  if (user.user_metadata?.role === 'agent') go('/maihouses/uag')
  else go('/maihouses/')
}
```

**驗收**：agent→UAG、consumer→首頁、localStorage 無 `mai-demo-verified` 殘留

---

### #8a [P1] 社區牆權限重構（P2→P1 升級）

**目標**：抽 `useEffectiveRole` hook + 按讚改 `useModeAwareAction`

**升級原因**：Wall.tsx `handleLike` 的 `if (!isAuthenticated)` 完全阻斷 demo 互動

**依賴**：#1a、#1b

**新增**：`src/hooks/useEffectiveRole.ts`

```typescript
function useEffectiveRole(urlRole?: Role): Role {
  const mode = usePageMode()
  const { role: authRole, isAuthenticated, loading } = useAuth()
  if (loading) return 'guest'
  if (mode === 'demo') return 'resident'
  if (import.meta.env.DEV && urlRole && urlRole !== 'guest') return urlRole
  return isAuthenticated ? authRole : 'guest'
}
```

| 檔案 | 行號 | 改動 |
|------|------|------|
| `Wall.tsx` | 80-81, 122-128 | 改用 `useEffectiveRole()` |
| `Wall.tsx` | 241-256 | `handleLike` → `useModeAwareAction`（mode guard 在 auth guard 前）|
| `Wall.tsx` | 258-261 | `handleUnlock` → `showRegisterGuide()` |

**驗收**：演示模式下社區牆全部可見、按讚可本地 toggle

---

### #8b 社區牆互動本地化

**目標**：發文/留言本地化 + LockedOverlay/BottomCTA 引導

**依賴**：#8a、#14b、#15

| 檔案 | 行號 | 改動 |
|------|------|------|
| `PostsSection.tsx` | 279 | 移除 `disabled={!isLoggedIn}` → `useModeAwareAction` |
| `BottomCTA.tsx` | 32 | `auth.html` → `getAuthUrl()` |
| LockedOverlay | CTA | `onCtaClick` 由父組件注入 |

**驗收**：社區牆搜尋 `auth.html` 回傳 0 筆

---

### #9 移除靜態 HTML mock 頁

**目標**：清理靜態 HTML 殘留

**前置**：#2、#6 完成

| 檔案 | 動作 |
|------|------|
| `public/community-wall_mvp.html` | 移除 |
| `public/maihouses/community-wall_mvp.html` | 移除 |
| `public/feed-agent.html` | 移除 |
| `public/feed-consumer.html` | 移除 |
| `vercel.json` | 同步 rewrite + 新增 301（`/feed/demo-:id` → `/feed/demo`）|

---

### #10a `DemoBadge.tsx` 浮動標籤

**目標**：演示模式右下角「演示模式」浮動標籤 + 退出按鈕

**依賴**：#1a

**新增**：`src/components/DemoGate/DemoBadge.tsx`

App.tsx 根據 `mode === 'demo'` 條件渲染。

**手機版定位**：`lg:hidden` 時 `bottom-[calc(80px+env(safe-area-inset-bottom,20px))]`，避免遮擋 Feed MobileActionBar（`Consumer.tsx:72`）。桌面版照常右下角。

UI 設計需 `/ui-ux-pro-max`。

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

### #11 Feed 定位確認

**待決策**：Feed 是「登入後首頁」還是「獨立社群功能」？決定後展開。

---

### #12 首頁 Header 接入 useAuth

**目標**：已登入看個人化 Header

| mode | Header 行為 |
|------|-----------|
| visitor | 登入/註冊按鈕 |
| demo | 隱藏登入/註冊 |
| live | 頭像/帳號 + 下拉選單 |

需同步修正 `GlobalHeader.tsx`。UI 設計需 `/ui-ux-pro-max`。

---

### #13 PropertyListPage Header 統一

**目標**：`LegacyHeader` → 統一 `<Header />`

**檔案**：`src/pages/PropertyListPage.tsx` :75-104

統一後自動繼承 #12 三模式行為。

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

**目標**：統一 auth 跳轉

**新增**：`src/lib/authUtils.ts`

```typescript
function getAuthUrl(
  mode: 'login' | 'signup',
  returnPath?: string,
  role?: 'agent' | 'consumer'
): string {
  const url = new URL('/maihouses/auth.html', window.location.origin)
  url.searchParams.set('mode', mode)
  if (returnPath) url.searchParams.set('return', returnPath)
  if (role) url.searchParams.set('role', role)
  return url.toString()
}
```

**規則**：禁止 `navigate()` 導向 `auth.html`，統一 `window.location.href = getAuthUrl(...)`

**驗收**：`grep -r "navigate.*auth\.html" src/` 回傳 0 筆

#### 修改檔案

1. `src/lib/authUtils.ts`（新增）
   - `getAuthUrl()` / `getLoginUrl()` / `getSignupUrl()` / `navigateToAuth()` / `getCurrentPath()`
   - 型別：`AuthMode` / `AuthRole` / `AuthUrlParams`

2. `src/lib/__tests__/authUtils.test.ts`（新增）
   - 18 tests：正常流程、邊界條件、型別安全

3. `src/components/TrustManager.tsx`
   - L257：`href` 改用 `getLoginUrl('/maihouses/trust')`

4. `src/components/layout/GlobalHeader.tsx`
   - L12：新增 `useLocation` import
   - L66：新增 `loginUrl` 變數
   - L283：`href` 改用 `{loginUrl}`

5. `src/components/PropertyDetail/CommunityReviews.tsx`
   - L2：移除 `useNavigate`，新增 `useLocation`
   - L167：移除 `navigate`，新增 `location`
   - L243-248：`navigate()` 改為 `window.location.href`

6. `src/pages/Chat/index.tsx`
   - L2：新增 `useLocation` import
   - L15：新增 `location`
   - L33：新增 `loginUrl` 變數
   - L62：`href` 改用 `{loginUrl}`

7. `src/pages/Community/components/BottomCTA.tsx`
   - L7：新增 `useLocation` import
   - L19：新增 `location`
   - L29：新增 `signupUrl` 變數
   - L32：改用 `signupUrl`

8. `src/pages/PropertyListPage.tsx`
   - Header 內部統一改用 `getLoginUrl(getCurrentPath())`
   - 移除 `auth.html?mode=*` 硬編碼
   - 不額外做 prop drilling，`LegacyHeader` 保持單一職責

#### 驗證結果

```bash
npm run typecheck                              # 0 errors
npx vitest run src/lib/__tests__/authUtils.test.ts  # 27 tests passed
npm run gate                                   # QUALITY GATE PASSED
grep -r "navigate.*auth\.html" src/            # 0 matches (only in authUtils.ts comment)
```

#### 2026-02-13 補強紀錄（1b 對齊）

**目標**：補齊遺漏的 auth 跳轉入口，並加強 `authUtils` 防禦邏輯（SRP / Early Return / Fail Fast / Explicit）。

**本次修改**

1. `src/lib/authUtils.ts`
   - 新增 `normalizeReturnPath()` 與 `buildAuthSearchParams()`，拆分 URL 組裝責任。
   - 針對不安全 `returnPath`（非 `/` 開頭或 `//`）做 fail-fast 防禦，回退到 `/maihouses/`。
   - `window.location.origin` 無效時回退相對路徑，避免測試與特殊環境 `Invalid URL`。

2. `src/components/Composer/LoginPrompt.tsx`
   - `href={ROUTES.AUTH}` 改為 `getLoginUrl(currentPath)`，統一帶 `?return=`.

3. `src/components/Header/Header.tsx`
   - 四處 `auth.html?mode=*` 改為 `getLoginUrl/getSignupUrl`，移除硬編碼 query string。

4. `src/components/Feed/PrivateWallLocked.tsx`
   - `window.location.href = ROUTES.AUTH` 改為 `navigateToAuth('login')`。

5. `src/pages/Community/Wall.tsx`
   - 移除 `'/auth'` 舊路徑，錯誤態登入按鈕改走 `navigateToAuth('login')`。
   - 同步移除未使用的 `useNavigate`。

6. `src/lib/__tests__/authUtils.test.ts`
   - 新增不安全 `returnPath` 邊界測試、runtime fail-fast（無效 mode/role）測試與極限測試（超長路徑、非法 origin、非瀏覽器環境）。

7. `src/pages/Feed/__tests__/P7_ScenarioVerification.test.tsx`
   - 更新預期為新版 auth URL（含 `mode=login` + `return=`）。

**補強驗收**

- [x] `ROUTES.AUTH` 直接跳轉在 `src/` 清零（測試斷言除外）
- [x] `window.location.href = '/auth'` 清零
- [x] `authUtils` 邊界/極限測試通過（27 tests）
- [x] `P7_ScenarioVerification` 4 個情境測試通過
- [x] `npm run typecheck` 通過
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過

#### 2026-02-13 尾差修復（#15 收斂）

**摘要**

- [x] `src/pages/PropertyUploadPage.tsx` 的 `/auth` Link 改為 `getLoginUrl(getCurrentPath())`
- [x] `src/pages/Community/components/WallErrorBoundary.tsx` 的 `actionHref: '/auth'` 改為 `getLoginUrl(getCurrentPath())`
- [x] `src/` 直接 `'/auth'` 入口完成收斂（保留測試與 `public/` 舊頁）

**本次修改**

1. `src/pages/PropertyUploadPage.tsx`
   - 新增 `getCurrentPath` / `getLoginUrl` 匯入。
   - `登入同步` 連結由 `<Link to="/auth">` 改為 `<a href={loginUrl}>`，確保 auth.html 走完整導轉流程與 `?return=`。
2. `src/pages/Community/components/WallErrorBoundary.tsx`
   - 權限錯誤分類的 `actionHref` 改為 `getLoginUrl(getCurrentPath())`，移除舊 `/auth`。
   - 保留既有錯誤分類結構，僅替換登入導向策略。

**收斂驗證**

- [x] `rg -n "/auth" src` 僅剩測試字串與 import 路徑，不含直接登入入口
- [x] `npm run test -- src/lib/__tests__/authUtils.test.ts src/pages/Feed/__tests__/P7_ScenarioVerification.test.tsx` 通過
- [x] `npm run typecheck` 通過
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過

#### 2026-02-13 1c 一致化修復（#15 最終收斂）

**摘要**

- [x] `GlobalHeader` 登入 returnPath 生成改為統一使用 `getCurrentPath()`，移除手動字串組裝
- [x] 保持行為一致：仍會帶入 `pathname + search + hash`，但改由單一工具函式負責
- [x] #15 工單紀錄補齊 1c 施作與驗證結果

**本次修改**

1. `src/components/layout/GlobalHeader.tsx`
   - `getLoginUrl(\`${location.pathname}${location.search}${location.hash}\`)` 改為 `getLoginUrl(getCurrentPath())`。
   - 匯入由 `getLoginUrl` 擴充為 `getCurrentPath, getLoginUrl`。
   - 對齊 `Explicit over Implicit`：路徑拼接責任集中在 `authUtils`，避免分散實作。

**收斂驗證**

- [x] `npm run test -- src/lib/__tests__/authUtils.test.ts src/pages/Feed/__tests__/P7_ScenarioVerification.test.tsx` 通過
- [x] `npm run check:utf8` 通過（UTF-8 + Mojibake）
- [x] `npm run gate` 通過

---

### #16 全站 UTF-8/文案健康檢查

**目標**：清除亂碼/非預期 Unicode/emoji 混用，建立 CI 檢查

---

### #17 ✅ `src/lib/error.ts` 統一錯誤處理

**已完成** 2026-02-12

新增：`src/lib/error.ts`（`getErrorMessage` / `getErrorInfo` / `safeAsync` / `safeSync`）
測試：`src/lib/__tests__/error.test.ts`（17 tests passed）

---

### #18 ✅ 3 檔 catch 改用 `getErrorMessage()`

**已完成** 2026-02-13

**檔案**：`src/app/config.ts`、`api/uag/track.ts`、`src/context/MaiMaiContext.tsx`

**施工重點**：

1. `src/app/config.ts`
   - `localStorage` 讀取、遠端設定抓取、快取寫入三個 catch 全部統一為 `logger.warn/error + getErrorMessage(err)`。
   - 錯誤訊息改為繁中（台灣用語），符合 `CLAUDE.md` 語言規範。
2. `src/context/MaiMaiContext.tsx`
   - mood / messages 的 parse、save、reset catch 全部統一為 `logger.warn + getErrorMessage(e)`。
   - warning 訊息改為繁中，並同步更新測試斷言。
3. `api/uag/track.ts`
   - 新增 `getErrorMessage` 匯入，集中使用 `toErrorDetail()`。
   - `safeCaptureError` / `safeAddBreadcrumb` / request JSON parse / handler 與 wrapper catch 全部統一使用 `getErrorMessage()`。
   - 移除空 catch：`JSON.parse` 失敗時改為可觀測 `logger.warn` + 明確 `400 INVALID_INPUT`。
   - 保留原有 `SUPABASE_SERVICE_ROLE_KEY || VITE_SUPABASE_ANON_KEY` fallback，避免設定回歸。
   - 修正錯誤日誌為繁中訊息，對齊 CLAUDE 語言規範。
4. `api/uag/__tests__/track.test.ts`
   - 新增邊界測試：request body 為無效 JSON 字串時，應回 `400` 並記錄 parse warning。
   - 新增回歸測試：`SUPABASE_SERVICE_ROLE_KEY` 缺失時，應使用 `VITE_SUPABASE_ANON_KEY` fallback。
   - 新增極限測試：50 筆並發無效 JSON 請求，全部 fail-fast 回 `400` 且不觸發 RPC。

**驗收**：
- [x] 三個目標檔案 catch 全部採用 `getErrorMessage()` 統一錯誤訊息提取
- [x] `api/uag/track.ts` 不存在空 catch
- [x] `api/uag/__tests__/track.test.ts` 新增 JSON parse 邊界 + fallback 回歸 + 並發壓測
- [x] `src/context/__tests__/MaiMaiContext.test.tsx` 通過（13 tests）
- [x] `npm run gate` 通過
- [x] 相關測試通過

---

### #19 ✅ 砍舊路徑 `/api/uag-track`

**已完成** 2026-02-12

修改：`public/js/tracker.js`、`src/hooks/usePropertyTracker.ts`
移除：`api/uag-track.js`

---

### #20 整合分散 Mock Data

**目標**：`Object.freeze` 所有 seed，集中管理

---

### #21 全站 `console.log` → `logger`

**依賴**：#17、#18

---

### #22 Tailwind classnames 排序

---

### #23 React Hook 依賴陣列優化

---

### #24 Chat 三模式

**目標**：Chat 接入 `usePageMode()`

**檔案**：`src/pages/Chat/index.tsx`

| mode | 行為 |
|------|------|
| visitor | 顯示登入提示 |
| demo | 本地化聊天（React state）|
| live | 現有邏輯 |

---

### #25 Assure 三模式

**目標**：`isMock` → `usePageMode()`

**檔案**：`src/pages/Assure/Detail.tsx`

**驗收**：`grep -r "isMock" src/pages/Assure/` 回傳 0 筆

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

#### P2 — 可優化（歸入對應工單）

| # | 檔案 | 行號 | 問題 | 修復 | 歸屬 |
|---|------|------|------|------|------|
| 13 | `CommunityReviews.tsx` | 207 | 仍引用 `ROUTES.COMMUNITY_WALL_MVP` | 改 React 路由 | #2 |
| 14 | `FeedPostCard.tsx` | 110 | `disabled={!isLoggedIn}` 殘留 | useModeAwareAction | #3/#6b |
| 15 | `CommentList.tsx` | 184 | 同上 | 同上 | #3/#8b |
| 16 | `PostsSection.tsx` | 279 | 同上 | 同上 | #8b |
| 17 | `Wall.tsx` | 215-227 | 獨立 `StorageEvent` 重複 | 移除，用 `subscribeDemoModeStorageSync` | #8a |
| 18 | `PropertyUploadPage.tsx` | 80-86 | 同上 | 同上 | #5b |

**施工紀錄 2026-02-13**：

已完成 P0 全部（#1-4）+ P1 部分（#5-7, #12），共 8 項。

修改檔案：
1. `src/lib/safeStorage.ts` — 探測改 64 字元回讀驗證
2. `src/lib/pageMode.ts` — `setDemoMode` 回傳 boolean（回讀驗證）、`subscribeDemoModeStorageSync` 加 `visibilitychange`
3. `src/hooks/useDemoTimer.ts` — `||` → `&&`、加 `visibilitychange` 補償
4. `src/lib/authUtils.ts` — `origin === 'null'` 防禦
5. `src/app/config.ts` — SSR guard + `origin === 'null'` fallback
6. `src/lib/notify.ts` — `actionButtonStyle: { minHeight: 44, minWidth: 44 }`

驗證：
- [x] `npm run gate` 通過
- [x] `notify.test.ts` 13 tests 通過
- [x] `authUtils.test.ts` 27 tests 通過
- [x] `pageMode.test.ts` 13 tests 通過
- [x] `useDemoTimer.test.tsx` 3 tests 通過
- [x] `usePageMode.test.tsx` 4 tests 通過

未完成：P1 #8-11（CSS `100vh` → `dvh` + safe-area fallback）歸 Wave 4 施工。P2 歸各對應工單。

**驗收**：
- iOS Safari 私隱模式：DemoGate 觸發後正確進入演示
- iOS 背景分頁 30 秒後回前景：`useDemoTimer` 補償觸發
- 跨分頁同步：分頁 A 退出 → 分頁 B 即時反應
- `100vh` 無殘留：`grep -r "100vh" src/ --include="*.css" --include="*.module.css"` 回傳 0 筆
- `env(safe-area-inset-bottom)` 全部有 fallback

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
grep -r "isDemoPropertyId\|DEMO_PROPERTY_ID" src/       # Wave 3 後 0 筆
grep -r "community-wall_mvp" src/                        # #2 後 0 筆
grep -r "disabled={!isLoggedIn}" src/                    # #3/#8 後 0 筆
grep -r "navigate.*auth\.html" src/                      # #15 後 0 筆
grep -r "DEMO_IDS" src/                                  # #6b 後 0 筆
grep -r "uagModeStore\|selectUseMock" src/               # #5b 後 0 筆
grep -r "isMock" src/pages/Assure/                       # #25 後 0 筆
grep -r "usePageMode" src/pages/Chat/ src/pages/Assure/  # #24/#25 後有結果
```

---

## Wave 注意事項

| Wave | 重點 |
|------|------|
| 1 | auth loading 中間態防 FOUC、Safari 隱私模式 localStorage 可能拋錯、`returnPath` 帶 `location.search` |
| 1B | Toast duration 考慮 Infinity、`queryClient.clear()` vs `invalidateQueries`、Logo 連按 5 次（1500ms 視窗）|
| 2 | `SEED_COMMUNITY_ID` 必須先定值、SEO 勿索引 seed、seed 用 `Object.freeze` |
| 3 | `getSafeReturnPath()` 加黑名單（`/uag`）、auth 角色統一用 `app_metadata`、`?mock=true` 做 301 |
| 4 | `maimai-mood-v1` / `uag_last_aid` 加清理清單 |
| 4B/C | `exitDemoMode()` 順序：clear cache → 清 storage → `location.replace('/')`、跨分頁 storage handler 需清 cache |
| 4B (#29) | iOS Safari：`setTimeout` 背景暫停需 `visibilitychange` 補償、`StorageEvent` 背景不觸發、私隱模式 `setItem` 靜默失敗、`100vh` → `dvh`、`origin === 'null'` WebView 邊界 |
