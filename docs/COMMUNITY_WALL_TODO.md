# 社區牆 - 審計報告與待辦清單

> **最後更新**: 2025-12-06 20:30
> **審計者**: Google 首席前後端處長

---

## 摘要

- **要做什麼**：讓社區牆在 API 模式下顯示有意義的作者名稱（非「匿名」），並維持所有 P0 項目可上線狀態。
- **做了什麼**：
  1. 前端 `communityWallConverters.ts` 新增角色感知 fallback 邏輯，Posts/Reviews/QA Answers 若無 `author.name` 則顯示 `用戶-xxxxxx` / `房仲-xxxxxx` / `官方-xxxxxx`
  2. 型別補充 `CommunityPost.author.role` 新增 `'official'`
  3. 已部署至 Vercel (commit 2678234)
- **什麼沒做好**：
  1. **根本問題未解決**：後端 API 仍只回傳 `author_id`，未 JOIN 用戶表取得真實姓名
  2. **前端只是貼 OK 繃**：fallback 顯示 `用戶-xxxxxx` 是暫時方案，非最終解
  3. **無單元測試**：`convertApiPost` / `convertApiReview` / `convertApiQuestion` 的 fallback 邏輯無測試覆蓋
  4. **重複邏輯**：三個 converter 函數內有相同的 fallback 邏輯，應抽取共用
- **再來要做**：
  1. **後端修改**：`/api/community/wall.ts` 的 `getPosts` / `getAll` 需 JOIN `profiles` 或 `users` 表，回傳 `author: { name, role, avatar_url }`
  2. **補測試**：為 converters 新增 vitest 測試，確保 fallback 邏輯正確
  3. **重構**：抽取 `buildFallbackAuthor(role, authorId)` 共用函數

## 📊 一眼摘要

### ✅ 已完成（本次修復 2025-12-06）
| # | 項目 | 狀態 |
|---|------|------|
| FE-1 | 前端 fallback 作者名稱 | ✅ `convertApiPost`/`convertApiReview`/`convertApiQuestion` 現在顯示 `用戶-xxxxxx` 而非「匿名」 |
| FE-2 | 型別補充 | ✅ `CommunityPost.author.role` 新增 `'official'` |

### ⏳ 待人工操作
| # | 項目 | 動作 | 優先級 |
|---|------|------|--------|
| P0-1 | Vercel 環境變數未設定 | 需在 Vercel Dashboard 設定 `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY` | 🔴 高 |
| DB-1 | community_members 表不存在 | 需在 Supabase 執行 `20251205_community_members.sql` + seed | 🔴 高 |
| DB-2 | Agent stats 欄位未建立 | 需在 Supabase 執行 `20251205_add_agent_stats_columns.sql` | 🔴 高 |
| DB-3 | 測試社區資料未建立 | 需在 Supabase 執行 `20251205_test_community_seed.sql` | 🟡 中 |
| API-1 | `community_reviews_property_id_fkey` 遺失 | Supabase Table Editor 建立 FK 或重建 View | 🔴 高 |

### 🔴 未修復 P0（需程式碼變更）
| # | 項目 | 說明 |
|---|------|------|
| **P0-7** | **後端 Posts 不回傳作者資訊** | **`getPosts`/`getAll` 只 `.select('*')` 沒有 JOIN 用戶表，導致前端只能用 fallback** |
| P0-6 | 生產 `/api/community/wall` 仍回傳 `PGRST200` | 需要在 Supabase 補上 FK |

### 🟠 未修復 P1（本週內）
| # | 項目 | 說明 |
|---|------|------|
| **P1-9** | **Converter fallback 邏輯重複** | **三個 converter 函數內有相同的 `fallbackLabel`/`fallbackAuthor` 邏輯，應抽取共用** |
| **P1-10** | **Converters 無單元測試** | **`convertApiPost`/`convertApiReview`/`convertApiQuestion` 的 fallback 分支無測試覆蓋** |
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

## 🔍 本次修復審計（Google 首席前後端處長 2025-12-06）

### 審計範圍
- `src/hooks/communityWallConverters.ts` (lines 57-130)
- `src/services/communityService.ts` (line 32)

### 🚨 嚴重問題（需本週修復）

#### 問題 1: 只改前端不改後端 = 治標不治本

**現況**:
```typescript
// 前端做了 fallback
const fallbackAuthor = post.author_id ? `${fallbackLabel}-${post.author_id.slice(0, 6)}` : fallbackLabel;
const authorName = post.author?.name?.trim() || fallbackAuthor;
```

**問題**: API 回傳的 `community_posts` 根本沒有 `author` 物件，只有 `author_id`。前端永遠只能用 fallback。

**引導**:
1. 確認 Supabase 是否有 `profiles` 或 `users` 表存放用戶名稱
2. 修改 `api/community/wall.ts` 的 `getPosts` 函數：
   ```typescript
   // 方案 A：PostgREST nested select（若有 FK）
   .select(`
     *,
     author:profiles!community_posts_author_id_fkey(
       name, avatar_url, role
     )
   `)
   
   // 方案 B：分段查詢（若無 FK）
   const posts = await supabase.from('community_posts').select('*');
   const authorIds = [...new Set(posts.map(p => p.author_id))];
   const profiles = await supabase.from('profiles').select('id, name, role').in('id', authorIds);
   // 手動 merge
   ```
3. 確保 `getAll` 也套用相同邏輯

---

#### 問題 2: 重複邏輯 = 維護地獄

**現況**:
```typescript
// convertApiPost 內
const role: 'resident' | 'agent' | 'official' = post.author?.role === 'agent' ? 'agent' : ...;
const fallbackLabel = role === 'agent' ? '房仲' : role === 'official' ? '官方' : '用戶';
const fallbackAuthor = post.author_id ? `${fallbackLabel}-${post.author_id.slice(0, 6)}` : fallbackLabel;

// convertApiQuestion 內（answers mapping）
const type: 'resident' | 'agent' | 'official' = answer.author?.role === 'agent' ? 'agent' : ...;
const fallbackLabel = type === 'agent' ? '房仲' : type === 'official' ? '官方' : '用戶';
const fallbackAuthor = answer.author_id ? `${fallbackLabel}-${answer.author_id.slice(0, 6)}` : fallbackLabel;
```

**問題**: 三處幾乎一樣的邏輯，未來改一處忘改另一處就會出 bug。

**引導**:
```typescript
// 抽取共用函數
type AuthorRole = 'resident' | 'agent' | 'official';

interface AuthorInput {
  name?: string;
  role?: string;
}

function resolveAuthorDisplay(
  authorId: string | undefined,
  author: AuthorInput | undefined
): { name: string; role: AuthorRole } {
  const role: AuthorRole =
    author?.role === 'agent' ? 'agent' :
    author?.role === 'official' ? 'official' : 'resident';
    
  const roleLabels: Record<AuthorRole, string> = {
    agent: '房仲',
    official: '官方',
    resident: '用戶',
  };
  
  const fallback = authorId
    ? `${roleLabels[role]}-${authorId.slice(0, 6)}`
    : roleLabels[role];
    
  return {
    name: author?.name?.trim() || fallback,
    role,
  };
}

// 使用
const { name: authorName, role } = resolveAuthorDisplay(post.author_id, post.author);
```

---

#### 問題 3: 無測試覆蓋 = 下次重構必出事

**現況**: `convertApiPost` / `convertApiReview` / `convertApiQuestion` 的 fallback 邏輯無任何測試。

**引導**:
1. 建立 `src/hooks/__tests__/communityWallConverters.test.ts`
2. 測試案例：
   ```typescript
   describe('convertApiPost', () => {
     it('應使用 author.name 當有提供時', () => {
       const post = { author_id: '123456789', author: { name: '王小明', role: 'resident' }, ... };
       expect(convertApiPost(post).author).toBe('王小明');
     });
     
     it('應使用 fallback 當 author.name 為空時', () => {
       const post = { author_id: '123456789', author: { name: '', role: 'resident' }, ... };
       expect(convertApiPost(post).author).toBe('用戶-123456');
     });
     
     it('應使用角色標籤當 role 為 agent 時', () => {
       const post = { author_id: '123456789', author: { role: 'agent' }, ... };
       expect(convertApiPost(post).author).toBe('房仲-123456');
     });
     
     it('應只顯示角色標籤當無 author_id 時', () => {
       const post = { author_id: undefined, author: undefined, ... };
       expect(convertApiPost(post).author).toBe('用戶');
     });
   });
   ```

---

### ⚠️ 中等問題

#### 問題 4: `member` role 被忽略

**現況**:
```typescript
// communityService.ts
role?: 'resident' | 'agent' | 'member' | 'official';

// communityWallConverters.ts
const role: 'resident' | 'agent' | 'official' =
  post.author?.role === 'agent' ? 'agent' :
  post.author?.role === 'official' ? 'official' : 'resident';
```

**問題**: `member` 角色會被當成 `resident` 處理，可能不是預期行為。

**引導**: 明確處理 `member` 或在型別定義中移除。

---

#### 問題 5: `author_id.slice(0, 6)` 假設 ID 格式

**現況**:
```typescript
const fallbackAuthor = post.author_id ? `${fallbackLabel}-${post.author_id.slice(0, 6)}` : fallbackLabel;
```

**問題**: 假設 `author_id` 是 UUID 且前 6 碼足夠識別。若 ID 格式改變，可能顯示無意義字串。

**引導**:
```typescript
// 加入防禦
const idSuffix = post.author_id && post.author_id.length >= 6
  ? post.author_id.slice(0, 6)
  : post.author_id ?? '';
const fallbackAuthor = idSuffix ? `${fallbackLabel}-${idSuffix}` : fallbackLabel;
```

---

### 📝 輕微問題

#### 問題 6: 三元運算子巢狀過深

**現況**:
```typescript
const role: 'resident' | 'agent' | 'official' =
  post.author?.role === 'agent'
    ? 'agent'
    : post.author?.role === 'official'
    ? 'official'
    : 'resident';
```

**引導**: 改用 Map 或 switch：
```typescript
const roleMap: Record<string, AuthorRole> = {
  agent: 'agent',
  official: 'official',
};
const role = roleMap[post.author?.role ?? ''] ?? 'resident';
```

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

### P0-7: 後端 Posts 不回傳作者資訊（新增）

**問題位置**: `api/community/wall.ts` 的 `getPosts()` 與 `getAll()` 函數

**現況**:
```typescript
.select('*', { count: 'exact' })  // 只取 community_posts 本身欄位
```

**引導**:
1. 先確認 Supabase 是否有 `profiles` 表且有 `community_posts.author_id → profiles.id` 的 FK
2. 若有 FK：
   ```typescript
   .select(`
     *,
     author:profiles!community_posts_author_id_fkey(
       id, name, avatar_url, role
     )
   `, { count: 'exact' })
   ```
3. 若無 FK（採分段查詢）：
   ```typescript
   // Step 1: 取得貼文
   const { data: posts } = await supabase
     .from('community_posts')
     .select('*', { count: 'exact' });
   
   // Step 2: 批次取得作者資料
   const authorIds = [...new Set(posts.map(p => p.author_id).filter(Boolean))];
   const { data: profiles } = await supabase
     .from('profiles')
     .select('id, name, avatar_url, role')
     .in('id', authorIds);
   
   // Step 3: 手動 merge
   const profileMap = new Map(profiles.map(p => [p.id, p]));
   const enrichedPosts = posts.map(post => ({
     ...post,
     author: profileMap.get(post.author_id) || null
   }));
   ```
4. 確保回傳格式符合 `CommunityPost` 型別定義

---

### P1-9: Converter fallback 邏輯重複（新增）

**問題位置**: `src/hooks/communityWallConverters.ts` 的 `convertApiPost`, `convertApiReview`, `convertApiQuestion`

**引導**:
```typescript
// 在檔案頂部新增共用函數
type AuthorRole = 'resident' | 'agent' | 'official';

const ROLE_LABELS: Record<AuthorRole, string> = {
  resident: '用戶',
  agent: '房仲',
  official: '官方',
};

function resolveRole(roleStr?: string): AuthorRole {
  if (roleStr === 'agent') return 'agent';
  if (roleStr === 'official') return 'official';
  return 'resident';
}

function buildFallbackAuthor(authorId?: string, role: AuthorRole = 'resident'): string {
  const label = ROLE_LABELS[role];
  if (!authorId || authorId.length < 6) return label;
  return `${label}-${authorId.slice(0, 6)}`;
}

function resolveAuthor(
  authorId?: string,
  author?: { name?: string; role?: string }
): { name: string; role: AuthorRole } {
  const role = resolveRole(author?.role);
  const name = author?.name?.trim() || buildFallbackAuthor(authorId, role);
  return { name, role };
}

// 使用範例
export function convertApiPost(post: CommunityPost): Post {
  const { name: authorName, role } = resolveAuthor(post.author_id, post.author);
  // ...
}
```

---

### P1-10: Converters 無單元測試（新增）

**問題位置**: `src/hooks/communityWallConverters.ts`

**引導**:
1. 建立 `src/hooks/__tests__/communityWallConverters.test.ts`
2. 覆蓋以下情境：

```typescript
import { describe, it, expect } from 'vitest';
import { convertApiPost, convertApiReview, convertApiQuestion } from '../communityWallConverters';

describe('convertApiPost', () => {
  const basePost = {
    id: 'test-id',
    community_id: 'comm-id',
    content: '測試內容',
    visibility: 'public' as const,
    likes_count: 0,
    liked_by: [],
    created_at: new Date().toISOString(),
  };

  it('使用 author.name 當有提供時', () => {
    const post = { ...basePost, author_id: '123456789', author: { name: '王小明', role: 'resident' } };
    expect(convertApiPost(post).author).toBe('王小明');
  });

  it('使用 fallback 當 author.name 為空時', () => {
    const post = { ...basePost, author_id: '123456789', author: { name: '', role: 'resident' } };
    expect(convertApiPost(post).author).toBe('用戶-123456');
  });

  it('使用角色標籤當 role 為 agent 時', () => {
    const post = { ...basePost, author_id: '123456789', author: { role: 'agent' } };
    expect(convertApiPost(post).author).toBe('房仲-123456');
  });

  it('只顯示角色標籤當無 author_id 時', () => {
    const post = { ...basePost, author_id: undefined, author: undefined };
    expect(convertApiPost(post).author).toBe('用戶');
  });
});

// 類似覆蓋 convertApiReview, convertApiQuestion
```

---

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
- [x] 前端 fallback 作者名稱角色感知（2025-12-06）

---

## 📈 歷史審計紀錄

### 2025-12-05 審計（P0-5 技術債）

> **審計範圍**: `api/community/wall.ts` (lines 1-170), `supabase/migrations/20251205_*.sql`  
> **審計結論**: ✅ 功能正確但存在 7 項技術債，已於 12/05 23:55 修復

| 問題 | 狀態 | 修復內容 |
|------|------|---------|
| Type Assertion 濫用 | ✅ 已修復 | 改用 Zod schema 驗證 |
| 硬編碼 FK 名稱 | ✅ 已修復 | 改為分段查詢 |
| JOIN 深度過深 | ✅ 已修復 | 採用方案 B 手動 merge |
| 缺少 JSDoc | ✅ 已修復 | 補完整註解 |
| 無單元測試 | ✅ 已修復 | 新增 vitest 測試 |
| Error Handling 不完整 | ✅ 已修復 | 新建 ReviewFetchError |
| Magic Number | ✅ 已修復 | buildReviewSelectFields() |

---

> **審計結論（2025-12-06）**: 本次前端 fallback 修復只是**治標不治本**。真正的解決方案是後端 API 需要 JOIN 用戶表回傳 `author.name`。目前新增 P0-7（後端 Posts 不回傳作者資訊）、P1-9（重複邏輯）、P1-10（無測試）三項待辦。
