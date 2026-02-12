BEGIN;

-- Hotfix A: trust score calculation precision
CREATE OR REPLACE FUNCTION public.fn_calculate_trust_score(p_agent_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $fn_trust$
DECLARE
  BASE_TRUST_SCORE CONSTANT INTEGER := 60;
  TRUST_SCORE_MAX CONSTANT INTEGER := 100;
  SERVICE_RATING_BONUS_MAX CONSTANT INTEGER := 20;
  SERVICE_RATING_MULTIPLIER CONSTANT INTEGER := 4;
  COMPLETED_CASES_BONUS_MAX CONSTANT INTEGER := 10;
  COMPLETED_CASES_DIVISOR CONSTANT INTEGER := 5;
  ENCOURAGEMENT_BONUS_MAX CONSTANT INTEGER := 10;
  ENCOURAGEMENT_DIVISOR CONSTANT INTEGER := 20;
  v_score INTEGER := BASE_TRUST_SCORE;
  v_agent public.agents%ROWTYPE;
BEGIN
  IF p_agent_id IS NULL THEN
    RAISE WARNING '[fn_calculate_trust_score] agent_id is NULL, returning default score %', BASE_TRUST_SCORE;
    RETURN BASE_TRUST_SCORE;
  END IF;

  SELECT * INTO v_agent FROM public.agents WHERE id = p_agent_id;

  IF NOT FOUND THEN
    RAISE WARNING '[fn_calculate_trust_score] Agent not found for id=%, returning default score %', p_agent_id, BASE_TRUST_SCORE;
    RETURN BASE_TRUST_SCORE;
  END IF;

  v_score := v_score + LEAST(
    SERVICE_RATING_BONUS_MAX,
    ROUND(COALESCE(v_agent.service_rating, 0) * SERVICE_RATING_MULTIPLIER)::INTEGER
  );

  v_score := v_score + LEAST(
    COMPLETED_CASES_BONUS_MAX,
    COALESCE(v_agent.completed_cases, 0) / COMPLETED_CASES_DIVISOR
  );

  v_score := v_score + LEAST(
    ENCOURAGEMENT_BONUS_MAX,
    COALESCE(v_agent.encouragement_count, 0) / ENCOURAGEMENT_DIVISOR
  );

  RETURN LEAST(TRUST_SCORE_MAX, v_score);
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[fn_calculate_trust_score] Error for agent_id=%: % (SQLSTATE: %)', p_agent_id, SQLERRM, SQLSTATE;
    RETURN BASE_TRUST_SCORE;
END;
$fn_trust$;

CREATE OR REPLACE FUNCTION public.fn_update_agent_trust_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn_update_trust$
BEGIN
  NEW.trust_score := public.fn_calculate_trust_score(NEW.id);
  RETURN NEW;
END;
$fn_update_trust$;

DROP TRIGGER IF EXISTS trg_agents_trust_score ON public.agents;
CREATE TRIGGER trg_agents_trust_score
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  WHEN (
    OLD.service_rating IS DISTINCT FROM NEW.service_rating OR
    OLD.completed_cases IS DISTINCT FROM NEW.completed_cases OR
    OLD.encouragement_count IS DISTINCT FROM NEW.encouragement_count
  )
  EXECUTE FUNCTION public.fn_update_agent_trust_score();

-- Hotfix B: validate agent_id before UUID cast
CREATE OR REPLACE FUNCTION public.fn_increment_completed_cases()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn_increment$
DECLARE
  TRUST_CASE_STATUS_CLOSED CONSTANT TEXT := 'closed';
  UUID_PATTERN CONSTANT TEXT := '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  v_agent_id_text TEXT;
  v_agent_id UUID;
  v_updated_count INTEGER;
BEGIN
  IF NEW.agent_id IS NULL THEN
    RAISE WARNING '[fn_increment_completed_cases] agent_id is NULL for trust_cases.id=%', NEW.id;
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM TRUST_CASE_STATUS_CLOSED
     OR OLD.status = TRUST_CASE_STATUS_CLOSED THEN
    RETURN NEW;
  END IF;

  v_agent_id_text := NEW.agent_id::text;

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
    RETURN NEW;
END;
$fn_increment$;

DROP TRIGGER IF EXISTS trg_trust_cases_completed ON public.trust_cases;
CREATE TRIGGER trg_trust_cases_completed
  AFTER UPDATE OF status ON public.trust_cases
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.fn_increment_completed_cases();

COMMIT;
