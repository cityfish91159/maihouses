-- ============================================================================
-- Lint Batch 01: Function search_path hardening
-- Purpose: Consolidate 20260217 per-function fixes into one migration
-- ============================================================================

DO $fix$
DECLARE
  fn RECORD;
  updated_count INTEGER := 0;
BEGIN
  FOR fn IN
    SELECT
      p.oid::regprocedure::text AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    JOIN pg_language l ON l.oid = p.prolang
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND l.lanname IN ('plpgsql', 'sql')
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(COALESCE(p.proconfig, ARRAY[]::TEXT[])) AS cfg
        WHERE cfg LIKE 'search_path=%'
      )
    ORDER BY p.oid
  LOOP
    EXECUTE format(
      'ALTER FUNCTION %s SET search_path = public, pg_temp',
      fn.signature
    );
    updated_count := updated_count + 1;
  END LOOP;

  RAISE NOTICE 'search_path hardened for % function signature(s)', updated_count;
END
$fix$;
