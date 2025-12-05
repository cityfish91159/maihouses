# 社區牆 - Google 首席審計報告

> **審計日期**: 2025-12-05
> **審計者**: Google 首席前後端處長級審計
> **審計結論**: 🔴 **嚴重不合格** - 發現 23 項缺失，其中 8 項為「文檔宣稱完成但代碼未落地」

---

## 📊 審計摘要

| 類別 | 數量 | 嚴重程度 |
|------|------|----------|
| 🔴 P0 致命缺失 | 5 | 系統無法正常運作 |
| 🟠 P1 嚴重缺失 | 8 | 功能殘缺/欺騙用戶 |
| 🟡 P2 中等缺失 | 6 | 技術債/可維護性差 |
| ⚪ P3 改進建議 | 4 | 最佳實踐未遵循 |

---

## 🔴 P0 致命缺失 (必須立即修復)

### P0-1: API 返回 500，整個後端形同虛設

**檔案**: `api/community/wall.ts`
**問題**: 文檔宣稱「API 整合完成」，但 Vercel 環境變數未設定，導致所有 API 請求返回 500

**敷衍證據**:
- `COMMUNITY_WALL_TODO.md` 第 49 行寫 `⚠️ API 端點返回 500 錯誤`
- 卻在第 45-47 行標記 `✅ TypeScript 編譯通過` `✅ 29 個單元測試全部通過`
- **這是典型的「寫文檔不改代碼」行為**

**修復指引**:
1. 進入 Vercel Dashboard → 專案設定 → Environment Variables
2. 新增 `SUPABASE_URL` = 你的 Supabase 專案 URL
3. 新增 `SUPABASE_SERVICE_ROLE_KEY` = 你的 service_role 密鑰
4. 重新部署（Redeploy）
5. 驗證：`curl https://maihouses.vercel.app/api/community/wall?communityId=test` 應返回 JSON

---

### P0-2: API 錯誤自動切換 Mock，用戶永遠看不到真實數據

**檔案**: `src/pages/Community/Wall.tsx:215-222`
**問題**: 只要 API 出錯就自動切換 Mock 模式，生產環境用戶看到的全是假數據

```javascript
// 這段代碼掩蓋了所有問題
if (!error || useMock) return;
const isAuthError = /401|403|權限|登入|未授權/.test(message);
if (isAuthError) return;
console.warn('[CommunityWall] API error, fallback to mock mode:', message);
setUseMock(true);  // ← 偷偷切成假數據
```

**修復指引**:
1. 移除自動切換 Mock 邏輯，API 錯誤應該顯示明確錯誤 UI
2. 用戶應能自主選擇是否切換 Mock（僅限開發/測試人員）
3. 生產環境發生 API 錯誤應該：
   - 顯示重試按鈕
   - 記錄錯誤到監控系統（Sentry）
   - 通知開發團隊

---

### P0-3: log-error API 端點不存在，錯誤報告失敗

**檔案**: `src/pages/Community/components/WallErrorBoundary.tsx:117`
**問題**: 生產環境發送錯誤到 `/api/log-error`，但此端點從未建立

```javascript
fetch('/api/log-error', {  // ← 這個 API 不存在
  method: 'POST',
  body: JSON.stringify({ error: {...} }),
})
```

**修復指引**:
1. 建立 `api/log-error.ts` 或整合 Sentry SDK
2. 或將錯誤發送到已有的監控服務（Datadog、LogRocket、Bugsnag）
3. 若短期無法建立，至少改為 `console.error` 並註解說明

---

### P0-4: 後端權限控制形同虛設，只判斷「有沒有登入」

**檔案**: `api/community/wall.ts:48-64`
**問題**: 宣稱有「訪客/會員/住戶/房仲」權限控制，但後端只判斷 `isAuthenticated`

```javascript
// 後端只檢查 token 是否有效
if (user) {
  userId = user.id;
  isAuthenticated = true;  // ← 登入就是 member，完全沒驗證是否為該社區住戶
}

// viewerRole 永遠只有兩種
const viewerRole = isAuthenticated ? 'member' : 'guest';  // ← 哪來的 resident/agent？
```

**敷衍證據**:
- `types.ts` 定義了 `Role = 'guest' | 'member' | 'resident' | 'agent'`
- 文檔宣稱「權限設計完成」
- 但後端只會回傳 `member` 或 `guest`，`resident`/`agent` 根本不存在

**修復指引**:
1. 後端需查詢 `community_members` 表驗證用戶與社區的關係
2. 查詢邏輯示例：
```sql
SELECT role FROM community_members
WHERE user_id = $1 AND community_id = $2
```
3. 根據查詢結果回傳正確的 `viewerRole`
4. 私密牆需驗證 `role IN ('resident', 'agent')`

---

### P0-5: 評價區 agent stats 全是假數據

**檔案**: `api/community/wall.ts:329-336`
**問題**: 文檔宣稱「評價來自真實房仲」，但 stats 硬編碼為 0

```javascript
agent: {
  name: review.source === 'agent' ? '認證房仲' : '住戶',  // ← 名字是假的
  company: '',  // ← 公司是空的
  stats: {
    visits: 0,  // ← 帶看次數硬編碼 0
    deals: 0,   // ← 成交數硬編碼 0
  },
},
```

**修復指引**:
1. 在 `community_reviews` View 或 Query 中 JOIN `agents` 表
2. 取得真實的 `name`、`company`、`visit_count`、`deal_count`
3. 若資料庫欄位不存在，先建立再遷移數據

---

## 🟠 P1 嚴重缺失 (本週內修復)

### P1-1: Adapter 層的 mockFallback 設計掩蓋問題

**檔案**: `src/hooks/communityWallConverters.ts:111-140`
**問題**: `convertApiData` 第二個參數是 `mockFallback`，API 資料不完整時偷偷用假數據補

```javascript
export function convertApiData(
  apiData: CommunityWallData,
  mockFallback: CommunityInfo  // ← 這個設計有問題
): UnifiedWallData {
  const communityInfo: CommunityInfo = apiData.communityInfo
    ? { ...apiData.communityInfo }  // API 有就用 API
    : mockFallback;                 // 沒有就用假的，用戶根本不知道
}
```

**修復指引**:
1. 移除 `mockFallback` 參數
2. 當 `apiData.communityInfo` 為 null 時，返回 `null` 而非假數據
3. 前端收到 `null` 應顯示「資料載入中」或「無資料」，而非假數據

---

### P1-2: useCommunityWallData 近 400 行，職責過重

**檔案**: `src/hooks/useCommunityWallData.ts` (415 行)
**問題**: 單一 Hook 處理 Mock 狀態、API 調用、本地存儲、認證、操作方法... 違反單一職責原則

**修復指引**:
1. 拆分為多個 Hook：
   - `useMockState.ts` - 處理 Mock 開關與持久化
   - `useCommunityWallOperations.ts` - 處理 toggleLike、createPost 等
   - `useCommunityWallData.ts` - 只做資料獲取與格式轉換
2. 每個 Hook 控制在 100 行以內

---

### P1-3: 樂觀更新後立即 invalidateQueries，否定樂觀更新意義

**檔案**: `src/hooks/useCommunityWallQuery.ts:166-172`
**問題**: 樂觀更新的目的是「讓 UI 即時反應」，但 `onSettled` 立即重新 fetch 否定了這個優化

```javascript
onSettled: () => {
  setIsOptimisticUpdating(false);
  // 這會觸發重新 fetch，否定樂觀更新的意義
  queryClient.invalidateQueries({
    queryKey: communityWallKeys.wall(communityId || '', includePrivate)
  });
},
```

**修復指引**:
1. `onSuccess` 時不需要 invalidate（樂觀更新已經是最新狀態）
2. 只有 `onError` 時才需要 invalidate（回滾到真實狀態）
3. 如果需要背景同步，使用 `staleTime` 機制而非每次 invalidate

---

### P1-4: 快速連續點擊按讚沒有 debounce/throttle

**檔案**: `src/pages/Community/components/PostsSection.tsx:46-56`
**問題**: 用戶快速連續點擊按讚會發送多個 API 請求，可能導致狀態不一致

```javascript
const handleLike = async () => {
  if (!onLike || isLiking) return;  // ← 只用 isLiking 擋，race condition 仍可能發生
  setIsLiking(true);
  try {
    await onLike(post.id);  // ← 如果網路慢，用戶可能點兩次
  } finally {
    setIsLiking(false);
  }
};
```

**修復指引**:
1. 使用 `useMemo` 建立 debounced 版本的 `handleLike`
2. 或在 mutation 層面使用 `mutate.isPending` 來禁止重複請求
3. 考慮使用 `lodash.debounce` 或自建 hook

---

### P1-5: 回覆功能硬編碼禁用，沒有追蹤進度

**檔案**: `src/pages/Community/components/PostsSection.tsx:100-107`
**問題**: 回覆按鈕永遠是 `disabled`，只有 `title="🚧 功能開發中"`，沒有 Issue 追蹤

```javascript
<button
  disabled  // ← 永遠禁用
  title="🚧 功能開發中，敬請期待"  // ← 沒有 GitHub Issue 連結
>
  💬 回覆
</button>
```

**修復指引**:
1. 建立 GitHub Issue 追蹤此功能
2. 在代碼中註解 Issue 編號：`// TODO(#123): 實作回覆功能`
3. 或直接隱藏按鈕，避免給用戶錯誤期待

---

### P1-6: communityInfo 統計欄位全部返回 null

**檔案**: `api/community/wall.ts:301-311`
**問題**: `members`、`avgRating`、`monthlyInteractions`、`forSale` 硬編碼為 `null`

```javascript
const communityInfo = rawCommunity ? {
  // ...
  members: null,          // 尚未實作統計，誠實回傳 null ← 誠實？那前端呢？
  avgRating: null,        // 尚未實作統計
  monthlyInteractions: null,
  forSale: null,
} : null;
```

**敷衍證據**:
- 前端 Sidebar 會顯示這些數據
- 但 API 永遠返回 null
- 前端用 `??` 處理後顯示「-」，用戶根本不知道這是假的

**修復指引**:
1. 建立統計查詢（COUNT、AVG）
2. 或明確在 UI 標示「統計功能開發中」
3. 不要用 `null` + 靜默降級欺騙用戶

---

### P1-7: 評價區 pros/cons 展平邏輯導致同一評價重複顯示

**檔案**: `src/pages/Community/components/ReviewsSection.tsx:71-101`
**問題**: 將每個 review 的 pros/cons 展平成獨立 entry，同一房仲的評價被顯示多次

```javascript
reviews.forEach(review => {
  review.pros.forEach((pro, idx) => {
    entries.push({ id: `${review.id}-pro-${idx}`, type: 'pro', ... });  // 2 則 pros = 2 個卡片
  });
  consArray.forEach((con, idx) => {
    entries.push({ id: `${review.id}-con-${idx}`, type: 'con', ... });  // 1 則 cons = 1 個卡片
  });
});
// 一則評價變成 3 個卡片，hiddenCount 計算也跟著亂掉
```

**修復指引**:
1. 以「完整評價」為單位顯示，不要展平
2. 一個 ReviewCard 內部自行渲染 pros 和 cons
3. `hiddenCount` 應計算「隱藏了幾則評價」而非「幾個 pros/cons」

---

### P1-8: clearCommunityCache 是空函數，誤導開發者

**檔案**: `src/services/communityService.ts:263-265`
**問題**: 保留了一個什麼都不做的函數，其他開發者可能以為呼叫後會清快取

```javascript
export function clearCommunityCache(_communityId?: string): void {
  // 空實作 - 快取已改由 React Query 管理
}
```

**修復指引**:
1. 完全移除此函數
2. 如有舊代碼呼叫，改用 `queryClient.invalidateQueries`
3. 或加上 `@deprecated` 註解並在函數內 `console.warn`

---

## 🟡 P2 中等缺失 (兩週內修復)

### P2-1: 類型定義散落多處，維護困難

**問題**: 類型定義分散在至少 4 個檔案：
- `src/types/community.ts`
- `src/pages/Community/types.ts`
- `src/services/communityService.ts`
- `src/hooks/communityWallConverters.ts`

**修復指引**:
1. 統一在 `src/types/community.ts` 定義所有 domain types
2. 其他檔案只做 re-export：`export type { Post, Review } from '../../types/community'`
3. API Response types 放在 `src/types/api.ts`

---

### P2-2: PostSkeleton 讓父層管理 a11y 不是最佳實踐

**檔案**: `src/pages/Community/components/PostSkeleton.tsx`
**問題**: 註解寫「讓父層管理 a11y」，但這增加了耦合

```javascript
// 注意：不設 aria-hidden，讓父層 WallSkeleton 統一管理 a11y
export function PostSkeleton() {
  return <div className="... animate-pulse">...</div>;  // ← 沒有任何 a11y 屬性
}
```

**修復指引**:
1. `PostSkeleton` 應自包含：`aria-hidden="true"` 或 `role="presentation"`
2. 父層 `WallSkeleton` 的 `role="status"` 是正確的
3. 子組件不應依賴父層的 a11y 設定

---

### P2-3: Mock 狀態持久化到 localStorage 是反模式

**檔案**: `src/hooks/useCommunityWallData.ts:73-80`
**問題**: Mock 的 posts/reviews/questions 存到 localStorage，重開瀏覽器還是假數據

**修復指引**:
1. Mock 數據應該是 session-only（sessionStorage 或純記憶體）
2. 刷新頁面應該重新從 API 獲取
3. 只有「是否使用 Mock 模式」這個開關可以持久化

---

### P2-4: 虛擬滾動承諾未兌現

**檔案**: `COMMUNITY_WALL_TODO.md` 第 63 行
**問題**: 寫了 `[ ] 啟用虛擬滾動避免首屏渲染阻塞`，但沒有任何實作

**修復指引**:
1. 貼文數量 < 50 時不需要虛擬滾動
2. 若確實需要，使用 `react-window` 或 `@tanstack/react-virtual`
3. 或直接刪除此 TODO，承認短期不會做

---

### P2-5: useGuestVisibleItems Hook 沒有單元測試

**檔案**: `src/hooks/useGuestVisibleItems.ts`
**問題**: 這個 Hook 負責權限相關的顯示邏輯，卻沒有測試覆蓋

**修復指引**:
1. 建立 `src/hooks/__tests__/useGuestVisibleItems.test.ts`
2. 測試案例：
   - 訪客看到 2 則，hiddenCount 正確
   - 會員看到全部，hiddenCount = 0
   - 空陣列處理

---

### P2-6: 環境變數錯誤只 console.warn，生產環境靜默失敗

**檔案**: `src/config/env.ts:100-106`
**問題**: `VITE_API_BASE_URL` 格式錯誤只 warn，不阻止應用啟動

```javascript
if (env.VITE_API_BASE_URL && !isValidHttpUrl(env.VITE_API_BASE_URL) && !env.VITE_API_BASE_URL.startsWith('/')) {
  console.warn('[env] VITE_API_BASE_URL 格式無效');  // ← 只 warn，應用繼續跑
}
```

**修復指引**:
1. 關鍵環境變數錯誤應該 throw Error
2. 或在 UI 顯示明確的配置錯誤提示
3. 區分「可選」與「必須」的環境變數

---

## ⚪ P3 改進建議 (有空再做)

### P3-1: 考慮使用 Zod 驗證 API Response

```javascript
// 現在
const data = await res.json();  // 直接相信 API 返回格式正確

// 建議
const parsed = CommunityWallResponseSchema.safeParse(await res.json());
if (!parsed.success) {
  throw new Error(`API response validation failed: ${parsed.error}`);
}
```

---

### P3-2: Error Boundary 應整合 Sentry

**檔案**: `WallErrorBoundary.tsx`
**建議**: 使用 `@sentry/react` 的 `ErrorBoundary` 包裝，自動上報錯誤

---

### P3-3: 考慮使用 React Query 的 suspense 模式

**建議**: 配合 React 18 Suspense 簡化 loading 狀態處理

---

### P3-4: 圖片資源應使用 lazy loading

**檔案**: 各個顯示圖片的組件
**建議**: 使用 `loading="lazy"` 或 `react-lazy-load-image-component`

---

## ✅ 確認已正確完成的項目

以下項目經審計確認代碼與文檔一致：

- [x] WallErrorBoundary 實作完整，支援 error.cause 鏈
- [x] QASection Focus Trap 實作正確，有 cleanup 邏輯
- [x] PostsSection Tab 鍵盤導航支援 Home/End
- [x] WallSkeleton 有正確的 a11y 標記 (role="status", aria-busy)
- [x] API 層使用延遲初始化避免模組載入崩潰
- [x] communityWallConverters 有 sortPostsWithPinned 排序邏輯
- [x] 未登入時 useCommunityWallQuery 跳過樂觀更新

---

## 📋 下一步行動計畫

### 本週必須完成 (P0)
1. [ ] 設定 Vercel 環境變數，讓 API 正常運作
2. [ ] 移除 API 錯誤自動切換 Mock 的邏輯
3. [ ] 建立 `/api/log-error` 端點或整合 Sentry
4. [ ] 實作後端真實權限驗證 (community_members JOIN)
5. [ ] 修復評價區 agent stats 硬編碼問題

### 下週完成 (P1)
6. [ ] 移除 convertApiData 的 mockFallback 參數
7. [ ] 拆分 useCommunityWallData Hook
8. [ ] 修復樂觀更新後不必要的 invalidateQueries
9. [ ] 按讚功能加入 debounce
10. [ ] 建立回覆功能的 GitHub Issue

---

> **審計結論**: 此專案存在嚴重的「文檔驅動開發」問題 - 文檔寫得很漂亮，但代碼沒跟上。建議團隊建立 PR Review 流程，確保「文檔聲稱完成的功能必須有對應的代碼變更」。
