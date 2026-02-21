-- Lint batch 05: add missing FK covering indexes (safe/conditional)
-- Source: Supabase database linter `unindexed_foreign_keys`

DO $$
BEGIN
  -- public.agent_reviews
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agent_reviews'
      AND column_name = 'reviewer_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_agent_reviews_reviewer_id ON public.agent_reviews (reviewer_id)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agent_reviews'
      AND column_name = 'trust_case_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_agent_reviews_trust_case_id ON public.agent_reviews (trust_case_id)';
  END IF;

  -- public.community_answers
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_answers'
      AND column_name = 'author_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_community_answers_author ON public.community_answers (author_id)';
  END IF;

  -- public.community_comments
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_comments'
      AND column_name = 'community_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_community_comments_community ON public.community_comments (community_id)';
  END IF;

  -- public.community_posts
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_posts'
      AND column_name = 'author_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_community_posts_author ON public.community_posts (author_id)';
  END IF;

  -- public.community_questions
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'community_questions'
      AND column_name = 'author_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_community_questions_author ON public.community_questions (author_id)';
  END IF;

  -- public.migration_logs
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'migration_logs'
      AND column_name = 'property_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_migration_logs_property_id ON public.migration_logs (property_id)';
  END IF;

  -- public.properties
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'properties'
      AND column_name = 'agent_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON public.properties (agent_id)';
  END IF;

  -- public.transactions
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'agent_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_agent_id ON public.transactions (agent_id)';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'transactions'
      AND column_name = 'buyer_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions (buyer_id)';
  END IF;

  -- public.uag_s_grade_upgrades
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'uag_s_grade_upgrades'
      AND column_name = 'session_id'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_uag_s_grade_upgrades_session_id ON public.uag_s_grade_upgrades (session_id)';
  END IF;
END
$$;
