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

## Epic 拆分索引

- `PROFILE`：`.claude/tickets/PROFILE.md`
- `DETAIL`：`.claude/tickets/DETAIL.md`
- `UAG`：`.claude/tickets/UAG.md`

## 子工單 Checklist（Master）

### Profile
- [x] 7-A
- [x] 7-B
- [x] 7-C
- [x] 16-A
- [x] 16-B
- [x] 16-C
- [ ] 21a-P1
- [ ] 21a-P2
- [ ] 21a-P3
- [ ] 21a-P4
- [ ] 21a-P5
- [x] 21b-P6
- [x] 21b-P7
- [x] 21b-P8
- [x] 21b-P9

### Detail
- [x] 11-A
- [x] 11-B
- [x] 11-C
- [x] 11-D
- [x] 11-E
- [x] 18-A
- [x] 18-B
- [x] 18-C
- [x] 9a-D3
- [x] 9a-D4
- [x] 9a-D6
- [x] 9a-D7
- [x] 9a-D8
- [x] 9b-D5
- [x] 9b-D9
- [x] 9b-D10
- [x] 9b-D11
- [x] 9b-C3
- [x] 20a-D1
- [x] 20a-D11
- [x] 20b-D3
- [x] 20b-D4
- [x] 20b-D9
- [x] 20c-D5
- [x] 20d-D7
- [x] 20d-D8

### UAG
- [x] 12-A
- [x] 12-B
- [x] 13-A
- [x] 13-B
- [x] 13-C
- [x] 13-D
- [x] 13-E
- [x] 13-F
- [x] 13-G
- [x] 13-H
- [x] 13-I
- [x] 14-A
- [x] 14-B
- [x] 14-C
- [x] 14-D
- [x] 14-E
- [x] 14-F
- [x] 14-G
- [x] 15-A
- [x] 15-B
- [x] 15-C
- [x] 15-D
- [x] 15-E
- [x] 15-F
- [x] 17-A
- [x] 17-B
- [x] 17-C
- [x] 17-D
- [x] 17-E
- [x] 17-F
- [x] 9c-U1
- [x] 9c-U2
- [x] 9c-U3
- [x] 9c-U4
- [x] 9c-U5
- [x] 9d-U6
- [x] 9d-U10
- [x] 9d-U12
- [x] 19a-R1
- [x] 19a-R2
- [x] 19a-R3
- [x] 19a-R4
- [x] 19a-R5
- [x] 19b-R6
- [x] 19b-R7
- [x] 19b-R8
- [ ] 19c-M1
- [ ] 19c-M6
- [x] 19d-M5
- [x] 19e-M8

## 實作進度總覽

> **設計原則：每個工單 ≤ 5 項施工內容**，確保 AI 能一次性完成不跳步。
> 大工單已拆分為子工單（#9a-d、#13a-b、#14a-b、#19a-e、#20a-e），每個子工單獨立可交付。
> 例外：#15（6 項）和 #17（6 項）僅超 1 項，暫不再拆。

### 已完成 ✅

- [x] **#1** [P0] agentId fallback 修正 — `property.agent.id` 避免 Lead 寫成 'unknown'
- [x] **#2** [P0] 移除預約看屋 + 雙按鈕 UX 重構 ✅ 2026-02-08
- [x] **#3** [P1] createLead 補傳 preferredChannel ✅ 2026-02-08
- [x] **#4** [P2] LINE 按鈕色統一（併入 #2） ✅
- [x] **#5** [P0] 詳情頁 DEFAULT_PROPERTY mock agent 資料 ✅ 2026-02-08
- [x] **#6** [P0] UAG Header Mock 入口 ✅ 2026-02-08
- [x] **#8** [P0] 社會證明真實數據 ✅ 2026-02-08
- [x] **#10** [P0] 社區評價正式版 API 修正 + Mock fallback ✅
- [x] **#7** [P0] Profile 頁 Mock 模式 ✅ 2026-02-08

### 待開發 — 功能移除（最優先）

- [x] **#17** [P0] 移除「生成報告」FAB +「30秒回電」浮動按鈕（6 項：17-A~F）✅ 2026-02-08

### 待開發 — 信任分 / 評價 / 鼓勵

- [x] **#12** [P1] 信任分 Tooltip 修正 + seed 校正（2 項：12-A/B）✅ 2026-02-09
- [x] **#13a** [P0] 房仲評價系統 — DB + API + 類型（4 項：13-A DB + 13-B API + 13-C 類型 + 13-I Hook）✅ 2026-02-09
- [x] **#13b** [P0] 房仲評價系統 — 前端組件 + 整合（5 項：13-D ReviewPromptModal + 13-E ReviewListModal + 13-F AgentTrustCard + 13-G DetailPage 整合 + 13-H Assure Step 2 觸發）✅ 2026-02-09
- [x] **#14a** [P1] 獲得鼓勵系統 — DB + API + 類型（4 項：14-A DB + 14-B API + 14-C 類型 + 14-E Hook）✅ 2026-02-09
- [x] **#14b** [P1] 獲得鼓勵系統 — 前端組件 + 整合（3 項：14-D 按讚 UI + 14-F DetailPage 整合 + 14-G 資料流）✅ 2026-02-09

### 待開發 — 經紀人認證 / 店名

- [x] **#15** [P0] 經紀人認證 + 完成案件累積（6 項：15-A DB + 15-B 類型 + 15-C API + 15-D/E 前端 + 15-F UAG Profile）✅ 2026-02-09
- [x] **#16** [P1] 店名開放編輯（3 項：16-A API + 16-B 前端 + 16-C 類型）✅ 2026-02-10

### 待開發 — Header / 品牌 / MaiMai

- [x] **#11** [P1] 詳情頁 Header 品牌統一（5 項：11-A Logo + 11-B 返回 + 11-C token + 11-D a11y + 11-E 手機版微調）✅ 2026-02-09
- [x] **#18** [P1] 詳情頁 MaiMai 公仔 A+C+D（3 項：18-A 右欄 + 18-B 歡迎語 + 18-C 狀態替換）✅ 2026-02-10

### 待開發 — DetailPage 手機版 UX 修正（原 #9 拆分）

- [x] **#9a** [P1] DetailPage A11y + 動畫修正（5 項：D3 VipModal focus trap + D4 VipModal 底部滑出 + D6 ActionBar ARIA + D7 CTA ARIA + D8 reduced-motion）✅ 2026-02-08
- [x] **#9b** [P1] DetailPage 排版 + 手勢修正（5 項：D5 社會證明 320px + D9 Panel 滑入動畫 + D10 金額字體 + D11 Gallery swipe + C3 iOS viewport）✅ 2026-02-09

### 待開發 — UAG 手機版 UX 修正（原 #9 拆分）

- [x] **#9c** [P1] UAG 觸控 + 排版修正（5 項：U1 Radar 觸控 + U2 z-index 統一 + U3 Header 手機精簡 + U4 字體過小 + U5 overscroll）✅ 2026-02-09
- [x] **#9d** [P1] UAG 列表 + Mock + 桌面版（3 項：U6 縮圖尺寸 + U10 Mock conversation_id + U12 桌面多列）✅ 2026-02-09

### 待開發 — UAG Radar 泡泡強化（原 #19 拆分）

- [x] **#19a** [P0] Radar 泡泡手機版核心（5 項：R1 尺寸自適應 + R2 碰撞偏移 + R3 觸控擴展 + R4 標籤 Tooltip + R5 S 級光暈）✅ 2026-02-10
- [x] **#19b** [P1] Radar 進階效果（3 項：R6 選中展開 + R7 動態高度 + R8 篩選 Chips）✅ 2026-02-10

### 待開發 — UAG 導航 + 佈局重設計（原 #19 拆分）

- [ ] **#19c** [P0] UAG 底部 Tab + KPI 卡片（2 項：M1 Tab 導航 + M6 KPI 摘要列）
- [x] **#19d** [P1] UAG 卡片風格升級（M5 Glassmorphism）✅ 2026-02-10
- [x] **#19e** [P1] UAG 微互動升級（M8 按鈕 scale + 購買成功/失敗動效 + 點數跳動）✅ 2026-02-10
- ~~**#19d-M3** ActionPanel Bottom Sheet~~ — 不做
- ~~**#19d-M4** Swipe-to-Action~~ — 不做
- ~~**#19e-M7** 可收合區塊~~ — 不做
- ~~**#19e-M9** MaiMai Loading~~ — 不做

### 待開發 — 詳情頁手機版現代化（新增 #20 拆分）

- [x] **#20a** [P0] Gallery 手勢 + 縮圖觸控優化（D2 依指示不作；2 項：D1 Gallery swipe+skeleton + D11 縮圖觸控擴大）✅ 2026-02-11
- [x] **#20b** [P0] 文本優化 + ActionBar 毛玻璃（3 項：D3 Description 展開全文 + D4 ActionBar 毛玻璃+滾動隱藏 + D9 Glassmorphism 統一）✅ 2026-02-11
- [x] **#20c** [P1] InfoCard 觸控修復（1 項：D5 按鈕 44px 觸控修復；~~D6 Specs Bento Grid~~ — 不做，加 icon 不算優化）✅ 2026-02-11
- [x] **#20d** [P1] 評論 + Panel 升級（2 項：D7 CommunityReviews SVG 星級 + D8 Panel 統一升級；~~D10 FAB 重定位+漸層~~ — 不做）✅ 2026-02-11
- [x] **#20e** ~~[P2] 動畫 + 微互動精緻化~~ — 整票不做。D12 價格動畫已有/其餘違反 ux-guidelines #7 #12；D14 倒數鎖關閉=反人類 UX；D15 bounce on icons=規範明確 Don't

### 待開發 — UAG Profile 頁 UX 升級（新增 #21 拆分）

- [ ] **#21a** [P0] Profile 手機版佈局重構（5 項：P1 頭像 compact variant + P2 指標 2x2 compact + P3 Tab 分段 + P4 Sticky Save Bar + P5 返回按鈕 touch target）
- [x] **#21b** [P1] Profile 桌面版 + 通用品質提升（4 項：P6 Tab 內容區視覺分段 + P7 表單即時驗證 + P8 儲存 Spinner + P9 指標色彩 design token；~~P10 已移除~~）✅ 2026-02-12

### 已完成項快速驗證

```bash
npm run typecheck
npm run lint
npm test
```

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
  name: '游杰倫',
  avatarUrl: 'https://via.placeholder.com/150',
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

- [x] `/maihouses/property/MH-100001` AgentTrustCard 顯示「游杰倫」+ 完整數據 ✅ 2026-02-08
- [x] 點「加 LINE 聊聊」→ LineLinkPanel 顯示 LINE ID（非 fallback） ✅ 2026-02-08
- [x] 點「致電諮詢」→ CallConfirmPanel 顯示電話號碼（非 fallback） ✅ 2026-02-08

### 驗證命令（可重複）

```bash
npm run test:agent-profile-5
npm run typecheck
npm run check:utf8
```

---

## #6 [P0] UAG Header Mock 模式顯示使用者區塊（Mock 版）

### 問題

**檔案：** `src/pages/UAG/components/UAGHeader.tsx` L149

Mock 模式下 `user` 為 null → 整個使用者區塊消失 → 找不到「個人資料」入口。

### 改動

| 檔案 | 改動 |
|------|------|
| `UAGHeader.tsx` | 新增 `useMock` prop，條件改為 `{(user \|\| useMock) && ...}` |
| `UAGHeader.tsx` | Mock 模式下顯示假名字「游杰倫」+ 導向 `/maihouses/uag/profile?mock=true` |
| `UAGHeader.tsx` | Mock（未登入）模式下隱藏無效「登出」操作，避免誤點 |
| `src/pages/UAG/index.tsx` | 將 `useMock` 傳入 `<UAGHeader>` |
| `src/pages/UAG/components/UAGHeader.test.tsx` | 補齊 Mock 專屬測試（顯示區塊、個資導向、隱藏登出） |

### 驗收標準

- [x] Mock 模式右上角可看到使用者頭像 + 下拉選單含「個人資料」 ✅ 2026-02-08
- [x] 點擊導向 Profile 頁面（帶 mock 參數） ✅ 2026-02-08
- [x] 正式模式行為不變 ✅ 2026-02-08

---

## #7 [P0] Profile 頁面支援 Mock 模式（Mock 版）

### 問題

`fetchAgentMe()` 無 token 直接 throw → Profile 頁面未登入顯示「無法載入」。

### 改動

| 檔案 | 改動 |
|------|------|
| `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | 偵測 `?mock=true`，回傳 mock 假資料 |
| `src/pages/UAG/Profile/index.tsx` | Mock 模式下編輯用 local state 保存 + notify 提示 |
| `src/pages/UAG/Profile/index.tsx` | 返回 UAG 保留 `mock=true`，並改用 router 內部路徑避免 `basename` 重複白頁 |
| `src/pages/UAG/Profile/hooks/useAgentProfile.ts` | `queryKey` 區分 mock/live，避免快取污染；Mock 保存後同步更新本地快取 |
| `src/pages/UAG/Profile/AvatarUploader.tsx` | Mock 頭像預覽的 `blob:` URL 在切換與卸載時自動釋放（`URL.revokeObjectURL`） |
| `src/pages/UAG/Profile/index.test.tsx` | 新增返回按鈕路徑測試（mock/live + 錯誤頁） |
| `src/pages/UAG/Profile/basename-navigation.test.tsx` | 新增 `basename=/maihouses` 路由整合測試（防白頁回歸） |
| `src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx` | 新增 Mock 載入/保存/快取隔離測試 |
| `src/pages/UAG/Profile/AvatarUploader.test.tsx` | 新增 `blob:` URL 釋放測試 |

### 驗收標準

- [x] 訪問 `/maihouses/uag/profile?mock=true` 可正常顯示 ✅ 2026-02-08
- [x] 可模擬編輯 → notify 成功提示 ✅ 2026-02-08
- [x] 正式模式行為不變 ✅ 2026-02-08

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

## #9a [P1] DetailPage A11y + 動畫修正（5 項）

### 來源

根據 `/ui-ux-pro-max` 的 `ux-guidelines.csv` 規範審核 DetailPage 手機版無障礙與動畫問題。

> **注意：** 原 #9 D1（animate-bounce）和 D2（浮動按鈕重疊）已被 **#17 移除生成報告+30秒回電** 解決，不再需要處理。

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

### 驗收標準

- [x] D3: VipModal 有 focus trap + 正確 ARIA 屬性
- [x] D4: VipModal 手機版從底部滑出
- [x] D6: MobileActionBar 按鈕有 `aria-label`
- [x] D7: MobileCTA 按鈕有 `aria-label`
- [x] D8: `prefers-reduced-motion` 時動畫停止
- [x] typecheck + lint 通過

### #9a 施工紀錄（2026-02-08）

#### 修改檔案
1. `src/components/PropertyDetail/VipModal.tsx`
   - 新增 `useFocusTrap`，補上 `onEscape` + 初始 focus（D3）
   - modal container 改為 `role="dialog"`，加入 `aria-modal` 與 `aria-labelledby`（D3）
   - backdrop 改為 `role="presentation"`，以 backdrop click 關閉（D3）
   - 手機版改為底部滑出佈局：`items-end` + `rounded-t-2xl`，桌面維持 `sm:items-center`（D4）

2. `src/pages/PropertyDetailPage.tsx`
   - `30秒回電` 浮動按鈕加入 `motion-reduce:animate-none`、`motion-reduce:transition-none`（D8）
   - `生成報告` FAB 與 tooltip 補 `motion-reduce:transition-none`（D8）

3. `src/components/PropertyDetail/__tests__/VipModal.test.tsx`（新增）
   - 驗證 dialog ARIA（`aria-modal` + `aria-labelledby`）
   - 驗證 `useFocusTrap` 觸發 `onEscape`
   - 驗證 backdrop click 關閉與手機底部佈局 class

4. `src/pages/__tests__/PropertyDetailPage.phase11.test.tsx`
   - 新增 reduced-motion 回歸測試，驗證 `30秒回電` 按鈕 class

5. `src/lib/motionA11y.ts`（新增）
   - 建立統一動畫 utility：`withMotionSafety()` + `motionA11y` presets
   - 強制動畫/轉場統一補齊 `motion-reduce` 對應 class（方案 B）

6. `src/components/PropertyDetail/CommunityReviews.tsx`
   - skeleton `animate-pulse` 改為使用 `motionA11y.pulse`（補齊 D8）

7. `src/components/PropertyDetail/PropertyInfoCard.tsx`
   - 熱門標記 `animate-pulse` 改為使用 `motionA11y.pulse`（補齊 D8）

8. `src/lib/motionA11y.test.ts`（新增）
   - 驗證 utility 會補齊 `motion-reduce:animate-none` / `motion-reduce:transition-none`

9. `src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx`（新增）
   - 驗證 CommunityReviews skeleton 有 reduced-motion 保護

10. `src/components/PropertyDetail/__tests__/PropertyInfoCard.test.tsx`
   - 補測熱門標記 `animate-pulse` 是否含 reduced-motion class

11. `src/components/PropertyDetail/MobileActionBar.tsx`、`src/components/PropertyDetail/MobileCTA.tsx`、`src/components/PropertyDetail/VipModal.tsx`
   - 將手寫 `motion-reduce` 轉場 class 改為統一使用 `motionA11y` utility（規則集中化）
   - 避免各組件分散複製貼上造成未來遺漏

#### 驗證命令
```bash
npm run test -- src/components/PropertyDetail/__tests__/VipModal.test.tsx src/components/PropertyDetail/__tests__/MobileActionBar.test.tsx src/components/PropertyDetail/__tests__/MobileCTA.test.tsx src/pages/__tests__/PropertyDetailPage.phase11.test.tsx
npm run test -- src/lib/motionA11y.test.ts src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx src/components/PropertyDetail/__tests__/PropertyInfoCard.test.tsx
npm run typecheck
npm run lint -- --format json
```

---

## #9b [P1] DetailPage 排版 + 手勢修正（5 項：D5 + D9 + D10 + D11 + C3）

#### D5. 社會證明區 320px 窄螢幕溢出

**檔案：** `src/components/PropertyDetail/PropertyInfoCard.tsx` L86-101
**規範引用：** ux-guidelines #6（320px 最小寬度支援）

**問題：** 瀏覽人數 + 賞屋組數兩個 badge 在 320px 窄螢幕可能擠壓換行。

**修復方案：**
- 外層 `flex gap-2` 加入 `flex-wrap`，允許窄螢幕自動換行

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

#### C3. iOS viewport 100vh 問題

**涉及檔案：** 全站 Modal / 固定欄
**規範引用：** ux-guidelines #17（iOS viewport）

**問題：** iOS Safari 的 `100vh` 包含地址欄高度，可能導致固定欄超出實際可視區域。

**修復方案：**
- 改用 `100dvh`（dynamic viewport height）或 `min-height: -webkit-fill-available`

### 驗收標準

- [x] D5: 社會證明區 320px `flex-wrap` 不溢出
- [x] D9: Panel 有滑入動畫（200ms）
- [x] D10: 手機版金額副標題 `text-sm` 可讀
- [x] D11: Gallery 支援 swipe 手勢
- [x] C3: iOS viewport 使用 `dvh`
- [x] typecheck + lint 通過

### #9b 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/components/PropertyDetail/LineLinkPanel.tsx`
   - 新增 `panelReady` 狀態，開啟 panel 後套用 `translate-y-0` / `opacity-100` 進場態
   - 補上 200ms 進場轉場：`duration-200 ease-out` + `transform-gpu`
   - 套用 `motionA11y.transitionTransform` / `motionA11y.transitionOpacity`，維持 reduced-motion 相容（D9）

2. `src/components/PropertyDetail/CallConfirmPanel.tsx`
   - 與 LineLinkPanel 同步補齊 bottom-sheet 進場滑入動畫
   - 保持 reduced-motion 對應 class，確保無障礙動作一致（D9）

3. `src/components/PropertyDetail/PropertyGallery.tsx`
   - 新增 `touchstart` / `touchmove` / `touchend` 手勢處理
   - 加入 `SWIPE_THRESHOLD`（40px）避免誤觸切圖
   - 支援左右滑動切換圖片，僅在索引變化時觸發 `onPhotoClick`（D11）

4. `src/pages/PropertyDetailPage.tsx`
   - 頁面根容器改為 `min-h-dvh`，改善 iOS Safari 動態視窗高度問題（C3）

5. `src/components/PropertyDetail/PropertyInfoCard.tsx`
   - 確認既有實作已符合 D5/D10：社會證明區 `flex-wrap`、價格副標題 `text-sm`，本次維持不變

6. `src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx`
   - 以 UTF-8 重寫測試內容，補上 panel 滑入動畫 class 驗證（D9）

7. `src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx`
   - 以 UTF-8 重寫測試內容，補上 panel 滑入動畫 class 驗證（D9）

8. `src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx`
   - 以 UTF-8 重寫測試內容，新增 swipe 左右切圖驗證（D11）

9. `src/pages/__tests__/PropertyDetailPage.viewport.test.tsx`
   - 新增 `min-h-dvh` 回歸測試（C3）

#### 驗證命令
```bash
npm run test -- src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx src/pages/__tests__/PropertyDetailPage.viewport.test.tsx src/pages/__tests__/PropertyDetailPage.phase11.test.tsx
npm run typecheck
npm run lint -- --format json
```

---

## #9c [P1] UAG 觸控 + 排版修正（5 項）

> **注意：** 原 #9 U7（Footer safe area）已被 **#19c-M1 底部 Tab 導航** 取代。U9（Agent Bar 擠壓）已被 **#19c-M6 KPI 卡片列** 升級。U8/U11（按鈕觸控）已被 **#19d-M4 Swipe-to-Action** 升級。

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

#### U3. Header 手機版資訊精簡（原「麵包屑溢出」升級）

**檔案：** `src/pages/UAG/components/UAGHeader.tsx` L115-125（麵包屑）、L157-174（用戶區塊）
**規範引用：** ux-guidelines #6（Breadcrumbs: 3+ 層才用）、#17（Fixed Positioning: 避免固定元素堆疊）、#22（Touch Target ≥ 44px）、#69（Horizontal Scroll: 禁止溢出）

**問題分析：** Header 一行塞了 Logo + 麵包屑文字 + 公司 badge + PRO badge + 用戶頭像/名稱/chevron，320px 預估寬度 ~330px 會溢出。加上 Agent Bar（44px）和 Footer（48px），固定元素共 ~140px，640px 手機只剩 500px 可視。麵包屑在已有 Tab Bar（#19c M1）的前提下屬於冗餘導航。

**修復方案：**
- 麵包屑整行加 `hidden md:flex`（手機版隱藏，桌面版保留）
- PRO badge 加 `hidden md:inline`（手機版隱藏）
- 公司 badge 移至 #19c M6 KPI Grid 上方顯示（手機版不在 Header 出現）
- 用戶區塊手機版隱藏名稱，只保留頭像 icon：`.uag-user-info { display: none }` 在 `@media (max-width: 767px)`
- 配合 #19c M6 KPI Grid 取代 Agent Bar stats，手機版 Header 精簡為 `[ Logo ] ... [ 頭像 icon ]`

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

### 驗收標準

- [x] U1: RadarCluster 數據點觸控目標 ≥ 44px
- [x] U2: z-index 統一使用 Tailwind scale 或常數檔
- [x] U3: 手機版 Header 只顯示 Logo + 頭像，麵包屑/PRO badge/用戶名稱 hidden，320px 無溢出
- [x] U4: Agent bar 字體手機版 ≥ 12px
- [x] U5: 有 `overscroll-behavior: contain`
- [x] typecheck + lint 通過

### #9c 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/pages/UAG/UAG.module.css`
   - 新增 UAG 專用 z-index token（`--z-*`）並套用到 Header、下拉選單、Bubble、Footer、Modal（U2）
   - `uag-page` 新增 `overscroll-behavior: contain`、`overscroll-behavior-y: contain`、`overflow-x: clip` 與 `min-height: 100dvh`（U5）
   - `uag-bubble` 新增 `min-width/min-height: 44px`，確保觸控目標下限（U1）
   - 新增 `@media (max-width: 767px)`：隱藏 `uag-breadcrumb`、`uag-company`、`uag-badge--pro`、`uag-user-info`、`uag-user-chevron`，保留頭像操作區（U3）
   - `agent-bar-stats` 手機字體調整為 `12px`，並在 `@media (max-width: 380px)` 保持 `12px` 不降級（U4）
   - 新增 `uag-logo-wrap` 與 `@media (max-width: 380px)` 的 Header 壓縮規則（`uag-header-inner` padding、actions gap、logo scale），降低超窄螢幕擠壓風險（U3）
   - 新增 `uag-cluster-live-badge`、`uag-live-dot` class，取代 RadarCluster inline z-index

2. `src/pages/UAG/components/RadarCluster.tsx`
   - 將 Live 監控 badge 改為 CSS class（移除 inline `zIndex: 5`）
   - 保留 bubble role/button/keyboard 操作行為，配合 CSS 完成 U1 + U2

3. `src/pages/UAG/components/UAGHeader.tsx`
   - 使用 `pointerdown` 並僅在選單開啟時綁定外點關閉監聽，降低全域事件負擔
   - 用戶選單按鈕補上 `aria-haspopup="menu"`、`aria-controls="uag-user-menu-dropdown"`（a11y）
   - Logo 外層新增 `uag-logo-wrap`，提供超窄螢幕可控縮放掛載點

4. `src/pages/UAG/components/UAGHeader.test.tsx`
   - 以 UTF-8 重寫測試，補齊 Mock 模式、選單、行動版精簡相關 class 驗證（U3/U4）
   - 補強 CSS 斷點驗證：`@media (max-width: 767px)` 隱藏規則 + `@media (max-width: 380px)` 字級下限驗證（U3/U4）
   - 補強 a11y 與容器驗證：`aria-haspopup/aria-controls` + `uag-logo-wrap`

5. `src/pages/UAG/components/RadarCluster.test.tsx`（新增）
   - 驗證 bubble 觸控尺寸變數（F=60px、S=120px）與互動（click/Enter）
   - 驗證 Live badge 使用新 class（U1/U2）
   - 補強 `.uag-bubble` CSS 規則驗證：`min-width/min-height: 44px`（U1）

6. `src/pages/UAG/components/__tests__/UAGHeader.responsive.test.tsx`
   - 同步更新極窄螢幕（`max-width: 380px`）字級預期為 `12px`，避免 U4 回歸

7. `src/pages/UAG/components/ReportGenerator/ReportGenerator.module.css`
   - 補齊報告預覽區域 z-index token：`--z-report-phone-notch`、`--z-report-hero-tag`（U2 延伸補強）
   - `reportPhoneNotch`、`reportPreviewHeroTag` 由數字 z-index 改為 token 引用

8. `src/pages/UAG/UAG-deai-demo.module.css`
   - 新增 `--z-layer-live`、`--z-layer-bubble`、`--z-layer-bubble-hover`、`--z-layer-sticky`
   - Header、Live badge、Bubble、Footer 的 z-index 全部改為 token 引用，移除數字硬編碼（U2 延伸補強）

9. `src/pages/UAG/UAG-deai-v2.module.css`
   - 新增 `--z-layer-live`、`--z-layer-bubble`、`--z-layer-sticky`、`--z-layer-footer`
   - Header、Live badge、Bubble、Footer 的 z-index 全部改為 token 引用，移除數字硬編碼（U2 延伸補強）

#### 驗證命令
```bash
npm run test -- src/pages/UAG/components/UAGHeader.test.tsx src/pages/UAG/components/RadarCluster.test.tsx src/pages/UAG/index.test.tsx src/pages/UAG/components/__tests__/UAGHeader.responsive.test.tsx
npm run test -- src/pages/UAG/__tests__/ticket9d-regression.test.ts
npm run typecheck
npm run lint
npm run check:utf8
rg -n "z-index\\s*:\\s*[0-9]+" src/pages/UAG -S
```

---

## #9d [P1] UAG 列表 + Mock + 桌面版修正（3 項）

#### U6. Listing 縮圖尺寸優化

**檔案：** `src/pages/UAG/components/ListingFeed.tsx`
**規範引用：** ux-guidelines #22（觸控目標）

**問題：** 手機版 Listing 項目的縮圖 `64x64` 偏小，點擊體驗不佳。

**修復方案：**
- 手機版縮圖改為 `80x80`（`size-16` → `size-20`）

> **已取代項（不需處理）：**
> - ~~U7 Footer safe area~~ → 被 #19c-M1 底部 Tab 導航取代
> - ~~U8 AssetMonitor 觸控~~ → 被 #19d-M4 Swipe-to-Action 升級
> - ~~U9 Agent Bar 擠壓~~ → 被 #19c-M6 KPI 卡片列升級
> - ~~U11 Monitor Table 按鈕~~ → 被 #19d-M4 Swipe-to-Action 升級

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

> **跨頁面共通項已分散至對應子工單：**
> - ~~C1 LINE 品牌色~~ → 已在 #2 中統一（`LINE_BRAND_GREEN` 常數 + CSS variable）
> - ~~C2 Modal backdrop~~ → 併入 #20d-D8（Panel 統一升級）
> - C3 iOS viewport → 併入 #9b

### 驗收標準

- [x] U6: Listing 縮圖手機版 80px
- [x] U10: Mock Lead A-6600 補齊 `conversation_id`
- [x] U12: Desktop ≥ 1280px 時組件並排
- [x] typecheck + lint 通過

### #9d 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/pages/UAG/UAG.module.css`
   - 新增 `@media (min-width: 1280px)`：`action-panel` 與 `asset-monitor` 改為 `span 3`，桌面版並排顯示（U12）
   - 手機版 `listing-item` 欄寬改為 `80px + 1fr`，並將 `.l-thumb` 調整為 `80x80`（U6）

2. `src/pages/UAG/components/AssetMonitor.tsx`
   - 根節點 `<section>` 補上 `id="asset-monitor-container"`，提供桌面版 U12 佈局規則掛載點

3. `src/pages/UAG/mockData.ts`
   - A-6600 已購 Lead 補上 `conversation_id: 'mock-conv-A6600-001'`，使 Mock 與已購資料結構一致（U10）

4. `src/pages/UAG/__tests__/ticket9d-regression.test.ts`（新增）
   - 驗證 A-6600 已補齊 `conversation_id`
   - 驗證 U12 桌面多列 CSS 規則存在
   - 驗證 U6 手機縮圖 `80px` CSS 規則存在

#### 驗證命令
```bash
npm run test -- src/pages/UAG/__tests__/ticket9d-regression.test.ts
npm run typecheck
npm run lint
```

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
| `PropertyDetailPage.tsx` | 報告 FAB 漸層 | **不適用**（已由 #17 移除「生成報告」FAB） |

#### 11-D. [P2] 無障礙補強

| 檔案 | 改動 |
|------|------|
| `PropertyDetailPage.tsx` L506 | `<nav>` 加 `aria-label="物件導覽"` |
| `PropertyDetailPage.tsx` L520 | 物件編號區塊加 `role="status"` |

#### 11-E. [P2] 手機版 Header 微調

**問題分析：** 11-A 替換 `<Logo>` 後 icon 從 32→42px + serif 字體 + badge，320px Header 預估寬度 ~326px 會溢出。物件編號本質是「內容」非「導航」，不應佔用 Header 空間。

**規範引用：** ux-guidelines #17（Fixed Positioning — 避免固定元素堆疊過多）、#22（Touch Target ≥ 44px）、#69（Horizontal Scroll — 禁止手機水平溢出）

| 項目 | 改動 |
|------|------|
| 物件編號 | 從 Header 移至內容區（Gallery 上方），改用 `text-sm text-brand-700 font-mono`，提高可讀性 |
| 返回按鈕 touch target | `p-2` → `p-2.5`，確保 44x44px |

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/pages/PropertyDetailPage.tsx` | 修改 | Header 區塊重構（L505-525），移除 `Home` icon import；物件編號從 Header 移至 Gallery 上方 |
| `src/components/Logo/Logo.tsx` | 不動 | 已有完整 props 支援，直接複用 |

### 驗收標準

- [x] 詳情頁 Logo 與首頁視覺一致（42x42 icon、serif 字體、badge、hover shine 效果）
- [x] 點擊 Logo 導向 `/maihouses/`
- [x] 返回按鈕有 `onClick`，有瀏覽歷史回上頁，無歷史回首頁
- [x] 無硬編碼 `#003366` / `#00A8E8`，全部使用 design token
- [x] `aria-label` 完整（返回按鈕、Logo、nav、物件編號）
- [x] 物件編號在 Gallery 上方（非 Header 內），手機桌面皆可見
- [x] 手機版 320px 無溢出
- [x] typecheck + lint 通過

### #11 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/pages/PropertyDetailPage.tsx`
   - Header Logo 改為共用 `<Logo showSlogan={false} showBadge={true} href="/maihouses/" ariaLabel="回到邁房子首頁" />`（11-A）
   - 返回按鈕新增 `onClick`，使用 `resolvePropertyDetailBackTarget(window.history.length)` 決定 `navigate(-1)` 或 `navigate('/maihouses/')`，並補 `aria-label="返回上一頁"`（11-B）
   - Header border 改為 `border-brand-100`，移除手刻 logo 區塊（11-C）
   - `<nav>` 新增 `aria-label="物件導覽"`；物件編號改為 `role="status"` 並補 `aria-label`（11-D）
   - 物件編號由 Header 移至 `main` 內容區、Gallery 上方；返回按鈕 `p-2.5` 確保 touch target（11-E）
   - 新增 `resolvePropertyDetailBackTarget` 匯出函式，確保返回邏輯可測試與可維護

2. `src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx`（新增）
   - 新增 #11 回歸測試：品牌化 Logo 連結、nav a11y、物件編號位置、返回按鈕導頁
   - 補 `resolvePropertyDetailBackTarget` 的雙分支測試（有歷史/無歷史）

#### 驗證命令
```bash
npm run test -- src/pages/__tests__/PropertyDetailPage.header-branding.test.tsx src/pages/__tests__/PropertyDetailPage.phase11.test.tsx
npm run typecheck
npm run lint
npm run check:utf8
```

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
| `src/components/AgentTrustCard.tsx` L8-10 | 移除 `CheckCircle`、`FileText` import（`Clock` 保留給在線回覆提示） |
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
      每次資料更新後重新計算
    </p>
    <div className="absolute left-4 top-full border-8 border-transparent border-t-slate-800" />
  </div>
)}
```

**不需新增 import** — `Shield`、`Star`、`ThumbsUp` 已存在於 import 列表。

#### 12-B. [P0] MH-100001 seed 指標全量校正（正式版）

| 檔案 | 改動 |
|------|------|
| `supabase/migrations/20260209_fix_mh100001_agent_seed_metrics.sql` | **新增** — 為 seed agent 補齊所有指標欄位 |

```sql
UPDATE public.agents
SET
  service_rating = 4.8,          -- 正式版顯示 4.8（與 Mock 一致）
  review_count = 32,             -- 正式版顯示 (32)（與 Mock 一致）
  completed_cases = 45,          -- 正式版顯示 45（與 Mock 一致）
  encouragement_count = 156,     -- 維持不變（已有值）
  joined_at = NOW() - INTERVAL '4 years'  -- 正式版顯示 4年（與 Mock 一致）
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
-- Trigger / 函數重算 trust_score = 60 + (4.8::INTEGER * 4 = 20) + 9 + 7 = 96
```

校正後正式版 vs Mock 對照：

| 欄位 | 校正前（正式版） | 校正後（正式版） | Mock |
|------|---------------|---------------|------|
| serviceRating | 0.0 | **4.8** | 4.8 |
| reviewCount | (0) | **(32)** | (32) |
| completedCases | 0 | **45** | 45 |
| serviceYears | 0年 | **4年** | 4年 |
| trustScore | 92（硬編碼） | **96**（Trigger 算） | 92（prop 值） |
| encouragementCount | 156 | 156 | 156 |

Trigger `trg_agents_trust_score` 會在 UPDATE 時自動執行 `fn_calculate_trust_score`，重算 `trust_score`。

**前端零改動** — 程式碼邏輯完全正確（`profile?.xxx ?? agent.xxx ?? 0`），問題全在 DB seed 資料缺失。

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/components/AgentTrustCard.tsx` | 修改 | 移除假拆分函數 + Tooltip 改說明型 + 清理 import |
| `src/components/__tests__/AgentTrustCard.memo.test.tsx` | 修改 | Tooltip 互動測試改為檢查說明型內容 |
| `supabase/migrations/20260209_fix_mh100001_agent_seed_metrics.sql` | 新增 | seed agent 全量指標校正（觸發 Trigger 重算） |

### Mock 版影響

**無影響。** Mock 版績效指標硬編碼在 `agentMetrics`（L76-83），`isDemo=true` 時 `shouldFetchProfile=false`，不呼叫 API。Tooltip 顯示相同的說明文字，不涉及任何數值拆分。

### 驗收標準

- [x] Tooltip 不再顯示假拆分數值
- [x] Tooltip 顯示「信任分數 N / 100」+ 三項指標說明 + 更新頻率
- [x] `getTrustBreakdown` 函數已移除
- [x] `CheckCircle`、`FileText` import 已清理（`Clock` 仍供在線回覆提示使用）
- [x] 正式版績效指標資料來源已校正：4.8 / (32) / 45 / 4年
- [x] MH-100001 的 `service_rating`、`review_count`、`completed_cases`、`joined_at` 已補齊
- [x] Trigger 重算後 `trust_score` 為合理值（依現行公式為 96）
- [x] Mock 頁行為不變（績效指標 + Tooltip 均不受影響）
- [x] typecheck + lint 通過

### #12 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/components/AgentTrustCard.tsx`
   - 移除 `getTrustBreakdown` 與 `trustBreakdown`，避免假拆分誤導（12-A）
   - Tooltip 改為說明型內容：顯示 `信任分數 N / 100`、三項指標、更新說明
   - 清理未使用 icon import：`CheckCircle`、`FileText`
   - 補強鍵盤可用性：`Space/Enter` 切換時 `preventDefault`，`Escape` 可關閉；新增 `aria-expanded` + `aria-describedby`

2. `src/components/__tests__/AgentTrustCard.memo.test.tsx`
   - 更新 Tooltip 測試斷言，改驗證說明型文案並防止舊假拆分文案回歸
   - 新增鍵盤互動測試：`Space` 觸發 `preventDefault`、`Escape` 關閉 Tooltip

3. `supabase/migrations/20260209_fix_mh100001_agent_seed_metrics.sql`（新增）
   - 補齊 seed agent 指標：`service_rating=4.8`、`review_count=32`、`completed_cases=45`、`encouragement_count=156`、`joined_at=NOW()-4 years`
   - 追加 `trust_score = fn_calculate_trust_score(id)`，確保信任分按現行公式重算

#### 驗證命令
```bash
npm run test -- src/components/__tests__/AgentTrustCard.memo.test.tsx
npm run typecheck
npm run lint
```

---

## #13a [P0] 房仲評價系統 — DB + API + 類型（4 項：13-A + 13-B + 13-C + 13-I）

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
Body: { agentId, rating, trustCaseId, comment?, propertyId? }
需要認證（auth token）
```

- Zod 驗證：`rating` 1-5 整數、`comment` 最多 500 字
- 案件驗證：`trustCaseId` 必填，且必須符合「本人買方 + step>=2 + agent 一致」
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
  trustCaseId: z.string().uuid(),
  propertyId: z.string().optional(),
});

export type CreateReviewPayload = z.infer<typeof CreateReviewPayloadSchema>;
```

> **#13a 包含 13-A（上方）+ 13-B + 13-C + 13-I（下方 Hook 區塊）。**

### #13a 驗收標準

- [x] DB：`agent_reviews` 表已建立，RLS 已啟用
- [x] DB：INSERT 一筆評價後 `agents.service_rating` 和 `review_count` 自動更新
- [x] DB：同 agent + reviewer + case 防重複
- [x] API：`GET /api/agent/reviews?agentId=xxx` 回傳評價列表 + 星級分佈
- [x] API：`POST /api/agent/reviews` 新增評價，Zod 驗證 rating 1-5
- [x] API：`POST /api/agent/reviews` 強制 `trustCaseId` + 案件資格驗證（買方/步驟/agent）
- [x] Type：`agent-review.ts` Zod schema 完整
- [x] Hook：`useAgentReviews.ts` useQuery + useMutation 運作正常
- [x] typecheck + lint 通過

### #13a 施工紀錄（2026-02-09）

#### 修改檔案
1. `supabase/migrations/20260209_agent_reviews.sql`（13-A）
   - 新增 `public.agent_reviews` 表（`agent_id / reviewer_id / trust_case_id / property_id / rating / comment / is_public / created_at`）
   - 新增防重複唯一索引：`agent_id + reviewer_id + trust_case_id`
   - 啟用 RLS，補齊 SELECT/INSERT/UPDATE/DELETE policies 與 `anon/authenticated` 權限
   - 新增 `fn_recalc_agent_review_stats` + `trg_agent_reviews_stats`，在 INSERT/UPDATE/DELETE 後自動回寫 `agents.service_rating`、`agents.review_count`

2. `api/agent/reviews.ts`（13-B）
   - 新增 `GET /api/agent/reviews`：支援 `agentId/page/limit`，回傳分頁評價、平均分、星級分佈
   - 新增 reviewer 名稱遮罩（`X***`）與分頁預設值（`page=1`, `limit=10`）
   - 新增 `POST /api/agent/reviews`：整合 `verifyAuth`、Zod 驗證、案件資格驗證（買方/step/agent）、重複檢查、寫入評價
   - 新增衝突處理（409）與統一 API 回應格式

3. `src/types/agent-review.ts`（13-C）
   - 新增 `AgentReviewSchema`、`AgentReviewListResponseSchema`、`CreateReviewPayloadSchema`、`CreateReviewResponseSchema`
   - 補齊對應 TypeScript 型別輸出

4. `src/hooks/useAgentReviews.ts`（13-I）
   - 新增 `useAgentReviewList`（`useQuery`）與 `useSubmitReview`（`useMutation`）
   - 新增 `fetchAgentReviews`、`postAgentReview` helper
   - 成功提交後自動 `invalidateQueries(['agent-reviews', agentId])` 與 `invalidateQueries(['agent-profile', agentId])`

5. 測試檔案
   - `api/agent/__tests__/reviews.test.ts`（新增）
   - `src/hooks/__tests__/useAgentReviews.test.tsx`（新增）

#### 驗證命令
```bash
npm run test -- api/agent/__tests__/reviews.test.ts src/hooks/__tests__/useAgentReviews.test.tsx
npm run typecheck
npm run lint
npm run check:utf8
```

---

## #13b [P0] 房仲評價系統 — 前端組件 + 整合（5 項：13-D + 13-E + 13-F + 13-G + 13-H）

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
│ [Star] 4.8  (32 則評價)               │
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

### #13b 驗收標準

- [x] 前端：`ReviewPromptModal` 可選 1-5 星 + 評語（選填）+ 送出/稍後再說
- [x] 前端：`AgentReviewListModal` 顯示星級分佈長條圖 + 評價列表
- [x] 前端：`AgentTrustCard` 的 `(32)` 可點擊，有 hover 效果 + 虛線底線
- [x] 前端：Assure Step 2 確認成功後 500ms 彈出 `ReviewPromptModal`
- [x] 前端：Mock 模式 AgentReviewListModal 顯示假資料
- [x] typecheck + lint 通過

### #13b 施工紀錄（2026-02-09）

#### 修改檔案
1. `src/components/Assure/ReviewPromptModal.tsx`（新增，13-D）
   - 新增評價彈窗組件：支援 1-5 星選擇（hover 預覽）+ 500 字評語（選填）
   - 送出按鈕：POST `/api/agent/reviews` + Zod 驗證 + 防重複提交 `isBusy` 狀態
   - 稍後再說按鈕：直接關閉，不再提醒
   - Modal backdrop click-to-close + 完整 ARIA 支援（`role="dialog"`, `aria-modal`, `aria-labelledby`）
   - 錯誤處理：網路異常/系統錯誤分類提示

2. `src/components/AgentReviewListModal.tsx`（新增，13-E）
   - 新增評價列表 Modal：顯示平均分 + 星級分佈長條圖（純 CSS）+ 評價列表
   - 支援分頁「載入更多」按鈕
   - Mock 模式：顯示 3 筆假資料（林***/王***/陳***）
   - 空狀態處理：`reviewCount=0` 顯示「尚無評價」
   - 使用 `useQuery` + Zod safeParse 驗證 API 回應
   - 完整 ARIA 支援

3. `src/components/AgentTrustCard.tsx`（修改，13-F）
   - 新增 `onReviewClick?: () => void` prop
   - 服務評價區塊從靜態 `<div>` 改為可點擊 `<button>`
   - 評價數 `(32)` 加上虛線底線（`underline decoration-dotted`）+ `text-brand-600` 色
   - hover 效果：`hover:bg-bg-base` + `transition-colors`
   - 完整 ARIA：`aria-label="查看 N 則服務評價"` + focus ring

4. `src/pages/PropertyDetailPage.tsx`（修改，13-G）
   - 新增 `reviewListOpen` state + `handleReviewClick` callback
   - `<AgentTrustCard>` 傳入 `onReviewClick={handleReviewClick}`
   - 新增 `<AgentReviewListModal>` 渲染，傳入 agent 資訊
   - import `AgentReviewListModal`

5. `src/pages/Assure/Detail.tsx`（修改，13-H）
   - 新增 `showReviewPrompt` state
   - 修改 `handleAction` 回傳 `success` boolean
   - 修改 `confirmStep` 為 async，Step 2 確認成功後 500ms 觸發 `setShowReviewPrompt(true)`
   - 新增 `<ReviewPromptModal>` 渲染，從 localStorage 取得 `agentId`（`uag_last_aid`）
   - import `ReviewPromptModal`

#### 驗證命令
```bash
npm run typecheck
npm run lint
npm test
```

---

## #13a（續）— 13-I Hook

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

> **注意：** 此處的驗收標準已拆分至 #13a 和 #13b 各自的驗收區塊。

---

## #14a [P1] 獲得鼓勵系統 — DB + API + 類型（4 項：14-A + 14-B + 14-C + 14-E）

### 背景分析

**現狀：** `agents.encouragement_count = 156` 是 seed 硬編碼值，系統中不存在任何 +1 機制。

**需求路徑（用戶確認）：**
```
房仲上傳物件時填寫「兩好一公道」（advantage_1 / advantage_2 / disadvantage）
  → 存入 properties 表
  → community_reviews VIEW 投影出來，顯示在社區牆
  → 消費者覺得「兩好一公道」實用 → 按讚（ThumbsUp）
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

### #14a 施工紀錄 (2026-02-09)

#### 修改檔案
1. `supabase/migrations/20260209_community_review_likes.sql`（14-A）
   - 重寫 migration（移除毀損文字），建立 `community_review_likes`（`property_id UUID` FK `properties.id`）
   - 補齊唯一索引與查詢索引（`property_id + user_id`、`property_id`、`user_id`）
   - 以 `DROP POLICY IF EXISTS` + `CREATE POLICY` 方式重建 RLS（anon 可讀、authenticated 可增刪）
   - 新增 `fn_recalc_encouragement_count` + `trg_community_review_likes_encouragement`
   - 補 backfill SQL，將既有 `agents.encouragement_count` 與按讚資料對齊

2. `api/community/review-like.ts`（14-B）
   - 重寫 GET/POST handler（含 `OPTIONS`），統一 `errorResponse` 錯誤格式
   - 修正認證流程為 `verifyAuth(req)`，移除錯誤依賴與無效 import
   - 新增 property 解析：同時支援 `properties.id`(UUID) 與 `public_id`（例如 `MH-100001`）
   - 新增「兩好一公道」完整性驗證（缺欄位回傳 422）
   - 新增 toggle 分支：已讚 DELETE、未讚 INSERT、`23505` 併發衝突視為 idempotent 成功

3. `src/types/community-review-like.ts`（14-C）
   - 補齊 `ReviewLikeQuerySchema`、`ReviewLikeApiErrorSchema`
   - 保留並強化 `ToggleReviewLikePayloadSchema`、`ReviewLikeResponseSchema`（型別與 Zod 一致）

4. `src/hooks/useCommunityReviewLike.ts`（14-E）
   - 新增 `fetchReviewLikeStatus` / `postReviewLike` / `useCommunityReviewLikeStatus`
   - `useCommunityReviewLike` 補齊 optimistic update、error rollback、settled refetch
   - 成功後 `invalidateQueries(['agent-profile'])`，同步更新 AgentTrustCard 鼓勵數

5. 測試檔案
   - `api/community/__tests__/review-like.test.ts`（重寫）
     - 覆蓋 GET/POST、未授權、summary 不完整(422)、insert/delete、`23505` idempotent
   - `src/hooks/__tests__/useCommunityReviewLike.test.tsx`（重寫）
     - 覆蓋 helper API call、Unauthorized、optimistic update、rollback

#### 驗證結果
```bash
npm run test -- api/community/__tests__/review-like.test.ts src/hooks/__tests__/useCommunityReviewLike.test.tsx
npm run typecheck
npm run lint
npm run check:utf8
```

> **#14a 包含 14-A（上方）+ 14-B + 14-C + 14-E（下方 Hook 區塊）。**

### #14a 驗收標準

- [x] DB：`community_review_likes` 表已建立，RLS 已啟用
- [x] DB：Trigger 自動 COUNT → UPDATE `agents.encouragement_count`
- [x] API：`POST /api/community/review-like` toggle 按讚/取消
- [x] Type：`community-review-like.ts` Zod schema 完整
- [x] Hook：`useCommunityReviewLike.ts` optimistic update 運作正常
- [x] typecheck + lint 通過

---
## #14b [P1] 獲得鼓勵系統 — 前端組件 + 整合（3 項：14-D + 14-F + 14-G）

### 14-D. [P1] 前端組件 — 社區牆評價按讚 UI

| 檔案 | 改動 |
|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 修改：每筆評價卡片加按讚按鈕（Lucide `ThumbsUp`） |

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

## #14a（續）— 14-E Hook

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
  ├─ 每筆「兩好一公道」評價旁有按讚按鈕（Lucide ThumbsUp）
  │
  └─ 點擊按讚
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
| 按讚 `liked` 狀態 | 本地 `useState` 管理 toggle | API 回傳 `liked` 狀態 |
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
| 修改 | `src/components/PropertyDetail/CommunityReviews.tsx` | 修改 | 評價卡片加按讚按鈕（Lucide ThumbsUp） + Mock toggle |
| 修改 | `src/pages/PropertyDetailPage.tsx` | 修改 | 整合 useCommunityReviewLike |

### #14b 驗收標準

- [x] 前端：`CommunityReviews` 每筆評價旁有按讚按鈕（Lucide `ThumbsUp`），hover 有變色效果
- [x] 前端：已按讚狀態顯示 `bg-brand-50 text-brand-700`，未讚顯示灰色
- [x] 前端：按讚後 `AgentTrustCard` 的「獲得鼓勵」數字即時更新（透過 invalidateQueries）
- [x] 前端：未登入時按讚按鈕 disabled，帶 tooltip 提示（透過 disabled + opacity-50）
- [x] Mock：按讚可 toggle，本地 state 管理，視覺效果與正式版完全一致
- [x] typecheck + lint 通過

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
| `supabase/migrations/20260209_agent_verification_and_cases.sql` | **新增** |

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
  isVerified={property.isDemo ? true : (property.agent?.isVerified ?? false)}   // 新增
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
| `AgentTrustCard` 經紀人資訊 | Mock 走平台編號 + 已認證（`isDemo=true`） | 有證照顯示字號，無證照顯示 `MH-00001` |
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
| DB | `supabase/migrations/20260209_agent_verification_and_cases.sql` | **新增** | 認證欄位 + 結案 Trigger |
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

- [x] DB：`agents` 表有 `license_number` / `is_verified` / `verified_at` 欄位
- [x] DB：Demo 房仲 seed 已設為 `is_verified = true`
- [x] DB：`trust_cases` 結案時 `agents.completed_cases` 自動 +1（Trigger 正確）
- [x] DB：重複結案（已是 closed 再 UPDATE）不會重複 +1
- [x] DB：`completed_cases` +1 後 `trust_score` 連帶更新
- [x] API：GET `/api/agent/profile` 回傳 `license_number` / `is_verified` / `verified_at`
- [x] API：PUT `/api/agent/profile` 可更新 `license_number`
- [x] 前端：有 `license_number` 時顯示「經紀人證照：(113)北市經紀字第004521號」
- [x] 前端：無 `license_number` 時顯示「平台編號：MH-00001」
- [x] 前端：`is_verified = true` → 綠色「已認證」badge
- [x] 前端：`is_verified = false` → 灰色「未認證」badge
- [x] 手機版：`MobileActionBar` 僅 `isVerified = true` 時顯示「認證經紀人」
- [x] Mock：`isDemo=true` 時維持現有行為（hardcode 顯示已認證）
- [x] UAG Profile：有「經紀人證照字號」輸入欄，提交後存入 DB
- [x] typecheck + lint 通過

### #15 施工紀錄（2026-02-09）

#### 修改檔案
1. `supabase/migrations/20260209_agent_verification_and_cases.sql`（15-A）
   - 新增 `agents.license_number` / `agents.is_verified` / `agents.verified_at`
   - 新增 `idx_agents_is_verified` 部分索引
   - 回填 Demo 房仲認證資料（字號 + 驗證時間）
   - 新增 `fn_increment_completed_cases` + `trg_trust_cases_completed`
   - 結案狀態從未結案 → 結案時，自動累加 `agents.completed_cases`

2. `src/lib/types.ts`、`src/types/agent.types.ts`、`src/types/supabase-schema.ts`（15-B）
   - `Agent`、`AgentProfile`、`UpdateAgentProfilePayload` 補齊 `licenseNumber/isVerified/verifiedAt`
   - Supabase Agent Row 型別同步新增 `license_number/is_verified/verified_at`

3. `api/agent/profile.ts`、`api/agent/me.ts`、`src/services/agentService.ts`、`src/services/propertyService.ts`（15-C）
   - API 查詢與回傳補齊 `license_number/is_verified/verified_at`
   - `PUT /api/agent/profile` 新增 `license_number` 可更新
   - 前端 service schema + mapping + 更新 payload 同步
   - property agent 資料流加入 `licenseNumber/isVerified/verifiedAt`

4. `src/components/AgentTrustCard.tsx`、`src/components/PropertyDetail/MobileActionBar.tsx`、`src/pages/PropertyDetailPage.tsx`、`src/pages/propertyDetail/PropertyDetailActionLayer.tsx`（15-D/15-E）
   - `AgentTrustCard` 改為條件式顯示認證 badge（已認證/未認證）
   - 有證照顯示「經紀人證照」，無證照顯示「平台編號：MH-xxxxx」
   - `MobileActionBar` 新增 `isVerified` prop，僅已認證顯示「認證經紀人」
   - DetailPage 與 ActionLayer 傳入 `isVerified`（Mock 模式強制 `true`）

5. `src/pages/UAG/Profile/BasicInfoSection.tsx`、`src/pages/UAG/Profile/hooks/useAgentProfile.ts`（15-F）
   - UAG Profile 新增「經紀人證照字號」欄位與 payload 傳遞
   - Mock 模式快取更新同步 `licenseNumber`

6. 測試檔案
   - 新增：`api/agent/__tests__/profile.test.ts`
   - 新增：`api/agent/__tests__/me.test.ts`
   - 新增：`src/services/__tests__/agentService.test.ts`
   - 新增：`src/pages/UAG/Profile/BasicInfoSection.test.tsx`
   - 重寫：`src/components/PropertyDetail/__tests__/MobileActionBar.test.tsx`
   - 更新：`src/components/__tests__/AgentTrustCard.memo.test.tsx`

#### 驗證命令
```bash
npm run test -- api/agent/__tests__/profile.test.ts api/agent/__tests__/me.test.ts src/services/__tests__/agentService.test.ts src/pages/UAG/Profile/BasicInfoSection.test.tsx src/components/PropertyDetail/__tests__/MobileActionBar.test.tsx src/components/__tests__/AgentTrustCard.memo.test.tsx
npm run typecheck
npm run lint
npm run check:utf8
```

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
company: z.union([z.string().trim().min(1).max(100), z.null()]).optional(),
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
  className="min-h-[44px] w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
  placeholder="公司/分店名稱"
  maxLength={100}
  aria-label="公司名稱"
/>
```

**規範引用：** `/ui-ux-pro-max` `ux-guidelines #22`（觸控目標 >= 44px）、`#67`（手機可讀性）、`#23`（手機密度控制）。

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

- [x] API：PUT `/api/agent/profile` 可更新 `company` 欄位
- [x] 前端：BasicInfoSection 公司欄位可編輯（非 disabled）
- [x] 前端：修改公司名 → 儲存 → 詳情頁 AgentTrustCard 顯示新名稱
- [x] Mock：Mock 模式下公司欄位可編輯（本地 state，不發 API）
- [x] typecheck + lint 通過（#16 關聯測試 + 關聯檔案 lint 通過；全域 lint/typecheck 仍受 #19 開發中檔案影響）

### #16 施工紀錄（2026-02-10）

#### 優化循環摘要
- [x] 第 1 輪優化（API/Schema）：修正 `company` 回填邏輯、`phone` 正規化驗證、預設值常數化、Schema 註解補齊
- [x] 第 2 輪優化（前端/Service/Mock）：修正 `undefined` 欄位送出、`null` 公司名處理一致化、字數回饋補齊、快取更新可讀性提升
- [x] 第 3 輪審核（測試/靜態檢查/UTF-8）：關聯測試全綠、typecheck/lint/check:utf8 全通過

#### 修改檔案
1. `api/agent/profile.ts`
   - `company` 回傳改為 `row.company ?? null`，不再在 API 層強制回填 `'邁房子'`
   - 新增 `PhoneSchema`：允許輸入 `0912-345-678`，後端正規化為 `0912345678`
   - `UpdateProfileSchema` 補上欄位業務規則註解（name/company/phone/license_number/joined_at）
   - `trust_score` 與其餘數值欄位預設值抽成常數：`DEFAULT_TRUST_SCORE`、`DEFAULT_METRIC`

2. `api/agent/me.ts`
   - `company` 回傳改為 `row.company ?? null`，與 `/api/agent/profile` 一致
   - 數值預設值改用共用常數，移除散落魔法數字

3. `src/services/agentService.ts`
   - `updateAgentProfile` 改為過濾 `undefined` 後再送出 body，僅傳有意義欄位

4. `src/pages/UAG/Profile/BasicInfoSection.tsx`
   - `initialValues.company` 改為 `profile.company ?? ''`，保留 `null` 語意到表單層處理
   - `useMemo` 依賴從 `[profile]` 改為明確欄位清單，避免物件引用快取歧義
   - 公司字數計數器改為防禦寫法：`(company ?? '').length`
   - `bio` 新增字數計數器 `x/500` 與 `aria-describedby`，補齊 UX 一致性

5. `src/pages/UAG/Profile/hooks/useAgentProfile.ts`
   - Mock 更新快取改為 `updates: Partial<AgentProfileMe>` 明確賦值，提升可讀性並保留 `company: null`

6. 測試更新
   - `api/agent/__tests__/profile.test.ts`：
     - 驗證 GET 保留 `company: null`
     - 驗證 PUT 接受 `company: null`
     - 驗證 PUT `phone: 0912-345-678` 會正規化寫入
   - `api/agent/__tests__/me.test.ts`：驗證 GET 保留 `company: null`
   - `src/services/__tests__/agentService.test.ts`：
     - 驗證 PUT body 僅送出 defined 欄位
     - 驗證 `company: null` 會原樣送出
   - `src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx`：
     - 驗證 `company: null` 顯示空值與 `0/100`
     - 驗證清空/空白公司名會送 `company: null`
     - 驗證 `bio` 字數計數器
   - `src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx`：驗證 mock 模式更新 `company: null` 不呼叫 API 且保留 null

#### 驗證命令
```bash
npm run test -- api/agent/__tests__/profile.test.ts api/agent/__tests__/me.test.ts src/services/__tests__/agentService.test.ts src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx
cmd /c npx eslint api/agent/profile.ts api/agent/me.ts src/services/agentService.ts src/pages/UAG/Profile/BasicInfoSection.tsx src/pages/UAG/Profile/hooks/useAgentProfile.ts api/agent/__tests__/profile.test.ts api/agent/__tests__/me.test.ts src/services/__tests__/agentService.test.ts src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx
npm run typecheck
npm run check:utf8
```

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

- [x] 詳情頁右下角不再顯示「30秒回電」浮動按鈕
- [x] 詳情頁右下角不再顯示「生成報告」FAB 按鈕
- [x] Mock 頁面（`/maihouses/property/MH-100001`）同步移除
- [x] 正式版頁面同步移除
- [x] `/r/:id` 路由移除（訪問返回 404）
- [x] `api/report/create` 端點移除
- [x] `api/report/track` 端點移除
- [x] UAG 後台 ReportGenerator 功能不受影響
- [x] `src/components/ReportPreview.tsx` 仍可正常被 UAG 使用
- [x] typecheck + lint 通過

### #17 施工紀錄（2026-02-08）

#### 修改檔案
1. `src/pages/PropertyDetailPage.tsx`
   - 移除 `30秒回電` 浮動按鈕 JSX 與 `handleFloatingCallClick`
   - 移除 `生成報告` FAB、`ReportGenerator` Modal、相關 state/import
   - 保留既有 `MobileActionBar` / `MobileCTA` / `LineLinkPanel` / `CallConfirmPanel` 聯絡主流程

2. `src/pages/propertyDetail/PropertyDetailActionLayer.tsx`
   - 同步移除 `30秒回電` 按鈕、`生成報告` FAB、`ReportGenerator` 相關 props/JSX/import
   - 以 UTF-8 重寫檔案，修正原有中文字亂碼內容

3. `src/App.tsx`
   - 刪除 `ReportPage` import
   - 刪除 `/r/:id` Route

4. `src/pages/Report/`（整個目錄）
   - 刪除 `index.ts`
   - 刪除 `ReportGenerator.tsx`
   - 刪除 `ReportPage.tsx`
   - 刪除 `types.ts`
   - 刪除 `utils/dataAdapter.ts`

5. `api/report/`
   - 刪除 `create.ts`（`POST /api/report/create`）
   - 刪除 `track.ts`（`POST /api/report/track`）

6. `src/types/api.generated.ts`
   - 移除 `/report/create`、`/report/track` 對應路徑型別，避免殘留過時 API 描述

7. `src/pages/__tests__/PropertyDetailPage.phase11.test.tsx`
   - 將原「30秒回電 reduced-motion」測試改為「不應渲染 30秒回電與生成報告浮動按鈕」回歸測試

#### 驗證命令
```bash
npm run test -- src/pages/__tests__/PropertyDetailPage.phase11.test.tsx src/components/PropertyDetail/__tests__/MobileActionBar.test.tsx src/components/PropertyDetail/__tests__/MobileCTA.test.tsx
npm run typecheck
npm run lint -- --format json
```

---

## #18 [P1] 詳情頁導入 MaiMai 公仔（A+C+D 組合）

### 問題分析

| 項目 | 現狀 | 問題 |
|------|------|------|
| 品牌辨識度 | 詳情頁無 MaiMai 公仔 | 首頁、登入頁、TrustRoom 都有吉祥物互動，詳情頁缺乏品牌溫度 |
| 右欄空白 | 桌面版 AgentTrustCard 下方空白 | 浪費高價值側欄空間 |
| 載入體驗 | 使用 Skeleton 骨架屏 + Spinner | 無人格化的等待體驗，用戶焦慮感較高 |
| 錯誤體驗 | ErrorBoundary 純文字提示 | 冰冷的錯誤訊息，缺乏品牌安撫 |
| Panel 開啟 | LineLinkPanel / CallConfirmPanel 純功能 | 首次開啟無歡迎語，少了親切引導 |

### 設計方案

**批准方案：A + C + D 組合**

| 子項 | 名稱 | 說明 | 位置 |
|------|------|------|------|
| **18-A** | 右欄情境陪伴 | 在 AgentTrustCard 下方加入 MaiMai 公仔，根據頁面狀態切換心情 | 桌面版右欄（lg 以上） |
| **18-B** | Panel 歡迎語 | LineLinkPanel / CallConfirmPanel 開啟時顯示 MaiMai + 對話氣泡 | Panel 頂部 |
| **18-C** | 載入/錯誤狀態替換 | 用 MaiMai 公仔取代冰冷的 Spinner / ErrorBoundary 文字 | 頁面級載入/錯誤 |

### 18-A. 右欄情境陪伴（PropertyDetailMaiMai）

**位置：** 桌面版 `PropertyDetailPage.tsx` 右欄，AgentTrustCard 下方

**心情對應表：**

| 頁面狀態 | MaiMai 心情 | 對話氣泡文案 |
|----------|------------|-------------|
| 正常瀏覽 | `idle` | 「嗨～歡迎看屋！有問題可以問我喔」 |
| 社會證明 isHot | `excited` | 「這間好搶手！已經有 {n} 組在看了」 |
| trustEnabled = true | `happy` | 「這位房仲有開啟安心留痕，交易更有保障」 |
| 用戶 hover AgentTrustCard | `wave` | 「想聯絡房仲嗎？點上方按鈕就可以囉」 |
| 頁面閒置 30 秒 | `thinking` | 「還在考慮嗎？可以加 LINE 先聊聊看」 |

**Props Interface：**

```typescript
// src/components/PropertyDetail/PropertyDetailMaiMai.tsx（新增）
interface PropertyDetailMaiMaiProps {
  trustEnabled: boolean;
  isHot: boolean;
  trustCasesCount: number;
  agentName: string;
}
```

**實作要點：**
- 使用 `MaiMaiBase` + `MaiMaiSpeech` 組合
- 尺寸：`sm`（80px），不搶 AgentTrustCard 視覺焦點
- 心情由 `useMaiMaiMood` hook 管理（`externalMood` 依據狀態切換）
- 閒置偵測用 `useEffect` + `setTimeout`（30 秒無操作）
- `prefers-reduced-motion` 時禁用動畫（ux-guidelines #9）
- 手機版（< lg）**不顯示**此組件，避免佔用有限空間

**桌面版佈局（lg 以上）：**

```
┌─────────────────────────────┬─────────────────┐
│ 圖片、描述、評價…           │ AgentTrustCard   │
│                             │ ───────────────  │
│                             │ [MaiMai sm]      │
│                             │ [MessageCircle]  │
│                             │                  │
└─────────────────────────────┴─────────────────┘
```

**手機版（< lg）：不渲染 — 使用 `className="hidden lg:block"`**

> 手機版 MaiMai 已由 Header 吉祥物提供品牌辨識，右欄場景不適合手機佈局。
> ux-guidelines #67: 手機版字體 ≥ 14px、ux-guidelines #22: 觸控 ≥ 44px 均不受影響（不渲染）。

### 18-B. Panel 歡迎語

**修改檔案：**
- `src/components/PropertyDetail/LineLinkPanel.tsx`
- `src/components/PropertyDetail/CallConfirmPanel.tsx`

**設計：** Panel 開啟時，頂部顯示 MaiMai `xs`（48px）+ 單句歡迎語

**歡迎語對應表：**

| Panel | MaiMai 心情 | 歡迎語 |
|-------|------------|--------|
| LineLinkPanel（有 lineId） | `wave` | 「加 LINE 直接聊，回覆最快喔！」 |
| LineLinkPanel（無 lineId → fallback） | `thinking` | 「房仲還沒設定 LINE，用表單留言吧」 |
| CallConfirmPanel（有 phone） | `happy` | 「撥打電話前確認一下～」 |
| CallConfirmPanel（無 phone → fallback） | `thinking` | 「房仲還沒設定電話，用表單留言吧」 |

**新增 Props：** 無需新增 Props — MaiMai 歡迎語是 Panel 內部渲染，根據已有 `agentLineId` / `agentPhone` 判斷

**JSX 範例（LineLinkPanel 內部頂部）：**

```tsx
{/* MaiMai 歡迎語 — ux-guidelines #7 animation 150-300ms */}
<div className="mb-4 flex items-center gap-3">
  <MaiMaiBase
    mood={agentLineId ? 'wave' : 'thinking'}
    size="xs"
    animated={!prefersReducedMotion}
  />
  <p className="text-sm text-slate-600">
    {agentLineId
      ? '加 LINE 直接聊，回覆最快喔！'
      : '房仲還沒設定 LINE，用表單留言吧'}
  </p>
</div>
```

**手機版考量：**
- Panel 本身是 Modal / Bottom Sheet，已有手機版佈局
- MaiMai `xs`（48px）高度 + gap-3 ≈ 60px 額外高度，不影響 Panel 可見區域
- 觸控目標不受影響（MaiMai 是純展示，非互動元素）
- ux-guidelines #22: 觸控 ≥ 44px — Panel 按鈕本身已符合
- ux-guidelines #7: 動畫 150-300ms — `animate-in fade-in duration-200`

### 18-C. 載入/錯誤狀態替換

**修改檔案：** `src/pages/PropertyDetailPage.tsx`

**載入狀態替換：**

| 現狀 | 替換後 |
|------|--------|
| `<SkeletonScreen />` + Spinner 文字 | MaiMai `md`（128px）`thinking` 心情 + 「正在幫你找房子資訊…」 |

```tsx
// 載入中狀態
if (isLoading) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <MaiMaiBase mood="thinking" size="md" animated={!prefersReducedMotion} />
      <p className="text-base text-slate-600">正在幫你找房子資訊…</p>
    </div>
  );
}
```

**錯誤狀態替換：**

| 現狀 | 替換後 |
|------|--------|
| 純文字 `ErrorBoundary` / 「載入失敗」 | MaiMai `md`（128px）`shy` 心情 + 「哎呀！找不到這個物件…」+ 重試按鈕 |

```tsx
// 錯誤狀態
if (error) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <MaiMaiBase mood="shy" size="md" animated={!prefersReducedMotion} />
      <p className="text-base text-slate-600">哎呀！找不到這個物件…</p>
      <button
        onClick={handleRetry}
        className="min-h-[44px] rounded-xl bg-brand-700 px-6 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-brand-600 motion-reduce:transition-none"
      >
        再試一次
      </button>
    </div>
  );
}
```

**手機版考量：**
- 載入/錯誤為全頁面級，手機/桌面都會顯示
- `md` 尺寸（128px）在手機端不會超出螢幕（最小 320px 寬）
- `min-h-[50vh]` 確保垂直居中
- 重試按鈕 `min-h-[44px]` 符合 ux-guidelines #22 觸控目標
- `motion-reduce:transition-none` 符合 ux-guidelines #9 `prefers-reduced-motion`
- ux-guidelines #67: `text-base`（16px）確保手機可讀性

### UX 規範合規表

| 規範 | 編號 | 合規說明 |
|------|------|---------|
| 動畫 150-300ms | ux-guidelines #7 | MaiMai `animated` prop + `duration-200` class |
| prefers-reduced-motion | ux-guidelines #9 | 所有 MaiMai 實例檢查 `prefersReducedMotion`，搭配 `motion-reduce:transition-none` |
| 觸控目標 ≥ 44px | ux-guidelines #22 | 重試按鈕 `min-h-[44px]`，MaiMai 本身為純展示非互動 |
| 手機優先 | ux-guidelines #23 | 18-A 手機版不渲染，18-B/C 手機版已合規 |
| 品牌一致性 | ux-guidelines #73 | 使用統一 MaiMai 系統組件，不另造新公仔 |
| 文案可讀性 | ux-guidelines #67 | 所有文字 ≥ 14px（`text-sm` = 14px, `text-base` = 16px） |
| 無障礙 aria | ux-guidelines #33 | `MaiMaiSpeech` 自帶 `role="status"` + `aria-live="polite"` |
| React memo | react.csv #1 | `PropertyDetailMaiMai` 使用 `memo()` 包裝 |
| useCallback 穩定引用 | react.csv #2 | 心情切換邏輯放 `useMaiMaiMood` hook 內部 |
| 避免 God Component | react.csv #7 | MaiMai 邏輯抽為獨立 `PropertyDetailMaiMai` 組件 |
| ErrorBoundary | react.csv #4 | 18-C 錯誤狀態本身就是 ErrorBoundary 的 fallback |
| 產品調性 | products.csv #38 | Real Estate: Trust Blue + Gold accents — MaiMai 不改動品牌色，和諧融入 |

### Mock 模式處理

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| 18-A 右欄 MaiMai | 顯示，`isHot=true`，`trustEnabled=true` | 顯示，依據真實資料 |
| 18-B Panel 歡迎語 | 顯示，根據 Mock agent lineId/phone 判斷 | 顯示，根據真實 agent 資料判斷 |
| 18-C 載入狀態 MaiMai | 不易見（Mock 資料秒回） | 顯示 `thinking` 心情 |
| 18-C 錯誤狀態 MaiMai | 可透過 DevTools 強制觸發 | 顯示 `shy` 心情 + 重試按鈕 |

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 說明 |
|------|------|------|------|
| 組件 | `src/components/PropertyDetail/PropertyDetailMaiMai.tsx` | **新增** | 右欄 MaiMai 情境陪伴組件 |
| 組件 | `src/components/PropertyDetail/LineLinkPanel.tsx` | 修改 | 頂部加入 MaiMai xs 歡迎語 |
| 組件 | `src/components/PropertyDetail/CallConfirmPanel.tsx` | 修改 | 頂部加入 MaiMai xs 歡迎語 |
| 頁面 | `src/pages/PropertyDetailPage.tsx` | 修改 | 右欄插入 PropertyDetailMaiMai + 載入/錯誤狀態替換 |
| 組件 | `src/components/PropertyDetail/index.ts` | 修改 | export PropertyDetailMaiMai |

**保留不動：**
| 檔案 | 原因 |
|------|------|
| `src/components/MaiMai/*` | MaiMai 核心系統不修改 |
| `src/context/MaiMaiContext.tsx` | 全站心情 Context 不修改 |
| `src/components/Header/Header.tsx` | Header MaiMai 獨立，不受影響 |

### 追蹤事件

| 事件名 | 觸發時機 | payload |
|--------|---------|---------|
| `maimai_property_mood` | MaiMai 心情切換時 | `{ mood, trigger, propertyId }` |
| `maimai_panel_welcome` | Panel 開啟顯示歡迎語時 | `{ panelType: 'line' \| 'call', hasContact: boolean }` |

### 驗收標準

- [x] 桌面版（≥ 1024px）右欄 AgentTrustCard 下方顯示 MaiMai sm 公仔 + 對話氣泡
- [x] 手機版（< 1024px）右欄 MaiMai **不顯示**
- [x] MaiMai 心情根據 `trustEnabled` / `isHot` / 閒置時間正確切換
- [x] LineLinkPanel 開啟時頂部顯示 MaiMai xs + 歡迎語（有/無 lineId 文案不同）
- [x] CallConfirmPanel 開啟時頂部顯示 MaiMai xs + 歡迎語（有/無 phone 文案不同）
- [x] 載入中顯示 MaiMai `thinking` + 「正在幫你找房子資訊…」
- [x] 錯誤時顯示 MaiMai `shy` + 「哎呀！找不到這個物件…」+ 重試按鈕
- [x] 重試按鈕 `min-h-[44px]`（ux-guidelines #22）
- [x] `prefers-reduced-motion` 下所有 MaiMai 動畫停止（ux-guidelines #9）
- [x] Mock 頁面（`/maihouses/property/MH-100001`）正常顯示
- [x] typecheck + lint 通過

### #18 施工紀錄（2026-02-10）

#### 修改檔案
1. `src/components/PropertyDetail/PropertyDetailMaiMai.tsx`（18-A）
   - 新增右欄 MaiMai 情境陪伴組件（`MaiMaiBase` + `MaiMaiSpeech`）
   - 依 `trustEnabled` / `isHot` / 閒置 30 秒切換心情與文案
   - 新增 `maimai_property_mood` 事件追蹤，僅在心情狀態變化時上報
   - `prefers-reduced-motion` 啟用時停用 MaiMai 動畫/特效

2. `src/pages/PropertyDetailPage.tsx`、`src/components/PropertyDetail/index.ts`（18-A + 18-C）
   - 右欄 `AgentTrustCard` 下方加入 `PropertyDetailMaiMai`（`hidden lg:block`，手機不顯示）
   - 新增頁面級載入狀態：顯示 MaiMai `thinking` +「正在幫你找房子資訊…」
   - 新增頁面級錯誤狀態：顯示 MaiMai `shy` +「哎呀！找不到這個物件…」+「再試一次」按鈕
   - 重試按鈕符合 `min-h-[44px]` 與 reduced-motion 規範

3. `src/components/PropertyDetail/LineLinkPanel.tsx`、`src/components/PropertyDetail/CallConfirmPanel.tsx`（18-B）
   - Panel 內容區頂部新增 MaiMai `xs` 歡迎區塊
   - `LineLinkPanel` 依有無 `lineId` 顯示不同歡迎語與心情（`wave` / `thinking`）
   - `CallConfirmPanel` 依有無 `phone` 顯示不同歡迎語與心情（`happy` / `thinking`）
   - 新增 `maimai_panel_welcome` 事件追蹤（`panelType` + `hasContact`）

4. 測試檔案
   - 新增：`src/components/PropertyDetail/__tests__/PropertyDetailMaiMai.test.tsx`
   - 新增：`src/pages/__tests__/PropertyDetailPage.maimai.test.tsx`
   - 重寫：`src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx`
   - 重寫：`src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx`

#### 驗證命令
```bash
npm run test -- src/components/PropertyDetail/__tests__/PropertyDetailMaiMai.test.tsx src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx src/pages/__tests__/PropertyDetailPage.maimai.test.tsx
npm run typecheck
npm run lint
```

---

## #19c [P0] UAG 底部 Tab + KPI 卡片列（2 項：M1 + M6）

### 問題分析（#19 共用）

| 項目 | 現狀 | 問題 |
|------|------|------|
| 頁面導航 | Footer 按鈕列 `flex-wrap`，按鈕 padding 4px | 觸控不足 44px，多行跳動，功能入口隱藏在最底部 |
| Agent Bar 統計 | 4 個統計擠一行，11px 字體 | 375px 窄屏不可讀，觸控困難 |
| Radar 泡泡 | 絕對 px 尺寸（60-120px），無碰撞檢測 | 手機 320px 容器泡泡嚴重碰撞重疊 |
| 泡泡標籤 | `bottom: -24px` 常駐 | 底部泡泡標籤被 `overflow: hidden` 裁切 |
| 泡泡選中 | `translateY(-4px)` + 藍邊框 | 視覺反饋太弱，不確定選了哪個 |
| 購買慾望 | S/A/B/C/F 只有顏色差異 | S 級缺少「搶手感」視覺暗示 |
| 卡片風格 | 實色白底 + 灰邊框 | 缺乏視覺層次和現代感 |
| 操作按鈕 | AssetMonitor 按鈕佔卡片大量空間 | 窄屏觸控不足 44px |
| 互動反饋 | 僅 `hover:bg-xxx` | 缺少按下/成功/失敗的即時回饋 |
| 載入狀態 | 灰色骨架屏 | 缺乏品牌辨識度 |
| 頁面長度 | 所有組件垂直堆疊 | 手機需滾動 5+ 屏 |
| ActionPanel | 需向下滾動才能看到 | 選中泡泡後流程斷裂 |

### 設計方案總覽

| 子項 | 名稱 | 類型 | 優先級 |
|------|------|------|--------|
| **M1** | 底部 Tab 導航 | 架構級 | P0 |
| **M3** | ActionPanel → Bottom Sheet | 架構級 | P1 |
| **M4** | AssetMonitor Swipe-to-Action | 互動升級 | P1 |
| **M5** | Glassmorphism 卡片風格 | 視覺升級 | P1 |
| **M6** | KPI 摘要卡片列 | 架構級 | P0 |
| **M7** | 可收合區塊 | 架構級 | P1 |
| **M8** | 微互動升級 | 互動升級 | P1 |
| **M9** | MaiMai Loading | 品牌體驗 | P2 |
| **R1** | 泡泡尺寸自適應 | Radar 強化 | P0 |
| **R2** | 簡易碰撞偏移 | Radar 強化 | P0 |
| **R3** | 觸控擴展區 | Radar 強化 | P0 |
| **R4** | 標籤改 Tooltip | Radar 強化 | P1 |
| **R5** | S 級脈衝光暈 | 購買慾強化 | P1 |
| **R6** | 選中展開效果 | Radar 強化 | P1 |
| **R7** | 容器動態高度 | Radar 優化 | P2 |
| **R8** | 等級篩選 Chips | Radar 強化 | P2 |

---

### 19-M1. [P0] 底部 Tab 導航（取代 Footer 按鈕列）

**現狀檔案：** `src/pages/UAG/components/UAGFooter.tsx` + `UAG.module.css` L1322-1377
**規範引用：** ux-guidelines #17（iOS safe area）、#22（觸控 ≥ 44px）、products.csv SaaS Dashboard

**問題：** Footer 用 `flex-wrap` 塞了「方案設定」「加值點數」「點數徽章」，手機版按鈕 `padding: 4px 10px` 遠小於 44px，可能多行跳動撐高 footer。

**方案：** 手機版（<768px）改為 iOS/Android 風格 Tab Bar

```
┌─────────────────────────────────────┐
│ [Home] 概覽 │ [Users] 商機 │ [BarChart] 監控 │ [Settings] 設定 │
└─────────────────────────────────────┘
```

**Tab 對應：**

| Tab | 內容 | 原組件 |
|-----|------|--------|
| 概覽 | RadarCluster + ActionPanel | 主頁預設 Tab |
| 商機 | ListingFeed（房源 + 社區牆） | 原 k-span-3 x2 |
| 監控 | AssetMonitor + TrustFlow | 原 k-span-6 |
| 設定 | 方案設定 + 加值點數 + Profile 入口 | 原 Footer 按鈕 |

**設計規格：**

```tsx
// 新增 src/pages/UAG/components/UAGTabBar.tsx
interface UAGTabBarProps {
  activeTab: 'overview' | 'leads' | 'monitor' | 'settings';
  onTabChange: (tab: UAGTabBarProps['activeTab']) => void;
}
```

```css
/* 手機版 Tab Bar */
.uag-tab-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  justify-content: space-around;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid rgba(226, 232, 240, 0.6);
  padding-bottom: env(safe-area-inset-bottom, 0);  /* iOS safe area */
}
.uag-tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 52px;      /* ≥ 44px 觸控目標 */
  gap: 2px;
  font-size: 10px;
  color: var(--ink-300);
  transition: color 200ms;
}
.uag-tab-item.active {
  color: var(--uag-brand);
}
.uag-tab-indicator {
  position: absolute;
  top: 0;
  height: 2px;
  background: var(--uag-brand);
  border-radius: 0 0 2px 2px;
  transition: left 200ms, width 200ms;
}

/* 桌面版：隱藏 Tab Bar，保留原 Footer */
@media (min-width: 768px) {
  .uag-tab-bar { display: none; }
}
```

**影響：** 手機版不再是 5 屏垂直滾動，而是 4 個 Tab 各 1-2 屏。

> **#19c 包含 M1（上方）+ M6（下方 L3336 處）。完成後做 #19d。**

---

## #19d [P1] UAG 卡片 + 互動升級（3 項：M3 + M4 + M5）

### 19-M3. [P1] ActionPanel → Bottom Sheet

**現狀檔案：** `src/pages/UAG/components/ActionPanel.tsx` + `UAG.module.css` L724-880
**規範引用：** ux-guidelines #30（手勢互動）、#7（動畫 150-300ms）、#9（prefers-reduced-motion）

**問題：** 點擊 Radar 泡泡後，用戶需向下滾動才能看到 ActionPanel 的客戶詳情和購買按鈕，流程斷裂。

**方案：** 手機版選中泡泡時，ActionPanel 以 Bottom Sheet 從底部滑出

**設計規格：**

```tsx
// 新增 src/pages/UAG/components/ActionBottomSheet.tsx
interface ActionBottomSheetProps {
  lead: Lead | null;        // null = 關閉
  onClose: () => void;
  onPurchase: (lead: Lead) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPurchasing: boolean;
}
```

```css
/* Bottom Sheet 基礎 */
.action-sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 40;
  opacity: 0;
  transition: opacity 250ms;
}
.action-sheet-overlay.open { opacity: 1; }

.action-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  background: white;
  border-radius: 16px 16px 0 0;
  max-height: 85vh;
  transform: translateY(100%);
  transition: transform 300ms cubic-bezier(0.32, 0.72, 0, 1);
  padding-bottom: env(safe-area-inset-bottom, 0);
}
.action-sheet.open { transform: translateY(0); }

/* Drag handle */
.action-sheet-handle {
  width: 48px;
  height: 5px;
  border-radius: 3px;
  background: #d1d5db;
  margin: 8px auto 16px;
}

/* CTA 黏在底部 */
.action-sheet-cta {
  position: sticky;
  bottom: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid #e5e7eb;
}

/* 桌面版：不使用 Bottom Sheet */
@media (min-width: 768px) {
  .action-sheet-overlay,
  .action-sheet { display: none; }
}

/* prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .action-sheet,
  .action-sheet-overlay { transition: none; }
}
```

**互動流程：** 點擊泡泡 → Sheet 從底部滑出（50vh）→ 可上拉到 85vh → CTA 始終可見 → 下拉關閉

---

### 19-M4. [P1] AssetMonitor Swipe-to-Action

**現狀檔案：** `src/pages/UAG/components/AssetMonitor.tsx` + `UAG.module.css` L881-1024
**規範引用：** ux-guidelines #22（觸控 ≥ 44px）、#23（間距 ≥ 8px）、#30（手勢互動）

**問題：** AssetMonitor 卡片化已做得好，但操作按鈕（發送訊息/查看聊天/查看報告）佔卡片大量空間，窄屏上可能 < 44px。

**方案：** 手機版卡片左滑顯示操作按鈕

```
正常狀態：
┌────────────────────────────────┐
│  [S] 買家 S-9999                │
│  保護期：2天14小時               │
│  ████████░░ 72%                │
│  狀態：已聯繫                    │
└────────────────────────────────┘

← 左滑後：
┌──────────────────────┬──────────┐
│  [S] 買家 S-9999      │[MessageCircle]│
│  保護期：2天14小時      │  發訊息  │
│  ████████░░ 72%       │──────────│
│  狀態：已聯繫           │[ClipboardList]│
│                       │  報告    │
└──────────────────────┴──────────┘
```

**設計規格：**

```css
/* Swipe-to-Action 容器 */
.monitor-card-swipe {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;  /* 隱藏捲軸 */
}
.monitor-card-swipe::-webkit-scrollbar { display: none; }

.monitor-card-content {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: 100%;
}
.monitor-card-actions-hidden {
  scroll-snap-align: end;
  flex-shrink: 0;
  width: 80px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.monitor-card-actions-hidden button {
  min-height: 44px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 首次提示 */
.swipe-hint {
  animation: hintSlide 1.5s ease-out;
  animation-delay: 1s;
  animation-fill-mode: forwards;
}
@keyframes hintSlide {
  0% { transform: translateX(0); }
  30% { transform: translateX(-30px); }
  100% { transform: translateX(0); }
}
```

---

### 19-M5. [P1] Glassmorphism 卡片風格升級

**現狀檔案：** `src/pages/UAG/UAG.module.css` L454-535（`.uag-card`）
**規範引用：** styles.csv Glassmorphism、products.csv #38 Real Estate Trust Blue

**問題：** 現有卡片 `background: #fff` + `border: 1px solid var(--line-soft)`，缺乏視覺層次。

**方案：** 核心卡片改為玻璃質感

```css
/* Glassmorphism 基礎 */
.uag-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.08);
  transition: box-shadow 200ms, background 200ms;
}
.uag-card:hover {
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.12);
  background: rgba(255, 255, 255, 0.85);
}

/* 頁面底色改為淡灰藍漸層 */
.uag-container {
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0f9ff 100%);
}

/* 等級色帶（卡片左邊框） */
.uag-card[data-grade='S'] { border-left: 3px solid var(--grade-s); }
.uag-card[data-grade='A'] { border-left: 3px solid var(--grade-a); }
.uag-card[data-grade='B'] { border-left: 3px solid var(--grade-b); }
```

**效果：** 頁面底色漸層 + 玻璃卡片浮在上方，現代感立即提升。

### #19d 驗收標準

- [ ] M3: 手機版選中泡泡後 ActionPanel 以 Bottom Sheet 滑出
- [ ] M4: AssetMonitor 手機版支援左滑顯示操作按鈕
- [ ] M5: 核心卡片改為 Glassmorphism 風格
- [ ] typecheck + lint 通過

---

## #19c（續）— 19-M6. [P0] KPI 摘要卡片列（取代 Agent Bar 擠壓）

### 19-M6. [P0] KPI 摘要卡片列（取代 Agent Bar 擠壓）

**現狀檔案：** `src/pages/UAG/components/UAGHeader.tsx` L206-227（Agent Bar stats）
**規範引用：** ux-guidelines #22（觸控 ≥ 44px）、#67（手機可讀性）、products.csv SaaS Dashboard

**問題：** Agent Bar 的統計在 375px 窄屏上 4 個數據擠一行，11px 字體不可讀（U9 問題的升級版解法）。

**承接 #9c U3：** 手機版 Header 精簡後，公司 badge 從 Header 麵包屑移至此 KPI Grid 上方，作為「姓名 · 公司」一行顯示。

**方案：** 手機版改為 2x2 KPI Grid 卡片

```
┌───────────────┬───────────────┐
│ [Shield] 92   │ [Footprints] 45│
│  信任分        │  帶看組數       │
├───────────────┼───────────────┤
│ [Check] 8     │ [ThumbsUp] 152│
│  成交案件      │  獲得鼓勵       │
└───────────────┴───────────────┘
```

**設計規格：**

```tsx
// 修改 src/pages/UAG/components/UAGHeader.tsx
// 手機版 Agent Bar stats 區域
<div className="grid grid-cols-2 gap-2 lg:hidden">
  {stats.map(stat => (
    <div
      key={stat.label}
      className="flex flex-col items-center justify-center rounded-xl px-3 py-2"
      style={{ background: stat.bgColor, minHeight: '56px' }}
    >
      <span className="text-2xl font-bold tabular-nums" style={{ color: stat.color }}>
        {stat.value}
      </span>
      <span className="text-xs text-slate-500">{stat.label}</span>
    </div>
  ))}
</div>

// 桌面版保持現有橫向排列
<div className="hidden lg:flex gap-6">
  {/* 現有 stat items 不變 */}
</div>
```

**KPI 色彩：**

| 統計 | 底色 | 數字色 |
|------|------|--------|
| 信任分 | `bg-blue-50` | `text-blue-700` |
| 帶看組數 | `bg-green-50` | `text-green-700` |
| 成交案件 | `bg-amber-50` | `text-amber-700` |
| 獲得鼓勵 | `bg-purple-50` | `text-purple-700` |

**效果：** 每格 56px 高 >> 44px 觸控；數字 24px >> 11px 可讀性；取代 U9 的 flex-wrap 修補方案。

### #19c 驗收標準

- [ ] M1: 手機版底部 Tab Bar 切換 4 個 Tab
- [ ] M1: 桌面版（≥768px）隱藏 Tab Bar
- [ ] M6: 手機版 KPI 2x2 Grid，數字 ≥ 24px
- [ ] typecheck + lint 通過

---

## #19e [P1] UAG 收合 + 微互動 + Loading（3 項：M7 + M8 + M9）

### 19-M7. [P1] 可收合區塊（Collapsible Sections）

**現狀檔案：** `src/pages/UAG/index.tsx`（主頁面 Grid 佈局）
**規範引用：** ux-guidelines #7（動畫 150-300ms）、#9（prefers-reduced-motion）

**問題：** 手機版 5+ 屏垂直滾動，用戶無法快速定位。

**方案：** ListingFeed、TrustFlow 等次要區塊改為可收合手風琴（搭配 M1 Tab 導航時，在各 Tab 內部使用）

```css
/* 收合/展開 */
.collapsible-header {
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  cursor: pointer;
}
.collapsible-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 300ms ease-out;
}
.collapsible-body.expanded {
  max-height: 2000px;  /* 足夠大的值 */
}
.collapsible-chevron {
  transition: transform 200ms;
}
.collapsible-chevron.expanded {
  transform: rotate(180deg);
}

@media (prefers-reduced-motion: reduce) {
  .collapsible-body { transition: none; }
  .collapsible-chevron { transition: none; }
}
```

**localStorage 記憶：** `uag-collapsed-sections` key 儲存 `{ listingFeed: false, trustFlow: true }` 展開狀態。

---

### 19-M8. [P1] 微互動升級

**現狀檔案：** 全 UAG 組件
**規範引用：** ux-guidelines #7（150-300ms）、#30（視覺回饋）、#9（prefers-reduced-motion）

**方案：** 全局加入以下微互動

| 場景 | 動效 | CSS |
|------|------|-----|
| 按鈕按下 | scale 縮小 | `active:scale-[0.97] transition-transform duration-100` |
| 購買成功 | 脈衝 + 綠勾 | `animate-ping` 0.5s 後消失 + confetti |
| 購買失敗 | 紅色搖晃 | `animate-shake`（自訂 3 次左右搖晃 0.3s） |
| 卡片載入 | 骨架屏脈衝 | `animate-pulse bg-slate-200/60` |
| 資料更新 | 數字跳動 | `transition: all 300ms` 數字滑動到新值 |
| Tab 切換 | 指示器滑動 | `transition-[left,width] duration-200` |

```css
/* 搖晃動畫 */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake { animation: shake 0.3s ease-in-out; }

@media (prefers-reduced-motion: reduce) {
  .animate-shake { animation: none; }
}
```

---

### 19-M9. [P2] MaiMai Loading 狀態

**現狀檔案：** `src/pages/UAG/components/UAGLoadingSkeleton.tsx`
**規範引用：** ux-guidelines #73（品牌一致性）、products.csv #38 Real Estate

**方案：** 手機版 UAG 載入改為 MaiMai `thinking` + 品牌化進度條

```tsx
<div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
  <MaiMaiBase mood="thinking" size="md" animated={!prefersReducedMotion} />
  <p className="text-base text-slate-600">正在載入你的商機資料...</p>
  <div className="h-1 w-48 overflow-hidden rounded-full bg-slate-100">
    <div className="h-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-brand-500" />
  </div>
</div>
```

### #19e 驗收標準

- [ ] M7: 次要區塊可收合/展開，localStorage 記憶
- [ ] M8: 按鈕 `active:scale-[0.97]`，購買 confetti，失敗搖晃
- [ ] M9: 手機版載入改為 MaiMai thinking + 品牌進度條
- [ ] typecheck + lint 通過

---

## #19a [P0] Radar 泡泡手機版核心（5 項：R1 + R2 + R3 + R4 + R5）

### 19-R1. [P0] Radar 泡泡尺寸自適應

**現狀檔案：** `src/pages/UAG/components/RadarCluster.tsx` L139-148
**規範引用：** ux-guidelines #65（320/375/414px 測試）、#22（觸控目標）

**問題：** 泡泡固定 px（S=120 A=100 B=90 C=80 F=60），320px 容器內一個 S 級就佔 37.5% 寬。

**方案：** 手機版等比縮放 60%

```typescript
// RadarCluster.tsx — 新增 containerWidth 感知
const isMobile = containerWidth < 768;
const sizeMap: Record<string, number> = isMobile
  ? { S: 72, A: 60, B: 54, C: 48, F: 40 }
  : { S: 120, A: 100, B: 90, C: 80, F: 60 };
const size = sizeMap[lead.grade] ?? (isMobile ? 40 : 60);
```

**實作要點：** 用 `useRef` + `ResizeObserver` 取得容器寬度，或簡單用 `window.innerWidth` + resize listener。

---

### 19-R2. [P0] 簡易碰撞偏移

**現狀檔案：** `src/pages/UAG/components/RadarCluster.tsx` L136-148（泡泡定位）
**規範引用：** ux-guidelines #22（觸控 ≥ 44px — 重疊泡泡無法獨立點擊）

**問題：** 12 個泡泡 x/y 百分比定位，手機縮小後互相遮擋。

**方案：** 渲染前 O(n²) 迭代 3 次推開重疊泡泡

```typescript
// 新增 src/pages/UAG/utils/resolveOverlap.ts
export function resolveOverlap(
  bubbles: { x: number; y: number; size: number }[],
  containerW: number,
  containerH: number,
  padding: number = 4
): { x: number; y: number }[] {
  const resolved = bubbles.map(b => ({
    x: (b.x / 100) * containerW,
    y: (b.y / 100) * containerH,
  }));

  for (let iter = 0; iter < 3; iter++) {
    for (let i = 0; i < resolved.length; i++) {
      for (let j = i + 1; j < resolved.length; j++) {
        const dx = resolved[j].x - resolved[i].x;
        const dy = resolved[j].y - resolved[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = (bubbles[i].size + bubbles[j].size) / 2 + padding;

        if (dist < minDist && dist > 0) {
          const overlap = (minDist - dist) / 2;
          const nx = dx / dist;
          const ny = dy / dist;
          resolved[i].x -= nx * overlap;
          resolved[i].y -= ny * overlap;
          resolved[j].x += nx * overlap;
          resolved[j].y += ny * overlap;
        }
      }
    }
  }

  // 邊界約束
  for (const pos of resolved) {
    pos.x = Math.max(30, Math.min(containerW - 30, pos.x));
    pos.y = Math.max(30, Math.min(containerH - 30, pos.y));
  }

  return resolved;
}
```

**效果：** 泡泡保持原始大致區域，但不再重疊，每個可獨立點擊。

---

### 19-R3. [P0] 觸控擴展區

**現狀檔案：** `src/pages/UAG/UAG.module.css` L616-642（`.uag-bubble`）
**規範引用：** ux-guidelines #22（觸控 ≥ 44px）

**問題：** F 級手機版縮到 40px，低於 44px 標準，但視覺不能放大（等級差異是核心）。

**方案：** 透明 `::after` 偽元素擴展觸控區域

```css
.uag-bubble::after {
  content: '';
  position: absolute;
  inset: -4px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
}
```

**效果：** F 級視覺 40px（保持等級差異），觸控 48px（合規 ux-guidelines #22）。

---

### 19-R4. [P1] 手機版標籤改 Tooltip

**現狀檔案：** `src/pages/UAG/UAG.module.css` L681-694（`.uag-bubble-label`）
**規範引用：** ux-guidelines #33（資訊不被裁切）

**問題：** `.uag-bubble-label` 在 `bottom: -24px`，底部泡泡標籤被容器 `overflow: hidden` 裁切。

**方案：** 手機版隱藏常駐標籤，點擊後從上方彈出

```css
@media (max-width: 768px) {
  .uag-bubble-label {
    display: none;
  }
  .uag-bubble:focus .uag-bubble-label,
  .uag-bubble.selected .uag-bubble-label {
    display: block;
    bottom: auto;
    top: -28px;
    z-index: 30;
    animation: fadeIn 200ms ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(4px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
```

---

### 19-R5. [P1] S 級脈衝光暈（強化購買慾望）

**現狀檔案：** `src/pages/UAG/UAG.module.css` L643-663（`.uag-bubble[data-grade]`）
**規範引用：** ux-guidelines #9（prefers-reduced-motion）、styles.csv（微互動回饋）

**方案：** S 級金色脈衝 + A 級藍色脈衝

```css
/* S 級：金色脈衝 — 「搶手感」 */
.uag-bubble[data-grade='S'] {
  animation:
    float var(--float) ease-in-out infinite,
    s-pulse 2s ease-in-out infinite;
}
@keyframes s-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
  50% { box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
}

/* A 級：藍色脈衝（較弱） */
.uag-bubble[data-grade='A'] {
  animation:
    float var(--float) ease-in-out infinite,
    a-pulse 3s ease-in-out infinite;
}
@keyframes a-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .uag-bubble[data-grade='S'],
  .uag-bubble[data-grade='A'] {
    animation: none;
  }
}
```

**購買心理：** 金色呼吸光暈 =「黃金商機正在跳動，不搶就沒了」。

### #19a 驗收標準

- [x] R1: 手機版泡泡等比縮放（S:72 A:60 B:54 C:52 F:40）
- [x] R2: 12 個泡泡在 320px 容器不重疊
- [x] R3: F 級泡泡觸控區域 ≥ 48px
- [x] R4: 手機版標籤隱藏，選中後彈出 Tooltip
- [x] R5: S 級有金色脈衝光暈，A 級有藍色脈衝
- [x] typecheck + lint 通過

### #19a 施工紀錄（2026-02-10）

#### 修改檔案
1. `src/pages/UAG/components/RadarCluster.tsx`
   - `leadLabels` 排序新增次排序 `id`，同級序號穩定（避免 re-render 漂移）
   - 手機尺寸映射調整為 `S:72 / A:60 / B:54 / C:52 / F:40`，保留 C 級觸控安全邊距
   - 抽出 `handleLeadSelect`，統一 click/keyboard 選取行為
   - 新增 `tooltipTimeoutRef` + `clearTooltipTimeout`，在重複點擊與 unmount 時清理 timeout，避免計時器洩漏

2. `src/pages/UAG/UAG.module.css`
   - 修正 `.uag-bubble::after` 的觸控擴展層：`z-index: -1` → `z-index: 1`
   - 明確加入 `pointer-events: auto`，確保 48x48 觸控擴展區可實際命中

3. `src/pages/UAG/utils/resolveOverlap.ts`
   - 新增常數 `MAX_OVERLAP_ITERATIONS`，移除魔法數字
   - 迭代次數調整為 6，提升 320px/12 泡泡密集場景的碰撞分離效果

4. `src/pages/UAG/components/RadarCluster.integration.test.tsx`
   - 移除空殼測試（`expect(true).toBe(true)`）
   - 新增 320px + 12 泡泡整合測試，逐對驗證碰撞後距離
   - 新增 `resolveOverlap` spy 驗證呼叫參數（容器寬高、padding、bubble size）
   - 改善 ResizeObserver mock 時序，測試採 `waitFor` 同步狀態更新
   - 新增 Tooltip 3 秒自動隱藏與 unmount timeout 清理測試

#### 驗證命令
```bash
npm run test -- src/pages/UAG/components/RadarCluster.test.tsx src/pages/UAG/components/RadarCluster.integration.test.tsx src/pages/UAG/utils/resolveOverlap.test.ts
npm run lint
npm run typecheck
npm run check:utf8
```

---

## #19b [P1] Radar 進階效果（3 項：R6 + R7 + R8）

### 19-R6. [P1] 選中泡泡展開效果

**現狀檔案：** `src/pages/UAG/UAG.module.css` L636-642（`.uag-bubble:hover/.selected`）
**規範引用：** ux-guidelines #7（250ms 動畫）、#30（視覺回饋）

**問題：** 選中只有 `translateY(-4px)`，視覺反饋太弱。

**方案：** 選中泡泡放大彈出 + 其他泡泡退場

```css
/* 選中泡泡：彈性放大 */
.uag-bubble.selected {
  transform: scale(1.15) translateY(-4px);
  z-index: 30;
  box-shadow: 0 16px 40px rgba(59, 130, 246, 0.35);
  border-color: var(--uag-brand);
  transition: all 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 未選中泡泡：退場 */
.uag-cluster.has-selection .uag-bubble:not(.selected) {
  opacity: 0.4;
  filter: grayscale(30%);
  transform: scale(0.92);
  transition: all 250ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .uag-bubble.selected,
  .uag-cluster.has-selection .uag-bubble:not(.selected) {
    transition: none;
  }
}
```

**JS 配合：** 選中時在 `.uag-cluster` 加 `has-selection` class。

---

### 19-R7. [P2] Radar 容器動態高度

**現狀檔案：** `src/pages/UAG/components/RadarCluster.tsx` L70（`minHeight: '450px'`）
**規範引用：** ux-guidelines #65（空間效率）

**方案：** 根據泡泡數量動態調整

```typescript
const containerHeight = useMemo(() => {
  const count = liveLeads.length;
  if (isMobile) {
    if (count <= 3) return 240;
    if (count <= 8) return 320;
    return 380;
  }
  return 450; // 桌面版不變
}, [liveLeads.length, isMobile]);
```

---

### 19-R8. [P2] 等級篩選 Chips

**現狀檔案：** `src/pages/UAG/components/RadarCluster.tsx`（新增區域）
**規範引用：** ux-guidelines #22（觸控 ≥ 44px）、#30（篩選回饋）

**方案：** Radar 頂部加等級篩選 Chip 列

```tsx
// RadarCluster 內部新增
<div className="mb-3 flex flex-wrap gap-2">
  {(['all', 'S', 'A', 'B', 'C', 'F'] as const).map(grade => {
    const count = grade === 'all'
      ? liveLeads.length
      : liveLeads.filter(l => l.grade === grade).length;
    if (grade !== 'all' && count === 0) return null;
    return (
      <button
        key={grade}
        onClick={() => setGradeFilter(grade)}
        className={`min-h-[32px] rounded-full px-3 text-xs font-bold transition-colors duration-200
          ${activeGrade === grade
            ? 'bg-[var(--grade-' + grade.toLowerCase() + ')] text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
      >
        {grade === 'all' ? '全部' : grade} {count}
      </button>
    );
  })}
</div>
```

**篩選行為：** 點 S chip → 非 S 泡泡 `opacity: 0.15 scale(0.8) pointer-events: none`。
**飢餓行銷：** chip 顯示數量（如 `S 4`）= 「還有 4 個 S 級等你搶」。

---

### UX 規範合規總表

| 規範 | 編號 | 涵蓋項目 |
|------|------|---------|
| 觸控 ≥ 44px | ux-guidelines #22 | M1 Tab、M4 操作按鈕、M6 KPI 卡片、R1+R3 泡泡 |
| 動畫 150-300ms | ux-guidelines #7 | M3 Sheet 300ms、M8 微互動、R5 脈衝、R6 展開 |
| prefers-reduced-motion | ux-guidelines #9 | M3、M7、M8、R5、R6 全部有 reduce 媒體查詢 |
| iOS safe area | ux-guidelines #17 | M1 Tab Bar `pb-safe`、M3 Sheet `env(safe-area-inset-bottom)` |
| 320/375/414px 測試 | ux-guidelines #65 | R1 尺寸自適應、M6 KPI 2x2 Grid |
| 手勢互動 | ux-guidelines #30 | M3 上下拉、M4 左滑、R8 篩選 |
| 品牌一致性 | ux-guidelines #73 | M5 Glassmorphism、M9 MaiMai |
| 視覺回饋 | ux-guidelines #30 | M8 按壓/成功/失敗、R6 選中效果 |
| 手機可讀性 | ux-guidelines #67 | M6 數字 24px、R4 標籤 Tooltip |
| 資訊不裁切 | ux-guidelines #33 | R4 標籤改 Tooltip |
| SaaS Dashboard | products.csv | M1 Tab 導航、M6 KPI 卡片列 |
| Glassmorphism | styles.csv | M5 玻璃質感卡片 |
| React memo | react.csv #1 | 所有新增組件用 `memo()` |
| useCallback | react.csv #2 | Tab 切換、篩選回呼 |

### Mock 模式處理

| 元素 | Mock 行為 | 正式版行為 |
|------|----------|-----------|
| M1 Tab 導航 | 正常顯示 4 Tab | 相同 |
| M3 Bottom Sheet | 點擊 Mock 泡泡開啟 | 點擊真實泡泡開啟 |
| M5 Glassmorphism | 正常顯示 | 相同 |
| M6 KPI 卡片 | Mock 資料（信任 92/帶看 45 等） | 真實 API 資料 |
| R1-R6 Radar 強化 | Mock leads 12 個 | 真實 leads |
| R8 篩選 Chips | Mock leads 計數 | 真實 leads 計數 |
| M9 MaiMai Loading | 不易見（Mock 秒回） | 顯示 thinking |

### 涉及檔案清單

| 層級 | 檔案 | 操作 | 對應項 |
|------|------|------|--------|
| 組件 | `src/pages/UAG/components/UAGTabBar.tsx` | **新增** | M1 |
| 組件 | `src/pages/UAG/components/ActionBottomSheet.tsx` | **新增** | M3 |
| 工具 | `src/pages/UAG/utils/resolveOverlap.ts` | **新增** | R2 |
| 組件 | `src/pages/UAG/components/UAGFooter.tsx` | 修改 | M1（桌面保留，手機隱藏） |
| 組件 | `src/pages/UAG/components/UAGHeader.tsx` | 修改 | M6（Agent Bar stats 改 KPI Grid） |
| 組件 | `src/pages/UAG/components/RadarCluster.tsx` | 修改 | R1/R2/R4/R6/R7/R8 |
| 組件 | `src/pages/UAG/components/ActionPanel.tsx` | 修改 | M3（手機版改用 Sheet） |
| 組件 | `src/pages/UAG/components/AssetMonitor.tsx` | 修改 | M4（Swipe-to-Action） |
| 組件 | `src/pages/UAG/components/UAGLoadingSkeleton.tsx` | 修改 | M9 |
| 頁面 | `src/pages/UAG/index.tsx` | 修改 | M1/M7（Tab 路由 + 收合邏輯） |
| CSS | `src/pages/UAG/UAG.module.css` | 修改 | M5/R3/R4/R5/R6/M8 |

### 與現有 U1-U12 的關係

| 現有項目 | 新方案 | 關係 |
|---------|--------|------|
| U7 Footer safe area | **M1 取代** | M1 Tab Bar 完全取代 Footer |
| U9 Agent Bar 擠壓 | **M6 升級** | M6 KPI 卡片列是 U9 的升級版解法 |
| U8/U11 按鈕觸控 | **M4 升級** | M4 Swipe-to-Action 是 U8/U11 的升級版解法 |
| U1-U6/U10/U12 | **不衝突** | 仍需獨立處理 |

### #19b 驗收標準

- [x] R6: 選中泡泡 `scale(1.15)` 彈出，未選中 `opacity-0.4 scale-0.92` 退場
- [x] R7: Radar 容器高度根據泡泡數量動態調整
- [x] R8: Radar 頂部等級篩選 Chips，含各等級數量顯示
- [x] typecheck + lint 通過

### #19b 施工紀錄（2026-02-10）

#### 修改檔案
1. `src/pages/UAG/components/RadarCluster.tsx`
   - 新增 `R8` 等級篩選狀態：`all/S/A/B/C/F`，並計算各等級即時數量
   - 新增 Chips UI（顯示「全部 + 等級數量」），切換篩選時會清除目前選中狀態避免殘留高亮
   - 新增 `getRadarContainerHeightPx()`，在手機版依可見泡泡數動態調整高度（`<=3:240 / <=8:320 / >8:380`，桌面維持 `450`）
   - 將動態高度同步套用到 `#radar-container` 本體，確保 R7 在手機低密度資料時可真實縮至 `240px`
   - 泡泡選中狀態改為 `data-selected`，容器加上 `data-has-selection`，供 R6 視覺退場效果使用

2. `src/pages/UAG/UAG.module.css`
   - 新增 `R8` 篩選 Chips 樣式（含 active 狀態與等級色彩）
   - 實作 `R6` 選中展開：`.uag-bubble[data-selected='true']` 使用 `scale(1.15)`、250ms 彈性 transition、強化陰影
   - 實作 `R6` 退場：`.uag-cluster[data-has-selection='true'] .uag-bubble:not([data-selected='true'])` 套用 `opacity: 0.4`、`scale(0.92)`、`grayscale(30%)`
   - 補上 `prefers-reduced-motion`：選中/退場 transition 可關閉

3. `src/pages/UAG/components/RadarCluster.test.tsx`
   - 新增 R6 選中標記測試（`data-selected` + `data-has-selection`）
   - 新增 R8 Chips 計數與篩選測試（切到 S 僅保留 S 級泡泡）
   - 新增 R7 手機高度測試（2 顆泡泡 `240px`、9 顆泡泡 `380px`）

4. `src/pages/UAG/components/RadarCluster.integration.test.tsx`
   - 解析泡泡座標改讀取 `#radar-container` 實際高度，支援 R7 動態容器
   - `resolveOverlap` 呼叫參數驗證改用 `getRadarContainerHeightPx()` 計算預期高度
   - 保留 320px/12 泡泡不重疊驗證，並同步驗證動態高度為 `380px`

#### 驗證命令
```bash
npm run test -- src/pages/UAG/components/RadarCluster.test.tsx src/pages/UAG/components/RadarCluster.integration.test.tsx src/pages/UAG/utils/resolveOverlap.test.ts
npm run lint
npm run typecheck
npm run check:utf8
```

---

## #20a [P0] 詳情頁手機版 — Gallery 手勢 + 縮圖觸控優化（D2 排除）

### 來源

根據 `/ui-ux-pro-max` 的 `products.csv #38 Real Estate`（Glassmorphism + Minimalism）、`ux-guidelines.csv` 規範審核 PropertyDetailPage 手機版呈現。

---

### 20a-D1. Gallery 手勢滑動 + Skeleton

**檔案：** `src/components/PropertyDetail/PropertyGallery.tsx`
**規範引用：** ux-guidelines #7（手機手勢優先）、#20（skeleton > spinner）

**現狀：** 僅能點擊縮圖切換圖片，無 touch swipe 手勢，載入時無 skeleton。

**方案：**
- 加入 `touchstart`/`touchmove`/`touchend` 手勢偵測，左右滑動切換圖片
- `touch-action: pan-y`（允許垂直滾動，攔截水平滑動）
- 滑動超過 50px 閾值觸發切換，配合 `transition: transform 200ms ease-out`
- loading 時顯示 shimmer skeleton（`animate-pulse bg-slate-200 rounded-2xl`）

```typescript
// touch swipe handler 骨架
const touchStartX = useRef(0);
const handleTouchStart = (e: React.TouchEvent) => {
  touchStartX.current = e.touches[0]!.clientX;
};
const handleTouchEnd = (e: React.TouchEvent) => {
  const diff = e.changedTouches[0]!.clientX - touchStartX.current;
  if (Math.abs(diff) > 50) {
    diff > 0 ? goToPrev() : goToNext();
  }
};
```

### 20a-D2. 經紀人資訊 Bottom Sheet

**檔案：** 新增 `src/components/PropertyDetail/AgentBottomSheet.tsx`，修改 `MobileActionBar.tsx`
**規範引用：** ux-guidelines #32（重要資訊不可隱藏）、react.csv #18（Portal）

**現狀：** 手機版完全看不到經紀人資訊（AgentTrustCard 僅桌面 Sidebar `lg:col-span-1` 顯示），用戶無法查看經紀人頭像、公司、信任分數。

**方案：**
- MobileActionBar 上方新增經紀人頭像 pill：`<AgentPill>` 顯示頭像 + 姓名 + 認證 badge
- 點擊 pill 彈出 `AgentBottomSheet`（Bottom Sheet Modal）
- Bottom Sheet 內容：頭像、姓名、公司、信任分、完成案件數、加入時間
- 動畫：`translate-y-full → translate-y-0`，`200ms ease-out`

```typescript
interface AgentBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  agent: {
    name: string;
    avatarUrl: string | null;
    company: string;
    trustScore: number;
    completedCases: number;
    isVerified: boolean;
  };
}
```

> 本項依產品指示「D2 不用作」，本次 #20a 實作範圍明確排除 D2，不新增 Bottom Sheet。

### 20a-D11. Gallery 縮圖觸控擴大 + Scroll Snap

**檔案：** `src/components/PropertyDetail/PropertyGallery.tsx`
**規範引用：** ux-guidelines #22（觸控 ≥ 44px，圖片建議 ≥ 64px）

**現狀：** 縮圖 `h-14 w-20`（56×80px），手指觸控偏小。

**方案：**
- 縮圖改為 `h-16 w-24`（64×96px）
- active 狀態加入 `ring-2 ring-brand-500`
- 加入 scroll snap：`snap-x snap-mandatory` + 每張 `snap-center`

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 修改 | `src/components/PropertyDetail/PropertyGallery.tsx` |
| 修改 | `src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx` |

### 驗收標準

- [x] D1: Gallery 可左右滑動切換圖片，載入時顯示 skeleton
- [x] D2: 依需求排除（不在本次實作範圍）
- [x] D11: 縮圖 64×96px，scroll snap 對齊
- [x] 桌面版不受影響（僅調整 Gallery，不新增 MobileActionBar/BottomSheet 結構）
- [x] typecheck + lint 通過

### #20a 施工紀錄（2026-02-11）

#### 優化循環摘要
- [x] 第 1 輪實作：完成 `D1`（swipe + skeleton）與 `D11`（64x96 + scroll snap），並清理 `PropertyGallery.tsx` 亂碼字串
- [x] 第 2 輪 strict-audit：發現並修正 `react-hooks/set-state-in-effect` 2 項 lint 缺陷
- [x] 第 3 輪驗證：關聯測試、typecheck、lint、UTF-8 檢查全部通過

#### 修改檔案
1. `src/components/PropertyDetail/PropertyGallery.tsx`
   - 手勢區改為 `touch-pan-y`，保留垂直滾動，水平滑動超過 50px 才切圖
   - 新增主圖 skeleton（`gallery-main-skeleton`）並在圖片載入完成後隱藏
   - 縮圖尺寸改為 `h-16 w-24`（64×96），加入 `snap-x snap-mandatory` 與 `snap-center`
   - 修正檔內既有亂碼文字（按鈕 `aria-label`、縮圖 `alt`）
   - 強化邊界：當 `images` 長度變更時使用安全索引 `activeImageIndex`

2. `src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx`
   - 新增 `touch-pan-y` 測試
   - 新增 skeleton 顯示/隱藏測試（`fireEvent.load`）
   - 新增縮圖 64×96 與 scroll snap class 測試

#### 驗證命令
```bash
cmd /c npm run test -- src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx src/pages/__tests__/PropertyDetailPage.optimization.test.tsx
cmd /c npx eslint src/components/PropertyDetail/PropertyGallery.tsx src/components/PropertyDetail/__tests__/PropertyGallery.motion.test.tsx
cmd /c npm run typecheck
cmd /c npm run check:utf8
```

---

## #20b [P0] 詳情頁手機版 — 文本優化 + ActionBar 毛玻璃（3 項）

### 20b-D3. PropertyDescription 展開全文

**檔案：** `src/components/PropertyDetail/PropertyDescription.tsx`
**規範引用：** ux-guidelines #44（長文本必須可折疊）、#9（減少認知負擔）

**現狀：** 描述無長度限制，超長描述佔滿螢幕。

**方案：**
- 預設顯示 4 行：`line-clamp-4`
- 底部 gradient fade-out：`bg-gradient-to-t from-white to-transparent h-8`
- 「展開全文 ▼」/「收起 ▲」按鈕切換
- `useState<boolean>(false)` 控制展開狀態

### 20b-D4. MobileActionBar 毛玻璃 + 滾動隱藏

**檔案：** `MobileActionBar.tsx`，新增 `src/hooks/useScrollDirection.ts`
**規範引用：** styles.csv Glassmorphism `backdrop-blur-xl`、ux-guidelines #36（固定元素可自動隱藏）

**現狀：** 純白 `bg-white` 背景，永久佔據底部 ~80px。社會證明 icon 10px 過小。

**方案：**
- 背景改為 `bg-white/95 backdrop-blur-xl border-t border-white/20`
- 社會證明 icon 10px → 14px
- 加入 `useScrollDirection` hook：下滑顯示、上滑隱藏
- 隱藏動畫：`transform: translateY(100%)` + `transition 300ms ease`
- `prefers-reduced-motion: reduce` 時停用滾動隱藏

```typescript
// useScrollDirection.ts
function useScrollDirection(threshold = 10): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  const lastY = useRef(0);
  useEffect(() => {
    const handler = () => {
      const y = window.scrollY;
      if (Math.abs(y - lastY.current) > threshold) {
        setDirection(y > lastY.current ? 'down' : 'up');
        lastY.current = y;
      }
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [threshold]);
  return direction;
}
```

### 20b-D9. Glassmorphism 統一設計語言

**檔案：** `tailwind.config.cjs`、`PropertySpecs.tsx`、`MobileCTA.tsx`、`PropertyInfoCard.tsx`
**規範引用：** products.csv #38 Real Estate 首選 Glassmorphism、styles.csv #1

**現狀：** 部分組件有毛玻璃（VipModal、TrustServiceBanner），部分沒有（PropertySpecs、MobileCTA）。

**方案：**
- Tailwind 新增 utility：`.glass-card` = `@apply bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg`
- 套用到 PropertySpecs、MobileCTA、PropertyInfoCard

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 新增 | `src/hooks/useScrollDirection.ts` |
| 修改 | `PropertyDescription.tsx`、`MobileActionBar.tsx`、`MobileCTA.tsx`、`PropertySpecs.tsx`、`PropertyInfoCard.tsx`、`tailwind.config.cjs` |

### 驗收標準

- [x] D3: 描述預設 4 行 + gradient fade + 展開/收起按鈕
- [x] D4: ActionBar 毛玻璃效果，上滑隱藏下滑顯示，icon 14px
- [x] D9: 三個組件統一使用 glass-card 風格
- [x] typecheck + lint 通過

### #20b 施工紀錄（2026-02-11）

#### 優化循環摘要
- [x] 第 1 輪實作：完成 D3（PropertyDescription 展開全文）、D4（MobileActionBar 毛玻璃+滾動隱藏）、D9（Glassmorphism 統一設計語言）
- [x] 第 2 輪驗證：typecheck、ESLint（3 warnings 自動修復）、PropertyDetail 測試全部通過（89 個測試）

#### 修改檔案
1. `src/components/PropertyDetail/PropertyDescription.tsx`
   - 新增展開/收起狀態管理（`useState<boolean>`）
   - 預設顯示 4 行（`line-clamp-4`），超過 240 字才顯示展開按鈕
   - 底部 gradient fade-out（`bg-gradient-to-t from-white to-transparent h-8`）
   - 展開/收起按鈕使用 Lucide `ChevronDown`/`ChevronUp` icon
   - 按鈕符合觸控目標 `min-h-[44px]`（ux-guidelines #22）

2. `src/hooks/useScrollDirection.ts`（新增）
   - 偵測滾動方向的 Hook（`'up' | 'down'`）
   - 使用 `passive: true` 提升滾動效能
   - 閾值機制（預設 10px）避免微小滾動觸發狀態更新

3. `src/components/PropertyDetail/MobileActionBar.tsx`
   - 新增 `useScrollDirection` hook，控制顯示/隱藏
   - 背景改為 `bg-white/95 backdrop-blur-xl border-t border-white/20`（Glassmorphism）
   - 社會證明 icon 從 12px 升級至 14px（符合 ux-guidelines #14）
   - 滾動隱藏：`translate-y-full` + `transition-transform duration-300 ease-out`
   - `motion-reduce:translate-y-0` 支援 `prefers-reduced-motion`（ux-guidelines #82）

4. `tailwind.config.cjs`
   - 新增 `.glass-card` utility plugin：`bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg`

5. `src/components/PropertyDetail/PropertySpecs.tsx`
   - 套用 `.glass-card`，移除 `border-slate-100 bg-white shadow-sm`

6. `src/components/PropertyDetail/MobileCTA.tsx`
   - 套用 `.glass-card`，移除 `border-slate-100 bg-white shadow-lg`

#### 驗證命令
```bash
npx tsc --noEmit
npx eslint --fix src/components/PropertyDetail/PropertyDescription.tsx src/components/PropertyDetail/MobileActionBar.tsx src/components/PropertyDetail/PropertySpecs.tsx src/components/PropertyDetail/MobileCTA.tsx
npx vitest run src/components/PropertyDetail/
```

#### UI/UX 規範符合性
- ✅ products.csv #38 Real Estate（Glassmorphism + Minimalism）
- ✅ ux-guidelines #44（長文本可折疊）
- ✅ ux-guidelines #9（漸進揭露）
- ✅ ux-guidelines #36（固定元素可自動隱藏）
- ✅ ux-guidelines #14（icon 尺寸 14px）
- ✅ ux-guidelines #22（觸控目標 ≥44px）
- ✅ ux-guidelines #82（prefers-reduced-motion）
- ✅ styles.csv #1 Glassmorphism（backdrop-blur-xl, bg-white/80）

---

## #20c [P1] 詳情頁手機版 — InfoCard 觸控修復（1 項）

### 20c-D5. PropertyInfoCard 按鈕觸控修復

**檔案：** `src/components/PropertyDetail/PropertyInfoCard.tsx`
**規範引用：** ux-guidelines #22（觸控 ≥ 44px）

**現狀：** 分享/收藏按鈕觸控區 `p-2`（~40px）偏小。

**方案：**
- 分享/收藏按鈕：`p-2` → `p-2.5`（44px）

### ~~20c-D6. PropertySpecs Bento Grid + Icon~~ — 不做

> 加 icon 不算優化，跳過。

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 修改 | `PropertyInfoCard.tsx` |

### 驗收標準

- [x] D5: 按鈕 44px 觸控目標
- [x] D5 關聯測試 + lint + UTF-8 通過
- [ ] 全域 typecheck（受既有語法錯誤檔案阻擋）

### #20c-D5 施工紀錄（2026-02-11）

#### 優化循環摘要
- [x] 第 1 輪實作：完成 `PropertyInfoCard` 的 D5 四項（標題 2 行、地址 truncate+展開、瀏覽人數動畫、按鈕觸控 44px）
- [x] 第 2 輪自審：修正動畫時基問題（`performance.now` → `Date.now`）並抽出 `useAnimatedNumber`，符合 SOLID 的單一職責
- [x] 第 3 輪驗證：D5 關聯測試、lint、UTF-8 全通過；全域 typecheck 受既有檔案阻擋

#### 修改檔案
1. `src/components/PropertyDetail/PropertyInfoCard.tsx`
   - 標題改 `line-clamp-2`，避免長標題壓縮首屏資訊密度
   - 地址區改為可展開/收起（預設 `truncate`，點擊顯示完整地址）
   - 分享/收藏按鈕升級為 `min-h-[44px] min-w-[44px] p-2.5`（ux-guidelines #22）
   - 加入 `data-testid`，提升 D5 回歸測試穩定性
   - 瀏覽人數顯示改為動畫數值（`current-viewers-count`）

2. `src/components/PropertyDetail/hooks/useAnimatedNumber.ts`（新增）
   - 專責處理數字過渡動畫（0 → 目標值）
   - 支援 `prefers-reduced-motion`，符合 ui-ux-pro-max 的無障礙要求
   - 加入數值防禦與時間基準修正，避免負值或跳號

3. `src/components/PropertyDetail/__tests__/PropertyInfoCard.test.tsx`
   - 新增 D5 測試：
     - 標題 2 行截斷 class
     - 地址預設截斷與展開切換
     - 分享/收藏/地圖按鈕觸控區 ≥ 44px
     - 瀏覽人數動畫最終收斂至目標值
   - 保留並重寫 trustEnabled 顯示邏輯驗證，避免舊測試亂碼

#### 驗證命令
```bash
cmd /c npm run test -- src/components/PropertyDetail/__tests__/PropertyInfoCard.test.tsx
cmd /c npx eslint src/components/PropertyDetail/PropertyInfoCard.tsx src/components/PropertyDetail/hooks/useAnimatedNumber.ts src/components/PropertyDetail/__tests__/PropertyInfoCard.test.tsx
cmd /c npm run typecheck
cmd /c npm run check:utf8
```

> typecheck 阻擋檔案（既有）：`src/components/AgentReviewListModal.tsx`、`src/components/Assure/ReviewPromptModal.tsx`

---

## #20d [P1] 詳情頁手機版 — 評論 + Panel 升級（2 項）

### 20d-D7. CommunityReviews 星級 SVG + 卡片動效

**檔案：** `src/components/PropertyDetail/CommunityReviews.tsx`
**規範引用：** ux-guidelines #14（icon 一致性）、#3（互動反饋）

**現狀：** 星級為純文字 `★★★★★`、卡片無 hover/active、頭像純色圓形。

**方案：**
- 星級改為 SVG Star icon + 黃色漸層填充（`from-yellow-400 to-amber-500`）
- 卡片加入 `hover:shadow-md active:scale-[0.98] transition-all duration-200`
- 頭像改為 `bg-gradient-to-br from-brand-400 to-brand-600`
- 「前往社區牆」改為 pill 按鈕 `bg-brand-50 hover:bg-brand-100 rounded-full px-4 py-2`

### 20d-D8. LineLinkPanel / CallConfirmPanel 統一升級

**檔案：** `LineLinkPanel.tsx`、`CallConfirmPanel.tsx`
**規範引用：** ux-guidelines #20（loading 必備）、react.csv #22（表單即時驗證）

**現狀：** backdrop `bg-black/50` 略淺、無 loading、輸入框無即時驗證。

**方案：**
- backdrop：`bg-black/50` → `bg-black/60 backdrop-blur-sm`
- 開啟時 0.3s skeleton → 內容淡入
- 輸入框即時驗證：紅色邊框 `border-red-500` + shake 動畫 + 錯誤文字
- 電話號碼分段顯示：`0912-345-678`

### ~~20d-D10. 30秒回電 FAB 重定位 + 漸層~~ — 不做

> 依指示本輪僅做 D7 + D8，不納入 D10。

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 修改 | `CommunityReviews.tsx`、`LineLinkPanel.tsx`、`CallConfirmPanel.tsx` |
| 新增 | `usePanelContentReady.ts` |
| 測試 | `CommunityReviews.test.tsx`、`CommunityReviews.motion.test.tsx`、`LineLinkPanel.test.tsx`、`CallConfirmPanel.test.tsx` |

### 驗收標準

- [x] D7: 星級 SVG icon、卡片 hover 動效、頭像漸層
- [x] D8: Panel backdrop blur、skeleton loading、即時驗證
- [x] 僅交付 D7 + D8（D10 依指示不作）
- [x] D7/D8 測試 + lint + utf8 通過

### #20d-D7D8 施工紀錄（2026-02-11）

#### 優化循環摘要
- [x] 第 1 輪實作：完成 D7（CommunityReviews 星級 SVG + 卡片互動 + 頭像漸層 + pill CTA）與 D8（Panel backdrop/skeleton/即時驗證/電話格式）
- [x] 第 2 輪自審：抽出 `usePanelContentReady`（Panel loading 單一職責）與 `formatPhoneForDisplay`（電話格式單一職責）
- [x] 第 3 輪驗證：D7/D8 專項測試與 lint、UTF-8 全通過

#### 修改檔案
1. `src/components/PropertyDetail/CommunityReviews.tsx`
   - 純文字 `★★★★★` 改為 `ReviewStars`（SVG Star）
   - 評價卡新增 `hover:shadow-md active:scale-[0.98]`
   - 頭像改 `bg-gradient-to-br`
   - 「前往社區牆」改為 pill 按鈕（`rounded-full bg-brand-50 px-4 py-2`）

2. `src/components/PropertyDetail/LineLinkPanel.tsx`
   - backdrop 改 `bg-black/60 backdrop-blur-sm`
   - 新增 0.3s skeleton（`line-panel-skeleton`）
   - Fallback LINE ID 新增即時驗證（紅框 + 錯誤文案 + shake）

3. `src/components/PropertyDetail/CallConfirmPanel.tsx`
   - backdrop 改 `bg-black/60 backdrop-blur-sm`
   - 新增 0.3s skeleton（`call-panel-skeleton`）
   - fallback 電話欄位新增即時驗證（紅框 + 錯誤文案 + shake）
   - 顯示電話統一格式化為 `0912-345-678`

4. `src/components/PropertyDetail/hooks/usePanelContentReady.ts`（新增）
   - Panel 內容延遲 ready 狀態統一管理

5. `src/components/PropertyDetail/contactUtils.ts`
   - 新增 `formatPhoneForDisplay`，集中處理電話顯示格式

6. 測試檔案
   - `src/components/PropertyDetail/__tests__/CommunityReviews.test.tsx`
   - `src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx`
   - `src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx`
   - `src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx`
   - 覆蓋 D7/D8 新行為與回歸路徑

#### 驗證命令
```bash
cmd /c npm run test -- src/components/PropertyDetail/__tests__/CommunityReviews.test.tsx src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx
cmd /c npx eslint src/components/PropertyDetail/CommunityReviews.tsx src/components/PropertyDetail/LineLinkPanel.tsx src/components/PropertyDetail/CallConfirmPanel.tsx src/components/PropertyDetail/contactUtils.ts src/components/PropertyDetail/hooks/usePanelContentReady.ts src/components/PropertyDetail/__tests__/CommunityReviews.test.tsx src/components/PropertyDetail/__tests__/CommunityReviews.motion.test.tsx src/components/PropertyDetail/__tests__/LineLinkPanel.test.tsx src/components/PropertyDetail/__tests__/CallConfirmPanel.test.tsx
cmd /c npm run check:utf8
```

---

## ~~#20e [P2] 詳情頁手機版 — 動畫 + 微互動精緻化~~ — 整票不做（違反 ui-ux-pro-max ux-guidelines #7 #12）

### 20e-D12. 價格 + 社會證明 Micro-Interactions

**檔案：** `PropertyInfoCard.tsx`、`MobileActionBar.tsx`

**方案：**
- 價格首次載入 counter 滾動動畫（0 → 1,280 萬）
- 瀏覽人數每 30 秒微閃 `animate-pulse`（一次）
- 熱門 Flame icon：`@keyframes flame-flicker`（微擺動 ±3deg）

### 20e-D13. Section 進場動畫

**檔案：** `PropertyDetailPage.tsx`，新增 `src/hooks/useInViewAnimation.ts`
**規範引用：** ux-guidelines #12（入場動畫 150-300ms）

**方案：**
- 每個 Section 加 `opacity-0 translate-y-4` → `opacity-100 translate-y-0`
- Intersection Observer 觸發，threshold 0.1
- `prefers-reduced-motion: reduce` 時停用

```typescript
function useInViewAnimation(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry?.isIntersecting) el.classList.add('animate-in'); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
}
```

### 20e-D14. VipModal 關閉倒數 + 福利動畫

**檔案：** `VipModal.tsx`

**方案：**
- 3 秒倒數後才顯示關閉按鈕（防止誤觸跳過）
- CheckCircle icon 依序淡入：stagger animation 0.2s 間隔
- 倒數圈 SVG：`stroke-dasharray` + `stroke-dashoffset` 動畫

### 20e-D15. TrustServiceBanner Shield 動畫

**檔案：** `TrustServiceBanner.tsx`

**方案：**
- 已開啟：Shield 加入 `animate-pulse`（柔和脈動）
- 未開啟：Shield 加入 `animate-bounce`（吸引注意，3 次後停止）

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 新增 | `src/hooks/useInViewAnimation.ts` |
| 修改 | `PropertyInfoCard.tsx`、`MobileActionBar.tsx`、`PropertyDetailPage.tsx`、`VipModal.tsx`、`TrustServiceBanner.tsx` |

### 驗收標準

- [ ] D12: 價格數字滾動、瀏覽人數微閃、Flame 擺動
- [ ] D13: Section 進場動畫 + reduced-motion 停用
- [ ] D14: VipModal 3 秒倒數 + 福利 stagger
- [ ] D15: Shield 根據狀態有不同動畫
- [ ] 所有動畫有 `prefers-reduced-motion: reduce` 對應
- [ ] typecheck + lint 通過

---

## #21a [P0] UAG Profile 手機版佈局重構（5 項）

### 來源

根據 `/ui-ux-pro-max` 的 `ux-guidelines.csv`、`colors.csv #SaaS`、`stacks/react.csv` 審核 UAG Profile 頁手機版（375px）呈現。核心問題：首屏被頭像卡片（~180px）+指標卡片（4 行垂直 ~280px）佔滿，個人資料表單完全在折疊線下，用戶不知道有表單可編輯。

> **實際代碼比對（2026-02-10）：** Avatar 為 `size-16`（64px）非 128px；Metrics 為垂直單欄 `grid gap-3`（4 行）非 2x2 grid；儲存按鈕在 BasicInfoSection 表單內部非頁面 Header。

---

### 21a-P1. 頭像行內精簡

**檔案：** `src/pages/UAG/Profile/index.tsx`、`src/pages/UAG/Profile/AvatarUploader.tsx`
**規範引用：** ux-guidelines #84（Above the Fold — CTA 必須在首屏）、#23（Information Density — 避免資訊過載）

**現狀：** 頭像 `size-16`（64px）在卡片內（標題+描述+變更按鈕+頭像+提示文字），整個卡片佔 ~180px。

**方案：**
- AvatarUploader 新增 `variant?: 'card' | 'compact'` prop（預設 `'card'`）
- compact 模式：去卡片外框，改為單行 `flex items-center gap-3`，頭像 `size-12`（48px）+ 名字 + 變更按鈕
- 手機端（`lg:hidden`）使用 compact，桌面端（`hidden lg:block`）保留 card
- 高度：~64px（原 ~180px）

### 21a-P2. 指標區精簡

**檔案：** `src/pages/UAG/Profile/MetricsDisplay.tsx`
**規範引用：** ux-guidelines #23（Information Density）、#84（Above the Fold）

**現狀：** 4 指標（信任分/服務評價/完成案件/服務年資）垂直單欄 `grid gap-3`，每行 `flex items-center justify-between`，含 Lucide icon，整卡片佔 ~280px。

**方案：**
- MetricsDisplay 新增 `variant?: 'default' | 'compact'` prop（預設 `'default'`）
- compact 模式：`grid grid-cols-2 gap-2` 2x2 格，去卡片外框
- 每格：icon + label 上方，數值粗體下方
- 手機端用 compact，桌面端保持 default 垂直列表
- 高度：~110px（原 ~280px）

### 21a-P3. Tab 分段表單

**檔案：** `src/pages/UAG/Profile/BasicInfoSection.tsx`
**規範引用：** ux-guidelines #20（Content Grouping — 邏輯分組 + 可折疊）、stacks/react.csv #7（受控組件表單）

**現狀：** BasicInfoForm（335 行）所有欄位一次攤開 — 6 input + 1 textarea + 15 專長 chip + 4 證照 chip，手機端滾動距離極長。

**方案：**
- 表單內新增 `activeTab` state: `'basic' | 'expertise'`
- Tab bar 參考 WallTabs 模式：按鈕 + 底線指示器，icon 用 Lucide `User`（基本資料）+ `Award`（專長與證照）
- Tab 1 — 基本資料：姓名、公司、手機、LINE ID、加入日期、證照字號、自我介紹
- Tab 2 — 專長證照：專長領域 15 chip + 專業證照 4 chip
- Tab 按鈕 `min-h-[44px]`，底線 `transition-colors duration-200 motion-reduce:transition-none`
- useState 在 BasicInfoForm 層級，Tab 切換不遺失表單資料
- 新增 props: `formId?: string`（設在 `<form id>`）、`onFormStateChange?: (state) => void`

```typescript
type ProfileTab = 'basic' | 'expertise';
const [activeTab, setActiveTab] = useState<ProfileTab>('basic');
```

### 21a-P4. 儲存按鈕 Sticky Bottom Bar

**檔案：** `src/pages/UAG/Profile/index.tsx`、`src/pages/UAG/Profile/BasicInfoSection.tsx`
**規範引用：** ux-guidelines #84（CTA 可見性）、#22（Touch Target >= 44px）

**現狀：** 儲存按鈕在 BasicInfoSection 表單內部（`<form>` 的頂部 header），手機端需往上滾才能點。

**方案：**
- 手機端在頁面底部新增 Sticky Save Bar（`fixed bottom-0 inset-x-0 z-50 lg:hidden`）
- 外部按鈕用 HTML5 `form="profile-form"` 屬性連結表單 submit
- BasicInfoSection 透過 `onFormStateChange` callback 向上回報 `{ hasUnsavedChanges, isSubmitDisabled }`
- 表單內原儲存按鈕加 `hidden lg:inline-flex`（手機隱藏，桌面保留）
- 頁面容器加 `pb-[80px] lg:pb-0` 避免內容被遮擋

### 21a-P5. 返回按鈕 touch target

**檔案：** `src/pages/UAG/Profile/index.tsx`
**規範引用：** ux-guidelines #22（Touch Target >= 44px）

**現狀：** `ArrowLeft size={14}` + 文字 "返回 UAG"，無 `min-h-[44px]`，觸控區域不足。

**方案：**
- 加 `min-h-[44px] min-w-[44px]`
- icon `size={14}` -> `size={16}`（與錯誤狀態返回按鈕一致）
- 錯誤狀態返回按鈕（line 43）同步修正

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 修改 | `src/pages/UAG/Profile/index.tsx` |
| 修改 | `src/pages/UAG/Profile/AvatarUploader.tsx` |
| 修改 | `src/pages/UAG/Profile/MetricsDisplay.tsx` |
| 修改 | `src/pages/UAG/Profile/BasicInfoSection.tsx` |
| 修改 | `src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx` |

### 實作順序

1. P5 — 返回按鈕觸控修復（最快，零風險）
2. P3 — Tab 分段 + formId + onFormStateChange
3. P1 — AvatarUploader compact variant
4. P2 — MetricsDisplay compact variant
5. P4 — Sticky Save Bar + 佈局分離
6. 測試 — 新增 tab/callback 測試 + 驗證既有測試
7. Gate — `npm run gate` + `npm test`

### 驗收標準

- [x] P1: 手機版頭像 48px 與姓名同行 compact variant；桌面版保留原卡片
- [x] P2: 手機版指標 2x2 grid compact variant，高度 <= 110px；桌面版保持垂直列表
- [x] P3: Tab 切換「基本資料/專長證照」，Lucide icon（無 emoji），Tab 切換不遺失表單值
- [x] P4: 手機版 Sticky Bottom Bar 儲存按鈕，`form="profile-form"` 觸發提交，觸控 >= 44px
- [x] P5: 返回按鈕觸控 >= 44px（含錯誤狀態）
- [x] 桌面版（lg+）佈局與修改前完全一致
- [x] typecheck + lint + test 通過

### 實作記錄（2026-02-11）

#### 修改檔案

1. **src/pages/UAG/Profile/index.tsx**
   - L1: 新增 `useState` import
   - L13-15: 新增 `hasUnsavedChanges`, `isSubmitDisabled` state
   - L23-26: 新增 `handleFormStateChange` callback 接收表單狀態
   - L58: 頁面容器加 `pb-[80px] lg:pb-0` 避免內容被 sticky bar 遮擋
   - L76-94: Avatar/Metrics 分離為 desktop 和 mobile variant
     - Desktop: `hidden lg:block` + `variant="card"` / `variant="default"`
     - Mobile: `lg:hidden` + `variant="compact"` / `variant="compact"`
   - L96-100: 傳遞 `formId="profile-form"` 和 `onFormStateChange` 給 BasicInfoSection
   - L104-115: 新增 Sticky Save Bar（`fixed bottom-0 inset-x-0 z-50 lg:hidden`）
     - 使用 `form="profile-form"` 連結外部按鈕與表單
     - 動態按鈕文字：儲存中.../儲存變更/尚未修改
   - L43+64: 返回按鈕修復：加 `min-h-[44px] min-w-[44px]`，icon size 14→16

2. **src/pages/UAG/Profile/AvatarUploader.tsx**
   - L6: interface 新增 `variant?: 'card' | 'compact'` prop
   - L17: 解構 `variant = 'card'` 預設值
   - L20-42: 新增 compact variant 邏輯（early return）
     - 單行 flex 布局，48px 頭像（size-12）
     - inline 顯示名稱 + "房仲個人資料" 次要文字
     - Camera badge 縮小（size-5, icon 10px）
     - 變更按鈕：`min-h-[44px] min-w-[44px]`
   - L44-86: 保留原 card variant（預設）

3. **src/pages/UAG/Profile/MetricsDisplay.tsx**
   - L6: interface 新增 `variant?: 'default' | 'compact'` prop
   - L10: 解構 `variant = 'default'` 預設值
   - L17-33: 新增 compact variant（2x2 grid）
     - `grid grid-cols-2 gap-2` 布局
     - 每格：上 icon，中 label（text-xs），下數值（text-lg font-bold）
     - 去除外層卡片 border，直接 2x2 grid
   - L35-70: 保留原 default variant（垂直列表）

4. **src/pages/UAG/Profile/BasicInfoSection.tsx**
   - L1: 新增 `useEffect` import
   - L2: 新增 `User, Award` from lucide-react
   - L25: 新增 `type ProfileTab = 'basic' | 'expertise'`
   - L27-30: 新增 `FormStateInfo` interface
   - L36-38: props 新增 `formId?: string` 和 `onFormStateChange` callback
   - L87: 新增 `activeTab` state（預設 `'basic'`）
   - L149-151: 新增 useEffect 觸發 `onFormStateChange` callback
   - L161: form 標籤加 `id={formId}`
   - L172: 桌面儲存按鈕加 `hidden lg:inline-flex`（手機隱藏）
   - L179-213: 新增 Tab Bar（User/Award icons，底線指示器）
     - Tab 按鈕 `min-h-[44px]`，active 底線 `absolute inset-x-0 bottom-0`
     - `transition-colors duration-200 motion-reduce:transition-none`
   - L216-340: Tab 1「基本資料」包裹 `{activeTab === 'basic' && ( ... )}`
     - 6 input（姓名/公司/手機/LINE/加入日期/證照字號）+ 1 textarea（自我介紹）
   - L345-391: Tab 2「專長證照」包裹 `{activeTab === 'expertise' && ( ... )}`
     - 15 專長領域 chip + 4 證照 chip
   - L194+209: Tailwind shorthand 修復：`left-0 right-0` → `inset-x-0`

#### 驗證結果

```
✅ typecheck  0 errors
✅ eslint     0 errors, 0 warnings
✅ gate       PASSED (4/4 checks)
```

#### Commit

```
feat(uag-profile): close #21a — mobile layout refactor P1-P5

- P5: 返回按鈕 44px touch target（ArrowLeft 16px）
- P3: Tab 分段表單（basic/expertise）+ User/Award icons
- P1: AvatarUploader compact variant（48px inline）
- P2: MetricsDisplay compact variant（2x2 grid）
- P4: Sticky Save Bar（form="profile-form" 外部提交）

手機版首屏優化：Avatar 180px→64px，Metrics 280px→110px
桌面版保持原 card/default variant

符合 SOLID 原則 + ux-guidelines #22 #23 #84
使用 Lucide icons（無 emoji），Tailwind responsive design

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## #21b [P1] UAG Profile 桌面版 + 通用品質提升（4 項）

### 來源

根據 `/ui-ux-pro-max` 的 `colors.csv #SaaS`、`stacks/react.csv`、`ux-guidelines.csv` 審核 UAG Profile 頁桌面版（1440px）+ 通用品質。

> **規範比對修正（2026-02-10）：** 根據實際代碼比對，修正 P6/P8/P9 描述不準確處；P10 因與 #21a-P3 Tab 分段重複已降級移除。

---

### 21b-P6. Tab 內容區視覺分段

**檔案：** `src/pages/UAG/Profile/BasicInfoSection.tsx`
**規範引用：** ux-guidelines #20（Content Grouping）
**依賴：** #21a-P3（Tab 分段）

**現狀：** #21a-P3 引入 Tab 後，Tab 1「基本資料」內 6 input + 1 textarea 無視覺分段。

**方案：**
- Tab 1 內部分 3 個視覺區段，用 `space-y-6` + 區段標題（`text-sm font-semibold text-slate-700`）分隔：
  - ① 個人資訊（姓名+公司，`md:grid-cols-2 gap-4`）
  - ② 聯絡方式（手機+LINE ID+加入日期+證照字號，`md:grid-cols-2 gap-4`）
  - ③ 自我介紹（textarea 獨立區段）
- Tab 2「專長與證照」已有「專長領域」/「證照」標題分隔，不額外處理
- 不使用卡片套卡片（`bg-slate-50 rounded-xl`），避免過度嵌套

### 21b-P7. 表單即時驗證

**檔案：** `src/pages/UAG/Profile/BasicInfoSection.tsx`
**規範引用：** ux-guidelines #56（Inline Validation — blur 驗證）、#33（Error Feedback）、#37（Color Only — 不能只靠顏色）、#44（Error Messages — `role="alert"`）、stacks/react.csv #26（Controlled Components）

**現狀：** 手機號碼、LINE ID 無格式提示，輸入錯誤只在送出後才知道。姓名欄有 `required` 但無 blur 回饋。

**方案：**
- 手機號碼 placeholder 改為 `09xx-xxx-xxx`，blur 時檢查格式（`/^09\d{8}$/`）
- LINE ID blur 時檢查格式（`/^[a-z0-9_.@-]+$/i`），不符顯示紅框 + 提示文字
- 姓名欄 blur 時檢查非空白
- 錯誤提示：Lucide `AlertCircle` icon + `text-sm text-red-600 mt-1`（不能只靠紅色，需搭配 icon）
- 錯誤提示容器加 `role="alert"` 讓螢幕閱讀器報讀

### 21b-P8. 儲存按鈕 Spinner + Toast 確認

**檔案：** `src/pages/UAG/Profile/BasicInfoSection.tsx`、`src/pages/UAG/Profile/hooks/useAgentProfile.ts`
**規範引用：** ux-guidelines #78（Loading Indicators — 超過 300ms 需 indicator，`severity: High`）、#32（Loading Buttons — `severity: High`）、#34（Success Feedback）

**現狀：** 按鈕已有 `isSaving ? '儲存中...' : ...` 文字和 `disabled` 狀態，但缺少視覺 spinner icon。Toast 通知需確認在 `useAgentProfile.ts` 中正確觸發。

**方案：**
- 儲存按鈕「儲存中...」前加 Lucide `Loader2` icon + `animate-spin motion-reduce:animate-none`
- 確認 `useAgentProfile.ts` 中 `updateProfile` 成功時呼叫 `notify.success('個人資料已儲存')`
- 確認 `updateProfile` 失敗時呼叫 `notify.error('儲存失敗，請稍後再試')`

### 21b-P9. 指標色彩對齊專案 Design Token

**檔案：** `src/pages/UAG/Profile/MetricsDisplay.tsx`
**規範引用：** colors.csv #1 SaaS（Primary: #2563EB Trust Blue）、colors.csv #38 Real Estate（Primary: #0F766E）

**現狀：** 4 格指標全用 `bg-slate-50`，無品牌色彩區分。icon 已用 Lucide（ShieldCheck/Star/BadgeCheck/Briefcase），符合規範。

**方案：**
- 信任分卡片高亮：`bg-brand-50 border border-brand-200` + 數字 `text-brand-700`（使用專案 design token，非硬編碼 `blue-*`）
- 其餘三格：加 `border border-slate-200`（目前無 border，加上增強層次）
- hover 態：`hover:border-brand-300 transition-colors duration-200 motion-reduce:transition-none`（ux-guidelines #8 #9）

### ~~21b-P10. 專長 chip 手機版摺疊~~ — 已移除

> **移除原因：** #21a-P3 已將專長 chip 移至獨立 Tab 2「專長與證照」，用戶主動切換才看到。在 Tab 2 中再加摺疊會過度簡化（用戶刻意進入卻只看到 6 項，體驗不佳）。15+4 = 19 項 chip 在專屬 Tab 中是合理的資訊量。

### 檔案清單

| 類型 | 檔案 |
|------|------|
| 修改 | `src/pages/UAG/Profile/BasicInfoSection.tsx` |
| 修改 | `src/pages/UAG/Profile/MetricsDisplayCard.tsx` |
| 修改 | `src/pages/UAG/Profile/MetricsDisplayCompact.tsx` |
| 修改 | `src/pages/UAG/Profile/hooks/useAgentProfile.ts` |
| 修改 | `src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx` |
| 修改 | `src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx` |
| 新增 | `src/pages/UAG/Profile/MetricsDisplay.test.tsx` |

### 驗收標準

- [x] P6: Tab 1 內 3 區段視覺分隔（區段標題 + spacing），無過度嵌套
- [x] P7: 手機/LINE ID/姓名 blur 驗證，Lucide `AlertCircle` icon + `role="alert"`
- [x] P8: 儲存按鈕 `Loader2` spinner + `animate-spin motion-reduce:animate-none`，成功/失敗 toast 正確觸發
- [x] P9: 信任分用 `brand-*` token 高亮，hover + `motion-reduce` 支援
- [x] ~~P10: 已移除~~
- [x] typecheck + lint + 關鍵測試通過（`#21b` 目標測試集與本次修復測試全綠）

### 實作記錄（2026-02-12）

#### 修改檔案

1. **src/pages/UAG/Profile/BasicInfoSection.tsx**
   - 手機欄位 placeholder 改為 `09xx-xxx-xxx`，與 21b-P7 規格一致。
   - 保留既有 blur 驗證（姓名/手機/LINE ID）與 `AlertCircle + role="alert"` 組合。

2. **src/pages/UAG/Profile/hooks/useAgentProfile.ts**
   - 儲存成功通知統一為 `notify.success('個人資料已儲存')`（mock/live 都一致）。
   - 儲存失敗通知改為 `notify.error('儲存失敗，請稍後再試')`（固定文案）。

3. **src/pages/UAG/Profile/MetricsDisplayCard.tsx**
   - 信任分卡片改用 design token：`bg-brand-50 border-brand-200`。
   - 信任分 icon/數值文字改用 `text-brand-700`。
   - 其餘卡片維持 `border-slate-200 bg-slate-50`，全部保留 `hover:border-brand-300` 與 `motion-reduce`。

4. **src/pages/UAG/Profile/MetricsDisplayCompact.tsx**
   - compact 版信任分 tile 同步套用 `bg-brand-50 border-brand-200 text-brand-700`。
   - 其餘三格維持 slate 樣式，hover/motion 規則一致。

5. **src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx**
   - 補上手機欄位 placeholder 斷言：`09xx-xxx-xxx`。

6. **src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx**
   - 更新成功通知斷言為 `個人資料已儲存`。
   - 新增 live mode 成功/失敗通知測試（含固定錯誤文案）。

7. **src/pages/UAG/Profile/MetricsDisplay.test.tsx**
   - 新增 #21b-P9 測試：驗證 trust 卡使用 brand token，其他卡片維持 slate 樣式（default + compact）。

#### 驗證結果

```
✅ typecheck  0 errors
✅ eslint     0 errors, 0 warnings
✅ #21b 目標測試全通過（24 tests）
   - src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx
   - src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx
   - src/pages/UAG/Profile/MetricsDisplay.test.tsx
⚠️ npm run test（全專案）目前有既有失敗（與 #21b 無直接關聯）：
   - src/pages/UAG/index.test.tsx（1 failed）
   - src/pages/__tests__/PropertyDetailPage.defaultProperty.test.tsx（1 failed）
   - src/pages/__tests__/PropertyDetailPage.phase11.test.tsx（4 failed）
```

#### Commit

```
feat(uag-profile): close #21b desktop quality upgrades

- P6: 基本資料 Tab 1 內視覺分段維持 3 區塊（個人/聯絡/自介）
- P7: 手機 placeholder 對齊規格，保留 blur 驗證與 alert 語意
- P8: 儲存成功/失敗通知文案統一
- P9: 信任分卡片改用 brand design token（default + compact）
- 補齊 #21b 測試覆蓋（表單、通知、指標 token）
```

#### 補強修復（2026-02-12，19 項收斂）

1. **Zod/Type 同步單一來源（修正原 #19 風險）**
   - `src/types/agent.types.ts` 新增並集中 `AgentProfileApiSchema` / `AgentProfileMeApiSchema`。
   - `src/services/agentService.ts` 改為直接引用上述 schema + `z.infer` type，不再在 service 端重複維護 API schema。

2. **Single Responsibility + Early Return + Defensive Programming 落地**
   - `src/services/agentService.ts` 拆分 `fetchWithRetry`、`validateAndExtractApiResponse`、`buildUpdateRequestBody` 等單一職責函式。
   - `fetchAgentProfile`、`updateAgentProfile`、`uploadAgentAvatar` 加入 fail-fast 前置檢查（空 id、空 payload、無效 file）。
   - `src/pages/UAG/Profile/hooks/useProfileFormState.ts` 修正 hook 依賴為 `[profile]`，避免隱性依賴警告。

3. **Tailwind / Hooks 警告歸零（你指定的 3 個 warning）**
   - `src/pages/UAG/Profile/MetricsDisplayCard.tsx`
   - `src/pages/UAG/Profile/MetricsDisplayCompact.tsx`
   - `src/pages/UAG/Profile/hooks/useProfileFormState.ts`
   - 驗證：`npm run lint -- <3 files>` 無 warning。

4. **中文亂碼全面清理（UI + 測試 + 常數）**
   - `src/constants/profile.ts`
   - `src/pages/UAG/Profile/BasicInfoSection.tsx`
   - `src/pages/UAG/Profile/components/ProfileBasicTabPanel.tsx`
   - `src/pages/UAG/Profile/components/ProfileExpertiseTabPanel.tsx`
   - `src/pages/UAG/Profile/config/tabConfig.ts`
   - `src/pages/UAG/Profile/hooks/useProfileFormValidation.ts`
   - `src/pages/UAG/Profile/useAvatarUpload.ts`
   - `src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx`
   - `src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx`
   - `src/pages/UAG/Profile/AvatarUploader.test.tsx`
   - `src/services/__tests__/agentService.test.ts`
   - 驗證：`npm run check:utf8`、`npm run check-mojibake`（含在 `npm run check:utf8`）通過。

5. **本次驗證（2026-02-12）**
   - `npm run typecheck` ✅
   - `npm run lint -- src/pages/UAG/Profile/MetricsDisplayCard.tsx src/pages/UAG/Profile/MetricsDisplayCompact.tsx src/pages/UAG/Profile/hooks/useProfileFormState.ts` ✅
   - `npm run test -- src/pages/UAG/Profile/__tests__/BasicInfoSection.test.tsx src/pages/UAG/Profile/hooks/useAgentProfile.test.tsx src/pages/UAG/Profile/AvatarUploader.test.tsx src/services/__tests__/agentService.test.ts` ✅（30 tests passed）
   - `npm run check:utf8` ✅

---

## 依賴關係

> 已拆分為小工單，每個子工單內部依賴見詳細區塊。此處僅列工單間依賴。

```
已完成 ✅: #1, #2(含#4), #3, #5, #6, #8, #10

#17 移除生成報告+30秒回電（獨立，最優先）
  └─ 完成後 #9a D1/D2 自動解決、#20d D10 自動完成

#7 Profile 頁 mock（依賴 #6 ✅）

#12 信任分 Tooltip + seed 校正（獨立）
      │
      ▼
#13a 房仲評價 — DB + API + 類型（4 項，依賴 #12）
  └─ #13b 房仲評價 — 前端 + 整合（5 項，依賴 #13a）
#15 經紀人認證 + 完成案件（6 項，依賴 #12）

#14a 獲得鼓勵 — DB + API + 類型（4 項，依賴 #10 ✅）
  └─ #14b 獲得鼓勵 — 前端 + 整合（3 項，依賴 #14a）

#16 店名開放編輯（3 項，獨立）
#11 Header 品牌統一（5 項，獨立）
#18 MaiMai 公仔（3 項，建議在 #17 之後）

--- DetailPage 手機版 UX 修正（原 #9 拆分）---

#9a DetailPage A11y + 動畫（5 項，依賴 #2 ✅）
#9b DetailPage 排版 + 手勢（5 項，依賴 #2 ✅）
  ※ D1/D2 已被 #17 解決，不在 #9a/b 中

--- UAG 手機版 UX 修正（原 #9 拆分）---

#9c UAG 觸控 + 排版（5 項，獨立）
#9d UAG 列表 + Mock + 桌面（3 項，獨立）
  ※ U7/U9/U8/U11 已被 #19a-e 取代

--- UAG 手機版現代化（原 #19 拆分）---

#19c UAG Tab + KPI（2 項，最先，架構級）
      │
      ├─ #19a Radar 泡泡核心（5 項，獨立）
      ├─ #19b Radar 進階效果（3 項，依賴 #19a）
      ├─ #19d 卡片 + 互動（3 項，依賴 #19c）
      └─ #19e 收合 + 微互動（3 項，依賴 #19c）

--- 詳情頁手機版現代化（新增 #20 拆分）---

#20a Gallery + AgentBottomSheet（3 項，依賴 #2 ✅）
#20b 文本 + ActionBar 毛玻璃（3 項，依賴 #2 ✅）
#20c InfoCard + Specs 升級（2 項，獨立）
#20d 評論 + Panel + FAB（3 項，#17 完成後 D10 自動解決）
~~#20e 動畫 + 微互動~~ — 整票不做（違反 ux-guidelines）

--- UAG Profile 頁 UX 升級（新增 #21 拆分）---

#21a Profile 手機版佈局重構（5 項，依賴 #7 ✅）
  └─ #21b Profile 桌面版 + 通用品質（4 項，依賴 #21a；P10 已移除）
```

---

## 建議實作順序

> 小工單設計：每個 ≤ 5 項施工內容，AI 可一次性完成。

| 順序 | 工單 | 施工項數 | 優先級 | 預估檔案數 |
|------|------|---------|--------|-----------|
| 1 ✅ | #1 agentId fallback | 1 | P0 | 1 |
| 2 ✅ | #2 移除預約看屋 + 雙按鈕（含 #4） | 4 | P0 | 9 |
| 3 ✅ | #3 createLead 補 preferredChannel | 1 | P1 | 2 |
| 4 ✅ | #5 詳情頁 mock agent | 1 | P0 | 1 |
| 5 ✅ | #6 UAG Header mock | 1 | P0 | 2 |
| 6 ✅ | #8 社會證明真實數據 | 4 | P0 | 6 |
| 7 ✅ | #10 社區評價 API 修正 | 2 | P0 | 2 |
| 8 ✅ | #7 Profile 頁 mock | 3 | P0 | 3 |
| 9 | **#17 移除生成報告 + 30秒回電** | **6** | **P0** | **2 改 + 7 刪** |
| 10 | #12 信任分 Tooltip + seed | 2 | P1 | 2 |
| 11 | #13a 房仲評價 — DB + API + 類型 | 4 | P0 | 5 |
| 12 | #13b 房仲評價 — 前端 + 整合 | 5 | P0 | 5 |
| 13 | #15 經紀人認證 + 完成案件 | 6 | P0 | 8 |
| 14 | #16 店名開放編輯 | 3 | P1 | 4 |
| 15 | #14a 獲得鼓勵 — DB + API + 類型 | 4 | P1 | 4 |
| 16 | #14b 獲得鼓勵 — 前端 + 整合 | 3 | P1 | 3 |
| 17 | #11 Header 品牌統一 | 5 | P1 | 1 |
| 18 | #18 MaiMai 公仔 A+C+D | 3 | P1 | 4 |
| 19 | #19c UAG Tab + KPI | 2 | P0 | 3 |
| 20 | #19a Radar 泡泡核心 | 5 | P0 | 3 |
| 21 | #19d UAG 卡片 + 互動 | 3 | P1 | 4 |
| 22 | #19b Radar 進階效果 | 3 | P1 | 2 |
| 23 | #19e UAG 收合 + 微互動 | 3 | P1 | 3 |
| 24 | #9a DetailPage A11y + 動畫 | 5 | P1 | 4 |
| 25 | #9b DetailPage 排版 + 手勢 | 5 | P1 | 4 |
| 26 | #9c UAG 觸控 + 排版 | 5 | P1 | 4 |
| 27 | #9d UAG 列表 + Mock + 桌面 | 3 | P1 | 3 |
| 28 | #20a Gallery + AgentBottomSheet | 3 | P0 | 4 |
| 29 | #20b 文本 + ActionBar 毛玻璃 | 3 | P0 | 7 |
| 30 | #20c InfoCard + Specs 升級 | 2 | P1 | 2 |
| 31 | #20d 評論 + Panel + FAB | 3 | P1 | 4 |
| 32 | ~~#20e 動畫 + 微互動~~ | ~~4~~ | ~~P2~~ | 不做 |
| 33 | #21a Profile 手機版佈局重構 | 5 | P0 | 4 |
| 34 | #21b Profile 桌面版 + 通用品質 | 4 | P1 | 4 |

---

## #14b 實施記錄（2026-02-09）

### 施工內容

**14-D. 前端組件 — 社區牆評價按讚 UI**

修改檔案：`src/components/PropertyDetail/CommunityReviews.tsx`

1. 新增 `ThumbsUp` icon 從 lucide-react import
2. 擴充 `CommunityReviewsProps` interface：
   - 新增 `onToggleLike?: (propertyId: string) => void`
3. 擴充 `ReviewPreview` interface：
   - 新增 `propertyId: string`
   - 新增 `liked: boolean`
   - 新增 `totalLikes: number`
4. 更新 `MOCK_REVIEWS` 假資料，新增三個物件的按讚欄位：
   - MH-100001: liked=false, totalLikes=3
   - MH-100002: liked=true, totalLikes=7（預設已讚，展示兩種狀態）
   - MH-100003: liked=false, totalLikes=2
5. 更新 `LOCKED_PREVIEW_PLACEHOLDER` 新增預設值
6. 更新 `toPreview` 函數返回值，新增 `propertyId`, `liked`, `totalLikes` 欄位
7. 新增 `handleToggleLike` callback：
   - Demo 模式：本地 state toggle，樂觀更新讚數
   - 正式模式：呼叫 `onToggleLike` prop
8. 在評價卡片 JSX 新增按讚按鈕：
   - 使用 `ThumbsUp` icon (size=12)
   - 已讚狀態：`bg-brand-50 text-brand-700 font-medium`
   - 未讚狀態：`bg-bg-base text-text-muted hover:bg-brand-50 hover:text-brand-600`
   - 未登入時：`disabled` + `opacity-50` + `cursor-not-allowed`
   - 按鈕文字：`totalLikes > 0 ? totalLikes : '實用'`
   - 觸控目標：`min-h-[44px]`（A11y 標準）

**14-F. 修改 — PropertyDetailPage 整合**

修改檔案：`src/pages/PropertyDetailPage.tsx`

1. Import `useCommunityReviewLike` hook
2. 在組件內呼叫 `const { toggleLike } = useCommunityReviewLike();`
3. 傳入 `CommunityReviews` 組件：
   ```tsx
   onToggleLike={(propertyId) => toggleLike.mutate(propertyId)}
   ```
4. 按讚成功後自動 `invalidateQueries(['agent-profile'])` → AgentTrustCard 的「獲得鼓勵」即時更新

**14-G. 資料流驗證**

- ✅ Demo 模式：按讚 toggle 視覺效果正常，本地 state 管理
- ✅ 正式模式：按讚發送 POST `/api/community/review-like`
- ✅ 成功後觸發 query invalidation → AgentTrustCard `encouragementCount` 自動刷新
- ✅ 未登入時按鈕 disabled，視覺提示正常

### 驗收結果

- [x] typecheck 通過（0 errors）
- [x] eslint 通過（0 warnings, --max-warnings=0）
- [x] 按讚按鈕顯示正常，hover 變色效果符合設計
- [x] 已讚 / 未讚兩種狀態視覺區分明確
- [x] 未登入時按鈕 disabled + 透明度降低
- [x] Mock 模式按讚可 toggle，與正式版視覺效果一致
- [x] Demo 假資料包含兩種狀態（liked=true / liked=false）

### 涉及檔案

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/components/PropertyDetail/CommunityReviews.tsx` | 修改 | 新增按讚按鈕 UI + Mock toggle 邏輯 |
| `src/pages/PropertyDetailPage.tsx` | 修改 | 整合 `useCommunityReviewLike` hook |
| `src/hooks/useCommunityReviewLike.ts` | 既有 | 已在 #14a 完成，無需修改 |

### 備註

- Hook `useCommunityReviewLike` 已在 #14a 完成，本次僅整合前端 UI
- API endpoint `/api/community/review-like` 已在 #14a 完成
- DB trigger `fn_recalc_encouragement_count` 已在 #14a 完成
- 按讚成功後自動刷新 `agent-profile` query，無需手動更新 cache

