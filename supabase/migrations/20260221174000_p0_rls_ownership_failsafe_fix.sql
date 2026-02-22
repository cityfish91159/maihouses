-- ============================================================================
-- P0 hardening: ownership RLS and fail-safe policy fixes
-- Date: 2026-02-21
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1) High-risk tables: restrict UPDATE/DELETE to owner-or-admin
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_table_name TEXT;
  v_has_user_id BOOLEAN;
  v_owner_expr CONSTANT TEXT := 'COALESCE(user_id::text, '''') = COALESCE((select auth.uid())::text, ''__no_auth__'')';
  v_admin_expr CONSTANT TEXT := 'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN (''admin'', ''official''))';
BEGIN
  FOREACH v_table_name IN ARRAY ARRAY[
    'intimate_sessions',
    'muse_memory_vault',
    'muse_tasks',
    'sexual_preferences',
    'shadow_logs',
    'soul_treasures',
    'rival_decoder'
  ]
  LOOP
    IF to_regclass('public.' || v_table_name) IS NULL THEN
      CONTINUE;
    END IF;

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = v_table_name
        AND column_name = 'user_id'
    )
    INTO v_has_user_id;

    IF NOT v_has_user_id THEN
      RAISE NOTICE 'Skip %: user_id column not found', v_table_name;
      CONTINUE;
    END IF;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table_name);

    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_update_guarded', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_delete_guarded', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_update_owner_or_admin', v_table_name);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table_name || '_delete_owner_or_admin', v_table_name);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING ((%s) OR (%s)) WITH CHECK ((%s) OR (%s))',
      v_table_name || '_update_owner_or_admin',
      v_table_name,
      v_owner_expr,
      v_admin_expr,
      v_owner_expr,
      v_admin_expr
    );

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING ((%s) OR (%s))',
      v_table_name || '_delete_owner_or_admin',
      v_table_name,
      v_owner_expr,
      v_admin_expr
    );

    EXECUTE format('REVOKE UPDATE, DELETE ON TABLE public.%I FROM anon, public', v_table_name);
    EXECUTE format('GRANT UPDATE, DELETE ON TABLE public.%I TO authenticated, service_role', v_table_name);
  END LOOP;
END
$$;

-- ----------------------------------------------------------------------------
-- 2) godview_messages: remove fail-open read/update/delete policies
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_user_id BOOLEAN;
  v_owner_expr CONSTANT TEXT := 'COALESCE(user_id::text, '''') = COALESCE((select auth.uid())::text, ''__no_auth__'')';
  v_admin_expr CONSTANT TEXT := 'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN (''admin'', ''official''))';
BEGIN
  IF to_regclass('public.godview_messages') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'godview_messages'
      AND column_name = 'user_id'
  )
  INTO v_has_user_id;

  IF NOT v_has_user_id THEN
    RAISE NOTICE 'Skip godview_messages hardening: user_id column not found';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.godview_messages ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous read" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous read godview_messages" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_select_consolidated" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_select_owner_or_admin" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_select_service_role" ON public.godview_messages';

  EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous update" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous update godview_messages" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_update_guarded" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_update_owner_or_admin" ON public.godview_messages';
  EXECUTE 'DROP POLICY IF EXISTS "godview_messages_delete_owner_or_admin" ON public.godview_messages';

  EXECUTE format(
    'CREATE POLICY %I ON public.godview_messages FOR SELECT TO authenticated USING ((%s) OR (%s))',
    'godview_messages_select_owner_or_admin',
    v_owner_expr,
    v_admin_expr
  );

  EXECUTE
    'CREATE POLICY "godview_messages_select_service_role" ON public.godview_messages ' ||
    'FOR SELECT TO service_role USING (true)';

  EXECUTE format(
    'CREATE POLICY %I ON public.godview_messages FOR UPDATE TO authenticated USING ((%s) OR (%s)) WITH CHECK ((%s) OR (%s))',
    'godview_messages_update_owner_or_admin',
    v_owner_expr,
    v_admin_expr,
    v_owner_expr,
    v_admin_expr
  );

  EXECUTE format(
    'CREATE POLICY %I ON public.godview_messages FOR DELETE TO authenticated USING ((%s) OR (%s))',
    'godview_messages_delete_owner_or_admin',
    v_owner_expr,
    v_admin_expr
  );

  EXECUTE 'REVOKE SELECT, UPDATE, DELETE ON TABLE public.godview_messages FROM anon, public';
  EXECUTE 'GRANT SELECT, UPDATE, DELETE ON TABLE public.godview_messages TO authenticated, service_role';
END
$$;

-- ----------------------------------------------------------------------------
-- 3) shadow_logs: remove fail-open SELECT policy
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  v_has_user_id BOOLEAN;
  v_owner_expr CONSTANT TEXT := 'COALESCE(user_id::text, '''') = COALESCE((select auth.uid())::text, ''__no_auth__'')';
  v_admin_expr CONSTANT TEXT := 'EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (select auth.uid()) AND p.role IN (''admin'', ''official''))';
BEGIN
  IF to_regclass('public.shadow_logs') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shadow_logs'
      AND column_name = 'user_id'
  )
  INTO v_has_user_id;

  IF NOT v_has_user_id THEN
    RAISE NOTICE 'Skip shadow_logs select hardening: user_id column not found';
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.shadow_logs ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Allow All Read" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "Public View Logs" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "Enable Read for All" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_select_consolidated" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_select_owner_or_admin" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_select_service_role" ON public.shadow_logs';

  EXECUTE format(
    'CREATE POLICY %I ON public.shadow_logs FOR SELECT TO authenticated USING ((%s) OR (%s))',
    'shadow_logs_select_owner_or_admin',
    v_owner_expr,
    v_admin_expr
  );

  EXECUTE
    'CREATE POLICY "shadow_logs_select_service_role" ON public.shadow_logs ' ||
    'FOR SELECT TO service_role USING (true)';

  EXECUTE 'REVOKE SELECT ON TABLE public.shadow_logs FROM anon, public';
  EXECUTE 'GRANT SELECT ON TABLE public.shadow_logs TO authenticated, service_role';
END
$$;

-- ----------------------------------------------------------------------------
-- 4) properties: explicit public SELECT policy (no fallback synthesis)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.properties') IS NULL THEN
    RETURN;
  END IF;

  EXECUTE 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "Public properties are viewable by everyone" ON public.properties';
  EXECUTE 'DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties';
  EXECUTE 'DROP POLICY IF EXISTS "properties_select_consolidated" ON public.properties';
  EXECUTE 'DROP POLICY IF EXISTS "properties_select_public" ON public.properties';

  EXECUTE
    'CREATE POLICY "properties_select_public" ON public.properties ' ||
    'FOR SELECT USING (true)';
END
$$;

COMMIT;
