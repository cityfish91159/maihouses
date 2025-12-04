# 社區牆 TODO 摘要

> **最後更新**：2025/12/04 17:15  
> **狀態**：9 / 11 完成（P0 全數關閉，剩餘 P1 × 2）  
> **嚴苛審計**：發現 6 處「文檔宣稱完成但代碼未落地或便宜行事」

---

## ✅ 已完成的缺失
- #1 Mock URL 同步
- #2 角色持久化
- #3 ErrorBoundary
- #5 QA Focus Trap
- #6 Posts Tab A11y
- #7 React Query DevTools
- #8 useCommunityWallData JSDoc
- #9 Mock 時間戳
- #11 環境變數驗證

---

## 🔧 尚未完成的缺失
- #4 Loading Skeleton a11y
- #10 Optimistic Update race

---

## 🔴 首席處長嚴苛審計 - 發現的缺失

### 審計 A：env.ts 環境驗證不完整

**現況**：`env.ts` 只驗證 `VITE_SUPABASE_URL`、`VITE_SUPABASE_ANON_KEY`，但 `VITE_API_BASE_URL` 只是 warning。

**問題**：
1. 在 PROD 若缺 `VITE_API_BASE_URL`，會 throw，但這個 throw 發生在模組載入階段，用戶只看到白屏。
2. 沒有對 URL 格式做 validation（可能傳入 `javascript:alert(1)`）。

**最佳實作**：
```typescript
// src/config/env.ts
const REQUIRED_KEYS = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'] as const;

const isValidHttpUrl = (str: string): boolean => {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

function readEnv() {
  const missing = REQUIRED_KEYS.filter((key) => !import.meta.env[key]);
  if (missing.length > 0) {
    const message = `缺少必要的環境變數：${missing.join(', ')}`;
    if (import.meta.env.PROD) {
      // 生產環境顯示友善錯誤頁面而非白屏
      document.body.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;">
          <div style="text-align:center;">
            <h1>⚠️ 系統設定錯誤</h1>
            <p>請聯繫管理員</p>
          </div>
        </div>
      `;
    }
    throw new Error(message);
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
  if (!isValidHttpUrl(supabaseUrl)) {
    throw new Error('VITE_SUPABASE_URL 必須是有效的 HTTP(S) URL');
  }

  return {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY!,
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  };
}

export const env = readEnv();
```

---

### 審計 B：QASection Focus Trap 有漏洞

**現況**：`trapFocusWithinModal` 只處理 Tab，但沒有處理以下邊界情況。

**問題**：
1. 如果 Modal 內沒有 focusable 元素（極端情況），`focusable[0]?.focus()` 不會做任何事，焦點仍然逃逸。
2. `restoreFocusRef.current?.focus()` 在 cleanup 被呼叫，但如果觸發按鈕已被移除 DOM（例如切換 Tab 後按鈕消失），會 focus 到 `null`，導致焦點跳到 `<body>`。

**最佳實作**：
```typescript
// src/pages/Community/components/QASection.tsx

// 在 useEffect cleanup 時，確保還原焦點到合法元素
useEffect(() => {
  // ... existing code ...

  return () => {
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('focusin', ensureFocusStaysInside);

    // 確保還原焦點到仍存在於 DOM 的元素
    const target = restoreFocusRef.current;
    if (target && document.body.contains(target)) {
      target.focus();
    } else {
      // Fallback: focus 到主要內容區
      const main = document.querySelector('main');
      if (main instanceof HTMLElement) {
        main.focus();
      }
    }
    restoreFocusRef.current = null;
  };
}, [askModalOpen, answerModalOpen, submitting]);
```

---

### 審計 C：PostsSection Tab 鍵盤導覽缺 Home/End 完整處理

**現況**：`handleTabKeyDown` 有處理 Home/End，但 End 只在 `perm.canAccessPrivate` 時才跳到 private。

**問題**：如果用戶沒有私密牆權限，按 End 應該跳到最後一個可用的 Tab（也就是 public），但現在什麼都不做。

**最佳實作**：
```typescript
// src/pages/Community/components/PostsSection.tsx

const handleTabKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>, current: WallTab) => {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
    return;
  }
  event.preventDefault();

  const lastAvailableTab = activeTabs[activeTabs.length - 1];

  if (event.key === 'Home') {
    focusTab('public');
    if (currentTab !== 'public') {
      onTabChange('public');
    }
    return;
  }

  if (event.key === 'End') {
    // 無論權限如何，跳到最後一個可用 Tab
    if (lastAvailableTab && lastAvailableTab !== currentTab) {
      focusTab(lastAvailableTab);
      onTabChange(lastAvailableTab);
    } else if (lastAvailableTab) {
      focusTab(lastAvailableTab);
    }
    return;
  }

  // ... rest of arrow handling
}, [activeTabs, currentTab, focusTab, onTabChange]);
```

---

### 審計 D：WallErrorBoundary 缺少 error.cause 處理

**現況**：`categorizeError` 只檢查 `error.message`。

**問題**：現代 JS 錯誤可能有 `error.cause`（ES2022），若原始錯誤被包裝，message 可能不包含 '401' 但 cause 有。

**最佳實作**：
```typescript
// src/pages/Community/components/WallErrorBoundary.tsx

const getErrorMessage = (error: Error): string => {
  const messages: string[] = [error.message];
  if (error.cause instanceof Error) {
    messages.push(error.cause.message);
  }
  return messages.join(' ').toLowerCase();
};

const categorizeError = (error: Error): CategorizedError => {
  const message = getErrorMessage(error);
  // ... rest of categorization
};
```

---

### 審計 E：useCommunityWallData 的 toggleLike 沒有實作 Optimistic Update

**現況**：Hook 有 `toggleLike`，但內部只是呼叫 API，沒有先更新 UI 再等 API 回應。

**問題**：用戶按讚後要等 API 回應才看到 UI 變化，體驗差。這正是 #10 的問題，但 TODO 只說「待做」，沒有給完整代碼。

**最佳實作**：
```typescript
// src/hooks/useCommunityWallData.ts

const toggleLike = useCallback(async (postId: string | number) => {
  const id = String(postId);

  // Optimistic Update: 先更新 UI
  const previousData = { ...mockData };
  const updateLike = (posts: Post[]) =>
    posts.map((p) =>
      String(p.id) === id
        ? { ...p, likes: (p.likes ?? 0) + (p.liked ? -1 : 1), liked: !p.liked }
        : p
    );

  setMockData((prev) => ({
    ...prev,
    posts: {
      ...prev.posts,
      public: updateLike(prev.posts.public),
      private: updateLike(prev.posts.private),
    },
  }));

  try {
    if (!useMock) {
      await communityService.likePost(communityId!, id);
    }
  } catch (error) {
    // Rollback on failure
    setMockData(previousData);
    throw error;
  }
}, [communityId, mockData, useMock]);
```

---

### 審計 F：PostSkeleton 的 aria-hidden 與 WallSkeleton 的 role 衝突

**現況**：
- `PostSkeleton` 設 `aria-hidden="true"`
- `WallSkeleton` 設 `role="status"` 並包含 `<PostSkeleton />`

**問題**：`WallSkeleton` 宣告自己是 live region (`role="status"`)，但子元素被隱藏 (`aria-hidden`)，螢幕閱讀器行為不一致。

**最佳實作**：
```tsx
// src/pages/Community/components/PostSkeleton.tsx

// PostSkeleton 不應該自己設 aria-hidden，讓父層決定
export function PostSkeleton() {
  return (
    <div className="flex gap-2.5 rounded-[14px] border border-border-light bg-white p-3 animate-pulse">
      {/* ... existing skeleton content ... */}
    </div>
  );
}

// WallSkeleton 統一設定 a11y
export function WallSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="社區牆載入中"
      className="flex flex-col gap-3"
    >
      <span className="sr-only">正在載入社區牆內容，請稍候...</span>
      {/* 內部骨架不需要額外 aria-hidden */}
      <div className="overflow-hidden rounded-[18px] border border-border-light bg-white/98 p-4">
        {/* ... */}
      </div>
    </div>
  );
}
```

---

## 🔍 驗證紀錄
```
npm run typecheck
npm run test
npm run build
```

> 更完整的修復細節請見 `docs/COMMUNITY_WALL_DEV_LOG.md`
