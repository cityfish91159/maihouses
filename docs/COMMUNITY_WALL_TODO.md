# 🏠 社區牆 + 信息流 專案工單 (P7 重點執行)

> **專案狀態**: 🟢 P6 已完成 / 🔵 P7 規劃確認
> **最後更新**: 2025-12-13
> **審計等級**: Google L7+ (嚴格安全與架構標準)

---

## 📋 歷史存檔 (P0 - P6 已完成)

> **狀態摘要**: 基礎架構、權限系統、信息流 React 化、Mock 資料分離均已完成並通過嚴格審計。

<details open>
<summary>點擊查看 P0-P6 完成清單與審計紀錄</summary>

### ✅ P0 - P6 核心里程碑

| 階段 | 狀態 | 核心產出 | 審計結果 |
|------|------|----------|----------|
| **P0 基礎建設** | ✅ | 資料庫視圖 (View), API 容錯機制, 環境變數控制 | 通過 |
| **P1 提示/權限** | ✅ | 全域提示 (Toast), 身分驗證 Hook, 角色守衛 | 通過 |
| **P2 資料 Hook** | ✅ | useFeedData (樂觀更新 UI) | 通過 |
| **P3 版面佈局** | ✅ | 全域頁首 (GlobalHeader), 角色導航與標示 | 通過 |
| **P4 發文系統** | ✅ | 無頭元件 Hook (Headless), 驗證邏輯, UI 整合 | 通過 |
| **P5 住戶端 UI** | ✅ | React 頁面重構, Tailwind 樣式, 國際化 (i18n) | 通過 |
| **P6 房仲端 UI** | ✅ | React 頁面重構, Mock 資料模組化分離 | 通過 |
| **P6 嚴格審計** | ✅ | B1-B8 扣分項全數修復 (型別/日誌/常數/防呆) | **完美 (無缺失)** |

### 🔴 P6 嚴格審計 (B1-B8) 修復紀錄 (2025-12-13)
- [x] **B1 (型別安全)**: 移除 `useConsumer.ts` 中所有不安全的 `as any` 斷言。
- [x] **B2 (日誌清理)**: 移除生產環境中的 `console.error`。
- [x] **B3 (去硬編碼)**: 消除所有 `'test-uuid'` 硬編碼字串，改用常數。
- [x] **B5 (圖片防呆)**: 實作圖片載入失敗的替代畫面 (Fallback) 與網格佈局。
- [x] **B1-B8 驗證**: 通過所有 TypeScript 檢查、建置與單元測試。

</details>

---

## 🚀 P7: 私密牆權限體系 (深度規劃)

> **目標**: 實作 Google L7 等級的權限控制體系，確保「私密牆」不僅是介面隱藏，而是具備資料層級的安全防護與優質的轉化體驗。

### 🌟 架構師建議 (優化方案)

我已針對原始需求加入以下架構建議，以確保系統的擴充性與轉化率：

1.  **權限與角色分離 (Capability-Based Control)**
    *   **問題**: 如果直接在程式碼寫死 `if (user.role === 'resident')`，未來新增「管委會」或「VIP」角色時會難以維護。
    *   **建議**: 改用「能力 (Capability)」來判斷，例如 `CAN_VIEW_PRIVATE_WALL`。
    *   **做法**: 建立一個設定檔，將「角色」對應到「能力」。未來業務邏輯變更時，只需修改設定檔，不用改程式碼。

2.  **軟性攔截策略 (Teaser Strategy)**
    *   **概念**: 不要直接阻擋未授權用戶（例如顯示 403 錯誤），這會降低參與感。
    *   **體驗**:讓訪客或未驗證住戶能看到「私密牆」的存在，但內容呈現「模糊化」，並在上方顯示「驗證身分以解鎖」的按鈕。
    *   **效益**: 利用「錯失恐懼 (FOMO)」心理，有效提升註冊與住戶驗證的轉化率。

3.  **設計級安全 (Security by Design)**
    *   **重點**: 前端 Hook 層 (`useFeedData`) 必須在偵測到無權限時，主動拒絕發送 API 請求或只回傳假資料。
    *   **防護**: 不能只依賴 UI 隱藏（避免有心人士透過瀏覽器開發工具讀取隱藏資料）。

---

### 📅 P7 執行清單 (與工單細節)

#### 🔵 下階段 1: 核心權限基礎建設
> 建立可擴展的權限系統，而非散落的邏輯。

- [x] **P7-1: 定義權限架構** `src/types/permissions.ts`
    - 定義權限清單: `查看私密牆`, `發佈私密貼文`, `查看房仲數據`。
    - 定義角色對照表 (矩陣): 設定哪些角色擁有上述權限。
- [x] **P7-2: 實作權限 Hook** `src/hooks/usePermission.ts`
    - 實作 `hasPermission()` 檢查邏輯。
    - 整合現有的 `useAuth` 身分資料。

---

### 🚨 Google 首席前後端處長代碼審計 - 第二輪 (2025-12-13)

> **審計者**: Google L8 首席前後端處長
> **審計對象**: Commit `66535cd` (feat(p7): implement private wall access control system)
> **綜合評分**: **77/100 (C+ 級，需要改進)**

---

#### 📊 各項目評分

| 項目 | 分數 | 說明 |
|------|------|------|
| **P7-1: permissions.ts** | 92/100 | ✅ 改用 `as const`，型別自動推導 |
| **P7-2: usePermission.ts** | 90/100 | ✅ O(1) Set 查詢，完整功能 |
| **P7-3: Guard.tsx** | 85/100 | ⚠️ 測試仍使用 `as any` |
| **P7-4: Consumer.tsx** | 90/100 | ✅ 整合良好 |
| **P7-5: PrivateWallLocked.tsx** | 95/100 | ✅ ARIA 完整 |
| **P7-6: useFeedData.ts** | 80/100 | ⚠️ 三層過濾但有殘留註解 |

---

### 🚨 Google 首席前後端處長代碼審計 - 第三輪 (2025-12-13)

> **審計者**: Google L8 首席前後端處長
> **審計對象**: Commit `1db1fd0` (feat(p7): optimize permission system to L7+ standards)
> **綜合評分**: **88/100 (B+ 級，良好但有改進空間)**

---

#### 📊 改善對照表

| 項目 | 第二輪 | 第三輪 | 改善 |
|------|--------|--------|------|
| permissions.ts | 85 | 92 | +7 (enum → as const) |
| usePermission.ts | 70 | 90 | +20 (完整功能) |
| PrivateWallLocked.tsx | 75 | 95 | +20 (ARIA 完整) |
| useFeedData.ts | 65 | 80 | +15 (三層過濾) |
| **總分** | **77** | **88** | **+11** |

---

#### ✅ 已修復的問題

| 原 ID | 問題 | 修復狀態 |
|-------|------|----------|
| A3 | 缺少 useMemo 快取 | ✅ `useMemo<Set<Permission>>` 已實作 |
| A4 | 缺少 hasAllPermissions | ✅ 已新增 |
| A5 | 缺少 isLoading | ✅ 已新增 `isLoading: authLoading` |
| A6 | 缺少 permissions 返回值 | ✅ 已暴露 `permissions` Set |
| A7 | ARIA 標籤缺失 | ✅ 完整 `role="alert"`, `aria-labelledby`, `aria-describedby` |
| A9 | enum 影響 tree-shaking | ✅ 改用 `as const` |

---

#### 🔴 尚未完全解決的問題

| ID | 嚴重度 | 檔案 | 問題 | 狀態 |
|----|--------|------|------|------|
| **B1** | 🟡 | `usePermission.ts:29` | `role as Role` 類型斷言仍存在 | ⚠️ 未修 |
| **B2** | 🟡 | `Guard.test.tsx:28,43` | `(usePermission as any)` 仍存在 | ⚠️ 未修 |
| **B3** | 🟢 | `useFeedData.ts:481` | 無效註解 `if (!isProfileCacheValid)` | ⚠️ 垃圾代碼 |
| **B4** | 🟡 | `useFeedData.ts` | API 層仍返回全部資料，僅前端過濾 | 需後端配合 |

---

#### 🎯 首席處長引導意見 (第三輪)

##### B1: `role as Role` 類型斷言

```
問題位置: usePermission.ts:29
  const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];

根本原因: useAuth 返回的 role 類型可能為 string | undefined

引導方案:
1. 在 useAuth 內部確保返回類型為 Role | null
2. 或在 usePermission 使用 type guard:

   function isValidRole(r: unknown): r is Role {
     return typeof r === 'string' && r in ROLE_PERMISSIONS;
   }
   
   const rolePermissions = isValidRole(role) 
     ? ROLE_PERMISSIONS[role] 
     : [];

效益: 消除類型斷言，讓 TypeScript 真正保護你
```

##### B2: 測試中的 `as any`

```
問題位置: Guard.test.tsx:28, 43
  (usePermission as any).mockReturnValue({...})

這是「便宜行事」的標誌，繞過型別檢查。

引導方案:
1. 使用 vi.mocked 並提供正確類型:
   
   vi.mocked(usePermission).mockReturnValue({
     hasPermission: vi.fn().mockReturnValue(true),
     hasAnyPermission: vi.fn(),
     hasAllPermissions: vi.fn(),
     role: 'resident',
     isAuthenticated: true,
     isLoading: false,
     permissions: new Set(['view:private_wall'])
   });

2. 或定義 mock 工廠:
   
   const createMockPermission = (overrides = {}) => ({
     hasPermission: vi.fn().mockReturnValue(false),
     ...overrides
   });
```

##### B3: 無效註解/垃圾代碼

```
問題位置: useFeedData.ts:481
  if (!isProfileCacheValid) { /* This variable doesn't exist here, just placeholder comment */ }

這行代碼毫無作用，只是開發過程的殘留物。

引導:
直接刪除這行，不要留下「想做但沒做」的痕跡。
垃圾代碼會誤導後續維護者，是技術債的來源。
```

##### B4: API 層資料安全 (需後端配合)

```
問題: 目前 useFeedData 的 API 查詢沒有根據權限過濾
  const query = supabase.from('community_posts').select(...)
  
API 會返回所有貼文（包括私密），只在前端過濾。
惡意用戶可透過 DevTools Network 看到私密資料。

前端可做的改進:
1. 無權限時，查詢加上 visibility 條件:
   
   if (!canViewPrivate) {
     query.eq('visibility', 'public');
   }

2. 或使用 Supabase RLS (Row Level Security)，讓後端根據 JWT 自動過濾

這是 **Security by Design** 的核心原則:
「敏感資料不應該離開伺服器」
```

---

#### 🔴 發現的問題與便宜行事

| ID | 嚴重度 | 檔案 | 問題 |
|----|--------|------|------|
| **A1** | 🔴 | `usePermission.ts:23,28` | 使用 `role as Role` 類型斷言，繞過類型檢查 |
| **A2** | 🔴 | `Guard.test.tsx:21,35` | 使用 `(usePermission as any)` 嚴重違規 |
| ~~A3~~ | ~~🟡~~ | ~~usePermission.ts~~ | ~~缺少 useMemo 快取~~ ✅ 已修 |
| ~~A4~~ | ~~🟡~~ | ~~usePermission.ts~~ | ~~缺少 hasAllPermissions~~ ✅ 已修 |
| ~~A5~~ | ~~🟡~~ | ~~usePermission.ts~~ | ~~缺少 isLoading~~ ✅ 已修 |
| ~~A6~~ | ~~🟡~~ | ~~usePermission.ts~~ | ~~缺少 permissions 返回值~~ ✅ 已修 |
| ~~A7~~ | ~~🟡~~ | ~~PrivateWallLocked.tsx~~ | ~~缺少 ARIA 標籤~~ ✅ 已修 |
| **A8** | 🟡 | `useFeedData.ts` | 資料層安全僅為前端過濾，API 仍可能返回私密資料 |
| ~~A9~~ | ~~🟢~~ | ~~permissions.ts~~ | ~~使用 enum~~ ✅ 改用 as const |

---

#### 🎯 首席處長引導意見 (必須修復)

##### B1/B2: 消除所有 `as any` 和 `as Role` 類型斷言

```
這是「寫文件說要做但代碼沒改完」的典型案例。

B1 引導 (usePermission.ts:29):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
問題: const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
原因: role 類型為 string | undefined，強制斷言繞過檢查

修復: 使用 Type Guard 函數
  
  // 在檔案開頭定義
  const isValidRole = (r: unknown): r is Role => 
    typeof r === 'string' && Object.keys(ROLE_PERMISSIONS).includes(r);
  
  // 使用時
  const rolePermissions = isValidRole(role) 
    ? ROLE_PERMISSIONS[role] 
    : [];

效益: TypeScript 編譯器會正確推導類型，不再需要斷言
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B2 引導 (Guard.test.tsx):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
問題: (usePermission as any).mockReturnValue({...})
這會讓 mock 返回值沒有型別檢查，測試可能遺漏必要欄位

修復: 定義完整的 mock 工廠

  // 在測試檔案開頭定義
  const createPermissionMock = (hasPermission = false) => ({
    hasPermission: vi.fn().mockReturnValue(hasPermission),
    hasAnyPermission: vi.fn().mockReturnValue(hasPermission),
    hasAllPermissions: vi.fn().mockReturnValue(hasPermission),
    role: hasPermission ? 'resident' : 'guest',
    isAuthenticated: hasPermission,
    isLoading: false,
    permissions: new Set<Permission>()
  });

  // 使用時
  vi.mocked(usePermission).mockReturnValue(createPermissionMock(true));
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

##### B3: 刪除垃圾代碼

```
問題位置: useFeedData.ts:481
  if (!isProfileCacheValid) { /* This variable doesn't exist here... */ }

這行代碼是開發過程的殘留物，毫無作用。

引導: 直接刪除整行
不要留下「想做但沒做」的註解，這會誤導後續維護者。
垃圾代碼 = 技術債
```

##### B4: API 層資料安全強化

```
問題: 查詢沒有根據權限過濾，私密資料會進入 Network Response

前端即時可做的改進 (useFeedData.ts fetchApiData):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
在 Supabase 查詢加上條件過濾:

  const query = supabase
    .from('community_posts')
    .select('...')
    .order('is_pinned', { ascending: false });

  // 🔐 Security: 無權限時只查詢公開貼文
  if (!canViewPrivate) {
    query.eq('visibility', 'public');
  }
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

長期方案 (需後端):
1. 啟用 Supabase RLS (Row Level Security)
2. 根據 JWT 的 role claim 自動過濾
3. 前端過濾變成第二道防線而非唯一防線
```

---

#### 🟡 下階段 2: 路由與組件守衛
> 在介面層統一攔截邏輯。

- [x] **P7-3: 開發守衛組件** `src/components/auth/Guard.tsx`
    - 開發 `<RequirePermission>` 組件。
    - 支援自定義替代畫面（例如顯示「鎖定畫面」而非一片空白）。
- [x] **P7-4: 整合住戶端分頁** `src/pages/Feed/Consumer.tsx`
    - 將「私密牆」分頁內容包裹在守衛組件中。

#### 🟠 下階段 3: 私密牆鎖定體驗 (UI/UX)
> 打造高質感的「未授權」體驗。

- [x] **P7-5: 開發鎖定畫面組件** `src/components/Feed/PrivateWallLocked.tsx`
    - **視覺**: 背景顯示模糊的假貼文 (骨架屏/模糊特效)。
    - **覆蓋層**: 中央顯示鎖頭圖示與引導文案（"僅限社區住戶查看"）。
    - **互動**:
        - 未登入者 -> 點擊彈出登入視窗。
        - 已登入未驗證者 -> 點擊提示「請進行住戶驗證」。

#### 🔴 下階段 4: 資料層安全與驗證
> 確保資料流安全，防止外洩。

- [x] **P7-6: 資料層安全防護** `useFeedData.ts`
    - 當分頁為 `private` 且用戶無權限時，Hook 應直接回傳空陣列或鎖定狀態，嚴禁發送真實 API 請求。
- [ ] **P7-7: 模擬情境驗證** (測試計畫)
    - 需驗證以下四種情境：
        1.  **訪客**: 看得到分頁，內容鎖定，點擊跳登入。
        2.  **一般會員 (驗證中)**: 看得到分頁，內容鎖定，點擊提示驗證。
        3.  **認證住戶**: 完整瀏覽內容與發文功能。
        4.  **房仲**: 可瀏覽 (唯讀)，不可發文 (隱藏發文框)。

---

## 🧪 驗證標準 (驗收項目)

- [ ] **零資料外洩**: 使用者無法透過開發工具 (DevTools) 修改 CSS 來看到私密內容（確保內容根本沒有被渲染）。
- [ ] **擴充性**: 未來新增角色（如管委會）時，不需修改介面程式碼，僅需調整設定。
- [ ] **無障礙性**: 鎖定畫面需具備正確的 ARIA 標籤，讓螢幕閱讀器能正確朗讀。
- [ ] **測試覆蓋**: 針對權限 Hook 與守衛組件建立完整的單元測試。

---

## 📁 相關檔案索引

| 檔案 | 用途 |
|------|------|
| `src/types/permissions.ts` | **[新增]** 權限定義中心 |
| `src/hooks/usePermission.ts` | **[新增]** 權限檢查 Hook |
| `src/components/Feed/PrivateWallLocked.tsx` | **[新增]** 鎖定畫面 UI |
| `src/pages/Feed/Consumer.tsx` | 分頁切換與整合 |
| `src/hooks/useAuth.ts` | 現有的身分來源 |
