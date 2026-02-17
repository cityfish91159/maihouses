-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.fn_update_trust_cases_updated_at
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.fn_update_trust_cases_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'Function public.fn_update_trust_cases_updated_at() not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.fn_update_trust_cases_updated_at() SET search_path = public, pg_temp';
END $$;

