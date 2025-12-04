# 社區牆 TODO - 待優化事項

> **更新日期**：2025/12/05  
> **原則**：簡單、有效、不過度設計  
> **說明**：以下為審計意見 + 我的優化建議，包含完整代碼範例

---

## 🔴 P0-1：React Query queryKey 缺少 includePrivate

### 問題
切換角色（guest → resident）時，私密牆資料可能不更新。因為 `queryKey` 只有 `communityId`，沒有 `includePrivate`，React Query 認為是同一個 query，不會重新抓資料。

### 建議修改：`src/hooks/useCommunityWallQuery.ts`

```ts
// 修改前
export const communityWallKeys = {
  all: ['communityWall'] as const,
  wall: (communityId: string) => [...communityWallKeys.all, 'wall', communityId] as const,
};

// 修改後
export const communityWallKeys = {
  all: ['communityWall'] as const,
  wall: (communityId: string, includePrivate: boolean) => 
    [...communityWallKeys.all, 'wall', communityId, includePrivate] as const,
};

// useQuery 呼叫改為
queryKey: communityWallKeys.wall(communityId || '', includePrivate),
```

**狀態（2025/12/05）**：已調整 query key，並以 `npx vitest run src/hooks/__tests__/useCommunityWallQuery.test.tsx` 驗證快取與 mutation 流程正常。

---

## 🔴 P0-2：LockedOverlay CTA 按鈕沒反應

### 問題
「解鎖查看更多」按鈕點了沒反應，使用者以為壞掉。三個 Section 都沒傳 `onUnlock`。

### 建議修改

**1. `src/pages/Community/Wall.tsx` 新增 handler：**

```tsx
const navigate = useNavigate();

const handleUnlock = useCallback(() => {
  navigate('/auth');
}, [navigate]);
```

**2. 傳給各 Section：**

```tsx
<ReviewsSection role={role} reviews={reviews} onUnlock={handleUnlock} />
<PostsSection ... onUnlock={handleUnlock} />
<QASection ... onUnlock={handleUnlock} />
```

**3. 各 Section 傳給 LockedOverlay：**

```tsx
// ReviewsSection.tsx
<LockedOverlay onUnlock={onUnlock} ... />
```

**狀態（2025/12/05）**：`Wall.tsx` 提供 `handleUnlock → navigate('/auth')`，三個 Section 均傳遞 `onUnlock`，LockedOverlay CTA 現在可導向登入流程。

---

## 🔴 P0-3：QA 問答只有 UI 沒串 API

### 問題
「我要發問」「我來回答」按鈕沒呼叫 `askQuestion` / `answerQuestion`，資料不會送到後端。

### 現況
`Wall.tsx` 已經有 `handleAskQuestion` 和 `handleAnswerQuestion`，也已傳給 `QASection`。  
需確認 `QASection` 內部是否有正確呼叫。

### 建議檢查：`src/pages/Community/components/QASection.tsx`

```tsx
// 發問 Modal 確認送出時
const handleAskSubmit = async () => {
  if (!askInput.trim()) return;
  setSubmitting('ask');
  try {
    await onAskQuestion?.(askInput);
    setAskInput('');
    setAskModalOpen(false);
    setFeedback('✅ 問題已送出！');
  } catch (e) {
    setAskError('送出失敗，請稍後再試');
  } finally {
    setSubmitting(null);
  }
};

// 回答 Modal 確認送出時
const handleAnswerSubmit = async () => {
  if (!answerInput.trim() || !activeQuestion) return;
  setSubmitting('answer');
  try {
    await onAnswerQuestion?.(String(activeQuestion.id), answerInput);
    setAnswerInput('');
    setAnswerModalOpen(false);
    setFeedback('✅ 回答已送出！');
  } catch (e) {
    setAnswerError('送出失敗，請稍後再試');
  } finally {
    setSubmitting(null);
  }
};
```

**狀態（2025/12/05）**：`QASection` 內部已呼叫對應 callback；`Wall.tsx` 重新包裝 `handleAskQuestion` / `handleAnswerQuestion`，失敗時會 alert 並 rethrow 供 UI 顯示錯誤。

---

## 🔴 P0-4：路由缺 ID 沒錯誤處理

### 問題
`/community/wall` 沒帶 `:id` 時只顯示空白「載入中...」，開發者不易發現問題。

### 建議修改：`src/pages/Community/Wall.tsx`

```tsx
export default function Wall() {
  const { id } = useParams<{ id: string }>();
  
  // 加在最前面
  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-2">🏠</div>
          <div className="text-ink-600">找不到社區，請確認網址是否正確</div>
        </div>
      </div>
    );
  }
  
  // ... 其餘邏輯
}
```

**狀態（2025/12/05）**：新增缺少 ID 的早退畫面（含返回首頁 CTA），避免載入空白頁。

---

## 🟠 P1-1：型別定義重複

### 問題
`types.ts` 和 `useCommunityWallData.ts` 各有一份 `Post/Review/Question` interface，維護時容易漏改。

### 建議
統一從 `src/pages/Community/types.ts` export，Hook 改為 import：

```ts
// useCommunityWallData.ts
import type { Post, Review, Question, CommunityInfo } from '../pages/Community/types';
```

**已完成**：根據 DEV_LOG，第四階段已處理。

---

## 🟠 P1-2：Mock 資料重複

### 問題
`mockData.ts` 和 `useCommunityWallData.ts` 各有一份 MOCK_DATA。

### 建議
只保留 `mockData.ts`，Hook 改為 import：

```ts
// useCommunityWallData.ts
import { MOCK_DATA } from '../pages/Community/mockData';
```

**已完成**：根據 DEV_LOG，已處理。

---

## 🟠 P1-3：側邊欄熱門貼文排序

### 問題
只看 `likes`，房仲物件（高 `views`）排不到前面。

### 建議修改：`src/pages/Community/components/Sidebar.tsx`

```tsx
// 修改前
const hotPosts = [...posts].sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 2);

// 修改後：加權分數
const hotPosts = [...posts].sort((a, b) => {
  const scoreA = (a.likes || 0) * 1 + (a.views || 0) * 0.1;
  const scoreB = (b.likes || 0) * 1 + (b.views || 0) * 0.1;
  return scoreB - scoreA;
}).slice(0, 2);
```

**狀態（2025/12/05）**：已套用加權分數，物件貼文（高瀏覽）可進入熱門區塊。

---

## 🟡 P2-1：LockedOverlay 文案優化

### 問題
各區塊 benefits 都一樣，不夠貼近語境。

### 建議

**評價區：**
```tsx
<LockedOverlay 
  benefits={['看完所有鄰居真實評價', '社區有新評論時通知你']}
/>
```

**貼文區：**
```tsx
<LockedOverlay 
  benefits={['看到更多鄰居的生活日常', '有新團購/公告時通知你']}
/>
```

**問答區：**
```tsx
<LockedOverlay 
  benefits={['追蹤這題的最新回答', '看更多準住戶關心的問題']}
/>
```

**狀態（2025/12/05）**：三個 Section 的 benefits 已依語境客製化。

---

## 🟡 P2-2：按讚/發文 UI 回饋

### 問題
API 模式下按讚/發文沒有 loading 狀態或錯誤提示。

### 建議修改：`src/pages/Community/Wall.tsx`

```tsx
const handleLike = useCallback(async (postId: number | string) => {
  try {
    await toggleLike(postId);
  } catch (err) {
    alert('按讚失敗，請稍後再試');
  }
}, [toggleLike]);

const handleCreatePost = useCallback(async (content: string, visibility: 'public' | 'private' = 'public') => {
  try {
    await createPost(content, visibility);
  } catch (err) {
    alert('發文失敗，請稍後再試');
  }
}, [createPost]);
```

**狀態（2025/12/05）**：`handleLike`、`handleCreatePost`、`handleAskQuestion`、`handleAnswerQuestion` 全數加入 try/catch 與錯誤提示。

---

## 🟡 P2-3：前後端權限矩陣對齊

### 問題
前端 `getPermissions(role)` 有完整矩陣，但後端 RLS 是否對齊不確定。

### 建議
建立 `docs/community_wall_permission.md` 作為前後端共用 spec，確保 Supabase RLS 與前端 `getPermissions` 邏輯一致。

---

## ✅ 已完成

- [x] toggleLike 按讚邏輯修復（likedPosts Set 追蹤）
- [x] Mock 狀態持久化（localStorage）
- [x] Converter 單元測試
- [x] API 模式單元測試
- [x] Loading Skeleton
- [x] ErrorBoundary
- [x] 型別定義統一
- [x] Mock 資料統一來源
- [x] 2025/12/05：P0 & P1 fix（queryKey、缺 ID 錯誤處理、LockedOverlay CTA、QA 串接驗證、Sidebar 排序、LockedOverlay 文案、操作錯誤提示）
- [x] 2025/12/05：測試/驗證 — `npx tsc --noEmit`、`npx vitest run src/hooks/__tests__/useCommunityWallQuery.test.tsx`、`npm run build`
