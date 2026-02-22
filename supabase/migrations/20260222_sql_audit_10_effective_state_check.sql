-- ============================================================================
-- Step 10: Effective DB State Check (read-only)
-- ============================================================================
SELECT
  current_database() AS db_name,
  current_user AS db_user,
  now() AS executed_at,
  EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'community_members'
      AND indexname = 'idx_community_members_active_latest_covering'
  ) AS idx_new_ok,
  NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'community_members'
      AND indexname = 'idx_community_members_user_status_joined_created'
  ) AS idx_old_removed,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'toggle_like'
      AND p.prosecdef = true
  ) AS toggle_like_is_security_definer,
  EXISTS (
    SELECT 1
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'toggle_like'
      AND COALESCE(array_to_string(p.proconfig, ','), '') ILIKE '%search_path=public, pg_temp%'
  ) AS toggle_like_search_path_ok,
  EXISTS (
    SELECT 1
    FROM information_schema.role_routine_grants r
    WHERE r.specific_schema = 'public'
      AND r.routine_name = 'toggle_like'
      AND r.grantee = 'authenticated'
      AND r.privilege_type = 'EXECUTE'
  ) AS toggle_like_grant_authenticated_ok,
  EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'properties'
      AND p.policyname = 'properties_select_public'
  ) AS properties_policy_ok,
  EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'shadow_logs'
      AND p.policyname = 'shadow_logs_select_owner_or_admin'
  ) AS shadow_logs_policy_ok,
  EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'godview_messages'
      AND p.policyname = 'godview_messages_select_owner_or_admin'
  ) AS godview_messages_policy_ok;

