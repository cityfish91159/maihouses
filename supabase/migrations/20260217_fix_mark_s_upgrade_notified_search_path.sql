-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.mark_s_upgrade_notified
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.mark_s_upgrade_notified(text)') IS NULL THEN
    RAISE EXCEPTION 'Function public.mark_s_upgrade_notified(text) not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.mark_s_upgrade_notified(text) SET search_path = public, pg_temp';
END $$;

