# AGENT-PROFILE-01: UAG 房仲個人資料 + 詳情頁資料帶入 + 預約看屋移除 + 社會證明真實數據

## 工單摘要

| 項目         | 內容                                                                              |
| ------------ | --------------------------------------------------------------------------------- |
| **工單編號** | AGENT-PROFILE-01                                                                  |
| **標題**     | UAG 房仲個人資料 + 詳情頁帶入 + 移除預約看屋 + 社會證明真實數據                   |
| **優先級**   | P0 - Critical                                                                     |
| **狀態**     | 待開發                                                                            |
| **影響範圍** | UAG 後台、Profile 頁、PropertyDetailPage、AgentTrustCard、社會證明、DB RPC         |
| **建立日期** | 2026-02-07                                                                        |
| **負責人**   | -                                                                                 |

### 一句話描述

房仲 UAG 編輯個人資料 → 詳情頁自動帶入；移除預約看屋改雙按鈕；社會證明改用真實數據（瀏覽人數 + 安心留痕案件數）。

---

## 實作進度總覽

### 正式版 + Mock 共通

- [x] **#1** [P0] agentId fallback 修正 — 加入 `property.agent.id` 避免 Lead 寫成 'unknown'
- [x] **#2** [P0] 移除預約看屋 + 雙按鈕 UX 重構 — 三按鈕 → LINE + 致電雙按鈕，移除 BookingModal ✅ 2026-02-08
- [x] **#3** [P1] createLead 補傳 preferredChannel 欄位 ✅ 2026-02-08
- [x] **#4** [P2] LINE 按鈕色統一（併入 #2） ✅ 已完成於 #2

### 正式版專屬

- [ ] **#8** [P0] 社會證明真實數據 — 瀏覽人數（uag_events）+ 賞屋組數（trust_cases）替換假數據
- [x] **#10** [P0] 社區評價正式版 API 資料層修正 + Mock fallback（Mock fallback ✅ / 按鈕連結 ✅ / 正式版資料層待處理）

### 信任分 / 鼓勵數 / 評價系統

- [ ] **#12** [P1] 信任分 Tooltip 修正 + 績效指標 seed 校正 — 移除假拆分改說明型 Tooltip + DB 補齊 service_rating/review_count/completed_cases/joined_at
- [ ] **#13** [P0] 房仲評價系統 — DB `agent_reviews` 建表 + 評價 API + Step 2 評價彈窗 + (32) 可點擊查看評價列表 + 自動計算 AVG
- [ ] **#14** [P1] 獲得鼓勵系統 — 社區評價（兩好一公道）按讚 → 累積到 `agents.encouragement_count`

### 經紀人認證 / 完成案件 / 店名

- [ ] **#15** [P0] 經紀人認證系統 + 完成案件自動累積 — DB 補 `license_number` / `is_verified` + 結案 Trigger 自動 +1 `completed_cases` + 前端條件式「已認證」+ 手機版同步
- [ ] **#16** [P1] 店名開放編輯 — `company` 加入 `UpdateProfileSchema` + 前端 BasicInfoSection 移除 disabled

### Header / 品牌統一

- [ ] **#11** [P1] 詳情頁 Header 品牌統一 — 統一使用 `<Logo>` 組件 + 返回按鈕功能 + 色彩 design token + 無障礙補強

### 手機版 UX 優化

- [ ] **#9** [P1] 手機版 UX 優化 — DetailPage 11 項 + UAG 12 項 + 跨頁面 3 項（共 26 項）

### 功能移除

- [ ] **#17** [P0] 移除詳情頁「生成報告」FAB + 「30秒回電」浮動按鈕 — 前端移除 + API `report/create.ts` `report/track.ts` 移除 + 路由 `/r/:id` 移除

### Mock 版專屬

- [ ] **#5** [P0] 詳情頁 DEFAULT_PROPERTY 填充完整 mock agent 資料
- [ ] **#6** [P0] UAG Header Mock 模式顯示使用者區塊與「個人資料」入口
- [ ] **#7** [P0] Profile 頁面支援 Mock 模式（未登入可預覽 + 模擬編輯）

---

## 核心邏輯

```
UAG 後台（/maihouses/uag）
  └─ 房仲編輯個人資料（姓名、電話、LINE ID、簡介、專長、證照...）
       └─ PUT /api/agent/profile → 存入 DB agents 表
            └─ 所有該房仲的詳情頁自動帶入同一份資料（一處編輯，多處帶入）

詳情頁（/maihouses/property/MH-XXXXXX）
  ├─ 自動帶入 agent 資料 → AgentTrustCard / LineLinkPanel / CallConfirmPanel
  ├─ 消費者聯絡方式：
  │    ├─ 加 LINE 聊聊（主 CTA）→ LineLinkPanel
  │    └─ 致電諮詢（次 CTA）→ CallConfirmPanel
  └─ 社會證明數據（正式版真實、Mock 假數據）：
       ├─ 瀏覽人數 → max(亂數初始值, uag_events 真實瀏覽數)
       └─ 賞屋組數 → trust_cases 統計（0 時隱藏）
```

---

## #1 [P0] agentId fallback 修正（正式版 + Mock）

### 問題

**檔案：** `src/pages/PropertyDetailPage.tsx` L109-114

```typescript
const agentId = useMemo(() => {
  let aid = searchParams.get('aid');
  if (!aid) aid = localStorage.getItem('uag_last_aid');
  if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
  return aid || 'unknown';  // ← 完全忽略 property.agent.id
}, [searchParams]);
```

消費者從 Google / LINE 分享直接打開詳情頁（無 `?aid=` 參數）→ agentId = `'unknown'` → `createLead(agentId: 'unknown')` → 房仲永遠看不到這筆 Lead。

### 改動

| 檔案 | 改動 |
|------|------|
| `PropertyDetailPage.tsx` L109-114 | agentId 優先級改為：URL `?aid` > localStorage > `property.agent.id` > `'unknown'` |

```typescript
// ✅ 修正後
const agentId = useMemo(() => {
  let aid = searchParams.get('aid');
  if (!aid) aid = localStorage.getItem('uag_last_aid');
  if (!aid || aid === 'unknown') aid = property.agent?.id || null;
  if (aid && aid !== 'unknown') localStorage.setItem('uag_last_aid', aid);
  return aid || 'unknown';
}, [searchParams, property.agent?.id]);
```

### 驗收標準

- [x] 無 `?aid` URL 參數時，agentId 使用 `property.agent.id`
- [x] 有 `?aid` 時仍優先使用 URL 參數
- [x] ContactModal / createLead 傳入的 agentId 不再是 `'unknown'`（前提是 property 有 agent）
- [x] typecheck 通過

### #1 施工紀錄 (2026-02-07)

- `src/pages/PropertyDetailPage.tsx`
  - 修正 `agentId` 優先級：`?aid` → `localStorage(uag_last_aid)` → `property.agent.id` → `'unknown'`
  - 補上 dependency：`[searchParams, property.agent?.id]`，確保物件資料載入後可自動回退到正確 agent id
- `src/pages/__tests__/PropertyDetailPage.optimization.test.tsx`
  - 新增測試：無 `?aid` 且 localStorage 無值時，應使用 `property.agent.id` 並寫入 `uag_last_aid`
  - 保留既有測試：有 `?aid` 時仍以 URL 參數為主
- 驗證
  - `npm run test -- src/pages/__tests__/PropertyDetailPage.optimization.test.tsx`
  - `npm run typecheck`

---

## #2 [P0] 移除預約看屋 + 雙按鈕 UX 重構（正式版 + Mock）

### 決策背景

預約看屋功能需要全鏈路實作（DB + API + 前端 + UAG 管理面板 + 通知），成本過高且台灣房仲實務上消費者直接用 LINE 或電話聯絡即可。**決定移除預約看屋，改為 LINE + 致電雙按鈕。**

### 移除範圍

| 項目 | 目前位置 | 處理方式 |
|------|---------|---------|
| `BookingModal` 組件 | `src/components/PropertyDetail/BookingModal.tsx` | 刪除檔案 |
| `bookingUtils` 工具 | `src/components/PropertyDetail/bookingUtils.ts` | 刪除檔案 |
| `BookingModal` 測試 | `src/components/PropertyDetail/__tests__/BookingModal.test.tsx` | 刪除檔案 |
| `BookingModal` export | `src/components/PropertyDetail/index.ts` L15 | 移除該行 |
| `onBookingClick` prop | `AgentTrustCard.tsx` L24 | 移除 prop |
| `onBookingClick` prop | `MobileActionBar.tsx` L6 | 移除 prop |
| `onBookingClick` prop | `MobileCTA.tsx` L6 | 移除 prop |
| `onBookingClick` prop | `VipModal.tsx` L8 | 移除 prop，改為 `onCallClick` |
| booking 相關 state | `PropertyDetailPage.tsx` L81,84 | 移除 `bookingOpen`, `bookingSource` |
| booking 相關 handler | `PropertyDetailPage.tsx` L176-191, L402-403, L415-417, L427-429, L453-458 | 全部移除 |
| `BookingModal` 渲染 | `PropertyDetailPage.tsx` L689-697 | 移除 |
| `Calendar` icon import | 各相關檔案 | 移除（如不再使用） |

### UX 重構方案

#### AgentTrustCard（桌面側邊欄）

**改動前（三按鈕）：**
```
[ 加 LINE 聊聊 ]          ← 全寬主 CTA（LINE 綠）
[ 預約看屋 ] [ 致電諮詢 ] ← 半寬次 CTA 並排
```

**改動後（雙按鈕）：**
```
[ 加 LINE 聊聊 ]          ← 全寬主 CTA（LINE 綠，保持不變）
[ 致電諮詢 ]              ← 全寬次 CTA（outline 樣式 border-brand-700）
```

#### MobileActionBar（手機底部固定欄）

**改動前：** 三按鈕平分 `flex-1`
**改動後：** 兩按鈕各佔一半 `flex-1`，更寬敞，LINE 色統一

#### MobileCTA（手機首屏 CTA）

**改動前：** 三按鈕
**改動後：** 兩按鈕，LINE 色統一

#### VipModal（高意願攔截彈窗）

**改動前：** LINE + VIP 預約看屋
**改動後：** LINE + 致電諮詢（Calendar → Phone）

### 驗收標準

- [x] BookingModal 相關檔案已刪除
- [x] AgentTrustCard 顯示 LINE + 致電雙按鈕，視覺美觀合理
- [x] MobileActionBar 底部欄兩按鈕，觸摸面積充足（>= 44px）
- [x] MobileCTA 首屏兩按鈕
- [x] VipModal 顯示 LINE + 致電，無預約按鈕
- [x] 所有 LINE 按鈕色統一使用 CSS variable（#4 合併完成）
- [x] typecheck + lint 通過

### #2 施工紀錄 (2026-02-08)

#### 修改檔案清單

**UI 組件 (8 個檔案):**
1. `src/components/AgentTrustCard.tsx`
   - 移除 `onBookingClick` prop 與 `Calendar` import
   - 三按鈕改為雙按鈕 full-width 布局
   - LINE 按鈕：綠色 `#06C755` 主 CTA
   - 致電按鈕：outline style 次 CTA (`border-brand-700`)
   - 所有按鈕加入 `aria-label`、`min-h-[44px]`、`transition-colors duration-200`

2. `src/components/PropertyDetail/MobileActionBar.tsx`
   - 移除 `onBookingClick` prop 與 `Calendar` import
   - 三按鈕改為雙按鈕（LINE + 致電）

3. `src/components/PropertyDetail/MobileCTA.tsx`
   - 移除 `onBookingClick` prop，改 `weeklyBookings` → `trustCasesCount`
   - 文案「本物件 X 組預約中」→「本物件 X 組客戶已賞屋」
   - `trustCasesCount=0` 時不顯示提示

4. `src/components/PropertyDetail/VipModal.tsx`
   - 移除 `onBookingClick` → 改為 `onCallClick`
   - 「預約看屋」按鈕改為「致電諮詢」（Phone icon）

5. `src/components/PropertyDetail/PropertyInfoCard.tsx`
   - `socialProof.weeklyBookings` → `trustCasesCount`
   - 文案「本週 X 組預約看屋」→「X 組客戶已賞屋」

6. `src/components/PropertyDetail/index.ts`
   - 移除 `BookingModal` export

7. `src/pages/PropertyDetailPage.tsx`
   - 移除 `bookingOpen`, `bookingSource` state
   - 移除 `openBookingPanel`, `closeBookingPanel`, `handleBookingSubmit` handlers
   - 移除 `handleAgentBookingClick`, `handleMobileBookingClick`, `handleVipBookingClick` callbacks
   - 新增 `handleVipCallClick` callback
   - `socialProof.weeklyBookings` → `trustCasesCount`
   - 移除 `BookingModal` 渲染與相關 props 傳遞

8. `src/pages/propertyDetail/PropertyDetailActionLayer.tsx`
   - 移除 `BookingModal` import
   - 移除 `BookingPanelLayerProps` interface
   - 移除 `bookingPanel` prop 與相關使用
   - `VipModal` 的 `onBookingClick` → `onCallClick`
   - `MobileActionBar` 移除 `onBookingClick` prop
   - `socialProof.weeklyBookings` → `trustCasesCount`

**測試檔案 (5 個檔案):**
1. `src/components/__tests__/AgentTrustCard.memo.test.tsx`
   - 移除 `onBookingClick` mock
   - 移除所有預約相關測試（「應該忽略 onBookingClick 回調函數引用變化」、「應該在沒有 onBookingClick 時點擊預約按鈕不報錯」等）
   - 移除空的「預約看屋按鈕」測試 suite

2. `src/components/PropertyDetail/__tests__/MobileCTA.test.tsx`
   - 測試從三按鈕改為雙按鈕（移除預約相關測試）
   - `weeklyBookings` → `trustCasesCount`
   - 更新文案斷言

3. `src/components/PropertyDetail/__tests__/MobileActionBar.test.tsx`
   - 測試從三按鈕改為雙按鈕
   - 移除 `onBookingClick` 相關測試

4. `src/pages/__tests__/PropertyDetailPage.phase11.test.tsx`
   - 移除「點擊側欄預約按鈕應開啟 BookingModal」測試

5. `src/pages/__tests__/PropertyDetailPage.handlers.test.tsx`
   - 移除「handleAgentBookingClick 應開啟 BookingModal」測試

6. `src/pages/__tests__/PropertyDetailPage.optimization.test.tsx`
   - 更新「父組件的 callback 應該正確傳遞給 AgentTrustCard」測試
   - 移除 `agent-card-booking-button` 斷言，保留 LINE + 致電雙按鈕驗證

#### 測試結果
```
✅ Test Files  138 passed (138)
✅ Tests       1725 passed (1725)
✅ TypeScript  通過
✅ ESLint      通過
```

#### Commit
```
feat(PropertyDetail): 完成 Phase 11-A 三按鈕回歸雙按鈕 UX 重構

19 files changed, 614 insertions(+), 378 deletions(-)
Commit: e3c34f2e
```

---

## #3 [P1] createLead 補傳 preferredChannel（正式版）

### 問題

**檔案：**
- `src/components/ContactModal.tsx` L76-85
- `src/services/leadService.ts` L67-78

ContactModal 收集 `preferredChannel`（LINE/電話/站內訊息）但沒傳給 `createLead`。

### 改動

| 檔案 | 改動 |
|------|------|
| `src/services/leadService.ts` | `CreateLeadParams` 新增 `preferredChannel?: 'phone' \| 'line' \| 'message'` |
| `src/services/leadService.ts` | `createLead()` 將 `preferredChannel` 放入 `needsDescription` 前綴 |
| `src/components/ContactModal.tsx` | `handleSubmit` 傳入 `preferredChannel: form.preferredChannel` |

### 驗收標準

- [x] ContactModal 選擇的偏好聯絡方式有寫入 Lead ✅
- [x] Lead 的 `needs_description` 包含 `[偏好聯絡：LINE]` 等前綴 ✅
- [x] 現有測試通過 ✅

### 實作記錄（2026-02-08）

#### 修改檔案
1. **src/services/leadService.ts**
   - L78: 新增 `preferredChannel?: 'phone' | 'line' | 'message'` 到 `CreateLeadParams` interface
   - L106-114: 新增 channelPrefix 邏輯，將偏好聯絡方式前綴到 needsDescription
     - `phone` → `[偏好聯絡：電話]`
     - `line` → `[偏好聯絡：LINE]`
     - `message` → `[偏好聯絡：站內訊息]`

2. **src/components/ContactModal.tsx**
   - L82: 傳遞 `preferredChannel: form.preferredChannel` 給 createLead 函數

#### 驗證結果
```
✅ typecheck  0 errors
✅ lint       0 errors, 0 warnings
✅ tests      137 files, 1715 passed
```

#### Commit
待提交（2026-02-08）

---

## #4 [P2] LINE 按鈕色統一（併入 #2）

> **此項已併入 #2 一起處理。** 在 #2 移除預約按鈕、重構雙按鈕 UX 時，同時將硬編碼 `bg-[#06C755]` 改為 CSS variable。

### 實作方式

1. **定義常數** (`src/components/PropertyDetail/constants.ts`)
   ```typescript
   export const LINE_BRAND_GREEN = '#06C755';
   export const LINE_BRAND_GREEN_HOVER = '#05B04A';
   ```

2. **使用 CSS Variables 模式**（所有組件統一）
   ```typescript
   const lineBrandVars = {
     '--line-brand-green': LINE_BRAND_GREEN,
     '--line-brand-green-hover': LINE_BRAND_GREEN_HOVER,
   } as CSSProperties;

   // 在按鈕上使用
   className="bg-[var(--line-brand-green)] hover:bg-[var(--line-brand-green-hover)]"
   ```

### 覆蓋檔案

✅ 以下 7 個檔案已統一使用 CSS variable：
- `src/components/AgentTrustCard.tsx`
- `src/components/PropertyDetail/MobileActionBar.tsx`
- `src/components/PropertyDetail/MobileCTA.tsx`
- `src/components/PropertyDetail/VipModal.tsx`
- `src/components/PropertyDetail/LineLinkPanel.tsx`
- `src/components/PropertyDetail/PropertyInfoCard.tsx`
- `src/pages/Report/ReportGenerator.tsx`

### 驗證結果（2026-02-08）

```bash
# 搜尋硬編碼 LINE 綠色（排除 constants.ts）
grep -rn "bg-\[#06C755\]" --include="*.tsx" --include="*.ts" src/ | grep -v "constants.ts"
# 結果：無匹配（✅ 全部已移除硬編碼）

grep -rn "bg-\[#05B04A\]" --include="*.tsx" --include="*.ts" src/ | grep -v "constants.ts"
# 結果：無匹配（✅ 全部已移除硬編碼）

# 確認 CSS variable 使用
rg "bg-\[var\(--line-brand-green\)\]" --type-add 'tsx:*.tsx' --type tsx
# 結果：7 個檔案正確使用（✅）
```

✅ **#4 已完全實作並驗證完成**

---

## #5 [P0] 詳情頁 DEFAULT_PROPERTY 填充完整 mock agent（Mock 版）

### 問題

**檔案：** `src/services/propertyService.ts` L322-352

`DEFAULT_PROPERTY.agent` 全空（`id: '', name: '', trustScore: 0`），導致 Mock 詳情頁全零。

### 改動

| 檔案 | 改動 |
|------|------|
| `src/services/propertyService.ts` | `DEFAULT_PROPERTY.agent` 填入完整假資料 |

```typescript
agent: {
  id: 'mock-agent-001',
  internalCode: 88001,
  name: '陳小明',
  avatarUrl: '',
  company: '邁房子',
  trustScore: 87,
  encouragementCount: 23,
  phone: '0912345678',
  lineId: 'maihouses_demo',
  serviceRating: 4.8,
  reviewCount: 32,
  completedCases: 45,
  serviceYears: 4,
},
```

### 驗收標準

- [ ] `/maihouses/property/MH-100001` AgentTrustCard 顯示「陳小明」+ 完整數據
- [ ] 點「加 LINE 聊聊」→ LineLinkPanel 顯示 LINE ID（非 fallback）
- [ ] 點「致電諮詢」→ CallConfirmPanel 顯示電話號碼（非 fallback）

---

## #6 [P0] UAG Header Mock 模式顯示使用者區塊（Mock 版）

### 問題

**檔案：** `src/pages/UAG/components/UAGHeader.tsx` L149

Mock 模式下 `user` 為 null → 整個使用者區塊消失 → 找不到「個人資料」入口。

### 改動

| 檔案 | 改動 |
|------|------|
| `UAGHeader.tsx` | 新增 `useMock` prop，條件改為 `{(user \|\| useMock) && ...}` |
| `UAGHeader.tsx` | Mock 模式下顯示假名字「陳小明」+ 導向 `/maihouses/uag/profile?mock=true` |
| `src/pages/UAG/index.tsx` | 將 `useMock` 傳入 `<UAGHeader>` |

### 驗收標準

- [ ] Mock 模式右上角可看到使用者頭像 + 下拉選單含「個人資料」
- [ ] 點擊導向 Profile 頁面（帶 mock 參數）
- [ ] 正式模式行為不變

---

## #7 [P0] Profile 頁面支援 Mock 模式（Mock 版）

### 問題

`fetchAgentMe()` 無 token 直接 throw → Profile 頁面未登入顯示「無法載入」。

### 改動

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | 偵測 `?mock=true`，回傳 mock 假資料 |
| `src/pages/UAG/Profile/index.tsx` | Mock 模式下編輯用 local state 保存 + notify 提示 |

### 驗收標準

- [ ] 訪問 `/maihouses/uag/profile?mock=true` 可正常顯示
- [ ] 可模擬編輯 → notify 成功提示
- [ ] 正式模式行為不變

---

## #8 [P0] 社會證明真實數據（正式版專屬，Mock 不改）

### 需求

總金額下方的社會證明區（`PropertyInfoCard`）+ 手機首屏 CTA（`MobileCTA`）+ 手機底部固定欄（`MobileActionBar`）三處統一改為真實數據。**Mock 頁（`property.isDemo`）完全不改，保持現有假數據。**

### 目前（假數據）

**PropertyDetailPage.tsx L194-202：**
```typescript
const socialProof = useMemo(() => {
  const seed = property.publicId?.charCodeAt(3) || 0;
  return {
    currentViewers: Math.floor(seed % 5) + 2,   // 假的 2-6
    weeklyBookings: Math.floor(seed % 8) + 5,    // 假的 5-12
    isHot: seed % 3 === 0,                        // 假的 1/3 機率
  };
}, [property.publicId]);
```

**三個顯示位置：**

| 組件 | 位置 | 目前顯示 |
|------|------|---------|
| `PropertyInfoCard.tsx` L93-100 | 總金額下方（桌面+手機） | `👁 N 人正在瀏覽` + `👥 本週 N 組預約看屋` |
| `MobileCTA.tsx` L67-69 | 手機首屏 CTA 下方 | `本物件 N 組預約中，把握機會！` |
| `MobileActionBar.tsx` L39-54 | 手機底部固定欄上方 | `👁 N 人瀏覽中` + `🔥 熱門` |

### 改動後（正式版）

#### 8-A. 瀏覽人數 — `max(亂數初始值, 真實瀏覽數)`

**邏輯：**
1. 初始值：亂數 3-18（`Math.floor(Math.random() * 16) + 3`）
2. 從 API 拿到真實瀏覽數（`uag_events` 的 `COUNT(DISTINCT session_id) WHERE property_id = ?`）
3. 最終顯示值 = `Math.max(初始值, 真實瀏覽數)`
4. 如果真實瀏覽數 > 初始值，就顯示真實次數
5. 初期流量低時，至少顯示 3-18 之間的數字（不會出現 0 或 1）

**需要新增：**

| 層級 | 項目 | 說明 |
|------|------|------|
| DB | RPC `fn_get_property_public_stats(p_property_id TEXT)` | `SECURITY DEFINER`，回傳 `{ view_count, trust_cases_count }`，授權給 `anon` + `authenticated` |
| API | `GET /api/property/public-stats?id=MH-XXXXXX` | 不需認證，呼叫 RPC，回傳統計 |
| 前端 | `PropertyDetailPage` 用 `useQuery` 呼叫 API | `staleTime: 60000`（1 分鐘快取） |

**RPC 函數設計：**

```sql
CREATE OR REPLACE FUNCTION public.fn_get_property_public_stats(p_property_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_count BIGINT;
  v_trust_cases_count BIGINT;
BEGIN
  -- 瀏覽人數：uag_events 的 unique session 數
  SELECT COUNT(DISTINCT e.session_id)
  INTO v_view_count
  FROM public.uag_events e
  WHERE e.property_id = p_property_id;

  -- 也計入 archive 表
  SELECT v_view_count + COUNT(DISTINCT ea.session_id)
  INTO v_view_count
  FROM public.uag_events_archive ea
  WHERE ea.property_id = p_property_id;

  -- 安心留痕案件數：trust_cases 中 active + completed
  SELECT COUNT(*)
  INTO v_trust_cases_count
  FROM public.trust_cases tc
  WHERE tc.property_id = p_property_id
    AND tc.status IN ('active', 'completed');

  RETURN jsonb_build_object(
    'view_count', COALESCE(v_view_count, 0),
    'trust_cases_count', COALESCE(v_trust_cases_count, 0)
  );
END;
$$;

-- 授權：未登入消費者也能看（只回傳統計數字，不洩漏細節）
GRANT EXECUTE ON FUNCTION public.fn_get_property_public_stats(TEXT) TO anon, authenticated, service_role;
```

#### 8-B. 賞屋組數 — trust_cases 統計

**邏輯：**
1. **前提條件：物件必須已開啟安心留痕服務（`trustEnabled === true`）**
2. 從 API 拿到 `trust_cases_count`（該 property 的 active + completed 案件數）
3. `trustEnabled && count > 0` 時顯示：`本物件 N 組客戶已賞屋`
4. `trustEnabled === false` 或 `count === 0` 時**隱藏這行**（沒開啟服務不顯示；初期數據少也隱藏）

#### 8-C. 熱門標記 — 連動真實數據

**邏輯：**
- `isHot = trustEnabled && trust_cases_count >= 3`（物件有開啟安心留痕 且 有 3 組以上案件才算熱門）
- `trustEnabled === false` 或 `trust_cases_count < 3` 時不顯示熱門

#### 8-D. 前端整合 — socialProof 改造

**PropertyDetailPage.tsx socialProof 改造：**

```typescript
// 正式版：從 API 取得真實數據
const { data: publicStats } = useQuery({
  queryKey: ['property-public-stats', property.publicId],
  queryFn: () => fetch(`/api/property/public-stats?id=${property.publicId}`).then(r => r.json()),
  enabled: !property.isDemo && Boolean(property.publicId),
  staleTime: 60_000,
});

const socialProof = useMemo(() => {
  // Mock 頁：保持原有假數據邏輯，完全不改
  if (property.isDemo) {
    const seed = property.publicId?.charCodeAt(3) || 0;
    return {
      currentViewers: Math.floor(seed % 5) + 2,
      trustCasesCount: Math.floor(seed % 8) + 5,  // Mock 繼續顯示假數據
      isHot: seed % 3 === 0,
    };
  }

  // 正式版：真實數據
  const baseViewers = Math.floor(Math.random() * 16) + 3;  // 亂數初始值 3-18
  const realViewCount = publicStats?.data?.view_count ?? 0;
  const trustCasesCount = publicStats?.data?.trust_cases_count ?? 0;

  return {
    currentViewers: Math.max(baseViewers, realViewCount),
    trustCasesCount,
    isHot: trustCasesCount >= 3,
  };
}, [property.isDemo, property.publicId, publicStats]);
```

#### 8-E. 三個組件的文案改動（正式版）

**PropertyInfoCard.tsx L93-100：**

```tsx
{/* 瀏覽人數 — 永遠顯示 */}
<div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
  <Eye size={12} className="text-blue-500" />
  {socialProof.currentViewers} 人正在瀏覽
</div>

{/* 賞屋組數 — 有開啟安心留痕服務 且 案件數 > 0 時才顯示 */}
{trustEnabled && socialProof.trustCasesCount > 0 && (
  <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600">
    <Users size={12} className="text-green-500" />
    本物件 {socialProof.trustCasesCount} 組客戶已賞屋
  </div>
)}
```

**MobileCTA.tsx 底部文案：**

```tsx
{/* 有開啟安心留痕服務 且 案件數 > 0 時才顯示 */}
{trustEnabled && socialProof.trustCasesCount > 0 && (
  <p className="mt-2 text-center text-xs text-slate-700">
    本物件 {socialProof.trustCasesCount} 組客戶已賞屋，把握機會！
  </p>
)}
```

**MobileActionBar.tsx 社會證明區：** 同理，瀏覽人數保留，賞屋組數需 `trustEnabled && count > 0` 才顯示。

#### 8-F. Props 介面調整

| 組件 | 舊 prop | 新 prop |
|------|---------|---------|
| `PropertyInfoCard` | `socialProof.weeklyBookings: number` | `socialProof.trustCasesCount: number` |
| `MobileCTA` | `weeklyBookings: number` | `socialProof: { currentViewers, trustCasesCount, isHot }` |
| `MobileActionBar` | `socialProof: { currentViewers, isHot }` | `socialProof: { currentViewers, trustCasesCount, isHot }` |

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `supabase/migrations/YYYYMMDD_property_public_stats.sql` | **新增** | RPC `fn_get_property_public_stats` |
| `api/property/public-stats.ts` | **新增** | GET API，不需認證 |
| `src/pages/PropertyDetailPage.tsx` | 修改 | socialProof 改用 useQuery + 真實數據 |
| `src/components/PropertyDetail/PropertyInfoCard.tsx` | 修改 | 文案改為「N 組客戶已賞屋」，0 時隱藏 |
| `src/components/PropertyDetail/MobileCTA.tsx` | 修改 | 文案改為「N 組客戶已賞屋」，0 時隱藏 |
| `src/components/PropertyDetail/MobileActionBar.tsx` | 修改 | 賞屋組數 > 0 時顯示 |

### Mock 不改原則

- `property.isDemo === true` 時走原有 seed 假數據邏輯
- 不呼叫 `/api/property/public-stats` API
- MH-100001 頁面行為完全不變

### 驗收標準

- [ ] DB：RPC `fn_get_property_public_stats` 已建立，anon 可呼叫
- [ ] API：`GET /api/property/public-stats?id=MH-XXXXXX` 正常回傳 `{ view_count, trust_cases_count }`
- [ ] 正式版：瀏覽人數 = `max(亂數 3-18, 真實瀏覽數)`
- [ ] 正式版：`trustEnabled && trust_cases_count > 0` 時顯示「本物件 N 組客戶已賞屋」
- [ ] 正式版：`trustEnabled === false` 或 `trust_cases_count === 0` 時隱藏賞屋文案
- [ ] 正式版：`trustEnabled && trust_cases_count >= 3` 時顯示「熱門物件」標記
- [ ] 三處統一（PropertyInfoCard + MobileCTA + MobileActionBar）
- [ ] Mock 頁（MH-100001）行為完全不變
- [ ] typecheck + lint 通過

---

## #10 [P0] 社區評價正式版 API 資料層修正 + Mock fallback

### 問題

正式版物件的社區評價區塊（`CommunityReviews`）無法顯示評價，原因如下：

| # | 問題 | 位置 | 說明 |
|---|------|------|------|
| 1 | MH-100001 seed 沒設定 `community_id` | `supabase/migrations/20251127_properties_schema.sql` L63-80 | INSERT 語句沒有 `community_id` 欄位，DB 值為 NULL |
| 2 | `DEFAULT_PROPERTY` 缺少 `communityId` | `src/services/propertyService.ts` L323-352 | fallback 物件無此欄位 → Supabase 查詢失敗時回退也沒有 |
| 3 | `propertyService` 只在 `data.community_id` 有值時才設置 | `src/services/propertyService.ts` L507-509 | DB 為 NULL → `communityId` 為 undefined |
| 4 | `CommunityReviews` 無 communityId 時跳過 API 呼叫 | `CommunityReviews.tsx` L146 | `if (!communityId) return;` → 永不呼叫 API |
| 5 | 正式版物件需要 `community_reviews` 表有評價資料 | DB `community_reviews` 表 | 即使有 `community_id`，如果該社區沒有評價，仍顯示空狀態 |

### 已完成修復

| 項目 | 狀態 | 說明 |
|------|------|------|
| Mock fallback | ✅ 已修復 | `CommunityReviews` 新增 `isDemo` prop，Mock 模式下無 `communityId` 時自動顯示 2 則 Mock 評價 + 1 則鎖定評價 |
| 「註冊查看更多評價」按鈕跳轉連結 | ✅ 已修復 | `?redirect=community` → `?mode=login` |

### 待處理（正式版資料層）

| 項目 | 優先級 | 說明 |
|------|--------|------|
| 10-A. 為正式版物件建立社區關聯 | P0 | 上架流程（`propertyService.submitProperty`）已有 `resolveOrCreateCommunity` 自動建立社區，但 seed 物件（MH-100001）沒有走上架流程，需要 migration 補設定 |
| 10-B. 為正式版社區補 seed 評價 | P1 | 正式版社區初期沒有評價資料時，社區評價區塊會顯示「目前尚無公開評價」。可考慮：(a) 上架時自動產生 seed 評價，或 (b) 正式版也加 fallback 顯示提示文案引導用戶留評價 |
| 10-C. `community-wall_mvp.html` 連結確認 | P2 | 「前往社區牆」按鈕導向 `/maihouses/community-wall_mvp.html`，確認此頁面在正式環境是否存在且可訪問 |

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | ✅ 已修改 | 新增 `isDemo` prop + Mock 資料 + 修正跳轉連結 |
| `src/pages/PropertyDetailPage.tsx` L627 | ✅ 已修改 | 傳入 `isDemo={property.isDemo}` |
| `supabase/migrations/YYYYMMDD_fix_mh100001_community.sql` | **待新增** | 為 MH-100001 補設定 `community_id`（需先建立或找到對應社區） |
| `supabase/migrations/YYYYMMDD_seed_community_reviews.sql` | **待新增** | 為正式版社區補 seed 評價資料 |

### 驗收標準

- [x] Mock 頁（MH-100001）顯示 2 則 Mock 評價 + 1 則鎖定
- [x] 「註冊查看更多評價」按鈕導向 `/maihouses/auth.html?mode=login`
- [ ] 正式版物件有 `community_id` 時，API 正常回傳評價資料
- [ ] 正式版物件有評價時，顯示 2 則公開 + 1 則鎖定
- [ ] 正式版物件無評價時，顯示「目前尚無公開評價」（非錯誤狀態）
- [ ] typecheck + lint 通過

---

## #9 [P1] 手機版 UX 優化（DetailPage + UAG + 跨頁面）

### 來源

根據 `/ui-ux-pro-max` 的 `ux-guidelines.csv` 規範逐項審核，比對 DetailPage 與 UAG 手機版呈現。

---

### DetailPage 手機版優化（D1-D11）

#### D1. `animate-bounce` 過度動畫

**檔案：** `src/pages/PropertyDetailPage.tsx` L649-654
**規範引用：** ux-guidelines #7（連續動畫 ≤ 5 秒）、#12（動畫不干擾閱讀）

**問題：** 浮動「30秒回電」按鈕使用 `animate-bounce` 無限循環，手機上持續跳動分散注意力。

**修復方案：**
- 改為 `animate-bounce` 只播 3 次後停止（`animation-iteration-count: 3`）
- 或改為 hover/focus 時才 bounce

#### D2. 浮動按鈕與 MobileActionBar 重疊

**檔案：** `src/pages/PropertyDetailPage.tsx` L649（`fixed bottom-6 right-4`）
**規範引用：** ux-guidelines #17（fixed 定位衝突）

**問題：** 浮動「30秒回電」按鈕 `bottom-6`（24px）與 MobileActionBar `fixed bottom-0` 重疊，行動裝置上互相遮擋。

**修復方案：**
- 浮動按鈕 `bottom` 改為 `bottom-20`（80px），確保在 ActionBar 上方
- 或在 MobileActionBar 可見時隱藏浮動按鈕

#### D3. VipModal 缺少 focus trap

**檔案：** `src/components/PropertyDetail/VipModal.tsx` L34-42
**規範引用：** ux-guidelines #22（觸控目標 ≥ 44px）、WCAG 2.1

**問題：** VipModal 的外層 `div` 使用 `role="button"` 但不是實際按鈕，且沒有 focus trap。

**修復方案：**
- 外層 `div` 改為 `role="presentation"`（與 LineLinkPanel 一致）
- 加入 `useFocusTrap` hook
- 加入 `aria-modal="true"` + `aria-labelledby`

#### D4. VipModal 手機佈局改進

**檔案：** `src/components/PropertyDetail/VipModal.tsx`
**規範引用：** ux-guidelines #17（行動裝置 fixed 佈局）

**問題：** VipModal 在手機上 `items-center` 置中，但下半部被虛擬鍵盤遮擋。

**修復方案：**
- 手機版改為 `items-end`（底部滑出），與 LineLinkPanel / CallConfirmPanel 一致

#### D5. 社會證明區 320px 窄螢幕溢出

**檔案：** `src/components/PropertyDetail/PropertyInfoCard.tsx` L86-101
**規範引用：** ux-guidelines #6（320px 最小寬度支援）

**問題：** 瀏覽人數 + 賞屋組數兩個 badge 在 320px 窄螢幕可能擠壓換行。

**修復方案：**
- 外層 `flex gap-2` 加入 `flex-wrap`，允許窄螢幕自動換行

#### D6. MobileActionBar 缺少 ARIA label

**檔案：** `src/components/PropertyDetail/MobileActionBar.tsx` L56-86
**規範引用：** ux-guidelines #22、WCAG 2.1

**問題：** 底部固定欄的按鈕缺少 `aria-label`（無障礙螢幕閱讀器無法辨識）。

**修復方案：**
- LINE 按鈕加 `aria-label="加 LINE 聊聊"`
- 致電按鈕加 `aria-label="致電諮詢"`

#### D7. MobileCTA 缺少 ARIA label

**檔案：** `src/components/PropertyDetail/MobileCTA.tsx`
**規範引用：** 同 D6

**問題：** 同 D6，首屏 CTA 按鈕缺少 `aria-label`。

#### D8. `prefers-reduced-motion` 未處理

**檔案：** `src/pages/PropertyDetailPage.tsx`（全域）
**規範引用：** ux-guidelines #9（尊重 `prefers-reduced-motion`）

**問題：** 專案沒有全域的 `prefers-reduced-motion` 處理，animate-bounce、transition 等動畫在無障礙需求用戶裝置上仍然播放。

**修復方案：**
- Tailwind 加入 `motion-reduce:animate-none` 到有動畫的元素
- 或全域 CSS 加入 `@media (prefers-reduced-motion: reduce) { .animate-bounce { animation: none; } }`

#### D9. LineLinkPanel / CallConfirmPanel 缺少滑入動畫

**檔案：** `src/components/PropertyDetail/LineLinkPanel.tsx` L124-127
**檔案：** `src/components/PropertyDetail/CallConfirmPanel.tsx`
**規範引用：** ux-guidelines #12（入場動畫 150-300ms）

**問題：** 手機版 bottom sheet 瞬間出現，缺少 `translate-y → 0` 的滑入動畫。

**修復方案：**
- 加入 CSS transition：`transform 200ms ease-out`，初始 `translate-y-full` → 進場 `translate-y-0`

#### D10. 總金額區塊手機字體偏小

**檔案：** `src/components/PropertyDetail/PropertyInfoCard.tsx` L52-75
**規範引用：** ux-guidelines #6（手機可讀性）

**問題：** 總金額的副標題（每坪單價）在手機上 `text-xs` 可能不易閱讀。

**修復方案：**
- 手機版副標題改為 `text-sm`（`text-xs sm:text-xs` → `text-sm sm:text-xs`）

#### D11. 圖片 gallery swipe 手勢缺失

**檔案：** `src/components/PropertyDetail/PropertyGallery.tsx`
**規範引用：** ux-guidelines #22（觸控操作）

**問題：** 手機版圖片切換只有左右箭頭按鈕，沒有 swipe 手勢支援。

**修復方案：**
- 加入 touch event handler（`touchstart` / `touchmove` / `touchend`）支援左右滑動切換

---

### UAG 手機版優化（U1-U12）

#### U1. RadarCluster 觸控目標太小

**檔案：** `src/pages/UAG/components/RadarCluster.tsx`
**規範引用：** ux-guidelines #22（觸控目標 ≥ 44px）

**問題：** Radar 圖上的數據點（圓點）在手機上太小，不易點擊。

**修復方案：**
- 手機版增大圓點 hit area（加透明 padding 或 `min-width/min-height: 44px`）

#### U2. z-index 管理不一致

**檔案：** `src/pages/UAG/UAG.module.css` 多處
**規範引用：** ux-guidelines #15（z-index 管理）

**問題：** UAG 頁面多處使用硬編碼 z-index（`z-index: 10`, `z-index: 50`, `z-index: 999`），與全站 z-index 層級可能衝突。

**修復方案：**
- 統一使用 Tailwind z-index scale（`z-10`, `z-20`, `z-30`, `z-modal`）
- 或建立 `z-index.ts` 常數檔統一管理

#### U3. 麵包屑（Breadcrumb）手機溢出

**檔案：** `src/pages/UAG/components/UAGHeader.tsx` L115-119
**規範引用：** ux-guidelines #6（320px 最小寬度）

**問題：** 公司名 badge + PRO badge + 麵包屑文字在 320px 手機可能溢出。

**修復方案：**
- 加 `overflow-hidden text-ellipsis whitespace-nowrap` 或 `max-w-[200px] truncate`

#### U4. Agent bar 字體過小

**檔案：** `src/pages/UAG/components/UAGHeader.tsx` L206-227
**規範引用：** ux-guidelines #6（手機可讀性）

**問題：** Agent 統計數字使用 11px 字體（`text-[11px]`），手機上太小。

**修復方案：**
- 手機版改為 `text-xs`（12px）：`text-[11px] sm:text-[11px]` → `text-xs sm:text-[11px]`

#### U5. 缺少 overscroll-behavior

**檔案：** `src/pages/UAG/UAG.module.css`
**規範引用：** ux-guidelines #17（行動裝置滾動）

**問題：** UAG 頁面在手機上滑到底會觸發瀏覽器的 pull-to-refresh 或彈性滾動。

**修復方案：**
- 主容器加 `overscroll-behavior: contain`

#### U6. Listing 縮圖尺寸優化

**檔案：** `src/pages/UAG/components/ListingFeed.tsx`
**規範引用：** ux-guidelines #22（觸控目標）

**問題：** 手機版 Listing 項目的縮圖 `64x64` 偏小，點擊體驗不佳。

**修復方案：**
- 手機版縮圖改為 `80x80`（`size-16` → `size-20`）

#### U7. Footer 固定欄手機安全區

**檔案：** `src/pages/UAG/UAG.module.css` L1322-1354
**規範引用：** ux-guidelines #17（iOS safe area）

**問題：** UAG 底部固定欄沒有考慮 iOS safe area inset，可能被 Home Indicator 遮擋。

**修復方案：**
- 加入 `padding-bottom: env(safe-area-inset-bottom, 0)` 或 Tailwind `pb-safe`

#### U8. AssetMonitor 卡片觸控改進

**檔案：** `src/pages/UAG/components/AssetMonitor.tsx`
**規範引用：** ux-guidelines #22（觸控目標 ≥ 44px）

**問題：** 手機版 AssetMonitor 表格轉卡片模式，行動按鈕（查看、編輯）可能小於 44px。

**修復方案：**
- 確保行動按鈕 `min-height: 44px`

#### U9. Agent Bar 超窄屏（<480px）統計數據擠壓

**檔案：** `src/pages/UAG/UAG.module.css` L95-148（`.agent-bar` + `.agent-bar-stats`）
**規範引用：** ux-guidelines #22（觸控目標 ≥ 44px）、#67（手機可讀性）、#65（320/375/414px 斷點測試）、react.csv #14（避免 inline style）

**問題：** Agent Bar 的統計數據（信任分 / 帶看 / 成交 / 鼓勵）在 375px 窄屏上全部擠在一行。每個數據區塊只有約 60px 寬度，11px 字體 + 標籤文字嚴重擠壓，觸控交互困難。CSS 只有 `@media (max-width: 1024px)` 斷點，**缺少 `<480px` 超窄屏專用處理**。

**實際擠壓情況（375px 模擬）：**
```
|👤 游杰倫|◀ 12345 ⚡92 🚶45 ✔️8 |
```

**修復方案：**
```css
/* src/pages/UAG/UAG.module.css */
@media (max-width: 480px) {
  .agent-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .agent-bar-stats {
    flex-wrap: wrap;
    gap: 8px 12px;
    width: 100%;
  }
  .agent-bar-stat {
    min-width: 60px;  /* 確保每個統計區塊最小寬度 */
  }
}
```

**UI/UX Pro Max 檢查：**
- ux-guidelines #65：需在 320px、375px、414px 三個斷點都測試通過
- ux-guidelines #67：手機端字體最小 12px（`text-xs`），目前 11px 不合規
- ux-guidelines #22：統計數據若有觸控交互（Tooltip），需 ≥ 44px touch target

#### U10. Mock Lead A-6600 `conversation_id` 缺失

**檔案：** `src/pages/UAG/mockData.ts` L142-157（A-6600 Lead 定義）
**規範引用：** react.csv #4（避免不必要 state）、ux-guidelines #33（錯誤回饋）

**問題：** A-6600 是已購 Lead（`status: 'purchased'`），但缺少 `conversation_id` 欄位。AssetMonitor 表格中該 Lead 的「操作」欄依賴 `conversation_id` 判斷顯示「發送訊息」還是「查看聊天」。缺少此欄位可能導致：
- 操作按鈕邏輯判斷錯誤
- Mock 與 Live 模式行為不一致（Live 模式的已購 Lead 一定有 `conversation_id`）

**問題代碼：**
```typescript
{
  id: MOCK_IDS.leads.A6600,
  name: '買家 A-6600',
  grade: 'A',
  status: 'purchased',
  purchased_at: Date.now() - 10 * 3600000,
  notification_status: 'pending',
  // ❌ 缺少 conversation_id — 與其他已購 Lead 不一致
}
```

**修復方案：**
```typescript
{
  id: MOCK_IDS.leads.A6600,
  name: '買家 A-6600',
  grade: 'A',
  status: 'purchased',
  purchased_at: Date.now() - 10 * 3600000,
  notification_status: 'pending',
  conversation_id: 'mock-conv-A6600-001',  // ✅ 補齊
}
```

**UI/UX Pro Max 檢查：**
- Mock 與 Live 的資料結構必須完全一致，避免只在 Mock 出現的 undefined edge case
- ux-guidelines #33：如果 `conversation_id` 為空導致操作按鈕異常，需顯示清楚錯誤訊息

#### U11. Monitor Table 手機端按鈕觸控目標不足 44px

**檔案：** `src/pages/UAG/UAG.module.css` L915-930（`.monitor-table` 手機版卡片轉換）
**檔案：** `src/pages/UAG/components/AssetMonitor.tsx`（操作按鈕區）
**規範引用：** ux-guidelines #22（觸控目標 ≥ 44px）、#23（相鄰觸控間距 ≥ 8px）、react.csv #15（組件職責清晰）

**問題：** AssetMonitor 在 `<768px` 下隱藏表頭轉為卡片式，但卡片內的操作按鈕（「發送訊息」「查看聊天」「查看報告」）：
1. 按鈕高度未強制 `min-height: 44px`
2. 按鈕之間間距可能 < 8px
3. 在 375px 窄屏上，多個按鈕擠在一行導致觸控誤觸

**修復方案：**
```css
/* src/pages/UAG/UAG.module.css */
@media (max-width: 768px) {
  .monitor-card-actions {
    display: flex;
    flex-direction: column;  /* 改為垂直排列 */
    gap: 8px;                /* 按鈕間距 ≥ 8px */
    width: 100%;
  }
  .monitor-card-actions button {
    min-height: 44px;        /* 觸控目標 ≥ 44px */
    width: 100%;             /* 全寬按鈕 */
    justify-content: center;
  }
}
```

**UI/UX Pro Max 檢查：**
- ux-guidelines #22：所有按鈕 `min-height: 44px`（High severity）
- ux-guidelines #23：相鄰按鈕 `gap ≥ 8px`（Medium severity）
- ux-guidelines #71：手機表格必須用 `overflow-x-auto` 或卡片式（已符合）
- ux-guidelines #30：按鈕需有 `active:scale-[0.98]` 回饋

#### U12. Desktop 版本未利用寬屏多列排列

**檔案：** `src/pages/UAG/UAG.module.css` L374-379（grid layout）
**規範引用：** ux-guidelines #21（容器寬度限制）、ux-guidelines #73（行長度 65-75ch）、react.csv #15（組件職責）

**問題：** Desktop（≥1025px）版本的 6 個主要組件（RadarCluster、ActionPanel、AssetMonitor、ListingFeed、ReportGenerator、TrustFlow）全部佔 6 列（`grid-column: span 6`），垂直堆疊。造成 1440px+ 寬屏頁面極長（需滾動 5+ 屏），浪費了桌面端的水平空間。

**現有 CSS：**
```css
.uag-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 24px;
}
.k-span-6 { grid-column: span 6; }
/* ❌ 沒有 @media (min-width: 1025px) 的多列排列 */
```

**修復方案：**
```css
@media (min-width: 1280px) {
  /* ActionPanel + AssetMonitor 並排 */
  .uag-grid > .k-span-6:nth-child(2) { grid-column: span 3; }
  .uag-grid > .k-span-6:nth-child(3) { grid-column: span 3; }

  /* ListingFeed + TrustFlow 並排 */
  .uag-grid > .k-span-6:nth-child(4) { grid-column: span 3; }
  .uag-grid > .k-span-6:nth-child(6) { grid-column: span 3; }
}
```

**UI/UX Pro Max 檢查：**
- ux-guidelines #21：文字容器 max-width 65-75ch（Medium severity）
- ux-guidelines #73：文字行長度控制（Medium severity）
- products.csv `dashboard` 類型建議：資訊面板應利用網格並排展示，減少垂直滾動

---

### 跨頁面共通優化（C1-C3）

#### C1. LINE 品牌色硬編碼殘留

**涉及檔案：** 多處
**規範引用：** ux-guidelines #15（一致性）

**問題：** 部分地方仍用硬編碼 `bg-[#06C755]`，部分已改用 CSS variable `--line-brand-green`。

**修復方案：**
- 全站統一使用 `constants.ts` 的 `LINE_BRAND_GREEN` + CSS variable

#### C2. Modal 背景 backdrop 不一致

**涉及檔案：** VipModal / LineLinkPanel / CallConfirmPanel
**規範引用：** ux-guidelines #15（一致性）

**問題：** LineLinkPanel 用 `bg-black/50 backdrop-blur-sm`，VipModal 用 `bg-black/60`，不一致。

**修復方案：**
- 統一為 `bg-black/50 backdrop-blur-sm`

#### C3. iOS viewport 100vh 問題

**涉及檔案：** 全站 Modal / 固定欄
**規範引用：** ux-guidelines #17（iOS viewport）

**問題：** iOS Safari 的 `100vh` 包含地址欄高度，可能導致固定欄超出實際可視區域。

**修復方案：**
- 改用 `100dvh`（dynamic viewport height）或 `min-height: -webkit-fill-available`

---

### 驗收標準

- [ ] D1: 浮動按鈕動畫不超過 3 次循環
- [ ] D2: 浮動按鈕不與 MobileActionBar 重疊
- [ ] D3: VipModal 有 focus trap + 正確 ARIA 屬性
- [ ] D4: VipModal 手機版從底部滑出
- [ ] D5: 社會證明 badge 在 320px 不溢出
- [ ] D6-D7: 所有 CTA 按鈕有 `aria-label`
- [ ] D8: `prefers-reduced-motion` 時動畫停止
- [ ] D9: Panel 有滑入動畫（200ms）
- [ ] D10: 手機版金額副標題可讀
- [ ] D11: 圖片 gallery 支援 swipe 手勢
- [ ] U1: RadarCluster 數據點觸控目標 ≥ 44px
- [ ] U2: z-index 統一管理
- [ ] U3: 麵包屑 320px 不溢出
- [ ] U4: Agent bar 字體手機版 ≥ 12px
- [ ] U5: 有 `overscroll-behavior: contain`
- [ ] U6: Listing 縮圖手機版 80px
- [ ] U7: Footer 有 iOS safe area 處理
- [ ] U8: AssetMonitor 按鈕 ≥ 44px
- [ ] U9: Agent Bar 在 375px/320px 統計數據不擠壓（flex-wrap 換行）
- [ ] U10: Mock Lead A-6600 補齊 `conversation_id`，與 Live 模式結構一致
- [ ] U11: Monitor Table 手機版操作按鈕 ≥ 44px + 垂直排列 + 間距 ≥ 8px
- [ ] U12: Desktop ≥ 1280px 時 ActionPanel/AssetMonitor 並排、ListingFeed/TrustFlow 並排
- [ ] C1: LINE 色全站統一 CSS variable
- [ ] C2: Modal backdrop 統一
- [ ] C3: iOS viewport 使用 `dvh`
- [ ] typecheck + lint 通過

---

## #11 [P1] 詳情頁 Header 品牌統一

### 問題

**檔案：** `src/pages/PropertyDetailPage.tsx` L505-525

詳情頁 Header 完全獨立手刻，與首頁 `<Logo>` 組件不一致：

| 面向 | 首頁 Header (`Header.tsx`) | 詳情頁 Header (`PropertyDetailPage.tsx`) |
|------|--------------------------|----------------------------------------|
| **Logo 組件** | 統一 `<Logo>` 組件 | 手刻 `<Home>` icon + 文字 |
| **品牌色** | `brand-700`（design token） | 硬編碼 `#003366` / `#00A8E8` |
| **Icon 尺寸** | 42x42px、圓角 xl、shine 動畫 | 32x32px (size-8)、圓角 lg |
| **文字樣式** | `font-serif text-[24px]` + badge | `text-xl font-extrabold`，無 serif |
| **連結行為** | 點擊回首頁 `/maihouses/` | 無連結（純靜態文字） |
| **返回按鈕** | N/A | `<ArrowLeft>` 存在但**無 onClick** |
| **無障礙** | `aria-label` 完整 | 返回按鈕、Logo 均缺少 `aria-label` |

### 改動

#### 11-A. [P0] 統一使用 `<Logo>` 組件

| 檔案 | 改動 |
|------|------|
| `src/pages/PropertyDetailPage.tsx` L507-516 | 移除手刻 Logo，改用 `<Logo showSlogan={false} showBadge={true} href="/maihouses/" />` |

**改動前：**
```tsx
<div className="flex items-center gap-2 text-xl font-extrabold text-[#003366]">
  <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#003366] to-[#00A8E8] text-white">
    <Home size={18} />
  </div>
  邁房子
</div>
```

**改動後：**
```tsx
<Logo showSlogan={false} showBadge={true} href="/maihouses/" ariaLabel="回到邁房子首頁" />
```

#### 11-B. [P1] 返回按鈕加 onClick 功能

| 檔案 | 改動 |
|------|------|
| `src/pages/PropertyDetailPage.tsx` L508-510 | 加入 `onClick` 事件 + `aria-label` |

**改動前：**
```tsx
<button className="rounded-full p-2 transition-colors hover:bg-slate-100">
  <ArrowLeft size={20} className="text-slate-600" />
</button>
```

**改動後：**
```tsx
<button
  onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/maihouses/')}
  className="rounded-full p-2 transition-colors hover:bg-slate-100"
  aria-label="返回上一頁"
>
  <ArrowLeft size={20} className="text-slate-600" />
</button>
```

#### 11-C. [P1] 色彩改用 design token

| 檔案 | 位置 | 改動 |
|------|------|------|
| `PropertyDetailPage.tsx` L506 | Header border | `border-slate-100` → `border-brand-100` |
| `PropertyDetailPage.tsx` L523 | 物件編號文字 | `text-[#003366]` → `text-brand-700` |
| `PropertyDetailPage.tsx` L702 | 報告 FAB 漸層 | `from-[#003366] to-[#00A8E8]` → `from-brand-700 to-brand-600` |

#### 11-D. [P2] 無障礙補強

| 檔案 | 改動 |
|------|------|
| `PropertyDetailPage.tsx` L506 | `<nav>` 加 `aria-label="物件導覽"` |
| `PropertyDetailPage.tsx` L520 | 物件編號區塊加 `role="status"` |

#### 11-E. [P2] 手機版 Header 微調

| 項目 | 改動 |
|------|------|
| 物件編號 | 加 `hidden xs:flex`，極窄螢幕（<360px）隱藏避免擠壓 |
| 返回按鈕 touch target | `p-2` → `p-2.5`，確保 44x44px |

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/pages/PropertyDetailPage.tsx` | 修改 | Header 區塊重構（L505-525），移除 `Home` icon import |
| `src/components/Logo/Logo.tsx` | 不動 | 已有完整 props 支援，直接複用 |

### 驗收標準

- [ ] 詳情頁 Logo 與首頁視覺一致（42x42 icon、serif 字體、badge、hover shine 效果）
- [ ] 點擊 Logo 導向 `/maihouses/`
- [ ] 返回按鈕有 `onClick`，有瀏覽歷史回上頁，無歷史回首頁
- [ ] 無硬編碼 `#003366` / `#00A8E8`，全部使用 design token
- [ ] `aria-label` 完整（返回按鈕、Logo、nav、物件編號）
- [ ] 手機版 320px 無溢出
- [ ] typecheck + lint 通過

---

## #12 [P1] 信任分 Tooltip 修正 + Seed 指標校正

### 問題

**檔案：** `src/components/AgentTrustCard.tsx` L26-35, L173-192

信任分 Tooltip 的拆分數值是假的，與 DB Trigger 計算邏輯完全不一致：

| 面向 | 前端 Tooltip（假） | DB Trigger（真） |
|------|-------------------|-----------------|
| **計算方式** | 總分倒推 `score × 比例` | 基礎 60 + 三項加分 |
| **維度** | 實名認證 40% / 回覆速度 30% / 成交記錄 30% | 服務評價(+20) / 完成案件(+10) / 鼓勵數(+10) |
| **數值** | 假的（92 → 36+27+27=90，還丟失 2 分） | 真實計算 |

**DB 真實公式（`fn_calculate_trust_score`）：**
```
基礎分           60（平台實名認證即得）
+ 服務評價       service_rating × 4，最高 +20
+ 完成案件       completed_cases / 5，最高 +10
+ 客戶回饋       encouragement_count / 20，最高 +10
= 信任分         上限 100
```

**MH-100001 seed 問題（信任分 + 績效指標）：**

信任分 Tooltip 假拆分之外，經紀人績效指標區塊（`AgentTrustCard` L220-236）也有問題：

| 欄位 | DB seed 值 | 正式版顯示 | Mock 顯示 | 問題 |
|------|-----------|-----------|----------|------|
| `trust_score` | 硬編碼 92 | 92 | 92 | 未經 Trigger，不是真實計算值 |
| `service_rating` | NULL → DEFAULT 0 | **0.0** | 4.8 | 正式版顯示 0.0 |
| `review_count` | NULL → DEFAULT 0 | **(0)** | (32) | 正式版顯示 (0) |
| `completed_cases` | NULL → DEFAULT 0 | **0** | 45 | 正式版顯示 0 |
| `joined_at` | backfill = `created_at`（~2025-11-27） | **0年** | 4年 | 建立才 ~3 個月，`Math.floor(0.2)` = 0 |
| `encouragement_count` | 156 | 156 | 156 | 正常 |

Mock 版硬編碼在 `agentMetrics`（L76-83），不受 DB 影響，永遠正常。
正式版走 `profile?.xxx ?? agent.xxx ?? 0`，程式碼邏輯正確，問題全在 DB seed 資料缺失。

### 改動

#### 12-A. [P1] Tooltip 改為說明型（移除假拆分）

| 檔案 | 改動 |
|------|------|
| `src/components/AgentTrustCard.tsx` L26-35 | 移除 `getTrustBreakdown` 函數 |
| `src/components/AgentTrustCard.tsx` L73 | 移除 `trustBreakdown` 變數 |
| `src/components/AgentTrustCard.tsx` L8-10 | 移除 `Clock`、`CheckCircle`、`FileText` import（不再使用） |
| `src/components/AgentTrustCard.tsx` L174-192 | Tooltip 內容替換為說明型 |

**改動前（假拆分）：**
```tsx
const getTrustBreakdown = (score: number) => {
  const base = Math.floor(score * 0.4);
  const response = Math.floor(score * 0.3);
  const deals = Math.floor(score * 0.3);
  return [
    { label: '實名認證', value: base, icon: CheckCircle },
    { label: '回覆速度', value: response, icon: Clock },
    { label: '成交記錄', value: deals, icon: FileText },
  ];
};
```

**改動後（說明型 Tooltip）：**
```tsx
{showTrustTooltip && (
  <div className="absolute bottom-full left-0 z-10 mb-2 w-52 rounded-lg bg-slate-800 p-3 text-xs text-white shadow-xl">
    <div className="mb-1 font-bold">
      信任分數 <span className="text-green-400">{trustScore}</span> / 100
    </div>
    <p className="mb-2 text-slate-300">綜合以下指標自動計算：</p>
    <ul className="space-y-1 text-slate-300">
      <li className="flex items-center gap-1.5">
        <Shield size={10} className="shrink-0 text-green-400" />
        平台實名認證
      </li>
      <li className="flex items-center gap-1.5">
        <Star size={10} className="shrink-0 text-green-400" />
        歷史服務評價
      </li>
      <li className="flex items-center gap-1.5">
        <ThumbsUp size={10} className="shrink-0 text-green-400" />
        成交記錄與客戶回饋
      </li>
    </ul>
    <p className="mt-2 border-t border-slate-600 pt-2 text-[10px] text-slate-400">
      每筆交易完成後即時更新
    </p>
    <div className="absolute left-4 top-full border-8 border-transparent border-t-slate-800" />
  </div>
)}
```

**不需新增 import** — `Shield`、`Star`、`ThumbsUp` 已存在於 import 列表。

#### 12-B. [P0] MH-100001 seed 指標全量校正（正式版）

| 檔案 | 改動 |
|------|------|
| `supabase/migrations/YYYYMMDD_fix_agent_seed_metrics.sql` | **新增** — 為 seed agent 補齊所有指標欄位 |

```sql
UPDATE public.agents
SET
  service_rating = 4.8,          -- 正式版顯示 4.8（與 Mock 一致）
  review_count = 32,             -- 正式版顯示 (32)（與 Mock 一致）
  completed_cases = 45,          -- 正式版顯示 45（與 Mock 一致）
  encouragement_count = 156,     -- 維持不變（已有值）
  joined_at = NOW() - INTERVAL '4 years'  -- 正式版顯示 4年（與 Mock 一致）
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
-- Trigger 自動重算 trust_score = 60 + 19 + 9 + 7 = 95
```

校正後正式版 vs Mock 對照：

| 欄位 | 校正前（正式版） | 校正後（正式版） | Mock |
|------|---------------|---------------|------|
| serviceRating | 0.0 | **4.8** | 4.8 |
| reviewCount | (0) | **(32)** | (32) |
| completedCases | 0 | **45** | 45 |
| serviceYears | 0年 | **4年** | 4年 |
| trustScore | 92（硬編碼） | **95**（Trigger 算） | 92（prop 值） |
| encouragementCount | 156 | 156 | 156 |

Trigger `trg_agents_trust_score` 會在 UPDATE 時自動執行 `fn_calculate_trust_score`，重算 `trust_score`。

**前端零改動** — 程式碼邏輯完全正確（`profile?.xxx ?? agent.xxx ?? 0`），問題全在 DB seed 資料缺失。

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/components/AgentTrustCard.tsx` | 修改 | 移除假拆分函數 + Tooltip 改說明型 + 清理 import |
| `supabase/migrations/YYYYMMDD_fix_agent_seed_metrics.sql` | 新增 | seed agent 全量指標校正（觸發 Trigger 重算） |

### Mock 版影響

**無影響。** Mock 版績效指標硬編碼在 `agentMetrics`（L76-83），`isDemo=true` 時 `shouldFetchProfile=false`，不呼叫 API。Tooltip 顯示相同的說明文字，不涉及任何數值拆分。

### 驗收標準

- [ ] Tooltip 不再顯示假拆分數值
- [ ] Tooltip 顯示「信任分數 N / 100」+ 三項指標說明 + 更新頻率
- [ ] `getTrustBreakdown` 函數已移除
- [ ] `Clock`、`CheckCircle`、`FileText` import 已清理（確認無其他使用）
- [ ] 正式版績效指標顯示正確：4.8 / (32) / 45 / 4年
- [ ] MH-100001 的 `service_rating`、`review_count`、`completed_cases`、`joined_at` 已補齊
- [ ] Trigger 重算後 `trust_score` 為合理值（預期 95）
- [ ] Mock 頁行為不變（績效指標 + Tooltip 均不受影響）
- [ ] typecheck + lint 通過

---

## #13 [P0] 房仲評價系統（Assure Step 2 觸發 + 詳情頁查看）

### 需求

消費者在安心留痕（Assure）Step 2「帶看」確認後，可以對房仲給出 1-5 星評價 + 文字評語。評價寫入 DB 後自動計算平均分數，回寫 `agents.service_rating` 和 `agents.review_count`。在房源詳情頁 `AgentTrustCard` 中，`(32)` 評價數可點擊，彈出評價列表卡片查看所有評價。

### 現狀問題

| 位置 | 現狀 | 問題 |
|------|------|------|
| `AgentTrustCard.tsx` L220-227 | `4.8 服務評價 (32)` 是靜態 `<div>` | **不可點擊**，無法查看評價詳情 |
| `AgentTrustCard.tsx` L88-89 | `profile?.serviceRating ?? agent.serviceRating ?? 0` | DB 無寫入機制，正式版永遠 0 |
| `agents` 表 | `service_rating` / `review_count` 欄位 | **無任何寫入來源**，全是死數據 |
| `StepActions.tsx` L76-118 | 買方確認 `onConfirm(stepKey)` | 確認成功後**無評價提示** |
| 鼓勵數 `encouragement_count` | 硬編碼 156 | **無任何 +1 機制** |

### 設計方案

#### 核心邏輯：分數 = 所有星星的平均

```
service_rating = AVG(所有 agent_reviews 的 rating)
review_count   = COUNT(所有 agent_reviews)
```

- 買方 A 給 5 星、買方 B 給 4 星、買方 C 給 5 星
- `service_rating = (5+4+5)/3 = 4.7`
- `review_count = 3`

> **注意：** `encouragement_count`（獲得鼓勵）由 #14 獨立處理，來源是社區評價（兩好一公道）的按讚數，不等於 review_count。

#### 資料流向

```
[評價寫入]
Assure Step 2 確認成功
  → 0.5 秒後彈出 ReviewPromptModal
  → 買方填 1-5 星 + 評語（選填）
  → POST /api/agent/reviews
  → INSERT agent_reviews
  → Trigger 自動 AVG → UPDATE agents.service_rating, review_count
  → fn_calculate_trust_score Trigger 連帶更新 trust_score

[評價查看]
PropertyDetailPage → AgentTrustCard 點擊 (32)
  → AgentReviewListModal 開啟
  → GET /api/agent/reviews?agentId=xxx
  → 顯示評價列表 + 星級分佈

[Mock 模式]
isDemo=true → 硬編碼 4.8/(32) 不變
  → 點擊 (32) → 顯示 MOCK_REVIEWS（3 筆假資料）
```

### 13-A. [P0] DB Migration — `agent_reviews` 建表 + Trigger

| 檔案 | 操作 |
|------|------|
| `supabase/migrations/YYYYMMDD_agent_reviews.sql` | **新增** |

**表結構：**

```sql
CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  reviewer_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,  -- nullable = 匿名
  trust_case_id   UUID,                                               -- 關聯安心留痕案件（nullable）
  property_id     TEXT,                                                -- 關聯房源（nullable）
  rating          SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT CHECK (char_length(comment) <= 500),
  step_completed  SMALLINT NOT NULL DEFAULT 2,                        -- 觸發時的步驟
  is_public       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 防重複：同一 reviewer + agent + case 只能評一次
CREATE UNIQUE INDEX idx_agent_reviews_unique
  ON public.agent_reviews(agent_id, reviewer_id, trust_case_id)
  WHERE reviewer_id IS NOT NULL AND trust_case_id IS NOT NULL;

-- 查詢效能
CREATE INDEX idx_agent_reviews_agent_id ON public.agent_reviews(agent_id);
CREATE INDEX idx_agent_reviews_created_at ON public.agent_reviews(created_at DESC);
```

**RLS 策略：**

```sql
ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

-- SELECT: 公開評價任何人可看，非公開限本人
CREATE POLICY "agent_reviews_select" ON public.agent_reviews
  FOR SELECT USING (is_public = true OR reviewer_id = auth.uid());

-- INSERT: 登入者可新增，reviewer_id 必須是自己
CREATE POLICY "agent_reviews_insert" ON public.agent_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND reviewer_id = auth.uid());

-- UPDATE/DELETE: 限本人
CREATE POLICY "agent_reviews_update" ON public.agent_reviews
  FOR UPDATE USING (reviewer_id = auth.uid()) WITH CHECK (reviewer_id = auth.uid());

CREATE POLICY "agent_reviews_delete" ON public.agent_reviews
  FOR DELETE USING (reviewer_id = auth.uid());

-- anon 可讀公開評價（詳情頁未登入也能看）
GRANT SELECT ON public.agent_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_reviews TO authenticated;
```

**自動計算 Trigger：**

```sql
CREATE OR REPLACE FUNCTION public.fn_recalc_agent_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_avg DECIMAL(2,1);
  v_count INTEGER;
BEGIN
  -- 取得受影響的 agent_id
  v_agent_id := COALESCE(NEW.agent_id, OLD.agent_id);

  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.agent_reviews
  WHERE agent_id = v_agent_id;

  UPDATE public.agents
  SET
    service_rating = COALESCE(v_avg, 0),
    review_count = COALESCE(v_count, 0)
  WHERE id = v_agent_id;
  -- 這會觸發 trg_agents_trust_score 連帶更新 trust_score
  -- 注意：encouragement_count 由 #14（社區評價按讚）獨立管理，不在此 Trigger

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_agent_reviews_stats
  AFTER INSERT OR UPDATE OR DELETE ON public.agent_reviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_agent_review_stats();
```

### 13-B. [P0] API — `GET/POST /api/agent/reviews`

| 檔案 | 操作 |
|------|------|
| `api/agent/reviews.ts` | **新增** |

**GET — 取得評價列表：**

```
GET /api/agent/reviews?agentId=xxx&page=1&limit=10

回傳：
{
  success: true,
  data: {
    reviews: [
      { id, rating, comment, createdAt, reviewerName }
    ],
    total: 32,
    avgRating: 4.8,
    distribution: { 5: 24, 4: 6, 3: 2, 2: 0, 1: 0 }
  }
}
```

- 不需認證（anon 可讀公開評價）
- `reviewerName` 脫敏處理：`林` → `林***`
- 分頁：`page` + `limit`，預設 `page=1, limit=10`

**POST — 新增評價：**

```
POST /api/agent/reviews
Body: { agentId, rating, comment?, trustCaseId?, propertyId? }
需要認證（auth token）
```

- Zod 驗證：`rating` 1-5 整數、`comment` 最多 500 字
- 防重複：同 agent + reviewer + case 只能一次
- 成功回傳 `{ success: true, reviewId }`

### 13-C. [P0] 前端類型 — `src/types/agent-review.ts`

| 檔案 | 操作 |
|------|------|
| `src/types/agent-review.ts` | **新增** |

```typescript
import { z } from 'zod';

export const AgentReviewSchema = z.object({
  id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullable(),
  createdAt: z.string(),
  reviewerName: z.string(),
});

export type AgentReview = z.infer<typeof AgentReviewSchema>;

export const AgentReviewListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    reviews: z.array(AgentReviewSchema),
    total: z.number(),
    avgRating: z.number(),
    distribution: z.record(z.string(), z.number()),
  }),
});

export type AgentReviewListResponse = z.infer<typeof AgentReviewListResponseSchema>;

export const CreateReviewPayloadSchema = z.object({
  agentId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
  trustCaseId: z.string().uuid().optional(),
  propertyId: z.string().optional(),
});

export type CreateReviewPayload = z.infer<typeof CreateReviewPayloadSchema>;
```

### 13-D. [P0] 組件 — `ReviewPromptModal`（Step 2 確認後彈出）

| 檔案 | 操作 |
|------|------|
| `src/components/Assure/ReviewPromptModal.tsx` | **新增** |

**觸發時機：** 買方確認 Step 2（帶看）成功後，延遲 500ms 彈出。

**UI 設計：**
```
┌─────────────────────────────────┐
│ 覺得這次帶看服務如何？          │
│                                 │
│    ☆ ☆ ☆ ☆ ☆  (點擊選星)      │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 留下一句話給房仲（選填）    │ │
│ │ 最多 500 字                 │ │
│ └─────────────────────────────┘ │
│                                 │
│ [送出評價]        [稍後再說]    │
└─────────────────────────────────┘
```

**Props：**
```typescript
interface ReviewPromptModalProps {
  open: boolean;
  agentId: string;
  agentName: string;
  trustCaseId?: string;
  propertyId?: string;
  onClose: () => void;
  onSubmitted: () => void;  // 成功後回調（刷新資料）
}
```

**行為：**
- 星星必選（1-5），評語選填
- 「稍後再說」直接關閉，**不會再次提醒**
- 「送出評價」→ POST API → 成功 Toast → 關閉
- 防重複提交（`isBusy` 狀態）

### 13-E. [P0] 組件 — `AgentReviewListModal`（點擊 (32) 彈出）

| 檔案 | 操作 |
|------|------|
| `src/components/AgentReviewListModal.tsx` | **新增** |

**觸發方式：** `AgentTrustCard` 的 `(32)` 改為可點擊，開啟此 Modal。

**UI 設計：**
```
┌───────────────────────────────────────┐
│ ← 王小明 的服務評價                   │
│                                       │
│ ⭐ 4.8  (32 則評價)                   │
│ ────────────────────────────           │
│ ★★★★★  5顆星 ████████████ 24 (75%)   │
│ ★★★★☆  4顆星 ████         6 (19%)    │
│ ★★★☆☆  3顆星 █            2 (6%)     │
│ ★★☆☆☆  2顆星              0 (0%)     │
│ ★☆☆☆☆  1顆星              0 (0%)     │
│ ────────────────────────────           │
│                                       │
│ 林*** ★★★★★  2026/01/15              │
│ 帶看很認真，解說詳細，推薦！          │
│                                       │
│ 王*** ★★★★★  2026/01/10              │
│ 回覆很快，態度親切                    │
│                                       │
│ [載入更多...]                          │
└───────────────────────────────────────┘
```

**Props：**
```typescript
interface AgentReviewListModalProps {
  open: boolean;
  agentId: string;
  agentName: string;
  onClose: () => void;
}
```

**行為：**
- 開啟時 GET `/api/agent/reviews?agentId=xxx&page=1`
- 星級分佈長條圖（純 CSS，不需第三方 chart 庫）
- 分頁「載入更多」按鈕
- reviewCount = 0 時顯示「尚無評價」空狀態
- Mock 模式顯示 3 筆假資料

### 13-F. [P0] 修改 — `AgentTrustCard` (32) 改可點擊

| 檔案 | 改動 |
|------|------|
| `src/components/AgentTrustCard.tsx` L18-23 | 新增 `onReviewClick?: () => void` prop |
| `src/components/AgentTrustCard.tsx` L220-227 | 服務評價 `<div>` 改為 `<button>` |

**改動前（靜態 div）：**
```tsx
<div className="text-center">
  <div className="text-lg font-bold text-brand-700">
    {agentMetrics.serviceRating.toFixed(1)}
  </div>
  <div className="text-[10px] text-text-muted">服務評價</div>
  <div className="text-[10px] text-text-muted">({agentMetrics.reviewCount})</div>
</div>
```

**改動後（可點擊 button）：**
```tsx
<button
  onClick={onReviewClick}
  className="cursor-pointer rounded-lg p-1 text-center transition-colors hover:bg-bg-base"
  aria-label={`查看 ${agentMetrics.reviewCount} 則服務評價`}
>
  <div className="text-lg font-bold text-brand-700">
    {agentMetrics.serviceRating.toFixed(1)}
  </div>
  <div className="text-[10px] text-text-muted">服務評價</div>
  <div className="text-[10px] text-brand-600 underline decoration-dotted underline-offset-2">
    ({agentMetrics.reviewCount})
  </div>
</button>
```

`(32)` 加虛線底線暗示可點擊，`brand-600` 色增強互動感。

### 13-G. [P0] 修改 — `PropertyDetailPage` 整合

| 檔案 | 改動 |
|------|------|
| `src/pages/PropertyDetailPage.tsx` | 新增 `reviewListOpen` state + `handleReviewClick` callback + `<AgentReviewListModal>` 渲染 |

```typescript
const [reviewListOpen, setReviewListOpen] = useState(false);

const handleReviewClick = useCallback(() => {
  setReviewListOpen(true);
}, []);

// AgentTrustCard 傳入：
<AgentTrustCard
  agent={property.agent}
  onLineClick={handleAgentLineClick}
  onCallClick={handleAgentCallClick}
  onReviewClick={handleReviewClick}   // ← 新增
/>

// 渲染 Modal：
<AgentReviewListModal
  open={reviewListOpen}
  agentId={property.agent.id}
  agentName={property.agent.name}
  onClose={() => setReviewListOpen(false)}
/>
```

### 13-H. [P1] 修改 — Assure Step 2 觸發 ReviewPromptModal

| 檔案 | 改動 |
|------|------|
| `src/components/Assure/StepActions.tsx` | `BuyerActions.onConfirm('2')` 成功後觸發 callback |
| 整合層（TrustRoom 或 Assure 父組件） | 監聽 Step 2 確認成功 → 延遲 500ms 開啟 ReviewPromptModal |

**觸發邏輯：**
```
BuyerActions 點擊「確認送出」(Step 2)
  → dispatchAction('confirm', {step:'2'})
  → 成功 → Toast「確認成功！」
  → 500ms 後 → setShowReviewPrompt(true)
  → ReviewPromptModal 彈出
  → 買方填星 + 評語 → POST API → 關閉
```

**不打擾原則：**
- 「稍後再說」關閉後不再提醒
- 只在 Step 2 確認當下觸發一次
- 不阻擋後續步驟操作

### 13-I. [P1] Hook — `src/hooks/useAgentReviews.ts`

| 檔案 | 操作 |
|------|------|
| `src/hooks/useAgentReviews.ts` | **新增** |

```typescript
// 查詢評價列表
export function useAgentReviewList(agentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['agent-reviews', agentId],
    queryFn: () => fetchAgentReviews(agentId),
    enabled: enabled && Boolean(agentId),
    staleTime: 2 * 60 * 1000,
  });
}

// 提交評價
export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewPayload) => postAgentReview(payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agent-reviews', variables.agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent-profile', variables.agentId] });
    },
  });
}
```

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| DB | `supabase/migrations/YYYYMMDD_agent_reviews.sql` | **新增** | 建表 + RLS + Trigger |
| API | `api/agent/reviews.ts` | **新增** | GET 列表 + POST 新增 |
| Type | `src/types/agent-review.ts` | **新增** | Zod schema + 型別 |
| 組件 | `src/components/Assure/ReviewPromptModal.tsx` | **新增** | Step 2 後評價彈窗 |
| 組件 | `src/components/AgentReviewListModal.tsx` | **新增** | 評價列表卡片 |
| Hook | `src/hooks/useAgentReviews.ts` | **新增** | useQuery + useMutation |
| 修改 | `src/components/AgentTrustCard.tsx` | 修改 | 新增 `onReviewClick` prop，(32) 改可點擊 |
| 修改 | `src/pages/PropertyDetailPage.tsx` | 修改 | 整合 AgentReviewListModal |
| 修改 | Assure 整合層 | 修改 | Step 2 確認後觸發 ReviewPromptModal |

### Mock 模式處理

- `AgentTrustCard` `isDemo=true`：績效指標仍硬編碼 4.8/(32)
- `AgentReviewListModal` `isDemo=true`：顯示 3 筆 MOCK_REVIEWS 假資料
- `ReviewPromptModal`：Mock 模式下 POST 不發，直接 notify + 關閉

### 驗收標準

- [ ] DB：`agent_reviews` 表已建立，RLS 已啟用
- [ ] DB：INSERT 一筆評價後 `agents.service_rating` 和 `review_count` 自動更新
- [ ] DB：同 agent + reviewer + case 防重複
- [ ] API：`GET /api/agent/reviews?agentId=xxx` 回傳評價列表 + 星級分佈
- [ ] API：`POST /api/agent/reviews` 新增評價，Zod 驗證 rating 1-5
- [ ] 前端：`AgentTrustCard` 的 `(32)` 可點擊，有 hover 效果 + 虛線底線
- [ ] 前端：點擊 (32) 開啟 `AgentReviewListModal`，顯示星級分佈長條圖 + 評價列表
- [ ] 前端：Assure Step 2 確認成功後 500ms 彈出 `ReviewPromptModal`
- [ ] 前端：ReviewPromptModal 可選 1-5 星 + 評語（選填）+ 送出/稍後再說
- [ ] 前端：Mock 模式 AgentReviewListModal 顯示假資料
- [ ] typecheck + lint 通過

---

## #14 [P1] 獲得鼓勵系統 — 社區評價（兩好一公道）按讚 → agents.encouragement_count

### 背景分析

**現狀：** `agents.encouragement_count = 156` 是 seed 硬編碼值，系統中不存在任何 +1 機制。

**需求路徑（用戶確認）：**
```
房仲上傳物件時填寫「兩好一公道」（advantage_1 / advantage_2 / disadvantage）
  → 存入 properties 表
  → community_reviews VIEW 投影出來，顯示在社區牆
  → 消費者覺得「兩好一公道」實用 → 按讚 👍
  → 讚數累積 → 加總回 agents.encouragement_count
  → 連帶觸發 fn_calculate_trust_score 更新信任分
```

**關鍵發現：**
- `community_reviews` 是 **VIEW**（非 Table），投影自 `properties` 表（`20241201_community_wall.sql` L215-231）
- View 無法直接加 `liked_by` 欄位，不可改為 Table（會破壞 `fn_create_property_with_review` RPC）
- 現有 `community_posts.liked_by` + `toggle_like` 只影響社區貼文，與房仲評價完全無關

**方案選擇：** Method B — 新建 `community_review_likes` 表，平行於既有 `community_posts` 按讚系統，不動 View 結構。

### 14-A. [P1] DB Migration — `community_review_likes` 建表 + Trigger

| 檔案 | 操作 |
|------|------|
| `supabase/migrations/YYYYMMDD_community_review_likes.sql` | **新增** |

**表結構：**

```sql
-- ========================================================
-- #14: 社區評價（兩好一公道）按讚系統
-- 用途：消費者對社區牆上的「兩好一公道」評價按讚
-- 讚數加總 → agents.encouragement_count
-- ========================================================

CREATE TABLE IF NOT EXISTS public.community_review_likes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id     TEXT NOT NULL,                            -- 對應 properties.id（即 community_reviews 的 id）
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 防重複：同一 user 對同一 property 只能讚一次
CREATE UNIQUE INDEX idx_community_review_likes_unique
  ON public.community_review_likes(property_id, user_id);

-- 查詢效能：按 property 查讚數
CREATE INDEX idx_community_review_likes_property
  ON public.community_review_likes(property_id);

-- 查詢效能：按 user 查自己讚過哪些
CREATE INDEX idx_community_review_likes_user
  ON public.community_review_likes(user_id);
```

**RLS 策略：**

```sql
ALTER TABLE public.community_review_likes ENABLE ROW LEVEL SECURITY;

-- SELECT: 任何人可看讚數（含 anon，因為詳情頁未登入也要顯示鼓勵數）
CREATE POLICY "community_review_likes_select" ON public.community_review_likes
  FOR SELECT USING (true);

-- INSERT: 登入者可按讚，user_id 必須是自己
CREATE POLICY "community_review_likes_insert" ON public.community_review_likes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- DELETE: 限本人取消讚
CREATE POLICY "community_review_likes_delete" ON public.community_review_likes
  FOR DELETE USING (user_id = auth.uid());

-- 權限
GRANT SELECT ON public.community_review_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_review_likes TO authenticated;
```

**Trigger — 自動加總讚數到 agents.encouragement_count：**

```sql
CREATE OR REPLACE FUNCTION public.fn_recalc_encouragement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id TEXT;
  v_agent_id UUID;
  v_total_likes INTEGER;
BEGIN
  -- 取得受影響的 property_id
  v_property_id := COALESCE(NEW.property_id, OLD.property_id);

  -- 透過 properties 表找到 agent_id
  SELECT agent_id INTO v_agent_id
  FROM public.properties
  WHERE id = v_property_id;

  IF v_agent_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- 計算該 agent 所有物件評價的讚數總和
  SELECT COUNT(*) INTO v_total_likes
  FROM public.community_review_likes crl
  INNER JOIN public.properties p ON crl.property_id = p.id
  WHERE p.agent_id = v_agent_id;

  UPDATE public.agents
  SET encouragement_count = COALESCE(v_total_likes, 0)
  WHERE id = v_agent_id;
  -- 連帶觸發 trg_agents_trust_score 更新 trust_score

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_community_review_likes_encouragement
  AFTER INSERT OR DELETE ON public.community_review_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_encouragement_count();
```

### 14-B. [P1] API — `POST /api/community/review-like`

| 檔案 | 操作 |
|------|------|
| `api/community/review-like.ts` | **新增** |

**POST — 按讚/取消讚（toggle）：**

```
POST /api/community/review-like
Body: { propertyId: string }
需要認證（auth token）

回傳：
{
  success: true,
  liked: true | false,        // true=已按讚, false=已取消
  totalLikes: 5               // 該評價目前總讚數
}
```

- Zod 驗證：`propertyId` 必須為非空字串
- Toggle 邏輯：已讚 → DELETE，未讚 → INSERT
- 回傳 `liked` 狀態 + `totalLikes` 讓前端即時更新
- 驗證 `propertyId` 對應的 property 確實存在且有兩好一公道內容

**GET — 查詢某評價的讚數 + 當前用戶是否已讚：**

```
GET /api/community/review-like?propertyId=xxx

回傳：
{
  success: true,
  liked: false,                // 未登入固定 false
  totalLikes: 5
}
```

- anon 可查（未登入 `liked` 固定 `false`）

### 14-C. [P0] 前端類型 — `src/types/community-review-like.ts`

| 檔案 | 操作 |
|------|------|
| `src/types/community-review-like.ts` | **新增** |

```typescript
import { z } from 'zod';

export const ReviewLikeResponseSchema = z.object({
  success: z.literal(true),
  liked: z.boolean(),
  totalLikes: z.number().int().min(0),
});

export type ReviewLikeResponse = z.infer<typeof ReviewLikeResponseSchema>;

export const ToggleReviewLikePayloadSchema = z.object({
  propertyId: z.string().min(1),
});

export type ToggleReviewLikePayload = z.infer<typeof ToggleReviewLikePayloadSchema>;
```

### 14-D. [P1] 前端組件 — 社區牆評價按讚 UI

| 檔案 | 改動 |
|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 修改：每筆評價卡片加 👍 按讚按鈕 |

**改動位置：** `CommunityReviews.tsx` 評價卡片 `publicReviews.map(...)` 迴圈內

**改動前：**
```tsx
<p className="text-sm leading-relaxed text-ink-600">{review.content}</p>
```

**改動後：**
```tsx
<p className="text-sm leading-relaxed text-ink-600">{review.content}</p>
<div className="mt-2 flex items-center gap-1">
  <button
    onClick={() => onToggleLike?.(review.propertyId)}
    disabled={!isLoggedIn || likeBusy}
    aria-label={`鼓勵這則評價${review.liked ? '（已鼓勵）' : ''}`}
    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
      review.liked
        ? 'bg-brand-50 text-brand-700 font-medium'
        : 'bg-bg-base text-text-muted hover:bg-brand-50 hover:text-brand-600'
    } ${!isLoggedIn ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
  >
    <ThumbsUp size={12} />
    <span>{review.totalLikes > 0 ? review.totalLikes : '實用'}</span>
  </button>
</div>
```

> **注意：** `ThumbsUp` 需從 `lucide-react` 新增 import。

**新增 Props：**
```typescript
interface CommunityReviewsProps {
  isLoggedIn: boolean;
  communityId?: string;
  isDemo?: boolean;
  onToggleLike?: (propertyId: string) => void;  // 新增
}

interface ReviewPreview {
  // ... 既有欄位
  propertyId: string;   // 新增：用於按讚 API
  liked: boolean;       // 新增：當前用戶是否已讚
  totalLikes: number;   // 新增：該評價總讚數
}
```

### 14-E. [P1] Hook — `src/hooks/useCommunityReviewLike.ts`

| 檔案 | 操作 |
|------|------|
| `src/hooks/useCommunityReviewLike.ts` | **新增** |

```typescript
export function useCommunityReviewLike() {
  const queryClient = useQueryClient();

  const toggleLike = useMutation({
    mutationFn: (propertyId: string) =>
      fetch('/api/community/review-like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId }),
      }).then(res => res.json()),
    onSuccess: () => {
      // 刷新 agent-profile 讓 encouragement_count 更新
      queryClient.invalidateQueries({ queryKey: ['agent-profile'] });
    },
  });

  return { toggleLike };
}
```

### 14-F. [P1] 修改 — `PropertyDetailPage` 整合

| 檔案 | 改動 |
|------|------|
| `src/pages/PropertyDetailPage.tsx` | 引入 `useCommunityReviewLike`，傳入 `CommunityReviews` |

```typescript
const { toggleLike } = useCommunityReviewLike();

<CommunityReviews
  isLoggedIn={isLoggedIn}
  communityId={property.communityId}
  isDemo={isDemo}
  onToggleLike={(propertyId) => toggleLike.mutate(propertyId)}  // 新增
/>
```

成功按讚後 `agent-profile` query 自動 invalidate → `AgentTrustCard` 的 `encouragementCount` 即時更新。

### 14-G. [P1] 資料流圖

```
消費者在 PropertyDetailPage 看到 CommunityReviews 區塊
  ├─ 每筆「兩好一公道」評價旁有 👍 按鈕
  │
  └─ 點擊 👍
      ├─ 未登入 → 按鈕 disabled，灰色 + 提示「登入後可鼓勵」
      │
      └─ 已登入 → POST /api/community/review-like { propertyId }
          ├─ 已讚 → DELETE → liked: false
          └─ 未讚 → INSERT → liked: true
              │
              └─ DB Trigger: fn_recalc_encouragement_count()
                  │
                  ├─ 找到 property → agent_id
                  ├─ SUM 該 agent 所有物件的讚數
                  └─ UPDATE agents SET encouragement_count = SUM
                      │
                      └─ 觸發 trg_agents_trust_score → 更新 trust_score
                          │
                          └─ 前端 invalidateQueries('agent-profile')
                              └─ AgentTrustCard 的「獲得鼓勵」數字即時更新
```

### Mock 模式處理

> **原則（用戶要求）：Mock 頁跟 API 效果必須一模一樣。**

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| `CommunityReviews` 按讚按鈕 | 顯示，可點擊，**樂觀更新**讚數（+1 / -1），不發 API | 顯示，可點擊，發 API + 樂觀更新 |
| `AgentTrustCard` 獲得鼓勵 | 顯示 156（seed 硬編碼），按讚後 +1（本地 state） | 從 `profile.encouragementCount` 讀取，API invalidate 自動更新 |
| 👍 `liked` 狀態 | 本地 `useState` 管理 toggle | API 回傳 `liked` 狀態 |
| 未登入時 | 按鈕 disabled + tooltip「登入後可鼓勵」 | 同左 |

**Mock 模式具體實作：**
```typescript
// CommunityReviews 內部
const handleToggleLike = useCallback((propertyId: string) => {
  if (isDemo) {
    // Mock: 本地 toggle，不發 API
    setReviewPreviews(prev => prev.map(r =>
      r.propertyId === propertyId
        ? { ...r, liked: !r.liked, totalLikes: r.liked ? r.totalLikes - 1 : r.totalLikes + 1 }
        : r
    ));
    return;
  }
  onToggleLike?.(propertyId);
}, [isDemo, onToggleLike]);
```

**Mock 假資料更新（MOCK_REVIEWS）：**
```typescript
const MOCK_REVIEWS: ReviewPreview[] = [
  {
    // ... 既有欄位
    propertyId: 'MH-100001',
    liked: false,
    totalLikes: 3,
  },
  {
    // ...
    propertyId: 'MH-100002',
    liked: true,   // 預設已讚一筆，展示兩種狀態
    totalLikes: 7,
  },
  // ...
];
```

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| DB | `supabase/migrations/YYYYMMDD_community_review_likes.sql` | **新增** | 建表 + RLS + Trigger |
| API | `api/community/review-like.ts` | **新增** | POST toggle + GET 查詢 |
| Type | `src/types/community-review-like.ts` | **新增** | Zod schema + 型別 |
| Hook | `src/hooks/useCommunityReviewLike.ts` | **新增** | useMutation toggle |
| 修改 | `src/components/PropertyDetail/CommunityReviews.tsx` | 修改 | 評價卡片加 👍 按鈕 + Mock toggle |
| 修改 | `src/pages/PropertyDetailPage.tsx` | 修改 | 整合 useCommunityReviewLike |

### 驗收標準

- [ ] DB：`community_review_likes` 表已建立，RLS 已啟用
- [ ] DB：INSERT 一筆讚後 `agents.encouragement_count` 自動更新（Trigger 正確）
- [ ] DB：同 user + property 防重複（UNIQUE INDEX）
- [ ] DB：DELETE 讚後 `encouragement_count` 正確遞減
- [ ] API：`POST /api/community/review-like` toggle 讚/取消讚，回傳 `liked` + `totalLikes`
- [ ] API：`GET /api/community/review-like?propertyId=xxx` 回傳讚數 + 用戶狀態
- [ ] API：Zod 驗證 propertyId 非空
- [ ] 前端：`CommunityReviews` 每筆評價旁有 👍 按鈕，hover 有變色效果
- [ ] 前端：已按讚狀態顯示 `bg-brand-50 text-brand-700`，未讚顯示灰色
- [ ] 前端：按讚後 `AgentTrustCard` 的「獲得鼓勵」數字即時更新
- [ ] 前端：未登入時 👍 按鈕 disabled，帶 tooltip 提示
- [ ] Mock：按讚可 toggle，本地 state 管理，視覺效果與正式版完全一致
- [ ] Mock：`MOCK_REVIEWS` 含 `propertyId` / `liked` / `totalLikes` 欄位
- [ ] typecheck + lint 通過

---

## #15 [P0] 經紀人認證系統 + 完成案件自動累積

### 背景分析

**問題一：「已認證」標記是信任造假**

`AgentTrustCard.tsx:143-146` 對所有房仲**無條件 hardcode 顯示**「已認證」。DB `agents` 表沒有任何認證相關欄位（`is_verified` / `license_number` / `verified_at`）。在安心留痕產品語境下，這是嚴重的信任誤導。

`MobileActionBar.tsx:44-47` 同樣 hardcode 顯示「認證經紀人」。

**問題二：經紀人編號是無意義的流水號**

`agents.internal_code SERIAL` 是 PostgreSQL 自動遞增值（1, 2, 3...），不等於台灣合法經紀人證照字號。顯示 `經紀人編號：#1` 對消費者毫無意義。

**問題三：完成案件永遠為 0**

`agents.completed_cases INTEGER DEFAULT 0`，`api/trust/close.ts` 結案時**完全沒有** +1 的邏輯。Mock 硬編碼 `45`，但正式版永遠是 `0`，且 `fn_calculate_trust_score` 信任分公式有 `completed_cases / 5`（max +10），所以信任分也偏低。

### 15-A. [P0] DB Migration — 認證欄位 + 完成案件 Trigger

| 檔案 | 操作 |
|------|------|
| `supabase/migrations/YYYYMMDD_agent_verification_and_cases.sql` | **新增** |

**新增欄位：**

```sql
-- ========================================================
-- #15: 經紀人認證系統 + 完成案件自動累積
-- ========================================================

-- 1) 認證欄位
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS license_number TEXT;     -- 經紀人證照字號
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;  -- 是否已認證
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;            -- 認證通過時間

-- 2) 索引
CREATE INDEX IF NOT EXISTS idx_agents_is_verified ON public.agents(is_verified) WHERE is_verified = true;

-- 3) Seed 更新（Demo 房仲設為已認證）
UPDATE public.agents
SET
  license_number = '(113)北市經紀字第004521號',
  is_verified = true,
  verified_at = '2024-06-15T00:00:00Z'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
```

**完成案件自動累積 Trigger：**

```sql
-- 結案 Trigger：trust_cases.status → 'closed' 時自動 +1 agents.completed_cases
CREATE OR REPLACE FUNCTION public.fn_increment_completed_cases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 只在狀態變為 'closed' 時觸發（防止重複計算）
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed') THEN
    UPDATE public.agents
    SET completed_cases = COALESCE(completed_cases, 0) + 1
    WHERE id = NEW.agent_id;
    -- 連帶觸發 trg_agents_trust_score 更新信任分
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_trust_cases_completed
  AFTER UPDATE ON public.trust_cases
  FOR EACH ROW EXECUTE FUNCTION public.fn_increment_completed_cases();
```

### 15-B. [P0] 前端類型更新

| 檔案 | 改動 |
|------|------|
| `src/lib/types.ts` | `Agent` interface 新增 `licenseNumber?` / `isVerified?` |
| `src/types/agent.types.ts` | `AgentProfile` interface 新增 `licenseNumber?` / `isVerified?` / `verifiedAt?` |

```typescript
// src/lib/types.ts Agent interface 新增：
licenseNumber?: string | null;
isVerified?: boolean;

// src/types/agent.types.ts AgentProfile interface 新增：
licenseNumber?: string | null;
isVerified?: boolean;
verifiedAt?: string | null;
```

### 15-C. [P0] API 更新

| 檔案 | 改動 |
|------|------|
| `api/agent/profile.ts` | `AgentRowSchema` + `buildProfilePayload` 加入 `license_number` / `is_verified` / `verified_at` |
| `api/agent/profile.ts` | `UpdateProfileSchema` 加入 `license_number` |
| `api/agent/me.ts` | 同步加入認證欄位到 response |
| `src/services/agentService.ts` | `AgentProfileApiSchema` + `mapAgentProfile` 加入欄位映射 |
| `src/services/propertyService.ts` | `agent` 建構加入 `licenseNumber` / `isVerified` |

**GET response 新增欄位：**
```json
{
  "license_number": "(113)北市經紀字第004521號",
  "is_verified": true,
  "verified_at": "2024-06-15T00:00:00Z"
}
```

**PUT 可更新 `license_number`（房仲自填，後台審核另做）：**
```typescript
// UpdateProfileSchema 新增：
license_number: z.union([z.string().trim().min(5).max(100), z.null()]).optional(),
```

### 15-D. [P0] 前端 — `AgentTrustCard` 條件式認證顯示

| 檔案 | 改動 |
|------|------|
| `src/components/AgentTrustCard.tsx` L141-147 | 條件式顯示「已認證」/ 「未認證」|
| `src/components/AgentTrustCard.tsx` L142 | 經紀人編號改為證照字號 / 平台編號 |

**改動前（L141-147）：**
```tsx
<div className="mt-0.5 flex items-center gap-2">
  <p className="text-xs text-text-muted">經紀人編號：#{agent.internalCode}</p>
  <div className="flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
    <Shield size={10} />
    <span>已認證</span>
  </div>
</div>
```

**改動後：**
```tsx
<div className="mt-0.5 flex items-center gap-2">
  {licenseNumber ? (
    <p className="text-xs text-text-muted">經紀人證照：{licenseNumber}</p>
  ) : (
    <p className="text-xs text-text-muted">
      平台編號：MH-{String(agent.internalCode).padStart(5, '0')}
    </p>
  )}
  {isVerified ? (
    <div className="flex items-center gap-0.5 rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
      <Shield size={10} />
      <span>已認證</span>
    </div>
  ) : (
    <div className="flex items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-text-muted">
      <span>未認證</span>
    </div>
  )}
</div>
```

**變數來源：**
```tsx
const licenseNumber = profile?.licenseNumber ?? agent.licenseNumber ?? null;
const isVerified = profile?.isVerified ?? agent.isVerified ?? false;
```

### 15-E. [P0] 前端 — `MobileActionBar` 條件式認證顯示

| 檔案 | 改動 |
|------|------|
| `src/components/PropertyDetail/MobileActionBar.tsx` L5, L43-47 | 新增 `isVerified` prop，條件式顯示 |

**改動前（L43-47）：**
```tsx
<span className="flex items-center gap-1">
  <Shield size={10} className="text-green-500" />
  認證經紀人
</span>
```

**改動後：**
```tsx
{isVerified && (
  <span className="flex items-center gap-1">
    <Shield size={10} className="text-green-500" />
    認證經紀人
  </span>
)}
```

**Props 新增：**
```typescript
interface MobileActionBarProps {
  // ... 既有
  isVerified?: boolean;  // 新增
}
```

**PropertyDetailPage 傳入：**
```tsx
<MobileActionBar
  onLineClick={handleAgentLineClick}
  onCallClick={handleAgentCallClick}
  socialProof={socialProof}
  isVerified={property.agent.isVerified}   // 新增
/>
```

### 15-F. [P1] UAG Profile — 新增「證照字號」輸入欄

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/Profile/BasicInfoSection.tsx` | 新增 `licenseNumber` state + 輸入欄 |
| `src/types/agent.types.ts` | `UpdateAgentProfilePayload` 新增 `licenseNumber?` |
| `src/services/agentService.ts` | `updateAgentProfile` body 加入 `license_number` |

**BasicInfoSection 新增輸入欄（在「加入日期」下方）：**
```tsx
<div className="space-y-2">
  <label htmlFor="agent-license" className="text-sm font-medium text-slate-700">
    經紀人證照字號
  </label>
  <input
    id="agent-license"
    type="text"
    value={licenseNumber}
    onChange={(event) => setLicenseNumber(event.target.value)}
    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
    placeholder="例：(113)北市經紀字第004521號"
    aria-label="經紀人證照字號"
  />
  <p className="text-[10px] text-slate-400">
    填寫後將顯示「已認證」標記
  </p>
</div>
```

### Mock 模式處理

> **原則：Mock 維持現況，不做改動。**

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| `AgentTrustCard` 已認證 | 繼續 hardcode 顯示（`isDemo=true` 時跳過條件判斷） | 條件式 `isVerified` 判斷 |
| `AgentTrustCard` 經紀人編號 | 繼續顯示 `#0`（Mock seed） | 有證照顯示字號，無證照顯示 `MH-00001` |
| `MobileActionBar` 認證經紀人 | 繼續顯示（Mock `isVerified` 默認 `true`） | 條件式判斷 |
| `completed_cases` | 硬編碼 `45` | DB Trigger 自動累積 |
| UAG Profile 證照欄 | Mock 模式顯示假值 | 正式版可編輯 |

**Mock 判斷邏輯（AgentTrustCard）：**
```tsx
// isDemo 時沿用舊邏輯，正式版才走條件式
const isVerified = isDemo ? true : (profile?.isVerified ?? agent.isVerified ?? false);
const licenseNumber = isDemo ? null : (profile?.licenseNumber ?? agent.licenseNumber ?? null);
```

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| DB | `supabase/migrations/YYYYMMDD_agent_verification_and_cases.sql` | **新增** | 認證欄位 + 結案 Trigger |
| Type | `src/lib/types.ts` | 修改 | `Agent` 加 `licenseNumber` / `isVerified` |
| Type | `src/types/agent.types.ts` | 修改 | `AgentProfile` + `UpdateAgentProfilePayload` 加欄位 |
| API | `api/agent/profile.ts` | 修改 | Schema + response + PUT 加 `license_number` |
| API | `api/agent/me.ts` | 修改 | response 加 `license_number` / `is_verified` |
| Service | `src/services/agentService.ts` | 修改 | schema + mapAgentProfile 加欄位 |
| Service | `src/services/propertyService.ts` | 修改 | agent 建構加欄位 |
| 組件 | `src/components/AgentTrustCard.tsx` | 修改 | 條件式認證 + 證照字號 |
| 組件 | `src/components/PropertyDetail/MobileActionBar.tsx` | 修改 | 條件式「認證經紀人」+ 新 prop |
| 頁面 | `src/pages/PropertyDetailPage.tsx` | 修改 | 傳入 `isVerified` 到 MobileActionBar |
| 頁面 | `src/pages/UAG/Profile/BasicInfoSection.tsx` | 修改 | 新增證照字號輸入欄 |

### 驗收標準

- [ ] DB：`agents` 表有 `license_number` / `is_verified` / `verified_at` 欄位
- [ ] DB：Demo 房仲 seed 已設為 `is_verified = true`
- [ ] DB：`trust_cases` 結案時 `agents.completed_cases` 自動 +1（Trigger 正確）
- [ ] DB：重複結案（已是 closed 再 UPDATE）不會重複 +1
- [ ] DB：`completed_cases` +1 後 `trust_score` 連帶更新
- [ ] API：GET `/api/agent/profile` 回傳 `license_number` / `is_verified` / `verified_at`
- [ ] API：PUT `/api/agent/profile` 可更新 `license_number`
- [ ] 前端：有 `license_number` 時顯示「經紀人證照：(113)北市經紀字第004521號」
- [ ] 前端：無 `license_number` 時顯示「平台編號：MH-00001」
- [ ] 前端：`is_verified = true` → 綠色「已認證」badge
- [ ] 前端：`is_verified = false` → 灰色「未認證」badge
- [ ] 手機版：`MobileActionBar` 僅 `isVerified = true` 時顯示「認證經紀人」
- [ ] Mock：`isDemo=true` 時維持現有行為（hardcode 顯示已認證）
- [ ] UAG Profile：有「經紀人證照字號」輸入欄，提交後存入 DB
- [ ] typecheck + lint 通過

---

## #16 [P1] 店名開放編輯

### 背景分析

`BasicInfoSection.tsx:108-115` 的「公司」欄位是 **disabled**，房仲無法修改自己的公司/分店名。`UpdateProfileSchema`（`api/agent/profile.ts:23-33`）也沒有 `company` 欄位，API 端也不支援更新。

### 16-A. [P1] API — `UpdateProfileSchema` 加入 `company`

| 檔案 | 改動 |
|------|------|
| `api/agent/profile.ts` L23-33 | `UpdateProfileSchema` 加入 `company` |

```typescript
// UpdateProfileSchema 新增：
company: z.string().trim().min(1).max(100).optional(),
```

### 16-B. [P1] 前端 — `BasicInfoSection` 開放編輯

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/Profile/BasicInfoSection.tsx` L41-47 | 新增 `company` state |
| `src/pages/UAG/Profile/BasicInfoSection.tsx` L108-115 | 移除 `disabled`，加入 `onChange` |
| `src/pages/UAG/Profile/BasicInfoSection.tsx` L49-62 | payload 加入 `company` |

**改動前（L108-115）：**
```tsx
<input
  id="agent-company"
  type="text"
  value={profile.company ?? '邁房子'}
  disabled
  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500"
/>
```

**改動後：**
```tsx
<input
  id="agent-company"
  type="text"
  value={company}
  onChange={(event) => setCompany(event.target.value)}
  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
  placeholder="公司/分店名稱"
  aria-label="公司名稱"
/>
```

### 16-C. [P1] 前端 — 類型 + Service 更新

| 檔案 | 改動 |
|------|------|
| `src/types/agent.types.ts` | `UpdateAgentProfilePayload` 新增 `company?` |
| `src/services/agentService.ts` L175-183 | `updateAgentProfile` body 加入 `company` |

```typescript
// UpdateAgentProfilePayload 新增：
company?: string | null;

// agentService.ts body 新增：
company: payload.company,
```

### Mock 模式處理

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| 公司欄位 | Mock 模式可編輯（本地 state），不發 API | 正式版可編輯，PUT API 更新 DB |

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| API | `api/agent/profile.ts` | 修改 | `UpdateProfileSchema` 加 `company` |
| Type | `src/types/agent.types.ts` | 修改 | `UpdateAgentProfilePayload` 加 `company` |
| Service | `src/services/agentService.ts` | 修改 | PUT body 加 `company` |
| 頁面 | `src/pages/UAG/Profile/BasicInfoSection.tsx` | 修改 | 移除 disabled + 加 state/onChange |

### 驗收標準

- [ ] API：PUT `/api/agent/profile` 可更新 `company` 欄位
- [ ] 前端：BasicInfoSection 公司欄位可編輯（非 disabled）
- [ ] 前端：修改公司名 → 儲存 → 詳情頁 AgentTrustCard 顯示新名稱
- [ ] Mock：Mock 模式下公司欄位可編輯（本地 state，不發 API）
- [ ] typecheck + lint 通過

---

## #17 [P0] 移除詳情頁「生成報告」FAB +「30秒回電」浮動按鈕

### 背景

詳情頁右下角有兩個浮動按鈕：
1. **「30秒回電」**（橘色圓形 FAB，`animate-bounce` 無限循環）— 功能與 MobileActionBar / MobileCTA 的「致電諮詢」按鈕重複
2. **「生成報告」**（藍色漸層圓形 FAB，hover 顯示 tooltip）— 開啟 ReportGenerator Modal，生成物件行銷報告

用戶決定移除這兩個功能，原因：
- 「30秒回電」與已重構的雙按鈕 CTA 功能重複，且 `animate-bounce` 持續跳動影響 UX（#9 D1 也指出此問題）
- 「生成報告」功能面向消費者端不需要，UAG 後台有獨立的 ReportGenerator

### 影響範圍分析

```
移除目標:
├─ 前端（PropertyDetailPage.tsx）
│   ├─ 「30秒回電」浮動按鈕（L672-680）
│   ├─ handleFloatingCallClick callback（L447-449）
│   ├─ 「生成報告」FAB 按鈕（L737-747）
│   ├─ showReportGenerator state（L87）
│   ├─ ReportGenerator Modal 組件實例（L750-770）
│   └─ import: ReportGenerator, FileText
│
├─ 前端（PropertyDetailActionLayer.tsx）— 備用版
│   ├─ 「30秒回電」浮動按鈕
│   ├─ 「生成報告」FAB 按鈕
│   ├─ ReportGenerator 組件實例
│   └─ import: ReportGenerator, FileText
│
├─ API（可移除）
│   ├─ api/report/create.ts — 報告建立 API
│   └─ api/report/track.ts — 報告追蹤 API
│
├─ 前端路由（可移除）
│   ├─ App.tsx — `/r/:id` 路由 + ReportPage import
│   └─ src/pages/Report/ 整個目錄 — ReportPage + ReportGenerator + types + dataAdapter
│
└─ 保留不動（UAG 仍需使用）
    ├─ src/pages/UAG/components/ReportGenerator/ — UAG 獨立版本
    └─ src/components/ReportPreview.tsx — 被 UAG ReportGenerator 引用
```

### 17-A. [P0] 前端 — 移除 `PropertyDetailPage.tsx` 浮動按鈕 + ReportGenerator

| 檔案 | 行號 | 操作 |
|------|------|------|
| `src/pages/PropertyDetailPage.tsx` L5 | 修改 | import 移除 `FileText` |
| `src/pages/PropertyDetailPage.tsx` L12 | 刪除 | 移除 `import { ReportGenerator } from './Report'` |
| `src/pages/PropertyDetailPage.tsx` L87 | 刪除 | 移除 `showReportGenerator` state |
| `src/pages/PropertyDetailPage.tsx` L447-449 | 刪除 | 移除 `handleFloatingCallClick` callback |
| `src/pages/PropertyDetailPage.tsx` L672-680 | 刪除 | 移除「30秒回電」浮動按鈕 JSX |
| `src/pages/PropertyDetailPage.tsx` L737-770 | 刪除 | 移除「生成報告」FAB + ReportGenerator Modal |

**移除代碼（30秒回電 — L672-680）：**
```tsx
{/* 📱 30秒回電浮動按鈕 - 高轉換 */}
<button
  onClick={handleFloatingCallClick}
  className="fixed bottom-28 right-4 z-40 flex size-16 animate-bounce ..."
  style={{ animationDuration: '2s' }}
>
  <Phone size={22} />
  <span className="mt-0.5 text-[10px]">30秒回電</span>
</button>
```

**移除代碼（生成報告 FAB — L737-770）：**
```tsx
{/* 報告生成 FAB 按鈕 */}
<button onClick={() => setShowReportGenerator(true)} className="group fixed bottom-24 right-4 z-40 ...">
  <FileText size={24} />
  <span className="...">生成報告</span>
</button>
<ReportGenerator property={{...}} isOpen={showReportGenerator} onClose={...} />
```

### 17-B. [P0] 前端 — 移除 `PropertyDetailActionLayer.tsx` 對應部分

| 檔案 | 操作 |
|------|------|
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` L1 | import 移除 `FileText` |
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` L9 | 刪除 `import { ReportGenerator }` |
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` L22 | 移除 `onFloatingCallClick` prop |
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` L60-62 | 移除 `showReportGenerator` / `onOpenReportGenerator` / `onCloseReportGenerator` props |
| `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` | 移除 30秒回電按鈕 + 生成報告 FAB + ReportGenerator JSX |

### 17-C. [P0] 前端路由 — 移除 `/r/:id` 路由 + Report 頁面

| 檔案 | 操作 |
|------|------|
| `src/App.tsx` L33 | 刪除 `import { ReportPage } from './pages/Report'` |
| `src/App.tsx` L251-258 | 刪除 `/r/:id` Route 區塊 |

### 17-D. [P1] 前端 — 移除 `src/pages/Report/` 整個目錄

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/pages/Report/index.ts` | 刪除 | 導出檔 |
| `src/pages/Report/ReportGenerator.tsx` | 刪除 | 詳情頁版報告生成器 |
| `src/pages/Report/ReportPage.tsx` | 刪除 | `/r/:id` 報告預覽頁 |
| `src/pages/Report/types.ts` | 刪除 | 報告類型定義 |
| `src/pages/Report/utils/dataAdapter.ts` | 刪除 | 報告資料轉換 |

**注意保留：**
- `src/components/ReportPreview.tsx` — **不刪除**，UAG 後台的 ReportGenerator (`src/pages/UAG/components/ReportGenerator/index.tsx`) 仍在使用
- `src/pages/UAG/components/ReportGenerator/` — **不刪除**，UAG 後台獨立功能

### 17-E. [P1] API — 移除 `api/report/` 目錄

| 檔案 | 操作 | 說明 |
|------|------|------|
| `api/report/create.ts` | 刪除 | 報告建立 API（POST /api/report/create） |
| `api/report/track.ts` | 刪除 | 報告追蹤 API（POST /api/report/track） |

### 17-F. [P2] 清理 — #9 D1/D2 自動解決

移除浮動按鈕後，以下 #9 項目自動解決：
- **D1** `animate-bounce` 過度動畫 → 按鈕已移除，問題不再存在
- **D2** 浮動按鈕與 MobileActionBar 重疊 → 按鈕已移除，問題不再存在

建議在 #9 驗收標準中標記 D1、D2 為「已被 #17 解決」。

### Mock 模式處理

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| 30秒回電按鈕 | 移除（不再顯示） | 移除（不再顯示） |
| 生成報告 FAB | 移除（不再顯示） | 移除（不再顯示） |
| ReportGenerator Modal | 移除（不再存在） | 移除（不再存在） |
| `/r/:id` 路由 | 移除 | 移除 |
| `api/report/*` | N/A | 移除 |

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| 頁面 | `src/pages/PropertyDetailPage.tsx` | 修改 | 移除 2 個浮動按鈕 + ReportGenerator + 相關 state/callback/import |
| 頁面 | `src/pages/propertyDetail/PropertyDetailActionLayer.tsx` | 修改 | 同步移除浮動按鈕 + ReportGenerator props/JSX |
| 路由 | `src/App.tsx` | 修改 | 移除 `/r/:id` 路由 + ReportPage import |
| 頁面 | `src/pages/Report/` 整個目錄（5 個檔案） | 刪除 | 不再被任何元件引用 |
| API | `api/report/create.ts` | 刪除 | 報告建立 API |
| API | `api/report/track.ts` | 刪除 | 報告追蹤 API |

**保留不動：**
| 檔案 | 原因 |
|------|------|
| `src/components/ReportPreview.tsx` | UAG ReportGenerator 仍在使用 |
| `src/pages/UAG/components/ReportGenerator/` | UAG 後台獨立功能 |

### 驗收標準

- [ ] 詳情頁右下角不再顯示「30秒回電」浮動按鈕
- [ ] 詳情頁右下角不再顯示「生成報告」FAB 按鈕
- [ ] Mock 頁面（`/maihouses/property/MH-100001`）同步移除
- [ ] 正式版頁面同步移除
- [ ] `/r/:id` 路由移除（訪問返回 404）
- [ ] `api/report/create` 端點移除
- [ ] `api/report/track` 端點移除
- [ ] UAG 後台 ReportGenerator 功能不受影響
- [ ] `src/components/ReportPreview.tsx` 仍可正常被 UAG 使用
- [ ] typecheck + lint 通過

---

## 依賴關係

```
#1 agentId fallback 修正（獨立，最優先）

#2 移除預約看屋 + 雙按鈕 UX 重構（獨立，含 #4 LINE 色統一）

#8 社會證明真實數據（獨立，但建議在 #2 之後做，因為 #2 會改動同樣的組件）
  ├─ 8-A DB migration（最先）
  ├─ 8-B API 端點（依賴 8-A）
  └─ 8-C/D/E/F 前端整合（依賴 8-B）

#5 詳情頁 mock agent（獨立，最快見效）
      │
#6 UAG Header mock 入口（獨立）
      │
      ▼
#7 Profile 頁 mock 模式（依賴 #6 提供入口）

#3 createLead 補 preferredChannel（獨立）

#10 社區評價正式版 API 資料層修正（Mock fallback ✅ 已完成）
  ├─ 10-A 為 MH-100001 補 community_id migration（依賴社區存在）
  └─ 10-B 為正式版社區補 seed 評價（依賴 10-A）

#12 信任分 Tooltip 修正（獨立，可隨時做）
  ├─ 12-A Tooltip 改說明型（前端，獨立）
  └─ 12-B seed 指標校正 migration（DB，獨立，可與 #5 同時做）

#13 房仲評價系統（依賴 #12-B seed 校正完成後再做，否則正式版初始數據不一致）
  ├─ 13-A DB migration agent_reviews（最先）
  ├─ 13-B API GET/POST（依賴 13-A）
  ├─ 13-C 前端型別（獨立）
  ├─ 13-D ReviewPromptModal（依賴 13-B/C）
  ├─ 13-E AgentReviewListModal（依賴 13-B/C）
  ├─ 13-F AgentTrustCard (32) 改可點擊（依賴 13-E）
  ├─ 13-G PropertyDetailPage 整合（依賴 13-E/F）
  ├─ 13-H Assure Step 2 觸發（依賴 13-D）
  └─ 13-I useAgentReviews hook（依賴 13-B/C）

#14 獲得鼓勵系統（依賴 #10 社區評價正式版修正，因為需要 community_reviews 有真實資料）
  ├─ 14-A DB migration community_review_likes（最先）
  ├─ 14-B API POST/GET review-like（依賴 14-A）
  ├─ 14-C 前端型別（獨立）
  ├─ 14-D CommunityReviews 加 👍 按鈕（依賴 14-B/C）
  ├─ 14-E useCommunityReviewLike hook（依賴 14-B/C）
  └─ 14-F PropertyDetailPage 整合（依賴 14-D/E）

#11 詳情頁 Header 品牌統一（獨立，建議在 #2 之後做）
  ├─ 11-A Logo 組件統一（獨立）
  ├─ 11-B 返回按鈕功能（獨立）
  ├─ 11-C 色彩 design token（獨立）
  └─ 11-D/E 無障礙 + 手機版微調（獨立）

#15 經紀人認證系統 + 完成案件自動累積（獨立，建議在 #12 之後做）
  ├─ 15-A DB migration 認證欄位 + 結案 Trigger（最先）
  ├─ 15-B 前端類型更新（獨立）
  ├─ 15-C API 更新（依賴 15-A）
  ├─ 15-D AgentTrustCard 條件式認證（依賴 15-B/C）
  ├─ 15-E MobileActionBar 條件式認證（依賴 15-B/C）
  └─ 15-F UAG Profile 證照字號輸入（依賴 15-C）

#16 店名開放編輯（獨立，可隨時做）
  ├─ 16-A API UpdateProfileSchema 加 company（獨立）
  ├─ 16-B BasicInfoSection 移除 disabled（依賴 16-A）
  └─ 16-C 類型 + Service 更新（依賴 16-A）

#17 移除詳情頁「生成報告」+「30秒回電」（獨立，建議最優先做，移除後 #9 D1/D2 自動解決）
  ├─ 17-A PropertyDetailPage.tsx 移除浮動按鈕 + ReportGenerator（最先）
  ├─ 17-B PropertyDetailActionLayer.tsx 同步移除（依賴 17-A 確認範圍）
  ├─ 17-C App.tsx 移除 /r/:id 路由（依賴 17-A）
  ├─ 17-D 刪除 src/pages/Report/ 整個目錄（依賴 17-A/C）
  └─ 17-E 刪除 api/report/（獨立）

#9 手機版 UX 優化（建議在 #2、#11、#15、#17 之後做，#17 解決 D1/D2，#15 改動 MobileActionBar）
  ├─ D1-D2 已被 #17 解決（浮動按鈕移除後不再存在）
  ├─ D3-D11 DetailPage 優化（依賴 #2 完成後的雙按鈕佈局）
  ├─ U1-U12 UAG 優化（獨立）
  └─ C1-C3 跨頁面共通（獨立，可隨時做）
```

---

## 建議實作順序

| 順序 | 工單 | 優先級 | 版本 | 預估影響檔案數 |
|------|------|--------|------|---------------|
| 1 | #1 agentId fallback | P0 | 正式+Mock | 1 |
| 2 | #2 移除預約看屋 + 雙按鈕 UX（含 #4） | P0 | 正式+Mock | 9（含刪除 3 個檔案） |
| 3 | **#17 移除生成報告 + 30秒回電** | **P0** | **正式+Mock** | **2 修改 + 7 刪除** |
| 4 | #8 社會證明真實數據 | P0 | 正式版 | 6（含新增 2 個檔案） |
| 5 | #5 詳情頁 mock agent | P0 | Mock | 1 |
| 6 | #6 UAG Header mock 入口 | P0 | Mock | 2 |
| 7 | #7 Profile 頁 mock | P0 | Mock | 2-3 |
| 8 | #3 createLead 補 preferredChannel | P1 | 正式 | 2 |
| 9 | #12 信任分 Tooltip 修正 + seed 校正 | P1 | 正式+Mock | 1 + 1 migration |
| 10 | #13 房仲評價系統 | P0 | 正式+Mock | 6 新增 + 3 修改 + 1 migration |
| 11 | #15 經紀人認證 + 完成案件累積 | P0 | 正式+Mock | 2 修改 + 1 migration + 5 修改 |
| 12 | #16 店名開放編輯 | P1 | 正式+Mock | 4 修改 |
| 13 | #14 獲得鼓勵系統 | P1 | 正式+Mock | 4 新增 + 2 修改 + 1 migration |
| 14 | #11 詳情頁 Header 品牌統一 | P1 | 正式+Mock | 1 |
| 15 | #10 社區評價正式版資料層修正 | P0 | 正式 | 2（migration） |
| 16 | #9 手機版 UX 優化（26 項，D1/D2 已被 #17 解決） | P1 | 正式+Mock | 14+ |
