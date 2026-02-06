-- ============================================================================
-- Agent Profile Extension (Phase 9)
-- File: 20260130_agent_profile_extension.sql
-- ============================================================================

-- 1) Profile fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS specialties TEXT[];
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS certifications TEXT[];
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS joined_at TIMESTAMPTZ;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS line_id TEXT;

-- 2) Metrics fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS service_rating DECIMAL(2,1) DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS completed_cases INTEGER DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS active_listings INTEGER DEFAULT 0;

-- 3) Backfill joined_at
UPDATE public.agents SET joined_at = created_at WHERE joined_at IS NULL;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_agents_trust_score ON public.agents (trust_score DESC);

-- ============================================================================
-- Supabase Storage Bucket: agent-avatars
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-avatars',
  'agent-avatars',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- RLS Policies
CREATE POLICY "Agents can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'agent-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'agent-avatars');

CREATE POLICY "Agents can update own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'agent-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- Trust Score RPC + Trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_calculate_trust_score(p_agent_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_score INTEGER := 60;
  v_agent agents%ROWTYPE;
BEGIN
  SELECT * INTO v_agent FROM public.agents WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RETURN 60;
  END IF;

  -- Service rating bonus (max +20)
  v_score := v_score + LEAST(20, COALESCE(v_agent.service_rating, 0)::INTEGER * 4);

  -- Completed cases bonus (max +10)
  v_score := v_score + LEAST(10, COALESCE(v_agent.completed_cases, 0) / 5);

  -- Encouragement bonus (max +10)
  v_score := v_score + LEAST(10, COALESCE(v_agent.encouragement_count, 0) / 20);

  RETURN LEAST(100, v_score);
END;
$$;

CREATE OR REPLACE FUNCTION fn_update_agent_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.trust_score := fn_calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_agents_trust_score ON public.agents;
CREATE TRIGGER trg_agents_trust_score
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  -- 僅監聽會影響 trust_score 的欄位，避免不必要的重新計算
  WHEN (
    OLD.service_rating IS DISTINCT FROM NEW.service_rating OR
    OLD.completed_cases IS DISTINCT FROM NEW.completed_cases OR
    OLD.encouragement_count IS DISTINCT FROM NEW.encouragement_count
  )
  EXECUTE FUNCTION fn_update_agent_trust_score();
