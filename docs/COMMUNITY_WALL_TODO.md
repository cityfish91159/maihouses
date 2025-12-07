# 🏠 社區牆 + 信息流 待辦清單

> 供 AI Agent 與開發者協作使用  
> 最後更新：2025-12-07

---

## 🎯 核心目標

| # | 目標 | 說明 |
|---|------|------|
| 1 | Header 統一 | 三頁共用 GlobalHeader（dropdown/ARIA/角色感知） |
| 2 | 打字系統導入 | 三頁共用 Composer + API 串接 |
| 3 | 信息流 React 化 | feed-consumer + feed-agent → React |
| 4 | Mock/API 切換 | 統一 env.ts 控制，三頁左下角按鈕 |

---

## 📊 進度總覽

| 階段 | 狀態 | 時間 | 說明 |
|------|------|------|------|
| P0 基礎設定 | ✅ | - | SQL VIEW + API 容錯 |
| P0.5 環境控制層 | ✅ | 45m | `mhEnv` 已建立，審計缺失已修復 |
| P0.5-FIX 審計修復 | ✅ | 40m | 清除死碼 + Key 統一 + 邏輯簡化 |
| P1 Toast 系統 | ✅ | 55m | sonner+notify 全面收斂（含 PropertyUploadPage/依賴/死碼清理） |
| P1.5 權限系統 | ✅ | 1h | useAuth + 角色判斷 + 審計 8 項缺失已全數修復 |
| P2 useFeedData | ✅ | 30m | 477 行 Hook，移除 reviews/questions，communityId optional |
| P3 GlobalHeader | 🔴 | 1.5h | 三頁共用 Header |
| P4 Composer | 🔴 | 2h | headless + UI 統一 |
| P4.5 Loading/錯誤狀態 | 🔴 | 1h | Skeleton + Empty + Error + Retry |
| P5 feed-consumer | 🔴 | 2h | 靜態 → React |
| P6 feed-agent | 🔴 | 2h | 靜態 → React |
| P6.5 草稿自動儲存 | 🔴 | 30m | localStorage debounce |
| P7 私密牆權限 | 🔴 | 1h | membership 驗證 |
| P8 部署驗證 | 🔴 | 1h | 情境矩陣測試 |
| P9 優化防呆 | 🔴 | 1h | 狀態文案 + ErrorBoundary |

---

## ✅ P0：基礎設定（已完成）

- [x] P0-0: SQL VIEW 驗證
- [x] P0-1: getReviews() 容錯

---

## ⚠️ P0.5：環境控制層（實作完成但有技術債）

**結果**：`mhEnv` 中央化 Mock/API 切換（URL + localStorage 同步），社區牆用戶流程已套用

### 完成項目（2025-12-07）
- [x] `src/lib/mhEnv.ts`：`isMockEnabled` / `setMock` / `subscribe`，處理 URL 參數與 localStorage
- [x] `useCommunityWallData.ts`：初始/切換改用 `mhEnv`，移除頁面自行存偏好
- [x] `MockToggle` 移至 `src/components/common/MockToggle.tsx`，供多頁共用
- [x] `Community/Wall.tsx`：簡化 Mock 流程，權限切換保留，mock 切換由 `mhEnv` 接管

### 驗證證據
- [x] `npm run build`（2025-12-07，exit 0）
- [x] `grep MockToggle`：僅 common 版本
- [x] `grep mhEnv`：Wall + useCommunityWallData 套用

---

## ✅ P0.5-AUDIT：審計發現 7 項缺失（已全數修復）

> **審計時間**：2025-12-07 | **修復完成**：2025-12-07

| ID | 嚴重度 | 問題摘要 | 狀態 |
|----|--------|----------|------|
| A1 | 🔴 | localStorage Key 命名衝突 → `MOCK_DATA_STORAGE_KEY` + 刪 `useMockState.ts` | ✅ |
| A2 | 🔴 | `initialUseMock` 雙重呼叫 → Hook 單一來源 | ✅ |
| A3 | 🟡 | `useEffect` 缺 cleanup → 加 `return unsubscribe` | ✅ |
| A4 | 🟡 | `window.confirm()` 阻塞 → 直接移除 | ✅ |
| A5 | 🟡 | `useMockState.ts` 死碼 → 刪除 | ✅ |
| A6 | 🟡 | Wall.tsx 包裝 `setUseMock` → 直接用 Hook setter | ✅ |
| A7 | 🟢 | `mhEnv` 缺型別 → 補 `MhEnv` interface | ✅ |

---

## ✅ P0.5-FIX：審計修復任務（40m 完成）

### 執行清單（2025-12-07 完成）

| 序號 | 任務 | 檔案 | 狀態 |
|------|------|------|------|
| FIX-1 | 刪除 `useMockState.ts` 死碼 | `src/hooks/useMockState.ts` | ✅ |
| FIX-2 | `MOCK_STORAGE_KEY` → `MOCK_DATA_STORAGE_KEY` | `useCommunityWallData.ts:25` | ✅ |
| FIX-3 | 刪除 Wall.tsx `initialUseMock` | `Wall.tsx` | ✅ |
| FIX-4 | 刪除 Wall.tsx `setUseMock` 包裝 | `Wall.tsx` | ✅ |
| FIX-5 | Hook 移除 `initialUseMock` option | `useCommunityWallData.ts` | ✅ |
| FIX-6 | `useEffect` 加顯式 cleanup | `useCommunityWallData.ts` | ✅ |
| FIX-7 | `MockToggle` 移除 `window.confirm()` | `MockToggle.tsx` | ✅ |
| FIX-8 | `mhEnv` 加 TypeScript interface | `mhEnv.ts` | ✅ |

### 驗證證據

```bash
grep -r "useMockState" src/        # 0 matches
grep -r "initialUseMock" src/      # 0 matches
grep -r "window.confirm" src/      # 0 matches
npm run build                      # exit 0
```

### 部署
- commit `e8ad92f` → Vercel 部署
- 網址：https://maihouses.vercel.app/maihouses/community/test-uuid/wall

---

### 待辦/擴充建議
- feed-consumer / feed-agent React 化時，直接共用 `mhEnv` + common `MockToggle`

---

## ✅ P1：Toast 系統（已完成）

**結果**：sonner + `notify` 全面收斂，含 PropertyUploadPage、依賴與死碼清理

### 修復紀錄（2025-12-07 二次補完）
- [x] P1-E1 `PropertyUploadPage` 7 處 `showToast` → `notify`，錯誤加上重試 action
- [x] P1-E2 移除 `react-hot-toast` 依賴（`npm uninstall react-hot-toast`，package.json/package-lock 同步）
- [x] P1-E3 `vite.config.ts` manualChunks 移除 `react-hot-toast`
- [x] P1-E4 刪除舊 `src/components/ui/Toast.tsx` 死碼

### 驗證證據（2025-12-07 Google 首席審計通過）
- [x] `npm run build`（退出碼 0）
- [x] `grep alert\(` → 0 結果
- [x] `grep useToast|showToast|ToastProvider` → 0 結果
- [x] `grep react-hot-toast` → 0 結果（程式碼 + package-lock）
- [x] `grep notify.` → 20+ 處覆蓋 Community/UAG/Report/PropertyUpload
- [x] Vercel 部署成功（commit `1aa0887`）

---

## 🟡 P1.5：權限系統（API 前置條件）

**目的**：沒有權限判斷，API 串接會卡在 401/403

| 任務 | 說明 | 優先級 |
|------|------|--------|
| P1.5-1 | 建立 `src/hooks/useAuth.ts`，含角色/錯誤/登出 | ✅ |
| P1.5-2 | 判斷角色 guest/member/resident/agent（app_metadata/user_metadata） | ✅ |
| P1.5-3 | user_communities 表建立（或暫用 flag） | ⏳ 待後端 |
| P1.5-4 | 未登入時 Composer 顯示「請先登入」 | ✅ |

### 本次進展（2025-12-07）
- `useAuth` 增強：role 推導、isAuthenticated、error、signOut helper
- 社區牆權限：未登入強制視為 guest，不再允許手動角色繞過
- Composer gating：未登入顯示登入 CTA，PostModal 禁用輸入與提交
- 私密牆按鈕/提交附帶 notify 提示，阻擋未授權操作

---

## ✅ P1.5-AUDIT-3：三次審計發現 4 項殘留問題（已修復）

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：已修復（2025-12-07）

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| D1 | 🔴 | `ReviewsSection` 使用 `role` 而非 `effectiveRole` — 角色不一致 | `Wall.tsx:375` | ✅ |
| D2 | 🔴 | `QASection` 使用 `role` 而非 `effectiveRole` — 角色不一致 | `Wall.tsx:388` | ✅ |
| D3 | 🔴 | `BottomCTA` 使用 `role` 而非 `effectiveRole` — 角色不一致 | `Wall.tsx:405` | ✅ |
| D4 | 🟡 | `isAuthenticated` prop 傳入 PostsSection 但未使用 — 死 prop | `PostsSection.tsx:139,151` | ✅ |

### 修復紀錄（2025-12-07）
- D1：`ReviewsSection` 改用 `effectiveRole`，確保與貼文/QA 一致。
- D2：`QASection` 改用 `effectiveRole`，問答區權限與貼文區同步。
- D3：`BottomCTA` 改用 `effectiveRole`，底部 CTA 與整頁角色一致。
- D4：移除 `isAuthenticated` 死 prop（介面、解構、傳入點全刪），`PostsSection` 以 `perm.isGuest` 單一來源判斷訪客。

### 驗證證據

```bash
npm run build      # exit 0
grep -n "effectiveRole" src/pages/Community/Wall.tsx | head -n 5
grep -n "isAuthenticated" src/pages/Community/components/PostsSection.tsx  # 僅註解/無解構
grep -n "authError" src/pages/Community/Wall.tsx  # Hook 先於早退，避免 React error 310
```

---

## ✅ P1.5-AUDIT-5：徹底重構 Hook 順序修復 React error #310

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：已修復（2025-12-07）

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| F1 | 🔴 | 多個 Hooks 散落於 early return 之間 — 觸發 React error #310 | `Wall.tsx` 全域 | ✅ |
| F2 | 🔴 | `useCommunityWallData` 在 `!communityId` 早退後呼叫 — Hook 數量不一致 | `Wall.tsx:103-117` | ✅ |

### 修復紀錄（2025-12-07）
- F1：**所有 Hooks 上移到函數最上方**，建立「條件渲染區」標記，任何 `return` 都在 Hooks 之後。
- F2：`useCommunityWallData(communityId ?? '', ...)` 確保 Hook 無條件呼叫，空字串時資料為空但不違規。

### 驗證證據

```bash
npm run build      # exit 0
# 網站正常載入，無 React error 310
```

---

## ✅ P1.5-AUDIT-6：六次審計通過 + 架構優化建議

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：✅ 通過，附架構優化建議

### 審計範圍
- `Wall.tsx`：Hook 順序、early return、useMemo/useCallback/useEffect 分布
- `useAuth.ts`：狀態管理、deriveRole 邏輯
- `PostsSection.tsx`：props 介面、perm 計算
- `PostModal.tsx`：guest 阻擋 useEffect

### 審計結論
**P1.5 權限系統功能完整，React Hook 規範已遵守。** 以下為架構優化建議（非 bug，可選擇性實施）：

---

### 🟢 G1：建議 — useAuth 可抽離 Context 避免重複訂閱

**現況**：每個呼叫 `useAuth()` 的組件都會獨立訂閱 `onAuthStateChange`。

**建議**：
1. 建立 `AuthProvider` 搭配 `AuthContext`
2. `useAuth()` 改為 `useContext(AuthContext)`
3. 整個 App 只有一個訂閱，子組件共享狀態

**引導**：
```
// src/context/AuthContext.tsx
// 1. createContext<AuthState>()
// 2. AuthProvider 內呼叫 supabase.auth.onAuthStateChange
// 3. children 透過 useContext 取得 state
// 4. App.tsx 包 <AuthProvider>
```

**優先級**：🟢 低（目前 Wall 只有一處呼叫，暫無效能問題）

---

### 🟢 G2：建議 — PostsSection 內 perm 重複計算

**現況**：
```tsx
// Wall.tsx
const perm = useMemo(() => getPermissions(effectiveRole), [effectiveRole]);

// PostsSection.tsx
const perm = getPermissions(role); // 又算一次
```

**建議**：
1. `PostsSection` 增加 `perm` prop，由父層傳入
2. 或者用 `useMemo` 包裝避免每次 render 重算

**引導**：
```
// 方案 A：傳 perm prop
<PostsSection role={effectiveRole} perm={perm} ... />

// 方案 B：內部 useMemo
const perm = useMemo(() => getPermissions(role), [role]);
```

**優先級**：🟢 低（getPermissions 是純函數，計算成本極低）

---

### 🟢 G3：建議 — PostModal guest 阻擋可精簡

**現況**：
```tsx
// 用 useEffect 自動關閉
useEffect(() => {
  if (isOpen && isGuest) {
    onClose();
  }
}, [isOpen, isGuest, onClose]);

if (!isOpen || isGuest) return null;
```

**建議**：
父層 `openPostModal` 已有 guard，理論上 guest 不會到這裡。可以：
1. 移除 PostModal 內的 guest 處理，信任父層
2. 或保留作為防禦性程式碼（目前做法）

**結論**：目前做法是正確的防禦性編程，**無需修改**。

---

### 🟢 G4：建議 — DEV mock role 邏輯可抽離 Custom Hook

**現況**：
```tsx
// Wall.tsx 有 80+ 行處理 DEV role 切換
const initialRole = useMemo<Role>(() => { ... }, []);
const [role, setRoleInternal] = useState<Role>(initialRole);
useEffect(() => { /* URL 同步 */ }, [...]);
useEffect(() => { /* storage 同步 */ }, [...]);
const setRole = useCallback(() => { ... }, [...]);
```

**建議**：
1. 抽離為 `useDevRole()` Custom Hook
2. 回傳 `{ role, setRole, isDevMode }`
3. 正式環境直接回傳 `{ role: 'guest', setRole: noop, isDevMode: false }`

**引導**：
```
// src/hooks/useDevRole.ts
export function useDevRole(authRole: Role, isAuthenticated: boolean) {
  if (!import.meta.env.DEV) {
    return { effectiveRole: isAuthenticated ? authRole : 'guest', setRole: () => {}, isDevMode: false };
  }
  // DEV 邏輯...
}
```

**優先級**：🟢 低（可讀性優化，非功能性問題）

---

## ✅ P1.5-AUDIT-4：React error 310（Hook 條件順序錯誤）

> **審計時間**：2025-12-07 | **審計人**：GitHub Copilot 二次覆核
> **狀態**：已修復（2025-12-07）

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| C1 | 🔴 | PostModal render 中呼叫 onClose() — React side effect 違規 | `PostModal.tsx:161-164` | ✅ |
| C2 | 🟡 | authError 只 notify 不阻擋 — 用戶可繼續以 guest 操作 | `Wall.tsx:124-126` | ✅ |
| C3 | 🟡 | isGuest 計算邏輯重複 — `!isAuthenticated || perm.isGuest` 語意冗餘 | `PostsSection.tsx:163` | ✅ |
| C4 | 🟢 | effectiveRole useMemo 過度複雜 — DEV 專用邏輯混入正式流程 | `Wall.tsx:128-135` | ✅ |

### 修復紀錄（2025-12-07）
- C1：PostModal 改用 `useEffect` 關閉訪客誤開，render 階段保持純函數，並以 `if (!isOpen || isGuest) return null` 防守。
- C2：Auth error 改為專用錯誤畫面 + 重新載入按鈕，並用 `useEffect` 單次 toast 提醒。
- C3：`isGuest` 單一來源 `perm.isGuest`，移除雙重條件，語意更清晰。
- C4：`effectiveRole` 簡化，DEV mock 與正式邏輯分離，正式路徑直接使用 authRole。

### 驗證證據

```bash
npm run build      # exit 0
```

## ✅ P1.5-AUDIT：首席審計發現 8 項缺失（已全數修復）

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **修復完成**：2025-12-07

| ID | 嚴重度 | 問題摘要 | 狀態 |
|----|--------|----------|------|
| B1 | 🔴 | `useAuth.loading` 沒被使用：頁面在 auth 載入中時沒有 loading 狀態 | ✅ |
| B2 | 🔴 | `PostsSection` 雙重 hook 衝突：同時用 `role` prop 和 `useAuth()` | ✅ |
| B3 | 🔴 | `PostModal` 訪客不該能開，但只做 UI 禁用沒做阻擋 | ✅ |
| B4 | 🟡 | `effectiveRole` 邏輯散落：Wall.tsx 和 PostsSection.tsx 各自計算 | ✅ |
| B5 | 🟡 | `useAuth.error` 沒被消費：錯誤發生時用戶看不到任何提示 | ✅ |
| B6 | 🟡 | 按讚沒有 auth guard：`handleLike` 未登入也能呼叫 | ✅ |
| B7 | 🟢 | `signOut` 沒被任何地方使用：已加註解說明 P3 會使用 | ✅ |
| B8 | 🟢 | `AuthRole` type 和 `types.ts` 的 `Role` 重複定義 | ✅ |

### 修復執行紀錄（2025-12-07）

| 序號 | 修復項目 | 檔案 | 變更說明 |
|------|----------|------|----------|
| FIX-B1 | auth loading 判斷 | `Wall.tsx:112-120` | `if (authLoading) return <WallSkeleton />` |
| FIX-B2 | 移除重複 useAuth | `PostsSection.tsx` | 刪除 import/呼叫，改用 `isAuthenticated` prop |
| FIX-B3 | Modal 訪客阻擋 | `PostModal.tsx:153-158` | `if (isGuest) { onClose(); return null; }` |
| FIX-B4 | effectiveRole 單一來源 | `Wall.tsx:128-135` | 只在 Wall 計算，傳 `effectiveRole` 給子組件 |
| FIX-B5 | auth error 提示 | `Wall.tsx:124-126` | `if (authError) notify.error(...)` |
| FIX-B6 | 按讚 auth guard | `Wall.tsx:211-215` | `if (!isAuthenticated) { notify.error(...); return; }` |
| FIX-B7 | signOut 標記 | `useAuth.ts:79-82` | 加 JSDoc 說明 P3 會使用 |
| FIX-B8 | 統一 Role type | `useAuth.ts:4` | 刪除 `AuthRole`，改 `import { Role } from 'types/community'` |

### 驗證證據

```bash
npm run build                           # ✓ exit 0
grep -n "authLoading" Wall.tsx          # ✓ 109, 112 行使用
grep -n "useAuth" PostsSection.tsx      # ✓ 0 呼叫（僅註解）
grep -rn "effectiveRole" Community/     # ✓ 僅 Wall.tsx 計算
grep -n "authError" Wall.tsx            # ✓ 109, 124, 125 行使用
grep -rn "AuthRole" src/                # ✓ 0 結果
```

---

### B1 修復引導（已完成）
**問題**：`useAuth()` 回傳 `loading: true` 期間，頁面已經在渲染，導致 `isAuthenticated=false` → 被當成訪客。

**修法**：
1. `Wall.tsx` 的 `WallInner` 開頭加判斷：`if (authLoading) return <WallSkeleton />`
2. `PostsSection` 不需要自己呼叫 `useAuth`（見 B2）

---

### B2 修復引導
**問題**：`PostsSection` 從 props 拿到 `role`，又自己呼叫 `useAuth()` 取 `isAuthenticated`，兩者來源不同步。

**修法**：
1. 刪除 `PostsSection` 內的 `useAuth()` 呼叫
2. 從 props 加一個 `isAuthenticated: boolean`，由 `Wall.tsx` 傳入
3. 或者完全用 `role === 'guest'` 判斷，不要混用

---

### B3 修復引導
**問題**：`PostModal` 收到 `role='guest'` 時只是禁用 UI，但訪客根本不該能打開 Modal。

**修法**：
1. `openPostModal()` 已經有 guard，移除 `PostModal` 內的 guest 處理邏輯
2. 或者 `PostModal` 加 `if (role === 'guest') return null` 作為最後防線
3. 若要保留，至少加上 `useEffect` 在 role 變 guest 時自動關閉

---

### B4 修復引導
**問題**：`effectiveRole` 計算在 `Wall.tsx` 做一次，`PostsSection` 又自己算 `effectiveIsGuest`。

**修法**：
1. `Wall.tsx` 算出 `effectiveRole` 和 `isAuthenticated` 後，傳給所有子組件
2. 子組件不再自己呼叫 `useAuth()`，確保單一來源

---

### B5 修復引導
**問題**：`useAuth` 有 `error` 狀態，但沒地方顯示。

**修法**：
1. `Wall.tsx` 加判斷：`if (authError) return <AuthErrorState error={authError} onRetry={...} />`
2. 或者在 `useEffect` 中 `notify.error('登入狀態異常', authError.message)`

---

### B6 修復引導
**問題**：`PostCard.handleLike` 沒有 auth guard，未登入時點按讚會呼叫 API 然後 401。

**修法**：
1. `PostCard` 增加 `isAuthenticated` prop
2. `handleLike` 開頭：`if (!isAuthenticated) { notify.error('請先登入'); return; }`
3. 或者把 `onLike` 的 guard 邏輯移到 `Wall.tsx` 統一處理

---

### B7 修復引導
**問題**：`signOut` 寫了但沒人用。

**修法**：
1. 等 P3 GlobalHeader 實作時接上登出按鈕
2. 或者先在 `RoleSwitcher` 加個開發用登出按鈕測試

---

### B8 修復引導
**問題**：`useAuth.ts` 定義 `AuthRole`，`types.ts` 定義 `Role`，內容一樣但沒統一。

**修法**：
1. 刪除 `useAuth.ts` 的 `AuthRole`
2. 改成 `import type { Role } from '../pages/Community/types'` 或搬到共用 `src/types/`
3. 確保全專案只有一個 Role type

---

## ✅ P2：useFeedData Hook（資料層先行）

**做法**：複製 `useCommunityWallData.ts` (454行) 改名，刪 reviews 邏輯
**結果**：`src/hooks/useFeedData.ts` (477行)，專為信息流設計

| 任務 | 說明 | 狀態 |
|------|------|------|
| P2-1 | 建立 `src/hooks/useFeedData.ts` | ✅ |
| P2-2 | communityId 為 optional 參數（可篩選特定社區或全部） | ✅ |
| P2-3 | createPost / toggleLike / refresh 方法 | ✅ |
| P2-4 | 使用 mhEnv 控制 Mock/API | ✅ |

### 與 useCommunityWallData 差異

| 項目 | useCommunityWallData | useFeedData |
|------|---------------------|-------------|
| 資料範圍 | 單一社區 | 跨社區信息流 |
| communityId | 必填 | **optional** |
| reviews | ✅ 包含 | ❌ 移除 |
| questions | ✅ 包含 | ❌ 移除 |
| 資料結構 | UnifiedWallData | **UnifiedFeedData** (簡化) |
| Mock 資料 | 社區牆貼文 | 跨社區貼文 |

### 新增型別

```typescript
// FeedPost: 擴展 Post 加上社區資訊
export interface FeedPost extends Post {
  communityId?: string | undefined;
  communityName?: string | undefined;
}

// UnifiedFeedData: 簡化的信息流資料
export interface UnifiedFeedData {
  posts: FeedPost[];
  totalPosts: number;
}
```

### 驗證證據（2025-12-07）

```bash
npm run build          # ✓ exit 0, 2023 modules
ls src/hooks/useFeedData.ts   # ✓ 477 行
grep -c "mhEnv" src/hooks/useFeedData.ts   # ✓ 4 處整合
grep -E "^export" src/hooks/useFeedData.ts # ✓ 5 個 export
```

### 下一步
- P5 feed-consumer React 化時串接真實 API（目前 placeholder）
- P6 feed-agent React 化時共用此 Hook

---

## ✅ P2-AUDIT：首席審計發現 6 項缺失（已修復）

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：✅ 已修復（見 P2-AUDIT-FIX）

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| P2-A1 | 🔴 | `toggleLike` 沒有 auth guard — 未登入按讚會呼叫 API | `useFeedData.ts:397` | ✅ |
| P2-A2 | 🔴 | `createPost` 沒有 auth guard — 未登入發文會呼叫 API | `useFeedData.ts:436` | ✅ |
| P2-A3 | 🟡 | 重複的 auth 訂閱邏輯 — 與 useAuth 重複實作 | `useFeedData.ts:240-268` | ✅ |
| P2-A4 | 🟡 | resolveViewerRole 第一參數永遠傳 undefined — 冗餘邏輯 | `useFeedData.ts:370` | ✅ |
| P2-A5 | 🟡 | API 模式回傳空陣列 — P5 未做時讓用戶誤以為無資料 | `useFeedData.ts:322-325` | ✅ |
| P2-A6 | 🟢 | Mock 資料 communityName 硬編碼 — 應從 lookup 取得 | `useFeedData.ts:445` | ✅ |

---

### P2-A1 修復引導（🔴 高優先）

**問題**：`toggleLike` 沒有檢查 `isAuthenticated`，未登入時直接呼叫 API 會得到 401。

**修法**：
```
// toggleLike 開頭加 guard
// 1. 檢查 hasAuthenticatedUser
// 2. 若未登入，直接 return 並可選擇性拋出 Error 或 notify
// 3. Mock 模式可略過（因為不會真的打 API）
```

**參考**：`useCommunityWallData.ts` 的 `toggleLike` 也沒有 guard，但 `Wall.tsx` 在 `handleLike` 有統一做，因此 useFeedData 的消費者（P5 feed-consumer）也必須在 UI 層做 guard。

**建議**：
- 方案 A：Hook 層加 guard，拋出 Error 讓 UI 層 catch
- 方案 B：Hook 回傳 `canInteract: boolean`，UI 層判斷
- **推薦方案 A**：與 P1.5 權限系統一致

---

### P2-A2 修復引導（🔴 高優先）

**問題**：`createPost` 沒有檢查 `isAuthenticated`，未登入時直接呼叫 API 會得到 401。

**修法**：與 P2-A1 相同模式，在 `createPost` 開頭加 guard。

---

### P2-A3 修復引導（🟡 中優先）

**問題**：`useFeedData` 自己訂閱 `supabase.auth.onAuthStateChange`，與 `useAuth` 重複訂閱。如果 P5/P6 同時使用 `useAuth` 和 `useFeedData`，會有多餘的訂閱。

**修法**：
```
// 方案 A：從 props 接收 currentUserId（由消費者從 useAuth 取得後傳入）
// 方案 B：useFeedData 內部呼叫 useAuth() 取得 user.id
// 方案 C（最佳）：建立 AuthContext，所有 Hook 共享同一訂閱
```

**建議**：
- 短期：方案 A，保持解耦
- 長期：方案 C，參考 TODO.md G1 建議

---

### P2-A4 修復引導（🟡 中優先）

**問題**：`resolveViewerRole(undefined, hasAuthenticatedUser)` 第一參數永遠是 `undefined`，函數內的 `rawRole` 檢查永遠不會執行。

**修法**：
```
// 選項 1：移除 rawRole 參數，簡化函數
// 選項 2：從 API 回傳的 viewerRole 使用（但 useFeedData 目前沒有 viewerRole 欄位）
// 選項 3：直接用三元運算 `hasAuthenticatedUser ? 'member' : 'guest'`
```

**建議**：選項 3，刪除 `resolveViewerRole` 函數，直接內聯邏輯。

---

### P2-A5 修復引導（🟡 中優先）

**問題**：API 模式目前回傳空陣列 `{ posts: [], totalPosts: 0 }`，用戶會誤以為「沒有任何貼文」而非「功能未實作」。

**修法**：
```
// 方案 A：API 模式暫時 fallback 到 Mock 資料
// 方案 B：API 模式顯示「即將推出」提示
// 方案 C：拋出特定 Error 讓 UI 層顯示對應訊息
```

**建議**：方案 A，在 `fetchApiData` 中暫時使用 Mock 資料，並加註解標記 P5 要移除。

---

### P2-A6 修復引導（🟢 低優先）

**問題**：`createFeedMockPost` 中 `communityName` 使用硬編碼判斷 `'test-uuid' ? '惠宇上晴' : '我的社區'`，不夠彈性。

**修法**：
```
// 建立社區名稱對照表
const COMMUNITY_NAME_MAP: Record<string, string> = {
  'test-uuid': '惠宇上晴',
  'community-2': '遠雄中央公園',
  'community-3': '國泰建設',
};

// 使用時查表
communityName: COMMUNITY_NAME_MAP[targetCommunityId] ?? targetCommunityId ?? '我的社區'
```

---

## ✅ P2-AUDIT-FIX：修復 6 項缺失（2025-12-07）

| ID | 修復項目 | 檔案 | 說明 |
|----|----------|------|------|
| P2-A1 | toggleLike 加 auth guard | `src/hooks/useFeedData.ts` | API 模式未登入直接 throw Error，避免 401；Mock 模式仍可測試 |
| P2-A2 | createPost 加 auth guard | `src/hooks/useFeedData.ts` | API 模式未登入直接 throw Error，與 P1.5 權限一致 |
| P2-A3 | 移除重複 auth 訂閱 | `src/hooks/useFeedData.ts` | 改用 `useAuth()` 提供的 user/role/isAuthenticated，避免多重訂閱 supabase.auth |
| P2-A4 | 精簡 viewerRole | `src/hooks/useFeedData.ts` | 移除 `resolveViewerRole`，直接使用 `authRole` |
| P2-A5 | API 模式 fallback | `src/hooks/useFeedData.ts` | API 路徑暫時回傳 Mock 資料（含 communityId 篩選），避免空列表誤導；註記 P5 要改掉 |
| P2-A6 | communityName map | `src/hooks/useFeedData.ts` | 新增 COMMUNITY_NAME_MAP，生成 Mock 貼文時不再硬編碼名稱 |

### 驗證（2025-12-07）

```bash
npm run build   # ✓ exit 0
```

### 待辦提醒（後續任務）
- P5 時替換 API fallback，接上真實 feed API
- UI 層仍需做未登入提示（目前 Hook 丟 Error 由消費者處理）

---

## ✅ P2-AUDIT-2：二次審計發現 3 項缺失（已修復）

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：✅ 已修復（見 P2-AUDIT-2-FIX）

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| P2-B1 | 🟡 | `authLoading` 解構後未使用 — 死變數警告風險 | `useFeedData.ts:234` | ✅ |
| P2-B2 | 🟡 | `isLoading` 未考慮 auth loading — auth 載入中時會誤判為非 loading | `useFeedData.ts:445` | ✅ |
| P2-B3 | 🟢 | Mock 資料 `liked_by` 與 `likes` 邏輯分離 — likedPosts Set 與貼文 liked_by 可能不同步 | `useFeedData.ts:375-401` | ✅ |

---

## 🔴 P2-AUDIT-3：三次審計發現 6 項問題與偷懶行為

> **審計時間**：2025-12-07 | **審計人**：Google 首席前後端處長
> **狀態**：待修復

| ID | 嚴重度 | 問題摘要 | 位置 | 狀態 |
|----|--------|----------|------|------|
| P2-C1 | 🔴 | **likedPosts 同步 useEffect 會無限循環** — mockData 在依賴中，但 toggleLike 會更新 mockData | `useFeedData.ts:347-354` | 🔴 |
| P2-C2 | 🔴 | **API 模式 toggleLike 不更新本地狀態** — 只呼叫 fetchApiData，用戶體驗差（需等 API 完成才看到變化） | `useFeedData.ts:416` | 🔴 |
| P2-C3 | 🟡 | **fetchApiData 依賴 mockData** — API 模式應該獨立於 mock 資料，但目前 fallback 用 mock 導致 useCallback 依賴混亂 | `useFeedData.ts:297` | 🔴 |
| P2-C4 | 🟡 | **createPost 沒有樂觀更新** — Mock 有即時顯示，API 模式卻要等 fetchApiData 完成才看到新貼文 | `useFeedData.ts:445` | 🔴 |
| P2-C5 | 🟡 | **likedPosts 沒有暴露給消費者** — UI 無法直接判斷某貼文是否已按讚，要自己從 post.liked_by 推算 | `useFeedData.ts:459` 回傳值 | 🔴 |
| P2-C6 | 🟢 | **COMMUNITY_NAME_MAP 應該從後端取或共用 constants** — 硬編碼在 Hook 中，與其他地方不同步 | `useFeedData.ts:41-45` | 🔴 |

---

### P2-C1 修復引導（🔴 最高優先）

**問題**：第 347-354 行的 `useEffect` 依賴 `mockData`，但 `toggleLike` 會更新 `mockData`。用戶按讚 → mockData 變 → useEffect 重跑 → setLikedPosts 重設 → **可能造成閃爍或狀態不一致**。

**實際風險**：
- 按讚後 `setMockData` 觸發
- `mockData` 變化觸發 useEffect
- useEffect 重新掃描 `liked_by` 並 `setLikedPosts`
- 若 `toggleLike` 的 `setLikedPosts` 和 useEffect 的 `setLikedPosts` 順序對撞，會出現按讚無效或閃爍

**修法**：
```
// 方案 A：移除 mockData 依賴，只在 useMock 或 currentUserId 變化時執行
useEffect(() => {
  if (!useMock || !currentUserId) return;
  // 只在初始化時執行一次
}, [useMock, currentUserId]); // ❌ 移除 mockData

// 方案 B：用 ref 追蹤是否已初始化，避免重複執行
const hasInitializedLikedPosts = useRef(false);
useEffect(() => {
  if (!useMock || !currentUserId) return;
  if (hasInitializedLikedPosts.current) return; // 已初始化就跳過
  hasInitializedLikedPosts.current = true;
  // 掃描 mockData.posts
}, [useMock, currentUserId, mockData]);

// 方案 C：toggleLike 內不另外 setLikedPosts，完全由 mockData.liked_by 驅動
// （需同步修改 UI 層讀 liked_by 而非 likedPosts）
```

**建議**：方案 B，加 ref 保護初始化只跑一次。

---

### P2-C2 修復引導（🔴 高優先）

**問題**：API 模式的 `toggleLike` 只有一行 `await fetchApiData()`，用戶點按讚後要等 250ms+ 才看到變化，體驗極差。

**現況**：
```typescript
// API 模式 (L416)
await fetchApiData(); // 暫時重新載入
```

**問題分析**：
1. 沒有樂觀更新（optimistic update）
2. 用戶按讚 → 等 API → 成功後重抓 → 再渲染，延遲 500ms+
3. 若 API 失敗，用戶完全沒有回饋

**修法**：
```
// 樂觀更新模式
const toggleLike = useCallback(async (postId) => {
  // 1. 先樂觀更新本地狀態
  const previousData = apiData;
  setApiData(prev => ({
    ...prev,
    posts: prev.posts.map(p => 
      p.id === postId 
        ? { ...p, likes: (p.likes ?? 0) + (isLiked ? -1 : 1) }
        : p
    )
  }));
  
  try {
    // 2. 呼叫 API
    await apiToggleLike(postId);
  } catch (err) {
    // 3. 失敗時回滾
    setApiData(previousData);
    throw err;
  }
}, [...]);
```

**建議**：P5 正式串 API 時務必實作樂觀更新，否則 UX 會被用戶罵爆。

---

### P2-C3 修復引導（🟡 中優先）

**問題**：`fetchApiData` 的 `useCallback` 依賴包含 `mockData`（L297），因為 API fallback 用 `filterMockData(mockData, ...)`。這導致：
1. mockData 任何變化都會重建 fetchApiData
2. fetchApiData 變化會觸發 L322 的 useEffect 重新載入

**修法**：
```
// API fallback 應該用 initialMockData（常數）而非 mockData（狀態）
const fetchApiData = useCallback(async () => {
  // ...
  const result = filterMockData(initialMockData, communityId); // ← 改用 initialMockData
  // ...
}, [useMock, communityId, initialMockData]); // ← 移除 mockData
```

**代價**：API fallback 不會反映 Mock 模式下的變更（例如新發的貼文）。但這是正確的，因為 API 模式本來就不應該讀 Mock 狀態。

---

### P2-C4 修復引導（🟡 中優先）

**問題**：`createPost` 在 API 模式只呼叫 `await fetchApiData()`，沒有樂觀更新。用戶發文後要等重抓 API 才看到自己的貼文。

**現況**（L445）：
```typescript
// TODO: P5 時串接真實 API
// await apiCreatePost(content, targetCommunityId);
await fetchApiData(); // 暫時重新載入
```

**修法**：與 P2-C2 類似，API 模式要有樂觀更新。

```
// 樂觀更新
const tempPost = { id: `temp-${Date.now()}`, content, ... };
setApiData(prev => ({
  posts: [tempPost, ...prev.posts],
  totalPosts: prev.totalPosts + 1,
}));

try {
  const realPost = await apiCreatePost(content);
  // 成功後用真實 id 替換 temp
  setApiData(prev => ({
    posts: prev.posts.map(p => p.id === tempPost.id ? realPost : p),
    totalPosts: prev.totalPosts,
  }));
} catch (err) {
  // 失敗時移除 temp
  setApiData(prev => ({
    posts: prev.posts.filter(p => p.id !== tempPost.id),
    totalPosts: prev.totalPosts - 1,
  }));
  throw err;
}
```

---

### P2-C5 修復引導（🟡 中優先）

**問題**：`likedPosts` Set 是內部狀態，沒有暴露給消費者。UI 層要判斷某貼文是否已按讚，必須：
1. 自己從 `post.liked_by` 檢查
2. 或維護自己的狀態

**現況回傳值**（L453-467）：
```typescript
return {
  data,
  useMock,
  setUseMock,
  isLoading,
  error,
  refresh,
  toggleLike,
  createPost,
  viewerRole,
  isAuthenticated,
  // ❌ 沒有 likedPosts 或 isLiked(postId) helper
};
```

**修法**：
```
// 方案 A：直接暴露 likedPosts
return {
  ...existing,
  likedPosts, // Set<string | number>
};

// 方案 B：提供 helper 函數
const isLiked = useCallback((postId: string | number) => 
  likedPosts.has(postId), [likedPosts]);

return {
  ...existing,
  isLiked, // (postId) => boolean
};
```

**建議**：方案 B，更清晰的 API。

---

### P2-C6 修復引導（🟢 低優先）

**問題**：`COMMUNITY_NAME_MAP` 硬編碼在 Hook 中（L41-45），與其他地方可能不同步。

**現況**：
```typescript
const COMMUNITY_NAME_MAP: Record<string, string> = {
  'test-uuid': '惠宇上晴',
  'community-2': '遠雄中央公園',
  'community-3': '國泰建設',
};
```

**問題**：
- 若後端新增社區，前端需同步修改
- 若社區名稱改了，要改多處
- 與 `useCommunityWallData` 等其他 Hook 可能有不同的名稱對照

**修法**：
```
// 方案 A：抽到共用 constants
// src/constants/communities.ts
export const COMMUNITY_NAME_MAP: Record<string, string> = { ... };

// 方案 B：從 API 取得社區列表（含名稱）
// 需要新的 API endpoint

// 方案 C：傳入 options
useFeedData({ communityNameMap: { ... } })
```

**建議**：短期用方案 A，長期用方案 B。

---

### P2-B1 修復引導（🟡 中優先）

**問題**：從 `useAuth()` 解構出 `authLoading` 但從未使用，ESLint 會報 unused variable 警告。

**修法**：
```
// 方案 A：移除解構（如果不需要）
const { user: authUser, role: authRole, isAuthenticated } = useAuth();

// 方案 B：使用 authLoading 於 isLoading 計算（見 P2-B2）
```

**建議**：方案 B，順便解決 P2-B2。

---

### P2-B2 修復引導（🟡 中優先）

**問題**：`isLoading` 計算為 `!useMock && apiLoading`，但沒有考慮 `authLoading`。當 auth 仍在載入時，`isAuthenticated` 為 `false`，可能導致 auth guard 誤判。

**修法**：
```
// 改為：
isLoading: !useMock && (apiLoading || authLoading)

// 或更嚴謹：
isLoading: authLoading || (!useMock && apiLoading)
```

**建議**：使用第二種，auth loading 優先。

---

### P2-B3 修復引導（🟢 低優先）

**問題**：`likedPosts` Set 是 local state，與貼文的 `liked_by` 陣列分開維護。理論上，當用戶按讚後，`likedPosts.has(postId)` 和 `post.liked_by.includes(userId)` 應該一致，但目前 `toggleLike` 同時更新兩邊，若有 race condition 可能不同步。

**現況分析**：
- Mock 模式：`toggleLike` 同時更新 `mockData.posts[].liked_by` 和 `likedPosts` Set ✓
- 問題：初始化時沒有從 `mockData.posts[].liked_by` 建立 `likedPosts` Set

**修法**：
```
// 初始化時同步 likedPosts（若使用者已登入）
// 在 useEffect 中，當 currentUserId 變化時，掃描 mockData 重建 likedPosts
useEffect(() => {
  if (!currentUserId) return;
  const initialLiked = new Set<string | number>();
  mockData.posts.forEach(p => {
    if (p.liked_by?.includes(currentUserId)) {
      initialLiked.add(p.id);
    }
  });
  setLikedPosts(initialLiked);
}, [currentUserId, /* mockData 變化時不重跑，避免無限迴圈 */]);
```

**建議**：Mock 模式測試用，此問題優先級較低，但長期應修復以保持資料一致性。

---

## 🔴 P3：GlobalHeader

**目的**：三頁共用 Header，從 feed-agent.html 搬最完整版

| 任務 | 說明 |
|------|------|
| P3-1 | 建立 `src/components/layout/GlobalHeader.tsx` |
| P3-2 | 「我的」dropdown（收藏/紀錄/登出） |
| P3-3 | 登出連接 `supabase.auth.signOut()` |
| P3-4 | 通知/訊息按鈕 → `notify.dev()` |
| P3-5 | Auth 狀態切換：未登入→登入鈕 / 已登入→Avatar |
| P3-6 | 角色感知：`<Badge type="agent">業務版</Badge>` |
| P3-7 | Dropdown 選項微調：Agent/Consumer 不同項目 |

---

## 🔴 P4：Composer 統一

**做法**：`PostModal.tsx` → `ComposerModal.tsx`，加 mode prop

| 任務 | 說明 |
|------|------|
| P4-1 | 建立 `useComposer()` headless hook |
| P4-2 | 建立 `ComposerModal.tsx`（mode="feed" / "community"） |
| P4-3 | textarea 自動展開 + 字數驗證 |
| P4-4 | 發文後清空 + notify.success() |
| P4-5 | 圖片上傳按鈕 UI（暫時 notify.dev()） |
| P4-6 | 未登入時顯示「請先登入」（使用 useAuth） |

---

## 🔴 P4.5：Loading 與錯誤狀態

**目的**：UX 基礎建設

| 任務 | 說明 |
|------|------|
| P4.5-1 | Skeleton 骨架屏組件 |
| P4.5-2 | Empty State（無貼文時） |
| P4.5-3 | Error State（API 失敗時） |
| P4.5-4 | Retry 重試按鈕 |

---

## 🔴 P5：feed-consumer React 化

**來源**：`public/feed-consumer.html` (559行) → `src/pages/Feed/Consumer.tsx`

| 任務 | 說明 |
|------|------|
| P5-1 | 建立 Consumer.tsx 基本架子 |
| P5-2 | 使用 GlobalHeader |
| P5-3 | 使用 useFeedData Hook |
| P5-4 | PostCard + Like API |
| P5-5 | MockToggle 左下角 |
| P5-6 | 路由 `/maihouses/feed-consumer` |

---

## 🔴 P6：feed-agent React 化

**來源**：`public/feed-agent.html` (760行) → `src/pages/Feed/Agent.tsx`

| 任務 | 說明 |
|------|------|
| P6-1 | 建立 Agent.tsx 基本架子 |
| P6-2 | 使用 GlobalHeader（badge="業務版"） |
| P6-3 | 業務專屬側欄（UAG 摘要/業績/待辦） |
| P6-4 | 使用 useFeedData Hook |
| P6-5 | MockToggle 左下角 |
| P6-6 | 路由 `/maihouses/feed-agent` |

---

## 🔴 P6.5：草稿自動儲存

**目的**：防止意外關閉遺失內容

| 任務 | 說明 |
|------|------|
| P6.5-1 | localStorage key = `mai_draft_{page}_{communityId}` |
| P6.5-2 | 5 秒 debounce 自動儲存 |
| P6.5-3 | 頁面載入時恢復草稿 |
| P6.5-4 | 發文成功後清除草稿 |

---

## 🔴 P7：私密牆權限

**目的**：確保權限不被繞過

| 任務 | 說明 |
|------|------|
| P7-1 | 確認 community_members 表存在 |
| P7-2 | POST API：visibility=private 檢查 membership |
| P7-3 | GET API：includePrivate 需 token + membership |
| P7-4 | 前端：非成員看不到/發不了私密貼文 |

---

## 🔴 P8：部署驗證

**網址**：https://maihouses.vercel.app/maihouses/

### Checklist

| 項目 | 狀態 |
|------|------|
| Header dropdown 可用 | 🔴 |
| 通知/訊息 Toast | 🔴 |
| feed-consumer Mock/API 切換 | 🔴 |
| feed-agent Mock/API 切換 | 🔴 |
| 三頁發文功能 | 🔴 |
| 登出功能 | 🔴 |
| npm run build 無錯誤 | 🔴 |
| 未登入發文阻擋（顯示 Toast） | 🔴 |
| Mock/API 切換持久化（重整保持） | 🔴 |
| 跨頁切換保持登入 | 🔴 |
| Mobile 響應式 Header | 🔴 |
| 網路斷線發文失敗提示 | 🔴 |

### 情境矩陣

| 頁面 | 資料源 | 身份 | 預期 |
|------|--------|------|------|
| 社區牆 | API | 未登入 | 只看公開牆 |
| 社區牆 | API | 成員 | 能發/看私密 |
| 社區牆 | Mock | 任意 | 重整消失 |
| feed-consumer | API | 用戶 | 能發公開貼文 |
| feed-agent | API | 業務 | 能看 UAG 摘要 |

---

## 🔴 P9：優化防呆

| 任務 | 說明 |
|------|------|
| P9-1 | Loading Skeleton |
| P9-2 | ErrorBoundary |
| P9-3 | Mock 模式提示：「測試資料，不會儲存」 |
| P9-4 | 功能佔位：「此功能開發中」 |
| P9-5 | vercel.json rewrite 淘汰靜態頁 |

---

## 📁 相關檔案

| 檔案 | 說明 |
|------|------|
| `src/pages/Community/Wall.tsx` | 社區牆主頁 (546行) |
| `src/pages/Community/components/Topbar.tsx` | 現有 Header (47行) |
| `src/hooks/useCommunityWallData.ts` | 資料 Hook (454行) |
| `public/feed-consumer.html` | 靜態消費者版 (559行) |
| `public/feed-agent.html` | 靜態業務版 (760行) |
| `api/community/wall.ts` | 後端 API (938行) |

---

## 📝 已完成紀錄

### 2025-12-07
- [x] SQL VIEW 驗證通過
- [x] getReviews() 加入 try-catch
- [x] P1 Toast 系統二次補完：PropertyUploadPage 改用 notify、移除 react-hot-toast、清理 manualChunks、刪除舊 Toast.tsx
- [x] npm run build 通過

### 2025-12-06
- [x] 修復 community_reviews VIEW
- [x] 移除 GUEST_LIMIT
- [x] 移除 API fallback Mock
