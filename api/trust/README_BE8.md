# BE-8 | 補完買方資訊 API

## 概述

POST `/api/trust/complete-buyer-info` - 補完案件的買方資訊（姓名、電話、Email）

## 請求格式

### HTTP Method

`POST`

### Headers

**方式 1: JWT 認證（房仲）**

```
Cookie: mh_token=<JWT_TOKEN>
或
Authorization: Bearer <JWT_TOKEN>
```

**方式 2: System Key 認證（系統/Cron）**

```
x-system-key: <SYSTEM_API_KEY>
```

### Body (JSON)

```json
{
  "caseId": "11111111-1111-1111-1111-111111111111",
  "name": "王小明",
  "phone": "0912345678",
  "email": "wang@example.com" // 可選
}
```

#### 欄位說明

| 欄位     | 類型     | 必填 | 說明       | 限制                      |
| -------- | -------- | ---- | ---------- | ------------------------- |
| `caseId` | `string` | ✅   | 案件 ID    | UUID 格式                 |
| `name`   | `string` | ✅   | 買方姓名   | 1-100 字元                |
| `phone`  | `string` | ✅   | 買方電話   | 1-20 字元                 |
| `email`  | `string` | ❌   | 買方 Email | Email 格式，最多 100 字元 |

## 回應格式

### 成功 (200 OK)

```json
{
  "success": true,
  "data": {
    "success": true,
    "caseId": "11111111-1111-1111-1111-111111111111",
    "buyerName": "王小明"
  }
}
```

### 錯誤回應

#### 400 Bad Request - 參數錯誤

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "請求參數格式錯誤",
    "details": [
      {
        "path": ["caseId"],
        "message": "caseId 必須是有效的 UUID"
      }
    ]
  }
}
```

#### 400 Bad Request - 案件狀態不允許

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "案件狀態不允許更新買方資訊"
  }
}
```

說明：僅允許 `active` 和 `dormant` 狀態的案件更新買方資訊。

#### 401 Unauthorized - 未授權

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "未登入或 Token 已過期"
  }
}
```

#### 403 Forbidden - 越權操作

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "無權限操作此案件"
  }
}
```

說明：JWT 認證時，房仲只能操作自己的案件。

#### 404 Not Found - 案件不存在

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "找不到案件"
  }
}
```

#### 409 Conflict - 並發衝突

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "案件狀態已變更,請重新操作"
  }
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "伺服器內部錯誤"
  }
}
```

## 使用範例

### 範例 1: JWT 認證（房仲）

```bash
curl -X POST https://maihouses.vercel.app/api/trust/complete-buyer-info \
  -H "Cookie: mh_token=eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "11111111-1111-1111-1111-111111111111",
    "name": "王小明",
    "phone": "0912345678",
    "email": "wang@example.com"
  }'
```

### 範例 2: System Key 認證（系統）

```bash
curl -X POST https://maihouses.vercel.app/api/trust/complete-buyer-info \
  -H "x-system-key: your-system-key" \
  -H "Content-Type: application/json" \
  -d '{
    "caseId": "11111111-1111-1111-1111-111111111111",
    "name": "李小華",
    "phone": "0987654321"
  }'
```

### 範例 3: TypeScript 前端呼叫

```typescript
async function completeBuyerInfo(caseId: string, name: string, phone: string, email?: string) {
  const response = await fetch('/api/trust/complete-buyer-info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // 包含 Cookie (JWT)
    body: JSON.stringify({
      caseId,
      name,
      phone,
      ...(email ? { email } : {}),
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return await response.json();
}

// 使用
try {
  const result = await completeBuyerInfo(
    '11111111-1111-1111-1111-111111111111',
    '王小明',
    '0912345678',
    'wang@example.com'
  );
  console.log('買方資訊已更新:', result.data);
} catch (error) {
  console.error('更新失敗:', error.message);
}
```

## 資料庫變更

此 API 需要執行以下 Migration:

```sql
-- 見 supabase/migrations/20260128_add_buyer_email_phone.sql
```

該 Migration 新增了以下欄位：

- `buyer_phone` - 買方電話（TEXT）
- `buyer_email` - 買方 Email（TEXT）

並將現有的 `buyer_contact` 資料遷移到 `buyer_phone`。

## 安全特性

1. **雙認證機制**
   - JWT: 房仲透過 Cookie/Header 認證
   - System Key: 系統/Cron 透過 `x-system-key` 認證

2. **權限驗證**
   - JWT 認證時，房仲只能操作自己的案件
   - System Key 認證時，可操作所有案件

3. **狀態驗證**
   - 僅允許 `active` 和 `dormant` 狀態的案件更新
   - 防止更新已關閉的案件

4. **並發控制**
   - 使用原子性更新（`.in("status", ["active", "dormant"])`）
   - 防止 TOCTOU（Time-of-Check-Time-of-Use）競態條件

5. **審計日誌**
   - 所有操作都記錄到 `audit_logs` 表
   - 區分 JWT 和 System Key 來源

## 相關文件

- [Trust Flow API 概覽](./README.md)
- [Migration: DB-5 買方電話與 Email](../../supabase/migrations/20260128_add_buyer_email_phone.sql)
- [API 統一回應格式](../lib/apiResponse.ts)
