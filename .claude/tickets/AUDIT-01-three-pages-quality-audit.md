# AUDIT-01: 三大頁面品質審計與優化

## 工單摘要

| 項目 | 內容 |
|------|------|
| **工單編號** | AUDIT-01 |
| **標題** | 三大頁面品質審計與優化 |
| **優先級** | P0 - Critical（含安全隱患）|
| **狀態** | 待開發 |
| **影響範圍** | UAG 儀表板、Feed 動態牆、Community Wall |
| **建立日期** | 2026-01-14 |
| **負責人** | - |

### 一句話描述

針對 UAG、Community Wall、Feed 三個核心頁面進行完整代碼審計，修復安全隱患、違規代碼、架構問題，並優化效能與測試覆蓋率。

---

## 審計總結

| 頁面 | 檔案數 | 總行數 | 問題數 | 優化建議 | 整體評分 |
|------|--------|--------|--------|----------|----------|
| **UAG** | 25+ | ~3,500 | 6 | 7 | 7.5/10 |
| **Community Wall** | 19+ | ~4,200 | 10 | 9 | 7.0/10 |
| **Feed** | 20+ | ~3,800 | 8 | 9 | 7.0/10 |

### 關鍵發現

1. **🔴 安全隱患**：私密牆發文缺少社區成員驗證 (`api/community/post.ts:77-78`)
2. **🔴 代碼規範**：API 層存在 20+ 處 console.log/warn/error（違反 CLAUDE.md）
3. **🟡 架構問題**：核心 Hooks 職責過重（useUAG 335行、useFeedData 900行）
4. **🟡 測試缺口**：核心業務邏輯缺少單元測試

---

## 施工項目總覽

| Phase | 施作項目 | 優先級 | 影響範圍 | 狀態 |
|-------|----------|--------|----------|------|
| 1 | 修復私密牆發文權限驗證 | P0 | Community Wall, Feed | ✅ 完成 (94/100) |
| 2 | 移除 API 層 console 語句 | P0 | UAG, Community Wall | ✅ 完成 |
| 3 | 拆分 useUAG.ts Hook | P1 | UAG | 待開發 |
| 4 | 拆分 useFeedData.ts Hook | P1 | Feed | 待開發 |
| 5 | 重構 Lead 類型定義 | P1 | UAG | 待開發 |
| 6 | 修復留言按讚競態條件 | P1 | Community Wall, Feed | 待開發 |
| 7 | 統一權限檢查函數 | P1 | Community Wall | 待開發 |
| 8 | QA 卡片虛擬化 | P2 | Community Wall | 待開發 |
| 9 | 統一 API 錯誤結構 | P2 | 全部 | 待開發 |
| 10 | 補充單元測試 | P3 | 全部 | 待開發 |
| 11 | 品質檢查與驗收 | - | 全部 | 待開發 |

---

## Phase 1: 修復私密牆發文權限驗證

### 1.1 問題描述

**嚴重性**：🔴 Critical - 安全隱患

**位置**：`api/community/post.ts:77-78`

```typescript
// 當前代碼（危險）
if (visibility === "private") {
  // TODO: 驗證用戶是否為該社區住戶
  // 暫時跳過，實際上線需要加驗證  ← 危險！
}
```

**風險**：任何登入用戶都能發文到任何社區的私密牆

### 1.2 修復方案

```typescript
if (visibility === "private") {
  // 驗證用戶是否為該社區成員
  const { data: membership, error: memberError } = await supabase
    .from("community_members")
    .select("role")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberError) {
    return res.status(500).json({ success: false, error: "驗證社區成員失敗" });
  }

  if (!membership) {
    return res.status(403).json({ success: false, error: "只有社區成員可以發文到私密牆" });
  }

  // 可選：只允許 resident 和 agent 發私密貼文
  const allowedRoles = ["resident", "agent", "moderator"];
  if (!allowedRoles.includes(membership.role)) {
    return res.status(403).json({ success: false, error: "權限不足" });
  }
}
```

### 1.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `api/community/post.ts` | 修改 | 新增社區成員驗證邏輯 |

### 1.4 驗收標準

- [x] 私密牆發文前驗證社區成員身份
- [x] 非成員收到 403 錯誤
- [x] 成員可正常發文
- [x] `npm run gate` 通過

### 1.5 實際交付

**修改檔案**：`api/community/post.ts`

**變更內容**：
- 第 75-108 行：新增社區成員驗證邏輯
- 查詢 `community_members` 表驗證成員身份
- 非成員返回 403 錯誤：`只有社區成員可以發文到私密牆`
- 權限不足返回 403 錯誤：`權限不足，無法發文到私密牆`
- 資料庫錯誤返回 500 錯誤：`驗證社區成員失敗`

**驗證結果**：
- `npm run gate`：✅ 通過
- 無 console 語句：✅ 確認

### 1.6 Director 審計結果（2026-01-14）

**第一次審計：78/100 ❌ FAILED**（Google 標準 < 90 為失敗）

> [Audit Failed]: 抽象函式未實際使用，handler 重複定義邏輯

**阻擋性問題：**
- `verifyCommunityMember()` 定義但未在 handler 調用（Dead Code）
- `logUnauthorizedPostAttempt()` 定義但未在 403 返回前調用
- `PRIVATE_POST_ALLOWED_ROLES` 與 handler 內 `allowedRoles` 重複定義
- 測試僅測 helper functions，未 mock Supabase 測試 handler

**修正項目：**
- [x] handler 使用 `verifyCommunityMember()` 取代 inline 查詢
- [x] handler 使用 `canPostToPrivateWall()` 取代重複的 allowedRoles
- [x] 403 返回前調用 `logUnauthorizedPostAttempt()`
- [x] 新增 handler 層級測試（mock Supabase）

### 1.7 第二次審計 + P1/P2/P3 修復（2026-01-14）

**第二次審計：94/100 ✅ PASSED**

發現的優化建議（非阻擋性）：
- P1: Type Safety - `membership.role as CommunityRole` 使用運行時驗證
- P2: CORS 安全 - 限制允許的 Origin（白名單）
- P3: Request Body 使用 Zod 驗證

**最終修復：**
- [x] P1: 新增 `VALID_COMMUNITY_ROLES` 運行時驗證
- [x] P2: 新增 `allowedOrigins` 白名單，預設只允許 localhost 和 GitHub Pages
- [x] P3: 新增 `PostRequestSchema` Zod schema，取代手動驗證
- [x] 新增 CORS 測試：允許/拒絕 origin
- [x] 新增 Zod Schema 測試：9 個測試案例
- [x] 總測試數：35 個，全部通過
- [x] `npm run gate` 通過

---

## Phase 2: 移除 API 層 console 語句

### 2.1 問題描述

**嚴重性**：🔴 High - 違反 CLAUDE.md 禁止項

**違規清單**：

#### UAG API (12 處)

| 檔案 | 行號 | 類型 | 內容 |
|------|------|------|------|
| `api/uag/send-message.ts` | 150 | error | `updateNotificationStatus error` |
| `api/uag/send-message.ts` | 174 | error | `logLineAudit error` |
| `api/uag/send-message.ts` | 264 | error | `Missing Supabase configuration` |
| `api/uag/send-message.ts` | 274 | warn | `LINE_CHANNEL_ACCESS_TOKEN not configured` |
| `api/uag/send-message.ts` | 343 | error | `fn_create_conversation error` |
| `api/uag/send-message.ts` | 362 | error | `fn_send_message error` |
| `api/uag/send-message.ts` | 379 | error | `fn_get_line_binding error` |
| `api/uag/send-message.ts` | 470 | error | `Queue upsert error` |
| `api/uag/send-message.ts` | 576 | error | `send-message handler error` |
| `api/uag/track.ts` | 118 | error | `Supabase RPC Error` |
| `api/uag/track.ts` | 143 | log | `S-Grade Lead` |
| `api/uag/track.ts` | 154 | error | `UAG Track Error` |

#### Community API (11 處)

| 檔案 | 行號 | 類型 | 內容 |
|------|------|------|------|
| `api/community/wall.ts` | 154 | error | `fetch profiles failed` |
| `api/community/wall.ts` | 160 | error | `profiles schema validation failed` |
| `api/community/wall.ts` | 431 | warn | `invalid review row` |
| `api/community/wall.ts` | 441 | warn | `fetchReviewRows failed` |
| `api/community/wall.ts` | 561 | warn | `resolveViewerContext error` |
| `api/community/wall.ts` | 596 | warn | `resolveViewerContext unexpected error` |
| `api/community/wall.ts` | 652 | warn | `Token 驗證失敗` |
| `api/community/wall.ts` | 699 | error | `API Error` |
| `api/community/wall.ts` | 797 | error | `getReviews fetchReviewsWithAgents failed` |
| `api/community/wall.ts` | 811 | error | `getReviews fetch community summary failed` |
| `api/community/wall.ts` | 938 | error | `fetchReviewsWithAgents failed` |

### 2.2 修復方案

```typescript
// 建立或使用現有的 logger 服務
import { logger } from "../lib/logger";

// ❌ 移除
console.error("[community/wall] fetch profiles failed:", error);

// ✅ 替換為
logger.error("[community/wall] fetch profiles failed", { error });

// 或直接移除（若已有 Sentry 捕獲）
```

### 2.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `api/uag/send-message.ts` | 修改 | 移除 9 處 console 語句 |
| `api/uag/track.ts` | 修改 | 移除 3 處 console 語句 |
| `api/community/wall.ts` | 修改 | 移除 11 處 console 語句 |
| `api/lib/logger.ts` | 新增（如不存在） | 建立 API 層 logger 服務 |

### 2.4 驗收標準

- [x] 所有 API 檔案無 console.log/warn/error
- [x] 使用 logger 或 Sentry 替代
- [x] `npm run gate` 通過
- [x] `grep -r "console\." api/uag/` 和 `api/community/` 返回空（除測試檔案外）

### 2.5 實際交付（2026-01-14）

**新增檔案：**
- `api/lib/logger.ts` - 統一 logger 工具，整合 Sentry

**修改檔案：**
| 檔案 | console 移除數量 | 替換方式 |
|------|-----------------|----------|
| `api/uag/send-message.ts` | 9 處 | `logger.error/warn` |
| `api/uag/track.ts` | 3 處 | `logger.error/info` |
| `api/community/wall.ts` | 11 處 | `logger.error/warn/debug` |

**Logger 特性：**
- 生產環境：只發送到 Sentry，不輸出到 stdout/stderr
- 開發環境：輸出到 stderr（不污染 stdout）
- 結構化日誌：支援 context 物件

**驗證結果：**
- API 測試：164 個通過
- `npm run gate`：✅ 通過
- `grep console. api/uag/`：僅測試檔案（允許）
- `grep console. api/community/`：無匹配

---

## Phase 3: 拆分 useUAG.ts Hook

### 3.1 問題描述

**嚴重性**：🟡 Medium - 架構問題

**位置**：`src/pages/UAG/hooks/useUAG.ts` (335 行)

**當前職責**：
- 數據獲取（React Query）
- 樂觀更新邏輯
- Realtime 訂閱管理
- Lead 購買邏輯
- 錯誤處理

### 3.2 重構方案

拆分為 3 個專注的 Hooks：

```
src/pages/UAG/hooks/
├── useUAG.ts              (保留，作為 facade)
├── useUAGData.ts          (新增，數據獲取)
├── useLeadPurchase.ts     (新增，購買邏輯)
└── useRealtimeUpdates.ts  (新增，訂閱管理)
```

#### useUAGData.ts
```typescript
export function useUAGData(agentId: string, useMock: boolean) {
  return useQuery({
    queryKey: ["uag", agentId, useMock],
    queryFn: () => fetchAppData(agentId, useMock),
    // ...配置
  });
}
```

#### useLeadPurchase.ts
```typescript
export function useLeadPurchase(
  queryClient: QueryClient,
  agentId: string,
  useMock: boolean,
) {
  return useMutation({
    mutationFn: purchaseLead,
    onMutate: async (leadId) => { /* 樂觀更新 */ },
    onSuccess: (data) => { /* 快取更新 */ },
    onError: (err, leadId, context) => { /* 回滾 */ },
  });
}
```

#### useRealtimeUpdates.ts
```typescript
export function useRealtimeUpdates(
  agentId: string,
  enabled: boolean,
  onGradeUpdate: (data: GradeUpdatePayload) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase.channel(`uag:${agentId}`);
    // 訂閱邏輯
    return () => { channel.unsubscribe(); };
  }, [agentId, enabled, onGradeUpdate]);
}
```

### 3.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/pages/UAG/hooks/useUAGData.ts` | 新增 | 數據獲取邏輯 |
| `src/pages/UAG/hooks/useLeadPurchase.ts` | 新增 | 購買邏輯 |
| `src/pages/UAG/hooks/useRealtimeUpdates.ts` | 新增 | 訂閱管理 |
| `src/pages/UAG/hooks/useUAG.ts` | 修改 | 簡化為 facade |

### 3.4 驗收標準

- [ ] 各 Hook 職責單一
- [ ] 原有功能無回歸
- [ ] `npm run gate` 通過
- [ ] 單元測試通過

---

## Phase 4: 拆分 useFeedData.ts Hook

### 4.1 問題描述

**嚴重性**：🟡 Medium - 架構問題

**位置**：`src/hooks/useFeedData.ts` (~900 行)

**當前職責**：
- API/Mock 資料切換
- 樂觀更新邏輯
- 權限過濾
- 快取管理
- Profile 獲取
- Side Bar 資料計算

### 4.2 重構方案

拆分為 4 個專注的 Hooks：

```
src/hooks/
├── useFeedData.ts              (保留，作為 facade)
├── useFeedFetch.ts             (新增，API 資料層)
├── useFeedMock.ts              (新增，Mock 資料層)
├── useFeedPermissions.ts       (新增，權限過濾)
└── useFeedOptimisticUpdates.ts (新增，樂觀更新)
```

### 4.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/hooks/useFeedFetch.ts` | 新增 | API 資料獲取 |
| `src/hooks/useFeedMock.ts` | 新增 | Mock 資料邏輯 |
| `src/hooks/useFeedPermissions.ts` | 新增 | 權限過濾 |
| `src/hooks/useFeedOptimisticUpdates.ts` | 新增 | 樂觀更新 |
| `src/hooks/useFeedData.ts` | 修改 | 簡化為 facade |

### 4.4 驗收標準

- [ ] 各 Hook 職責單一
- [ ] Mock/API 切換正常
- [ ] 原有功能無回歸
- [ ] `npm run gate` 通過

---

## Phase 5: 重構 Lead 類型定義

### 5.1 問題描述

**嚴重性**：🟡 Medium - 類型歧義

**位置**：`src/pages/UAG/types/uag.types.ts:46-52`

**問題**：Lead.id 的語義在購買前後改變
- 未購買時：`id = session_id`（如 `sess-B218-mno345`）
- 已購買時：`id = purchase UUID`（如 `57a4097a-...`）

### 5.2 重構方案

```typescript
// 基礎 Lead 類型
interface BaseLead {
  session_id: string;
  phone: string;
  grade: LeadGrade;
  property_name: string;
  community_name: string;
  remainingHours?: number;
  created_at: string;
}

// 未購買 Lead
export interface UnpurchasedLead extends BaseLead {
  status: "new";
  // 沒有 purchase_id
}

// 已購買 Lead
export interface PurchasedLead extends BaseLead {
  status: "purchased";
  purchase_id: string;  // 明確的 purchase UUID
  notification_status?: NotificationStatus;
  conversation_id?: string;
}

// 聯合類型
export type Lead = UnpurchasedLead | PurchasedLead;

// 類型守衛
export function isPurchasedLead(lead: Lead): lead is PurchasedLead {
  return lead.status === "purchased";
}
```

### 5.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/pages/UAG/types/uag.types.ts` | 修改 | 區分 Lead 類型 |
| `src/pages/UAG/hooks/useUAG.ts` | 修改 | 使用類型守衛 |
| `src/pages/UAG/services/uagService.ts` | 修改 | 轉換邏輯調整 |
| `src/pages/UAG/components/ActionPanel.tsx` | 修改 | 使用正確 ID |
| `src/components/UAG/SendMessageModal.tsx` | 修改 | 使用 purchase_id |

### 5.4 驗收標準

- [ ] Lead 類型定義清晰
- [ ] 無 ID 歧義
- [ ] TypeScript 編譯通過
- [ ] `npm run gate` 通過

---

## Phase 6: 修復留言按讚競態條件

### 6.1 問題描述

**嚴重性**：🟡 Medium - 邊界案例

**位置**：`src/hooks/useComments.ts:150-200`

```typescript
// 問題：快速連擊多個留言時
// previousComments 保存最初狀態
// 回滾會遺漏中間操作

const toggleLike = useCallback(async (commentId: string) => {
  let previousComments: FeedComment[] = [];

  setComments((prev) => {
    previousComments = prev;  // ← 閉包捕獲，可能過時
    return updatedComments;
  });

  try {
    await fetch(...);
  } catch (err) {
    setComments(previousComments);  // ← 回滾到過時狀態
  }
});
```

### 6.2 修復方案

```typescript
const toggleLike = useCallback(async (commentId: string) => {
  // 使用 functional update 確保每次都獲取最新狀態
  setComments((prev) => {
    // 樂觀更新
    return prev.map((c) => {
      if (c.id === commentId) {
        return { ...c, isLiked: !c.isLiked, likesCount: ... };
      }
      return c;
    });
  });

  try {
    const result = await fetch(...);
    // 使用伺服器值同步
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, likesCount: result.data.likes_count };
        }
        return c;
      })
    );
  } catch (err) {
    // 使用 functional update 計算回滾
    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, isLiked: !c.isLiked, likesCount: ... };
        }
        return c;
      })
    );
  }
}, []);  // 空依賴，因為使用 functional update
```

### 6.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/hooks/useComments.ts` | 修改 | 修復 toggleLike 競態 |
| `src/hooks/useFeedData.ts` | 修改 | 修復樂觀更新回滾 |

### 6.4 驗收標準

- [ ] 快速連擊不會丟失狀態
- [ ] 回滾正確恢復
- [ ] `npm run gate` 通過

---

## Phase 7: 統一權限檢查函數

### 7.1 問題描述

**嚴重性**：🟡 Low-Medium - 維護性

**問題**：權限檢查分散於多個組件
- `Wall.tsx`: `perm.canAccessPrivate`
- `PostsSection.tsx`: `perm.canPostPublic`
- `QASection.tsx`: `perm.canAnswer`

### 7.2 修復方案

```typescript
// src/pages/Community/types.ts

export type CommunityAction =
  | "view_public"
  | "view_private"
  | "post_public"
  | "post_private"
  | "like"
  | "comment"
  | "answer"
  | "ask";

export function canPerformAction(
  perm: CommunityPermissions,
  action: CommunityAction,
): boolean {
  switch (action) {
    case "view_public":
      return true;
    case "view_private":
      return perm.canAccessPrivate;
    case "post_public":
      return perm.isLoggedIn;
    case "post_private":
      return perm.canAccessPrivate && perm.role === "resident";
    case "like":
    case "comment":
      return perm.isLoggedIn;
    case "answer":
      return perm.canAnswer;
    case "ask":
      return perm.isLoggedIn;
    default:
      return false;
  }
}

export function requiresLogin(action: CommunityAction): boolean {
  const publicActions: CommunityAction[] = ["view_public"];
  return !publicActions.includes(action);
}
```

### 7.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/pages/Community/types.ts` | 修改 | 新增權限函數 |
| `src/pages/Community/Wall.tsx` | 修改 | 使用權限函數 |
| `src/pages/Community/components/PostsSection.tsx` | 修改 | 使用權限函數 |
| `src/pages/Community/components/QASection.tsx` | 修改 | 使用權限函數 |

### 7.4 驗收標準

- [ ] 權限邏輯集中管理
- [ ] 各組件使用統一函數
- [ ] `npm run gate` 通過

---

## Phase 8: QA 卡片虛擬化

### 8.1 問題描述

**嚴重性**：🟢 Low-Medium - 效能

**位置**：`src/pages/Community/components/QASection.tsx:50-100`

**問題**：
- 每個 QACard 包含模態框、焦點陷阱
- 10+ 項會有 10+ 個模態框在 DOM 中
- 首屏渲染慢，記憶體占用高

### 8.2 修復方案

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

function QASection({ questions, perm }: QASectionProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: questions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 280,  // 預估卡片高度
    overscan: 2,
  });

  return (
    <div ref={parentRef} className="qa-container">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <QACard q={questions[virtualItem.index]} perm={perm} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 8.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `package.json` | 修改 | 新增 @tanstack/react-virtual |
| `src/pages/Community/components/QASection.tsx` | 修改 | 實作虛擬化 |

### 8.4 驗收標準

- [ ] 長列表渲染流暢
- [ ] 記憶體占用降低
- [ ] `npm run gate` 通過

---

## Phase 9: 統一 API 錯誤結構

### 9.1 問題描述

**嚴重性**：🟢 Low - UX

**問題**：API 錯誤降級不清晰
- 前端無法區分「無資料」vs「載入失敗」
- 錯誤訊息洩露實現細節

### 9.2 修復方案

```typescript
// api/lib/apiResponse.ts

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  warnings?: Array<{
    code: string;
    message: string;
  }>;
}

export function successResponse<T>(data: T, warnings?: ApiResponse<T>["warnings"]) {
  return { success: true, data, warnings };
}

export function errorResponse(code: string, message: string) {
  return { success: false, error: { code, message } };
}
```

```typescript
// 使用範例
try {
  reviewResult = await fetchReviewsWithAgents(...);
} catch (err) {
  return res.status(200).json({
    success: true,
    data: { reviews: [] },
    warnings: [{ code: "REVIEWS_FETCH_FAILED", message: "評價載入失敗" }],
  });
}
```

### 9.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `api/lib/apiResponse.ts` | 新增 | 統一回應格式 |
| `api/community/wall.ts` | 修改 | 使用統一格式 |
| `api/uag/send-message.ts` | 修改 | 使用統一格式 |
| `api/uag/track.ts` | 修改 | 使用統一格式 |

### 9.4 驗收標準

- [ ] API 回應格式統一
- [ ] 前端可區分錯誤類型
- [ ] 無實現細節洩露
- [ ] `npm run gate` 通過

---

## Phase 10: 補充單元測試

### 10.1 問題描述

**嚴重性**：🟢 Low - 維護性

**缺少測試的關鍵模組**：

| 模組 | 行數 | 複雜度 | 測試狀態 |
|------|------|--------|----------|
| `useUAG.ts` | 335 | 高 | ❌ 無 |
| `useFeedData.ts` | ~900 | 極高 | ❌ 無 |
| `uagService.ts` | 698 | 高 | ❌ 無 |
| `api/community/wall.ts` | 1,160 | 極高 | ⚠️ 部分 |

### 10.2 測試計劃

#### useUAG.test.ts
```typescript
describe("useUAG", () => {
  describe("purchaseLead", () => {
    it("should update lead status to purchased");
    it("should deduct points from user");
    it("should rollback on failure");
  });

  describe("realtime updates", () => {
    it("should update lead grade on S-grade event");
  });
});
```

#### useFeedData.test.ts
```typescript
describe("useFeedData", () => {
  describe("mock mode", () => {
    it("should return mock data when useMock is true");
  });

  describe("API mode", () => {
    it("should fetch from API when useMock is false");
  });

  describe("toggleLike", () => {
    it("should update like status optimistically");
    it("should rollback on API failure");
  });
});
```

### 10.3 修改檔案

| 檔案 | 變更類型 | 說明 |
|------|----------|------|
| `src/pages/UAG/hooks/__tests__/useUAG.test.ts` | 新增 | Hook 單元測試 |
| `src/pages/UAG/services/__tests__/uagService.test.ts` | 新增 | 服務層測試 |
| `src/hooks/__tests__/useFeedData.test.ts` | 新增 | Hook 單元測試 |
| `api/community/__tests__/wall.test.ts` | 新增 | API 測試 |

### 10.4 驗收標準

- [ ] 核心 Hook 測試覆蓋率 > 70%
- [ ] 邊界案例有測試
- [ ] `npm test` 通過

---

## Phase 11: 品質檢查與驗收

### 11.1 品質關卡

```bash
npm run gate   # typecheck + lint
npm test       # 執行所有測試
```

### 11.2 代碼規範檢查

```bash
# 確認無 console 語句
grep -r "console\." api/

# 確認無 any 類型
grep -r ": any" src/

# 確認無 @ts-ignore
grep -r "@ts-ignore" src/
```

### 11.3 手動測試清單

| # | 測試案例 | 頁面 | 預期結果 |
|---|----------|------|----------|
| 1 | 非成員發私密貼文 | Community Wall | 收到 403 錯誤 |
| 2 | 成員發私密貼文 | Community Wall | 成功發文 |
| 3 | 快速連擊按讚 | Feed | 狀態正確同步 |
| 4 | 長 QA 列表滾動 | Community Wall | 無卡頓 |
| 5 | 購買 Lead | UAG | ID 正確轉換 |
| 6 | Realtime 升級 | UAG | 即時更新 |
| 7 | Mock/API 切換 | Feed | 無狀態丟失 |

### 11.4 驗收標準

- [ ] `npm run gate` 通過
- [ ] `npm test` 通過
- [ ] 所有手動測試通過
- [ ] 無 console 錯誤
- [ ] 無 TypeScript / ESLint 警告

---

## 相關檔案索引

### UAG 系統
```
src/pages/UAG/
├── index.tsx
├── hooks/
│   ├── useUAG.ts
│   ├── useUAGData.ts (新增)
│   ├── useLeadPurchase.ts (新增)
│   ├── useRealtimeUpdates.ts (新增)
│   └── useLeadSelection.ts
├── services/uagService.ts
├── types/uag.types.ts
└── components/
    ├── ActionPanel.tsx
    ├── AssetMonitor.tsx
    ├── RadarCluster.tsx
    └── ListingFeed.tsx

src/components/UAG/SendMessageModal.tsx

api/uag/
├── send-message.ts
└── track.ts
```

### Community Wall 系統
```
src/pages/Community/
├── Wall.tsx
├── types.ts
└── components/
    ├── PostsSection.tsx
    ├── ReviewsSection.tsx
    ├── QASection.tsx
    ├── Sidebar.tsx
    └── LockedOverlay.tsx

src/hooks/
├── useCommunityWallData.ts
├── useCommunityWallQuery.ts
├── useComments.ts
└── communityWallConverters.ts

api/community/
├── wall.ts
├── like.ts
├── comment.ts
├── post.ts
└── question.ts
```

### Feed 系統
```
src/pages/Feed/
├── index.tsx
├── Consumer.tsx
├── Agent.tsx
├── useConsumer.ts
└── useAgentFeed.ts

src/components/Feed/
├── FeedPostCard.tsx
├── InlineComposer.tsx
├── CommentList.tsx
└── CommentInput.tsx

src/hooks/
├── useFeedData.ts
├── useFeedFetch.ts (新增)
├── useFeedMock.ts (新增)
├── useFeedPermissions.ts (新增)
└── useFeedOptimisticUpdates.ts (新增)
```

### 共用新增
```
api/lib/
├── logger.ts (新增或修改)
└── apiResponse.ts (新增)
```

---

## 工時估算

| Phase | 項目 | 預估時間 |
|-------|------|----------|
| 1 | 私密牆發文權限驗證 | 30 分鐘 |
| 2 | 移除 API 層 console 語句 | 1 小時 |
| 3 | 拆分 useUAG.ts Hook | 2-3 小時 |
| 4 | 拆分 useFeedData.ts Hook | 3-4 小時 |
| 5 | 重構 Lead 類型定義 | 1-2 小時 |
| 6 | 修復留言按讚競態條件 | 1 小時 |
| 7 | 統一權限檢查函數 | 1 小時 |
| 8 | QA 卡片虛擬化 | 2 小時 |
| 9 | 統一 API 錯誤結構 | 1 小時 |
| 10 | 補充單元測試 | 4-6 小時 |
| 11 | 品質檢查與驗收 | 1 小時 |
| **總計** | | **18-24 小時** |

---

## 變更歷史

| 日期 | 版本 | 變更內容 | 作者 |
|------|------|----------|------|
| 2026-01-14 | 1.0 | 初始工單建立（基於三頁面深度審計） | Claude |
