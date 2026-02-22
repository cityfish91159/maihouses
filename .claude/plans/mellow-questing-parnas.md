# 社區探索頁調查報告：Header「社區評價」導航 + 探索頁 + 首頁聚合區塊

## Context

使用者要求調查 5 種用戶狀態（visitor、demo、live+有社區、live+無社區、live+loading中）點擊 Header「社區評價」按鈕後的完整流程，以及首頁底部「社區評價（聚合）」區塊點擊後的行為。比對工單 #12b、#8c、#8d 規格，找出所有偏差。

---

## 一、Header「社區評價」按鈕導航邏輯

**程式碼位置**：`src/components/Header/Header.tsx:51-62`

```typescript
const navigateToCommunity = useCallback(() => {
  const targetRoute =
    mode === 'demo'
      ? ROUTES.COMMUNITY_WALL(SEED_COMMUNITY_ID)
      : isUserCommunityLoading
        ? ROUTES.COMMUNITY_EXPLORE
        : mode === 'live' && isAuthenticated && userCommunityId
          ? ROUTES.COMMUNITY_WALL(userCommunityId)
          : ROUTES.COMMUNITY_EXPLORE;
  void navigate(RouteUtils.toNavigatePath(targetRoute));
}, [isAuthenticated, isUserCommunityLoading, mode, navigate, userCommunityId]);
```

**依賴**：
- `usePageMode()` → `mode` = `'visitor'` | `'demo'` | `'live'`
- `useUserCommunity({ isAuthenticated, userId })` → `{ communityId, isLoading }`
- `SEED_COMMUNITY_ID` = `'test-uuid'`（`src/constants/seed.ts`）
- `ROUTES.COMMUNITY_WALL(id)` = `/maihouses/community/${id}/wall`
- `ROUTES.COMMUNITY_EXPLORE` = `/maihouses/community`

### 各狀態導航結果（程式碼行為）

| 用戶狀態 | mode | 條件 | 導向 | 符合 #12b？ |
|---------|------|------|------|------------|
| demo | `'demo'` | 直接命中第一條 | `/community/test-uuid/wall`（seed 社區牆） | ✅ |
| live + API loading 中 | `'live'` | `isUserCommunityLoading === true` | `/community`（探索頁） | ✅ |
| live + 有社區歸屬 | `'live'` | `isAuthenticated && userCommunityId` | `/community/${userCommunityId}/wall` | ✅ |
| live + 無社區歸屬 | `'live'` | `userCommunityId` 為 null | `/community`（探索頁） | ✅ |
| visitor | `'visitor'` | 全部 falsy，走最後 fallback | `/community`（探索頁） | ✅ |

**結論：Header 導航邏輯完全符合 #12b 工單規格，無偏差。**

---

## 二、探索頁（Explore.tsx）行為分析

**程式碼位置**：`src/pages/Community/Explore.tsx`（406 行）

### 資料流

1. `Explore.tsx:233` 無條件呼叫 `useCommunityList()`
2. `useCommunityList.ts:37` 呼叫 `GET /api/community/list`
3. `api/community/list.ts:100-104` 查詢 Supabase `communities` 表，**無任何內容過濾**
4. 所有 `communities` 表中的記錄都會回傳，包括 `post_count=0` 且 `review_count=0` 的空社區

### 核心問題：API 缺少內容過濾

**工單 #8c 明確要求**（`.claude/tickets/MOCK-SYSTEM.md:1840`）：
> 僅回傳有公開內容的社區（`post_count > 0` 或 `review_count > 0`）

**實際程式碼**（`api/community/list.ts:181-184`）：
```typescript
const { rows } = await fetchCommunityBatch(offset, limit);
const postCountMap = await fetchPostCountMap(rows);
const pagedItems = buildCommunityListItems(rows, postCountMap);
```

`buildCommunityListItems` 只做欄位映射，完全沒有過濾。`fetchCommunityBatch` 也只是 `select + order + range`，沒有 WHERE 條件。

**根因**：先前 strict audit P2-1 簡化批量迴圈時，把原本的過濾邏輯（`post_count > 0 || review_count > 0`）一併移除了。

**影響**：Supabase `communities` 表中的 seed/test 資料（如「榮耀城示範社區」「明湖水岸」）即使沒有任何公開貼文或評價，也會出現在探索頁。

### 測試也有問題

**`api/community/__tests__/list.test.ts:163-241`**：測試案例 `'returns filtered and paginated community list'` 的 mock 資料中，`COMMUNITY_C` 的 `review_count: 0` 且 `post_count: 0`，但測試**預期它出現在回傳結果中**（line 231-238）。這個測試與 #8c 規格矛盾——按照工單，`post_count=0 && review_count=0` 的社區不應該回傳。

### 探索頁其他行為（符合 #8d）

| 功能 | 狀態 |
|------|------|
| 搜尋框前端過濾（名稱+地址） | ✅ 正常 |
| MaiMai mood 互動（wave→thinking→excited→confused→happy→celebrate） | ✅ 正常 |
| 骨架屏 loading | ✅ 正常 |
| 錯誤重試 | ✅ 正常 |
| 空狀態 MaiMai confused | ✅ 正常 |
| 底部 CTA 僅 visitor | ✅ `Explore.tsx:400` |
| live 會員引導 | ✅ `Explore.tsx:401` |
| demo 模式不顯示底部 CTA | ✅ 無任何 demo 邏輯 |
| Quick filters（評價高/討論熱/捷運/學區） | ✅ 正常 |
| Sort（推薦/評價數/貼文數/名稱） | ✅ 正常 |
| 卡片點擊 → 社區牆 | ✅ `Explore.tsx:296-300` |

---

## 三、首頁「社區評價（聚合）」區塊

**程式碼位置**：`src/features/home/sections/CommunityTeaser.tsx`（220 行）

### 資料來源

- 用 React Query 呼叫 `getFeaturedHomeReviews`（`src/services/communityService.ts`）
- Error 或無資料時 fallback 到 `BACKUP_REVIEWS`（靜態）

### 點擊行為

**評價卡片點擊**（`CommunityTeaser.tsx:108-117`）：
```typescript
const handleReviewClick = useCallback((review: ReviewWithNavigation) => {
  if (review.source === 'real' && review.communityId) {
    navigate(RouteUtils.toNavigatePath(ROUTES.COMMUNITY_WALL(review.communityId)));
  } else {
    navigate(explorePath);
  }
}, [navigate, explorePath]);
```

| 評價來源 | 有 communityId | 導向 |
|---------|---------------|------|
| `source === 'real'` + 有 id | ✅ | 該社區的牆頁 |
| `source === 'real'` + 無 id | — | 探索頁 |
| `source === 'seed'` | — | 探索頁 |
| BACKUP_REVIEWS（error fallback） | — | 探索頁（backup 的 source 已含欄位） |

**「查看更多真實住戶評價」按鈕**（`CommunityTeaser.tsx:208`）：
```typescript
onClick={() => navigate(explorePath)}
```
→ 始終導向探索頁。

**結論：CommunityTeaser 導航邏輯正確，real+id 去社區牆，其餘去探索頁。**

---

## 四、問題總結

| # | 問題 | 嚴重度 | 位置 |
|---|------|--------|------|
| **BUG-1** | API 缺少內容過濾，`post_count=0 && review_count=0` 的社區不應回傳但被回傳了 | **P0** | `api/community/list.ts:60-72` |
| **BUG-2** | 測試預期與 #8c 規格矛盾，COMMUNITY_C（0 post, 0 review）被預期出現在結果中 | **P1** | `api/community/__tests__/list.test.ts:231-238` |

---

## 五、修復計畫

### BUG-1：`api/community/list.ts` 加回內容過濾

在 `buildCommunityListItems` 回傳後加入過濾：

```typescript
// api/community/list.ts handler 函數中，line 184 之後
const visibleItems = pagedItems.filter(
  (item) => item.post_count > 0 || item.review_count > 0
);
```

將 `visibleItems` 傳入 response validation 而非 `pagedItems`。

### BUG-2：更新測試

`api/community/__tests__/list.test.ts:163-241`：
- `COMMUNITY_C`（`post_count: 0`, `review_count: 0`）不應出現在預期結果中
- 預期 `data` 陣列只包含 `COMMUNITY_A`（review_count: 2, post_count: 1）和 `COMMUNITY_B`（review_count: 0, post_count: 2）

---

## 六、驗證方式

1. `npm run gate` 通過
2. `npx vitest run api/community/__tests__/list.test.ts` — 測試通過，COMMUNITY_C 被過濾
3. `npx vitest run src/pages/Community/` — 探索頁測試通過
4. 確認修復後，`post_count=0 && review_count=0` 的社區不會出現在 API 回傳中
