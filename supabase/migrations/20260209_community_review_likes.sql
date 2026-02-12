-- ========================================================
-- #14a community_review_likes
-- Purpose:
-- - store likes for "two-good-one-fair" review cards
-- - aggregate likes back to agents.encouragement_count
-- ========================================================

CREATE TABLE IF NOT EXISTS public.community_review_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_community_review_likes_unique
  ON public.community_review_likes(property_id, user_id);

CREATE INDEX IF NOT EXISTS idx_community_review_likes_property
  ON public.community_review_likes(property_id);

CREATE INDEX IF NOT EXISTS idx_community_review_likes_user
  ON public.community_review_likes(user_id);

ALTER TABLE public.community_review_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_review_likes_select" ON public.community_review_likes;
CREATE POLICY "community_review_likes_select"
  ON public.community_review_likes
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "community_review_likes_insert" ON public.community_review_likes;
CREATE POLICY "community_review_likes_insert"
  ON public.community_review_likes
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "community_review_likes_delete" ON public.community_review_likes;
CREATE POLICY "community_review_likes_delete"
  ON public.community_review_likes
  FOR DELETE
  USING (user_id = auth.uid());

GRANT SELECT ON public.community_review_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.community_review_likes TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_recalc_encouragement_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id UUID;
  v_agent_id UUID;
  v_total_likes INTEGER;
  v_updated_count INTEGER;
BEGIN
  v_property_id := COALESCE(NEW.property_id, OLD.property_id);

  -- Validate property_id exists
  IF v_property_id IS NULL THEN
    RAISE WARNING '[fn_recalc_encouragement_count] property_id is NULL';
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT agent_id INTO v_agent_id
  FROM public.properties
  WHERE id = v_property_id;

  IF NOT FOUND THEN
    RAISE WARNING '[fn_recalc_encouragement_count] Property not found for id=%', v_property_id;
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_agent_id IS NULL THEN
    RAISE WARNING '[fn_recalc_encouragement_count] agent_id is NULL for property_id=%', v_property_id;
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_total_likes
  FROM public.community_review_likes crl
  INNER JOIN public.properties p ON p.id = crl.property_id
  WHERE p.agent_id = v_agent_id;

  UPDATE public.agents
  SET encouragement_count = COALESCE(v_total_likes, 0)
  WHERE id = v_agent_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE WARNING '[fn_recalc_encouragement_count] Agent not found for id=%', v_agent_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[fn_recalc_encouragement_count] Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN COALESCE(NEW, OLD); -- 不阻斷交易,但記錄錯誤
END;
$$;

DROP TRIGGER IF EXISTS trg_community_review_likes_encouragement ON public.community_review_likes;
CREATE TRIGGER trg_community_review_likes_encouragement
  AFTER INSERT OR DELETE ON public.community_review_likes
  FOR EACH ROW EXECUTE FUNCTION public.fn_recalc_encouragement_count();

-- backfill to keep encouragement_count consistent
UPDATE public.agents a
SET encouragement_count = COALESCE(agg.total_likes, 0)
FROM (
  SELECT p.agent_id, COUNT(*)::INTEGER AS total_likes
  FROM public.community_review_likes crl
  INNER JOIN public.properties p ON p.id = crl.property_id
  GROUP BY p.agent_id
) agg
WHERE a.id = agg.agent_id;

UPDATE public.agents
SET encouragement_count = 0
WHERE id NOT IN (
  SELECT DISTINCT p.agent_id
  FROM public.community_review_likes crl
  INNER JOIN public.properties p ON p.id = crl.property_id
  WHERE p.agent_id IS NOT NULL
);
