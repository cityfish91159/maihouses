# MOCK-SYSTEM-UNIFY: 全站三模式架構設計

## 實作進度總覽

### P0 — 基礎建設

- [ ] **#1** 建立 `usePageMode()` hook + 演示模式隱藏觸發機制（3 新檔案，阻塞後續所有工單）
- [ ] **#2** 全站靜態 HTML 連結改為 React 路由（6 檔 16 處：community-wall_mvp×6 + auth.html×10）
- [ ] **#3** 按讚按鈕三模式行為分離（CommunityReviews + AgentReviewListModal，7 處 disabled 改 mode）

### P1 — 逐頁接入

- [ ] **#4a** 房產詳情頁：移除 isDemoPropertyId + 社會證明接入 usePageMode（4 檔 12 處）
- [ ] **#4b** 房產詳情頁：連結修正 — 社區牆 + 註冊查看（2 檔 3 處）
- [ ] **#5a** UAG：新增訪客 Landing Page（1 新檔案 + 路由判斷）
- [ ] **#5b** UAG：後台接入 usePageMode + 移除 uagModeStore（6 檔，含 ?mock= 參數清理）
- [ ] **#6a** Feed：Logo 導航修復 + 廢棄路由清理（GlobalHeader 3 處 + routes.ts 4 常數）
- [ ] **#6b** Feed：移除 DEMO_IDS + 接入 usePageMode（3 檔 8 處）
- [ ] **#7** 登入後重定向修正 — agent→UAG、consumer→首頁（auth.html :1647）

### P2 — 收尾清理

- [ ] **#8** 社區牆接入演示模式 — 自動 resident 權限（Wall.tsx + PostsSection + BottomCTA）
- [ ] **#9** 移除靜態 HTML mock 頁 + 部署設定同步（4 頁移除 + after-login.html + vercel.json）
- [ ] **#10** 演示模式浮動標籤 UI 正式版（DemoBadge.tsx + App.tsx 全域掛載）
- [ ] **#11** Feed 定位確認 + 首頁入口（待確認方向）

---

## 工單摘要

| 項目         | 內容                                                                 |
| ------------ | -------------------------------------------------------------------- |
| **工單編號** | MOCK-SYSTEM-UNIFY                                                    |
| **標題**     | 全站三模式架構 — 訪客模式 / 演示模式 / 正式模式                      |
| **優先級**   | P0 - Critical                                                        |
| **狀態**     | 待開發                                                               |
| **影響範圍** | 首頁、房產列表、房產詳情、UAG、Feed、社區牆、Auth、全域導航          |
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

- **觸發**：首頁 Logo 隱藏入口 → 輸入密碼 → sessionStorage 儲存
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
未登入 + sessionStorage 有演示驗證 → 演示模式
未登入                            → 訪客模式
```

### 演示模式觸發機制

- 首頁 Logo 長按（3 秒）或連點（5 下）→ 彈出密碼輸入框
- 密碼驗證成功 → `sessionStorage.setItem('mai-demo-verified', 'true')`
- 全站進入演示模式
- 關閉瀏覽器 → sessionStorage 清除 → 自動退出
- 正式用戶完全不知道這個機制存在
- 演示模式下右下角浮動標籤「演示模式」+ 退出按鈕

### 統一 Hook

```typescript
usePageMode() → { mode: 'visitor' | 'demo' | 'live', isVisitor, isDemo, isLive }
```

### 三模式行為總對照表

| 行為 | 訪客模式 | 演示模式 | 正式模式 |
|------|---------|---------|---------|
| 資料來源 | seed + API 補位 | seed（不走 API）| API |
| 瀏覽內容 | 部分可見 + LockedOverlay | 全部可見 | 依角色全部可見 |
| 按讚 | toast 引導註冊 | 本地 toggle | API 寫入 |
| 發文/留言 | toast 引導註冊 | 本地新增（不寫 DB）| API 寫入 |
| 購買 Lead | toast 引導註冊 | 本地操作 | API |
| LINE/電話 | 正常使用 | 正常使用 | 正常使用 |
| 第 3 則評價 | blur + LockedOverlay | blur + LockedOverlay（點了跳到社區牆演示）| 解鎖 |
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
| 第3則評價 | blur + LockedOverlay | blur + LockedOverlay（點了 → 跳到社區牆演示）| 解鎖 |
| LINE/電話 | 正常 ✅ | 正常 | 正常 |
| 收藏/分享 | 本地 toggle ✅ | 同左 | 同左 |
| 社會證明 | seed 隨機數 | seed 隨機數 | API |
| 「前往社區牆」| → `/community/{id}/wall` | 同左 | 同左 |
| 「註冊查看」| → 註冊引導 | → `/community/{id}/wall`（演示模式社區牆，resident 權限）| 不顯示 |

> **演示模式保持 LockedOverlay 設計**：不直接解鎖，而是引導投資人到社區牆演示頁體驗完整功能，保留「鎖 → 解鎖」的產品設計邏輯。

#### 需要修正

- 移除 `disabled={!isLoggedIn}`，改用 mode 判斷按讚行為
- 移除 `isDemoPropertyId` 孤島邏輯，改用 `usePageMode()`
- 「前往社區牆」從 `community-wall_mvp.html` 改為 `/community/{id}/wall`
- 「註冊查看」：訪客→註冊引導、演示→跳到社區牆演示頁

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
  4. 清除 sessionStorage 演示標記（演示模式自動退出）
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
| `?mock=true` URL 參數 | UAG、Feed | sessionStorage 演示驗證 |
| `?role=` 參數 | 社區牆 | 保留作為開發工具，演示模式由 `usePageMode()` 自動套 resident |
| Seed 補位（API → 失敗 → Seed）| 首頁、房產列表 | 保留不變，訪客模式資料來源 ✅ |

---

## 子工單詳細規格

---

### #1 [P0] 建立 `usePageMode()` hook + 演示模式隱藏觸發機制

**目標**：建立全站統一的模式判斷系統和演示模式的隱藏入口

**施工項目**：

#### 1-A. `usePageMode()` hook

**新增檔案**：`src/hooks/usePageMode.ts`

```typescript
type PageMode = 'visitor' | 'demo' | 'live'
interface UsePageModeReturn {
  mode: PageMode
  isVisitor: boolean
  isDemo: boolean
  isLive: boolean
}

// 判斷邏輯
// 1. 已登入（useAuth） → 'live'
// 2. sessionStorage.getItem('mai-demo-verified') → 'demo'
// 3. 其他 → 'visitor'
```

#### 1-B. 演示模式觸發元件

**新增檔案**：`src/components/DemoGate/DemoGate.tsx`

- Logo 長按（3 秒）或連點（5 下）→ 彈出密碼輸入框
- 密碼驗證成功 → `sessionStorage.setItem('mai-demo-verified', 'true')`
- 頁面自動刷新進入演示模式
- 密碼存在環境變數 `VITE_DEMO_PASSWORD`

#### 1-C. 演示模式浮動標籤（基礎版）

- 演示模式時右下角顯示「演示模式」小標籤
- 標籤上有「退出」按鈕 → 清除 sessionStorage → 回到訪客模式

**驗收標準**：
- `usePageMode()` 正確回傳三種模式
- Logo 隱藏入口可觸發演示模式
- 關閉瀏覽器後演示模式自動消失
- 登入後演示狀態自動清除

---

### #2 [P0] 全站靜態 HTML 連結改為 React 路由

**目標**：消滅所有靜態 HTML 死路，讓訪客不會「掉出」React app

**施工項目**：

#### 2-A. 社區評價連結（6 處 → 見審計 A-1）

**影響檔案**：
- `src/features/home/sections/CommunityTeaser.tsx` — seed 卡片 + 查看更多（:11, :103, :205）
- `src/components/Header/Header.tsx` — 膠囊「社區評價」（:262）
- `src/components/PropertyDetail/CommunityWallCard.tsx` — 聊天頁卡片（:70）⚠️ 原工單遺漏
- `src/constants/routes.ts` — `COMMUNITY_WALL_MVP` 常數定義（:31）

所有 `community-wall_mvp.html` → `/community/{seedId}/wall`

#### 2-B. Header 膠囊連結

**檔案**：`src/components/Header/Header.tsx`

- 「社區評價」→ `/community/{seedId}/wall`
- 「房仲專區」→ `/uag`（已正確）

#### 2-C. auth.html 引用清理（原工單遺漏的 3 處 → 見審計 G-1~G-3, G-5）

**新增影響檔案**：
- `src/pages/Chat/index.tsx` — Chat 頁登入引導（:62）
- `src/pages/PropertyListPage.tsx` — 房源列表登入按鈕（:100）
- `src/components/TrustManager.tsx` — 信任交易管理器登入提示（:257）
- `src/components/Composer/LoginPrompt.tsx` — 作曲家登入提示（:40）

**驗收標準**：
- 全專案搜尋 `community-wall_mvp` 回傳 0 筆（排除靜態 HTML 檔本身）
- 全專案 `.tsx/.ts` 搜尋 `auth.html` 回傳 0 筆
- 所有按鈕點擊後留在 React app 內

---

### #3 [P0] 按讚按鈕三模式行為分離

**目標**：按讚按鈕根據 `usePageMode()` 決定行為，不再用 `disabled`

**施工項目**：

#### 3-A. CommunityReviews 按讚邏輯（見審計 D-1~D-4）

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```
mode === 'live'    → 現有 API 寫入邏輯
mode === 'demo'    → 本地 toggle（已有邏輯，移除 isLoggedIn 檢查）
mode === 'visitor' → 點擊 → toast「註冊後即可鼓勵評價」→ 引導註冊
```

需修改的具體行號：
- `:310` — 移除 `disabled={!isLoggedIn}`
- `:313-318` — 移除 `cursor-not-allowed` / `opacity-50` 條件樣式
- `:250-269` — `handleToggleLike` 加入 visitor 分支（toast 引導）
- `:358-369` — LockedOverlay 改用 mode 判斷，Demo 不再被鎖

#### 3-B. 第 3 則評價鎖定邏輯

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```
mode === 'live'    → 解鎖
mode === 'demo'    → blur + LockedOverlay（點了 → 跳到 /community/{id}/wall 社區牆演示）
mode === 'visitor' → blur + LockedOverlay + 「註冊查看更多」→ 引導註冊
```

#### 3-C. AgentReviewListModal Demo 孤島邏輯（見審計 E-1~E-2）

**檔案**：`src/components/AgentReviewListModal.tsx`

- `:60` — 移除 `agentId.startsWith('mock-') || agentId === SEED_AGENT_ID` 獨立判斷
- `:71-77` — 改用 `usePageMode()` 判斷資料來源

#### 3-D. 其他 `disabled={!isLoggedIn}` 位置（見審計 D-5~D-7）

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

**施工項目**：（見審計 C-1、E-1~E-2）

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

**施工項目**：（見審計 A-1e, A-1f, A-2f）

#### 4b-A. 「前往社區牆」連結

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 247 | `navigate('/maihouses/community-wall_mvp.html')` | `/community/{communityId}/wall` |
| `src/components/PropertyDetail/CommunityWallCard.tsx` | 70 | `'/maihouses/community-wall_mvp.html'` ⚠️ 原工單遺漏 | `/community/{communityId}/wall` |

#### 4b-B. 「註冊查看」連結

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 243 | `navigate('/maihouses/auth.html?mode=login')` | React 路由或 toast 引導 |

**驗收標準**：
- 詳情頁相關檔案搜尋 `community-wall_mvp` 和 `auth.html` 回傳 0 筆

---

### #5a [P1] UAG：新增訪客 Landing Page + 角色守衛

**目標**：訪客進 UAG 看到產品介紹而非 mock 資料；consumer 不該能操作房仲後台

**施工項目**：（見審計 G-12、G-21）

#### 5a-A. 新增 Landing Page 元件

**新增檔案**：`src/pages/UAG/UAGLandingPage.tsx`

- 功能說明（AI 智能客戶雷達、即時信賴指數、一鍵成交報告）
- 截圖/動畫展示後台功能
- 「成為合作房仲」CTA → 註冊頁
- 原因：mock 資料含 Lead 姓名、電話、分級等敏感欄位，不該對訪客展示

#### 5a-B. UAG 入口路由判斷 + 角色守衛 ⚠️ 路徑模擬新增

**檔案**：`src/pages/UAG/index.tsx`、`App.tsx` :100-115

```
mode === 'visitor'                    → 渲染 <UAGLandingPage />
mode === 'demo'                       → 渲染現有 UAG 後台（seed 資料）
mode === 'live' + role === 'agent'    → 渲染現有 UAG 後台（API）
mode === 'live' + role === 'consumer' → 顯示「此功能僅限合作房仲」→ 引導回首頁
```

> **路徑模擬發現**：目前 UAG 頁面（含 `/uag/profile`）完全無 auth guard 和角色檢查（`App.tsx:100-115`、`UAG/index.tsx` 全檔）。Consumer 可完整操作 Mock 後台，包括「購買 Lead」和「發送訊息」，造成嚴重角色混淆。

**驗收標準**：
- 訪客進入 UAG 看到產品介紹頁，看不到任何 mock 資料
- consumer 進入 UAG 看到引導提示，無法操作後台
- 演示模式和正式模式（agent）不受影響

---

### #5b [P1] UAG：後台接入 usePageMode + 移除 mock/live toggle

**目標**：UAG 後台由 usePageMode 自動判斷模式

**施工項目**：（見審計 C-2、C-4）

#### 5b-A. 演示模式行為

- seed 資料完整展示
- 所有按鈕可操作 → 本地執行（數字變、狀態變、動畫跑）→ 不寫 DB

#### 5b-B. 正式模式行為 ⚠️ 路徑模擬補充（見審計 G-13、G-14）

- 已登入 agent → **自動 Live 模式**（目前 `uagModeStore:79` 默認 Mock，agent 首次進入看到假資料）
- 已登入 consumer → 顯示「此功能僅限合作房仲」→ 引導回首頁
- `toggleMode`（`useUAGData.ts:93-103`）需加角色檢查：consumer 不可切到 Live（目前只檢查 userId 有無值）

#### 5b-C. 移除 mock/live toggle

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
- 不存在手動 mock/live 切換 UI

---

### #6a [P1] Feed：Logo 導航修復 + 廢棄路由清理

**目標**：修復 Feed 頁面的導航死路

**施工項目**：（見審計 B-1~B-5、A-3、G-4、G-9）

#### 6a-A. Logo 導航修復

需修改的具體位置：

| 檔案 | 行號 | 現況 | 改為 |
|------|------|------|------|
| `src/components/layout/GlobalHeader.tsx` | 109-115 | 根據 role 切換 `homeLink`（agent→FEED_AGENT、consumer→FEED_CONSUMER）| 統一 `ROUTES.HOME` |
| `src/components/layout/GlobalHeader.tsx` | 246 | `targetPath = ROUTES.FEED_CONSUMER` — Profile 導航 ⚠️ 原工單遺漏 | 正確的 profile 路由 |
| `src/components/layout/GlobalHeader.tsx` | 283 | `href="/maihouses/auth.html?mode=login"` — 登入按鈕 | React 路由 |
| `src/components/Feed/PrivateWallLocked.tsx` | 23 | `window.location.href = ROUTES.AUTH` ⚠️ 原工單遺漏 | React 路由或 toast |

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

### #6b [P1] Feed：移除 DEMO_IDS + 接入 usePageMode

**目標**：Feed 改用統一 hook 判斷模式

**施工項目**：（見審計 C-3、C-4b、D-6、G-7）

#### 6b-A. 移除 DEMO_IDS 白名單

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Feed/index.tsx` | 19 | 移除 `DEMO_IDS` 定義 |
| `src/pages/Feed/index.tsx` | 30-32 | 移除 `isDemo`/`forceMock` 判斷，改用 usePageMode |
| `src/pages/Feed/index.tsx` | 40-50 | 移除 forceMock 分支 |
| `src/pages/Feed/index.tsx` | 84-87 | RoleToggle 改用 mode 判斷 |
| `src/components/Feed/FeedPostCard.tsx` | 110 | 移除 `disabled={!isLoggedIn}` |
| `src/hooks/useFeedData.ts` | 139, 183 | 移除獨立 `useMock` 判斷 ⚠️ 原工單遺漏 |

**驗收標準**：
- 全域搜尋 `DEMO_IDS` 回傳 0 筆
- Feed 根據 usePageMode 自動切換行為

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

- 登入成功後自動清除 `sessionStorage` 的演示驗證標記
- 確保正式模式接管

**驗收標準**：
- agent 登入後到 UAG
- consumer 登入後到首頁
- 演示模式下登入後自動退出演示

---

### #8 [P2] 社區牆接入演示模式

**目標**：社區牆在演示模式下自動展示完整功能

**施工項目**：（見審計 A-2h、D-5、D-7）

#### 8-A. 演示模式自動套用 resident 權限

| 檔案 | 行號 | 動作 |
|------|------|------|
| `src/pages/Community/Wall.tsx` | 122-128 | `effectiveRole` 加入 demo → 自動 `'resident'` |
| `src/pages/Community/Wall.tsx` | 241-256 | `handleLike` 加入 demo 本地 toggle / visitor toast |
| `src/pages/Community/components/PostsSection.tsx` | 279 | 移除 `disabled={!isLoggedIn}`，改用 mode |
| `src/pages/Community/components/BottomCTA.tsx` | 32 | `auth.html` → React 路由或 toast |

#### 8-B. 演示模式下操作本地化

- 發文、留言 → 本地新增（不寫 DB）

**驗收標準**：
- 演示模式下社區牆全部可見，操作本地化
- 訪客模式維持現有 guest 限制（不動）
- 社區牆相關檔案搜尋 `auth.html` 回傳 0 筆

---

### #9 [P2] 移除所有靜態 HTML mock 頁 + 部署設定同步

**目標**：清理所有靜態 HTML 殘留

**施工項目**：（見審計 A-3d、F-3、G-8）

| 檔案 | 動作 |
|------|------|
| `public/community-wall_mvp.html` | 移除或 redirect |
| `public/maihouses/community-wall_mvp.html` | 移除或 redirect |
| `public/feed-agent.html` | 移除或 redirect |
| `public/feed-consumer.html` | 移除或 redirect |
| `public/auth/after-login.html` `:20` | `<noscript>` fallback → 改為 `/maihouses/` ⚠️ 原工單遺漏 |
| `vercel.json` `:57` | Rewrite rule `"dest": "/auth.html"` — 需同步更新 ⚠️ 原工單遺漏 |

**前置條件**：#2、#6 完成後才能移除

**驗收標準**：
- 不存在任何指向靜態 HTML mock 頁的連結
- `vercel.json` rewrite 規則與新路由一致

---

### #10 [P2] 演示模式浮動標籤 UI

**目標**：演示模式下有明確的視覺提示

**施工項目**：

#### 10-A. 浮動標籤元件

**新增檔案**：`src/components/DemoGate/DemoBadge.tsx`

- 右下角固定浮動
- 顯示「演示模式」
- 有「退出」按鈕 → 清除 sessionStorage → 回到訪客模式

#### 10-B. 全域掛載

- 在 App.tsx 或 Layout 層根據 `usePageMode()` 條件渲染

**驗收標準**：
- 演示模式下每個頁面都看得到標籤
- 點「退出」後回到訪客模式
- 正式模式和訪客模式不顯示標籤

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

## 程式碼審計 — 優化項目清單

> 2026-02-12 由 codebase 掃描產出，每項附 `file:line` 證據。

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
| A-1f | `src/components/PropertyDetail/CommunityWallCard.tsx` | 70 | `const communityWallUrl = '/maihouses/community-wall_mvp.html'` | #4b |

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
| A-2i | `src/pages/Chat/index.tsx` | 62 | `href="/maihouses/auth.html?mode=login"` — Chat 登入提示 | 新增 |
| A-2j | `src/pages/PropertyListPage.tsx` | 100 | `href="/maihouses/auth.html"` — 房源列表登入按鈕 | 新增 |

> **工單外遺漏**：A-2i (Chat) 和 A-2j (PropertyListPage) 未在原始工單中列出，需補入 #2 或另建子工單。

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

#### C-1. `isDemoPropertyId()` 孤島邏輯（4 個檔案、12+ 處引用）

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
| G-6 | `src/components/PropertyDetail/CommunityWallCard.tsx` | 70 | `community-wall_mvp.html` 硬編碼 — 聊天頁社區牆卡片 | 補入 #4b |
| G-7 | `src/hooks/useFeedData.ts` | 139, 183 | `useMock: boolean` — Feed 資料 Hook 仍有獨立 mock 判斷 | 補入 #6b |
| G-8 | `vercel.json` | 57 | Rewrite rule `"dest": "/auth.html"` — 部署設定需同步 | 補入 #9 |
| G-9 | `src/components/layout/GlobalHeader.tsx` | 246 | Profile 導航使用 `ROUTES.FEED_CONSUMER`（廢棄路由） | 補入 #6a |

#### 路徑模擬發現（G-10 ~ G-22）

> 2026-02-12 三角色×五組路徑模擬（訪客/演示/正式）產出

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

> 共 **25+ 個檔案**需修改，依工單分組：

| 工單 | 涉及檔案數 | 關鍵檔案 |
|------|-----------|---------|
| #1 | 2 新增 | `usePageMode.ts`（新增）、`DemoGate.tsx`（新增） |
| #2 | 6 | `routes.ts`、`Header.tsx`、`CommunityTeaser.tsx`、`Chat/index.tsx`、`PropertyListPage.tsx`、`TrustManager.tsx` |
| #3 | 2 | `CommunityReviews.tsx`、`AgentReviewListModal.tsx` |
| #4a | 4 | `PropertyDetailPage.tsx`、`propertyService.ts`、`property.ts`、`AgentReviewListModal.tsx` |
| #4b | 2 | `CommunityReviews.tsx`、`CommunityWallCard.tsx` |
| #5a | 1 新增 | `UAGLandingPage.tsx`（新增） |
| #5b | 4 | `uagModeStore.ts`、`useUAGData.ts`、`useAgentProfile.ts`、`TrustFlow/index.tsx` |
| #6a | 3 | `GlobalHeader.tsx`、`routes.ts`、`PrivateWallLocked.tsx` |
| #6b | 3 | `Feed/index.tsx`、`FeedPostCard.tsx`、`useFeedData.ts` |
| #7 | 1 | `auth.html` |
| #8 | 3 | `Wall.tsx`、`BottomCTA.tsx`、`PostsSection.tsx` |
| #9 | 4 移除 | `community-wall_mvp.html`、`feed-agent.html`、`feed-consumer.html`、`after-login.html` |
| #10 | 2 | `DemoBadge.tsx`（新增）、`App.tsx` |

---

## 核心原則

1. **訪客模式 ≠ Mock** — 是正式頁面的「未登入視角」，seed 資料 + 限制互動 + 註冊引導
2. **演示模式 = 完整功能預覽** — 隱藏密碼觸發，全站生效，操作本地化，不寫 DB
3. **每個 disabled 按鈕都需要解釋** — 學習 Community Wall 的 LockedOverlay 模式
4. **消滅靜態 HTML 死路** — 所有頁面都在 React app 內，保持一致的 Header/導航
5. **角色 ≠ 登入狀態** — 未登入不代表是消費者，頁面處理「未登入」而不假設身份
6. **演示模式不影響正式用戶** — 登入後自動退出演示，正式用戶永遠不知道演示入口存在
