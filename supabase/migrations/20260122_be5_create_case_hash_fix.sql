-- ============================================================================
-- BE-5 修復：fn_create_trust_case hash 一致性 + 保留 token 回傳
-- DEPENDS ON: 20260122_add_case_token_final.sql
--
-- WHY: add_case_token_final 重新定義 fn_create_trust_case，但 NOW() 重複呼叫
--      造成 hash 可能不一致；此版保留 token 回傳並只呼叫一次 NOW()
-- ============================================================================

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
  v_now TIMESTAMPTZ;
  v_hash_input TEXT;
  v_full_hash TEXT;
BEGIN
  -- 1. 建立案件
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

  -- 2. 產生事件 hash（NOW() 只呼叫一次）
  v_now := NOW();
  v_hash_input := v_case_id::TEXT || p_agent_id || v_now::TEXT;
  v_full_hash := encode(sha256(v_hash_input::BYTEA), 'hex');
  v_event_hash := substring(v_full_hash, 1, 8) || '...' || substring(v_full_hash, 57, 4);

  -- 3. 建立初始事件
  INSERT INTO public.trust_case_events (
    case_id,
    step,
    step_name,
    action,
    actor,
    event_hash,
    detail,
    created_at
  )
  VALUES (
    v_case_id,
    1,
    'M1 接觸',
    '案件建立',
    'agent',
    v_event_hash,
    '房仲建立安心交易案件',
    v_now
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

COMMENT ON FUNCTION public.fn_create_trust_case(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
IS 'BE-5: Create trust case, hash uses single NOW(), returns token and expiry';
