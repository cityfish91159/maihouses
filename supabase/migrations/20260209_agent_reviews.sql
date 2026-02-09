-- ============================================================================
-- Ticket #13A: Agent Reviews (DB layer)
-- - Create public.agent_reviews
-- - Enable RLS and policies
-- - Recalculate agents.service_rating + agents.review_count on write
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.agent_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  trust_case_id UUID REFERENCES public.trust_cases(id) ON DELETE SET NULL,
  property_id TEXT,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  step_completed SMALLINT NOT NULL DEFAULT 2,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_reviews_unique
  ON public.agent_reviews(agent_id, reviewer_id, trust_case_id)
  WHERE reviewer_id IS NOT NULL AND trust_case_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_agent_reviews_agent_id
  ON public.agent_reviews(agent_id);

CREATE INDEX IF NOT EXISTS idx_agent_reviews_created_at
  ON public.agent_reviews(created_at DESC);

ALTER TABLE public.agent_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agent_reviews_select" ON public.agent_reviews;
CREATE POLICY "agent_reviews_select"
ON public.agent_reviews
FOR SELECT
USING (is_public = true OR reviewer_id = auth.uid());

DROP POLICY IF EXISTS "agent_reviews_insert" ON public.agent_reviews;
CREATE POLICY "agent_reviews_insert"
ON public.agent_reviews
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND reviewer_id = auth.uid());

DROP POLICY IF EXISTS "agent_reviews_update" ON public.agent_reviews;
CREATE POLICY "agent_reviews_update"
ON public.agent_reviews
FOR UPDATE
USING (reviewer_id = auth.uid())
WITH CHECK (reviewer_id = auth.uid());

DROP POLICY IF EXISTS "agent_reviews_delete" ON public.agent_reviews;
CREATE POLICY "agent_reviews_delete"
ON public.agent_reviews
FOR DELETE
USING (reviewer_id = auth.uid());

GRANT SELECT ON public.agent_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_reviews TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_recalc_agent_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agent_id UUID;
  v_avg NUMERIC(2,1);
  v_count INTEGER;
BEGIN
  v_agent_id := COALESCE(NEW.agent_id, OLD.agent_id);

  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.agent_reviews
  WHERE agent_id = v_agent_id;

  UPDATE public.agents
  SET
    service_rating = COALESCE(v_avg, 0),
    review_count = COALESCE(v_count, 0)
  WHERE id = v_agent_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_reviews_stats ON public.agent_reviews;
CREATE TRIGGER trg_agent_reviews_stats
AFTER INSERT OR UPDATE OR DELETE ON public.agent_reviews
FOR EACH ROW
EXECUTE FUNCTION public.fn_recalc_agent_review_stats();
