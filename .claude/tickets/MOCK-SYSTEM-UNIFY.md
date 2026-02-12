# MOCK-SYSTEM-UNIFY: 全站三模式架構設計

## 實作進度總覽

### P0 — 基礎建設

- [ ] **#1** 建立 `usePageMode()` hook + `useModeAwareAction` + mock 整合接口 + 演示觸發機制 + cache key 規範（4 新檔案，阻塞後續所有工單）
- [ ] **#2** 全站靜態 HTML 連結改為 React 路由 + `SEED_COMMUNITY_ID` 定義（7 檔 16 處）
- [ ] **#3** 按讚按鈕三模式行為分離 + hook 層繞過策略（CommunityReviews + AgentReviewListModal）
- [ ] **#14** 全站註冊引導統一策略 — `useRegisterGuide()` hook + toast action button（跨 8+ 處引導）
- [ ] **#15** auth.html 替代策略定義 — `window.location.href` + `?return=` 參數統一（10 處 auth 引用）

### P1 — 逐頁接入

- [ ] **#4a** 房產詳情頁：移除 isDemoPropertyId + 社會證明接入 usePageMode（5 檔 13 處）
- [ ] **#4b** 房產詳情頁：連結修正 — 社區牆 + 註冊查看（2 檔 3 處）
- [ ] **#5a** UAG：新增訪客 Landing Page + 角色守衛（1 新檔案 + App.tsx auth guard）
- [ ] **#5b** UAG：後台接入 usePageMode + uagModeStore 消費者遷移策略（6 檔，含 ?mock= 參數清理）
- [ ] **#6a** Feed：Logo 導航修復 + 廢棄路由清理（GlobalHeader 3 處 + routes.ts 4 常數）
- [ ] **#6b** Feed：移除 DEMO_IDS + 接入 usePageMode + 演示入口路由（3 檔 8 處）
- [ ] **#7** 登入後重定向修正 — agent→UAG、consumer→首頁（auth.html :1647）

### P1 — 跨頁面

- [ ] **#12** 首頁 Header 已登入狀態偵測（Header.tsx 未使用 useAuth，已登入仍顯示「登入/註冊」）
- [ ] **#13** PropertyListPage Header 統一（LegacyHeader → 統一 Header 元件）

### P1 — 程式碼品質改善

- [ ] **#17** 統一錯誤處理工具 — 建立 `src/lib/error.ts` + `getErrorMessage()` / `getErrorInfo()` / `safeAsync()` / `safeSync()`（17 單元測試）
- [ ] **#18** 重構錯誤處理 — `src/app/config.ts` / `src/analytics/track.ts` / `src/context/MaiMaiContext.tsx` 改用 `getErrorMessage()`（3 檔 5 處）
- [ ] **#19** Supabase RPC 錯誤處理強化 — `fn_increment_completed_cases()` / `fn_calculate_trust_score()` / `fn_recalc_encouragement_count()` 加入完整錯誤處理（3 migration 檔案）
- [ ] **#20** 整合分散 Mock Data — 建立 `src/constants/mockData.ts` 統一管理（整合 10+ 檔案，消除重複定義）

### P2 — 收尾清理

- [ ] **#8** 社區牆接入演示模式 — mode guard + effectiveRole 整合 + LockedOverlay 修復
- [ ] **#9** 移除靜態 HTML mock 頁 + 部署設定同步（4 頁移除 + after-login.html + vercel.json）
- [ ] **#10** 演示模式浮動標籤 UI + 退出全域 state 清理（DemoBadge.tsx + cleanup）
- [ ] **#11** Feed 定位確認 + 首頁入口（待確認方向）
- [ ] **#16** 全站 UTF-8/文案健康檢查（亂碼字串 + emoji 清理 + CI lint）
- [ ] **#21** 標準化 console.log 格式 — 全站改用 `logger.debug/info/warn/error` + 統一模組標籤（整合 `getErrorMessage()`）
- [ ] **#22** 修復 Tailwind classnames 排序警告 — `MetricsDisplayCard.tsx` / `MetricsDisplayCompact.tsx`（2 檔）
- [ ] **#23** 優化 React Hook 依賴陣列 — `useProfileFormState.ts:57` useMemo 依賴簡化

---

## 施工依賴關係 + 建議順序

### 依賴關係圖

```
#1 usePageMode + DemoGate ─────────┬──→ #3 按讚行為分離
                                   ├──→ #4a isDemoPropertyId 移除
                                   ├──→ #5b uagModeStore 遷移
                                   ├──→ #6b DEMO_IDS 移除
                                   ├──→ #8 社區牆演示模式
                                   ├──→ #10 浮動標籤 + 退出清理
                                   ├──→ #12 Header 三模式行為
                                   └──→ #20 Mock Data 整合（三模式區分）

#14 useRegisterGuide ──────────────┬──→ #3 visitor toast 引導
                                   ├──→ #8 handleUnlock 引導
                                   └──→ #6b Feed 互動引導

#15 authUtils + getAuthUrl ────────┬──→ #2 auth.html 引用統一
                                   ├──→ #4b 詳情頁連結修正
                                   ├──→ #6a GlobalHeader auth 引用
                                   └──→ #8 BottomCTA auth 引用

#17 統一錯誤處理工具 ──────────────┬──→ #18 錯誤處理重構
                                   ├──→ #19 Supabase RPC 錯誤處理
                                   └──→ #21 logger + getErrorMessage 整合

#2 靜態 HTML 連結清理 ─────────────→ #9 移除靜態 HTML 頁面
#6a 廢棄路由清理 ──────────────────→ #9 移除靜態 HTML 頁面
#5a UAG Landing + auth guard ──────→ #5b uagModeStore 遷移
#18 錯誤處理重構 ──────────────────→ #21 console.log 標準化
```

### 建議施工順序

| 波次 | 工單 | 原因 |
|------|------|------|
| **Wave 0** | #17、#19 | 基礎工具：統一錯誤處理 + Supabase RPC 強化，無依賴可平行 ✅ 已完成 |
| **Wave 1** | #1、#14、#15、#18 | 基礎設施：usePageMode + useRegisterGuide + authUtils + 錯誤處理重構，無依賴可平行 |
| **Wave 2** | #2、#3、#5a、#12、#20 | 依賴 Wave 1 的 hook/工具函數 + Mock Data 整合，彼此獨立可平行 |
| **Wave 3** | #4a、#4b、#5b、#6a、#6b、#7、#8 | 逐頁接入，部分可平行（#4a/#4b 同頁，#5a→#5b 序列）|
| **Wave 4** | #9、#10、#13、#16、#21、#22、#23 | 收尾清理，依賴前面全部完成 |
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

同一個網址，三種狀態自動共存：未登入看訪客模式、輸入隱藏密碼進演示模式、登入後進正式模式。

---

## 三種模式定義

### 訪客模式（Visitor Mode）

- **觸發**：未登入（自動，預設狀態）
- **資料**：seed 優先，API 可用時替換
- **互動**：部分可用、部分引導註冊
- **對象**：所有未登入的人（消費者、房仲、投資人都可能）
- **核心**：不是 mock 頁，是正式頁面的「未登入視角」

### 演示模式（Demo Mode）

- **觸發**：首頁 Logo 隱藏入口 → 輸入密碼 → localStorage + TTL 儲存
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

- 首頁 Logo 長按（3 秒）或連點（5 下）→ 彈出密碼輸入框
- 密碼驗證成功 → `setDemoMode()`（localStorage + 2 小時 TTL）
- 全站進入演示模式（跨分頁生效）
- TTL 到期 → 自動退出（2 小時無需重新輸入密碼）
- 正式用戶完全不知道這個機制存在
- 演示模式下右下角浮動標籤「演示模式」+ 退出按鈕

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

- 接入 usePageMode 控制資料來源（演示模式不走 API）
- 其餘不需改動，目前做得最好的頁面之一

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

> **訪客模式採用 Landing Page 方案**：UAG 的 mock 資料含 Lead 姓名、電話、分級等敏感欄位，即使是假資料也不該對訪客展示。訪客看到的是產品介紹頁（功能說明 + 截圖 + 「成為合作房仲」CTA），演示模式（密碼觸發）才進入真正後台。

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

### #1 [P0] 建立 `usePageMode()` hook + mock 整合接口 + 演示觸發機制

**目標**：建立全站統一的模式判斷系統、定義與三套 mock 系統的整合接口、演示模式隱藏入口

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

**原因**：`sessionStorage` 不跨分頁（`target="_blank"` 開新分頁讀不到演示狀態），改用 `localStorage` + 2 小時 TTL，關閉所有分頁後 TTL 到期自動退出。

```typescript
const DEMO_STORAGE_KEY = 'mai-demo-verified'
const DEMO_TTL = 2 * 60 * 60 * 1000 // 2 小時

function setDemoMode(): void {
  localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify({ t: Date.now() }))
}

function isDemoMode(): boolean {
  const raw = localStorage.getItem(DEMO_STORAGE_KEY)
  if (!raw) return false
  const { t } = JSON.parse(raw) as { t: number }
  return Date.now() - t < DEMO_TTL
}

function clearDemoMode(): void {
  localStorage.removeItem(DEMO_STORAGE_KEY)
}
```

> 此變更同步影響 #10-C 退出清理（改清 localStorage）和 1-D 觸發元件（改寫 localStorage）。

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
function useModeAwareAction<T>(handlers: {
  visitor: () => void
  demo: (data: T) => void
  live: (data: T) => Promise<void>
}) {
  const mode = usePageMode()
  return (data: T) => handlers[mode](data)
}
```

**使用範例**：
```typescript
const handleLike = useModeAwareAction<string>({
  visitor: () => showRegisterGuide({ message: '註冊後即可鼓勵評價' }),
  demo: (reviewId) => setLocalLikes(prev => toggle(prev, reviewId)),
  live: async (reviewId) => { await likeMutation.mutateAsync(reviewId) },
})
```

> 各消費者工單（#3/#5b/#6b/#8）施工時改用此 hook，消除重複的 mode 分支邏輯。

#### 1-E. 演示模式觸發元件

**新增檔案**：`src/components/DemoGate/DemoGate.tsx`

- Logo 長按（3 秒）或連點（5 下）→ 彈出密碼輸入框
- 密碼驗證成功 → `setDemoMode()`（寫入 localStorage + TTL，見 1-A2）
- 頁面自動刷新進入演示模式
- 密碼存在環境變數 `VITE_DEMO_PASSWORD`

**防衝突設計**：
- 長按期間呼叫 `e.preventDefault()` 阻止瀏覽器原生選單
- 長按未達 3 秒鬆開 → 正常觸發 `<a>` 導航
- 連點 5 下方案作為 fallback

#### 1-F. 演示模式浮動標籤（基礎版）

- 演示模式時右下角顯示「演示模式」小標籤
- 標籤上有「退出」按鈕 → 執行 `exitDemoMode()` → 回到訪客模式

**驗收標準**：
- `usePageMode()` 回傳單一 `PageMode` 值（非物件），正確判斷三種模式
- Logo 隱藏入口可觸發演示模式（長按 + 連點兩種方式皆可）
- 演示狀態存 localStorage + 2 小時 TTL（跨分頁可用，TTL 到期自動退出）
- 登入後演示狀態自動清除（`clearDemoMode()`）
- `useModeAwareAction` hook 可正確派發三模式行為
- 各 mock 系統消費者可透過 `usePageMode() === 'demo'` 取得統一判斷（不使用解構）

---

### #2 [P0] 全站靜態 HTML 連結改為 React 路由 + `SEED_COMMUNITY_ID` 定義

**目標**：消滅所有靜態 HTML 死路，讓訪客不會「掉出」React app

**施工項目**：

#### 2-A. 定義 `SEED_COMMUNITY_ID` 常數

**新增位置**：`src/constants/seed.ts`（新檔案，集中管理所有 seed 常數）

```typescript
/** 首頁社區評價連結用的 seed 社區 ID — 用第一筆真實社區 ID 或專用 seed */
export const SEED_COMMUNITY_ID = 'xxx-待確認'
```

**待確認**：seedId 值來源（選項 A：真實社區 ID / 選項 B：專用 seed 路由 / 選項 C：社區列表頁）

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

- seed 資料完整展示
- 所有按鈕可操作 → 本地執行（數字變、狀態變、動畫跑）→ 不寫 DB

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
4. React Query 的 `queryKey` 必須包含 mode（見 #1 1-C Cache Key 規範）
5. Mock 資料回傳邏輯：`if (mode !== 'live') return MOCK_DATA`
6. 互動操作建議使用 `useModeAwareAction`（見 #1 1-D2）

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

**驗收標準**：
- 全域搜尋 `DEMO_IDS` 回傳 0 筆
- Feed 根據 usePageMode 自動切換行為
- `/feed/demo` 路由可正常載入 seed feed

---

### #7 [P1] 登入後重定向修正

**目標**：登入後導向合理的目標頁面

**施工項目**：

#### 7-A. 重定向邏輯

**檔案**：`public/auth.html`

```
登入成功後：
  1. 有 ?return= → 回到原頁（保留不變）
  2. agent 角色 → /uag
  3. consumer 角色 → /（首頁，帶已登入狀態）
```

#### 7-B. 清除演示狀態

- 登入成功後自動清除演示驗證標記（`clearDemoMode()`）
- 確保正式模式接管

**驗收標準**：
- agent 登入後到 UAG
- consumer 登入後到首頁
- 演示模式下登入後自動退出演示

---

### #8 [P2] 社區牆接入演示模式 — mode guard + effectiveRole 整合

**目標**：社區牆在演示模式下自動展示完整功能

**施工項目**：

#### 8-A. `effectiveRole` 抽取為獨立 hook + 整合 `usePageMode`

**問題**：`Wall.tsx:123-128` effectiveRole 計算混在頁面組件，同時處理 URL/localStorage/auth/dev 四種來源，違反 SRP。

**修正**：抽取為 `useEffectiveRole(urlRole?)` hook，並整合 mode 判斷。

```typescript
// src/hooks/useEffectiveRole.ts（新增）
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

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/hooks/useEffectiveRole.ts` | 新增 | 獨立 hook，封裝 mode + role 計算邏輯 |
| `src/pages/Community/Wall.tsx` | 80-81 | `initialRole` 移除硬設 guest，改用 `useEffectiveRole()` |
| `src/pages/Community/Wall.tsx` | 122-128 | 移除行內 `effectiveRole` useMemo，改用 `useEffectiveRole(urlRole)` |

#### 8-B. `handleLike` auth guard → mode guard

> **Mode Guard 執行順序規範**（同 #3）：mode 判斷必須在 auth 判斷之前，否則演示模式未登入直接被 `Wall.tsx:244 if (!isAuthenticated)` 攔截。

建議改用 `useModeAwareAction`（見 #1 1-D2）：

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
| `src/pages/Community/components/PostsSection.tsx` | 279 | 移除 `disabled={!isLoggedIn}`，改用 `useModeAwareAction` |
| `src/pages/Community/components/BottomCTA.tsx` | 32 | `auth.html` → `getAuthUrl()` + `?return=`（見 #15）|

#### 8-C. 演示模式下操作本地化

- 發文、留言 → 本地新增（不寫 DB）

**驗收標準**：
- 演示模式下社區牆全部可見，操作本地化
- 演示模式按讚/發文不觸發 API（mode guard 在 auth guard 之前）
- 訪客模式維持現有 guest 限制（不動）
- LockedOverlay CTA 有明確的註冊引導（不再是「功能開發中」toast）
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

**前置條件**：#2、#6 完成後才能移除

**驗收標準**：
- 不存在任何指向靜態 HTML mock 頁的連結
- `vercel.json` rewrite 規則與新路由一致

---

### #10 [P2] 演示模式浮動標籤 UI + 退出全域 state 清理

**目標**：演示模式下有明確的視覺提示，退出時清理所有殘留狀態

**施工項目**：

#### 10-A. 浮動標籤元件

**新增檔案**：`src/components/DemoGate/DemoBadge.tsx`

- 右下角固定浮動
- 顯示「演示模式」
- 有「退出」按鈕 → 執行 `exitDemoMode()` → 回到訪客模式

#### 10-B. 全域掛載

- 在 App.tsx 或 Layout 層根據 `usePageMode()` 條件渲染

#### 10-C. 退出演示全域清理

**`exitDemoMode()` 清理清單**：

```typescript
function exitDemoMode(queryClient: QueryClient) {
  // 1. 清除演示驗證標記（localStorage + TTL，見 #1 1-A2）
  clearDemoMode()

  // 2. 清除演示期間的 localStorage 殘留（如 uagModeStore 遺留）
  localStorage.removeItem('mai-uag-mode') // uagModeStore STORAGE_KEY

  // 3. 清除 React Query cache — 防止演示期間本地操作殘留
  //    Race Condition 範例：演示按讚 +1 → 退出 → cache 殘留 +1 → 訪客看到錯誤數字
  queryClient.clear()

  // 4. 觸發頁面重新載入（清除所有 component state）
  window.location.reload()
}
```

> **為何需要 `queryClient.clear()`**：`window.location.reload()` 雖然會重建 React tree，但如果 QueryClient 是 module-level singleton（常見模式），cache 可能殘留。明確呼叫 `clear()` 確保資料隔離。

**驗收標準**：
- 演示模式下每個頁面都看得到標籤
- 點「退出」後回到訪客模式，頁面狀態完全乾淨
- 正式模式和訪客模式不顯示標籤
- 退出後 localStorage 無演示相關殘留

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
mode === 'visitor' → 登入/註冊按鈕
mode === 'demo'    → 隱藏登入/註冊（演示不需要），可顯示「演示中」小標記
mode === 'live'    → 頭像/帳號 + 下拉選單
```

**驗收標準**：
- 已登入用戶在首頁不再看到「登入/註冊」
- 已登入 agent 可從首頁 Header 快速進入 UAG 或自己的 Feed

---

### #13 [P2] PropertyListPage Header 統一

**目標**：房源列表頁使用統一 Header，而非獨立的 LegacyHeader

**施工項目**：

**檔案**：`src/pages/PropertyListPage.tsx` :75-104

- 目前使用手寫 HTML `LegacyHeader`，功能與首頁 Header 不一致（無搜尋框、無膠囊、無 useAuth）
- 改為使用統一 `<Header />` 元件或新的全站統一 Header

**驗收標準**：
- 房源列表頁的 Header 與首頁一致
- 已登入狀態正確顯示

---

### #14 [P0] 全站註冊引導統一策略

**目標**：建立全站統一的「引導註冊」機制，解決 8+ 處各自實作、文案不一、無 action button 的問題

**施工項目**：

#### 14-A. `useRegisterGuide()` hook

**新增檔案**：`src/hooks/useRegisterGuide.ts`

```typescript
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
      toast({
        message: options.message,
        action: {
          label: '免費註冊',
          onClick: () => {
            const returnPath = options.returnPath ?? location.pathname
            window.location.href = `/maihouses/auth.html?mode=signup&return=${encodeURIComponent(returnPath)}`
          }
        },
        duration: 5000
      })
    }
  }
}
```

#### 14-B. Toast action button 能力（前置阻塞）

**前置條件**：確認 toast 元件是否支援 action slot。若不支援，需先擴展。

> **⚠️ 阻塞警告**：若 toast 不支援 action button，整個 #14 `useRegisterGuide` 的核心功能（「免費註冊」可點擊按鈕）無法實作。**施工前必須先確認**，必要時在 #14 開頭新增「14-B0. 擴展 toast action slot」子項目。

#### 14-C. 全站引導文案統一

| 場景 | 文案 | 呼叫位置 |
|------|------|---------|
| 按讚 | 「註冊後即可鼓勵評價」 | CommunityReviews、Wall.tsx |
| 留言 | 「註冊後即可參與討論」 | PostsSection、FeedPostCard |
| 查看更多評價 | 「註冊解鎖完整社區評價」 | LockedOverlay |
| 購買 Lead | 「註冊後即可使用客戶雷達」 | UAG（不適用，訪客看 Landing Page）|
| 發文 | 「註冊後即可發表動態」 | Feed |

**驗收標準**：
- 全站所有「引導註冊」統一使用 `useRegisterGuide()`
- Toast 有「免費註冊」action button，可點擊跳轉
- 所有跳轉自動帶 `?return=` 參數回到原頁

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
function getAuthUrl(mode: 'login' | 'signup', returnPath?: string): string {
  const url = new URL('/maihouses/auth.html', window.location.origin)
  url.searchParams.set('mode', mode)
  if (returnPath) url.searchParams.set('return', returnPath)
  return url.toString()
}
```

**新增檔案**：`src/lib/authUtils.ts`（集中管理 auth 相關工具函數）

**驗收標準**：
- 全專案 `navigate(` 搜尋不含任何 `.html` 路徑
- 全專案 `auth.html` 引用皆通過 `getAuthUrl()` 產生
- 所有跳轉皆帶 `?return=` 參數
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

## 優化審查變更紀錄（2026-02-12）

> 根據三組審查團隊（訪客 × 5 / 演示 × 5 / 正式 × 5 路徑）對照 SOLID / DRY / SoC / Composition over Inheritance 原則的審查結果，以下為本次補入工單的變更摘要。

### P0 必須補入（9 項）

| # | 變更 | 影響工單 | 違反原則 |
|---|------|---------|---------|
| 1 | `usePageMode()` 回傳單一 `PageMode` 值（非物件）| #1（1-A）| ISP |
| 2 | Mode Guard 必須在 Auth Guard 之前 + 執行順序規範 | #3、#8 | SoC |
| 3 | React Query Cache Key 必須包含 mode | #1（1-C）| 資料隔離 |
| 4 | 新增 `useModeAwareAction` hook 統一「本地操作不寫 DB」策略 | #1（1-D2）→ #3/#5b/#6b/#8 消費 | DRY |
| 5 | 演示退出 `exitDemoMode()` 加入 `queryClient.clear()` | #10（10-C）| 狀態完整性 |
| 6 | 演示狀態從 sessionStorage 改為 localStorage + 2h TTL（跨分頁） | #1（1-A2）| 資料一致性 |
| 7 | ✅ 建立統一錯誤處理工具 `src/lib/error.ts` | #17 | DRY + Type Safety |
| 8 | ✅ Supabase RPC 錯誤處理強化 + `RAISE WARNING` 不阻斷交易 | #19（3 migration） | Fail Safe |
| 9 | Mock Data 整合需符合三模式架構（visitor/demo/live 區分） | #20 | SoC + DRY |

### P1 建議補入（9 項）

| # | 變更 | 影響工單 | 違反原則 |
|---|------|---------|---------|
| 7 | LockedOverlay 移除內建 `handleAuthRedirect`，改由父組件注入 `onCtaClick` | #3（3-B）、#8 | DIP + SRP |
| 8 | `effectiveRole` 抽取為 `useEffectiveRole()` 獨立 hook | #8（8-A）| SRP |
| 9 | Toast action button 能力前置確認（阻塞警告）| #14（14-B）| 前置依賴 |
| 10 | RoleToggle 語義釐清：`DemoRoleToggle` vs `DevRoleSwitcher` | #6b（6b-A2）| ISP |
| 11 | 第 3 則評價演示模式直接解鎖（取代跳到社區牆）| #3（3-B）| LSP |
| 12 | AgentTrustCard 移除 isDemo prop，改內部呼叫 `usePageMode()` | #4a（4a-A2）| DIP + ISP |
| 13 | ✅ 錯誤處理重構 — 3 檔 5 處改用 `getErrorMessage()` | #18 | DRY |
| 14 | 標準化 console.log — 整合 `logger` + `getErrorMessage()` | #21 | DRY + 可追蹤性 |
| 15 | Tailwind / React Hook 優化 | #22、#23 | Code Quality |

---

## 程式碼審計 — 優化項目清單

> 2026-02-12 由 codebase 掃描產出，每項附 `file:line` 證據。
>
> **最後更新**: 2026-02-12 新增 I 節 (已完成項目記錄)

---

### A. 靜態 HTML 死路（使用者點擊後掉出 React App）

#### A-1. `community-wall_mvp.html` 引用（6 處）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| A-1a | `src/constants/routes.ts` | 31 | `COMMUNITY_WALL_MVP: '/maihouses/community-wall_mvp.html'` | #2 |
| A-1b | `src/features/home/sections/CommunityTeaser.tsx` | 11 | `const SEED_REVIEWS_URL = '/maihouses/community-wall_mvp.html'` | #2 |
| A-1c | `src/features/home/sections/CommunityTeaser.tsx` | 103 | `window.location.href = SEED_REVIEWS_URL` | #2 |
| A-1d | `src/features/home/sections/CommunityTeaser.tsx` | 205 | `href={SEED_REVIEWS_URL}` — 「查看更多真實住戶評價」 | #2 |
| A-1e | `src/components/PropertyDetail/CommunityReviews.tsx` | 247 | `navigate('/maihouses/community-wall_mvp.html')` — 「前往社區牆」 | #4b |
| A-1f | `src/features/home/components/CommunityWallCard.tsx` | 70 | `const communityWallUrl = '/maihouses/community-wall_mvp.html'` | #4b |

#### A-2. `auth.html` 引用（10 處）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| A-2a | `src/constants/routes.ts` | 43 | `AUTH: '/maihouses/auth.html'` | #2 |
| A-2b | `src/components/Header/Header.tsx` | 81 | `href={\`${ROUTES.AUTH}?mode=login\`}` — 桌面版「登入」 | #2 |
| A-2c | `src/components/Header/Header.tsx` | 90 | `href={\`${ROUTES.AUTH}?mode=signup\`}` — 桌面版「免費註冊」 | #2 |
| A-2d | `src/components/Header/Header.tsx` | 102 | `href={\`${ROUTES.AUTH}?mode=login\`}` — 手機版「登入」 | #2 |
| A-2e | `src/components/Header/Header.tsx` | 110 | `href={\`${ROUTES.AUTH}?mode=signup\`}` — 手機版「免費註冊」 | #2 |
| A-2f | `src/components/PropertyDetail/CommunityReviews.tsx` | 243 | `navigate('/maihouses/auth.html?mode=login')` — 「註冊查看」 | #4b |
| A-2g | `src/components/layout/GlobalHeader.tsx` | 283 | `href="/maihouses/auth.html?mode=login"` — Feed 登入按鈕 | #6a |
| A-2h | `src/pages/Community/components/BottomCTA.tsx` | 32 | `window.location.href = '/maihouses/auth.html'` | #8 |
| A-2i | `src/pages/Chat/index.tsx` | 62 | `href="/maihouses/auth.html?mode=login"` — Chat 登入提示 | #2（2-D）|
| A-2j | `src/pages/PropertyListPage.tsx` | 100 | `href="/maihouses/auth.html"` — 房源列表登入按鈕 | #2（2-D）|

#### A-3. `feed-agent.html` / `feed-consumer.html` 引用（5 處）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| A-3a | `src/constants/routes.ts` | 22 | `FEED_AGENT_LEGACY: '/maihouses/feed-agent.html'` | #6a |
| A-3b | `src/constants/routes.ts` | 25 | `FEED_CONSUMER_LEGACY: '/maihouses/feed-consumer.html'` | #6a |
| A-3c | `src/components/layout/GlobalHeader.tsx` | 8-9 | 註解提示同步 `feed-consumer.html` 與 `feed-agent.html` | #6a |
| A-3d | `public/auth/after-login.html` | 20 | `<noscript>..url=/maihouses/feed-consumer.html</noscript>` | #9 |
| A-3e | Legacy HTML 頁面互相引用 | — | `feed-agent.html` ↔ `feed-consumer.html` ↔ `community-wall_mvp.html` | #9 |

---

### B. 廢棄路由死路

| # | 檔案 | 行號 | 程式碼片段 | 問題 | 歸屬工單 |
|---|------|------|-----------|------|---------|
| B-1 | `src/constants/routes.ts` | 16 | `FEED_AGENT: '/maihouses/feed/agent'` | 路由不存在 | #6a |
| B-2 | `src/constants/routes.ts` | 19 | `FEED_CONSUMER: '/maihouses/feed/consumer'` | 路由不存在 | #6a |
| B-3 | `src/components/layout/GlobalHeader.tsx` | 111 | `homeLink = ROUTES.FEED_AGENT` — agent Logo 導航 | 點擊 → 404 | #6a |
| B-4 | `src/components/layout/GlobalHeader.tsx` | 113 | `homeLink = ROUTES.FEED_CONSUMER` — consumer Logo 導航 | 點擊 → 404 | #6a |
| B-5 | `src/components/layout/GlobalHeader.tsx` | 246 | `const targetPath = ROUTES.FEED_CONSUMER` — Profile 導航 | 點擊 → 404 | #6a |

---

### C. 舊 Mock 機制散布

#### C-1. `isDemoPropertyId()` 孤島邏輯（5 個檔案、13+ 處引用）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| C-1a | `src/constants/property.ts` | 1-4 | `DEMO_PROPERTY_ID = 'MH-100001'` + `isDemoPropertyId()` 定義 | #4a |
| C-1b | `src/services/propertyService.ts` | 5, 366 | `import { isDemoPropertyId }` → `isDemo = isDemoPropertyId(publicId)` | #4a |
| C-1c | `src/pages/PropertyDetailPage.tsx` | 29, 127 | `import { isDemoPropertyId }` → `isDemo: isDemoPropertyId(id)` | #4a |
| C-1d | `src/pages/PropertyDetailPage.tsx` | 249 | `enabled: !property.isDemo && Boolean(property.publicId)` — 禁用 API query | #4a |
| C-1e | `src/pages/PropertyDetailPage.tsx` | 261-279 | Mock 社會證明（基於 publicId charCode 產生虛擬瀏覽人數） | #4a |
| C-1f | `src/pages/PropertyDetailPage.tsx` | 292-294 | Demo 導向 `/maihouses/assure?mock=true` | #4a |
| C-1g | `src/pages/PropertyDetailPage.tsx` | 679-713 | Dev 測試按鈕（僅 Demo 頁面顯示切換安心留痕開關） | #4a |
| C-1h | `src/pages/PropertyDetailPage.tsx` | 774-775 | 傳遞 `isDemo` prop → CommunityReviews | #4a |
| C-1i | `src/pages/PropertyDetailPage.tsx` | 784-785 | 傳遞 `isDemo` prop → AgentTrustCard | #4a |
| C-1j | `src/pages/PropertyDetailPage.tsx` | 813 | Demo 時自動顯示已驗證徽章 | #4a |
| C-1k | `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` | 86 | `property.isDemo ? true` — MobileActionBar isVerified 判斷 | #4a |

#### C-2. `uagModeStore` 手動 Mock/Live 切換（3 個檔案）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| C-2a | `src/stores/uagModeStore.ts` | 全檔 | Zustand store：STORAGE_KEY、URL_PARAM_KEY、localStorage 讀寫 | #5b |
| C-2b | `src/pages/UAG/hooks/useUAGData.ts` | 20, 78-103 | `useUAGModeStore(selectUseMock)` + `toggleMode` 回調 | #5b |
| C-2c | `src/pages/UAG/hooks/useAgentProfile.ts` | 4, 20-35 | `useMock` → 決定回傳 MOCK_AGENT_PROFILE 或 fetchAgentMe() | #5b |
| C-2d | `src/pages/UAG/components/TrustFlow/index.tsx` | 14, 34 | `useUAGModeStore(selectUseMock)` — 信任案件資料來源切換 | #5b |

#### C-3. `DEMO_IDS` 白名單（Feed）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| C-3a | `src/pages/Feed/index.tsx` | 19 | `const DEMO_IDS = ['demo-001', 'demo-consumer', 'demo-agent']` | #6b |
| C-3b | `src/pages/Feed/index.tsx` | 30-32 | `isDemo = DEMO_IDS.includes(userId)` → `forceMock` 判斷 | #6b |
| C-3c | `src/pages/Feed/index.tsx` | 40-50 | forceMock → 直接載入 mock 版本 | #6b |
| C-3d | `src/pages/Feed/index.tsx` | 84-87 | RoleToggle 根據 forceMock 決定顯示 | #6b |

#### C-4. `?mock=` URL 參數散布（4 處）

| # | 檔案 | 行號 | 程式碼片段 | 歸屬工單 |
|---|------|------|-----------|---------|
| C-4a | `src/stores/uagModeStore.ts` | 47-56 | `getInitialModeFromUrl()` — `?mock=1/true/0/false` | #5b |
| C-4b | `src/pages/Feed/index.tsx` | 30 | `searchParams.get('mock')` | #6b |
| C-4c | `src/pages/UAG/Profile/index.tsx` | 49, 55 | `isMockMode = searchParams.get('mock') === 'true'` | #5b |
| C-4d | `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | 49-50 | Mock 判斷影響 query key 和資料來源 | #5b |

---

### D. 按讚 / 互動體驗問題

| # | 檔案 | 行號 | 問題 | 應改為 | 歸屬工單 |
|---|------|------|------|--------|---------|
| D-1 | `src/components/PropertyDetail/CommunityReviews.tsx` | 310 | `disabled={!isLoggedIn}` — 按鈕灰掉無任何引導 | 永遠可點，mode 決定行為 | #3 |
| D-2 | `src/components/PropertyDetail/CommunityReviews.tsx` | 313-318 | `!isLoggedIn ? 'cursor-not-allowed opacity-50'` — 視覺禁用 | 移除，統一由 mode 控制 | #3 |
| D-3 | `src/components/PropertyDetail/CommunityReviews.tsx` | 250-269 | `handleToggleLike` 只判斷 `isDemo`，不判斷 visitor | 加入 visitor → toast 引導 | #3 |
| D-4 | `src/components/PropertyDetail/CommunityReviews.tsx` | 358-369 | LockedOverlay `!isLoggedIn` 觸發，Demo 也被鎖 | 改用 mode 判斷 | #3 |
| D-5 | `src/pages/Community/components/PostsSection.tsx` | 279 | `disabled={!isLoggedIn}` — CommentInput 禁用 | 改用 mode 判斷 | #8 |
| D-6 | `src/components/Feed/FeedPostCard.tsx` | 110 | `disabled={!isLoggedIn}` — Feed CommentInput 禁用 | 改用 mode 判斷 | #6b |
| D-7 | `src/pages/Community/Wall.tsx` | 241-256 | `handleLike` 只檢查 `isAuthenticated` | 加入 demo 本地 toggle / visitor toast | #8 |

---

### E. AgentReviewListModal Demo 判斷孤島

| # | 檔案 | 行號 | 問題 | 歸屬工單 |
|---|------|------|------|---------|
| E-1 | `src/components/AgentReviewListModal.tsx` | 60 | `isDemo = agentId.startsWith('mock-') \|\| agentId === SEED_AGENT_ID` — 獨立判斷 | #4a |
| E-2 | `src/components/AgentReviewListModal.tsx` | 71-77 | Demo → Mock 資料，否則 API — 未接入 usePageMode | #4a |

---

### F. 登入後重定向

| # | 檔案 | 行號 | 問題 | 應改為 | 歸屬工單 |
|---|------|------|------|--------|---------|
| F-1 | `public/auth.html` | 1647 | `go(\`/maihouses/feed/${user.id}\`)` — 統一導到 Feed | agent → `/uag`、consumer → `/` | #7 |
| F-2 | `public/auth.html` | 1655 | 備用回退 `go('/maihouses/')` | 保留 ✅ | — |
| F-3 | `public/auth/after-login.html` | 20 | `<noscript>` fallback → `feed-consumer.html` | 更新為 `/maihouses/` | #9 |

---

### G. 工單外新發現（需補入或另建）

#### 靜態掃描發現（G-1 ~ G-9）

| # | 檔案 | 行號 | 問題 | 建議歸屬 |
|---|------|------|------|---------|
| G-1 | `src/pages/Chat/index.tsx` | 62 | `auth.html` 硬編碼 — Chat 頁登入引導掉出 app | 補入 #2 |
| G-2 | `src/pages/PropertyListPage.tsx` | 100 | `auth.html` 硬編碼 — 房源列表登入按鈕掉出 app | 補入 #2 |
| G-3 | `src/components/TrustManager.tsx` | 257 | `auth.html` 硬編碼 — 信任交易管理器登入提示 | 補入 #2 |
| G-4 | `src/components/Feed/PrivateWallLocked.tsx` | 23 | `window.location.href = ROUTES.AUTH` — Feed 私密牆鎖定 | 補入 #6a |
| G-5 | `src/components/Composer/LoginPrompt.tsx` | 40 | `<a href={ROUTES.AUTH}>` — 作曲家登入提示 | 補入 #2 |
| G-6 | `src/features/home/components/CommunityWallCard.tsx` | 70 | `community-wall_mvp.html` 硬編碼 — 聊天頁社區牆卡片 | 補入 #4b |
| G-7 | `src/hooks/useFeedData.ts` | 139, 183 | `useMock: boolean` — Feed 資料 Hook 仍有獨立 mock 判斷 | 補入 #6b |
| G-8 | `vercel.json` | 57 | Rewrite rule `"dest": "/auth.html"` — 部署設定需同步 | 補入 #9 |
| G-9 | `src/components/layout/GlobalHeader.tsx` | 246 | Profile 導航使用 `ROUTES.FEED_CONSUMER`（廢棄路由） | 補入 #6a |

#### 補充發現（G-10 ~ G-22）

| # | 檔案 | 行號 | 問題 | 嚴重度 | 建議歸屬 |
|---|------|------|------|--------|---------|
| G-10 | `src/pages/Community/Wall.tsx` | 258-261 | LockedOverlay CTA（`handleUnlock`）只彈 toast「功能開發中」，**不導向註冊頁** | 🔴 | 補入 #8 |
| G-11 | `src/components/Header/Header.tsx` | 全檔 | **首頁 Header 完全未使用 `useAuth`**：已登入仍顯示「登入/註冊」，無頭像/帳號/登出 | 🔴 | 新增子工單 |
| G-12 | `src/pages/UAG/index.tsx` | 全檔 | **UAG 無角色檢查**：consumer 進入可完整操作 Mock 後台，無任何「你不是房仲」引導 | 🔴 | 補入 #5a |
| G-13 | `src/pages/UAG/hooks/useUAGData.ts` | 93-103 | **toggleMode 不檢查角色**：consumer 可切到 Live 模式，用 consumer ID 查 agent 資料 | 🔴 | 補入 #5b |
| G-14 | `src/stores/uagModeStore.ts` | 79 | **已登入 agent 首次進 UAG 默認 Mock 模式**，需手動切 Live 才看到真實資料 | 🟡 | 補入 #5b |
| G-15 | `src/components/Header/Header.tsx` | 267 | 膠囊「房仲專區」用 `target="_blank"` 在新分頁開啟，使用者容易迷失 | 🟢 | 可選優化 |
| G-16 | `src/pages/PropertyListPage.tsx` | 75-104 | PropertyListPage 使用獨立 LegacyHeader，與首頁 Header 視覺/功能不一致 | 🟡 | 新增子工單 |
| G-17 | `src/components/Header/Header.tsx` | 19 | Header 搜尋用 `window.location.href` 做整頁重載，而非 React Router 導航 | 🟢 | 可選優化 |
| G-18 | `src/components/PropertyDetail/CommunityReviews.tsx` | 60-69 | `LOCKED_PREVIEW_PLACEHOLDER` 在已登入時顯示為「真實」評價，可能誤導 | 🟢 | 可選優化 |
| G-19 | `src/components/PropertyDetail/CommunityReviews.tsx` | 243, 247 | `navigate()` 導向 `.html` 路徑，React Router 匹配到 catch-all → **顯示 NotFoundPage**（比掉出 app 更嚴重）| 🔴 | 已在 #4b 但嚴重度需上調 |
| G-20 | `src/pages/Community/Wall.tsx` | 80-81 | 生產環境 `initialRole` 硬設 `'guest'`，sessionStorage demo 完全不被讀取 | 🔴 | 已在 #8 |
| G-21 | `App.tsx` | 100-115 | **UAG + UAG Profile 路由無 auth guard / ProtectedRoute 包裝** | 🔴 | 補入 #5a |
| G-22 | `src/pages/Feed/index.tsx` | 53-76 | 非 DEMO_IDS 的真實 userId：Supabase query 可能失敗（UUID 格式不符） | 🟡 | 補入 #6b |

---

### H. 影響檔案總覽

> 共 **45+ 個檔案**需修改，依工單分組：

| 工單 | 涉及檔案數 | 關鍵檔案 |
|------|-----------|---------|
| #1 | 4 新增 | `usePageMode.ts`（新增）、`useModeAwareAction.ts`（新增）、`DemoGate.tsx`（新增）、`DemoBadge.tsx` 基礎版（新增） |
| #2 | 8（1 新增） | `seed.ts`（新增）、`routes.ts`、`Header.tsx`、`CommunityTeaser.tsx`、`Chat/index.tsx`、`PropertyListPage.tsx`、`TrustManager.tsx`、`LoginPrompt.tsx` |
| #3 | 2 | `CommunityReviews.tsx`、`AgentReviewListModal.tsx` |
| #4a | 5 | `PropertyDetailPage.tsx`、`PropertyDetailActionLayer.tsx`、`propertyService.ts`、`property.ts`、`AgentReviewListModal.tsx` |
| #4b | 2 | `CommunityReviews.tsx`、`CommunityWallCard.tsx` |
| #5a | 2（1 新增） | `UAGLandingPage.tsx`（新增）、`App.tsx`（auth guard） |
| #17 | 1 新增 + 1 測試 | `src/lib/error.ts`（新增 141 行）、`src/lib/__tests__/error.test.ts`（新增 17 單元測試） ✅ 已完成 |
| #18 | 3 | `src/app/config.ts`（2 處）、`src/analytics/track.ts`（1 處）、`src/context/MaiMaiContext.tsx`（2 處） ✅ 已完成 |
| #19 | 3 migration | `20260209_agent_verification_and_cases.sql`、`20260130_agent_profile_extension.sql`、`20260209_community_review_likes.sql` ✅ 已完成 |
| #20 | 10+ 整合 | 整合 `src/services/mock/`（4 檔）、`src/pages/UAG/mockData.ts`、`src/pages/Community/mockData.ts`、`src/pages/Feed/mockData/`（5 檔）→ 統一到 `src/constants/mockData.ts` |
| #5b | 6 | `uagModeStore.ts`（移除）、`useUAGData.ts`、`useAgentProfile.ts`、`TrustFlow/index.tsx`、`UAG/Profile/index.tsx`、`Profile/hooks/useAgentProfile.ts` |
| #6a | 3 | `GlobalHeader.tsx`、`routes.ts`、`PrivateWallLocked.tsx` |
| #6b | 4 | `Feed/index.tsx`、`FeedPostCard.tsx`、`useFeedData.ts`、`App.tsx`（新增 `/feed/demo` 路由） |
| #7 | 1 | `auth.html` |
| #8 | 4（1 新增） | `useEffectiveRole.ts`（新增）、`Wall.tsx`、`BottomCTA.tsx`、`PostsSection.tsx` |
| #9 | 5 移除/更新 | `community-wall_mvp.html`、`feed-agent.html`、`feed-consumer.html`、`after-login.html`、`vercel.json` |
| #10 | 2 | `DemoBadge.tsx`（新增）、`App.tsx` |
| #12 | 1 | `Header.tsx`（接入 useAuth） |
| #13 | 1 | `PropertyListPage.tsx`（統一 Header） |
| #14 | 2（1 新增） | `useRegisterGuide.ts`（新增）、toast 元件（可能需擴展 action slot） |
| #15 | 1 新增 | `authUtils.ts`（新增 `getAuthUrl()` 工具函數） |

---

### I. 已完成項目記錄（2026-02-12）

> Wave 0 基礎工具完成記錄

#### I-1. 統一錯誤處理工具（#17）✅

| # | 檔案 | 變更內容 |
|---|------|---------|
| I-1a | `src/lib/error.ts` | 新增 141 行：`getErrorMessage()` / `getErrorInfo()` / `safeAsync()` / `safeSync()` |
| I-1b | `src/lib/__tests__/error.test.ts` | 新增 17 個單元測試，100% 覆蓋率 |

#### I-2. 錯誤處理重構（#18）✅

| # | 檔案 | 行號 | 變更內容 |
|---|------|------|---------|
| I-2a | `src/app/config.ts` | 1, 76, 152 | 新增 import + 2 處 catch 改用 `getErrorMessage(err)` |
| I-2b | `src/analytics/track.ts` | 1, 14 | 新增 import + 1 處 catch 改用 `getErrorMessage(err)` |
| I-2c | `src/context/MaiMaiContext.tsx` | 4, 78, 92 | 新增 import + 2 處 catch 改用 `getErrorMessage(e)` |

#### I-3. Supabase RPC 錯誤處理強化（#19）✅

| # | 檔案 | 函數 | 變更內容 |
|---|------|------|---------|
| I-3a | `20260209_agent_verification_and_cases.sql` | `fn_increment_completed_cases()` | 新增 `agent_id IS NULL` 驗證 + `GET DIAGNOSTICS` + `EXCEPTION` 區塊 |
| I-3b | `20260130_agent_profile_extension.sql` | `fn_calculate_trust_score()` | 新增 `p_agent_id IS NULL` 驗證 + 改善錯誤訊息 + `EXCEPTION` 返回預設值 60 |
| I-3c | `20260209_community_review_likes.sql` | `fn_recalc_encouragement_count()` | 新增 `property_id IS NULL` 驗證 + `NOT FOUND` 檢查 + `GET DIAGNOSTICS` + `EXCEPTION` 區塊 |

**驗證結果**:
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors
- ✅ Tests: 140/140 passed (123 existing + 17 new)

---

## 核心原則

1. **訪客模式 ≠ Mock** — 是正式頁面的「未登入視角」，seed 資料 + 限制互動 + 註冊引導
2. **演示模式 = 完整功能預覽** — 隱藏密碼觸發，全站生效，操作本地化，不寫 DB
3. **每個 disabled 按鈕都需要解釋** — 學習 Community Wall 的 LockedOverlay 模式
4. **消滅靜態 HTML 死路** — 所有頁面都在 React app 內，保持一致的 Header/導航
5. **角色 ≠ 登入狀態** — 未登入不代表是消費者，頁面處理「未登入」而不假設身份
6. **演示模式不影響正式用戶** — 登入後自動退出演示，正式用戶永遠不知道演示入口存在
7. **統一錯誤處理** — 所有 catch 區塊使用 `getErrorMessage()`，Supabase RPC 用 `RAISE WARNING` 不阻斷交易

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

# 6. 確認無 disabled={!isLoggedIn}（#3/#8/#6b 完成後應回傳 0 筆）
grep -r "disabled={!isLoggedIn}" src/ --include="*.tsx"

# 7. 確認 useModeAwareAction 統一策略（不應存在手動 mode 分支）
grep -r "if.*mode.*===.*demo.*{" src/ --include="*.tsx"
```
