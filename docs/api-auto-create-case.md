# Auto-Create Case API 使用指南

## 概述

`POST /api/trust/auto-create-case` 用於消費者主動發起安心交易案件（Phase 1.5 功能）。

## 快速開始

### 基本用法（未註冊用戶）

```typescript
const response = await fetch('/api/trust/auto-create-case', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    propertyId: 'MH-100001',
  }),
});

const result = await response.json();
console.log(result);
// {
//   "success": true,
//   "data": {
//     "case_id": "550e8400-e29b-41d4-a716-446655440000",
//     "token": "660e8400-e29b-41d4-a716-446655440001",
//     "buyer_name": "買方-1234"
//   }
// }
```

### 進階用法（已註冊用戶）

```typescript
// 假設已從 auth context 取得用戶資訊
const { user } = useAuth();

const response = await fetch('/api/trust/auto-create-case', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    propertyId: 'MH-100001',
    userId: user.id,
    userName: user.name,
  }),
});

const result = await response.json();
// {
//   "success": true,
//   "data": {
//     "case_id": "...",
//     "token": "...",
//     "buyer_name": "王小明"
//   }
// }
```

## 前端整合範例

### React Hook 範例

```typescript
// hooks/useTrustAutoCreate.ts
import { useState } from 'react';
import type { ApiResponse } from '@/lib/apiResponse';

interface AutoCreateCaseRequest {
  propertyId: string;
  userId?: string;
  userName?: string;
}

interface AutoCreateCaseResponse {
  case_id: string;
  token: string;
  buyer_name: string;
}

export function useTrustAutoCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCase = async (
    params: AutoCreateCaseRequest
  ): Promise<AutoCreateCaseResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/trust/auto-create-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const result: ApiResponse<AutoCreateCaseResponse> = await response.json();

      if (!result.success) {
        throw new Error(result.error?.message ?? '案件建立失敗');
      }

      return result.data ?? null;
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知錯誤';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createCase, loading, error };
}
```

### 元件整合範例

```typescript
// components/TrustServiceBanner.tsx
import { useTrustAutoCreate } from '@/hooks/useTrustAutoCreate';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';

interface TrustServiceBannerProps {
  propertyId: string;
  trustEnabled: boolean;
}

export function TrustServiceBanner({ propertyId, trustEnabled }: TrustServiceBannerProps) {
  const { user } = useAuth();
  const { createCase, loading, error } = useTrustAutoCreate();
  const router = useRouter();

  const handleInitiateTrust = async () => {
    // 建立案件
    const result = await createCase({
      propertyId,
      userId: user?.id,
      userName: user?.name,
    });

    if (result) {
      // 導向 Trust Room（使用 token）
      router.push(`/trust-room?token=${result.token}`);
    }
  };

  if (!trustEnabled) {
    return null;
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg">
      <h3 className="font-bold">🛡️ 安心留痕服務</h3>
      <p className="text-sm text-gray-600">
        此物件支援交易過程全程追蹤，保障您的權益
      </p>
      <button
        onClick={handleInitiateTrust}
        disabled={loading}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '建立中...' : '發起交易'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

## 錯誤處理

### 常見錯誤

| HTTP Status | Error Code       | 說明               | 處理建議                   |
| ----------- | ---------------- | ------------------ | -------------------------- |
| 400         | `INVALID_INPUT`  | 參數格式錯誤       | 檢查必填欄位               |
| 400         | `INVALID_INPUT`  | 物件未開啟安心留痕 | 隱藏「發起交易」按鈕       |
| 404         | `NOT_FOUND`      | 物件不存在         | 提示用戶重新整理頁面       |
| 404         | `NOT_FOUND`      | 用戶不存在         | 清除本地用戶狀態，重新登入 |
| 500         | `INTERNAL_ERROR` | 伺服器錯誤         | 提示用戶稍後再試           |

### 錯誤處理範例

```typescript
async function handleCreateCase(propertyId: string) {
  try {
    const response = await fetch('/api/trust/auto-create-case', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId }),
    });

    const result = await response.json();

    if (!result.success) {
      switch (result.error?.code) {
        case 'NOT_FOUND':
          showToast('物件不存在，請重新整理頁面', 'error');
          break;
        case 'INVALID_INPUT':
          if (result.error.message.includes('未開啟')) {
            showToast('此物件不支援安心留痕服務', 'warning');
          } else {
            showToast('參數格式錯誤', 'error');
          }
          break;
        default:
          showToast('案件建立失敗，請稍後再試', 'error');
      }
      return null;
    }

    return result.data;
  } catch (err) {
    showToast('網路錯誤，請檢查連線', 'error');
    return null;
  }
}
```

## 資料流程

```
1. 用戶點擊「發起交易」
   ↓
2. 前端呼叫 POST /api/trust/auto-create-case
   ↓
3. API 驗證 property.trust_enabled = true
   ↓
4. API 決定買方資訊（已註冊/未註冊）
   ↓
5. API 呼叫 fn_create_trust_case RPC（生成 token）
   ↓
6. API 回傳 { case_id, token, buyer_name }
   ↓
7. 前端導向 /trust-room?token={token}
   ↓
8. Trust Room 使用 token 查詢案件資訊
```

## 與現有流程的差異

### Phase 1（房仲建立）vs Phase 1.5（消費者建立）

| 項目             | Phase 1                 | Phase 1.5                          |
| ---------------- | ----------------------- | ---------------------------------- |
| 發起者           | 房仲                    | 消費者                             |
| API              | `POST /api/trust/cases` | `POST /api/trust/auto-create-case` |
| 認證             | 需要房仲 Token          | 無需認證（公開 API）               |
| buyer_session_id | 可選                    | 不需要                             |
| buyer_user_id    | 無                      | 已註冊用戶會設定                   |
| 匿名買方         | 不支援                  | 支援（買方-XXXX）                  |

## 安全性注意事項

### 1. Token 保護

回傳的 `token` 是存取 Trust Room 的憑證，必須：

- 透過 HTTPS 傳輸
- 儲存在安全的地方（不要放在 URL query）
- 90 天後自動過期

### 2. CORS 處理

此 API 已啟用 CORS，但建議：

- 前端驗證 `trust_enabled` 再顯示「發起交易」按鈕
- 不要在公開環境暴露 propertyId

### 3. 速率限制

建議實施：

- 每個 IP 每分鐘最多 10 次請求
- 每個 propertyId 每小時最多 100 次請求

## TypeScript 類型定義

```typescript
// types/trust-api.ts
export interface AutoCreateCaseRequest {
  propertyId: string;
  userId?: string;
  userName?: string;
}

export interface AutoCreateCaseResponse {
  case_id: string;
  token: string;
  buyer_name: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
```

## 測試建議

### 單元測試

```typescript
// __tests__/auto-create-case.test.ts
import { describe, it, expect, vi } from 'vitest';
import handler from '../auto-create-case';

describe('POST /api/trust/auto-create-case', () => {
  it('should create case for unregistered user', async () => {
    // 模擬請求
    const req = {
      method: 'POST',
      body: { propertyId: 'MH-100001' },
      headers: {},
    };
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      end: vi.fn(),
    };

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          case_id: expect.any(String),
          token: expect.any(String),
          buyer_name: expect.stringMatching(/^買方-\d{4}$/),
        }),
      })
    );
  });
});
```

### E2E 測試（Playwright）

```typescript
// tests/e2e/trust-auto-create.spec.ts
import { test, expect } from '@playwright/test';

test('consumer can initiate trust case', async ({ page }) => {
  // 1. 前往物件詳情頁
  await page.goto('/property/MH-100001');

  // 2. 確認顯示「發起交易」按鈕
  const initiateBtn = page.getByRole('button', { name: '發起交易' });
  await expect(initiateBtn).toBeVisible();

  // 3. 點擊按鈕
  await initiateBtn.click();

  // 4. 等待 API 回應
  await page.waitForResponse(
    (res) => res.url().includes('/api/trust/auto-create-case') && res.status() === 201
  );

  // 5. 確認導向 Trust Room
  await expect(page).toHaveURL(/\/trust-room\?token=[a-f0-9-]{36}/);
});
```

## 相關文件

- [Trust Cases Schema](../../supabase/migrations/20260119_trust_cases_schema.sql)
- [Token Migration](../../supabase/migrations/20260122_add_case_token_final.sql)
- [API Response Format](../api/lib/apiResponse.ts)
- [Trust Utils](../api/trust/_utils.ts)

## 常見問題

### Q: 匿名買方名稱會重複嗎？

A: 有可能。目前生成 1000-9999 共 9000 個可能值。若需要完全唯一，建議改用：

```typescript
const randomCode = crypto.randomUUID().slice(0, 8);
return `買方-${randomCode}`;
```

### Q: Token 過期後怎麼辦？

A: 房仲可以透過 `fn_regenerate_trust_case_token` RPC 重新生成。前端應提示用戶聯絡房仲。

### Q: 如何防止惡意建立大量案件？

A: 建議實施：

1. 速率限制（Rate Limiting）
2. reCAPTCHA 驗證
3. 監控異常流量並自動封鎖 IP

### Q: 如何取得案件詳情？

A: 使用 token 呼叫 `fn_get_trust_case_by_token` RPC：

```typescript
const { data } = await supabase.rpc('fn_get_trust_case_by_token', {
  p_token: token,
});
```
