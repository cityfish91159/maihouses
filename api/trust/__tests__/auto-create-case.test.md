# API 測試文件：auto-create-case.ts

## API 端點

```
POST /api/trust/auto-create-case
```

## 功能說明

消費者點擊「發起交易」後自動建立安心交易案件。

## 請求格式

### Request Body

```typescript
{
  propertyId: string;    // 必填：物件 public_id
  userId?: string;       // 可選：已註冊用戶 ID (UUID)
  userName?: string;     // 可選：用戶名稱
}
```

## 回應格式

### 成功回應 (201)

```json
{
  "success": true,
  "data": {
    "case_id": "uuid",
    "token": "uuid",
    "buyer_name": "string"
  }
}
```

### 錯誤回應

#### 400 - 請求參數錯誤

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "請求參數格式錯誤",
    "details": [...]
  }
}
```

#### 404 - 物件不存在

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "找不到對應的物件"
  }
}
```

#### 400 - 物件未開啟安心留痕

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "此物件未開啟安心留痕服務"
  }
}
```

## 測試場景

### 場景 1：已註冊用戶發起交易

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "MH-100001",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "userName": "王小明"
  }'
```

**預期結果：**

- 使用提供的 `userName`（王小明）
- `buyer_user_id` 設為提供的 `userId`
- 回傳 `case_id`、`token`、`buyer_name`

### 場景 2：已註冊用戶但只提供 userId

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "MH-100001",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**預期結果：**

- 從 `users` 表查詢用戶名稱
- 若用戶 `name` 為 null，生成匿名買方名稱（買方-XXXX）
- `buyer_user_id` 設為提供的 `userId`

### 場景 3：未註冊用戶發起交易

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "MH-100001"
  }'
```

**預期結果：**

- 生成匿名買方名稱（買方-1234 到買方-9999）
- `buyer_user_id` 為 null
- 回傳 `case_id`、`token`、`buyer_name`

### 場景 4：物件不存在

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "INVALID-ID"
  }'
```

**預期結果：**

- 回傳 404 錯誤
- 錯誤訊息：「找不到對應的物件」

### 場景 5：物件未開啟安心留痕

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "MH-100002"
  }'
```

**預期結果（假設 MH-100002 的 trust_enabled=false）：**

- 回傳 400 錯誤
- 錯誤訊息：「此物件未開啟安心留痕服務」

### 場景 6：參數格式錯誤

```bash
curl -X POST https://example.com/api/trust/auto-create-case \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "invalid-uuid"
  }'
```

**預期結果：**

- 回傳 400 錯誤
- 錯誤訊息包含 Zod 驗證詳情

## 業務邏輯說明

### 1. 驗證物件

- 檢查 `propertyId` 是否存在於 `properties` 表
- 檢查 `trust_enabled` 是否為 `true`
- 取得 `agent_id` 和 `title` 用於建立案件

### 2. 決定買方資訊

優先順序：

1. 提供 `userId` + `userName`：直接使用
2. 只提供 `userId`：查詢 `users` 表取得 `name`
3. 都不提供：生成匿名買方名稱（買方-XXXX）

### 3. 建立案件

呼叫 RPC 函數 `fn_create_trust_case`：

- 自動生成 `token`（UUID）
- `token_expires_at` 設為 NOW() + 90 天
- 建立初始事件（M1 接洽）

### 4. 更新買方 ID

如果有 `userId`，更新 `trust_cases.buyer_user_id`

### 5. 審計日誌

記錄 `AUTO_CREATE_CASE` 事件到 `audit_logs`

## 資料庫影響

### 影響的表

1. `trust_cases`：新增一筆記錄
2. `trust_case_events`：新增一筆初始事件
3. `audit_logs`：新增審計記錄

### Token 生命週期

- Token 有效期：90 天
- 可透過 `fn_revoke_trust_case_token` 撤銷
- 可透過 `fn_regenerate_trust_case_token` 重新生成

## 安全性考量

- ✅ 使用 Supabase Service Role（繞過 RLS）
- ✅ 完整的參數驗證（Zod Schema）
- ✅ 完整的錯誤處理
- ✅ 審計日誌記錄
- ✅ 不洩露敏感資訊

## 效能考量

- 查詢次數：
  - 1 次查詢 `properties`（驗證物件）
  - 0-1 次查詢 `users`（如果只提供 userId）
  - 1 次 RPC 呼叫（建立案件 + 事件）
  - 0-1 次更新 `trust_cases`（如果有 userId）
  - 1 次插入 `audit_logs`

- 總計：3-5 次資料庫操作

## 相依 RPC 函數

- `fn_create_trust_case`：建立案件並生成 token
- 詳見：`supabase/migrations/20260122_add_case_token_final.sql`
