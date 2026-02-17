-- ==============================================================================
-- Fix: migration_logs RLS policies
--
-- 背景：migration_logs 是 Supabase CLI 系統表，記錄 migration 執行歷史。
-- 只有 service_role（Supabase CLI / server-side）需要存取。
-- anon / authenticated 不應能讀取（避免洩漏 DB schema 結構版本資訊）。
--
-- RLS 已在 20251127_fix_migration_logs_rls.sql 啟用，
-- 本 migration 補上明確 policy，消除 Linter 警告。
--
-- 注意：service_role 不受 RLS 限制，無需額外 policy。
-- ==============================================================================

-- anon：完全禁止（無論讀寫）
CREATE POLICY "migration_logs_deny_anon"
ON public.migration_logs
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- authenticated：完全禁止（一般使用者不應知道 DB migration 版本）
CREATE POLICY "migration_logs_deny_authenticated"
ON public.migration_logs
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
