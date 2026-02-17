-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.fn_update_agent_trust_score
-- ============================================================================

DO $$
DECLARE
  fn RECORD;
  hit_count INTEGER := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'fn_update_agent_trust_score'
  LOOP
    hit_count := hit_count + 1;
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      fn.signature
    );
  END LOOP;

  IF hit_count = 0 THEN
    RAISE EXCEPTION 'Function public.fn_update_agent_trust_score not found';
  END IF;
END $$;

