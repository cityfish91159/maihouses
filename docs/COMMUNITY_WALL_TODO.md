# 社區牆 - 審計報告與待辦清單

> **最後更新**: 2025-12-06 21:00  
> **審計者**: Google 首席前後端處長

---

## 📌 摘要

### 要做什麼
讓社區牆 API 模式顯示真實作者名稱，而非「匿名」或 fallback。

### 做了什麼
| 日期 | 項目 | 狀態 |
|------|------|------|
| 12/06 | 前端 fallback 顯示 `用戶-xxxxxx` 取代「匿名」 | ✅ 已部署 |
| 12/06 | 型別補充 `author.role` 新增 `official` | ✅ 已部署 |

### 什麼沒做好
| # | 缺失 | 嚴重性 |
|---|------|--------|
| 1 | **後端沒改** — API 仍只回傳 `author_id`，沒 JOIN 用戶表 | 🔴 致命 |
| 2 | **前端只是貼OK繃** — fallback 是暫時方案 | 🟠 中等 |
| 3 | **無測試** — converter fallback 邏輯無覆蓋 | 🟠 中等 |
| 4 | **重複代碼** — 三個 converter 有相同邏輯未抽取 | 🟡 輕微 |

### 再來要做
| 優先級 | 項目 | 負責 |
|--------|------|------|
| 🔴 P0 | 後端 `getPosts`/`getAll` JOIN 用戶表回傳 `author.name` | 後端 |
| 🟠 P1 | 抽取 `resolveAuthorDisplay()` 共用函數 | 前端 |
| 🟠 P1 | 補 converters 單元測試 | 前端 |

---

## 📊 待辦總覽

### 🔴 P0 - 阻塞上線（立即處理）

| # | 問題 | 位置 | 狀態 |
|---|------|------|------|
| P0-1 | Vercel 環境變數未設定 | Vercel Dashboard | ⏳ 待人工 |
| P0-6 | API 回傳 `PGRST200` 錯誤 | Supabase FK | ⏳ 待人工 |
| **P0-7** | **後端 Posts 不回傳作者資訊** | `api/community/wall.ts` | ❌ 未修復 |

### 🟠 P1 - 本週內

| # | 問題 | 位置 |
|---|------|------|
| **P1-9** | **Converter fallback 邏輯重複** | `communityWallConverters.ts` |
| **P1-10** | **Converters 無單元測試** | 缺少測試檔 |
| P1-1 | `mockFallback` 偷補假資料 | `communityWallConverters.ts:111` |
| P1-3 | 樂觀更新後立即 invalidate | `useCommunityWallQuery.ts:166` |
| P1-4 | 按讚沒有 debounce | `PostsSection.tsx:46` |

### 🟡 P2 - 兩週內

| # | 問題 |
|---|------|
| P2-1 | 類型定義散落 4 處 |
| P2-5 | `useGuestVisibleItems` 無測試 |

### ⏳ 待人工操作

| # | 項目 | 動作 |
|---|------|------|
| DB-1 | community_members 表 | 執行 `20251205_community_members.sql` |
| DB-2 | Agent stats 欄位 | 執行 `20251205_add_agent_stats_columns.sql` |
| API-1 | FK 遺失 | Supabase 建立 `community_reviews_property_id_fkey` |

---

## 🔍 審計詳情（2025-12-06）

### 🚨 問題 1: 只改前端不改後端 = 治標不治本

**現況**:
```typescript
// API 回傳（沒有 author 物件）
{ author_id: "7865f1ae-...", content: "..." }

// 前端只能用 fallback
const authorName = post.author?.name?.trim() || \`用戶-\${post.author_id.slice(0,6)}\`;
```

**問題**: 後端 `.select('*')` 沒有 JOIN 用戶表，前端永遠拿不到真實姓名。

**引導**:
```typescript
// api/community/wall.ts - getPosts 函數
// 方案 A: PostgREST nested select（若有 FK）
.select(\`
  *,
  author:profiles(id, name, avatar_url, role)
\`, { count: 'exact' })

// 方案 B: 分段查詢（若無 FK）
const posts = await supabase.from('community_posts').select('*');
const authorIds = [...new Set(posts.map(p => p.author_id))];
const profiles = await supabase.from('profiles').select('*').in('id', authorIds);
const profileMap = new Map(profiles.map(p => [p.id, p]));
return posts.map(p => ({ ...p, author: profileMap.get(p.author_id) }));
```

---

### 🚨 問題 2: 重複邏輯 = 維護地獄

**現況**: 三處幾乎相同的 fallback 邏輯
```typescript
// convertApiPost
const role = post.author?.role === 'agent' ? 'agent' : ...;
const fallbackLabel = role === 'agent' ? '房仲' : '用戶';
const fallbackAuthor = \`\${fallbackLabel}-\${post.author_id.slice(0,6)}\`;

// convertApiQuestion (answers) - 重複！
const type = answer.author?.role === 'agent' ? 'agent' : ...;
const fallbackLabel = type === 'agent' ? '房仲' : '用戶';
const fallbackAuthor = \`\${fallbackLabel}-\${answer.author_id.slice(0,6)}\`;
```

**引導**: 抽取共用函數
```typescript
const ROLE_LABELS = { resident: '用戶', agent: '房仲', official: '官方' };

function resolveAuthorDisplay(authorId?: string, author?: { name?: string; role?: string }) {
  const role = author?.role === 'agent' ? 'agent' : author?.role === 'official' ? 'official' : 'resident';
  const fallback = authorId ? \`\${ROLE_LABELS[role]}-\${authorId.slice(0,6)}\` : ROLE_LABELS[role];
  return { name: author?.name?.trim() || fallback, role };
}
```

---

### 🚨 問題 3: 無測試 = 下次重構必出事

**現況**: `convertApiPost` / `convertApiReview` / `convertApiQuestion` 的 fallback 邏輯無測試。

**引導**: 建立 `src/hooks/__tests__/communityWallConverters.test.ts`
```typescript
describe('convertApiPost', () => {
  it('有 name 時使用 name', () => {
    const post = { author_id: '123456789', author: { name: '王小明' }, ... };
    expect(convertApiPost(post).author).toBe('王小明');
  });
  
  it('無 name 時使用 fallback', () => {
    const post = { author_id: '123456789', author: { name: '' }, ... };
    expect(convertApiPost(post).author).toBe('用戶-123456');
  });
  
  it('agent 角色顯示房仲', () => {
    const post = { author_id: '123456789', author: { role: 'agent' }, ... };
    expect(convertApiPost(post).author).toBe('房仲-123456');
  });
});
```

---

### ⚠️ 問題 4: `member` role 被忽略

**現況**: 型別定義有 `member`，但 converter 沒處理，會被當成 `resident`。

**引導**: 明確處理或移除 `member` 型別。

---

### ⚠️ 問題 5: `author_id.slice(0,6)` 假設 ID 格式

**現況**: 假設 ID 是 UUID，直接取前 6 碼。

**引導**: 加防禦
```typescript
const idSuffix = authorId?.length >= 6 ? authorId.slice(0,6) : authorId ?? '';
```

---

## ✅ 已完成

- [x] 前端 fallback 作者名稱角色感知（2025-12-06）
- [x] 型別補充 `official` role（2025-12-06）
- [x] P0-5 agent stats JOIN（2025-12-05）
- [x] `/api/log-error` 端點（2025-12-05）

---

## 📝 歷史審計

### 2025-12-05: P0-5 技術債
| 問題 | 狀態 |
|------|------|
| Type Assertion 濫用 | ✅ 改用 Zod |
| 硬編碼 FK 名稱 | ✅ 改分段查詢 |
| 無單元測試 | ✅ 新增 vitest |

---

> **審計結論**: 本次修復只是前端貼 OK 繃，**根本問題是後端沒 JOIN 用戶表**。P0-7 必須優先處理，否則永遠只能顯示 fallback。
