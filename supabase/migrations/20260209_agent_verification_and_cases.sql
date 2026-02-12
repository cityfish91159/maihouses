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
DECLARE
  TRUST_CASE_STATUS_CLOSED CONSTANT TEXT := 'closed';
  UUID_PATTERN CONSTANT TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_agent_id_text TEXT;
  v_agent_id UUID;
  v_updated_count INTEGER;
BEGIN
  -- Fail fast: missing agent_id
  IF NEW.agent_id IS NULL THEN
    RAISE WARNING '[fn_increment_completed_cases] agent_id is NULL for trust_cases.id=%', NEW.id;
    RETURN NEW;
  END IF;

  -- Early return when status is not transitioning into closed
  IF NEW.status IS DISTINCT FROM TRUST_CASE_STATUS_CLOSED
     OR OLD.status = TRUST_CASE_STATUS_CLOSED THEN
    RETURN NEW;
  END IF;

  v_agent_id_text := NEW.agent_id::text;

  -- Fail fast: invalid UUID format
  IF v_agent_id_text !~* UUID_PATTERN THEN
    RAISE WARNING '[fn_increment_completed_cases] Invalid agent_id format: % (trust_cases.id=%)', NEW.agent_id, NEW.id;
    RETURN NEW;
  END IF;

  v_agent_id := v_agent_id_text::uuid;

  UPDATE public.agents
  SET completed_cases = COALESCE(completed_cases, 0) + 1
  WHERE id = v_agent_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RAISE WARNING '[fn_increment_completed_cases] Agent not found for agent_id=% (trust_cases.id=%)', NEW.agent_id, NEW.id;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[fn_increment_completed_cases] Error: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW; -- 不阻斷交易,但記錄錯誤
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_cases_completed ON public.trust_cases;
CREATE TRIGGER trg_trust_cases_completed
  AFTER UPDATE OF status ON public.trust_cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.fn_increment_completed_cases();
