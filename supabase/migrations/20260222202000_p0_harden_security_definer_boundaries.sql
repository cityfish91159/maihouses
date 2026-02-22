-- ============================================================================
-- P0 hardening: tighten SECURITY DEFINER boundaries for UAG stats RPC
-- Date: 2026-02-22
-- ============================================================================

BEGIN;

DO $$
DECLARE
  fn_signature TEXT;
BEGIN
  FOR fn_signature IN
    SELECT p.oid::regprocedure::text
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_property_stats_optimized'
      AND p.prokind = 'f'
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      fn_signature
    );

    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC',
      fn_signature
    );

    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO authenticated',
      fn_signature
    );

    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION %s TO service_role',
      fn_signature
    );

    EXECUTE format(
      'COMMENT ON FUNCTION %s IS %L',
      fn_signature,
      'P0 hardening: SECURITY DEFINER boundary tightened (search_path + explicit EXECUTE grants)'
    );
  END LOOP;
END $$;

COMMIT;

