-- ============================================================================
-- Step 30: Final Summary (read-only)
-- ============================================================================
SELECT
  c.applied_count,
  4 AS target_count,
  CASE WHEN c.applied_count = 4 THEN 'OK' ELSE 'CHECK_REQUIRED' END AS migration_ok,
  i.has_new_partial_covering_index,
  i.has_old_legacy_index
FROM (
  SELECT
    (
      CASE WHEN EXISTS (
        SELECT 1 FROM supabase_migrations.schema_migrations sm
        WHERE sm.version::text LIKE '20260221170000%'
      ) THEN 1 ELSE 0 END
      +
      CASE WHEN EXISTS (
        SELECT 1 FROM supabase_migrations.schema_migrations sm
        WHERE sm.version::text LIKE '20260221174000%'
      ) THEN 1 ELSE 0 END
      +
      CASE WHEN EXISTS (
        SELECT 1 FROM supabase_migrations.schema_migrations sm
        WHERE sm.version::text LIKE '20260222193000%'
      ) THEN 1 ELSE 0 END
      +
      CASE WHEN EXISTS (
        SELECT 1 FROM supabase_migrations.schema_migrations sm
        WHERE sm.version::text LIKE '20260222194000%'
      ) THEN 1 ELSE 0 END
    ) AS applied_count
) AS c
CROSS JOIN (
  SELECT
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'community_members'
        AND indexname = 'idx_community_members_active_latest_covering'
    ) AS has_new_partial_covering_index,
    EXISTS (
      SELECT 1
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'community_members'
        AND indexname = 'idx_community_members_user_status_joined_created'
    ) AS has_old_legacy_index
) AS i;

