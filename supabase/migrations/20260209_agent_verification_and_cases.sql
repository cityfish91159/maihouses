-- ========================================================
-- #15: Agent verification + completed cases auto increment
-- ========================================================

-- 1) verification fields on agents
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS license_number TEXT;

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_agents_is_verified
  ON public.agents(is_verified)
  WHERE is_verified = true;

-- 2) seed: set demo agent as verified
UPDATE public.agents
SET
  license_number = '(113)北市經紀字第004521號',
  is_verified = true,
  verified_at = '2024-06-15T00:00:00Z'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 3) completed cases increment trigger
CREATE OR REPLACE FUNCTION public.fn_increment_completed_cases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed'
     AND (OLD.status IS DISTINCT FROM 'closed') THEN
    UPDATE public.agents
    SET completed_cases = COALESCE(completed_cases, 0) + 1
    WHERE id = NEW.agent_id::uuid;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_cases_completed ON public.trust_cases;
CREATE TRIGGER trg_trust_cases_completed
  AFTER UPDATE OF status ON public.trust_cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.fn_increment_completed_cases();
