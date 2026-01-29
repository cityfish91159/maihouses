# audit_logs 使用範例

本文檔說明如何使用更新後的 `logAudit` 函數，以及新的 `status` 和 `error` 欄位。

## 前置準備

確保執行以下 migrations：

1. `20260129_create_audit_logs.sql` - 建立 audit_logs 表
2. `20260129_fix_audit_logs_rls.sql` - 新增 status/error 欄位

## API 簽名

```typescript
export async function logAudit(
  txId: string,
  action: string,
  user: AuditUser,
  options?: {
    status?: AuditStatus; // "success" | "failed" | "pending"
    error?: string;
  }
): Promise<void>;
```

## 使用範例

### 1. 記錄成功操作（預設行為）

```typescript
import { logAudit } from './_utils';

// 不傳 options，預設 status = "success"
await logAudit('case_123', 'CREATE_TRUST_CASE', user);
```

### 2. 明確指定成功狀態

```typescript
await logAudit('case_123', 'UPDATE_TRUST_STEP', user, {
  status: 'success',
});
```

### 3. 記錄失敗操作

```typescript
await logAudit('case_123', 'UPGRADE_TRUST_CASE', user, {
  status: 'failed',
  error: 'Insufficient payment amount: expected 1000, received 800',
});
```

### 4. 記錄等待中操作

```typescript
// 用於非同步操作，例如等待付款確認
await logAudit('case_123', 'INITIATE_PAYMENT', user, {
  status: 'pending',
});

// 稍後更新狀態（需要另外記錄新的 log）
await logAudit('case_123', 'VERIFY_PAYMENT', user, {
  status: 'success',
});
```

### 5. 結合 metadata 使用

```typescript
const user: AuditUser = {
  id: 'user_456',
  role: 'buyer',
  txId: 'case_123',
  ip: getClientIp(req),
  agent: getUserAgent(req),
  metadata: {
    buyer_name: '王小明',
    property_id: 'prop_789',
  },
};

await logAudit('case_123', 'COMPLETE_CASE', user, {
  status: 'success',
});
```

### 6. Try-Catch 錯誤處理

```typescript
try {
  // 執行業務邏輯
  await updateTrustCase(caseId, data);

  // 記錄成功
  await logAudit(caseId, 'UPDATE_TRUST_STEP', user, {
    status: 'success',
  });
} catch (error) {
  // 記錄失敗
  await logAudit(caseId, 'UPDATE_TRUST_STEP', user, {
    status: 'failed',
    error: error instanceof Error ? error.message : 'Unknown error',
  });

  throw error; // 重新拋出錯誤
}
```

### 7. 完整範例：付款流程

```typescript
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. 驗證用戶
    const user = verifyToken(req);

    // 2. 解析請求
    const { caseId, amount } = req.body;

    // 3. 記錄付款發起（pending）
    await logAudit(caseId, 'INITIATE_PAYMENT', user, {
      status: 'pending',
    });

    // 4. 執行付款邏輯
    const paymentResult = await processPayment(caseId, amount);

    if (!paymentResult.success) {
      // 付款失敗
      await logAudit(caseId, 'VERIFY_PAYMENT', user, {
        status: 'failed',
        error: `Payment failed: ${paymentResult.reason}`,
      });

      return res.status(400).json({ error: paymentResult.reason });
    }

    // 5. 付款成功
    await logAudit(caseId, 'VERIFY_PAYMENT', user, {
      status: 'success',
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('[payment] Unexpected error', error);

    // 記錄系統錯誤
    await logAudit(req.body.caseId, 'VERIFY_PAYMENT', user, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'System error',
    });

    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

## 查詢範例（僅供參考，前端無權存取）

```sql
-- 查詢所有失敗的操作
SELECT * FROM public.audit_logs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- 查詢特定案件的完整操作記錄
SELECT
  action,
  status,
  error,
  created_at
FROM public.audit_logs
WHERE transaction_id = 'case_123'
ORDER BY created_at ASC;

-- 統計各操作的成功/失敗比例
SELECT
  action,
  status,
  COUNT(*) as count
FROM public.audit_logs
GROUP BY action, status
ORDER BY action, status;
```

## 注意事項

1. **向後兼容**：不傳 `options` 參數時，預設 `status = "success"`，與舊版行為一致。

2. **錯誤訊息**：`error` 欄位僅在 `status = "failed"` 時有意義。建議只在失敗時填寫。

3. **阻塞模式**：`logAudit` 會等待 DB 寫入完成。如果寫入失敗，會拋出錯誤。確保在 try-catch 中處理。

4. **RLS 限制**：前端無法直接查詢 `audit_logs`。僅 service_role 可存取。

5. **action 類型**：必須是以下之一（受 CHECK constraint 限制）：
   - `CREATE_TRUST_CASE`
   - `UPGRADE_TRUST_CASE`
   - `UPDATE_TRUST_STEP`
   - `SUBMIT_SUPPLEMENT`
   - `INITIATE_PAYMENT`
   - `VERIFY_PAYMENT`
   - `COMPLETE_CASE`
   - `ACCESS_TRUST_ROOM`

## TypeScript 類型定義

```typescript
// 已更新的類型
export type AuditStatus = 'success' | 'failed' | 'pending';

export interface AuditUser extends JwtUser {
  ip: string;
  agent: string;
  metadata?: Record<string, unknown>;
}

// 使用範例
const user: AuditUser = {
  id: 'user_123',
  role: 'agent',
  txId: 'case_456',
  ip: '192.168.1.1',
  agent: 'Mozilla/5.0...',
  metadata: { property_id: 'prop_789' },
};

await logAudit('case_456', 'CREATE_TRUST_CASE', user, {
  status: 'success', // 類型安全，僅允許 "success" | "failed" | "pending"
});
```

## 相關檔案

- `api/trust/_utils.ts` - logAudit 函數實現
- `supabase/migrations/20260129_create_audit_logs.sql` - 建立表
- `supabase/migrations/20260129_fix_audit_logs_rls.sql` - 新增欄位
- `docs/audit-logs-rls-fix.md` - RLS 修復文檔

---

**最後更新**: 2026-01-29
