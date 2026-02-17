-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.get_trust_room_by_token
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
      AND p.proname = 'get_trust_room_by_token'
  LOOP
    hit_count := hit_count + 1;
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      fn.signature
    );
  END LOOP;

  IF hit_count = 0 THEN
    RAISE EXCEPTION 'Function public.get_trust_room_by_token not found';
  END IF;
END $$;

