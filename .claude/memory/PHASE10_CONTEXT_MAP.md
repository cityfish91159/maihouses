# Phase 10: Context Mastery - 檔案依賴地圖

## 📊 檔案大小分析

| 檔案                                        | 行數 | Token 估算 | 測試數          | 複雜度          |
| ------------------------------------------- | ---- | ---------- | --------------- | --------------- |
| `src/pages/UAG/hooks/useUAG.ts`             | 103  | ~400       | 15+             | **低** (facade) |
| `src/pages/UAG/hooks/useUAGData.ts`         | 134  | ~600       | (包含於 useUAG) | 中              |
| `src/pages/UAG/hooks/useLeadPurchase.ts`    | 323  | ~1400      | (包含於 useUAG) | 高              |
| `src/pages/UAG/hooks/useRealtimeUpdates.ts` | 119  | ~500       | (包含於 useUAG) | 中              |
| `src/pages/UAG/services/uagService.ts`      | 720  | ~3200      | 20+             | **極高**        |
| `src/hooks/useFeedData.ts`                  | 809  | ~3600      | 30+             | **極高**        |
| `api/community/wall.ts`                     | 1070 | ~5000      | 25+             | **極高**        |

**總計**: 3,278 行代碼 → 預估 90+ 測試案例

---

## 🔗 依賴關係圖

### 1. useUAG.ts (Facade Hook)

```
useUAG.ts (103 行)
  │
  ├── useUAGData.ts (134 行)
  │   ├── @tanstack/react-query (useQuery, useQueryClient)
  │   ├── UAGService.fetchAppData()
  │   ├── MOCK_DB
  │   ├── useAuth() → session.user.id
  │   ├── useUAGModeStore (zustand) → useMock, setUseMock
  │   └── notify
  │
  ├── useLeadPurchase.ts (323 行)
  │   ├── @tanstack/react-query (useMutation, useQueryClient)
  │   ├── UAGService.purchaseLead()
  │   ├── validateQuota() → utils/validation.ts
  │   ├── isUnpurchasedLead() → types/uag.types.ts
  │   ├── GRADE_PROTECTION_HOURS → uag-config.ts
  │   └── notify
  │
  └── useRealtimeUpdates.ts (119 行)
      ├── supabase.channel()
      ├── logger
      └── notify
```

### 2. uagService.ts (720 行)

```
uagService.ts
  │
  ├── supabase client
  ├── types/uag.types.ts (所有 Zod Schemas)
  ├── mockData.ts (MOCK_DB)
  ├── logger
  └── 無外部 service 依賴
```

### 3. useFeedData.ts (809 行)

```
useFeedData.ts
  │
  ├── @tanstack/react-query
  ├── supabase client
  ├── types/comment.ts
  ├── types/feed.ts (推測)
  ├── useAuth()
  ├── logger
  └── notify

(需要讀取此檔案以確認完整依賴)
```

### 4. api/community/wall.ts (1070 行)

```
api/community/wall.ts
  │
  ├── api/lib/apiResponse.ts (successResponse, errorResponse)
  ├── supabase (server-side)
  ├── NextApiRequest/Response
  └── 複雜業務邏輯 (GET posts, permissions, RLS, 資料整合)
```

---

## ✅ Context Mastery 策略

### 優先順序規劃

**原則**: 從最小模組開始,建立測試模式與 Mock 基礎設施

#### 第一優先: useUAG.ts (Facade)

- **原因**: 僅 103 行,整合 3 個子 hooks,最簡單
- **策略**: 使用 shallow integration testing
- **Mock 對象**: useUAGData, useLeadPurchase, useRealtimeUpdates 全部 mock
- **測試重點**:
  - 正確整合 3 個子 hooks
  - 返回值正確映射
  - 無複雜業務邏輯

#### 第二優先: uagService.ts (API Layer)

- **原因**: 無 React 依賴,單純 TypeScript service
- **策略**: 使用 Supabase mock + 單元測試
- **Mock 對象**: supabase client
- **測試重點**:
  - API 呼叫正確性
  - 錯誤處理
  - Zod Schema 驗證
  - Realtime 訂閱管理

#### 第三優先: api/community/wall.ts (Vercel Function)

- **原因**: 後端 API,獨立於前端
- **策略**: 使用 node-mocks-http
- **Mock 對象**: supabase, NextApiRequest/Response
- **測試重點**:
  - GET 請求處理
  - 權限檢查
  - 錯誤處理 (unified errorResponse)
  - 資料整合與部分失敗

#### 第四優先: useFeedData.ts (最大模組)

- **原因**: 809 行,最複雜,預估 30+ 測試
- **策略**: 需要讀取後確認完整依賴
- **延遲原因**: 前面 3 個模組建立測試基礎設施後,再處理此最複雜模組

---

## 📋 必讀檔案清單

### Phase 1: useUAG.ts 測試

**必讀** (✅ 已讀):

- [x] `src/pages/UAG/hooks/useUAG.ts` (103 行)
- [x] `src/pages/UAG/hooks/useUAGData.ts` (134 行)
- [x] `src/pages/UAG/hooks/useLeadPurchase.ts` (323 行)
- [x] `src/pages/UAG/hooks/useRealtimeUpdates.ts` (119 行)
- [x] `src/pages/UAG/types/uag.types.ts` (273 行)

**待讀** (為撰寫測試提供參考):

- [ ] `src/hooks/useAuth.ts` - 了解 session 結構
- [ ] `src/stores/uagModeStore.ts` - 了解 zustand store 結構
- [ ] `src/lib/notify.ts` - 了解 notify API
- [ ] `src/pages/UAG/mockData.ts` - 了解 MOCK_DB 結構
- [ ] `src/pages/UAG/utils/validation.ts` - 了解 validateQuota 邏輯

**預估 Token 使用**: ~3000 tokens (Phase 1)

### Phase 2: uagService.ts 測試

**必讀**:

- [ ] `src/pages/UAG/services/uagService.ts` (720 行) - **主要測試目標**
- [ ] `src/lib/supabase.ts` - 了解 client 初始化
- [ ] `src/lib/logger.ts` - 了解 logger API

**預估 Token 使用**: ~4000 tokens (Phase 2)

### Phase 3: api/community/wall.ts 測試

**必讀**:

- [ ] `api/community/wall.ts` (1070 行) - **主要測試目標**
- [x] `api/lib/apiResponse.ts` (220 行) - **已讀** (Phase 9)
- [ ] Supabase RLS policies (如果有文檔)

**預估 Token 使用**: ~6000 tokens (Phase 3)

### Phase 4: useFeedData.ts 測試

**必讀** (延遲到 Phase 4):

- [ ] `src/hooks/useFeedData.ts` (809 行) - **主要測試目標**
- [ ] `src/types/comment.ts`
- [ ] `src/types/feed.ts` (如果存在)

**預估 Token 使用**: ~5000 tokens (Phase 4)

---

## 🛠️ Mock 基礎設施規劃

### 共用 Mock Setup

**檔案**: `src/setupTests.ts` (應該已存在)

```typescript
// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
    },
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
}));

// Mock React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Mock notify
vi.mock('@/lib/notify', () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));
```

### Hook 測試專用 Wrapper

```typescript
// src/__tests__/utils/testWrappers.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 📐 測試架構決策

### useUAG.ts 測試方式

**方式 1: Shallow Integration** (✅ 推薦)

- Mock 所有 3 個子 hooks
- 測試 facade 層的整合邏輯
- 優點: 快速,隔離性好
- 缺點: 未測試子 hooks 實際行為

**方式 2: Deep Integration**

- 實際載入 useUAGData, useLeadPurchase, useRealtimeUpdates
- Mock 底層依賴 (Supabase, notify, etc.)
- 優點: 更接近真實使用情境
- 缺點: 複雜度高,測試脆弱

**決策**: 使用 **Shallow Integration** (方式 1)

- useUAG 本身是 facade,無業務邏輯
- 子 hooks 應該有自己的測試 (如果需要)
- 此次 Phase 10 重點在 service 層與 API 層

---

## 🎯 Token 優化目標

**目標**: 保持 Token 使用 <150,000 (留 25% 緩衝)

**策略**:

1. **分階段讀取**: 不要一次讀取所有 4 個測試目標
2. **最小讀取集合**: 僅讀取直接依賴,不讀取間接依賴
3. **使用 Grep 搜尋**: 確認 import 位置,不盲目讀取
4. **重用 Phase 9 知識**: apiResponse.ts 已讀過,不重複讀取

---

**建立時間**: 2026-01-16
**下一步**: 讀取 useAuth, uagModeStore, notify, validation 等依賴,然後開始撰寫 useUAG.ts 測試
