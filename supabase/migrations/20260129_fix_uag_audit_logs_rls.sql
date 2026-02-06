-- ============================================================================
-- Migration: 修復 uag_audit_logs RLS 漏洞
--
-- Purpose: 緊急修復 P0 安全問題 - 啟用 RLS + 建立 Default-Deny 政策
--
-- 問題描述:
-- - uag_audit_logs 表未啟用 RLS，導致任何已登入用戶都可查詢所有房仲的 RPC 呼叫記錄
-- - request/response 欄位可能包含敏感資料（例如：客戶資料、錯誤訊息）
-- - 違反最小權限原則和 Default-Deny 安全架構
--
-- 修復方案:
-- 1. 啟用 Row Level Security
-- 2. 建立明確 DENY 政策（anon + authenticated）
-- 3. 建立 service_role 專屬政策
-- 4. 新增效能索引
-- 5. 新增欄位註解
-- 6. 驗證 RLS 政策
-- ============================================================================

-- ============================================================================
-- 1. 啟用 Row Level Security
-- ============================================================================

ALTER TABLE public.uag_audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. 建立明確 DENY 政策（Default-Deny 原則）
-- ============================================================================

-- 禁止匿名用戶存取
CREATE POLICY "uag_audit_logs_deny_anon"
ON public.uag_audit_logs FOR ALL TO anon
USING (false);

-- 禁止已登入用戶存取（包括房仲）
CREATE POLICY "uag_audit_logs_deny_authenticated"
ON public.uag_audit_logs FOR ALL TO authenticated
USING (false);

-- ============================================================================
-- 3. 建立 service_role 專屬政策
-- ============================================================================

-- 僅允許 service_role 完整存取（後端 API 使用）
CREATE POLICY "uag_audit_logs_service_role_full_access"
ON public.uag_audit_logs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- ============================================================================
-- 4. 新增索引優化查詢效能
-- ============================================================================

-- agent_id 索引（已存在，跳過）
-- CREATE INDEX IF NOT EXISTS idx_audit_agent ON public.uag_audit_logs(agent_id);

-- 時間降序索引（優化稽核日誌時間範圍查詢）
CREATE INDEX IF NOT EXISTS idx_uag_audit_logs_created_at
ON public.uag_audit_logs (created_at DESC);

-- session_id 索引（優化單一交易追蹤，過濾 NULL）
CREATE INDEX IF NOT EXISTS idx_uag_audit_logs_session_id
ON public.uag_audit_logs (session_id)
WHERE session_id IS NOT NULL;

-- ============================================================================
-- 5. 新增註解
-- ============================================================================

COMMENT ON TABLE public.uag_audit_logs IS 'UAG 業務廣告稽核日誌 - 僅 service_role 可存取，包含所有 RPC 呼叫記錄';
COMMENT ON COLUMN public.uag_audit_logs.request IS 'RPC 請求參數（JSONB）- 可能含敏感資料，禁止前端存取';
COMMENT ON COLUMN public.uag_audit_logs.response IS 'RPC 回應內容（JSONB）- 可能含錯誤訊息，禁止前端存取';
COMMENT ON COLUMN public.uag_audit_logs.error_code IS '錯誤代碼（例如：INSUFFICIENT_BALANCE, ALREADY_PURCHASED）';

-- ============================================================================
-- 6. 驗證 RLS 政策
-- ============================================================================

DO $$
DECLARE
  rls_enabled BOOLEAN;
  policy_count INTEGER;
BEGIN
  -- 檢查 RLS 是否啟用
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE oid = 'public.uag_audit_logs'::regclass;

  IF NOT rls_enabled THEN
    RAISE EXCEPTION '❌ RLS not enabled on uag_audit_logs';
  END IF;

  -- 檢查政策數量（應該有 3 個：deny_anon, deny_authenticated, service_role_full_access）
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'uag_audit_logs';

  IF policy_count < 3 THEN
    RAISE EXCEPTION '❌ Insufficient RLS policies: expected 3, got %', policy_count;
  END IF;

  RAISE NOTICE '✅ uag_audit_logs RLS verified: % policies active', policy_count;
END $$;
