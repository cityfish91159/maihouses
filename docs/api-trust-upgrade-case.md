# Trust Upgrade Case API - 使用文件

## 概述

**Team 5 - Token 升級 API**

此 API 允許消費者將匿名 token 連結的案件升級為已註冊用戶帳號。

## 端點資訊

- **URL**: `POST /api/trust/upgrade-case`
- **認證**: 不需要（使用 token 驗證）
- **Content-Type**: `application/json`

## 使用情境

1. 消費者透過房仲分享的 token 連結進入 Trust Room（未登入）
2. 消費者註冊/登入邁房子帳號
3. 前端呼叫此 API，將案件綁定到用戶帳號
4. 之後消費者可以在「我的案件」中查看此案件

## 請求參數

### Body (JSON)

| 欄位       | 類型          | 必填 | 說明                                        |
| ---------- | ------------- | ---- | ------------------------------------------- |
| `token`    | string (UUID) | 是   | 案件 token，從 URL 參數或 localStorage 取得 |
| `userId`   | string        | 是   | 已註冊用戶的 ID（從 Supabase Auth 取得）    |
| `userName` | string        | 是   | 用戶名稱，用於更新案件中的 `buyer_name`     |

### 請求範例

```json
{
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "auth-user-uuid-123",
  "userName": "陳小明"
}
```

## 回應格式

### 成功回應 (200 OK)

```json
{
  "success": true,
  "data": {
    "case_id": "660e8400-e29b-41d4-a716-446655440001",
    "message": "案件已成功升級為已註冊用戶"
  }
}
```

### 錯誤回應

#### Token 格式錯誤 (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "請求參數格式錯誤",
    "details": [
      {
        "code": "invalid_string",
        "validation": "uuid",
        "path": ["token"],
        "message": "Token 格式錯誤，必須是有效的 UUID"
      }
    ]
  }
}
```

#### Token 無效/已過期 (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Token 無效、已過期或已撤銷"
  }
}
```

#### 案件已綁定其他用戶 (400 Bad Request)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "此案件已綁定其他用戶，無法重複綁定"
  }
}
```

#### 伺服器錯誤 (500 Internal Server Error)

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "伺服器內部錯誤"
  }
}
```

## 前端整合範例

### React Hook

```typescript
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export function useUpgradeTrustCase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const upgradeCase = async (token: string) => {
    if (!user) {
      throw new Error('用戶未登入');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trust/upgrade-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          userId: user.id,
          userName: user.user_metadata?.name || '未命名用戶',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || '升級失敗');
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { upgradeCase, loading, error };
}
```

### 使用範例

```typescript
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUpgradeTrustCase } from '@/hooks/useUpgradeTrustCase';
import { useAuth } from '@/hooks/useAuth';

export function TrustRoomPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { upgradeCase, loading } = useUpgradeTrustCase();

  useEffect(() => {
    const token = searchParams.get('token');

    // 如果有 token 且用戶已登入，自動升級案件
    if (token && user && !loading) {
      upgradeCase(token)
        .then(() => {
          console.log('案件已成功綁定到帳號');
          // 可以導向「我的案件」頁面
        })
        .catch((err) => {
          console.error('升級失敗:', err);
          // 顯示錯誤訊息
        });
    }
  }, [token, user, loading]);

  return (
    <div>
      {/* Trust Room UI */}
    </div>
  );
}
```

## 業務邏輯

### 升級流程

1. 驗證 token 格式（必須是有效的 UUID）
2. 驗證 userId 和 userName 非空
3. 呼叫 `fn_upgrade_trust_case` RPC 函數
4. 函數內部邏輯：
   - 查詢案件並驗證 token 有效（未過期、未撤銷）
   - 檢查是否已綁定其他用戶
   - 如果已綁定同一用戶，返回成功（冪等性）
   - 更新 `buyer_user_id` 和 `buyer_name`
   - 建立事件記錄
5. 記錄審計日誌
6. 返回成功結果

### 冪等性

此 API 支援冪等性：

- 如果案件已綁定**同一用戶**，重複呼叫會返回成功（不會報錯）
- 如果案件已綁定**其他用戶**，返回 400 錯誤

### 保留舊資料

升級後，原有的 `buyer_temp_code` 和 `buyer_session_id` 會保留，不會被清除。這確保了：

- 向下兼容（舊的查詢方式仍然有效）
- 審計追蹤（可以查詢案件的完整歷史）

## 資料庫變更

此 API 依賴以下資料庫物件：

- **表**: `trust_cases`（需要 `buyer_user_id`, `buyer_name`, `token` 欄位）
- **函數**: `fn_upgrade_trust_case(p_token UUID, p_user_id TEXT, p_user_name TEXT)`
- **Migration**: `20260128_add_upgrade_case_function.sql`

## 安全性

- **Token 驗證**: 驗證 token 格式、過期時間、撤銷狀態
- **防止重複綁定**: 檢查案件是否已綁定其他用戶
- **審計日誌**: 記錄所有升級操作
- **SECURITY DEFINER**: RPC 函數使用 SECURITY DEFINER，繞過 RLS（允許 anon 用戶執行）
- **原子性**: 使用 `FOR UPDATE` 鎖定案件，防止並發衝突

## 測試

### 單元測試

位置：`api/trust/__tests__/upgrade-case.test.ts`

執行測試：

```bash
npx vitest run api/trust/__tests__/upgrade-case.test.ts
```

測試案例：

- 成功升級案件
- Token 格式錯誤
- 必填欄位缺失
- Token 無效
- 案件已綁定其他用戶
- 重複綁定同一用戶（冪等性）
- RPC 錯誤處理
- OPTIONS 請求（CORS preflight）

### 手動測試

使用 curl 測試：

```bash
# 成功案例
curl -X POST http://localhost:3000/api/trust/upgrade-case \
  -H "Content-Type: application/json" \
  -d '{
    "token": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "auth-user-uuid-123",
    "userName": "陳小明"
  }'

# Token 格式錯誤
curl -X POST http://localhost:3000/api/trust/upgrade-case \
  -H "Content-Type: application/json" \
  -d '{
    "token": "invalid-token",
    "userId": "auth-user-uuid-123",
    "userName": "陳小明"
  }'
```

## 相關資源

- [Trust Cases API](./api-trust-cases.md)
- [Trust Room 流程文件](./trust-room-flow.md)
- [DB Migration: Token 升級函數](../supabase/migrations/20260128_add_upgrade_case_function.sql)

## 版本歷史

- **v1.0.0** (2026-01-28): 初始版本
  - 支援 token 升級為已註冊用戶
  - 完整錯誤處理
  - 冪等性支援
  - 審計日誌記錄
