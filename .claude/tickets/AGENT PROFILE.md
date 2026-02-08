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
- [ ] **#3** [P1] createLead 補傳 preferredChannel 欄位
- [ ] **#4** [P2] LINE 按鈕色統一（併入 #2） ✅ 已完成於 #2

### 正式版專屬

- [ ] **#8** [P0] 社會證明真實數據 — 瀏覽人數（uag_events）+ 賞屋組數（trust_cases）替換假數據
- [x] **#10** [P0] 社區評價正式版 API 資料層修正 + Mock fallback（Mock fallback ✅ / 按鈕連結 ✅ / 正式版資料層待處理）

### 信任分 / 鼓勵數

- [ ] **#12** [P1] 信任分 Tooltip 修正 — 移除假拆分，改為說明型 Tooltip + seed 指標校正

### Header / 品牌統一

- [ ] **#11** [P1] 詳情頁 Header 品牌統一 — 統一使用 `<Logo>` 組件 + 返回按鈕功能 + 色彩 design token + 無障礙補強

### 手機版 UX 優化

- [ ] **#9** [P1] 手機版 UX 優化 — DetailPage 11 項 + UAG 8 項 + 跨頁面 3 項（共 22 項）

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

- [ ] ContactModal 選擇的偏好聯絡方式有寫入 Lead
- [ ] Lead 的 `needs_description` 包含 `[偏好聯絡：LINE]` 等前綴
- [ ] 現有測試通過

---

## #4 [P2] LINE 按鈕色統一（併入 #2）

> **此項已併入 #2 一起處理。** 在 #2 移除預約按鈕、重構雙按鈕 UX 時，同時將硬編碼 `bg-[#06C755]` 改為 CSS variable。

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

## #9 [P1] 手機版 UX 優化（DetailPage + UAG）

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

### UAG 手機版優化（U1-U8）

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

#### 12-B. [P2] MH-100001 seed 指標校正（正式版）

| 檔案 | 改動 |
|------|------|
| `supabase/migrations/YYYYMMDD_fix_agent_seed_metrics.sql` | **新增** — 為 seed agent 補齊指標欄位 |

```sql
UPDATE public.agents
SET
  service_rating = 4.8,
  completed_cases = 45,
  encouragement_count = 156
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
-- Trigger 自動重算 trust_score = 60 + 19 + 9 + 7 = 95
```

Trigger `trg_agents_trust_score` 會在 UPDATE 時自動執行 `fn_calculate_trust_score`，重算 `trust_score`。

### 涉及檔案清單

| 檔案 | 操作 | 說明 |
|------|------|------|
| `src/components/AgentTrustCard.tsx` | 修改 | 移除假拆分函數 + Tooltip 改說明型 + 清理 import |
| `supabase/migrations/YYYYMMDD_fix_agent_seed_metrics.sql` | 新增 | seed agent 指標校正（觸發 Trigger 重算） |

### Mock 版影響

**無影響。** `isDemo=true` 時 `shouldFetchProfile=false`，不呼叫 API。Tooltip 顯示相同的說明文字，不涉及任何數值拆分。

### 驗收標準

- [ ] Tooltip 不再顯示假拆分數值
- [ ] Tooltip 顯示「信任分數 N / 100」+ 三項指標說明 + 更新頻率
- [ ] `getTrustBreakdown` 函數已移除
- [ ] `Clock`、`CheckCircle`、`FileText` import 已清理（確認無其他使用）
- [ ] MH-100001 的 `service_rating`、`completed_cases` 已補齊（migration）
- [ ] Trigger 重算後 `trust_score` 為合理值（預期 95）
- [ ] Mock 頁行為不變
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

#11 詳情頁 Header 品牌統一（獨立，建議在 #2 之後做）
  ├─ 11-A Logo 組件統一（獨立）
  ├─ 11-B 返回按鈕功能（獨立）
  ├─ 11-C 色彩 design token（獨立）
  └─ 11-D/E 無障礙 + 手機版微調（獨立）

#9 手機版 UX 優化（建議在 #2、#11 之後做，因為 #2、#11 會改動同樣的組件）
  ├─ D1-D11 DetailPage 優化（依賴 #2 完成後的雙按鈕佈局）
  ├─ U1-U8 UAG 優化（獨立）
  └─ C1-C3 跨頁面共通（獨立，可隨時做）
```

---

## 建議實作順序

| 順序 | 工單 | 優先級 | 版本 | 預估影響檔案數 |
|------|------|--------|------|---------------|
| 1 | #1 agentId fallback | P0 | 正式+Mock | 1 |
| 2 | #2 移除預約看屋 + 雙按鈕 UX（含 #4） | P0 | 正式+Mock | 9（含刪除 3 個檔案） |
| 3 | #8 社會證明真實數據 | P0 | 正式版 | 6（含新增 2 個檔案） |
| 4 | #5 詳情頁 mock agent | P0 | Mock | 1 |
| 5 | #6 UAG Header mock 入口 | P0 | Mock | 2 |
| 6 | #7 Profile 頁 mock | P0 | Mock | 2-3 |
| 7 | #3 createLead 補 preferredChannel | P1 | 正式 | 2 |
| 8 | #12 信任分 Tooltip 修正 + seed 校正 | P1 | 正式+Mock | 1 + 1 migration |
| 9 | #11 詳情頁 Header 品牌統一 | P1 | 正式+Mock | 1 |
| 10 | #10 社區評價正式版資料層修正 | P0 | 正式 | 2（migration） |
| 11 | #9 手機版 UX 優化（22 項） | P1 | 正式+Mock | 12+ |
