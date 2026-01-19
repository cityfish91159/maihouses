-- =============================================================================
-- Trust Cases Agent ID Constraint Enhancement
-- Migration: 20260120_trust_cases_agent_id_constraint.sql
--
-- [draconian_rls_audit] 加強 agent_id 約束
-- 目標: 確保 agent_id 格式正確且關聯有效
-- =============================================================================

-- ============================================================================
-- 1. 添加 agent_id 格式檢查約束
-- 使用 UUID 格式驗證 (Supabase auth.uid() 返回 UUID)
-- ============================================================================

-- 檢查是否已存在約束，避免重複建立
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_cases_agent_id_uuid_format'
  ) THEN
    ALTER TABLE public.trust_cases
    ADD CONSTRAINT trust_cases_agent_id_uuid_format
    CHECK (agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

    RAISE NOTICE '[draconian_rls_audit] Added UUID format constraint to agent_id';
  END IF;
END $$;

-- ============================================================================
-- 2. 添加 agent_id 不可為空字串約束
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'trust_cases_agent_id_not_empty'
  ) THEN
    ALTER TABLE public.trust_cases
    ADD CONSTRAINT trust_cases_agent_id_not_empty
    CHECK (agent_id <> '');

    RAISE NOTICE '[draconian_rls_audit] Added not-empty constraint to agent_id';
  END IF;
END $$;

-- ============================================================================
-- 3. 創建索引以支援 RLS 政策效能
-- ============================================================================

-- 為 agent_id 建立 hash index (適合等值查詢)
CREATE INDEX IF NOT EXISTS idx_trust_cases_agent_id_hash
ON public.trust_cases USING hash (agent_id);

COMMENT ON INDEX idx_trust_cases_agent_id_hash
IS '[draconian_rls_audit] Hash index for efficient RLS policy evaluation';

-- ============================================================================
-- 4. 更新 RLS 政策 - 使用 WITH CHECK 確保雙向驗證
-- ============================================================================

-- 重新建立更嚴格的 RLS 政策
DROP POLICY IF EXISTS "trust_cases_agent_select" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_agent_insert" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_agent_update" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_agent_delete" ON public.trust_cases;

-- SELECT: 房仲只能查詢自己的案件
CREATE POLICY "trust_cases_agent_select"
ON public.trust_cases
FOR SELECT
TO authenticated
USING (
  agent_id = auth.uid()::TEXT
  AND agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- INSERT: 房仲只能建立自己的案件 (WITH CHECK 必須)
CREATE POLICY "trust_cases_agent_insert"
ON public.trust_cases
FOR INSERT
TO authenticated
WITH CHECK (
  agent_id = auth.uid()::TEXT
  AND agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- UPDATE: 房仲只能更新自己的案件 (USING + WITH CHECK)
CREATE POLICY "trust_cases_agent_update"
ON public.trust_cases
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid()::TEXT)
WITH CHECK (
  agent_id = auth.uid()::TEXT
  AND agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
);

-- DELETE: 明確禁止刪除 (改用 status = 'cancelled')
-- [draconian_rls_audit] 刪除操作應該被審計，使用 soft delete
CREATE POLICY "trust_cases_agent_delete"
ON public.trust_cases
FOR DELETE
TO authenticated
USING (false); -- 永遠拒絕直接刪除

COMMENT ON POLICY "trust_cases_agent_delete" ON public.trust_cases
IS '[draconian_rls_audit] 禁止直接刪除，使用 soft delete (status = cancelled)';

-- ============================================================================
-- 5. 記錄 Migration 完成
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '[draconian_rls_audit] Migration 20260120_trust_cases_agent_id_constraint completed';
  RAISE NOTICE 'Added: UUID format check, not-empty check, hash index, strict RLS policies';
END $$;
