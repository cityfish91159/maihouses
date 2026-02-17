-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.get_s_grade_upgrades
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.get_s_grade_upgrades(text,integer)') IS NULL THEN
    RAISE EXCEPTION 'Function public.get_s_grade_upgrades(text,integer) not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.get_s_grade_upgrades(text,integer) SET search_path = public, pg_temp';
END $$;

