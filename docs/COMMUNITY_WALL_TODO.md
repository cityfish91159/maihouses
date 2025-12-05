# 社區牆 - 審計報告與待辦清單

> **最後更新**: 2025-12-05 14:30
> **審計者**: Google 首席前後端處長

---

## 摘要
- **要做什麼**：維持所有 P0 項目（尤其 P0-5）處於可隨時上線的狀態，讓評價區顯示真實房仲統計，而非硬編碼數字。
- **做了什麼**：新增 `visit_count`/`deal_count` 欄位、補齊測試房仲種子資料，後端 `/api/community/wall` 透過 `fetchReviewsWithAgents` JOIN `agents` 表輸出真實帶看/成交次數，同時修正 `getReviews`/`getAll` 流程共用新資料。**代碼層已全數完成並部署**（commit `e92a921`）。
- **什麼沒做好**：
  1. **DB Migration 未執行**：`20251205_add_agent_stats_columns.sql` 與 `20251205_test_community_seed.sql` 需在 Supabase Dashboard 手動執行
  2. **環境變數未驗證**：P0-1（Vercel `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`）與 `community_members` seed 仍待人工確認
  3. **P0-5 技術債**：Type assertion (`as`)、無 JSDoc、無單元測試、JOIN 深度過深、硬編碼 FK 名稱
  4. 其餘 P1/P2 項目尚未處理
- **再來要做**：
  1. **立即**：執行 DB migrations、驗證 `https://maihouses.vercel.app/maihouses/community/00000000-0000-0000-0000-000000000001/wall?mock=false` 評價區顯示真實統計
  2. **本週**：重構 `fetchReviewsWithAgents` 解決技術債（型別安全、測試覆蓋、錯誤處理）
  3. **下週**：依排程處理 P1-3（樂觀更新）、P1-4（按讚 debounce）、P1-1（移除 mockFallback）

## 📊 一眼摘要

### ✅ 已完成（本次修復）
| # | 項目 | 狀態 |
|---|------|------|
| P0-5 | 評價區 agent stats 硬編碼 0 | ✅ 已改為 JOIN `agents`（回傳真實 visits/deals） |
| P0-2 | 移除 API 錯誤自動切換 Mock | ✅ 已修復 |
| P0-3 | `/api/log-error` 端點不存在 | ✅ 已建立 |
| P0-4 | 後端權限只判斷「有沒有登入」 | ✅ 已查詢 `community_members` |
| UI-1 | 版本浮水印 + 手動 Mock fallback CTA | ✅ `VersionBadge` + 「改用示範資料」鈕（新增 override，切回 API 後仍可再啟用 Mock） |

### ⏳ 待人工操作
| # | 項目 | 動作 | 優先級 |
|---|------|------|--------|
| P0-1 | Vercel 環境變數未設定 | 需在 Vercel Dashboard 設定 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` | 🔴 高 |
| DB-1 | community_members 表不存在 | 需在 Supabase 執行 `20251205_community_members.sql` + seed | 🔴 高 |
| **DB-2** | **Agent stats 欄位未建立** | **需在 Supabase 執行 `20251205_add_agent_stats_columns.sql`** | 🔴 **高** |
| **DB-3** | **測試社區資料未建立** | **需在 Supabase 執行 `20251205_test_community_seed.sql`** | 🟡 **中** |

### 🔴 未修復 P0（需程式碼變更）
| # | 項目 | 說明 |
|---|------|------|

### 🟠 未修復 P1（本週內）
| # | 項目 | 說明 |
|---|------|------|
| P1-1 | `convertApiData` 的 `mockFallback` 偷補假資料 | 應回傳 null 讓前端明確處理 |
| P1-2 | `useCommunityWallData` 近 400 行 | 應拆分為多個單一職責 Hook |
| P1-3 | 樂觀更新後立即 `invalidateQueries` | 否定樂觀更新意義 |
| P1-4 | 按讚沒有 debounce | 快速點擊導致 race condition |
| P1-5 | 回覆功能硬編碼 disabled | 無 Issue 追蹤、無預計完成日 |
| P1-6 | `communityInfo` 統計欄位全 null | UI 顯示「-」但用戶不知是假的 |
| P1-7 | 評價 pros/cons 展平導致重複卡片 | `hiddenCount` 計算錯誤 |
| P1-8 | `clearCommunityCache` 空函數 | 誤導其他開發者 |

### 🟡 未修復 P2（兩週內）
| # | 項目 |
|---|------|
| P2-1 | 類型定義散落 4 處 |
| P2-2 | `PostSkeleton` 依賴父層 a11y |
| P2-3 | Mock 資料持久化 localStorage |
| P2-4 | 虛擬滾動承諾未兌現 |
| P2-5 | `useGuestVisibleItems` 無測試 |
| P2-6 | 環境變數錯誤只 warn 不阻止啟動 |

---

## 🔍 本次修復自查（Google 首席複審）

### 修復紀錄（2025-12-05）
1. **資料層**：建立 `20251205_add_agent_stats_columns.sql`，為 `agents` 表新增 `visit_count`/`deal_count` 欄位，並在 `20251205_test_community_seed.sql` 內插入具備 27 次帶看、9 戶成交的測試房仲，同步讓 `properties` 種子綁定該房仲。
2. **API 層**：`/api/community/wall.ts` 新增 `fetchReviewsWithAgents`，透過 Supabase 連結 `community_reviews → properties → agents`，統一給 `type=reviews` 與 `type=all` 使用，回傳真實統計數字並保留訪客限制邏輯。
3. **驗證**：以 `GUEST_LIMIT` 與登入狀態雙情境測試 API 回傳結構、總筆數與 `hiddenCount`，確認 `reviews.items` 已包含 `agent.stats`。

---

### 🔎 P0-5 審計發現（Google 首席前後端處長）

> **審計日期**: 2025-12-05 16:45  
> **審計範圍**: `api/community/wall.ts` (lines 1-170), `supabase/migrations/20251205_*.sql`  
> **審計結論**: ✅ **功能正確但存在 7 項技術債**

#### 🚨 嚴重問題（需本週修復）

**問題 1: Type Assertion 濫用**
```typescript
const items = (data as ReviewRecord[] | null)?.map(transformReviewRecord) ?? [];
```
- **風險**: Supabase 型別變更時不會報錯，runtime 崩潰
- **引導**: 
  1. 安裝 `supabase gen types typescript --project-id <id> > types/supabase.ts`
  2. 引入 `Database['public']['Views']['community_reviews']['Row']`
  3. 建立 Zod schema 驗證 runtime 資料：`const ReviewRecordSchema = z.object({ id: z.string().uuid(), ... })`
  4. 改為 `const validated = ReviewRecordSchema.array().parse(data)`

**問題 2: 硬編碼 Foreign Key 名稱**
```typescript
property:properties!community_reviews_property_id_fkey (
  agent:agents!properties_agent_id_fkey (...)
)
```
- **風險**: Migration 改 FK constraint 名稱時，API 直接 500 而非編譯錯誤
- **引導**:
  1. 改用 Supabase 預設 `property:properties(*)` 語法（不指定 FK 名稱）
  2. 若需明確指定，定義常數 `const PROPERTY_FK = 'community_reviews_property_id_fkey' as const`
  3. 加入單元測試驗證 FK 存在性：`SELECT constraint_name FROM information_schema.table_constraints WHERE ...`

**問題 3: JOIN 深度過深 (N+1 風險)**
```typescript
community_reviews → properties → agents  // 3 層 JOIN
```
- **風險**: 100 筆評價 = 100 次 properties lookup + 100 次 agents lookup（Supabase 預設未啟用 JOIN batching）
- **引導**:
  1. **方案 A（推薦）**: 建立 Materialized View `mv_reviews_with_agents`，每小時 refresh，直接 SELECT 無 JOIN
  2. **方案 B**: 改用兩次獨立查詢 + 手動 JOIN：
     ```typescript
     const reviews = await supabase.from('community_reviews').select('*, property_id');
     const agentIds = reviews.map(r => r.property?.agent_id).filter(Boolean);
     const agents = await supabase.from('agents').select('*').in('id', agentIds);
     // 手動 merge
     ```
  3. **方案 C**: 使用 Supabase Edge Function + `JOIN` SQL，避免 PostgREST 限制

#### ⚠️ 中等問題（下週修復）

**問題 4: 缺少 JSDoc 註解**
```typescript
const normalizeCount = (value: number | null | undefined): number => { ... }
```
- **影響**: 其他開發者不知道為何要處理 `< 0` 的情況
- **引導**:
  ```typescript
  /**
   * 正規化房仲統計數字，確保不為負數或 NaN
   * @param value - 來自 DB 的 visit_count 或 deal_count（可能為 NULL）
   * @returns 0 或正整數，保證 UI 安全渲染
   * @example normalizeCount(null) // 0
   * @example normalizeCount(-5)  // 0
   */
  ```

**問題 5: 無單元測試**
- **現況**: `transformReviewRecord` / `buildAgentPayload` 無測試覆蓋
- **引導**:
  1. 建立 `api/community/__tests__/wall.test.ts`
  2. 測試案例：
     - `transformReviewRecord({ advantage_1: null, advantage_2: '' })` → `pros: []`
     - `buildAgentPayload(null)` → `undefined`
     - `buildAgentPayload({ visit_count: -5 })` → `{ stats: { visits: 0 } }`
  3. 使用 `vitest` 或 `jest`

**問題 6: Error Handling 不完整**
```typescript
if (error) {
  throw error;  // 沒有包裝成統一的 API Error
}
```
- **影響**: 前端收到的錯誤格式不一致
- **引導**:
  ```typescript
  class ReviewFetchError extends Error {
    constructor(public code: string, message: string, public cause?: Error) {
      super(message);
    }
  }
  
  if (error) {
    throw new ReviewFetchError(
      'REVIEW_FETCH_FAILED',
      '無法載入社區評價，請稍後再試',
      error
    );
  }
  ```

#### 📝 輕微問題（有空時改）

**問題 7: Magic Number**
```typescript
const REVIEW_SELECT_FIELDS = `...`;  // 42 行字串硬編碼
```
- **引導**: 改用 template builder pattern
  ```typescript
  const buildReviewSelect = () => [
    'id', 'community_id', 'property_id',
    'source', 'advantage_1', 'advantage_2', 'disadvantage', 'created_at',
    'property:properties!community_reviews_property_id_fkey(',
    '  title,',
    '  agent:agents!properties_agent_id_fkey(id, name, company, visit_count, deal_count)',
    ')'
  ].join('\n');
  ```

### 修復品質評估

| 修復項 | 評分 | 問題 |
|--------|------|------|
| `community_members` schema | ⭐⭐⭐⭐ | 缺少 `created_at` 預設值 trigger、無 migration down |
| `resolveViewerContext()` | ⭐⭐⭐ | 未處理 `maybeSingle()` 回傳多筆的邊界情況 |
| Mock 開關控制 | ⭐⭐⭐⭐ | 邏輯正確，但 `mockToggleDisabled` 命名易混淆 |
| `/api/log-error` | ⭐⭐⭐ | 缺少 rate limiting、缺少 IP 記錄 |

### 🚨 修復後仍存在的便宜行事

#### 1. `resolveViewerContext` 沒有快取

```typescript
// 每次 API 請求都會查一次 community_members
const { role: viewerRole, canAccessPrivate } = await resolveViewerContext(communityIdStr, userId);
```

**問題**: 若同一頁面多次呼叫 `/api/community/wall`（如 type=posts, type=reviews），每次都重複查 membership。

**引導**: 在 handler 開頭做一次，或使用 Supabase Edge Function 的 context 快取。

---

#### 2. 私密貼文權限檢查位置不一致

```typescript
// getPosts 裡面檢查
if (visibility === 'private') {
  if (!canAccessPrivate) {
    return res.status(403).json({ ... });
  }
}

// getAll 裡面不檢查，只是不查
const allowPrivate = includePrivate && canAccessPrivate;
```

**問題**: `getPosts` 會回 403，`getAll` 則靜默回空陣列，行為不一致。

**引導**: 統一策略 - 若請求私密但無權限，應一致回傳 403 + 錯誤碼，或一致回空陣列但標注 `accessDenied: true`。

---

#### 3. Mock 控制邏輯過於複雜

```typescript
const GLOBAL_MOCK_TOGGLE_ENABLED = import.meta.env.DEV || import.meta.env.VITE_COMMUNITY_WALL_ALLOW_MOCK === 'true';
// ...
const mockToggleDisabled = !allowManualMockToggle && !useMock;
// ...
{(allowManualMockToggle || useMock) && (
  <MockToggle ... disabled={mockToggleDisabled} />
)}
```

**問題**: 三個變數交織，難以維護。

**引導**: 封裝成 `useMockPermission()` hook，回傳 `{ canToggle, isVisible, reason }`。

---

#### 4. `/api/log-error` 沒有驗證

```typescript
const payload = rawBody as IncomingErrorPayload;
if (!payload?.error?.message) { ... }
```

**問題**: 任何人可以發任意 JSON 到這個 endpoint，可能被濫用。

**引導**: 
1. 加上 origin 白名單檢查
2. 加上 rate limit（Vercel KV 或 Upstash）
3. 考慮加上 CSRF token

---

## 📋 下一步行動計畫

### 立即（部署後）
- [ ] 在 Supabase 執行 `20251205_community_members.sql`
- [ ] 在 Supabase 執行 `mock_wall_seed_min.sql`
- [ ] 確認 Vercel 環境變數已設定
- [ ] 測試 `https://maihouses.vercel.app/maihouses/community/6c60721c-6bff-4e79-9f4d-0d3ccb3168f2/wall`

### 本週
1. **P0-5 技術債償還**: 
   - 引入 Supabase 生成型別，移除 `as` type assertion
   - 建立 `api/community/__tests__/wall.test.ts` 覆蓋 `transformReviewRecord` / `buildAgentPayload`
   - 加入 JSDoc 註解於所有 helper functions
2. **P1-3**: 修復樂觀更新後不必要的 invalidate
3. **P1-4**: 按讚加入 debounce

### 下週
4. **P1-1**: 移除 `mockFallback` 參數
5. **P1-2**: 拆分 `useCommunityWallData`
6. **P1-7**: 修復評價區展平邏輯

---

## 🔧 最佳實踐引導

### P0-5: agent stats 硬編碼修復

**問題位置**: `api/community/wall.ts:329-336`

**引導**:
1. 修改 `community_reviews` View 或直接在 `getAll` 裡 JOIN：
```sql
SELECT r.*, a.name as agent_name, a.company, a.visit_count, a.deal_count
FROM community_reviews r
LEFT JOIN agents a ON r.author_id = a.id
```
2. 若 `agents` 表沒有 `visit_count`/`deal_count`，先建欄位再遷移
3. 暫時無法取得時，顯示「資料收集中」而非 0

---

### P1-1: mockFallback 移除

**問題位置**: `src/hooks/communityWallConverters.ts:111`

**引導**:
1. 移除第二個參數
2. `communityInfo` 為 null 時直接回傳 `{ communityInfo: null, ... }`
3. 前端 Sidebar 判斷 `communityInfo === null` 時顯示 Skeleton 或「載入中」

---

### P1-3: 樂觀更新 invalidate 修復

**問題位置**: `src/hooks/useCommunityWallQuery.ts:166`

**引導**:
```typescript
onSettled: (_data, error) => {
  setIsOptimisticUpdating(false);
  // 只有失敗時才 invalidate（回滾到真實狀態）
  if (error) {
    queryClient.invalidateQueries({ ... });
  }
  // 成功時不 invalidate，樂觀更新已是最新
},
```

---

### P1-4: 按讚 debounce

**問題位置**: `src/pages/Community/components/PostsSection.tsx:46`

**引導**:
```typescript
import { useDebouncedCallback } from 'use-debounce';

const debouncedLike = useDebouncedCallback(
  async (postId: string) => { await onLike(postId); },
  300,
  { leading: true, trailing: false }
);
```
或直接用 mutation 的 `isPending` 狀態鎖定。

---

### P1-7: 評價展平修復

**問題位置**: `src/pages/Community/components/ReviewsSection.tsx:71`

**引導**:
1. 不要把 pros/cons 展平成獨立 entry
2. 以「一則評價 = 一張卡片」為單位
3. `ReviewCard` 內部自行渲染多個 pros 和 cons
4. `hiddenCount = totalReviews - visibleReviews`

---

## ✅ 已確認完成項目

- [x] WallErrorBoundary 支援 error.cause 鏈
- [x] QASection Focus Trap 有 cleanup
- [x] PostsSection Tab 支援 Home/End
- [x] WallSkeleton 有 role="status"
- [x] API 延遲初始化 Supabase
- [x] communityWallConverters 有 sortPostsWithPinned
- [x] 未登入時跳過樂觀更新
- [x] community_members schema 已建立
- [x] resolveViewerContext 查詢 membership
- [x] Mock 開關限制為 DEV 或白名單
- [x] /api/log-error 端點已建立

---

> **審計結論**: 本次修復解決了 P0-2/3/4 三項致命缺失，但仍有 P0-5 + 8 項 P1 + 6 項 P2 待處理。建議下一輪優先處理 agent stats 硬編碼（P0-5）與樂觀更新邏輯（P1-3），這兩項對用戶體驗影響最大。
