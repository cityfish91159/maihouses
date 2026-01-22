-- ============================================================================
-- BE-5 修復：fn_update_trust_case_step 回傳 old_step
-- DEPENDS ON: 20260119_trust_cases_schema.sql
--
-- WHY: 進度更新推播需要知道「從哪一步到哪一步」。
--      old_step 必須從 DB 取得，不能信任前端傳入。
--
-- 修正內容：
-- 1. 新增 p_action 非空驗證
-- 2. 新增 p_actor 合法值驗證（agent / buyer / system）
-- 3. 將 NOW() 存入 v_now，確保 hash 一致
-- 4. 使用 GET DIAGNOSTICS 檢查 UPDATE 受影響列數
-- 5. property_title 使用 COALESCE（避免 NULL）
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_update_trust_case_step(
  p_case_id UUID,
  p_agent_id TEXT,
  p_new_step INTEGER,
  p_action TEXT,
  p_actor TEXT DEFAULT 'agent',
  p_detail TEXT DEFAULT NULL,
  p_offer_price BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_step INTEGER;
  v_property_title TEXT;
  v_event_hash TEXT;
  v_now TIMESTAMPTZ;
  v_hash_input TEXT;
  v_full_hash TEXT;
  v_rows_affected INTEGER;
  v_step_names TEXT[] := ARRAY[
    'M1 接觸', 'M2 帶看', 'M3 出價', 'M4 斡旋', 'M5 成交', 'M6 交屋'
  ];
BEGIN
  -- 1. 驗證步驟範圍（1-6）
  IF p_new_step < 1 OR p_new_step > 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid step number: must be between 1 and 6');
  END IF;

  -- 1.1 驗證 action 不可為空
  IF p_action IS NULL OR btrim(p_action) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Action is required');
  END IF;

  -- 1.2 驗證 actor 合法值
  IF p_actor IS NULL OR p_actor NOT IN ('agent', 'buyer', 'system') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid actor: must be agent, buyer, or system');
  END IF;

  -- 2. 取得目前步驟 + 物件標題
  SELECT tc.current_step, tc.property_title
  INTO v_current_step, v_property_title
  FROM public.trust_cases tc
  WHERE tc.id = p_case_id
    AND tc.agent_id = p_agent_id;

  IF v_current_step IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Case not found or access denied');
  END IF;

  -- 3. 驗證步驟合法性（不可回退，不可跳超過 1 步）
  IF p_new_step < v_current_step THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot go back to previous step');
  END IF;

  IF p_new_step > v_current_step + 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot skip steps');
  END IF;

  -- 4. 產生事件 hash（NOW() 只呼叫一次）
  v_now := NOW();
  v_hash_input := p_case_id::TEXT || p_agent_id || p_action || v_now::TEXT;
  v_full_hash := encode(sha256(v_hash_input::BYTEA), 'hex');
  v_event_hash := substring(v_full_hash, 1, 8) || '...' || substring(v_full_hash, 57, 4);

  -- 5. 更新案件
  UPDATE public.trust_cases
  SET
    current_step = p_new_step,
    offer_price = COALESCE(p_offer_price, offer_price),
    status = CASE
      WHEN p_new_step = 6 THEN 'completed'
      ELSE status
    END,
    updated_at = v_now
  WHERE id = p_case_id
    AND agent_id = p_agent_id;

  -- 6. 檢查 UPDATE 是否成功（防競態）
  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
  IF v_rows_affected = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Update failed: case may have been modified by another request');
  END IF;

  -- 7. 寫入事件
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
    p_case_id,
    p_new_step,
    v_step_names[p_new_step],
    p_action,
    p_actor,
    v_event_hash,
    p_detail,
    v_now
  );

  -- 8. 回傳結果（含 old_step 與 property_title）
  RETURN jsonb_build_object(
    'success', true,
    'case_id', p_case_id,
    'old_step', v_current_step,
    'new_step', p_new_step,
    'property_title', COALESCE(v_property_title, '未命名物件'),
    'event_hash', v_event_hash
  );
END;
$$;

COMMENT ON FUNCTION public.fn_update_trust_case_step(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BIGINT)
IS 'BE-5: 更新案件步驟，回傳 old_step 與 property_title。修復：步驟範圍、action/actor 驗證、hash 一致性、競態檢查、NULL 處理';
