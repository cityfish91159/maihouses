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
| P2 useFeedData | 🔴 | 40m | 複製 useCommunityWallData（資料層先行） |
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
```

## ✅ P1.5-AUDIT-2：二次審計發現 4 項殘留問題（已修復）

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

## 🔴 P2：useFeedData Hook（資料層先行）

**做法**：複製 `useCommunityWallData.ts` (454行) 改名，刪 reviews 邏輯

| 任務 | 說明 |
|------|------|
| P2-1 | 建立 `src/hooks/useFeedData.ts` |
| P2-2 | communityId 來源：寫死 test-uuid 或從 session 抓 |
| P2-3 | createPost / toggleLike / refresh |
| P2-4 | 使用 mhEnv 控制 Mock/API |

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
