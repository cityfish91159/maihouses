-- =============================================================================
-- 驗證腳本: audit_logs RLS 政策與欄位檢查
-- File: 20260129_verify_audit_logs_rls.sql
--
-- 使用方式:
--   psql -h <supabase-host> -U postgres -d postgres -f 20260129_verify_audit_logs_rls.sql
--
-- 或在 Supabase SQL Editor 中直接執行
-- =============================================================================

-- ============================================================================
-- 1. 驗證 RLS 是否啟用
-- ============================================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'audit_logs';

-- 預期結果: rls_enabled = true

-- ============================================================================
-- 2. 驗證 RLS 政策
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'audit_logs'
ORDER BY policyname;

-- 預期結果（3 條政策）:
-- policyname                          | roles           | cmd
-- ------------------------------------|-----------------|-----
-- audit_logs_deny_anon                | {anon}          | ALL
-- audit_logs_deny_authenticated       | {authenticated} | ALL
-- audit_logs_service_role_full_access | {service_role}  | ALL

-- ============================================================================
-- 3. 驗證欄位
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'audit_logs'
  AND column_name IN ('status', 'error')
ORDER BY column_name;

-- 預期結果:
-- column_name | data_type | is_nullable | column_default
-- ------------|-----------|-------------|----------------
-- error       | text      | YES         | NULL
-- status      | text      | NO          | 'success'::text

-- ============================================================================
-- 4. 驗證 CHECK constraints
-- ============================================================================
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.audit_logs'::regclass
  AND contype = 'c'
ORDER BY conname;

-- 預期結果（2 條 constraints）:
-- constraint_name         | constraint_definition
-- ------------------------|----------------------
-- audit_logs_action_check | CHECK (action IN (...))
-- audit_logs_role_check   | CHECK (role IN ('agent', 'buyer', 'system'))

-- ============================================================================
-- 5. 驗證索引
-- ============================================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'audit_logs'
ORDER BY indexname;

-- 預期結果（4 條索引 + 1 條主鍵）:
-- indexname                   | indexdef
-- ----------------------------|----------
-- audit_logs_pkey             | CREATE UNIQUE INDEX ... (id)
-- idx_audit_logs_action       | CREATE INDEX ... (action)
-- idx_audit_logs_created_at   | CREATE INDEX ... (created_at DESC)
-- idx_audit_logs_transaction_id | CREATE INDEX ... (transaction_id)
-- idx_audit_logs_user_id      | CREATE INDEX ... (user_id)

-- ============================================================================
-- 6. 驗證註解
-- ============================================================================
SELECT
  col.column_name,
  pgd.description
FROM pg_catalog.pg_statio_all_tables AS st
INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid = st.relid)
INNER JOIN information_schema.columns col ON (
  col.ordinal_position = pgd.objsubid
  AND col.table_schema = st.schemaname
  AND col.table_name = st.relname
)
WHERE st.schemaname = 'public'
  AND st.relname = 'audit_logs'
  AND col.column_name IN ('status', 'error')
ORDER BY col.column_name;

-- 預期結果:
-- column_name | description
-- ------------|------------
-- error       | 錯誤訊息（僅在 status=failed 時有值）
-- status      | 稽核日誌狀態：success=成功, failed=失敗, pending=等待中

-- ============================================================================
-- 7. 安全測試（需要在應用層測試）
-- ============================================================================

-- 測試案例 1: anon 用戶嘗試查詢（應該失敗）
-- SET ROLE anon;
-- SELECT * FROM public.audit_logs; -- 預期: 0 rows 或 permission denied

-- 測試案例 2: authenticated 用戶嘗試查詢（應該失敗）
-- SET ROLE authenticated;
-- SELECT * FROM public.audit_logs; -- 預期: 0 rows 或 permission denied

-- 測試案例 3: service_role 查詢（應該成功）
-- SET ROLE service_role;
-- SELECT * FROM public.audit_logs; -- 預期: 返回所有記錄

-- ============================================================================
-- 完成
-- ============================================================================
