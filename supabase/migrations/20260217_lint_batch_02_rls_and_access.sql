-- ============================================================================
-- Lint Batch 02: RLS and Data API access hardening
-- Purpose: Consolidate 20260217 RLS/access fixes into one migration
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- communities: remove always-true insert/update policies
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'communities'
  ) THEN
    EXECUTE 'ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can create communities" ON public.communities';
    EXECUTE
      'CREATE POLICY "Authenticated users can create communities" ON public.communities ' ||
      'FOR INSERT TO authenticated WITH CHECK (' ||
      'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''agent'', ''official'', ''admin''))' ||
      ')';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can update communities" ON public.communities';
    EXECUTE
      'CREATE POLICY "Authenticated users can update communities" ON public.communities ' ||
      'FOR UPDATE TO authenticated USING (' ||
      'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''agent'', ''official'', ''admin''))' ||
      ') WITH CHECK (' ||
      'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN (''agent'', ''official'', ''admin''))' ||
      ')';

    EXECUTE 'REVOKE INSERT, UPDATE ON TABLE public.communities FROM anon';
    EXECUTE 'GRANT INSERT, UPDATE ON TABLE public.communities TO authenticated';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- godview_messages: remove anonymous delete access
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'godview_messages'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete godview_messages" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can delete godview_messages" ON public.godview_messages';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'godview_messages'
        AND cmd = 'DELETE'
        AND roles && ARRAY['anon'::name, 'public'::name]
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.godview_messages', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'REVOKE DELETE ON public.godview_messages FROM anon';
    EXECUTE 'REVOKE DELETE ON public.godview_messages FROM public';
    EXECUTE 'GRANT DELETE ON public.godview_messages TO service_role';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- migration_logs: default deny for anon/authenticated
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'migration_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.migration_logs ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "migration_logs_deny_anon" ON public.migration_logs';
    EXECUTE 'DROP POLICY IF EXISTS "migration_logs_deny_authenticated" ON public.migration_logs';

    EXECUTE
      'CREATE POLICY "migration_logs_deny_anon" ON public.migration_logs ' ||
      'AS RESTRICTIVE FOR ALL TO anon USING (false) WITH CHECK (false)';

    EXECUTE
      'CREATE POLICY "migration_logs_deny_authenticated" ON public.migration_logs ' ||
      'AS RESTRICTIVE FOR ALL TO authenticated USING (false) WITH CHECK (false)';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- user_progress: replace permissive policies with ownership policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  policy_row RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'user_progress'
  ) THEN
    EXECUTE 'ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY';

    FOR policy_row IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'user_progress'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_progress', policy_row.policyname);
    END LOOP;

    EXECUTE
      'CREATE POLICY user_progress_select_own ON public.user_progress ' ||
      'FOR SELECT TO authenticated USING (user_id = auth.uid()::text)';

    EXECUTE
      'CREATE POLICY user_progress_insert_own ON public.user_progress ' ||
      'FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text)';

    EXECUTE
      'CREATE POLICY user_progress_update_own ON public.user_progress ' ||
      'FOR UPDATE TO authenticated USING (user_id = auth.uid()::text) ' ||
      'WITH CHECK (user_id = auth.uid()::text)';

    EXECUTE 'REVOKE ALL ON TABLE public.user_progress FROM PUBLIC, anon';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE ON TABLE public.user_progress TO authenticated';
    EXECUTE 'GRANT ALL ON TABLE public.user_progress TO service_role';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- uag_lead_rankings matview: block Data API roles
-- --------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND matviewname = 'uag_lead_rankings'
  ) THEN
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM anon';
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM authenticated';
    EXECUTE 'REVOKE ALL ON TABLE public.uag_lead_rankings FROM public';
    EXECUTE 'GRANT SELECT ON TABLE public.uag_lead_rankings TO service_role';
  END IF;
END $$;

COMMIT;

