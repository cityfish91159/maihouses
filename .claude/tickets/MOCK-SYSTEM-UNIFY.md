# MOCK-SYSTEM-UNIFY: 全站三模式架構設計

## 實作進度總覽

### P0 — 基礎建設

- [ ] **#1** 建立 `usePageMode()` hook + 演示模式隱藏觸發機制
- [ ] **#2** 首頁所有靜態 HTML 連結改為 React 路由
- [ ] **#3** 按讚按鈕三模式行為分離

### P1 — 逐頁接入

- [ ] **#4a** 房產詳情頁：移除 isDemoPropertyId + 社會證明接入 usePageMode
- [ ] **#4b** 房產詳情頁：連結修正（社區牆 + 註冊查看）
- [ ] **#5a** UAG：新增訪客 Landing Page
- [ ] **#5b** UAG：後台接入 usePageMode + 移除 mock/live toggle
- [ ] **#6a** Feed：Logo 導航修復 + 廢棄路由清理
- [ ] **#6b** Feed：移除 DEMO_IDS + 接入 usePageMode
- [ ] **#7** 登入後重定向修正（agent→UAG、consumer→首頁）

### P2 — 收尾清理

- [ ] **#8** 社區牆接入演示模式（自動 resident 權限）
- [ ] **#9** 移除所有靜態 HTML mock 頁檔案
- [ ] **#10** 演示模式浮動標籤 UI
- [ ] **#11** Feed 定位確認 + 首頁入口

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

### #2 [P0] 首頁所有靜態 HTML 連結改為 React 路由

**目標**：消滅所有靜態 HTML 死路，讓訪客不會「掉出」React app

**施工項目**：

#### 2-A. 社區評價連結（4 處）

**影響檔案**：
- `src/features/home/sections/CommunityTeaser.tsx` — seed 卡片 + 查看更多
- `src/components/Header/Header.tsx` — 膠囊「社區評價」+ 手機選單

所有 `community-wall_mvp.html` → `/community/{seedId}/wall`

#### 2-B. Header 膠囊連結

**檔案**：`src/components/Header/Header.tsx`

- 「社區評價」→ `/community/{seedId}/wall`
- 「房仲專區」→ `/uag`（已正確）

**驗收標準**：
- 全專案搜尋 `community-wall_mvp` 回傳 0 筆（排除靜態 HTML 檔本身）
- 所有首頁按鈕點擊後留在 React app 內

---

### #3 [P0] 按讚按鈕三模式行為分離

**目標**：按讚按鈕根據 `usePageMode()` 決定行為，不再用 `disabled`

**施工項目**：

#### 3-A. CommunityReviews 按讚邏輯

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```
mode === 'live'    → 現有 API 寫入邏輯
mode === 'demo'    → 本地 toggle（已有邏輯，移除 isLoggedIn 檢查）
mode === 'visitor' → 點擊 → toast「註冊後即可鼓勵評價」→ 引導註冊
```

- 移除 `disabled={!isLoggedIn}`（Line 278）
- 移除 `cursor-not-allowed` / `opacity-50`
- 按鈕永遠可點擊，行為由 mode 決定

#### 3-B. 第 3 則評價鎖定邏輯

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

```
mode === 'live'    → 解鎖
mode === 'demo'    → blur + LockedOverlay（點了 → 跳到 /community/{id}/wall 社區牆演示）
mode === 'visitor' → blur + LockedOverlay + 「註冊查看更多」→ 引導註冊
```

#### 3-C. AgentReviewListModal 按讚邏輯

**檔案**：`src/components/PropertyDetail/AgentReviewListModal.tsx`

- 同步接入 `usePageMode()`，行為與 CommunityReviews 一致

**驗收標準**：
- 訪客模式：按讚可點擊，彈出註冊引導 toast
- 演示模式：按讚本地 toggle，數字變化
- 正式模式：按讚 API 寫入
- 不存在任何 `disabled={!isLoggedIn}` 的按讚按鈕

---

### #4a [P1] 房產詳情頁：移除 isDemoPropertyId + 社會證明接入 usePageMode

**目標**：移除孤島 mock 判斷，改用統一 hook

**施工項目**：

#### 4a-A. 移除 `isDemoPropertyId` 孤島邏輯

**檔案**：`src/pages/PropertyDetailPage.tsx`

- 移除 `isDemoPropertyId()` 判斷
- 改用 `usePageMode()` 統一判斷
- `isDemo` 概念整合進 `mode === 'demo'`

#### 4a-B. 社會證明（Social Proof）

```
mode === 'live'    → API 資料
mode === 'demo'    → seed 隨機數（現有邏輯）
mode === 'visitor' → seed 隨機數
```

**驗收標準**：
- 不存在 `isDemoPropertyId` 的引用
- 詳情頁根據 usePageMode 自動切換行為

---

### #4b [P1] 房產詳情頁：連結修正

**目標**：詳情頁內的靜態 HTML 連結改為 React 路由

**施工項目**：

#### 4b-A. 「前往社區牆」連結

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

- 從 `community-wall_mvp.html` 改為 `/community/{communityId}/wall`

#### 4b-B. 「註冊查看」連結

**檔案**：`src/components/PropertyDetail/CommunityReviews.tsx`

- 從 `auth.html?mode=login` 改為 React 路由或 toast 引導

**驗收標準**：
- 詳情頁內搜尋 `community-wall_mvp` 和 `auth.html` 回傳 0 筆

---

### #5a [P1] UAG：新增訪客 Landing Page

**目標**：訪客進 UAG 看到產品介紹而非 mock 資料

**施工項目**：

#### 5a-A. 新增 Landing Page 元件

**新增檔案**：`src/pages/UAG/UAGLandingPage.tsx`

- 功能說明（AI 智能客戶雷達、即時信賴指數、一鍵成交報告）
- 截圖/動畫展示後台功能
- 「成為合作房仲」CTA → 註冊頁
- 原因：mock 資料含 Lead 姓名、電話、分級等敏感欄位，不該對訪客展示

#### 5a-B. UAG 入口路由判斷

**檔案**：`src/pages/UAG/index.tsx`

```
mode === 'visitor' → 渲染 <UAGLandingPage />
mode === 'demo'    → 渲染現有 UAG 後台
mode === 'live'    → 渲染現有 UAG 後台
```

**驗收標準**：
- 訪客進入 UAG 看到產品介紹頁，看不到任何 mock 資料
- 演示模式和正式模式不受影響

---

### #5b [P1] UAG：後台接入 usePageMode + 移除 mock/live toggle

**目標**：UAG 後台由 usePageMode 自動判斷模式

**施工項目**：

#### 5b-A. 演示模式行為

- seed 資料完整展示
- 所有按鈕可操作 → 本地執行（數字變、狀態變、動畫跑）→ 不寫 DB

#### 5b-B. 正式模式行為

- 已登入 agent → API 真實資料
- 已登入 consumer → 顯示「此功能僅限合作房仲」→ 引導回首頁

#### 5b-C. 移除 mock/live toggle

- 移除 `uagModeStore` 的手動切換
- 改為 `usePageMode()` 自動判斷

**驗收標準**：
- 演示模式操作本地化，不寫 DB
- agent 登入看到真實資料
- consumer 登入看到引導提示
- 不存在手動 mock/live 切換 UI

---

### #6a [P1] Feed：Logo 導航修復 + 廢棄路由清理

**目標**：修復 Feed 頁面的導航死路

**施工項目**：

#### 6a-A. Logo 導航修復

**檔案**：`src/components/layout/GlobalHeader.tsx`

- Logo `href` 統一改為 `ROUTES.HOME`（`/maihouses/`）
- 移除根據 role 切換 homeLink 的邏輯

#### 6a-B. 廢棄路由清理

**檔案**：`src/constants/routes.ts`

- 移除 `FEED_AGENT`、`FEED_CONSUMER`、`FEED_AGENT_LEGACY`、`FEED_CONSUMER_LEGACY`
- 全域搜尋確認無其他引用

**驗收標準**：
- Feed 頁面 Logo 回到首頁
- 全域搜尋 `FEED_AGENT`、`FEED_CONSUMER` 回傳 0 筆

---

### #6b [P1] Feed：移除 DEMO_IDS + 接入 usePageMode

**目標**：Feed 改用統一 hook 判斷模式

**施工項目**：

#### 6b-A. 移除 DEMO_IDS 白名單

**檔案**：`src/pages/Feed/index.tsx`

- 移除 `DEMO_IDS` 硬編碼
- 改用 `usePageMode()` 判斷

#### 6b-B. 靜態 HTML 備份處理

- `public/feed-agent.html`、`public/feed-consumer.html`
- 若無引用則移除或加 redirect 到首頁

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

**施工項目**：

#### 8-A. 演示模式自動套用 resident 權限

**檔案**：`src/pages/Community/Wall.tsx`

```
mode === 'demo'    → 自動套用 resident 權限（全部可看、可操作）
mode === 'visitor' → guest 權限（現有邏輯，不動）
mode === 'live'    → 真實權限
```

#### 8-B. 演示模式下操作本地化

- 發文、留言 → 本地新增（不寫 DB）

**驗收標準**：
- 演示模式下社區牆全部可見，操作本地化
- 訪客模式維持現有 guest 限制（不動）

---

### #9 [P2] 移除所有靜態 HTML mock 頁

**目標**：清理所有靜態 HTML 殘留

**施工項目**：

- `public/community-wall_mvp.html` → 移除或 redirect
- `public/feed-agent.html` → 移除或 redirect
- `public/feed-consumer.html` → 移除或 redirect
- 全域搜尋確認無引用殘留

**前置條件**：#2、#6 完成後才能移除

**驗收標準**：
- 不存在任何指向靜態 HTML mock 頁的連結

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

## 核心原則

1. **訪客模式 ≠ Mock** — 是正式頁面的「未登入視角」，seed 資料 + 限制互動 + 註冊引導
2. **演示模式 = 完整功能預覽** — 隱藏密碼觸發，全站生效，操作本地化，不寫 DB
3. **每個 disabled 按鈕都需要解釋** — 學習 Community Wall 的 LockedOverlay 模式
4. **消滅靜態 HTML 死路** — 所有頁面都在 React app 內，保持一致的 Header/導航
5. **角色 ≠ 登入狀態** — 未登入不代表是消費者，頁面處理「未登入」而不假設身份
6. **演示模式不影響正式用戶** — 登入後自動退出演示，正式用戶永遠不知道演示入口存在
