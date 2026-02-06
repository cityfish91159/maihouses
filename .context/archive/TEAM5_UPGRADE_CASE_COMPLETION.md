# Team 5 - Token 升級 API 完成報告

## 任務概述

建立 `POST /api/trust/upgrade-case` API，允許消費者將匿名 token 連結的案件升級為已註冊用戶帳號。

## 完成項目

### 1. API 端點 (api/trust/upgrade-case.ts)

**路徑**: `C:\Users\陳世瑜\maihouses\api\trust\upgrade-case.ts`

**功能**:

- POST /api/trust/upgrade-case
- 接收參數: `{ token: string, userId: string, userName: string }`
- 驗證 token 有效性（格式、過期、撤銷）
- 更新 `trust_cases` 表的 `buyer_user_id` 和 `buyer_name`
- 保留舊的 `buyer_temp_code` 供查詢（向下兼容）
- 返回成功結果: `{ success: true, case_id }`

**特性**:

- ✅ 完整的 TypeScript 類型安全（Zod Schema 驗證）
- ✅ 完整的錯誤處理（Token 無效、已過期、已綁定等）
- ✅ 審計日誌記錄（AUDIT_LOGGING）
- ✅ CORS 支援
- ✅ 冪等性支援（重複綁定同一用戶返回成功）
- ✅ 統一的 API 回應格式

### 2. 資料庫 RPC 函數

**路徑**: `C:\Users\陳世瑜\maihouses\supabase\migrations\20260128_add_upgrade_case_function.sql`

**函數**: `fn_upgrade_trust_case(p_token UUID, p_user_id TEXT, p_user_name TEXT)`

**業務邏輯**:

1. 查詢案件並驗證 token（未過期、未撤銷）
2. 使用 `FOR UPDATE` 鎖定案件（防止並發衝突）
3. 檢查是否已綁定其他用戶
4. 如果已綁定同一用戶，返回成功（冪等性）
5. 更新 `buyer_user_id` 和 `buyer_name`
6. 建立事件記錄（記錄升級操作）
7. 返回成功結果

**安全性**:

- ✅ SECURITY DEFINER（允許 anon 用戶執行）
- ✅ 原子性操作（單次 UPDATE + FOR UPDATE 鎖定）
- ✅ 防止重複綁定（檢查 buyer_user_id）
- ✅ 權限控管（GRANT to anon, authenticated, service_role）

### 3. 單元測試

**路徑**: `C:\Users\陳世瑜\maihouses\api\trust\__tests__\upgrade-case.test.ts`

**測試案例**:

- ✅ 成功升級案件
- ✅ 拒絕非 POST 請求
- ✅ Token 格式錯誤
- ✅ 必填欄位缺失
- ✅ Token 無效/已過期
- ✅ 案件已綁定其他用戶
- ✅ 重複綁定同一用戶（冪等性）
- ✅ RPC 錯誤處理
- ✅ OPTIONS 請求（CORS preflight）

**測試結果**: ✅ 9/9 測試通過

### 4. API 使用文件

**路徑**: `C:\Users\陳世瑜\maihouses\docs\api-trust-upgrade-case.md`

**內容**:

- API 端點資訊
- 使用情境說明
- 請求/回應格式範例
- 前端整合範例（React Hook）
- 業務邏輯說明
- 安全性說明
- 測試指南

## 代碼品質檢查

### ESLint

```bash
npx eslint api/trust/upgrade-case.ts
```

✅ **結果**: 無警告或錯誤

### 測試

```bash
npx vitest run api/trust/__tests__/upgrade-case.test.ts
```

✅ **結果**: 9/9 測試通過

## 技術規範遵循

### ✅ Backend Safeguard

- RLS + 權限驗證
- Token 驗證邏輯
- SECURITY DEFINER 函數

### ✅ NASA TypeScript Safety

- 完整類型定義
- Zod Schema 驗證（無 `any` 類型）
- 完整錯誤處理

### ✅ Audit Logging

- 審計日誌記錄（logAudit）
- 事件記錄（trust_case_events）

### ✅ No Lazy Implementation

- 完整實作（無 TODO/placeholder）
- 完整錯誤處理
- 完整測試覆蓋

## 資料庫變更

### 新增 RPC 函數

- `fn_upgrade_trust_case(p_token UUID, p_user_id TEXT, p_user_name TEXT)`

### 相依欄位（已存在）

- `trust_cases.token` (UUID, 案件 token)
- `trust_cases.token_expires_at` (TIMESTAMPTZ, token 過期時間)
- `trust_cases.token_revoked_at` (TIMESTAMPTZ, token 撤銷時間)
- `trust_cases.buyer_user_id` (UUID, 已註冊用戶 ID)
- `trust_cases.buyer_name` (TEXT, 買方名稱)

## 檔案清單

```
C:\Users\陳世瑜\maihouses\
├── api/
│   └── trust/
│       ├── upgrade-case.ts                           # API 端點
│       └── __tests__/
│           └── upgrade-case.test.ts                  # 單元測試
├── supabase/
│   └── migrations/
│       └── 20260128_add_upgrade_case_function.sql    # RPC 函數
└── docs/
    └── api-trust-upgrade-case.md                     # API 文件
```

## 使用方式

### 前端呼叫範例

```typescript
const response = await fetch('/api/trust/upgrade-case', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    token: '550e8400-e29b-41d4-a716-446655440000',
    userId: user.id,
    userName: user.user_metadata.name,
  }),
});

const data = await response.json();
if (data.success) {
  console.log('案件已升級:', data.data.case_id);
}
```

## 部署步驟

1. **執行 Migration**:

   ```bash
   # 在 Supabase Dashboard 執行
   supabase/migrations/20260128_add_upgrade_case_function.sql
   ```

2. **部署 API**:

   ```bash
   # Vercel 會自動偵測 api/ 目錄下的新檔案
   git add api/trust/upgrade-case.ts
   git commit -m "feat(trust): 新增 Token 升級 API"
   git push
   ```

3. **驗證部署**:
   ```bash
   curl -X POST https://maihouses.vercel.app/api/trust/upgrade-case \
     -H "Content-Type: application/json" \
     -d '{"token":"...", "userId":"...", "userName":"..."}'
   ```

## 相關文件

- [Trust Cases API](./docs/api-trust-cases.md)
- [Trust Room 流程](./docs/trust-room-flow.md)
- [API 回應格式](./api/lib/apiResponse.ts)

## 完成時間

**完成日期**: 2026-01-28
**完成人**: Team 5 - Token 升級 API 團隊（由 Claude Code 協助）

## 狀態

✅ **已完成** - 所有測試通過，代碼品質檢查通過，準備部署
