-- ============================================================================
-- Fix: Function search_path mutable warning
-- Entity: public.log_transaction_changes
-- ============================================================================

DO $$
DECLARE
  fn RECORD;
  found_count INTEGER := 0;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure::text AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'log_transaction_changes'
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn.signature);
    found_count := found_count + 1;
  END LOOP;

  IF found_count = 0 THEN
    RAISE EXCEPTION 'Function public.log_transaction_changes(*) not found';
  END IF;
END $$;

