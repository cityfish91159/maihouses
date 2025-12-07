# 🏠 社區牆 + 信息流 待辦清單

> 供 AI Agent 與開發者協作使用  
> 最後更新：2025-12-07

---

## 🚨 緊急修復項目（審計發現）

> **來源**：P0.5 實作後 Google 首席審計 | **總計 7 項**

| ID | 嚴重度 | 問題摘要 | 詳見 |
|----|--------|----------|------|
| A1 | 🔴 | localStorage Key 命名衝突，跨頁同步失效 | P0.5-AUDIT |
| A2 | 🔴 | `initialUseMock` 雙重呼叫 `mhEnv.isMockEnabled()` | P0.5-AUDIT |
| A3 | 🟡 | `useEffect` 缺少顯式 cleanup return | P0.5-AUDIT |
| A4 | 🟡 | `window.confirm()` 阻塞 UX | P0.5-AUDIT |
| A5 | 🟡 | `useMockState.ts` 114 行死碼未清除 | P0.5-AUDIT |
| A6 | 🟡 | Wall.tsx 自己包裝 `setUseMock` 覆蓋 Hook | P0.5-AUDIT |
| A7 | 🟢 | `mhEnv` 缺少 TypeScript 型別導出 | P0.5-AUDIT |

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
| P1.5 權限系統 | 🔴 | 1h | useAuth + 角色判斷（API 前置） |
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

## 🔴 P0.5-AUDIT：Google 首席審計 - 發現 7 項缺失

> **審計時間**：2025-12-07 | **嚴重程度**：🔴 Critical / 🟡 Medium / 🟢 Low

### 🔴 A1：localStorage Key 命名衝突（Critical）

**問題**：三個檔案用了三個不同的 `MOCK_STORAGE_KEY`

| 檔案 | Key 值 | 狀態 |
|------|--------|------|
| `src/lib/mhEnv.ts` | `mh_mock_mode` | ✅ 新標準 |
| `src/hooks/useCommunityWallData.ts` | `community-wall-mock-state-v1` | ❌ 舊遺留（存 Mock Data） |
| `src/hooks/useMockState.ts` | `community-wall-use-mock` | ❌ 死碼未清 |

**後果**：
- 跨頁同步失效：`mhEnv.subscribe()` 只監聽 `mh_mock_mode`，但 `useMockState` 讀寫 `community-wall-use-mock`
- 用戶困惑：切換 Mock 可能在某些頁面生效、某些不生效

**引導修正**：
1. `useMockState.ts` 已無 import → 整個檔案刪除（確認後執行 `rm src/hooks/useMockState.ts`）
2. `useCommunityWallData.ts:25` 的 `MOCK_STORAGE_KEY` 是存 Mock「資料」而非「開關」→ rename 為 `MOCK_DATA_STORAGE_KEY` 避免誤解
3. Mock 開關統一走 `mhEnv`，Mock 資料存 `community-wall-mock-data-v1`

---

### 🔴 A2：Wall.tsx 重複宣告 initialUseMock（Critical Logic Bug）

**問題**：`Wall.tsx:87` 用 `useMemo` 呼叫 `mhEnv.isMockEnabled()`，然後傳給 Hook options

```tsx
// Wall.tsx:87
const initialUseMock = useMemo(() => mhEnv.isMockEnabled(), []);

// Wall.tsx:115
} = useCommunityWallData(communityId, {
    includePrivate: perm.canAccessPrivate,
    initialUseMock, // 傳入初始值
});
```

**但是 Hook 內部又重複判斷一次**：

```tsx
// useCommunityWallData.ts:181-183
const resolvedInitialUseMock = typeof requestedInitialUseMock === 'boolean'
  ? requestedInitialUseMock
  : mhEnv.isMockEnabled(); // 又呼叫一次！
```

**後果**：
- 雙重呼叫 `mhEnv.isMockEnabled()` → 時序問題，URL 可能已被清除
- 語意混亂：到底誰決定 initial value？

**引導修正**：
1. `Wall.tsx` 刪除 `initialUseMock` 計算，不傳 options
2. Hook 內部統一用 `mhEnv.isMockEnabled()` 作為唯一來源
3. 若需要「頁面覆寫」行為，改用明確命名 `forceUseMock?: boolean`

---

### 🟡 A3：useEffect 依賴陣列空缺（Memory Leak Risk）

**問題**：`useCommunityWallData.ts:193`

```tsx
useEffect(() => mhEnv.subscribe((next) => setUseMockState(next)), []);
```

**後果**：
- 如果 `setUseMockState` 被重新 bind，callback 仍持有舊 reference
- ESLint `react-hooks/exhaustive-deps` 警告被忽略

**引導修正**：
```tsx
useEffect(() => {
  const unsub = mhEnv.subscribe(setUseMockState);
  return unsub;
}, []); // setUseMockState 是 useState 的 setter，React 保證 stable
```
- 顯式 return cleanup function
- 加註解說明為何 deps 可為空

---

### 🟡 A4：MockToggle confirm() 阻塞 UX

**問題**：`MockToggle.tsx:17-20`

```tsx
if (useMock && typeof window !== 'undefined') {
  const confirmed = window.confirm('切換到 API 資料會暫時關閉 Mock 狀態，確保重要內容已保存，是否繼續？');
  if (!confirmed) return;
}
```

**後果**：
- `window.confirm()` 是同步阻塞，在 Electron/WebView 環境可能失效
- UX 不佳：每次切換都跳對話框

**引導修正**：
1. 改用自訂 Confirm Modal（可用 sonner 的 `toast.promise` 或 headlessui `Dialog`）
2. 或簡化為 tooltip 警告，不用 confirm

---

### 🟡 A5：useMockState.ts 死碼未清除（Dead Code）

**問題**：`src/hooks/useMockState.ts`（114 行）已完全無人 import

**驗證**：
```bash
grep -r "useMockState" src/ --include="*.ts" --include="*.tsx" | grep "from"
# 結果：0 match
```

**後果**：
- 增加 bundle size（雖然 tree-shake 可能清除，但不保證）
- 維護混亂：未來開發者不知道該用哪個

**引導修正**：
```bash
rm src/hooks/useMockState.ts
# 然後 build 驗證無副作用
```

---

### 🟡 A6：Wall.tsx setUseMock 包裝邏輯多餘

**問題**：`Wall.tsx:138-141`

```tsx
const setUseMock = useCallback((value: boolean) => {
  if (value && !canToggleMock) return;
  const next = mhEnv.setMock(value);
  setUseMockInternal(next);
}, [canToggleMock, setUseMockInternal]);
```

**但 Hook 內部已有同名 `setUseMock`**：

```tsx
// useCommunityWallData.ts:444-447
const setUseMock = useCallback((value: boolean) => {
  const next = mhEnv.setMock(value);
  setUseMockState(next);
}, []);
```

**後果**：
- Wall 用自己的 `setUseMock` 覆蓋 Hook 的 → 邏輯分散
- `canToggleMock` 判斷應該在 Hook 層或 UI 層？目前兩邊都有

**引導修正**：
1. 權限判斷移到 UI 層（`MockToggle` 的 `disabled` prop）
2. Hook 的 `setUseMock` 純粹負責寫入，不含業務邏輯
3. Wall.tsx 刪除自己的 `setUseMock`，直接用 Hook 回傳的

---

### 🟢 A7：mhEnv 缺少 TypeScript 型別導出

**問題**：`mhEnv.ts` 沒有導出型別，未來難以 mock/擴充

**引導修正**：
```tsx
export interface MhEnv {
  isMockEnabled(): boolean;
  setMock(next: boolean, opts?: { persist?: boolean; updateUrl?: boolean }): boolean;
  subscribe(onChange: (value: boolean) => void): () => void;
}

export const mhEnv: MhEnv = { ... };
```

---

## 🔴 P0.5-FIX：審計修復任務（預估 30m）

> **前置條件**：先讀完 P0.5-AUDIT 所有問題描述

### 執行清單（2025-12-07 完成）

| 序號 | 任務 | 檔案 | 優先級 | 狀態 |
|------|------|------|--------|------|
| FIX-1 | 刪除 `useMockState.ts` 死碼 | `src/hooks/useMockState.ts` | P0 | ✅ |
| FIX-2 | `MOCK_STORAGE_KEY` → `MOCK_DATA_STORAGE_KEY` | `useCommunityWallData.ts:25` | P0 | ✅ |
| FIX-3 | 刪除 Wall.tsx `initialUseMock` 計算 | `Wall.tsx:87` | P0 | ✅ |
| FIX-4 | 刪除 Wall.tsx `setUseMock` 包裝 | `Wall.tsx:138-141` | P0 | ✅ |
| FIX-5 | Hook 移除 `initialUseMock` option | `useCommunityWallData.ts:179-190` | P1 | ✅ |
| FIX-6 | `useEffect` 加顯式 cleanup | `useCommunityWallData.ts:193` | P1 | ✅ |
| FIX-7 | `MockToggle` 移除 `window.confirm()` | `MockToggle.tsx:17-20` | P2 | ✅ |
| FIX-8 | `mhEnv` 加 TypeScript interface | `mhEnv.ts` | P2 | ✅ |

### 驗證步驟（已完成）

- [x] `grep -r "useMockState" src/` → 0 matches（檔案已刪除）
- [x] `grep -r "MOCK_DATA_STORAGE_KEY" src/hooks/useCommunityWallData.ts` → 確認唯一來源
- [x] `npm run build` → exit 0（2025-12-07）
- [x] 手動邏輯驗證：MockToggle 不再 confirm；切換後重整仍保持 mock 狀態（URL/localStorage 同步）

### 修復紀錄（2025-12-07）
- 移除 `useMockState.ts` 死碼，避免 Key 混亂
- `useCommunityWallData`：初始 Mock 改由 `mhEnv` 單一來源，訂閱加 cleanup，storage key 改為 `MOCK_DATA_STORAGE_KEY`
- `Wall.tsx`：移除 `initialUseMock` 及自定 `setUseMock` 包裝，直接使用 Hook setter
- `MockToggle`：移除同步 `confirm` 阻塞
- `mhEnv`：補上 `MhEnv` interface，方便 mock/擴充
- 推送 commit `e8ad92f`，觸發 Vercel 部署（網址：https://maihouses.vercel.app/maihouses/community/test-uuid/wall）

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

## 🔴 P1.5：權限系統（API 前置條件）

**目的**：沒有權限判斷，API 串接會卡在 401/403

| 任務 | 說明 | 優先級 |
|------|------|--------|
| P1.5-1 | 建立 `src/hooks/useAuth.ts` | P0 |
| P1.5-2 | 判斷角色 guest/member/resident/agent | P0 |
| P1.5-3 | user_communities 表建立（或暫用 flag） | P1 |
| P1.5-4 | 未登入時 Composer 顯示「請先登入」 | P1 |

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
