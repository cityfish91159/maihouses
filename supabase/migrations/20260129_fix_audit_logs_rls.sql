-- =============================================================================
-- Migration: 修復 audit_logs RLS 政策 + 新增欄位
-- File: 20260129_fix_audit_logs_rls.sql
--
-- Purpose: 修復 P0 問題 - 明確 DENY anon/authenticated + 新增 status/error 欄位
--
-- 依賴: 20260129_create_audit_logs.sql
--
-- 安全改進:
-- 1. 明確禁止 anon/authenticated 存取（Default-Deny 原則）
-- 2. 新增 status 欄位追蹤日誌狀態
-- 3. 新增 error 欄位記錄失敗原因
-- 4. 新增 action 欄位 CHECK constraint 強化資料完整性
-- 5. 明確 REVOKE/GRANT 強化表級權限
-- =============================================================================

-- ============================================================================
-- 1. 新增欄位
-- ============================================================================

-- 新增 status 欄位（稽核日誌狀態）
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'failed', 'pending'));

-- 新增 error 欄位（錯誤訊息）
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS error TEXT;

-- ============================================================================
-- 2. 新增 action CHECK constraint
-- ============================================================================

-- 刪除舊 constraint（如果存在）
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- 新增 constraint 限制 action 欄位值
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (action IN (
    'CREATE_TRUST_CASE',
    'UPGRADE_TRUST_CASE',
    'UPDATE_TRUST_STEP',
    'SUBMIT_SUPPLEMENT',
    'INITIATE_PAYMENT',
    'VERIFY_PAYMENT',
    'COMPLETE_CASE',
    'ACCESS_TRUST_ROOM'
  ));

-- ============================================================================
-- 3. 清理舊政策（確保可重跑）
-- ============================================================================

DROP POLICY IF EXISTS "audit_logs_service_role_only" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_anon" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_deny_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_service_role_full_access" ON public.audit_logs;

-- ============================================================================
-- 4. 建立明確 DENY 政策（Default-Deny 原則）
-- ============================================================================

-- 禁止匿名用戶存取
-- 明確拒絕比依賴 "沒有政策 = 無權限" 更安全
CREATE POLICY "audit_logs_deny_anon"
ON public.audit_logs
FOR ALL
TO anon
USING (false);

-- 禁止已登入用戶存取
-- 稽核日誌是敏感資料，僅供系統後端使用
CREATE POLICY "audit_logs_deny_authenticated"
ON public.audit_logs
FOR ALL
TO authenticated
USING (false);

-- ============================================================================
-- 5. 建立 service_role 專屬政策
-- ============================================================================

-- 僅 service_role 可完全存取稽核日誌
-- 前端不應直接存取此表
CREATE POLICY "audit_logs_service_role_full_access"
ON public.audit_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 6. 權限防護（Defense in Depth）
-- ============================================================================

-- 明確回收前台角色權限，避免誤授權
REVOKE ALL ON TABLE public.audit_logs FROM anon, authenticated;

-- 僅允許 service_role 讀寫
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO service_role;

-- ============================================================================
-- 7. 更新註解
-- ============================================================================

COMMENT ON COLUMN public.audit_logs.status
IS '稽核日誌狀態：success=成功, failed=失敗, pending=等待中';

COMMENT ON COLUMN public.audit_logs.error
IS '錯誤訊息（僅在 status=failed 時有值）';

COMMENT ON CONSTRAINT audit_logs_action_check ON public.audit_logs
IS '限制 action 欄位僅能插入預定義的操作類型（安心留痕流程相關動作）';

-- ============================================================================
-- 8. 驗證結構與政策
-- ============================================================================

DO $$
DECLARE
  policy_count INTEGER;
  extra_policy_count INTEGER;
  has_status_column BOOLEAN;
  has_error_column BOOLEAN;
  has_action_constraint BOOLEAN;
BEGIN
  -- 檢查必要欄位是否存在
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'status'
  ) INTO has_status_column;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'error'
  ) INTO has_error_column;

  IF NOT has_status_column OR NOT has_error_column THEN
    RAISE EXCEPTION 'Required columns missing: status=% error=%', has_status_column, has_error_column;
  END IF;

  -- 檢查 action constraint 是否存在
  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.audit_logs'::regclass
      AND conname = 'audit_logs_action_check'
  ) INTO has_action_constraint;

  IF NOT has_action_constraint THEN
    RAISE EXCEPTION 'Missing constraint: audit_logs_action_check';
  END IF;

  -- 檢查必要政策數量（必須是 3 個）
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
    AND policyname IN (
      'audit_logs_deny_anon',
      'audit_logs_deny_authenticated',
      'audit_logs_service_role_full_access'
    );

  IF policy_count <> 3 THEN
    RAISE EXCEPTION 'RLS policies incomplete: expected 3, got %', policy_count;
  END IF;

  -- 檢查是否存在非預期政策
  SELECT COUNT(*) INTO extra_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'audit_logs'
    AND policyname NOT IN (
      'audit_logs_deny_anon',
      'audit_logs_deny_authenticated',
      'audit_logs_service_role_full_access'
    );

  IF extra_policy_count > 0 THEN
    RAISE EXCEPTION 'Unexpected audit_logs policies found: %', extra_policy_count;
  END IF;

  RAISE NOTICE 'audit_logs hardening verified: columns, constraint, and 3 policies are valid';
END $$;

-- ============================================================================
-- 完成
-- ============================================================================
--
-- 驗證指令：
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'audit_logs';
-- 預期結果: rowsecurity = true
--
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'audit_logs';
-- 預期結果:
--   audit_logs_deny_anon                | {anon}          | ALL
--   audit_logs_deny_authenticated       | {authenticated} | ALL
--   audit_logs_service_role_full_access | {service_role}  | ALL
--
-- =============================================================================
