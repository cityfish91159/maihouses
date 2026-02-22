-- ============================================================================
-- Step 40: P0 Security Verification (read-only)
-- ============================================================================

-- 1) Detect fail-open insert policies on target tables
WITH fail_open_insert AS (
  SELECT
    p.schemaname,
    p.tablename,
    p.policyname,
    p.cmd,
    p.roles,
    p.with_check
  FROM pg_policies p
  WHERE p.schemaname = 'public'
    AND p.tablename IN ('shadow_logs', 'rival_decoder')
    AND p.cmd = 'INSERT'
    AND regexp_replace(COALESCE(p.with_check, ''), '[[:space:]()]', '', 'g') = 'true'
)
SELECT
  'FAIL_OPEN_INSERT_POLICIES' AS section,
  schemaname,
  tablename,
  policyname,
  cmd,
  roles,
  with_check
FROM fail_open_insert
ORDER BY tablename, policyname;

-- 2) Verify target insert policies exist
SELECT
  'P0_INSERT_POLICIES' AS section,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shadow_logs'
      AND policyname = 'shadow_logs_insert_p0_guarded'
  ) AS shadow_logs_insert_p0_guarded_exists,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rival_decoder'
      AND policyname = 'rival_decoder_insert_p0_guarded'
  ) AS rival_decoder_insert_p0_guarded_exists;

-- 3) Verify function boundary hardening for get_property_stats_optimized
WITH target_functions AS (
  SELECT
    p.oid,
    p.oid::regprocedure::text AS signature,
    COALESCE(array_to_string(p.proconfig, ', '), '') AS proconfig
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_property_stats_optimized'
    AND p.prokind = 'f'
)
SELECT
  'FUNCTION_BOUNDARY' AS section,
  tf.signature,
  (tf.proconfig ILIKE '%search_path=public, pg_temp%') AS search_path_hardened,
  NOT EXISTS (
    SELECT 1
    FROM information_schema.role_routine_grants g
    WHERE g.specific_schema = 'public'
      AND g.routine_name = 'get_property_stats_optimized'
      AND g.grantee = 'PUBLIC'
      AND g.privilege_type = 'EXECUTE'
  ) AS public_execute_revoked,
  EXISTS (
    SELECT 1
    FROM information_schema.role_routine_grants g
    WHERE g.specific_schema = 'public'
      AND g.routine_name = 'get_property_stats_optimized'
      AND g.grantee = 'authenticated'
      AND g.privilege_type = 'EXECUTE'
  ) AS authenticated_execute_granted,
  EXISTS (
    SELECT 1
    FROM information_schema.role_routine_grants g
    WHERE g.specific_schema = 'public'
      AND g.routine_name = 'get_property_stats_optimized'
      AND g.grantee = 'service_role'
      AND g.privilege_type = 'EXECUTE'
  ) AS service_role_execute_granted
FROM target_functions tf
ORDER BY tf.signature;

-- 4) One-line summary
SELECT
  'P0_SECURITY_SUMMARY' AS section,
  NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename IN ('shadow_logs', 'rival_decoder')
      AND p.cmd = 'INSERT'
      AND regexp_replace(COALESCE(p.with_check, ''), '[[:space:]()]', '', 'g') = 'true'
  ) AS no_fail_open_insert_policy,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shadow_logs'
      AND policyname = 'shadow_logs_insert_p0_guarded'
  ) AS shadow_logs_insert_policy_ok,
  EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rival_decoder'
      AND policyname = 'rival_decoder_insert_p0_guarded'
  ) AS rival_decoder_insert_policy_ok,
  NOT EXISTS (
    SELECT 1
    FROM information_schema.role_routine_grants g
    WHERE g.specific_schema = 'public'
      AND g.routine_name = 'get_property_stats_optimized'
      AND g.grantee = 'PUBLIC'
      AND g.privilege_type = 'EXECUTE'
  ) AS function_public_execute_revoked,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_property_stats_optimized'
      AND COALESCE(array_to_string(p.proconfig, ', '), '') ILIKE '%search_path=public, pg_temp%'
  ) AS function_search_path_hardened;

