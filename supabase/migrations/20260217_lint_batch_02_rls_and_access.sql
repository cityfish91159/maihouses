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
-- analytics_events: replace always-true insert policy
-- --------------------------------------------------------------------------
DO $$
DECLARE
  has_properties_column BOOLEAN := false;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'analytics_events'
  ) THEN
    EXECUTE 'ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY';

    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'analytics_events'
        AND column_name = 'properties'
    )
    INTO has_properties_column;

    EXECUTE 'DROP POLICY IF EXISTS "Allow insert analytics events" ON public.analytics_events';
    EXECUTE 'DROP POLICY IF EXISTS "analytics_events_insert_safe" ON public.analytics_events';

    IF has_properties_column THEN
      EXECUTE
        'CREATE POLICY "analytics_events_insert_safe" ON public.analytics_events ' ||
        'FOR INSERT TO anon, authenticated WITH CHECK (' ||
        'char_length(btrim(event_name)) BETWEEN 1 AND 120 ' ||
        'AND jsonb_typeof(properties) = ''object'' ' ||
        'AND pg_column_size(properties) <= 16384' ||
        ')';
    ELSE
      EXECUTE
        'CREATE POLICY "analytics_events_insert_safe" ON public.analytics_events ' ||
        'FOR INSERT TO anon, authenticated WITH CHECK (' ||
        'char_length(btrim(event_name)) BETWEEN 1 AND 120' ||
        ')';
    END IF;

    EXECUTE 'REVOKE INSERT ON TABLE public.analytics_events FROM PUBLIC';
    EXECUTE 'GRANT INSERT ON TABLE public.analytics_events TO anon, authenticated, service_role';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- godview_messages: remove anonymous delete/insert access
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
    -- Known unsafe INSERT policies
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous insert godview_messages" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous insert" ON public.godview_messages';

    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete godview_messages" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Service role can delete godview_messages" ON public.godview_messages';

    -- Remove any INSERT policy granted to anon/public that is effectively always true
    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'godview_messages'
        AND cmd = 'INSERT'
        AND roles && ARRAY['anon'::name, 'public'::name]
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.godview_messages', unsafe_policy.policyname);
    END LOOP;

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

    EXECUTE 'REVOKE INSERT ON public.godview_messages FROM anon';
    EXECUTE 'REVOKE INSERT ON public.godview_messages FROM public';
    EXECUTE 'REVOKE DELETE ON public.godview_messages FROM anon';
    EXECUTE 'REVOKE DELETE ON public.godview_messages FROM public';
    EXECUTE 'GRANT INSERT ON public.godview_messages TO service_role';
    EXECUTE 'GRANT DELETE ON public.godview_messages TO service_role';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- godview_messages: replace always-true update policies
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
    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'godview_messages'
        AND cmd = 'UPDATE'
        AND (
          regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
          OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.godview_messages', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous update" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous update godview_messages" ON public.godview_messages';
    EXECUTE 'DROP POLICY IF EXISTS "godview_messages_update_guarded" ON public.godview_messages';

    EXECUTE
      'CREATE POLICY "godview_messages_update_guarded" ON public.godview_messages ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'id IS NOT NULL' ||
      ') WITH CHECK (' ||
      'id IS NOT NULL' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- intimate_sessions: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'intimate_sessions'
  ) THEN
    EXECUTE 'ALTER TABLE public.intimate_sessions ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'intimate_sessions'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.intimate_sessions', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "intimate_sessions_insert_guarded" ON public.intimate_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "intimate_sessions_update_guarded" ON public.intimate_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "intimate_sessions_delete_guarded" ON public.intimate_sessions';

    EXECUTE
      'CREATE POLICY "intimate_sessions_insert_guarded" ON public.intimate_sessions ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'user_id IS NOT NULL AND started_at IS NOT NULL' ||
      ')';

    EXECUTE
      'CREATE POLICY "intimate_sessions_update_guarded" ON public.intimate_sessions ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'user_id IS NOT NULL' ||
      ') WITH CHECK (' ||
      'user_id IS NOT NULL' ||
      ')';

    EXECUTE
      'CREATE POLICY "intimate_sessions_delete_guarded" ON public.intimate_sessions ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'user_id IS NOT NULL' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- lead_events: replace always-true insert policy
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'lead_events'
  ) THEN
    EXECUTE 'ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'lead_events'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.lead_events', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "lead_events_insert_guarded" ON public.lead_events';

    EXECUTE
      'CREATE POLICY "lead_events_insert_guarded" ON public.lead_events ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'lead_id IS NOT NULL AND char_length(btrim(event_type)) BETWEEN 1 AND 80' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- leads: replace always-true insert policy
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'leads'
  ) THEN
    EXECUTE 'ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'leads'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "leads_insert_guarded" ON public.leads';

    EXECUTE
      'CREATE POLICY "leads_insert_guarded" ON public.leads ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(property_id)) BETWEEN 1 AND 64 ' ||
      'AND char_length(btrim(customer_name)) BETWEEN 1 AND 120 ' ||
      'AND char_length(btrim(customer_phone)) BETWEEN 6 AND 30' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- muse_memory_vault: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'muse_memory_vault'
  ) THEN
    EXECUTE 'ALTER TABLE public.muse_memory_vault ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'muse_memory_vault'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.muse_memory_vault', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "muse_memory_vault_insert_guarded" ON public.muse_memory_vault';
    EXECUTE 'DROP POLICY IF EXISTS "muse_memory_vault_update_guarded" ON public.muse_memory_vault';
    EXECUTE 'DROP POLICY IF EXISTS "muse_memory_vault_delete_guarded" ON public.muse_memory_vault';

    EXECUTE
      'CREATE POLICY "muse_memory_vault_insert_guarded" ON public.muse_memory_vault ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128 ' ||
      'AND char_length(btrim(content)) BETWEEN 1 AND 4000' ||
      ')';

    EXECUTE
      'CREATE POLICY "muse_memory_vault_update_guarded" ON public.muse_memory_vault ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ') WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "muse_memory_vault_delete_guarded" ON public.muse_memory_vault ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- muse_tasks: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'muse_tasks'
  ) THEN
    EXECUTE 'ALTER TABLE public.muse_tasks ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'muse_tasks'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.muse_tasks', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "muse_tasks_insert_guarded" ON public.muse_tasks';
    EXECUTE 'DROP POLICY IF EXISTS "muse_tasks_update_guarded" ON public.muse_tasks';
    EXECUTE 'DROP POLICY IF EXISTS "muse_tasks_delete_guarded" ON public.muse_tasks';

    EXECUTE
      'CREATE POLICY "muse_tasks_insert_guarded" ON public.muse_tasks ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "muse_tasks_update_guarded" ON public.muse_tasks ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ') WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "muse_tasks_delete_guarded" ON public.muse_tasks ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- properties: replace permissive insert policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'properties'
  ) THEN
    EXECUTE 'ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert properties (Demo Purpose)" ON public.properties';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can insert properties" ON public.properties';
    EXECUTE 'DROP POLICY IF EXISTS "Only authenticated users can insert" ON public.properties';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'properties'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.properties', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "properties_insert_authenticated_guarded" ON public.properties';

    EXECUTE
      'CREATE POLICY "properties_insert_authenticated_guarded" ON public.properties ' ||
      'FOR INSERT TO authenticated WITH CHECK (' ||
      'auth.uid() IS NOT NULL AND (agent_id IS NULL OR agent_id = auth.uid())' ||
      ')';

    EXECUTE 'REVOKE INSERT ON TABLE public.properties FROM anon, public';
    EXECUTE 'GRANT INSERT ON TABLE public.properties TO authenticated';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- rival_decoder: replace always-true insert/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'rival_decoder'
  ) THEN
    EXECUTE 'ALTER TABLE public.rival_decoder ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'rival_decoder'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.rival_decoder', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "rival_decoder_insert_guarded" ON public.rival_decoder';
    EXECUTE 'DROP POLICY IF EXISTS "rival_decoder_delete_guarded" ON public.rival_decoder';

    EXECUTE
      'CREATE POLICY "rival_decoder_insert_guarded" ON public.rival_decoder ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128 ' ||
      'AND char_length(btrim(image_url)) BETWEEN 1 AND 2048' ||
      ')';

    EXECUTE
      'CREATE POLICY "rival_decoder_delete_guarded" ON public.rival_decoder ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- sexual_preferences: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sexual_preferences'
  ) THEN
    EXECUTE 'ALTER TABLE public.sexual_preferences ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'sexual_preferences'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.sexual_preferences', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "sexual_preferences_insert_guarded" ON public.sexual_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "sexual_preferences_update_guarded" ON public.sexual_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "sexual_preferences_delete_guarded" ON public.sexual_preferences';

    EXECUTE
      'CREATE POLICY "sexual_preferences_insert_guarded" ON public.sexual_preferences ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128 ' ||
      'AND char_length(btrim(category::text)) BETWEEN 1 AND 64 ' ||
      'AND char_length(btrim(preference_key)) BETWEEN 1 AND 120' ||
      ')';

    EXECUTE
      'CREATE POLICY "sexual_preferences_update_guarded" ON public.sexual_preferences ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ') WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "sexual_preferences_delete_guarded" ON public.sexual_preferences ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- shadow_logs: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'shadow_logs'
  ) THEN
    EXECUTE 'ALTER TABLE public.shadow_logs ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'shadow_logs'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.shadow_logs', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_insert_guarded" ON public.shadow_logs';
    EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_update_guarded" ON public.shadow_logs';
    EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_delete_guarded" ON public.shadow_logs';

    EXECUTE
      'CREATE POLICY "shadow_logs_insert_guarded" ON public.shadow_logs ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128 ' ||
      'AND char_length(btrim(content)) BETWEEN 1 AND 10000' ||
      ')';

    EXECUTE
      'CREATE POLICY "shadow_logs_update_guarded" ON public.shadow_logs ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ') WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "shadow_logs_delete_guarded" ON public.shadow_logs ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- soul_treasures: replace always-true write/delete policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'soul_treasures'
  ) THEN
    EXECUTE 'ALTER TABLE public.soul_treasures ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'soul_treasures'
        AND (
          (cmd = 'INSERT' AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true')
          OR (
            cmd = 'UPDATE'
            AND (
              regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true'
              OR regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
            )
          )
          OR (cmd = 'DELETE' AND regexp_replace(COALESCE(qual, ''), '[[:space:]()]', '', 'g') = 'true')
        )
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.soul_treasures', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "soul_treasures_insert_guarded" ON public.soul_treasures';
    EXECUTE 'DROP POLICY IF EXISTS "soul_treasures_update_guarded" ON public.soul_treasures';
    EXECUTE 'DROP POLICY IF EXISTS "soul_treasures_delete_guarded" ON public.soul_treasures';

    EXECUTE
      'CREATE POLICY "soul_treasures_insert_guarded" ON public.soul_treasures ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128 ' ||
      'AND char_length(btrim(title)) BETWEEN 1 AND 200' ||
      ')';

    EXECUTE
      'CREATE POLICY "soul_treasures_update_guarded" ON public.soul_treasures ' ||
      'FOR UPDATE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ') WITH CHECK (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE
      'CREATE POLICY "soul_treasures_delete_guarded" ON public.soul_treasures ' ||
      'FOR DELETE TO anon, authenticated USING (' ||
      'char_length(btrim(user_id::text)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- uag_events: replace always-true insert policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'uag_events'
  ) THEN
    EXECUTE 'ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'uag_events'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.uag_events', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "Allow anon insert" ON public.uag_events';
    EXECUTE 'DROP POLICY IF EXISTS "uag_events_insert_guarded" ON public.uag_events';

    EXECUTE
      'CREATE POLICY "uag_events_insert_guarded" ON public.uag_events ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(session_id)) BETWEEN 1 AND 128 ' ||
      'AND COALESCE(duration, 0) >= 0 ' ||
      'AND (actions IS NULL OR jsonb_typeof(actions) = ''object'')' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- uag_events_archive: replace always-true insert policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'uag_events_archive'
  ) THEN
    EXECUTE 'ALTER TABLE public.uag_events_archive ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'uag_events_archive'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.uag_events_archive', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "Archive insert" ON public.uag_events_archive';
    EXECUTE 'DROP POLICY IF EXISTS "uag_events_archive_insert_service_guarded" ON public.uag_events_archive';

    EXECUTE
      'CREATE POLICY "uag_events_archive_insert_service_guarded" ON public.uag_events_archive ' ||
      'FOR INSERT TO service_role WITH CHECK (' ||
      'char_length(btrim(session_id)) BETWEEN 1 AND 128' ||
      ')';

    EXECUTE 'REVOKE INSERT ON TABLE public.uag_events_archive FROM anon, authenticated, public';
    EXECUTE 'GRANT INSERT ON TABLE public.uag_events_archive TO service_role';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- uag_s_grade_upgrades: replace always-true insert policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'uag_s_grade_upgrades'
  ) THEN
    EXECUTE 'ALTER TABLE public.uag_s_grade_upgrades ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'uag_s_grade_upgrades'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.uag_s_grade_upgrades', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "System can insert S upgrades" ON public.uag_s_grade_upgrades';
    EXECUTE 'DROP POLICY IF EXISTS "uag_s_grade_upgrades_insert_guarded" ON public.uag_s_grade_upgrades';

    EXECUTE
      'CREATE POLICY "uag_s_grade_upgrades_insert_guarded" ON public.uag_s_grade_upgrades ' ||
      'FOR INSERT TO authenticated WITH CHECK (' ||
      'auth.uid() IS NOT NULL ' ||
      'AND agent_id = auth.uid()::text ' ||
      'AND char_length(btrim(session_id)) BETWEEN 1 AND 128' ||
      ')';
  END IF;
END $$;

-- --------------------------------------------------------------------------
-- uag_sessions: replace always-true insert policies
-- --------------------------------------------------------------------------
DO $$
DECLARE
  unsafe_policy RECORD;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'uag_sessions'
  ) THEN
    EXECUTE 'ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY';

    FOR unsafe_policy IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'uag_sessions'
        AND cmd = 'INSERT'
        AND regexp_replace(COALESCE(with_check, ''), '[[:space:]()]', '', 'g') = 'true'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.uag_sessions', unsafe_policy.policyname);
    END LOOP;

    EXECUTE 'DROP POLICY IF EXISTS "Allow anon insert" ON public.uag_sessions';
    EXECUTE 'DROP POLICY IF EXISTS "uag_sessions_insert_guarded" ON public.uag_sessions';

    EXECUTE
      'CREATE POLICY "uag_sessions_insert_guarded" ON public.uag_sessions ' ||
      'FOR INSERT TO anon, authenticated WITH CHECK (' ||
      'char_length(btrim(session_id)) BETWEEN 1 AND 128 ' ||
      'AND COALESCE(total_duration, 0) >= 0 ' ||
      'AND COALESCE(property_count, 0) >= 0 ' ||
      'AND grade IN (''S'', ''A'', ''B'', ''C'', ''F'')' ||
      ')';
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
