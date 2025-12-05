# 社區牆 - 審計報告與待辦清單

> **最後更新**: 2025-12-05 11:20
> **審計者**: Google 首席前後端處長

---

## 📊 一眼摘要

### ✅ 已完成（本次修復）
| # | 項目 | 狀態 |
|---|------|------|
| P0-2 | 移除 API 錯誤自動切換 Mock | ✅ 已修復 |
| P0-3 | `/api/log-error` 端點不存在 | ✅ 已建立 |
| P0-4 | 後端權限只判斷「有沒有登入」 | ✅ 已查詢 `community_members` |
| UI-1 | 版本浮水印 + 手動 Mock fallback CTA | ✅ `VersionBadge` + 「改用示範資料」鈕 |

### ⏳ 待人工操作
| # | 項目 | 動作 |
|---|------|------|
| P0-1 | Vercel 環境變數未設定 | 需在 Vercel Dashboard 設定 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` |
| DB | community_members 表不存在 | 需在 Supabase 執行 `20251205_community_members.sql` + seed |

### 🔴 未修復 P0（需程式碼變更）
| # | 項目 | 說明 |
|---|------|------|
| P0-5 | 評價區 agent stats 硬編碼 0 | 需 JOIN `agents` 表取真實數據 |

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
1. **P0-5**: 修復 agent stats 硬編碼（JOIN agents 表）
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
