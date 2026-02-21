-- ============================================================================
-- Lint Batch 04: RLS policy performance cleanup
-- Purpose:
--   1) Fix auth_rls_initplan warnings by wrapping auth/current_setting calls
--      with SELECT in RLS policies.
--   2) Consolidate known duplicated permissive SELECT policies.
--   3) Remove duplicate index flagged by Supabase linter.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) Wrap auth/current_setting calls in all public RLS policies
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  policy_row RECORD;
  new_qual TEXT;
  new_check TEXT;
BEGIN
  FOR policy_row IN
    SELECT schemaname, tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    new_qual := policy_row.qual;
    new_check := policy_row.with_check;

    IF new_qual IS NOT NULL THEN
      -- Protect already-wrapped expressions
      new_qual := replace(new_qual, '(select auth.uid())', '__MH_AUTH_UID__');
      new_qual := replace(new_qual, '(select auth.role())', '__MH_AUTH_ROLE__');
      new_qual := replace(new_qual, '(select auth.jwt())', '__MH_AUTH_JWT__');
      new_qual := replace(new_qual, '(select auth.email())', '__MH_AUTH_EMAIL__');
      new_qual := replace(
        new_qual,
        '(select current_setting(''request.jwt.claims'', true))',
        '__MH_CURRENT_SETTING_JWT__'
      );
      new_qual := replace(
        new_qual,
        '(select current_setting(''app.session_id'', true))',
        '__MH_CURRENT_SETTING_APP_SESSION__'
      );

      -- Apply lint recommendation
      new_qual := regexp_replace(new_qual, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.role\(\)', '(select auth.role())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_qual := regexp_replace(new_qual, 'auth\.email\(\)', '(select auth.email())', 'g');
      new_qual := regexp_replace(
        new_qual,
        'current_setting\(''request\.jwt\.claims'',\s*true\)',
        '(select current_setting(''request.jwt.claims'', true))',
        'g'
      );
      new_qual := regexp_replace(
        new_qual,
        'current_setting\(''app\.session_id'',\s*true\)',
        '(select current_setting(''app.session_id'', true))',
        'g'
      );

      -- Restore placeholders
      new_qual := replace(new_qual, '__MH_AUTH_UID__', '(select auth.uid())');
      new_qual := replace(new_qual, '__MH_AUTH_ROLE__', '(select auth.role())');
      new_qual := replace(new_qual, '__MH_AUTH_JWT__', '(select auth.jwt())');
      new_qual := replace(new_qual, '__MH_AUTH_EMAIL__', '(select auth.email())');
      new_qual := replace(
        new_qual,
        '__MH_CURRENT_SETTING_JWT__',
        '(select current_setting(''request.jwt.claims'', true))'
      );
      new_qual := replace(
        new_qual,
        '__MH_CURRENT_SETTING_APP_SESSION__',
        '(select current_setting(''app.session_id'', true))'
      );
    END IF;

    IF new_check IS NOT NULL THEN
      -- Protect already-wrapped expressions
      new_check := replace(new_check, '(select auth.uid())', '__MH_AUTH_UID__');
      new_check := replace(new_check, '(select auth.role())', '__MH_AUTH_ROLE__');
      new_check := replace(new_check, '(select auth.jwt())', '__MH_AUTH_JWT__');
      new_check := replace(new_check, '(select auth.email())', '__MH_AUTH_EMAIL__');
      new_check := replace(
        new_check,
        '(select current_setting(''request.jwt.claims'', true))',
        '__MH_CURRENT_SETTING_JWT__'
      );
      new_check := replace(
        new_check,
        '(select current_setting(''app.session_id'', true))',
        '__MH_CURRENT_SETTING_APP_SESSION__'
      );

      -- Apply lint recommendation
      new_check := regexp_replace(new_check, 'auth\.uid\(\)', '(select auth.uid())', 'g');
      new_check := regexp_replace(new_check, 'auth\.role\(\)', '(select auth.role())', 'g');
      new_check := regexp_replace(new_check, 'auth\.jwt\(\)', '(select auth.jwt())', 'g');
      new_check := regexp_replace(new_check, 'auth\.email\(\)', '(select auth.email())', 'g');
      new_check := regexp_replace(
        new_check,
        'current_setting\(''request\.jwt\.claims'',\s*true\)',
        '(select current_setting(''request.jwt.claims'', true))',
        'g'
      );
      new_check := regexp_replace(
        new_check,
        'current_setting\(''app\.session_id'',\s*true\)',
        '(select current_setting(''app.session_id'', true))',
        'g'
      );

      -- Restore placeholders
      new_check := replace(new_check, '__MH_AUTH_UID__', '(select auth.uid())');
      new_check := replace(new_check, '__MH_AUTH_ROLE__', '(select auth.role())');
      new_check := replace(new_check, '__MH_AUTH_JWT__', '(select auth.jwt())');
      new_check := replace(new_check, '__MH_AUTH_EMAIL__', '(select auth.email())');
      new_check := replace(
        new_check,
        '__MH_CURRENT_SETTING_JWT__',
        '(select current_setting(''request.jwt.claims'', true))'
      );
      new_check := replace(
        new_check,
        '__MH_CURRENT_SETTING_APP_SESSION__',
        '(select current_setting(''app.session_id'', true))'
      );
    END IF;

    IF new_qual IS DISTINCT FROM policy_row.qual THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I USING (%s)',
        policy_row.policyname,
        policy_row.schemaname,
        policy_row.tablename,
        new_qual
      );
    END IF;

    IF new_check IS DISTINCT FROM policy_row.with_check THEN
      EXECUTE format(
        'ALTER POLICY %I ON %I.%I WITH CHECK (%s)',
        policy_row.policyname,
        policy_row.schemaname,
        policy_row.tablename,
        new_check
      );
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2) Consolidate multiple permissive policies: community_posts (SELECT)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.community_posts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Public posts visible to all" ON public.community_posts;
    DROP POLICY IF EXISTS "Private posts visible to authenticated" ON public.community_posts;
    DROP POLICY IF EXISTS "community_posts_select_consolidated" ON public.community_posts;

    CREATE POLICY "community_posts_select_consolidated"
    ON public.community_posts
    FOR SELECT
    USING (
      visibility = 'public'
      OR (visibility = 'private' AND (select auth.uid()) IS NOT NULL)
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3) Consolidate multiple permissive policies: community_members (SELECT)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  merged_expr TEXT;
BEGIN
  IF to_regclass('public.community_members') IS NOT NULL THEN
    SELECT string_agg(format('(%s)', qual), ' OR ' ORDER BY policyname)
    INTO merged_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_members'
      AND cmd = 'SELECT'
      AND policyname IN (
        'Anyone can count members',
        'Users can view their memberships',
        'Users can view their own membership'
      );

    IF merged_expr IS NULL THEN
      merged_expr := 'user_id = (select auth.uid())';
    END IF;

    DROP POLICY IF EXISTS "Anyone can count members" ON public.community_members;
    DROP POLICY IF EXISTS "Users can view their memberships" ON public.community_members;
    DROP POLICY IF EXISTS "Users can view their own membership" ON public.community_members;
    DROP POLICY IF EXISTS "community_members_select_consolidated" ON public.community_members;

    EXECUTE format(
      'CREATE POLICY %I ON public.community_members FOR SELECT USING (%s)',
      'community_members_select_consolidated',
      merged_expr
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4) Consolidate multiple permissive policies: conversations (SELECT)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  merged_expr TEXT;
BEGIN
  IF to_regclass('public.conversations') IS NOT NULL THEN
    SELECT string_agg(format('(%s)', qual), ' OR ' ORDER BY policyname)
    INTO merged_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'conversations'
      AND cmd = 'SELECT'
      AND policyname IN ('conversations_agent_select', 'conversations_consumer_select');

    IF merged_expr IS NULL THEN
      merged_expr := 'agent_id = (select auth.uid()) OR consumer_profile_id = (select auth.uid())';
    END IF;

    DROP POLICY IF EXISTS "conversations_agent_select" ON public.conversations;
    DROP POLICY IF EXISTS "conversations_consumer_select" ON public.conversations;
    DROP POLICY IF EXISTS "conversations_select_consolidated" ON public.conversations;

    EXECUTE format(
      'CREATE POLICY %I ON public.conversations FOR SELECT TO authenticated USING (%s)',
      'conversations_select_consolidated',
      merged_expr
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5) Consolidate duplicate SELECT policies: properties
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  policy_expr TEXT;
BEGIN
  IF to_regclass('public.properties') IS NOT NULL THEN
    SELECT qual
    INTO policy_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'properties'
      AND cmd = 'SELECT'
      AND policyname = 'Public properties are viewable by everyone'
    LIMIT 1;

    IF policy_expr IS NULL THEN
      SELECT qual
      INTO policy_expr
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'properties'
        AND cmd = 'SELECT'
        AND policyname = 'Anyone can view properties'
      LIMIT 1;
    END IF;

    IF policy_expr IS NULL THEN
      policy_expr := 'true';
    END IF;

    DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties;
    DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
    DROP POLICY IF EXISTS "properties_select_consolidated" ON public.properties;

    EXECUTE format(
      'CREATE POLICY %I ON public.properties FOR SELECT USING (%s)',
      'properties_select_consolidated',
      policy_expr
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6) Consolidate duplicate SELECT policies: shadow_logs
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  policy_expr TEXT;
BEGIN
  IF to_regclass('public.shadow_logs') IS NOT NULL THEN
    SELECT qual
    INTO policy_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'shadow_logs'
      AND cmd = 'SELECT'
      AND policyname = 'Allow All Read'
    LIMIT 1;

    IF policy_expr IS NULL THEN
      SELECT qual
      INTO policy_expr
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'shadow_logs'
        AND cmd = 'SELECT'
        AND policyname = 'Public View Logs'
      LIMIT 1;
    END IF;

    IF policy_expr IS NULL THEN
      policy_expr := 'true';
    END IF;

    DROP POLICY IF EXISTS "Allow All Read" ON public.shadow_logs;
    DROP POLICY IF EXISTS "Public View Logs" ON public.shadow_logs;
    DROP POLICY IF EXISTS "Enable Read for All" ON public.shadow_logs;
    DROP POLICY IF EXISTS "shadow_logs_select_consolidated" ON public.shadow_logs;

    EXECUTE format(
      'CREATE POLICY %I ON public.shadow_logs FOR SELECT USING (%s)',
      'shadow_logs_select_consolidated',
      policy_expr
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7) Consolidate duplicate SELECT policies: godview_messages
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  policy_expr TEXT;
BEGIN
  IF to_regclass('public.godview_messages') IS NOT NULL THEN
    SELECT qual
    INTO policy_expr
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'godview_messages'
      AND cmd = 'SELECT'
      AND policyname = 'Allow anonymous read'
    LIMIT 1;

    IF policy_expr IS NULL THEN
      SELECT qual
      INTO policy_expr
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'godview_messages'
        AND cmd = 'SELECT'
        AND policyname = 'Allow anonymous read godview_messages'
      LIMIT 1;
    END IF;

    IF policy_expr IS NULL THEN
      policy_expr := 'true';
    END IF;

    DROP POLICY IF EXISTS "Allow anonymous read" ON public.godview_messages;
    DROP POLICY IF EXISTS "Allow anonymous read godview_messages" ON public.godview_messages;
    DROP POLICY IF EXISTS "godview_messages_select_consolidated" ON public.godview_messages;

    EXECUTE format(
      'CREATE POLICY %I ON public.godview_messages FOR SELECT TO anon USING (%s)',
      'godview_messages_select_consolidated',
      policy_expr
    );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8) Drop duplicate index on properties (keep idx_properties_community_id)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  indexed_table TEXT;
BEGIN
  SELECT tbl.relname
  INTO indexed_table
  FROM pg_class idx
  JOIN pg_index i
    ON i.indexrelid = idx.oid
  JOIN pg_class tbl
    ON tbl.oid = i.indrelid
  JOIN pg_namespace ns
    ON ns.oid = idx.relnamespace
  WHERE ns.nspname = 'public'
    AND idx.relname = 'idx_community_reviews_community_id'
  LIMIT 1;

  IF indexed_table = 'properties' THEN
    DROP INDEX IF EXISTS public.idx_community_reviews_community_id;
  END IF;

  IF to_regclass('public.properties') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_properties_community_id
      ON public.properties (community_id);
  END IF;
END $$;

COMMIT;
