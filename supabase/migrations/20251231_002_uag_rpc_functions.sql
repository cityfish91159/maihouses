-- ==============================================================================
-- UAG RPC Functions: Business Logic Only
-- 執行順序: 2/2 (需先執行 001_uag_schema_setup.sql)
-- ==============================================================================

-- 1. Helper: 從 fingerprint 解析客戶資訊
CREATE OR REPLACE FUNCTION fn_extract_client_info(p_fingerprint TEXT)
RETURNS TABLE (device_type TEXT, language TEXT, display_name TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_decoded JSONB;
BEGIN
    BEGIN
        v_decoded := convert_from(decode(p_fingerprint, 'base64'), 'UTF8')::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN QUERY SELECT 'unknown'::TEXT, 'zh-TW'::TEXT, 'UAG訪客'::TEXT;
        RETURN;
    END;

    RETURN QUERY SELECT
        COALESCE(v_decoded->>'screen', 'unknown')::TEXT,
        COALESCE(v_decoded->>'language', 'zh-TW')::TEXT,
        ('訪客-' || SUBSTR(p_fingerprint, 1, 6))::TEXT;
END;
$$;

-- 2. 房源流量統計 RPC
CREATE OR REPLACE FUNCTION get_agent_property_stats(p_agent_id TEXT)
RETURNS TABLE (
    property_id TEXT,
    view_count BIGINT,
    unique_sessions BIGINT,
    total_duration BIGINT,
    line_clicks BIGINT,
    call_clicks BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.property_id,
        COUNT(*)::BIGINT,
        COUNT(DISTINCT e.session_id)::BIGINT,
        COALESCE(SUM(e.duration), 0)::BIGINT,
        SUM(CASE WHEN (e.actions->>'click_line')::INT = 1 THEN 1 ELSE 0 END)::BIGINT,
        SUM(CASE WHEN (e.actions->>'click_call')::INT = 1 THEN 1 ELSE 0 END)::BIGINT
    FROM public.uag_events e
    WHERE e.agent_id = p_agent_id
    GROUP BY e.property_id;
END;
$$;

-- 3. 購買客戶 RPC (含審計)
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

    -- 4. 紀錄購買
    INSERT INTO public.uag_lead_purchases (agent_id, session_id, grade, cost, used_quota)
    VALUES (p_user_id, p_lead_id, p_grade, CASE WHEN v_use_quota THEN 0 ELSE p_cost END, v_use_quota);

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

    -- 7. 審計成功紀錄
    v_result := jsonb_build_object('success', true, 'used_quota', v_use_quota);
    INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success)
    VALUES ('purchase_lead', p_user_id, p_lead_id,
            jsonb_build_object('cost', p_cost, 'grade', p_grade),
            v_result, true);

    RETURN v_result;
END;
$$;
