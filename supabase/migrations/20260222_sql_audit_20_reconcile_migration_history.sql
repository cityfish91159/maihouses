-- ============================================================================
-- Step 20: Reconcile migration history entries (SQL-only, idempotent)
-- ============================================================================
DO $$
DECLARE
  has_name BOOLEAN;
  has_statements BOOLEAN;
  target_version TEXT;
  target_name TEXT;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'supabase_migrations'
      AND table_name = 'schema_migrations'
      AND column_name = 'name'
  ) INTO has_name;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'supabase_migrations'
      AND table_name = 'schema_migrations'
      AND column_name = 'statements'
  ) INTO has_statements;

  FOR target_version, target_name IN
    SELECT *
    FROM (
      VALUES
        ('20260221170000', '20260221170000_sql_logic_security_hardening_followup.sql'),
        ('20260221174000', '20260221174000_p0_rls_ownership_failsafe_fix.sql'),
        ('20260222193000', '20260222193000_community_members_latest_lookup_index.sql'),
        ('20260222194000', '20260222194000_community_members_active_latest_partial_covering_index.sql')
    ) AS t(version, name)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM supabase_migrations.schema_migrations sm
      WHERE sm.version::text = target_version
         OR sm.version::text LIKE target_version || '%'
         OR COALESCE(to_jsonb(sm) ->> 'name', '') = target_name
         OR COALESCE(to_jsonb(sm) ->> 'name', '') LIKE target_version || '%'
    ) THEN
      CONTINUE;
    END IF;

    IF has_name AND has_statements THEN
      EXECUTE format(
        'INSERT INTO supabase_migrations.schema_migrations(version, name, statements) VALUES (%L, %L, ARRAY[]::text[])',
        target_version,
        target_name
      );
    ELSIF has_name THEN
      EXECUTE format(
        'INSERT INTO supabase_migrations.schema_migrations(version, name) VALUES (%L, %L)',
        target_version,
        target_name
      );
    ELSIF has_statements THEN
      EXECUTE format(
        'INSERT INTO supabase_migrations.schema_migrations(version, statements) VALUES (%L, ARRAY[]::text[])',
        target_version
      );
    ELSE
      EXECUTE format(
        'INSERT INTO supabase_migrations.schema_migrations(version) VALUES (%L)',
        target_version
      );
    END IF;
  END LOOP;
END $$;

