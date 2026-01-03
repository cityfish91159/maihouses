-- =============================================================================
-- UAG-13: Purchase Lead Notification (Auto-Conversation)
-- Migration: 20260105_uag_13_auto_conversation.sql
-- =============================================================================

-- 重寫 purchase_lead 函數：
-- 1. 購買成功後自動建立對話 (fn_create_conversation)
-- 2. 確保對話正確連結到 lead_id (即使是對話已存在的情況)
-- 3. 回傳 conversation_id 供前端跳轉

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
    v_purchase_id UUID;
    v_conversation_id UUID; -- [NEW]
    v_result JSONB;
BEGIN
    -- 1. 檢查重複購買 (Idempotency)
    IF EXISTS (SELECT 1 FROM public.uag_lead_purchases WHERE agent_id = p_user_id AND session_id = p_lead_id) THEN
        v_result := jsonb_build_object('success', false, 'error', 'Already purchased');
        -- Log audit ...
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
        -- 餘額不足
        v_result := jsonb_build_object('success', false, 'error', 'Insufficient balance');
        INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success, error_code)
        VALUES ('purchase_lead', p_user_id, p_lead_id,
                jsonb_build_object('cost', p_cost, 'grade', p_grade, 'balance', v_points),
                v_result, false, 'INSUFFICIENT_BALANCE');
        RETURN v_result;
    END IF;

    -- 4. 紀錄購買
    INSERT INTO public.uag_lead_purchases (agent_id, session_id, grade, cost, used_quota)
    VALUES (p_user_id, p_lead_id, p_grade, CASE WHEN v_use_quota THEN 0 ELSE p_cost END, v_use_quota)
    RETURNING id INTO v_purchase_id;

    -- 5. 取得客戶資訊 (for leads table)
    SELECT e.property_id, s.fingerprint INTO v_property_id, v_fingerprint
    FROM public.uag_events e
    LEFT JOIN public.uag_sessions s ON e.session_id = s.session_id
    WHERE e.session_id = p_lead_id
    ORDER BY e.created_at DESC LIMIT 1;

    SELECT * INTO v_client_info FROM fn_extract_client_info(COALESCE(v_fingerprint, ''));

    -- 6. 建立 Legacy Lead (相容舊系統)
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

    -- [NEW] 7. 自動建立對話 (Auto-Conversation)
    -- 注意: p_user_id 是 TEXT，必須轉為 UUID
    -- fn_create_conversation 會檢查是否存在，不存在則建立
    v_conversation_id := fn_create_conversation(
        p_user_id::UUID,
        p_lead_id,        -- session_id
        v_property_id,
        v_purchase_id     -- lead_id (FK to uag_lead_purchases)
    );

    -- [NEW] 7.1 強制連結 lead_id (防漏)
    -- 如果對話已存在 (fn_create_conversation 直接返回舊 ID)，
    -- 且該對話原本沒有 lead_id (例如: 購買前的一般詢問)，
    -- 我們必須把這次購買的 purchase_id 補上去，讓它變成「正式交易對話」。
    UPDATE conversations 
    SET lead_id = v_purchase_id,
        updated_at = NOW()
    WHERE id = v_conversation_id 
      AND lead_id IS NULL;

    -- 8. 審計與回傳 (含 conversation_id)
    v_result := jsonb_build_object(
        'success', true, 
        'used_quota', v_use_quota, 
        'purchase_id', v_purchase_id,
        'conversation_id', v_conversation_id -- [NEW]
    );

    INSERT INTO public.uag_audit_logs (action, agent_id, session_id, request, response, success)
    VALUES ('purchase_lead', p_user_id, p_lead_id,
            jsonb_build_object('cost', p_cost, 'grade', p_grade),
            v_result, true);

    RETURN v_result;
END;
$$;
