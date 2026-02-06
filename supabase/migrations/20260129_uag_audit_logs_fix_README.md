# uag_audit_logs RLS 安全漏洞修復

## 問題描述

**嚴重等級**: P0 - 致命安全漏洞
**目前分數**: 40/100
**目標分數**: 95/100

### 漏洞詳情

`uag_audit_logs` 表未啟用 Row Level Security (RLS)，導致：

1. 任何已登入用戶都可查詢所有房仲的 RPC 呼叫記錄
2. `request` 欄位可能含敏感參數（客戶資料、交易細節）
3. `response` 欄位可能含錯誤訊息（系統內部資訊洩漏）
4. 違反 Default-Deny 安全原則

**影響範圍**: 所有使用 UAG 業務廣告系統的房仲

---

## 修復方案

### 1. 啟用 RLS

```sql
ALTER TABLE public.uag_audit_logs ENABLE ROW LEVEL SECURITY;
```

### 2. 建立 Default-Deny 政策

```sql
-- 禁止匿名用戶
CREATE POLICY "uag_audit_logs_deny_anon"
ON public.uag_audit_logs FOR ALL TO anon
USING (false);

-- 禁止已登入用戶（包括房仲）
CREATE POLICY "uag_audit_logs_deny_authenticated"
ON public.uag_audit_logs FOR ALL TO authenticated
USING (false);

-- 僅允許 service_role（後端 API）
CREATE POLICY "uag_audit_logs_service_role_full_access"
ON public.uag_audit_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

### 3. 新增效能索引

```sql
CREATE INDEX idx_uag_audit_logs_created_at ON public.uag_audit_logs (created_at DESC);
CREATE INDEX idx_uag_audit_logs_session_id ON public.uag_audit_logs (session_id) WHERE session_id IS NOT NULL;
```

---

## 執行步驟

### 方式一：使用 Supabase CLI（推薦）

```bash
# 1. 確認當前 Supabase 連線狀態
supabase status

# 2. 執行 Migration
supabase db push

# 3. 驗證 RLS 政策
supabase db execute -f supabase/migrations/20260129_verify_uag_audit_logs_rls.sql
```

### 方式二：使用 psql

```bash
# 1. 連線到 Supabase 資料庫
psql -h <your-supabase-host> -U postgres -d postgres

# 2. 執行 Migration
\i supabase/migrations/20260129_fix_uag_audit_logs_rls.sql

# 3. 執行驗證腳本
\i supabase/migrations/20260129_verify_uag_audit_logs_rls.sql
```

### 方式三：Supabase Dashboard（手動）

1. 登入 Supabase Dashboard
2. 前往 **SQL Editor**
3. 複製 `20260129_fix_uag_audit_logs_rls.sql` 內容
4. 執行 SQL
5. 複製 `20260129_verify_uag_audit_logs_rls.sql` 內容並執行驗證

---

## 驗證結果

執行驗證腳本後，應該看到以下輸出：

```
NOTICE:  ✅ uag_audit_logs RLS verified: 3 policies active
NOTICE:  ✅ anon cannot access uag_audit_logs (0 rows)
NOTICE:  ✅ authenticated cannot access uag_audit_logs (0 rows)
NOTICE:
NOTICE:  ========================================
NOTICE:           uag_audit_logs 安全驗證
NOTICE:  ========================================
NOTICE:  RLS 狀態: ✅ Enabled
NOTICE:  RLS 政策數量: 3 (預期: 3)
NOTICE:  索引數量: 5
NOTICE:
NOTICE:  🎉 安全等級: 95/100 (P0 漏洞已修復)
NOTICE:  ========================================
```

---

## 安全等級提升

| 項目              | 修復前      | 修復後      |
| ----------------- | ----------- | ----------- |
| RLS 狀態          | ❌ Disabled | ✅ Enabled  |
| 匿名用戶存取      | ✅ 可查詢   | ❌ 拒絕存取 |
| 已登入用戶存取    | ✅ 可查詢   | ❌ 拒絕存取 |
| service_role 存取 | ✅ 可查詢   | ✅ 完整權限 |
| 索引優化          | ❌ 不足     | ✅ 已優化   |
| **總分**          | **40/100**  | **95/100**  |

---

## 相關檔案

- `20260129_fix_uag_audit_logs_rls.sql` - Migration 腳本
- `20260129_verify_uag_audit_logs_rls.sql` - 驗證腳本
- `20251231_001_uag_schema_setup.sql` - 原始 Schema（未啟用 RLS）

---

## 回滾方案（僅測試環境使用）

如果需要回滾此 Migration：

```sql
-- 刪除 RLS 政策
DROP POLICY IF EXISTS "uag_audit_logs_deny_anon" ON public.uag_audit_logs;
DROP POLICY IF EXISTS "uag_audit_logs_deny_authenticated" ON public.uag_audit_logs;
DROP POLICY IF EXISTS "uag_audit_logs_service_role_full_access" ON public.uag_audit_logs;

-- 停用 RLS
ALTER TABLE public.uag_audit_logs DISABLE ROW LEVEL SECURITY;

-- 刪除索引
DROP INDEX IF EXISTS idx_uag_audit_logs_created_at;
DROP INDEX IF EXISTS idx_uag_audit_logs_session_id;
```

**⚠️ 警告**: 回滾會重新引入 P0 安全漏洞，僅供測試環境使用。

---

## 後續建議

1. **立即執行**: 此為 P0 漏洞，建議立即部署到生產環境
2. **審計現有記錄**: 檢查是否有未授權存取的歷史記錄
3. **監控告警**: 設定 Supabase RLS 違規告警
4. **定期審查**: 每月審查 `uag_audit_logs` 的 RLS 政策

---

## 聯絡資訊

如有問題，請聯絡技術團隊或參考 Supabase RLS 文件：
https://supabase.com/docs/guides/auth/row-level-security
