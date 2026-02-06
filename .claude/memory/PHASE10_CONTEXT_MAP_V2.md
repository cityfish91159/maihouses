# Phase 10: Context Mastery - 檔案依賴地圖 V2

> **建立時間**: 2026-01-16
> **使用 Skills**: context_mastery, read-before-edit

## 📊 檔案大小分析

| 模組               | 路徑                                   | 行數 | Token 估算 | 複雜度      | 優先級    |
| ------------------ | -------------------------------------- | ---- | ---------- | ----------- | --------- |
| **useUAG.ts**      | `src/pages/UAG/hooks/useUAG.ts`        | 103  | ~400       | 低 (facade) | P1 ⭐⭐⭐ |
| **uagService.ts**  | `src/pages/UAG/services/uagService.ts` | 720  | ~3200      | 極高        | P2 ⭐⭐   |
| **useFeedData.ts** | `src/hooks/useFeedData.ts`             | 809  | ~3600      | 極高        | P3 ⭐     |
| **wall.ts**        | `api/community/wall.ts`                | 1070 | ~5000      | 極高        | P4 ⭐     |

**總計**: 2,702 行代碼

---

## 🔗 依賴關係圖

### 1. useUAG.ts (Facade Pattern - 最簡單)

```
useUAG.ts (103 行)
  │
  ├── useUAGData.ts          (子 hook 1)
  ├── useLeadPurchase.ts     (子 hook 2)
  ├── useRealtimeUpdates.ts  (子 hook 3)
  └── types/uag.types.ts     (類型定義)
```

**測試策略**: **Shallow Integration Testing**

- Mock 所有 3 個子 hooks
- 測試 facade 層的整合邏輯
- 驗證返回值正確映射

**預估測試案例**: 15+

---

### 2. uagService.ts (Service Layer - 複雜)

```
uagService.ts (720 行)
  │
  ├── supabase client
  ├── types/uag.types.ts (Zod Schemas)
  ├── mockData.ts (MOCK_DB)
  └── logger
```

**測試策略**: **Unit Testing with Supabase Mock**

- Mock Supabase client
- 測試 API 呼叫正確性
- 測試錯誤處理和 Zod 驗證

**預估測試案例**: 20+

---

### 3. useFeedData.ts (Hook - 極大)

```
useFeedData.ts (809 行)
  │
  ├── @tanstack/react-query
  ├── supabase client
  ├── types/comment.ts
  ├── useAuth()
  ├── logger
  └── notify
```

**測試策略**: **Integration Testing**

- Mock React Query + Supabase
- 測試 Mock/Live 模式切換
- 測試 Optimistic Updates

**預估測試案例**: 30+

---

### 4. api/community/wall.ts (Backend API - 最複雜)

```
wall.ts (1070 行)
  │
  ├── api/lib/apiResponse.ts
  ├── supabase (server-side)
  ├── NextApiRequest/Response
  └── 複雜業務邏輯 (RLS, 資料整合)
```

**測試策略**: **API Integration Testing**

- Mock NextApiRequest/Response
- Mock Supabase server client
- 測試權限檢查和錯誤處理

**預估測試案例**: 25+

---

## 📋 必讀檔案清單（最小集合）

### Phase 1: useUAG.ts 測試

**必讀**:

- [x] `src/pages/UAG/hooks/useUAG.ts` (103 行)
- [ ] `src/pages/UAG/hooks/useUAGData.ts` (134 行) - 了解子 hook 1
- [ ] `src/pages/UAG/hooks/useLeadPurchase.ts` (323 行) - 了解子 hook 2
- [ ] `src/pages/UAG/hooks/useRealtimeUpdates.ts` (119 行) - 了解子 hook 3
- [ ] `src/pages/UAG/types/uag.types.ts` (273 行) - 了解類型定義

**可選** (為撰寫 mock 提供參考):

- [ ] `src/lib/notify.ts` - notify API
- [ ] `src/hooks/useAuth.ts` - session 結構
- [ ] `src/stores/uagModeStore.ts` - zustand store

**Token 預算**: ~1500 tokens

---

### Phase 2: uagService.ts 測試

**必讀**:

- [ ] `src/pages/UAG/services/uagService.ts` (720 行) - 主要測試目標
- [ ] `src/lib/supabase.ts` - client 初始化
- [ ] `src/lib/logger.ts` - logger API
- [ ] `src/pages/UAG/mockData.ts` - MOCK_DB 結構

**Token 預算**: ~3500 tokens

---

### Phase 3: useFeedData.ts 測試

**必讀**:

- [ ] `src/hooks/useFeedData.ts` (809 行) - 主要測試目標
- [ ] `src/types/comment.ts` - 留言類型定義
- [ ] `src/hooks/useAuth.ts` - auth hook

**Token 預算**: ~4000 tokens

---

### Phase 4: api/community/wall.ts 測試

**必讀**:

- [ ] `api/community/wall.ts` (1070 行) - 主要測試目標
- [ ] `api/lib/apiResponse.ts` (220 行) - 已讀 (Phase 9)

**Token 預算**: ~5500 tokens

---

## 🎯 Token 優化策略

### 原則

1. **分階段讀取** - 不要一次讀取所有 4 個測試目標
2. **Grep 優先** - 使用 Grep 搜尋 import/export，不盲目讀取
3. **最小讀取集合** - 僅讀取直接依賴
4. **重用知識** - apiResponse.ts 已在 Phase 9 讀過

### 預估 Token 使用

- Phase 1 (useUAG): ~1500
- Phase 2 (uagService): ~3500
- Phase 3 (useFeedData): ~4000
- Phase 4 (wall.ts): ~5500
- **總計**: ~14,500 tokens (遠低於 200,000 上限)

---

## ✅ Context Mastery 達成指標

- [ ] 使用 Grep/Bash 統計檔案大小而非直接讀取
- [ ] 優先測試最小模組 (useUAG 103 行)
- [ ] 建立最小必讀檔案清單
- [ ] Token 使用 < 20,000 (目標 10% budget)

---

**策略總結**: 從最小、最簡單的 useUAG.ts 開始，建立測試基礎設施和模式，然後逐步擴展到更複雜的模組。
