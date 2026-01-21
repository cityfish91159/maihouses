-- DB-3: Case Token (v2 Security Fixed)

ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token UUID NOT NULL DEFAULT gen_random_uuid();

ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days';

ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token_revoked_at TIMESTAMPTZ DEFAULT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_cases_token
ON public.trust_cases (token);

DROP POLICY IF EXISTS "trust_cases_public_token_select" ON public.trust_cases;

CREATE OR REPLACE FUNCTION public.fn_get_trust_case_by_token(
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case JSONB;
  v_events JSONB;
BEGIN
  SELECT jsonb_build_object(
    'id', tc.id,
    'buyer_name', tc.buyer_name,
    'property_title', tc.property_title,
    'current_step', tc.current_step,
    'status', tc.status,
    'created_at', tc.created_at,
    'updated_at', tc.updated_at,
    'token', tc.token,
    'token_expires_at', tc.token_expires_at
  )
  INTO v_case
  FROM public.trust_cases tc
  WHERE tc.token = p_token
    AND tc.token_expires_at > NOW()
    AND tc.token_revoked_at IS NULL;

  IF v_case IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token invalid, expired, or revoked'
    );
  END IF;

  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tce.id,
      'step', tce.step,
      'step_name', tce.step_name,
      'action', tce.action,
      'actor', tce.actor,
      'created_at', tce.created_at
    )
    ORDER BY tce.created_at DESC
  ), '[]'::JSONB)
  INTO v_events
  FROM public.trust_case_events tce
  WHERE tce.case_id = (v_case->>'id')::UUID;

  RETURN jsonb_build_object(
    'success', true,
    'case', v_case || jsonb_build_object('events', v_events)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_get_trust_case_by_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_trust_case_by_token(UUID) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_revoke_trust_case_token(
  p_case_id UUID,
  p_agent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE public.trust_cases
  SET token_revoked_at = NOW()
  WHERE id = p_case_id
    AND agent_id = p_agent_id
    AND token_revoked_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Case not found, not authorized, or already revoked'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token revoked successfully'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_revoke_trust_case_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_revoke_trust_case_token(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_regenerate_trust_case_token(
  p_case_id UUID,
  p_agent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token UUID;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  v_new_token := gen_random_uuid();
  v_new_expires_at := NOW() + INTERVAL '90 days';

  UPDATE public.trust_cases
  SET
    token = v_new_token,
    token_expires_at = v_new_expires_at,
    token_revoked_at = NULL
  WHERE id = p_case_id
    AND agent_id = p_agent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Case not found or not authorized'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'token_expires_at', v_new_expires_at
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.fn_regenerate_trust_case_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_regenerate_trust_case_token(UUID, TEXT) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.fn_create_trust_case(
  p_agent_id TEXT,
  p_buyer_name TEXT,
  p_property_title TEXT,
  p_buyer_session_id TEXT DEFAULT NULL,
  p_buyer_contact TEXT DEFAULT NULL,
  p_property_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_token UUID;
  v_token_expires_at TIMESTAMPTZ;
  v_event_hash TEXT;
BEGIN
  INSERT INTO public.trust_cases (
    agent_id,
    buyer_session_id,
    buyer_name,
    buyer_contact,
    property_id,
    property_title,
    current_step,
    status
  )
  VALUES (
    p_agent_id,
    p_buyer_session_id,
    p_buyer_name,
    p_buyer_contact,
    p_property_id,
    p_property_title,
    1,
    'active'
  )
  RETURNING id, token, token_expires_at INTO v_case_id, v_token, v_token_expires_at;

  v_event_hash := substring(
    encode(
      sha256(
        (v_case_id::TEXT || p_agent_id || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    1, 8
  ) || '...' || substring(
    encode(
      sha256(
        (v_case_id::TEXT || p_agent_id || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    57, 4
  );

  INSERT INTO public.trust_case_events (
    case_id,
    step,
    step_name,
    action,
    actor,
    event_hash,
    detail
  )
  VALUES (
    v_case_id,
    1,
    'M1 接洽',
    '案件建立',
    'agent',
    v_event_hash,
    '房仲建立安心交易案件'
  );

  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'token', v_token,
    'token_expires_at', v_token_expires_at,
    'event_hash', v_event_hash
  );
END;
$$;
