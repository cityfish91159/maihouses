-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.update_push_subscriptions_updated_at
-- ============================================================================

DO $$
BEGIN
  IF to_regprocedure('public.update_push_subscriptions_updated_at()') IS NULL THEN
    RAISE EXCEPTION 'Function public.update_push_subscriptions_updated_at() not found';
  END IF;

  EXECUTE 'ALTER FUNCTION public.update_push_subscriptions_updated_at() SET search_path = public, pg_temp';
END $$;

