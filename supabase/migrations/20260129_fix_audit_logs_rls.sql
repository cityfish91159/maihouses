-- =============================================================================
-- Migration: 修復 audit_logs RLS 政策 + 新增欄位
-- File: 20260129_fix_audit_logs_rls.sql
--
-- Purpose: 修復 P0 問題 - 明確 DENY anon/authenticated + 補齊 status/error/role 欄位
--
-- 依賴: 20260129_create_audit_logs.sql
--
-- 安全改進:
-- 1. 明確禁止 anon/authenticated 存取（Default-Deny 原則）
-- 2. 新增 status 欄位追蹤日誌狀態
-- 3. 新增 error 欄位記錄失敗原因
-- 4. 補齊 role 欄位（相容舊環境）
-- 5. 收斂 action/status/role CHECK constraint 強化資料完整性
-- 6. 明確 REVOKE/GRANT 強化表級權限
-- =============================================================================

-- ============================================================================
-- 1. 新增欄位
-- ============================================================================

-- 新增 status 欄位（稽核日誌狀態）
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';

-- 新增 error 欄位（錯誤訊息）
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS error TEXT;

-- 補齊 role 欄位（相容舊環境）
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS role TEXT;

-- 舊資料回填預設狀態
UPDATE public.audit_logs
SET status = 'success'
WHERE status IS NULL;

-- status 欄位收斂為 NOT NULL + DEFAULT
ALTER TABLE public.audit_logs
  ALTER COLUMN status SET DEFAULT 'success';

ALTER TABLE public.audit_logs
  ALTER COLUMN status SET NOT NULL;

-- 舊資料回填預設角色
UPDATE public.audit_logs
SET role = 'system'
WHERE role IS NULL;

-- role 欄位收斂為 NOT NULL + DEFAULT
ALTER TABLE public.audit_logs
  ALTER COLUMN role SET DEFAULT 'system';

ALTER TABLE public.audit_logs
  ALTER COLUMN role SET NOT NULL;

-- ============================================================================
-- 2. 收斂 CHECK constraints
-- ============================================================================

-- 刪除舊 constraint（如果存在）
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_action_check;

-- 新增 constraint 限制 action 欄位值
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_action_check
  CHECK (
    action ~ '^(CREATE_TRUST_CASE|UPGRADE_TRUST_CASE|UPDATE_TRUST_STEP|SUBMIT_SUPPLEMENT|ADD_SUPPLEMENT|AUTO_CREATE_CASE|PAYMENT_COMPLETED|ACCESS_TRUST_ROOM|INITIATE_PAYMENT|VERIFY_PAYMENT|COMPLETE_CASE|AGENT_SUBMIT_[0-9]+|BUYER_CONFIRM_[0-9]+|UPDATE_TRUST_CASE_STEP_[0-9]+|WAKE_TRUST_CASE_(AGENT|BUYER|SYSTEM)|CLOSE_TRUST_CASE_(JWT|SYSTEM)|COMPLETE_BUYER_INFO_(JWT|SYSTEM))$'
  );

-- 收斂 status CHECK constraint
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_status_check;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_status_check
  CHECK (status IN ('success', 'failed', 'pending'));

-- 補齊 role CHECK constraint
ALTER TABLE public.audit_logs
  DROP CONSTRAINT IF EXISTS audit_logs_role_check;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_role_check
  CHECK (role IN ('agent', 'buyer', 'system'));

-- ============================================================================
-- 3. 清理舊政策（確保可重跑）
-- ============================================================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'audit_logs'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.audit_logs', policy_record.policyname);
  END LOOP;
END $$;

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

-- 先清空可疑舊授權，再精準授權
REVOKE ALL ON TABLE public.audit_logs FROM PUBLIC, anon, authenticated, service_role;

-- 僅允許 service_role 讀寫
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO service_role;

-- ============================================================================
-- 7. 更新註解
-- ============================================================================

COMMENT ON COLUMN public.audit_logs.status
IS '稽核日誌狀態：success=成功, failed=失敗, pending=等待中';

COMMENT ON COLUMN public.audit_logs.error
IS '錯誤訊息（僅在 status=failed 時有值）';

COMMENT ON COLUMN public.audit_logs.role
IS '用戶角色：agent=房仲, buyer=買方, system=系統';

COMMENT ON CONSTRAINT audit_logs_action_check ON public.audit_logs
IS '限制 action 欄位為 trust 稽核允許事件（含固定事件與動態前綴事件）';

COMMENT ON CONSTRAINT audit_logs_status_check ON public.audit_logs
IS '限制 status 欄位僅能為 success / failed / pending';

-- ============================================================================
-- 8. 驗證交由 verify 腳本執行
-- ============================================================================
-- 為避免 SQL Editor 在長 DO 區塊中的貼上/選取截斷問題，
-- 此 migration 僅做「修復動作」，驗證請執行：
--   supabase/migrations/20260129_verify_audit_logs_rls.sql

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
