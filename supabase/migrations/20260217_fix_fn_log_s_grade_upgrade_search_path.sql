-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.fn_log_s_grade_upgrade
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.fn_log_s_grade_upgrade()') IS NULL THEN
    RAISE EXCEPTION 'Function public.fn_log_s_grade_upgrade() not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.fn_log_s_grade_upgrade() SET search_path = public, pg_temp';
END $$;

