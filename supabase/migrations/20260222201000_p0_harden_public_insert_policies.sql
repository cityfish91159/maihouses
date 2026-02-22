-- ============================================================================
-- P0 hardening: tighten anonymous/public insert policies for high-risk tables
-- Date: 2026-02-22
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- shadow_logs: replace weak insert policies with guarded conditions
-- --------------------------------------------------------------------------
DO $$
DECLARE
  has_user_id BOOLEAN := false;
  has_content BOOLEAN := false;
  has_mode BOOLEAN := false;
  has_metadata BOOLEAN := false;
  insert_expr TEXT := '';
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
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shadow_logs'
      AND column_name = 'content'
  ) INTO has_content;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shadow_logs'
      AND column_name = 'mode'
  ) INTO has_mode;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'shadow_logs'
      AND column_name = 'metadata'
  ) INTO has_metadata;

  IF NOT has_user_id OR NOT has_content THEN
    RAISE NOTICE 'Skip shadow_logs insert hardening: required columns missing';
    RETURN;
  END IF;

  insert_expr :=
    'char_length(btrim(COALESCE(user_id::text, ''''))) BETWEEN 1 AND 128 ' ||
    'AND user_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'' ' ||
    'AND char_length(btrim(COALESCE(content, ''''))) BETWEEN 1 AND 10000';

  IF has_mode THEN
    insert_expr := insert_expr || ' AND (mode IS NULL OR char_length(btrim(mode::text)) BETWEEN 1 AND 32)';
  END IF;

  IF has_metadata THEN
    insert_expr :=
      insert_expr || ' AND (metadata IS NULL OR (jsonb_typeof(metadata) = ''object'' AND pg_column_size(metadata) <= 16384))';
  END IF;

  EXECUTE 'ALTER TABLE public.shadow_logs ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Public Insert Logs" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "Enable Insert for All" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "Allow All Insert" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_insert_guarded" ON public.shadow_logs';
  EXECUTE 'DROP POLICY IF EXISTS "shadow_logs_insert_p0_guarded" ON public.shadow_logs';

  EXECUTE format(
    'CREATE POLICY %I ON public.shadow_logs FOR INSERT TO anon, authenticated WITH CHECK (%s)',
    'shadow_logs_insert_p0_guarded',
    insert_expr
  );

  EXECUTE 'REVOKE INSERT ON TABLE public.shadow_logs FROM PUBLIC';
  EXECUTE 'GRANT INSERT ON TABLE public.shadow_logs TO anon, authenticated, service_role';
END $$;

-- --------------------------------------------------------------------------
-- rival_decoder: replace weak insert policies with guarded conditions
-- --------------------------------------------------------------------------
DO $$
DECLARE
  has_user_id BOOLEAN := false;
  has_image_url BOOLEAN := false;
  has_risk_score BOOLEAN := false;
  has_analysis_report BOOLEAN := false;
  insert_expr TEXT := '';
BEGIN
  IF to_regclass('public.rival_decoder') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rival_decoder'
      AND column_name = 'user_id'
  ) INTO has_user_id;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rival_decoder'
      AND column_name = 'image_url'
  ) INTO has_image_url;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rival_decoder'
      AND column_name = 'risk_score'
  ) INTO has_risk_score;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rival_decoder'
      AND column_name = 'analysis_report'
  ) INTO has_analysis_report;

  IF NOT has_user_id OR NOT has_image_url THEN
    RAISE NOTICE 'Skip rival_decoder insert hardening: required columns missing';
    RETURN;
  END IF;

  insert_expr :=
    'char_length(btrim(COALESCE(user_id::text, ''''))) BETWEEN 1 AND 128 ' ||
    'AND user_id::text ~* ''^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'' ' ||
    'AND char_length(btrim(COALESCE(image_url, ''''))) BETWEEN 1 AND 2048';

  IF has_risk_score THEN
    insert_expr := insert_expr || ' AND (risk_score IS NULL OR (risk_score >= 0 AND risk_score <= 100))';
  END IF;

  IF has_analysis_report THEN
    insert_expr :=
      insert_expr || ' AND (analysis_report IS NULL OR (jsonb_typeof(analysis_report) = ''object'' AND pg_column_size(analysis_report) <= 32768))';
  END IF;

  EXECUTE 'ALTER TABLE public.rival_decoder ENABLE ROW LEVEL SECURITY';

  EXECUTE 'DROP POLICY IF EXISTS "Public Insert Decoder" ON public.rival_decoder';
  EXECUTE 'DROP POLICY IF EXISTS "Enable Insert for All" ON public.rival_decoder';
  EXECUTE 'DROP POLICY IF EXISTS "rival_decoder_insert_guarded" ON public.rival_decoder';
  EXECUTE 'DROP POLICY IF EXISTS "rival_decoder_insert_p0_guarded" ON public.rival_decoder';

  EXECUTE format(
    'CREATE POLICY %I ON public.rival_decoder FOR INSERT TO anon, authenticated WITH CHECK (%s)',
    'rival_decoder_insert_p0_guarded',
    insert_expr
  );

  EXECUTE 'REVOKE INSERT ON TABLE public.rival_decoder FROM PUBLIC';
  EXECUTE 'GRANT INSERT ON TABLE public.rival_decoder TO anon, authenticated, service_role';
END $$;

COMMIT;

