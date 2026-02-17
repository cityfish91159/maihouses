-- ============================================================================
-- Fix: user_progress RLS overly permissive policies
-- Issue: UPDATE/INSERT/DELETE policies used true expressions, bypassing RLS
-- ============================================================================

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on user_progress to avoid OR-bypass
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  FOR policy_row IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_progress'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_progress', policy_row.policyname);
  END LOOP;
END $$;

-- Recreate secure, ownership-based policies
CREATE POLICY user_progress_select_own
ON public.user_progress
FOR SELECT
TO authenticated
USING (user_id = auth.uid()::text);

CREATE POLICY user_progress_insert_own
ON public.user_progress
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY user_progress_update_own
ON public.user_progress
FOR UPDATE
TO authenticated
USING (user_id = auth.uid()::text)
WITH CHECK (user_id = auth.uid()::text);

-- Tighten table privileges
REVOKE ALL ON TABLE public.user_progress FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.user_progress TO authenticated;
GRANT ALL ON TABLE public.user_progress TO service_role;

COMMIT;

-- Verification query
-- SELECT policyname, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'user_progress'
-- ORDER BY policyname;

