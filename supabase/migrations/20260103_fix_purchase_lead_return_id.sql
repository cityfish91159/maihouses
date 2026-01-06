-- ==============================================================================
-- 修復 purchase_lead RPC 返回 purchase_id
-- 問題：前端購買成功後不知道新建的 purchase UUID，導致無法正確關聯對話
-- 修復：ALTER FUNCTION 添加 purchase_id 到返回的 JSONB
-- ==============================================================================

CREATE OR REPLACE FUNCTION purchase_lead(
    p_user_id TEXT,
    p_lead_id TEXT,
    p_cost INTEGER,
    p_grade CHAR(1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_points INTEGER;
    v_quota_s INTEGER;
    v_quota_a INTEGER;
    v_use_quota BOOLEAN := false;
    v_property_id TEXT;
    v_fingerprint TEXT;
    v_client_info RECORD;
    v_purchase_id UUID;  -- 新增：捕獲 purchase ID
    v_result JSONB;
BEGIN
    -- 1. 檢查重複購買
    IF EXISTS (SELECT 1 FROM public.uag_lead_purchases WHERE agent_id = p_user_id AND session_id = p_lead_id) THEN
        v_result := jsonb_build_object('success', false, 'error', 'Already purchased');
        INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success, error_code)
        VALUES ('purchase_lead', p_user_id, p_lead_id,
                jsonb_build_object('cost', p_cost, 'grade', p_grade),
                v_result, false, 'ALREADY_PURCHASED');
        RETURN v_result;
    END IF;

    -- 2. 鎖定餘額 (FOR UPDATE 防止並發)
    SELECT points, quota_s, quota_a INTO v_points, v_quota_s, v_quota_a
    FROM public.agents WHERE id = p_user_id::UUID FOR UPDATE;

    -- 3. 扣款邏輯
    IF p_grade = 'S' AND v_quota_s > 0 THEN
        v_use_quota := true;
        UPDATE public.agents SET quota_s = quota_s - 1 WHERE id = p_user_id::UUID;
    ELSIF p_grade = 'A' AND v_quota_a > 0 THEN
        v_use_quota := true;
        UPDATE public.agents SET quota_a = quota_a - 1 WHERE id = p_user_id::UUID;
    ELSIF v_points >= p_cost THEN
        UPDATE public.agents SET points = points - p_cost WHERE id = p_user_id::UUID;
    ELSE
        v_result := jsonb_build_object('success', false, 'error', 'Insufficient balance');
        INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success, error_code)
        VALUES ('purchase_lead', p_user_id, p_lead_id,
                jsonb_build_object('cost', p_cost, 'grade', p_grade, 'balance', v_points),
                v_result, false, 'INSUFFICIENT_BALANCE');
        RETURN v_result;
    END IF;

    -- 4. 紀錄購買（新增 RETURNING 捕獲 ID）
    INSERT INTO public.uag_lead_purchases (agent_id, session_id, grade, cost, used_quota)
    VALUES (p_user_id, p_lead_id, p_grade, CASE WHEN v_use_quota THEN 0 ELSE p_cost END, v_use_quota)
    RETURNING id INTO v_purchase_id;

    -- 5. 取得客戶資訊
    SELECT e.property_id, s.fingerprint INTO v_property_id, v_fingerprint
    FROM public.uag_events e
    LEFT JOIN public.uag_sessions s ON e.session_id = s.session_id
    WHERE e.session_id = p_lead_id
    ORDER BY e.created_at DESC LIMIT 1;

    SELECT * INTO v_client_info FROM fn_extract_client_info(COALESCE(v_fingerprint, ''));

    -- 6. 建立 Lead
    INSERT INTO public.leads (property_id, agent_id, customer_name, customer_phone, status, source, notes)
    VALUES (
        v_property_id,
        p_user_id,
        v_client_info.display_name,
        'UAG-' || SUBSTR(p_lead_id, 1, 8),
        'purchased',
        'uag',
        'Device: ' || v_client_info.device_type || ', Lang: ' || v_client_info.language
    )
    ON CONFLICT (property_id, customer_phone) DO UPDATE SET
        agent_id = EXCLUDED.agent_id,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        updated_at = NOW();

    -- 7. 審計成功紀錄（新增 purchase_id 到返回值）
    v_result := jsonb_build_object(
        'success', true,
        'used_quota', v_use_quota,
        'purchase_id', v_purchase_id  -- ✅ 新增：返回 purchase UUID
    );
    INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success)
    VALUES ('purchase_lead', p_user_id, p_lead_id,
            jsonb_build_object('cost', p_cost, 'grade', p_grade),
            v_result, true);

    RETURN v_result;
END;
$$;

-- ==============================================================================
-- 修復 fn_create_conversation 的 NULL 比較問題
-- 問題：property_id = NULL 永遠返回 NULL，導致幂等性檢查失敗，創建重複對話
-- 修復：使用 IS NOT DISTINCT FROM 正確處理 NULL
-- ==============================================================================

CREATE OR REPLACE FUNCTION fn_create_conversation(
  p_agent_id UUID,
  p_consumer_session_id TEXT,
  p_property_id TEXT,
  p_lead_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  -- 檢查是否已存在（idempotent）
  -- ✅ 使用 IS NOT DISTINCT FROM 正確處理 NULL 比較
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE agent_id = p_agent_id
    AND consumer_session_id = p_consumer_session_id
    AND property_id IS NOT DISTINCT FROM p_property_id;

  -- 如果不存在，創建新對話
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (agent_id, consumer_session_id, property_id, lead_id, status)
    VALUES (p_agent_id, p_consumer_session_id, p_property_id, p_lead_id, 'pending')
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ==============================================================================
-- 完成
-- ==============================================================================
