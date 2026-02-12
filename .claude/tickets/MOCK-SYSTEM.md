# MOCK-SYSTEM-UNIFY: 全站三模式架構設計

## 實作進度總覽

### P0 — 基礎建設

- [ ] **#1a** `usePageMode()` hook — 模式判斷 + localStorage TTL + 跨分頁同步（1 新檔案）
- [ ] **#1b** `useModeAwareAction` hook — 三模式行為派發 + cache key 規範（1 新檔案）
- [ ] **#1c** `DemoGate.tsx` — Logo 長按/連按觸發演示模式（1 新檔案）
- [ ] **#2** 全站靜態 HTML 連結改 React 路由 + `SEED_COMMUNITY_ID`（7 檔 16 處）
- [ ] **#3** 按讚三模式行為分離 — mode guard 優先於 auth guard（2 檔）
- [ ] **#14a** 確認 Toast 支援 action button（前置條件）
- [ ] **#14b** `useRegisterGuide()` hook — 訪客引導註冊 8 場景（1 新檔案）
- [ ] **#15** `getAuthUrl()` 工具函數 — 統一 auth 跳轉 + `?return=` + `?role=`（1 新檔案）

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
- [ ] **#18** 3 檔 catch 改用 `getErrorMessage()`（config / track / MaiMaiContext）
- [x] **#19** [P1] 砍舊路徑：前端 `tracker` 由 `/api/uag-track` 切到 `/api/uag/track`，下線 deprecated JS 版 ✅ 2026-02-12
- [ ] **#20** 整合分散 Mock Data + seed 不可變 `Object.freeze`（10+ 檔）

### P2 — 收尾清理

- [ ] **#8a** 社區牆：`useEffectiveRole` hook + 按讚改用 useModeAwareAction（2 檔）
- [ ] **#8b** 社區牆：發文/留言本地化 + LockedOverlay/BottomCTA 引導修正（3 檔）
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

## 施工依賴關係 + 建議順序

### 依賴關係圖

```
#1a usePageMode hook ──────────────┬──→ #1b useModeAwareAction + cache key
                                   ├──→ #1c DemoGate 觸發元件
                                   ├──→ #3 按讚行為分離
                                   ├──→ #4a isDemoPropertyId 移除
                                   ├──→ #5b uagModeStore 遷移
                                   ├──→ #6b DEMO_IDS 移除
                                   ├──→ #8a 社區牆權限重構
                                   ├──→ #10a 浮動標籤 UI
                                   ├──→ #12 Header 三模式行為
                                   ├──→ #20 Mock Data 整合
                                   ├──→ #24 Chat 三模式
                                   ├──→ #25 Assure 三模式
                                   └──→ #26 登出完整清理

#1b useModeAwareAction ────────────┬──→ #3 按讚 handler
                                   ├──→ #8a 社區牆按讚 handler
                                   └──→ #5b UAG 購買 Lead

#1c DemoGate ──────────────────────→ #10a DemoBadge（同一目錄）

#14a Toast 前置確認 ───────────────→ #14b useRegisterGuide hook

#14b useRegisterGuide ─────────────┬──→ #3 visitor toast 引導
                                   ├──→ #8b handleUnlock 引導
                                   └──→ #6b Feed 互動引導

#15 authUtils + getAuthUrl ────────┬──→ #2 auth.html 引用統一
                                   ├──→ #4b 詳情頁連結修正
                                   ├──→ #6a GlobalHeader auth 引用
                                   └──→ #8b BottomCTA auth 引用

#8a 權限重構 ──────────────────────→ #8b 互動本地化

#10a 浮動標籤 UI ──────────────────→ #10b 退出清理策略

#17 統一錯誤處理工具 ──────────────┬──→ #18 錯誤處理重構
                                   ├──→ #19 Supabase RPC 錯誤處理
                                   └──→ #21 logger + getErrorMessage 整合

#2 靜態 HTML 連結清理 ─────────────→ #9 移除靜態 HTML 頁面
#6a 廢棄路由清理 ──────────────────→ #9 移除靜態 HTML 頁面
#5a UAG Landing + auth guard ──────┬──→ #5b uagModeStore 遷移
                                   └──→ #27 UAG 新房仲空狀態 + MaiMai 引導
#18 錯誤處理重構 ──────────────────→ #21 console.log 標準化
#12 Header 三模式 ─────────────────→ #26 登出清理
```

### 建議施工順序

| 波次 | 工單 | 原因 |
|------|------|------|
| **Wave 0** | #17、#19 | 基礎工具 ✅ 已完成 |
| **Wave 1** | #1a、#14a、#15、#18 | 核心 hook + toast 前置確認 + authUtils + 錯誤處理重構 |
| **Wave 1B** | #1b、#1c、#14b | 依賴 Wave 1：useModeAwareAction + DemoGate + useRegisterGuide |
| **Wave 2** | #2、#3、#5a、#12、#20 | 依賴 Wave 1B 的 hook，彼此獨立可平行 |
| **Wave 3** | #4a、#4b、#5b、#6a、#6b、#7、#8a、#27 | 逐頁接入（#5a→#5b/#27 序列，其餘可平行）|
| **Wave 3B** | #8b | 依賴 #8a 完成 |
| **Wave 4** | #9、#10a、#13、#16、#21、#22、#23 | 收尾清理 |
| **Wave 4B** | #10b、#24、#25 | DemoBadge 退出 + Chat/Assure 三模式 |
| **Wave 4C** | #26 | 登出完整清理，依賴 #12 + #10b |
| **Wave 5** | #11 | 產品方向確認，獨立於技術施工 |

---

## 工單摘要

| 項目         | 內容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| **工單編號** | MOCK-SYSTEM-UNIFY                                                    |
| **標題**     | 全站三模式架構 — 訪客模式 / 演示模式 / 正式模式                      |
| **優先級**   | P0 - Critical                                                        |
| **狀態**     | 待開發                                                               |
| **影響範圍** | 首頁、房產列表、房產詳情、UAG、Feed、社區牆、Auth、Chat、全域導航、Header |
| **建立日期** | 2026-02-10                                                           |
| **負責人**   | -                                                                    |

### 一句話描述

同一個網址，三種狀態自動共存：未登入看訪客模式、觸發隱藏入口進演示模式、登入後進正式模式。

---

## 三種模式定義

### 訪客模式（Visitor Mode）

- **觸發**：未登入（自動，預設狀態）
- **資料**：seed 優先，API 可用時替換
- **互動**：部分可用、部分引導註冊
- **對象**：所有未登入的人（消費者、房仲、投資人都可能）
- **核心**：不是 mock 頁，是正式頁面的「未登入視角」

### 演示模式（Demo Mode）

- **觸發**：首頁 Logo 隱藏入口（長按/連按）→ localStorage + TTL 儲存
- **資料**：精心設計的 seed 資料，不走 API
- **互動**：所有功能看起來都在運作，操作本地化，不寫 DB
- **對象**：投資人、合作夥伴
- **核心**：關閉瀏覽器自動退出，正式用戶完全不知道此機制存在

### 正式模式（Live Mode）

- **觸發**：已登入（Supabase session）
- **資料**：API 真實資料
- **互動**：完整功能
- **核心**：登入後演示狀態自動清除，不衝突

### 判斷邏輯（優先級從高到低）

```
已登入（Supabase session）        → 正式模式（最高優先）
未登入 + localStorage 演示驗證（TTL 內） → 演示模式
未登入                            → 訪客模式
```

### 演示模式觸發機制

- 首頁 Logo **長按 5 秒**或**連按 3 次** → 直接進入演示模式（不需密碼）
- 觸發後 → `setDemoMode()`（localStorage + 2 小時有效期）→ 頁面重新整理
- 全站進入演示模式（跨分頁同步，透過 storage event 監聽）
- 有效期到期前 5 分鐘 → 彈 toast「演示即將結束」
- 有效期到期 → 自動退出 + 重新整理頁面
- 演示模式下點「登入/註冊」→ 彈 toast「請先退出演示模式」，不跳轉
- 演示模式下操作記錄完全靜默（不送任何追蹤資料）
- 正式用戶完全不知道這個機制存在
- 演示模式下浮動標籤「演示模式」+ 退出按鈕

### 統一 Hook

```typescript
usePageMode() → PageMode   // 'visitor' | 'demo' | 'live'
```

> **介面隔離原則（ISP）**：回傳單一 `PageMode` 值，組件自行 `mode === 'visitor'` 判斷，避免肥介面（4 欄位多數組件只用 1 個）。

### 三模式行為總對照表

| 行為 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 資料來源 | seed + API 補位 | seed（不走 API）| API |
| 瀏覽內容 | 部分可見 + LockedOverlay | 全部可見 | 依角色全部可見 |
| 按讚 | toast 引導註冊 | 本地 toggle | API 寫入 |
| 發文/留言 | toast 引導註冊 | 本地新增（不寫 DB）| API 寫入 |
| 購買 Lead | toast 引導註冊 | 本地操作 | API |
| LINE/電話 | 正常使用 | 正常使用 | 正常使用 |
| 第 3 則評價 | blur + LockedOverlay | 解鎖（展示完整功能）| 解鎖 |
| 社區牆私密 | 鎖定 | 自動 resident 解鎖 | 依角色 |
| UI 標示 | 無 | 右下角「演示模式」浮動標籤 | 無 |

---

## 逐頁現況分析

---

### 1. 首頁 `/`

#### 現況商業邏輯

- SmartAsk 聊天：不需登入即可用 ✅
- CommunityTeaser（社區評價）：API → 失敗用 BACKUP_REVIEWS seed
- PropertyGrid（房源推薦）：seed 先渲染 → API 靜默替換 → 失敗保持 seed
- HeroAssure（信賴保證）：「履保規範」→ `/#policy` 頁內錨點 ✅

#### 首頁所有連結地圖

| 位置 | 按鈕/連結 | 目前指向 | 類型 | 問題 |
|------|----------|---------|------|------|
| Header | 房地產列表 | `/property.html` | React 路由 | ✅ |
| Header | 登入 | `/auth.html?mode=login` | 靜態 HTML | ⚠️ 脫離 app |
| Header | 免費註冊 | `/auth.html?mode=signup` | 靜態 HTML | ⚠️ 脫離 app |
| Header | 搜尋 Enter | `/property.html?q={query}` | React 路由 | ✅ |
| 膠囊 | 社區評價 | `/community-wall_mvp.html` | 靜態 HTML | ❌ 死路 |
| 膠囊 | 房仲專區 | `/uag` (target=_blank) | React 路由 | ✅ |
| 膠囊 | 邁鄰居 | `#` | 錨點 | 無目標 |
| HeroAssure | 履保規範 | `/#policy` | 頁內錨點 | ✅ |
| CommunityTeaser | 評價卡片(real) | `/community/{id}/wall` | React 路由 | ✅ |
| CommunityTeaser | 評價卡片(seed) | `/community-wall_mvp.html` | 靜態 HTML | ❌ 死路 |
| CommunityTeaser | 查看更多 | `/community-wall_mvp.html` | 靜態 HTML | ❌ 死路 |
| PropertyGrid | 房源卡片 | `/property/{id}` | React 路由 | ✅ |

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| SmartAsk | 正常使用 | 正常使用 | 正常使用 |
| CommunityTeaser | seed + API 補位 | seed（不走 API）| API |
| PropertyGrid | seed + API 補位 | seed | API |
| Header 登入/註冊 | 顯示 | 隱藏（演示不需要）| 顯示「我的帳號」|

#### 需要修正

- 膠囊「社區評價」→ `/community/{seedId}/wall`
- CommunityTeaser seed 卡片 → `/community/{seedId}/wall`
- CommunityTeaser「查看更多」→ `/community/{seedId}/wall`

---

### 2. 房產列表 `/property.html`

#### 現況商業邏輯

- seed 先渲染 → API 靜默補位 → 失敗保持 seed ✅
- 搜尋：純前端過濾，URL 同步 `?q=` ✅
- 訪客可完整瀏覽，無權限限制 ✅

#### 頁面內連結地圖

| 位置 | 按鈕/連結 | 目前指向 | 類型 | 問題 |
|------|----------|---------|------|------|
| 房源卡片 | 點擊卡片 | `/p/{propertyId}` | React 路由 | ⚠️ 用 `/p/` 不是 `/property/` |
| Header | 同首頁 Header | 同上 | - | 同上 |

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 房源卡片 | seed + API ✅ | seed | API |
| 搜尋 | 前端過濾 ✅ | 同左 | 同左 |
| 卡片點擊 | → `/property/{id}` ✅ | 同左 | 同左 |

#### 需要修正

- 接入 usePageMode 控制資料來源（演示模式不走 API，用 seed；訪客模式維持現有 seed+API 補位）
- 搜尋功能三模式下行為相同（純前端過濾），不需改動
- 其餘不需改動，目前做得最好的頁面之一
- **不需獨立工單**，在 Wave 2/3 施工時順便接入 usePageMode 即可（改動量極小：只需在資料 hook 加 `enabled: mode === 'live'`）

---

### 3. 房產詳情頁 `/property/{id}`

#### 現況商業邏輯

- 4 種信賴情境：A（登入+已信賴）/ B（登入+未信賴）/ C（訪客+有信賴）/ D（訪客+無信賴）
- `isDemoPropertyId('MH-100001')` → `isDemo=true` → 用 MOCK_REVIEWS、seed 社會證明
- isDemo=true 但 isLoggedIn=false → 按讚 disabled（設計缺陷）

#### 頁面內所有互動元素

| 位置 | 按鈕/連結 | 訪客行為 | Demo(isDemo) 行為 | 已登入行為 | 問題 |
|------|----------|---------|----------|----------|------|
| 社區評價 | 按讚(前2則) | disabled + opacity-50 | disabled（isLoggedIn=false）| API 寫入 | ❌ 無引導 |
| 社區評價 | 第3則評價 | blur + Lock「註冊查看」| blur + Lock | 解鎖 | ✅ 有引導 |
| 社區評價 | 「註冊查看」按鈕 | → `/auth.html?mode=login` | 同左 | 不顯示 | ⚠️ 靜態 HTML |
| 社區評價 | 前往社區牆 | → `/community-wall_mvp.html` | 同左 | 同左 | ❌ 靜態 HTML 死路 |
| 經紀人卡片 | 加 LINE 聊聊 | 正常開啟 LINE | 正常 | 正常 | ✅ |
| 經紀人卡片 | 致電諮詢 | 正常撥打 | 正常 | 正常 | ✅ |
| 經紀人卡片 | 查看服務評價 | 開啟 Modal | 開啟 Modal（mock 資料）| 開啟 Modal（API）| ✅ |
| 經紀人卡片 | 信任分 Tooltip | hover/focus 顯示 | 同左 | 同左 | ✅ |
| 資訊卡 | 收藏(愛心) | 本地 toggle | 本地 toggle | 本地 toggle | ✅ |
| 資訊卡 | LINE 分享 | 正常 | 正常 | 正常 | ✅ |
| 資訊卡 | 查看地圖 | Google Maps | 同左 | 同左 | ✅ |
| 行動端 | 加 LINE 聊聊 | 正常 | 正常 | 正常 | ✅ |
| 行動端 | 致電諮詢 | 正常 | 正常 | 正常 | ✅ |
| 社會證明 | 瀏覽人數/賞屋組數 | seed 隨機數 | seed 隨機數 | API | ✅ |

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 按讚(前2則) | 可點 → toast 引導註冊 | 本地 toggle | API 寫入 |
| 第3則評價 | blur + LockedOverlay | 解鎖（展示完整功能）| 解鎖 |
| LINE/電話 | 正常 ✅ | 正常 | 正常 |
| 收藏/分享 | 本地 toggle ✅ | 同左 | 同左 |
| 社會證明 | seed 隨機數 | seed 隨機數 | API |
| 「前往社區牆」| → `/community/{id}/wall` | 同左 | 同左 |
| 「註冊查看」| → 註冊引導 | → `/community/{id}/wall`（演示模式社區牆，resident 權限）| 不顯示 |

> **演示模式直接解鎖第 3 則**：讓投資人看到「註冊後的完整體驗」，更直覺。原設計（跳到社區牆）不直覺且增加操作成本。

#### 需要修正

- 移除 `disabled={!isLoggedIn}`，改用 mode 判斷按讚行為
- 移除 `isDemoPropertyId` 孤島邏輯，改用 `usePageMode()`
- 「前往社區牆」從 `community-wall_mvp.html` 改為 `/community/{id}/wall`
- 「註冊查看」：訪客→註冊引導、演示→直接解鎖（不需跳轉）

---

### 4. 社區討論牆 `/community/{id}/wall` ⭐ 最佳範例

#### 現況商業邏輯

- 完整的權限矩陣：guest / member / resident / agent / official / admin
- `getPermissions(role)` 回傳完整權限物件
- `GUEST_VISIBLE_COUNT = 2`：每區塊只看前 2 則
- `useCommunityWallData()` 統一資料來源（mock/API 自動切換）
- RoleSwitcher 供開發用（僅 DEV 環境顯示）

#### 頁面內所有互動元素

| 位置 | 按鈕/連結 | guest 行為 | 已登入行為 | 問題 |
|------|----------|-----------|----------|------|
| 評價區 | 前2則 | 可看 ✅ | 可看 | ✅ |
| 評價區 | 第3則起 | LockedOverlay + 模糊 ✅ | 可看 | ✅ |
| 貼文區 | 前2則 | 可看 ✅ | 可看 | ✅ |
| 貼文區 | 第3則起 | LockedOverlay ✅ | 可看 | ✅ |
| 問答區 | 前2則 | 可看 ✅ | 可看 | ✅ |
| 私密牆 tab | 切換 | 鎖定無法切換 ✅ | 住戶/房仲可切換 | ✅ |
| LockedOverlay | 「免費註冊/登入」| → `/auth.html` | 不顯示 | ⚠️ 靜態 HTML |
| BottomCTA | guest→「免費註冊」| → `/auth.html` | 不顯示 | ⚠️ 靜態 HTML |
| BottomCTA | member→「驗證住戶」| 引導驗證 | 引導驗證 | ✅ |
| RoleSwitcher | 角色切換 | DEV 環境可用 | DEV 環境可用 | ✅ 開發工具 |

#### 權限矩陣

```
guest:    canSeeAllReviews=false, canPostPublic=false, canAccessPrivate=false
member:   canSeeAllReviews=true,  canPostPublic=false, canAccessPrivate=false
resident: canSeeAllReviews=true,  canPostPublic=true,  canAccessPrivate=true
agent:    canSeeAllReviews=true,  canPostPublic=true,  canAccessPrivate=true
```

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 公開評價 | 前2則 + LockedOverlay ✅ | 全部可看 | 依角色 |
| 公開貼文 | 前2則 + LockedOverlay ✅ | 全部可看 | 依角色 |
| 問答 | 前2則 ✅ | 全部可看 | 依角色 |
| 私密牆 | 鎖定 ✅ | 自動 resident 權限 | 依角色 |
| 發文/留言 | 引導註冊 ✅ | 本地新增（不寫 DB）| API |
| BottomCTA | 「免費註冊」✅ | 不顯示 | 依角色 |

#### 需要修正

- 接入 usePageMode，演示模式自動套用 resident 權限
- LockedOverlay / BottomCTA 的連結從 `auth.html` 改為 React 路由或 toast
- 頁面本身設計最好，是其他頁面應學習的模板

---

### 5. UAG 房仲儀表板 `/uag`

#### 現況商業邏輯

- **完全沒有 auth guard** — 任何人都能進入
- 預設 `useMock=true`（`uagModeStore` Zustand + localStorage）
- URL `?mock=1` 或 `?mock=true` 強制 Mock；`?mock=0` 強制 Live
- Live 模式切換需登入，未登入 toast「請先登入」
- Mock 資料：MOCK_DB 含 16 個 Lead、3 個 Listings、Mock Agent Profile（游杰倫）

#### 頁面內所有互動元素

| 位置 | 按鈕/連結 | 訪客行為 | 已登入行為 | 問題 |
|------|----------|---------|----------|------|
| 全頁 | 進入頁面 | 無 auth guard，直接進 | 直接進 | ⚠️ 無角色檢查 |
| Radar | 點擊 Lead 圓點 | 可點，顯示詳情 | 可點 | ✅ |
| Action Panel | 購買 Lead | Mock 模式可用（本地操作）| Live 可用 | ✅ |
| Action Panel | 發送訊息 | Mock 可用但 toast「需切換 Live」| Live 可用 | ✅ |
| Footer | Mock/Live 切換 | Live 被擋「請先登入」| 可切換 | ✅ |
| UAGHeader | 登出 | 不顯示 | 顯示 | ✅ |
| UAGHeader | → `/uag/profile` | 可進入 | 可進入 | ⚠️ 無角色檢查 |

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 全頁 | Landing Page（產品介紹 + 截圖/動畫 + 註冊 CTA）| seed 資料完整後台 | agent→API / consumer→引導 |
| Radar | 截圖/動畫展示 | 可點 | 可點 |
| 購買 Lead | 不可操作（Landing Page 無此元素）| 本地操作（樂觀更新）| API |
| 發送訊息 | 不可操作（Landing Page 無此元素）| 本地操作 | API |
| Mock/Live 切換 | 移除 | 移除 | 移除（由 usePageMode 自動）|

> **訪客模式採用 Landing Page 方案**：UAG 的 mock 資料含 Lead 姓名、電話、分級等敏感欄位，即使是假資料也不該對訪客展示。訪客看到的是產品介紹頁（功能說明 + 截圖 + 「成為合作房仲」CTA），演示模式（隱藏入口長按/連按觸發）才進入真正後台。

#### 需要修正

- 新增 UAG Landing Page 元件（訪客模式專用，展示產品功能介紹）
- 移除 `uagModeStore` 的手動 mock/live toggle
- 接入 `usePageMode()` 自動判斷：visitor→Landing Page、demo→seed 後台、live→API
- 正式模式 consumer 角色：提示「此功能僅限合作房仲」→ 引導回首頁

---

### 6. Feed 動態頁 `/feed/{userId}`

#### 現況商業邏輯

- `DEMO_IDS = ['demo-001', 'demo-consumer', 'demo-agent']` 白名單
- 非 DEMO_IDS 的 userId 且未登入 → 無法載入
- 自動偵測角色：`demo-agent` → 房仲版、其他 → 消費者版
- `forceMock = mockParam === 'true' || isDemo`
- RoleToggle 僅在 forceMock=true 時顯示

#### 頁面內所有連結

| 位置 | 按鈕/連結 | 訪客行為 | 已登入行為 | 問題 |
|------|----------|---------|----------|------|
| GlobalHeader | Logo | → `ROUTES.FEED_AGENT` 或 `FEED_CONSUMER` | 同左 | ❌ 廢棄路由死路 |
| GlobalHeader | 登入按鈕 | → `/auth.html?mode=login` | 不顯示 | ⚠️ 靜態 HTML |
| RoleToggle | 角色切換 | Mock 模式可用 | 不顯示 | ✅ |
| 首頁 | 入口 | 無 | 無 | ❌ 首頁無 Feed 入口 |

#### 三模式設計

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 進入 | 顯示 seed feed | 顯示 seed feed | `/feed/{真實userId}` |
| 互動 | 引導註冊 | 本地操作 | API |
| Logo | → `/`（首頁）| → `/`（首頁）| → `/`（首頁）|
| RoleToggle | 不顯示 | 可切換 | 不顯示 |

#### 需要修正

- Logo 改為 `ROUTES.HOME`（`/maihouses/`）
- 移除 `ROUTES.FEED_AGENT` / `FEED_CONSUMER` 廢棄路由
- 移除 `DEMO_IDS` 白名單，改用 `usePageMode()`
- 確認 Feed 在產品中的定位（首頁是否需要入口）

---

### 7. Auth 登入/註冊 `/auth.html`

#### 現況商業邏輯

- 獨立靜態 HTML 頁面（非 React 組件）
- 註冊時選角色：🏠 我是買家（member，預設）/ 💼 我是業務（agent）
- URL 參數：`?mode=signup&role=agent` 自動勾選
- Google OAuth → 暫存角色到 `localStorage('mh.auth.pending_role')`
- Trust case 升級：登入時綁定匿名建立的 trust case（`pending_trust_token`）

#### 登入後重定向邏輯（現況）

```
1. 有 ?return= → getSafeReturnPath() 安全檢查（同源 + /maihouses/ 路徑下）→ 回到原頁
2. 無 return → /maihouses/feed/{userId}（統一進 Feed）
```

#### 問題

- 登入後統一導到 Feed，但 Feed 從首頁進不去
- Feed Logo 指向廢棄路由，回不了首頁
- 沒有「投資人」角色 — 投資人就是不登入的訪客

#### 三模式設計

```
登入成功後重定向：
  1. 有 ?return= → 回到原頁 ✅（保留不變）
  2. agent 角色 → /uag
  3. consumer 角色 → /（首頁，帶已登入狀態）
  4. 清除 localStorage 演示標記（`clearDemoMode()`，演示模式自動退出）
```

---

## 跨頁面連結斷裂地圖

```
❌ 靜態 HTML 死路（點了掉出 React app）：
  首頁膠囊「社區評價」          → community-wall_mvp.html
  首頁 CommunityTeaser seed 卡片 → community-wall_mvp.html
  首頁 CommunityTeaser 查看更多  → community-wall_mvp.html
  詳情頁「前往社區牆」          → community-wall_mvp.html
  詳情頁「註冊查看」            → auth.html
  社區牆 LockedOverlay           → auth.html
  社區牆 BottomCTA               → auth.html
  Feed GlobalHeader 登入         → auth.html

❌ 廢棄路由死路：
  Feed Logo → ROUTES.FEED_AGENT / FEED_CONSUMER（不存在的路由）

❌ 功能斷裂：
  詳情頁按讚 → disabled 無引導
  Feed 從首頁無入口
  Auth 登入後導到 Feed → Feed Logo 回不了首頁
```

### 需要修正的連結清單

| 目前指向 | 出現位置 | 應改為 |
|---------|---------|--------|
| `community-wall_mvp.html` | 首頁膠囊、CommunityTeaser seed 卡片、CommunityTeaser 查看更多、詳情頁「前往社區牆」| `/community/{id}/wall` |
| `auth.html` | 詳情頁「註冊查看」、社區牆 LockedOverlay、社區牆 BottomCTA、Feed GlobalHeader 登入 | React 路由或 toast 引導 |
| `ROUTES.FEED_AGENT` | Feed GlobalHeader Logo | `ROUTES.HOME` |
| `ROUTES.FEED_CONSUMER` | Feed GlobalHeader Logo | `ROUTES.HOME` |

---

## 需要移除的舊 Mock 機制

| 舊機制 | 位置 | 替代 |
|--------|------|------|
| `isDemoPropertyId()` | `src/constants/property.ts`、`PropertyDetailPage.tsx` | `usePageMode()` |
| `uagModeStore` mock/live toggle | `src/stores/uagModeStore.ts`、UAG | `usePageMode()` |
| `DEMO_IDS` 白名單 | `src/pages/Feed/index.tsx` | `usePageMode()` |
| `?mock=true` URL 參數 | UAG、Feed | localStorage 演示驗證（TTL） |
| `?role=` 參數 | 社區牆 | 保留作為開發工具，演示模式由 `usePageMode()` 自動套 resident |
| Seed 補位（API → 失敗 → Seed）| 首頁、房產列表 | 保留不變，訪客模式資料來源 ✅ |

---

## 子工單詳細規格

---

### #1a [P0] `usePageMode()` hook + localStorage TTL + 跨分頁同步 + API 三層防禦

**目標**：建立全站統一的模式判斷系統 + 演示狀態管理 + API 防禦機制

**施工項目**：

#### 1-A. `usePageMode()` hook

**新增檔案**：`src/hooks/usePageMode.ts`

```typescript
type PageMode = 'visitor' | 'demo' | 'live'

function usePageMode(): PageMode {
  // 1. 已登入（useAuth） → 'live'（最高優先，登入自動清除演示狀態）
  // 2. isDemoMode()       → 'demo'
  // 3. 其他               → 'visitor'
}
```

> **回傳單一 `PageMode` 值**，不回傳 `{ mode, isVisitor, isDemo, isLive }` — 遵循 ISP，組件自行 `mode === 'demo'` 判斷。

#### 1-A2. 演示狀態改用 `localStorage + TTL`（取代 sessionStorage）

**原因**：`sessionStorage` 不跨分頁（`target="_blank"` 開新分頁讀不到演示狀態），改用 `localStorage` + 2 小時有效期，關閉所有分頁後有效期到就自動退出。

```typescript
const DEMO_STORAGE_KEY = 'mai-demo-verified'
const DEMO_TTL = 2 * 60 * 60 * 1000 // 2 小時
const DEMO_WARN_BEFORE = 5 * 60 * 1000 // 到期前 5 分鐘提醒

const DemoStorageSchema = z.object({ t: z.number() })

function readDemoTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY)
    if (!raw) return null
    const result = DemoStorageSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data.t : null
  } catch {
    return null
  }
}

function setDemoMode(): void {
  try {
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ t: Date.now() }))
  } catch {
    // Safari private mode / storage disabled: fail closed as visitor mode
  }
}

function isDemoMode(): boolean {
  const t = readDemoTimestamp()
  if (t === null) return false
  return Date.now() - t < DEMO_TTL
}

function getDemoTimeRemaining(): number {
  const t = readDemoTimestamp()
  if (t === null) return 0
  return Math.max(0, DEMO_TTL - (Date.now() - t))
}

function clearDemoMode(): void {
  try {
    localStorage.removeItem(DEMO_STORAGE_KEY)
  } catch {
    // no-op
  }
}
```

#### 1-A3. 有效期到期處理

**到期前 5 分鐘**：彈出 toast 提醒「演示即將結束，剩餘 X 分鐘」。
**到期後**：`isDemoMode()` 回傳 false → 自動變回訪客模式 + `queryClient.clear()` + `window.location.reload()`。

**實作方式**：計時器放在 **App.tsx 根層級**（不在 `usePageMode()` 內部），整個應用只設定一次，各頁面只讀取模式值。避免多組件呼叫 `usePageMode()` 產生重複計時器。

```typescript
// App.tsx 根層級（useDemoTimer.ts 獨立 hook，僅 App.tsx 使用）
function useDemoTimer() {
  const mode = usePageMode()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (mode !== 'demo') return
    const remaining = getDemoTimeRemaining()
    if (remaining <= 0) return

    const warnTimer = setTimeout(() => {
      toast('演示即將結束，剩餘 5 分鐘')
    }, Math.max(0, remaining - DEMO_WARN_BEFORE))

    const expireTimer = setTimeout(() => {
      clearDemoMode()
      queryClient.clear()
      window.location.reload()
    }, remaining)

    return () => { clearTimeout(warnTimer); clearTimeout(expireTimer) }
  }, [mode, queryClient])
}

// App.tsx
function App() {
  useDemoTimer() // 全站唯一計時器
  return <RouterProvider ... />
}
```

> **⚠️ usePageMode() 本身不含計時器邏輯**，它是純讀取函數（讀 localStorage + useAuth），任何組件可安全多次呼叫。

#### 1-A4. 跨分頁同步 + 有效期精確對齊

**機制**：使用 `window.addEventListener('storage')` 監聽 localStorage 變更。分頁 A 進入/退出演示 → 分頁 B 收到 storage event → 重新讀取 `isDemoMode()` → `window.location.reload()` 同步狀態。

```typescript
// usePageMode 內部
useEffect(() => {
  let reloadTimer: ReturnType<typeof setTimeout> | null = null

  const handler = (e: StorageEvent) => {
    if (e.key !== DEMO_STORAGE_KEY) return
    if (reloadTimer) clearTimeout(reloadTimer)
    reloadTimer = setTimeout(() => window.location.reload(), 120)
  }

  window.addEventListener('storage', handler)
  return () => {
    if (reloadTimer) clearTimeout(reloadTimer)
    window.removeEventListener('storage', handler)
  }
}, [])
```

**有效期精確同步問題**：storage event 只在 localStorage **寫入時**觸發，TTL 到期是時間事件不會觸發 storage event。因此多分頁的到期靠各自的 `setTimeout`（1-A3），基於同一個 `getDemoTimeRemaining()` 計算，終止時間自然一致（±1 秒內）。分頁 A 退出時執行 `clearDemoMode()`（刪除 localStorage key）→ 觸發 storage event → 分頁 B 收到後 reload。

**新分頁打開**：新分頁打開時 `usePageMode()` 讀取 localStorage 計算剩餘時間 → 設定對應的 `setTimeout` → 與其他分頁的到期時間自然對齊。

#### 1-A5. 演示模式下阻擋登入

**規則**：演示模式下使用者點「登入/註冊」→ 彈 toast「請先退出演示模式」→ 不跳轉 auth.html。

**實作位置**：所有 auth 跳轉處（Header 登入按鈕、LockedOverlay CTA、BottomCTA 等）先檢查 `mode === 'demo'`。

```typescript
// 在 getAuthUrl() 工具函數中包裝
function handleAuthNavigation(mode: PageMode, authUrl: string) {
  if (mode === 'demo') {
    toast('請先退出演示模式')
    return
  }
  window.location.href = authUrl
}
```

#### 1-A6. 演示模式操作記錄策略

**結論：不記錄**。演示模式下所有操作追蹤（`track()` 呼叫）靜默跳過，不送後端、不寫任何記錄。

**實作位置**：`src/analytics/track.ts` 的 `track()` 函數頂部加入 mode 檢查。

```typescript
function track(event: string, data?: Record<string, unknown>) {
  if (isDemoMode()) return // 演示模式完全靜默
  // ...正常追蹤邏輯
}
```

#### 1-A7. 演示模式下的 API 三層防禦

**規則**：演示模式下不應有 API 呼叫，但若意外觸發 API 錯誤，靜默吞掉（不顯示錯誤 toast）。

**三層防禦機制**：

| 層級 | 機制 | 位置 | 說明 |
|------|------|------|------|
| L1（最優）| `enabled: mode === 'live'` | 各 useQuery hook | 禁止 API 發起 |
| L2（備份）| Hook 層提前返回 mock | useModeAwareAction 消費端 | `if (mode !== 'live') return mockData` |
| L3（最後防線）| 全局 onError 靜默 | QueryClient defaultOptions | 演示模式下 `onError` 不彈 toast |

**L3 全局 React Query 配置**：

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (isDemoMode()) {
          logger.warn('[Demo] Unexpected API error:', error)
          return // 靜默吞掉，不彈 toast
        }
        showErrorToast(error) // 正常錯誤處理
      }
    }
  }
})
```

**驗收**：演示模式下開啟 DevTools Network tab，應看不到任何 API 請求（除了靜態資源）。若有意外請求，console 只有 `[Demo] Unexpected API error` 日誌，無 toast。

> 此變更同步影響 #10b 退出清理（改清 localStorage）和 #1c 觸發元件（改寫 localStorage）。

**驗收標準（#1a）**：
- `usePageMode()` 回傳單一 `PageMode` 值，正確判斷三種模式
- 演示狀態存 localStorage + 2 小時 TTL（跨分頁可用）
- 到期前 5 分鐘彈 toast、到期後自動退出 + reload
- 跨分頁同步：storage event 監聽
- 演示模式下 `track()` 完全靜默
- L1/L2/L3 三層 API 防禦到位

---

### #1b [P0] `useModeAwareAction` hook + 本地操作持久化策略 + cache key 規範

**目標**：統一「本地操作不寫 DB」策略 + 定義三模式 cache key + mock 系統整合接口

**依賴**：#1a

**施工項目**：

#### 1-B. 三套 Mock 系統整合接口定義

| 舊系統 | 控制方式 | 消費者 | 整合方式 |
|--------|---------|--------|---------|
| `mhEnv.isMockEnabled()` | 環境變數 | `useCommunityWallData` | hook 內加 `if (mode === 'demo') return mockData`，不改 `mhEnv` |
| `uagModeStore.useMock` | Zustand + localStorage | `useUAGData`、`useAgentProfile`、`TrustFlow` | 各 hook 改讀 `usePageMode() === 'demo'`，移除 store（見 #5b）|
| `isDemoPropertyId()` | 硬編碼 ID 比對 | `PropertyDetailPage`、`propertyService` | 改讀 `usePageMode() === 'demo'`，移除函數（見 #4a）|

**整合原則**：`usePageMode` 是唯一 source of truth，各消費者 hook 直接呼叫 `usePageMode()` 取得模式值，不需要中間適配層。

#### 1-C. 資料來源語義定義 + React Query Cache Key 規範

| 模式 | 語義 | React Query 行為 |
|------|------|-----------------|
| 訪客模式 | seed 優先，API 可用時替換 | `enabled: true`，initialData 為 seed，API 成功後覆蓋 |
| 演示模式 | 純 seed，禁止 API 請求 | `enabled: false`，只用 initialData seed |
| 正式模式 | 純 API | `enabled: true`，無 initialData |

**React Query Cache Key 必須包含 mode**：防止 visitor→live 切換時 cache 殘留 seed 資料。

```typescript
// ❌ 錯誤：visitor 載入 seed → 切到 live → cache 仍是 seed
queryKey: ['communityWall', communityId]

// ✅ 正確：mode 不同 = cache key 不同 = 自動 refetch
queryKey: ['communityWall', mode, communityId]
```

**需修改的 queryKey 清單**（所有含模式切換行為的 hook）：

| Hook | 現有 queryKey | 改為 |
|------|-------------|------|
| `useCommunityWallQuery` | `communityWallKeys.wall(communityId, includePrivate)` | 加入 mode 參數 |
| `useCommunityReviewLike` | `reviewLikeQueryKey(propertyId)` | 加入 mode（僅 live 模式需要 mutation） |
| `useAgentReviews` | `['agent-reviews', agentId, page, limit]` | `['agent-reviews', mode, agentId, page, limit]` |
| `useAgentProfile` (UAG) | `['agentProfile', userId, useMock]` | `['agentProfile', mode, userId]`（useMock→mode） |
| `useUAGData` (UAG) | `[UAG_QUERY_KEY, useMock, userId]` | `[UAG_QUERY_KEY, mode, userId]`（useMock→mode） |
| PropertyDetailPage inline queries | 各自的 key | 加入 mode |

> 此規範在 Wave 2/3 各工單施工時逐一套用，不需獨立施工。

#### 1-D2. `useModeAwareAction` hook — 統一「本地操作不寫 DB」策略

**新增檔案**：`src/hooks/useModeAwareAction.ts`

**問題**：工單 8+ 處寫「本地操作」但各自 `if (isDemo) { localToggle } else { apiMutate }`，違反 DRY。

**重複位置**：
- `CommunityReviews.tsx:250-269`（按讚）→ #3
- `Wall.tsx:241-256`（按讚）→ #8
- `FeedPostCard.tsx:110`（留言）→ #6b
- `PostsSection.tsx:279`（留言）→ #8
- UAG hooks（購買 Lead）→ #5b
- Feed（發文）→ #6b

```typescript
import { getErrorMessage } from '../lib/error'
import { logger } from '../lib/logger'
import { usePageMode } from './usePageMode'

type ModeActionResult = { ok: true } | { ok: false; error: string }

function useModeAwareAction<T>(handlers: {
  visitor: (data: T) => void | Promise<void>
  demo: (data: T) => void | Promise<void>
  live: (data: T) => void | Promise<void>
}) {
  const mode = usePageMode()
  return async (data: T): Promise<ModeActionResult> => {
    try {
      await handlers[mode](data)
      return { ok: true }
    } catch (error) {
      logger.warn('[useModeAwareAction] action failed', { mode, error })
      return { ok: false, error: getErrorMessage(error) }
    }
  }
}
```

**使用範例**：
```typescript
const handleLike = useModeAwareAction<string>({
  visitor: (_reviewId) => showRegisterGuide({ message: '註冊後即可鼓勵評價' }),
  demo: (reviewId) => setLocalLikes(prev => toggle(prev, reviewId)),
  live: async (reviewId) => { await likeMutation.mutateAsync(reviewId) },
})
```

**本地操作持久化決策表**：

| 操作類型 | 演示模式存儲 | 重新整理後 | 跨分頁同步 | 理由 |
|---------|------------|---------|---------|------|
| 按讚（評價/貼文）| React state | 消失 | 否 | 臨時互動模擬，消失可接受 |
| 發文/留言 | React state | 消失 | 否 | 內容生成模擬，消失可接受 |
| 購買 Lead | React state | 消失 | 否 | 交易模擬，消失可接受 |
| 發送訊息 | React state | 消失 | 否 | 聊天模擬，消失可接受 |
| 收藏（愛心）| React state | 消失 | 否 | 統一策略，不特殊化 |
| Feed RoleToggle | sessionStorage | 保留 | 否 | 版面偏好，同分頁保留體驗較好 |

**統一策略**：所有演示操作存純 React state，重新整理就消失。唯一例外是 Feed RoleToggle（版面切換狀態）存 sessionStorage 以避免切換版面後刷新重置。不存 localStorage（避免跨分頁衝突和清理遺漏）。

> 各消費者工單（#3/#5b/#6b/#8a）施工時改用此 hook，消除重複的 mode 分支邏輯。

**驗收標準（#1b）**：
- `useModeAwareAction` hook 可正確派發三模式行為
- 各 mock 系統消費者可透過 `usePageMode() === 'demo'` 取得統一判斷
- 所有 queryKey 包含 mode 參數
- 本地操作依持久化決策表：按讚/發文/購買存 React state，Feed RoleToggle 存 sessionStorage

---

### #1c [P0] `DemoGate.tsx` 觸發元件 — 長按/連按視覺回饋

**目標**：演示模式隱藏入口，Logo 長按 5 秒或連按 3 次觸發

**依賴**：#1a

**施工項目**：

#### 1-E. 演示模式觸發元件

**新增檔案**：`src/components/DemoGate/DemoGate.tsx`

**觸發方式（不需密碼）**：
- 首頁 Logo **長按 5 秒** → 直接進入演示模式
- 首頁 Logo **連按 3 次** → 直接進入演示模式（觸控裝置 fallback）
- 觸發後執行 `setDemoMode()` → `window.location.reload()` → 全站進入演示模式

**視覺回饋設計**：
- **長按回饋**：長按期間 Logo 周圍顯示倒數環（5→4→3→2→1），或顯示 tooltip「按住不放，X 秒進入演示模式」
- **連按回饋**：第 1-2 次點擊 Logo 輕微 shake animation；第 3 次觸發時全屏 toast 確認「進入演示模式」
- **手機 haptic feedback**：觸發成功時呼叫 `navigator.vibrate?.(50)`（若支援）

**防衝突設計**：
- 長按期間呼叫 `e.preventDefault()` 阻止瀏覽器原生選單
- 長按未達 5 秒鬆開 → 正常觸發 `<a>` 導航（不進入演示）
- 連按 3 次的判斷：500ms 內連續點擊 3 次才觸發
- 已在演示模式中 → 長按/連按不重複觸發

**驗收標準（#1c）**：
- 首頁 Logo 長按 5 秒或連按 3 次直接進入演示模式（不需密碼）
- 長按過程中有視覺回饋（倒數環或 tooltip）
- 連按時有 shake animation 回饋
- 演示模式下點「登入/註冊」→ 彈 toast「請先退出演示模式」，不跳轉

---

### #2 [P0] 全站靜態 HTML 連結改為 React 路由 + `SEED_COMMUNITY_ID` 定義

**目標**：消滅除 `auth.html` 以外的靜態 HTML 死路，讓訪客不會「掉出」React app

**施工項目**：

#### 2-A. 定義 `SEED_COMMUNITY_ID` 常數

**新增位置**：`src/constants/seed.ts`（新檔案，集中管理所有 seed 常數）

```typescript
/** 首頁社區評價連結用的 seed 社區 ID — 用第一筆真實社區 ID 或專用 seed */
export const SEED_COMMUNITY_ID = 'xxx-待確認'
```

**待確認**：seedId 值來源（選項 A：真實社區 ID / 選項 B：專用 seed 路由 / 選項 C：社區列表頁）
**Blocker Gate**：`SEED_COMMUNITY_ID` 未定值前，不得合併 #2 相關改動。

#### 2-B. 社區評價連結（6 處）

**影響檔案**：
- `src/features/home/sections/CommunityTeaser.tsx` — seed 卡片 + 查看更多（:11, :103, :205）
- `src/components/Header/Header.tsx` — 膠囊「社區評價」（:262）
- `src/features/home/components/CommunityWallCard.tsx` — 聊天頁卡片（:70）
- `src/constants/routes.ts` — `COMMUNITY_WALL_MVP` 常數定義（:31）

所有 `community-wall_mvp.html` → `/community/${SEED_COMMUNITY_ID}/wall`

#### 2-C. Header 膠囊連結

**檔案**：`src/components/Header/Header.tsx`

- 「社區評價」→ `/community/${SEED_COMMUNITY_ID}/wall`
- 「房仲專區」→ `/uag`（已正確）

#### 2-D. auth.html 引用統一改為 `window.location.href`

`auth.html` 是獨立靜態 HTML 頁面，禁止用 `navigate()` 導向（會命中 catch-all → NotFoundPage）。統一使用 `window.location.href` + `?return=` 參數（見 #15）。

**影響檔案**：
- `src/pages/Chat/index.tsx` — Chat 頁登入引導（:62）
- `src/pages/PropertyListPage.tsx` — 房源列表登入按鈕（:100）
- `src/components/TrustManager.tsx` — 信任交易管理器登入提示（:257）
- `src/components/Composer/LoginPrompt.tsx` — 作曲家登入提示（:40）

**驗收標準**：
- 全專案搜尋 `community-wall_mvp` 回傳 0 筆（排除靜態 HTML 檔本身）
- 全專案 `.tsx/.ts` 中 `navigate(` 搜尋不含任何 `.html` 路徑
- 所有 `auth.html` 引用皆使用 `window.location.href` 且帶 `?return=` 參數
- `SEED_COMMUNITY_ID` 已定義且社區牆可正確載入

---

### #3 [P0] 按讚按鈕三模式行為分離 + hook 層繞過策略

**目標**：按讚按鈕根據 `usePageMode()` 決定行為，不再用 `disabled`

> **Mode Guard 執行順序規範**：所有互動 handler 統一順序 → `visitor → showGuide` → `demo → 本地操作` → `live → auth check → API`。Mode guard 必須在 auth guard 之前，否則演示模式未登入直接被攔（如 `Wall.tsx:244 if (!isAuthenticated)` 問題）。

**施工項目**：

#### 3-A. CommunityReviews 按讚邏輯（建議改用 `useModeAwareAction`）

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```typescript
const handleToggleLike = useModeAwareAction<string>({
  visitor: () => showRegisterGuide({ message: '註冊後即可鼓勵評價' }),
  demo: (reviewId) => setLocalLikes(prev => toggle(prev, reviewId)),
  live: async (reviewId) => { await likeMutation.mutateAsync(reviewId) },
})
```

需修改的具體行號：
- `:310` — 移除 `disabled={!isLoggedIn}`
- `:313-318` — 移除 `cursor-not-allowed` / `opacity-50` 條件樣式
- `:250-269` — `handleToggleLike` 改用 `useModeAwareAction`（取代手動 if/else）
- `:358-369` — LockedOverlay 改用 mode 判斷，Demo 不再被鎖

#### 3-A2. 繞過 `useCommunityReviewLike` hook

`mode !== 'live'` 時不呼叫 mutation（避免 `supabase.auth.getSession()` 拋 Unauthorized）。

**執行順序**（mode guard 在 auth guard 之前）：
```
handleToggleLike(reviewId):
  if (mode === 'visitor') → showRegisterGuide(); return  // ← 最先攔截
  if (mode === 'demo')    → setLocalLikes(toggle); return
  if (mode === 'live')    → useCommunityReviewLike.mutate(reviewId) // 只有這裡走 API
```

**影響檔案**：`src/hooks/useCommunityReviewLike.ts` — 不需改此檔，只需在呼叫端（CommunityReviews + Wall.tsx）加 mode 前置判斷。

#### 3-B. 第 3 則評價鎖定邏輯 + LockedOverlay 依賴反轉

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```
mode === 'live'    → 解鎖
mode === 'demo'    → 解鎖（演示模式展示完整功能，讓投資人看到「註冊後的完整體驗」）
mode === 'visitor' → blur + LockedOverlay + 「註冊查看更多」→ 引導註冊
```

> **變更**：演示模式下第 3 則直接解鎖（而非跳到社區牆），更直覺地展示完整功能。

**LockedOverlay 依賴反轉**：移除 `:361 handleAuthRedirect` → `navigate('/maihouses/auth.html')` 內建跳轉邏輯。LockedOverlay 只負責展示，`onCtaClick` 完全由父組件注入。

```typescript
// ❌ 現況：LockedOverlay 內建導航邏輯（違反 DIP + SRP）
<LockedOverlay /> // 內部 handleAuthRedirect → navigate('/maihouses/auth.html')

// ✅ 修正：父組件決定行為
<LockedOverlay onCtaClick={() => showRegisterGuide({ message: '註冊解鎖完整社區評價' })} />
```

#### 3-C. AgentReviewListModal Demo 孤島邏輯

**檔案**：`src/components/AgentReviewListModal.tsx`

- `:60` — 移除 `agentId.startsWith('mock-') || agentId === SEED_AGENT_ID` 獨立判斷
- `:71-77` — 改用 `usePageMode()` 判斷資料來源

#### 3-D. 其他 `disabled={!isLoggedIn}` 位置

> 以下位置雖歸屬其他工單，但需同步清理：
- `src/pages/Community/components/PostsSection.tsx` `:279` → 歸 #8
- `src/components/Feed/FeedPostCard.tsx` `:110` → 歸 #6b
- `src/pages/Community/Wall.tsx` `:241-256` `handleLike` → 歸 #8

**驗收標準**：
- 訪客模式：按讚可點擊，彈出註冊引導 toast
- 演示模式：按讚本地 toggle，數字變化
- 正式模式：按讚 API 寫入
- 全專案搜尋 `disabled={!isLoggedIn}` 回傳 0 筆

---

### #4a [P1] 房產詳情頁：移除 isDemoPropertyId + 社會證明接入 usePageMode

**目標**：移除孤島 mock 判斷，改用統一 hook

**施工項目**：

#### 4a-A. 移除 `isDemoPropertyId` 孤島邏輯

需修改的具體位置：

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/constants/property.ts` | 1-4 | 移除 `DEMO_PROPERTY_ID` + `isDemoPropertyId()` 定義 |
| `src/services/propertyService.ts` | 5, 366 | 移除 import 和 `isDemo = isDemoPropertyId(publicId)` |
| `src/pages/PropertyDetailPage.tsx` | 29 | 移除 import |
| `src/pages/PropertyDetailPage.tsx` | 127 | 移除 `isDemo: isDemoPropertyId(id)` |
| `src/pages/PropertyDetailPage.tsx` | 249 | `enabled` 條件改用 `mode !== 'demo'` |
| `src/pages/PropertyDetailPage.tsx` | 292-294 | Demo Assure 導航改用 mode 判斷 |
| `src/pages/PropertyDetailPage.tsx` | 679-713 | Dev 測試按鈕改用 mode 判斷 |
| `src/pages/PropertyDetailPage.tsx` | 774-785 | 傳遞 mode 取代 isDemo prop |
| `src/pages/PropertyDetailPage.tsx` | 813 | 已驗證徽章改用 mode 判斷 |
| `src/components/AgentReviewListModal.tsx` | 60, 71-77 | 移除獨立 isDemo 判斷，接入 usePageMode |
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` | 86 | `property.isDemo ? true` → 改用 mode 判斷 isVerified |

#### 4a-A2. AgentTrustCard 移除 isDemo prop

**問題**：父組件傳入 `isDemo` prop（`:784-785`），但組件內部可自行呼叫 `usePageMode()`，違反 DIP + ISP。

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/components/AgentTrustCard.tsx` | interface | 移除 `isDemo?: boolean` prop |
| `src/components/AgentTrustCard.tsx` | 內部邏輯 | 改用 `const mode = usePageMode()` 自行判斷 |
| `src/pages/PropertyDetailPage.tsx` | 784-785 | 移除 `isDemo={property.isDemo}` prop 傳遞 |

#### 4a-B. 社會證明（Social Proof）

**檔案**：`src/pages/PropertyDetailPage.tsx` `:261-279`

```
mode === 'live'    → API 資料（publicStats）
mode === 'demo'    → seed 隨機數（現有 charCode 邏輯）
mode === 'visitor' → seed 隨機數
```

**驗收標準**：
- 全專案搜尋 `isDemoPropertyId` 回傳 0 筆
- 全專案搜尋 `DEMO_PROPERTY_ID` 回傳 0 筆
- 詳情頁根據 usePageMode 自動切換行為

---

### #4b [P1] 房產詳情頁：連結修正

**目標**：詳情頁內的靜態 HTML 連結改為 React 路由

**施工項目**：

#### 4b-A. 「前往社區牆」連結

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 247 | `navigate('/maihouses/community-wall_mvp.html')` | `/community/{communityId}/wall` |
| `src/features/home/components/CommunityWallCard.tsx` | 70 | `'/maihouses/community-wall_mvp.html'` | `/community/{communityId}/wall` |

#### 4b-B. 「註冊查看」連結

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 243 | `navigate('/maihouses/auth.html?mode=login')` | React 路由或 toast 引導 |

**驗收標準**：
- 詳情頁相關檔案搜尋 `community-wall_mvp` 和 `auth.html` 回傳 0 筆

---

### #5a [P1] UAG：新增訪客 Landing Page + 角色守衛

**目標**：訪客進 UAG 看到產品介紹而非 mock 資料；consumer 不該能操作房仲後台

**施工項目**：

#### 5a-A. 新增 Landing Page 元件

**新增檔案**：`src/pages/UAG/UAGLandingPage.tsx`

- 功能說明（AI 智能客戶雷達、即時信賴指數、一鍵成交報告）
- 截圖/動畫展示後台功能
- 「成為合作房仲」CTA → 註冊頁
- 原因：mock 資料含 Lead 姓名、電話、分級等敏感欄位，不該對訪客展示

#### 5a-B. UAG 入口路由判斷 + 角色守衛

**檔案**：`src/pages/UAG/index.tsx`、`App.tsx` :100-115

```
mode === 'visitor'                    → 渲染 <UAGLandingPage />
mode === 'demo'                       → 渲染現有 UAG 後台（seed 資料）
mode === 'live' + role === 'agent'    → 渲染現有 UAG 後台（API）
mode === 'live' + role === 'consumer' → 顯示「此功能僅限合作房仲」→ 引導回首頁
```

**驗收標準**：
- 訪客進入 UAG 看到產品介紹頁，看不到任何 mock 資料
- consumer 進入 UAG 看到引導提示，無法操作後台
- 演示模式和正式模式（agent）不受影響

---

### #5b [P1] UAG：後台接入 usePageMode + uagModeStore 消費者遷移策略

**目標**：UAG 後台由 usePageMode 自動判斷模式，定義 uagModeStore 移除後的消費者遷移路徑

**施工項目**：

#### 5b-A. 演示模式行為

- seed 資料完整展示（MOCK_DB 的 16 個 Lead、3 個 Listings、Mock Agent Profile）
- 所有按鈕可操作 → 本地執行（數字變、狀態變、動畫跑）→ 不寫 DB
- 本地操作存純 React state，重新整理就消失

**購買 Lead 演示流程**：
1. 點「購買」→ 本地扣除配額（React state `remainingQuota -= 1`）
2. Lead 狀態從「可購買」變為「已購買」（本地 state toggle）
3. 購買歷史列表本地新增一筆（React state push）
4. 保護期倒數計時：直接顯示一個固定的倒數 UI（如 `23:59:59`），不需要真的倒數

**發送訊息演示流程**：
1. 點「發送」→ 本地新增訊息到聊天列表（React state push）
2. 顯示「已送出」toast
3. 不呼叫 API、不走 Supabase

**聊天室導航（沉浸感保護）**：
- 發送訊息後，列表出現新訊息 → 點「打開聊天室」
- **禁止**彈 toast「Mock 模式，聊天室功能需要切換到 Live 模式」（現有 `UAG/index.tsx:65-68` 的行為，破壞沉浸感）
- **應改為**：進入簡易 Mock 聊天 UI，顯示本地訊息列表（React state），可輸入新訊息（本地 push）
- 若建 Mock 聊天 UI 成本過高，退而求其次：進入真實聊天 UI（`/chat/{conversationId}`）但聊天室為空（只顯示本地訊息）

#### 5b-B. 正式模式行為

- 已登入 agent → **自動 Live 模式**（目前 `uagModeStore:79` 默認 Mock，agent 首次進入看到假資料）
- 已登入 consumer → 顯示「此功能僅限合作房仲」→ 引導回首頁
- `toggleMode`（`useUAGData.ts:93-103`）需加角色檢查：consumer 不可切到 Live（目前只檢查 userId 有無值）

#### 5b-C. uagModeStore 消費者遷移策略

| 消費者檔案 | 舊呼叫 | 改為 |
|-----------|--------|------|
| `useUAGData.ts` | `useUAGModeStore(selectUseMock)` | `const mode = usePageMode()` → `mode === 'demo'` |
| `useAgentProfile.ts` | `useMock` prop/state | `const mode = usePageMode()` → `mode === 'demo'` |
| `TrustFlow/index.tsx` | `useUAGModeStore(selectUseMock)` | `const mode = usePageMode()` → `mode === 'demo'` |
| `UAG/Profile/index.tsx` | `searchParams.get('mock')` | `const mode = usePageMode()` → `mode === 'demo'` |
| `Profile/hooks/useAgentProfile.ts` | mock 判斷 | `const mode = usePageMode()` → `mode === 'demo'` |

**遷移原則**：
1. 每個消費者直接呼叫 `usePageMode()` — 回傳單一 `PageMode` 值，不需中間適配層
2. 所有 `useMock` boolean → 統一用 `mode === 'demo'`
3. React Query 的 `enabled` 條件：`enabled: mode === 'live' && ...`
4. React Query 的 `queryKey` 必須包含 mode（見 #1b 1-C Cache Key 規範）
5. Mock 資料回傳邏輯：`if (mode !== 'live') return MOCK_DATA`
6. 互動操作建議使用 `useModeAwareAction`（見 #1b 1-D2）

#### 5b-D. 移除 mock/live toggle

需修改的具體位置：

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/stores/uagModeStore.ts` | 全檔 | 移除整個 Zustand store |
| `src/pages/UAG/hooks/useUAGData.ts` | 20, 78-103 | 移除 `useUAGModeStore` import 和 `toggleMode`，改用 usePageMode |
| `src/pages/UAG/hooks/useAgentProfile.ts` | 4, 20-35 | 移除 `useMock` 判斷，改用 usePageMode |
| `src/pages/UAG/components/TrustFlow/index.tsx` | 14, 34 | 移除 `selectUseMock` 引用 |
| `src/pages/UAG/Profile/index.tsx` | 49, 55 | 移除 `?mock=true` URL 參數判斷 |
| `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | 49-50 | 移除 mock 判斷 |

**驗收標準**：
- 演示模式操作本地化，不寫 DB
- agent 登入看到真實資料
- consumer 登入看到引導提示
- 全專案搜尋 `uagModeStore` 回傳 0 筆
- 全專案搜尋 `selectUseMock` 回傳 0 筆
- 不存在手動 mock/live 切換 UI

---

### #6a [P1] Feed：Logo 導航修復 + 廢棄路由清理

**目標**：修復 Feed 頁面的導航死路

**施工項目**：

#### 6a-A. Logo 導航修復

需修改的具體位置：

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/layout/GlobalHeader.tsx` | 109-115 | 根據 role 切換 `homeLink`（agent→FEED_AGENT、consumer→FEED_CONSUMER）| 統一 `ROUTES.HOME` |
| `src/components/layout/GlobalHeader.tsx` | 246 | `targetPath = ROUTES.FEED_CONSUMER` — Profile 導航 | 正確的 profile 路由 |
| `src/components/layout/GlobalHeader.tsx` | 283 | `href="/maihouses/auth.html?mode=login"` — 登入按鈕 | React 路由 |
| `src/components/Feed/PrivateWallLocked.tsx` | 23 | `window.location.href = ROUTES.AUTH` | React 路由或 toast |

#### 6a-B. 廢棄路由清理

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/constants/routes.ts` | 16 | 移除 `FEED_AGENT` |
| `src/constants/routes.ts` | 19 | 移除 `FEED_CONSUMER` |
| `src/constants/routes.ts` | 22 | 移除 `FEED_AGENT_LEGACY` |
| `src/constants/routes.ts` | 25 | 移除 `FEED_CONSUMER_LEGACY` |
| `src/components/layout/GlobalHeader.tsx` | 8-9 | 移除同步 HTML 的過時警告註解 |

**驗收標準**：
- Feed 頁面 Logo 回到首頁
- 全域搜尋 `FEED_AGENT`、`FEED_CONSUMER` 回傳 0 筆
- GlobalHeader 不再有 auth.html 引用

---

### #6b [P1] Feed：移除 DEMO_IDS + 接入 usePageMode + 演示入口路由

**目標**：Feed 改用統一 hook 判斷模式，定義演示模式下 Feed 的入口路由

**施工項目**：

#### 6b-A. 演示模式 Feed 入口路由

新增固定演示路由 `/feed/demo`（移除 DEMO_IDS 後演示模式需有入口）

```
App.tsx 路由：
  /feed/demo  → Feed 頁面，usePageMode 判斷為 demo → 載入 seed 資料
  /feed/:userId → Feed 頁面，正常邏輯
```

Feed/index.tsx 入口判斷：
```
const { userId } = useParams()
const mode = usePageMode()

if (userId === 'demo' || mode === 'demo') → 載入 seed feed
else if (userId) → 正常載入
else → redirect 首頁
```

#### 6b-A2. RoleToggle 語義釐清

**問題**：Feed 的 RoleToggle（演示用切換消費者/房仲版面）和社區牆的 RoleSwitcher（DEV 工具切換 guest/member/resident/agent）邏輯不一致，容易混淆。

**修正**：明確區分兩者語義：
- `<DemoRoleToggle />`：演示模式專用，切換消費者/房仲體驗版面（`mode === 'demo'` 時顯示）
- `<DevRoleSwitcher />`：開發工具，切換權限角色（`import.meta.env.DEV` 時顯示）

> 若統一為單一元件，判斷條件改為 `(import.meta.env.DEV || mode === 'demo')` 時顯示。

#### 6b-B. 移除 DEMO_IDS 白名單

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Feed/index.tsx` | 19 | 移除 `DEMO_IDS` 定義 |
| `src/pages/Feed/index.tsx` | 30-32 | 移除 `isDemo`/`forceMock` 判斷，改用 usePageMode |
| `src/pages/Feed/index.tsx` | 40-50 | 移除 forceMock 分支 |
| `src/pages/Feed/index.tsx` | 84-87 | RoleToggle 改用 mode 判斷 |
| `src/components/Feed/FeedPostCard.tsx` | 110 | 移除 `disabled={!isLoggedIn}` |
| `src/hooks/useFeedData.ts` | 139, 183 | 移除獨立 `useMock` 判斷 |

#### 6b-C. 舊 DEMO_IDS URL 301 重導向

移除 `DEMO_IDS` 後，外部已分享的舊連結（如 `/feed/demo-001`）會 404。需在 #9 施工時補充 `vercel.json` 301 規則：

```json
{ "source": "/maihouses/feed/demo-:id", "destination": "/maihouses/feed/demo", "statusCode": 301 }
```

**驗收標準**：
- 全域搜尋 `DEMO_IDS` 回傳 0 筆
- Feed 根據 usePageMode 自動切換行為
- `/feed/demo` 路由可正常載入 seed feed
- `/feed/demo-001` 等舊 URL 301 至 `/feed/demo`

---

### #7 [P1] 登入後重定向修正

**目標**：登入後導向合理的目標頁面

**施工項目**：

#### 7-A. 重定向邏輯 + 角色分流

**檔案**：`public/auth.html`（約 :1620-1660 `successRedirect` 函數）

**現況問題**：`auth.html:1647` 統一 `go('/maihouses/feed/${user.id}')`，無角色區分。

**應改為**：

```javascript
function successRedirect(user) {
  // 1. 清除演示狀態（見 7-B）
  try { localStorage.removeItem('mai-demo-verified') } catch (e) { /* Safari 隱私模式 */ }

  // 2. 有 ?return= → 回到原頁
  const returnPath = getSafeReturnPath()
  if (returnPath) { go(returnPath); return }

  // 3. 角色分流
  const role = user.user_metadata?.role
  if (role === 'agent') {
    go('/maihouses/uag')
  } else {
    go('/maihouses/')  // consumer → 首頁
  }
}
```

**角色讀取**：從 `user.user_metadata.role` 取得（註冊時選擇的角色存在 Supabase user metadata 中）。

#### 7-B. 清除演示狀態

**呼叫位置**：`public/auth.html` 登入成功回調中（約 :1647 行），在 `go()` 重定向之前。

```javascript
// auth.html 登入成功回調
function onLoginSuccess(user) {
  // 1. 清除演示狀態（若有）
  localStorage.removeItem('mai-demo-verified')

  // 2. 根據角色重定向
  if (hasReturn) go(getSafeReturnPath())
  else if (user.role === 'agent') go('/maihouses/uag')
  else go('/maihouses/')
}
```

**為何不在 App.tsx 清除**：`usePageMode()` 判斷已登入時回傳 `'live'`，但 localStorage 中的演示標記仍殘留。雖不影響功能（已登入優先級最高），但登出後殘留標記可能讓使用者意外回到演示模式。因此在登入成功時明確清除。

#### 7-C. 演示模式下進入 auth.html 的行為

**規則**：演示模式下不應該進入 auth.html（見 #1a 1-A5）。所有 auth 跳轉點已被 `handleAuthNavigation()` 攔截，彈 toast「請先退出演示模式」。

**但若使用者直接在網址列輸入 auth.html**：auth.html 本身不需要特殊處理，因為：
- 使用者正常登入 → 7-B 的 `onLoginSuccess` 清除演示標記 → 進入正式模式
- 使用者取消登入 → 回到原頁 → 仍在演示模式（不受影響）

**驗收標準**：
- agent 登入後到 UAG
- consumer 登入後到首頁
- 登入成功後 localStorage 無 `mai-demo-verified` 殘留
- 演示模式下點「登入/註冊」按鈕被攔截，顯示 toast 提示

---

### #8a [P2] 社區牆權限重構 — `useEffectiveRole` hook + 按讚三模式

**目標**：抽取角色判斷 hook + 社區牆按讚改用 `useModeAwareAction`

**依賴**：#1a、#1b

**施工項目**：

#### 8-A. `effectiveRole` 抽取為獨立 hook + 整合 `usePageMode`

**問題**：`Wall.tsx:123-128` effectiveRole 計算混在頁面組件，同時處理 URL/localStorage/auth/dev 四種來源，違反 SRP。

**修正**：抽取為 `useEffectiveRole(urlRole?)` hook，並整合 mode 判斷。

```typescript
// src/hooks/useEffectiveRole.ts（新增）
type Role = 'guest' | 'consumer' | 'resident' | 'agent' | 'admin' | 'official'

function useEffectiveRole(urlRole?: Role): Role {
  const mode = usePageMode()
  const { role: authRole, isAuthenticated, loading } = useAuth()

  return useMemo(() => {
    if (loading) return 'guest'
    if (mode === 'demo') return 'resident'  // 演示模式自動 resident
    const allowMockRole = import.meta.env.DEV && urlRole && urlRole !== 'guest'
    if (allowMockRole) return urlRole
    return isAuthenticated ? authRole : 'guest'
  }, [mode, urlRole, authRole, isAuthenticated, loading])
}
```

> **⚠️ `admin` / `official` 角色**：`getPermissions()` 目前只處理 guest/consumer/resident/agent，admin 和 official 未定義權限。施工時須補充這兩個角色的權限對照表，或明確標示為 `agent` 超集。

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/hooks/useEffectiveRole.ts` | 新增 | 獨立 hook，封裝 mode + role 計算邏輯 |
| `src/pages/Community/Wall.tsx` | 80-81 | `initialRole` 移除硬設 guest，改用 `useEffectiveRole()` |
| `src/pages/Community/Wall.tsx` | 122-128 | 移除行內 `effectiveRole` useMemo，改用 `useEffectiveRole(urlRole)` |

#### 8-B. `handleLike` auth guard → mode guard

> **Mode Guard 執行順序規範**（同 #3）：mode 判斷必須在 auth 判斷之前，否則演示模式未登入直接被 `Wall.tsx:244 if (!isAuthenticated)` 攔截。

建議改用 `useModeAwareAction`（見 #1b 1-D2）：

```typescript
const handleLike = useModeAwareAction<string>({
  visitor: () => showRegisterGuide({ message: '註冊後即可鼓勵評價' }),
  demo: (reviewId) => setLocalLikes(prev => toggle(prev, reviewId)),
  live: async (reviewId) => {
    if (!isAuthenticated) return // auth guard 只在 live 模式才需要
    await likeMutation.mutateAsync(reviewId)
  },
})
```

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Community/Wall.tsx` | 241-256 | `handleLike` 改用 `useModeAwareAction`（mode guard 自動在 auth guard 之前）|
| `src/pages/Community/Wall.tsx` | 258-261 | `handleUnlock` 只彈 toast「功能開發中」→ 改為 `showRegisterGuide()` |
**驗收標準（#8a）**：
- `useEffectiveRole()` hook 正確回傳角色（demo→resident、loading→guest、live→authRole）
- 社區牆按讚走 `useModeAwareAction`（mode guard 在 auth guard 之前）
- 演示模式下社區牆全部可見

---

### #8b [P2] 社區牆互動本地化 — 發文/留言演示 + LockedOverlay CTA + BottomCTA

**目標**：社區牆互動操作本地化 + 引導完善

**依賴**：#8a、#14b、#15

**施工項目**：

#### 8-B2. 互動引導修正

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Community/Wall.tsx` | 258-261 | `handleUnlock` 改為 `showRegisterGuide()` |
| `src/pages/Community/components/PostsSection.tsx` | 279 | 移除 `disabled={!isLoggedIn}`，改用 `useModeAwareAction` |
| `src/pages/Community/components/BottomCTA.tsx` | 32 | `auth.html` → `getAuthUrl()` + `?return=`（見 #15）|

#### 8-C. 演示模式下操作本地化

- 發文、留言 → 本地新增（不寫 DB）→ 存純 React state，重新整理就消失
- 按讚 → 本地 toggle（React state `Set<string>` 記錄已按讚 ID）

**發文演示流程**：
1. 使用者輸入文字 → 點「發表」
2. 本地新增一筆到貼文列表最上方（React state `unshift`）
3. 作者顯示為「演示用戶」，時間顯示為「剛才」
4. 不呼叫 API

**留言演示流程**：
1. 使用者輸入留言 → 點「送出」
2. 本地新增一筆到該貼文的留言列表（React state `push`）
3. 不呼叫 API

**驗收標準（#8b）**：
- 演示模式發文/留言本地化，不觸發 API
- LockedOverlay CTA 改為 `showRegisterGuide()`
- BottomCTA auth 引用改用 `getAuthUrl()`
- 社區牆相關檔案搜尋 `auth.html` 回傳 0 筆

---

### #9 [P2] 移除所有靜態 HTML mock 頁 + 部署設定同步

**目標**：清理所有靜態 HTML 殘留

**施工項目**：

| 檔案 | 動作 |
|------|------|
| `public/community-wall_mvp.html` | 移除或 redirect |
| `public/maihouses/community-wall_mvp.html` | 移除或 redirect |
| `public/feed-agent.html` | 移除或 redirect |
| `public/feed-consumer.html` | 移除或 redirect |
| `public/auth/after-login.html` `:20` | `<noscript>` fallback → 改為 `/maihouses/` |
| `vercel.json` `:57` | Rewrite rule `"dest": "/auth.html"` — 需同步更新 |
| `vercel.json` | 新增 301：`/feed/demo-:id` → `/feed/demo`（見 #6b-C）|

**前置條件**：#2、#6 完成後才能移除

**驗收標準**：
- 不存在任何指向靜態 HTML mock 頁的連結
- `vercel.json` rewrite 規則與新路由一致

---

### #10a [P2] `DemoBadge.tsx` 浮動標籤 UI + 全域掛載

**目標**：演示模式下有明確的視覺提示

**依賴**：#1a

**施工項目**：

#### 10-A. 浮動標籤元件

**新增檔案**：`src/components/DemoGate/DemoBadge.tsx`

**桌面版**：
- 右下角固定浮動（`fixed bottom-4 right-4`）
- `z-index: 40`（低於 modal/toast 的 50，高於一般內容）
- 顯示「演示模式」文字 + 剩餘時間 + 「退出」按鈕
- 小尺寸（不遮擋主要內容）

**手機版**：
- 位置改為**左下角**（`fixed bottom-4 left-4`），避免遮擋 MobileActionBar 的「加 LINE」和「致電」按鈕（右下角）
- 或改為**頂部通知條**（`fixed top-0 left-0 right-0`），薄橫條不佔太多空間

> **⚠️ 具體 UI 設計需呼叫 `/ui-ux-pro-max` 確認**，此處僅定義功能需求。

#### 10-B. 全域掛載

- 在 App.tsx 或 Layout 層根據 `usePageMode()` 條件渲染
- `mode === 'demo'` → 渲染 `<DemoBadge />`
- 其他模式 → 不渲染

**驗收標準（#10a）**：
- 演示模式下每個頁面都看得到標籤
- 正式模式和訪客模式不顯示標籤
- 手機版不遮擋 MobileActionBar

---

### #10b [P2] `exitDemoMode()` 退出清理策略 + 確認 dialog

**目標**：退出時清理所有殘留狀態

**依賴**：#10a

**施工項目**：

#### 10-C. 退出演示全域清理

**退出流程（含確認）**：

1. 使用者點 DemoBadge「退出」按鈕
2. 彈 toast 確認：「確定要退出演示模式嗎？」+ 「確定退出」action button
3. 使用者確認 → 彈 toast「已退出演示模式，重新載入中...」
4. 延遲 500ms（讓 toast 顯示）→ 執行 `exitDemoMode()`

**`exitDemoMode()` 清理清單**：

```typescript
function exitDemoMode(queryClient: QueryClient) {
  // 1. 清除演示驗證標記（localStorage + TTL，見 #1a 1-A2）
  clearDemoMode()

  // 2. 清除演示期間的 localStorage 殘留（如 uagModeStore 遺留）
  try { localStorage.removeItem('mai-uag-mode') } catch { /* Safari 隱私模式 */ }

  // 3. 清除 Feed RoleToggle sessionStorage
  try { sessionStorage.removeItem('feed-demo-role') } catch { /* no-op */ }

  // 4. 清除 React Query cache — 防止演示期間本地操作殘留
  //    Race Condition 範例：演示按讚 +1 → 退出 → cache 殘留 +1 → 訪客看到錯誤數字
  queryClient.clear()

  // 5. 觸發頁面重新載入（清除所有 component state）
  window.location.reload()
}
```

> **為何需要 `queryClient.clear()`**：`window.location.reload()` 雖然會重建 React tree，但如果 QueryClient 是 module-level singleton（常見模式），cache 可能殘留。明確呼叫 `clear()` 確保資料隔離。

> **為何不直接 reload 而需確認**：投資人可能正在操作（填寫表單、瀏覽內容），直接 reload 會丟失上下文。確認 dialog 給使用者一個反悔機會。

**驗收標準（#10b）**：
- 點「退出」→ 彈確認 toast → 確認後退出
- 退出後回到訪客模式，頁面狀態完全乾淨
- 退出後 localStorage / sessionStorage 無演示相關殘留

---

### #11 [P2] Feed 定位確認 + 首頁入口

**目標**：確認 Feed 在產品中的定位

**待確認**：

選項 1：Feed 是「登入後的首頁」
- 登入 → 重定向到 `/feed/{userId}`
- 未登入看不到 Feed
- 首頁不需要 Feed 入口

選項 2：Feed 是獨立社群功能
- 首頁加入「社群動態」入口
- 未登入 → 訪客模式 Feed（seed 資料 + 引導註冊）
- 登入 → `/feed/{userId}`

**施工項目**：待定位確認後展開

---

### #12 [P1] 首頁 Header 已登入狀態偵測

**目標**：已登入用戶在首頁看到個人化 Header（頭像/帳號/登出），而非永遠顯示「登入/註冊」

**施工項目**：

#### 12-A. Header 接入 useAuth

**檔案**：`src/components/Header/Header.tsx`

- 目前**整個 Header 組件未使用 `useAuth`**，所有用戶永遠看到登入/註冊按鈕
- 已登入 → 顯示頭像/帳號名 + 下拉選單（我的 Feed、我的帳號、登出）
- 未登入 → 現有登入/註冊按鈕（改為 React 路由，見 #2）

#### 12-B. 三模式下的 Header 行為

```
mode === 'visitor' → 登入/註冊按鈕（點擊跳轉 auth.html）
mode === 'demo'    → 隱藏登入/註冊按鈕（演示模式下點登入會被攔截，乾脆不顯示）
mode === 'live'    → 頭像/帳號 + 下拉選單（我的帳號、登出）
```

**演示模式 Header 特殊處理**：
- 登入/註冊按鈕不顯示（避免投資人困惑「演示模式為什麼要登入」）
- 不額外加「演示中」標記在 Header（DemoBadge 浮動標籤已有此功能，見 #10a）

> **⚠️ Header 三模式 UI 差異需呼叫 `/ui-ux-pro-max` 確認最終設計**

#### 12-C. GlobalHeader 同步修正

**問題**：Feed/社區牆使用的 `GlobalHeader.tsx` 有 `useAuth()` 但右側按鈕邏輯不完整 — 已登入時可能仍顯示登入按鈕。

**檔案**：`src/components/layout/GlobalHeader.tsx`

- `:150+` — 確認 `isAuthenticated` 時右側按鈕隱藏「登入」、顯示「帳號選單」
- 與首頁 Header（#12-A）邏輯保持一致

**驗收標準**：
- 已登入用戶在首頁不再看到「登入/註冊」
- 已登入用戶在 Feed/社區牆的 GlobalHeader 也不顯示「登入」按鈕
- 已登入 agent 可從首頁 Header 快速進入 UAG 或自己的 Feed
- 演示模式下兩個 Header 都不顯示登入/註冊按鈕

---

### #13 [P2] PropertyListPage Header 統一

**目標**：房源列表頁使用統一 Header，而非獨立的 LegacyHeader

**施工項目**：

**檔案**：`src/pages/PropertyListPage.tsx` :75-104

- 目前使用手寫 HTML `LegacyHeader`，功能與首頁 Header 不一致（無搜尋框、無膠囊、無 useAuth）
- 改為使用統一 `<Header />` 元件或新的全站統一 Header

**三模式行為**：統一使用 `<Header />` 後，自動繼承 #12 的三模式行為（visitor→登入按鈕、demo→隱藏登入、live→頭像下拉）。

**驗收標準**：
- 房源列表頁的 Header 與首頁一致
- 三模式行為與首頁 Header 一致
- 已登入狀態正確顯示

---

### #14a [P0] 前置確認：Toast action button 能力

**目標**：確認 toast 元件是否支援 action slot，若不支援需先擴展

**施工項目**：

**新增檔案**：`src/hooks/useRegisterGuide.ts`

```typescript
import { getAuthUrl } from '../lib/authUtils'

interface RegisterGuideOptions {
  /** 引導文案，依場景不同 */
  message: string
  /** 當前頁面路徑，自動帶入 ?return= */
  returnPath?: string
}

function useRegisterGuide() {
  const location = useLocation()

  return {
    showGuide: (options: RegisterGuideOptions) => {
      try {
        const returnPath =
          options.returnPath ??
          `${location.pathname}${location.search}${location.hash}`
        toast({
          message: options.message,
          action: {
            label: '免費註冊',
            onClick: () => { window.location.href = getAuthUrl('signup', returnPath) }
          },
          duration: 5000
        })
      } catch (error) {
        logger.warn('[useRegisterGuide] showGuide failed', { error })
      }
    }
  }
}
```

#### 14a-A. 確認 toast action slot

1. 檢查現有 toast 元件（sonner 或自建）是否支援 `action: { label, onClick }` 參數
2. 若支援 → #14a 完成，進入 #14b
3. 若不支援 → 擴展 toast 元件，新增 action slot

**驗收標準（#14a）**：
- toast 可接受 `action: { label: string, onClick: () => void }` 參數
- action button 可正常點擊觸發 callback

---

### #14b [P0] `useRegisterGuide()` hook + 全站 8 場景文案定義

**目標**：建立統一「引導註冊」機制

**依賴**：#14a、#15

**施工項目**：

#### 14b-A. `useRegisterGuide()` hook

**新增檔案**：`src/hooks/useRegisterGuide.ts`

```typescript
import { getAuthUrl } from '../lib/authUtils'

interface RegisterGuideOptions {
  message: string
  returnPath?: string
}

function useRegisterGuide() {
  const location = useLocation()

  return {
    showGuide: (options: RegisterGuideOptions) => {
      toast({
        message: options.message,
        action: {
          label: '免費註冊',
          onClick: () => {
            const returnPath =
              options.returnPath ??
              `${location.pathname}${location.search}${location.hash}`
            window.location.href = getAuthUrl('signup', returnPath)
          }
        },
        duration: 5000
      })
    }
  }
}
```

#### 14b-B. 全站引導文案統一 + 完整觸發場景清單

| # | 場景 | 文案 | 觸發位置（檔案:行號） | 歸屬工單 |
|---|------|------|---------------------|---------|
| 1 | 按讚（房產詳情頁） | 「註冊後即可鼓勵評價」 | `CommunityReviews.tsx:250` | #3 |
| 2 | 按讚（社區牆） | 「註冊後即可鼓勵評價」 | `Wall.tsx:241` | #8a |
| 3 | 留言（社區牆） | 「註冊後即可參與討論」 | `PostsSection.tsx:279` | #8b |
| 4 | 留言（Feed） | 「註冊後即可參與討論」 | `FeedPostCard.tsx:110` | #6b |
| 5 | 查看更多評價（LockedOverlay） | 「註冊解鎖完整社區評價」 | `CommunityReviews.tsx:358` | #3 |
| 6 | 發文（Feed） | 「註冊後即可發表動態」 | Feed 發文按鈕 | #6b |
| 7 | 社區牆 BottomCTA | 「免費註冊查看完整社區」 | `BottomCTA.tsx:32` | #8b |
| 8 | Feed 私密牆 | 「註冊後即可查看私密動態」 | `PrivateWallLocked.tsx:23` | #6a |

**Toast 行為規範**：
- action button 文字：「免費註冊」
- 點擊後：透過 `getAuthUrl('signup', returnPath)` 跳轉（含 `?return=`）
- toast 位置：底部（bottom）
- toast 持續時間：5 秒
- 演示模式下這些觸發點不會出現（演示模式功能全開，不需引導註冊）

> **⚠️ Toast 規範需呼叫 `/ui-ux-pro-max` 確認最終設計**

**驗收標準（#14b）**：
- 全站所有「引導註冊」統一使用 `useRegisterGuide()`
- Toast 有「免費註冊」action button，可點擊跳轉
- 所有跳轉自動帶 `?return=` 參數回到原頁
- 上述 8 個觸發場景全部接入

---

### #15 [P0] auth.html 替代策略定義

**目標**：明確定義 `auth.html` 在三模式架構中的角色，統一所有 auth 引用的跳轉方式

**施工項目**：

#### 15-A. 架構決策記錄

保留 `auth.html`，禁止 `navigate()` 導向，統一使用 `window.location.href`。

#### 15-B. `?return=` 參數統一

所有跳轉 `auth.html` 的位置都必須帶 `?return=`（`auth.html:1573-1577` 已支援但目前全站 0 處使用）：

```typescript
// 工具函數
function getAuthUrl(mode: 'login' | 'signup', returnPath?: string, role?: 'agent' | 'consumer'): string {
  try {
    const url = new URL('/maihouses/auth.html', window.location.origin)
    url.searchParams.set('mode', mode)
    if (returnPath) url.searchParams.set('return', returnPath)
    if (role) url.searchParams.set('role', role)
    return url.toString()
  } catch {
    // fallback：SSR 或異常 origin 下硬拼路徑
    const params = new URLSearchParams({ mode })
    if (returnPath) params.set('return', returnPath)
    if (role) params.set('role', role)
    return `/maihouses/auth.html?${params.toString()}`
  }
}
```

**新增檔案**：`src/lib/authUtils.ts`（集中管理 auth 相關工具函數）

**使用範例**：
- 一般：`getAuthUrl('signup', \`${location.pathname}${location.search}${location.hash}\`)`
- UAG Landing CTA：`getAuthUrl('signup', '/maihouses/uag', 'agent')`

**驗收標準**：
- 全專案 `navigate(` 搜尋不含任何 `.html` 路徑
- 全專案 `auth.html` 引用皆通過 `getAuthUrl()` 產生
- 所有跳轉皆帶 `?return=` 參數
- UAG Landing「成為合作房仲」CTA 帶 `?role=agent`
- 註冊/登入完成後正確回到原頁

---

### #16 [P2] 全站 UTF-8/文案健康檢查

**目標**：清除全站使用者可見文案中的亂碼字串、非預期 Unicode 字元、emoji 混用，建立 CI 檢查門檻

**施工項目**：

#### 16-A. 全站文案掃描

- 掃描所有 `.tsx` 中使用者可見的字串（中文/英文混排、按鈕文字、toast 訊息、placeholder）
- 標記非預期字元：亂碼、零寬字元、不正確的 UTF-8 編碼、全形/半形混用
- 確認所有使用者可見文案為正確繁體中文（台灣用語）

#### 16-B. Emoji 使用規範

- 定義 emoji 允許範圍（如：`auth.html` 的角色選擇 emoji 可保留，一般按鈕文字不使用）
- 清理不必要的 emoji

#### 16-C. CI lint 規則（可選）

- 在 `npm run gate` 中加入文案健康檢查（如 ESLint custom rule 或獨立 script）
- 偵測新增 `.tsx` 中的非 ASCII 可疑字元

**驗收標準**：
- 全站使用者可見文案無亂碼
- 文案風格統一（繁體中文台灣用語）

---

### #17 [P1] `src/lib/error.ts` 統一錯誤處理工具

**目標**：建立單一錯誤處理入口，統一將 `unknown` 轉成可讀訊息，消除各處重複 `instanceof Error` 判斷。

**施工項目**：

#### 17-A. 統一錯誤提取策略（Fail Fast + Early Return）
**檔案**：`src/lib/error.ts`

- 新增命名常數 `UNKNOWN_ERROR_MESSAGE`、`ERROR_MESSAGE_KEYS`，移除 magic string。
- `getErrorMessage()` 改為 guard-clause 流程：`Error` → `string` → `record` → fallback。
- 拆分 `isErrorRecord()`、`normalizeMessage()`，確保函式職責單一。

#### 17-B. Defensive Programming：巢狀錯誤與循環引用防護
**檔案**：`src/lib/error.ts`

- 新增 `getMessageFromRecord(record, visited)`，支援巢狀 `message / msg / error` 提取。
- 使用 `WeakSet` 追蹤訪問過的物件，避免循環引用造成遞迴爆炸。
- 新增 `serializeUnknownError()`，`JSON.stringify` 失敗時 fallback `String(error)`，最終保底 `Unknown error`。

#### 17-C. Result 型別包裝（同步/非同步）
**檔案**：`src/lib/error.ts`

- 保留 `safeAsync()`、`safeSync()` 對外 API，不破壞既有呼叫點。
- 所有失敗路徑統一回傳 `Result<T>` 的 `{ ok: false, error }` 結構。

#### 17-D. 測試驗證（17 tests）
**檔案**：`src/lib/__tests__/error.test.ts`

- 覆蓋 Error/string/object/null/undefined 與 async/sync 失敗分支。
- 驗證 `safeAsync()`、`safeSync()` 在 throw/reject 時回傳一致錯誤格式。

**驗收標準**：
- [x] `src/lib/error.ts` 為單一錯誤處理入口，無重複 magic string
- [x] `getErrorMessage()` 具備 early return + defensive guard
- [x] `safeAsync()` / `safeSync()` 型別與回傳格式一致
- [x] `src/lib/__tests__/error.test.ts` 17 tests 全通過
- [x] `npm run typecheck` 通過
- [x] `npm run check:utf8` 通過

### #17 施工紀錄（2026-02-12）

#### 修改檔案

1. `src/lib/error.ts`
   - 重構為單一職責 helper：`isErrorRecord` / `normalizeMessage` / `getMessageFromRecord` / `serializeUnknownError`
   - `getErrorMessage()` 改為 guard-clause + named constants，移除型別斷言 `as { ... }`
   - 新增循環引用防護（`WeakSet`）與 fallback 保底策略

2. `.claude/tickets/MOCK-SYSTEM.md`
   - 勾選進度摘要 `#17`
   - 補齊 `#17` 工單定義、驗收標準與施工紀錄

#### 驗證結果

```bash
npm run test -- src/lib/__tests__/error.test.ts   # 17 passed
npm run typecheck                                 # 0 errors
npm run check:utf8                                # UTF-8 check passed / Mojibake check passed
```

---

### #24 [P2] Chat 頁面三模式支持

**目標**：Chat 頁面接入 `usePageMode()`，三模式下行為明確

**現況**：`src/pages/Chat/index.tsx` 使用 `useAuth()` + `useConsumerSession()`，無 `usePageMode()` 支持。演示模式下發送訊息會寫 DB。

**施工項目**：

#### 24-A. Chat 三模式行為定義

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 訊息列表 | 顯示「請登入或取得有效連結」提示 | 本地 Mock 聊天 UI | API 真實訊息 |
| 發送訊息 | 不可操作（提示登入）| 本地新增（React state push）| API 寫入 |
| Session 過期 | 顯示過期提示 | 不檢查（演示無 session）| 顯示過期提示 |

#### 24-B. 施工位置

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Chat/index.tsx` | 13-50 | 加入 `usePageMode()` 判斷 |
| `src/pages/Chat/index.tsx` | 訪客分支 | visitor → `showRegisterGuide({ message: '登入後即可開始對話' })` |
| `src/pages/Chat/index.tsx` | 演示分支 | demo → 本地化聊天（React state） |

**驗收標準**：
- 訪客進 `/chat` → 看到登入提示
- 演示模式進 `/chat` → 可本地發送訊息，不寫 DB
- 正式模式 → 現有邏輯不變
- Chat 相關檔案搜尋 `auth.html` 回傳 0 筆（改用 `getAuthUrl()`）

---

### #25 [P2] Assure 信賴交易頁面三模式支持

**目標**：Assure 頁面用 `usePageMode()` 替代 `isMock`，三模式行為明確

**現況**：`src/pages/Assure/Detail.tsx` 使用 `useTrustRoom()` 的 `isMock` 判斷，未接入 `usePageMode()`。

**施工項目**：

#### 25-A. Assure 三模式行為定義

| 區塊 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 案件詳情 | 顯示「請登入查看」提示 | Mock 資料展示（完整 UI） | API 真實資料 |
| 操作按鈕 | 不可操作 | 本地操作（不寫 DB） | API 寫入 |

#### 25-B. 施工位置

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Assure/Detail.tsx` | 23-50 | `useTrustRoom()` 的 `isMock` → 改讀 `usePageMode() === 'demo'` |
| `src/pages/Assure/Detail.tsx` | 全檔 | 加入 visitor 模式提示 |

**驗收標準**：
- 全專案搜尋 Assure 相關 `isMock` → 改為 `mode === 'demo'`
- 訪客進 `/assure` → 看到登入提示
- 演示模式 → Mock 資料展示，操作本地化

---

### #26 [P2] 登出完整清理策略

**目標**：全站統一清理函數 + UAG 獨立 handleSignOut 同步 + onAuthStateChange 防禦

**現況**：
- `GlobalHeader.tsx:handleSignOut` 只呼叫 `signOut()` + `navigate(HOME)`，未清理 cache
- `UAG/index.tsx:116-123` 有獨立的 `handleSignOut`，清理範圍與 GlobalHeader 不同步
- 缺少 `onAuthStateChange(SIGNED_IN)` 防禦（多分頁登入時 cache 殘留）

**施工項目**：

#### 26-A. 建立統一清理函數

**新增位置**：`src/lib/authUtils.ts`（與 #15 `getAuthUrl` 同檔案）

```typescript
const AUTH_CLEANUP_KEYS = [
  'mh.auth.pending_role',
  'uag_session',
  'uag_session_created',
  'uag_last_aid',
  'mai-uag-mode',
  'mai-demo-verified',
  'maimai-mood-v1',
] as const

function cleanupAuthState(queryClient: QueryClient): void {
  queryClient.clear()
  AUTH_CLEANUP_KEYS.forEach(key => {
    try { localStorage.removeItem(key) } catch { /* Safari 隱私模式 */ }
  })
  try { sessionStorage.removeItem('feed-demo-role') } catch { /* no-op */ }
}
```

#### 26-B. GlobalHeader + UAG 統一使用

**檔案**：`GlobalHeader.tsx:67-81`、`UAG/index.tsx:116-123`

```typescript
// 兩處 handleSignOut 統一呼叫
const handleSignOut = async () => {
  try {
    await signOut()
    cleanupAuthState(queryClient)
    notify.success('已登出')
    navigate(ROUTES.HOME)
  } catch (error) {
    logger.error('handleSignOut.failed', { error })
    notify.error('登出失敗，請重試')
  }
}
```

#### 26-C. onAuthStateChange 多分頁防禦

**檔案**：`App.tsx`（根層級 useEffect）

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') queryClient.clear()
  })
  return () => subscription.unsubscribe()
}, [queryClient])
```

**用途**：分頁 A 演示中 → 分頁 B 登入 → SIGNED_IN event → 清除分頁 A 的 demo cache，防止正式資料混入 seed 資料。

**驗收標準**：
- `cleanupAuthState()` 被 GlobalHeader 和 UAG 共用
- `AUTH_CLEANUP_KEYS` 包含全部 7 個 key（含 `uag_last_aid`、`maimai-mood-v1`）
- `onAuthStateChange(SIGNED_IN)` 觸發 `queryClient.clear()`
- A 帳號登出 → B 帳號登入 → 看到 B 帳號的資料（非 A 的 cache）

---

### #27 [P1] UAG 新房仲空狀態 UI + MaiMai 新手引導

**目標**：新註冊房仲進入 UAG 後台時，空白 Dashboard 改為 MaiMai 引導式 Onboarding 畫面

**依賴**：#5a（UAG Landing + auth guard）

**施工項目**：

#### 27-A. 空狀態偵測

```
Leads 數量 === 0 && Listings 數量 === 0 → 顯示 <UAGEmptyState />
```

#### 27-B. MaiMai 引導 UI

**新增組件**：`src/pages/UAG/components/UAGEmptyState.tsx`

- MaiMai 角色出場引導（使用 MaiMaiContext 的 mood 系統）
- 3 步引導：完善個人檔案 → 發布第一間房源 → 啟用智慧客戶雷達
- 每步完成可打勾，狀態存 localStorage
- UI 設計須呼叫 `/ui-ux-pro-max`

#### 27-C. 演示模式處理

- 演示模式下跳過空狀態（seed 資料已有 Lead/Listings）
- 訪客看 Landing Page（#5a），不會進到 Dashboard

**驗收標準**：
- 新 agent 首次進 UAG → 看到 MaiMai 引導，非空白頁
- 完成引導步驟後引導消失，進入正常 Dashboard
- 演示模式不觸發空狀態

---

### #19 [P1] 砍舊路徑：`/api/uag-track` → `/api/uag/track`

**目標**：統一 UAG 追蹤端點，移除已棄用的 JS 版 API 路徑。

**施工項目**：

1. `public/js/tracker.js`
   - `navigator.sendBeacon('/api/uag-track', ...)` 改為 `navigator.sendBeacon('/api/uag/track', ...)`
2. `src/hooks/usePropertyTracker.ts`
   - 三處追蹤呼叫（beacon / fetch / fallback beacon）統一改到 `/api/uag/track`
   - 抽出 `UAG_TRACK_ENDPOINT` 常數，避免 magic string
3. `api/uag-track.js`
   - 刪除 deprecated JS endpoint，正式下線舊路徑
4. `src/types/api.generated.ts`
   - API path 由 `'/uag-track'` 更新為 `'/uag/track'`

**驗收標準**：
- [x] 前端追蹤請求不再使用 `/api/uag-track`
- [x] 追蹤 API 統一走 `/api/uag/track`
- [x] deprecated JS endpoint 已下線
- [x] `typecheck` / 相關測試 / UTF-8 檢查通過

---

## 核心原則

1. **訪客模式 ≠ Mock** — 是正式頁面的「未登入視角」，seed 資料 + 限制互動 + 註冊引導
2. **演示模式 = 完整功能預覽** — 隱藏入口（長按/連按）觸發，全站生效，操作本地化，不寫 DB
3. **每個 disabled 按鈕都需要解釋** — 學習 Community Wall 的 LockedOverlay 模式
4. **消滅靜態 HTML 死路** — 所有頁面都在 React app 內，保持一致的 Header/導航
5. **角色 ≠ 登入狀態** — 未登入不代表是消費者，頁面處理「未登入」而不假設身份
6. **演示模式不影響正式用戶** — 登入後自動退出演示，正式用戶永遠不知道演示入口存在
7. **統一錯誤處理** — 所有 catch 區塊使用 `getErrorMessage()`，Supabase RPC 用 `RAISE WARNING` 不阻斷交易
8. **三層防禦** — API 在 query 層禁止（L1）、hook 層攔截（L2）、全局 onError 靜默（L3）
9. **進出清理完整** — 登入清演示標記、登出清 cache+storage、演示退出清全部
10. **全站覆蓋** — Chat 和 Assure 也要接入三模式，不遺漏任何頁面

---

## 全局驗證方式

工單更新後，每個 Wave 完成時執行以下確認：

```bash
# 1. 品質關卡（typecheck + lint）
npm run gate

# 2. 確認無遺漏的 isDemo 散布（Wave 3 後應回傳 0 筆）
grep -r "if.*isDemo\|if.*mode.*demo" src/ --include="*.tsx"

# 3. 確認 queryKey 包含 mode 參數（Wave 2/3 施工時逐一套用）
grep -r "queryKey.*\[" src/hooks/ --include="*.ts"

# 4. 確認無 auth.html navigate（應全部改用 window.location.href + getAuthUrl）
grep -r "navigate.*auth\.html" src/ --include="*.tsx"

# 5. 確認無 community-wall_mvp.html 引用（#2 完成後應回傳 0 筆）
grep -r "community-wall_mvp" src/ --include="*.tsx" --include="*.ts"

# 6. 確認無 disabled={!isLoggedIn}（#3/#8a/#8b/#6b 完成後應回傳 0 筆）
grep -r "disabled={!isLoggedIn}" src/ --include="*.tsx"

# 7. 確認 useModeAwareAction 統一策略（不應存在手動 mode 分支）
grep -r "if.*mode.*===.*demo.*{" src/ --include="*.tsx"

# 8. 確認 Chat/Assure 已接入 usePageMode（#24/#25 完成後）
grep -r "usePageMode" src/pages/Chat/ src/pages/Assure/ --include="*.tsx"

# 9. 確認登出清理完整（#26 完成後）
grep -r "queryClient.clear" src/components/layout/GlobalHeader.tsx

# 10. 確認 isMock 已被替換（#25 完成後）
grep -r "isMock" src/pages/Assure/ --include="*.tsx"
```

---

## 各 Wave 施工注意事項

> 每個 Wave 施工時須額外留意的邊界問題，已整合進對應子工單但易遺漏。

| Wave | 注意事項 |
|------|---------|
| Wave 1 | `usePageMode()` 需處理 auth loading 中間態（防 FOUC）、`isDemoMode()` JSON.parse 加 try-catch、storage event 加 debounce 防 reload 風暴、Safari 隱私模式 localStorage 可能拋錯、`returnPath` 要帶 `location.search`（不只 pathname） |
| Wave 1B | Toast duration 考慮改 Infinity（5 秒消失後失去註冊入口）、`queryClient.clear()` 評估是否改 `invalidateQueries`（clear 過度激進）、Logo 長按/連按與現有 click handler 防衝突 |
| Wave 2 | `SEED_COMMUNITY_ID` 必須在施工前確定值、SEO 爬蟲勿索引 seed 評價（加 noindex 或 robots）、seed 資料用 `Object.freeze` 防 mutate |
| Wave 3 | `getSafeReturnPath()` 加路由黑名單（`/uag` 等受限頁）、auth.html 與 useAuth 角色讀取統一用 `app_metadata`、`?mock=true` 舊 URL 做 301 重導向、`useEffectiveRole` loading 時回 `'guest'` 會閃爍 |
| Wave 4 | `maimai-mood-v1` / `uag_last_aid` 加入清理清單、Service Worker cache 演示資料需處理 |
| Wave 4B/C | `exitDemoMode()` 執行順序：先 clear cache → 清 storage → 最後 `location.replace()`（防 Race Condition）、Chat/Assure 訪客提示 UI 需 `/ui-ux-pro-max` |
