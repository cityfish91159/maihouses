-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.fn_calculate_trust_score
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.fn_calculate_trust_score(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Function public.fn_calculate_trust_score(uuid) not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.fn_calculate_trust_score(uuid) SET search_path = public, pg_temp';
END $$;

