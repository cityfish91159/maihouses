-- ==============================================================================
-- UAG-3: RPC Functions & Credit System
-- 1. Setup Credit System (Agents Table Extension)
-- 2. Create Purchase History Table
-- 3. Implement get_agent_property_stats RPC
-- 4. Implement purchase_lead RPC (Atomic Transaction)
-- ==============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. Credit System Setup
-- ══════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS quota_s INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_a INTEGER DEFAULT 0;

COMMENT ON COLUMN public.agents.points IS '房仲點數平衡';
COMMENT ON COLUMN public.agents.quota_s IS 'S 級客戶剩餘配額';
COMMENT ON COLUMN public.agents.quota_a IS 'A 級客戶剩餘配額';

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. Purchase History Table
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.uag_lead_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,                   -- 購買者 (auth.uid)
    session_id TEXT NOT NULL,                -- 購買的 UAG 會話
    grade CHAR(1) NOT NULL,                  -- 當時等級
    cost INTEGER NOT NULL,                   -- 消耗點數 (0 if using quota)
    used_quota BOOLEAN DEFAULT false,        -- 是否使用配額
    purchased_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_purchase_agent ON public.uag_lead_purchases(agent_id);
CREATE INDEX idx_purchase_session ON public.uag_lead_purchases(session_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. get_agent_property_stats RPC
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION get_agent_property_stats(p_agent_id TEXT)
RETURNS TABLE (
  property_id TEXT,           -- 房源 public_id
  view_count BIGINT,          -- 總瀏覽次數
  unique_sessions BIGINT,     -- 不重複訪客數
  total_duration BIGINT,      -- 總停留秒數
  line_clicks BIGINT,         -- LINE 點擊次數
  call_clicks BIGINT          -- 電話點擊次數
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.property_id,
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT e.session_id)::BIGINT as unique_sessions,
    SUM(e.duration)::BIGINT as total_duration,
    SUM(CASE WHEN (e.actions->>'click_line')::INT = 1 THEN 1 ELSE 0 END)::BIGINT as line_clicks,
    SUM(CASE WHEN (e.actions->>'click_call')::INT = 1 THEN 1 ELSE 0 END)::BIGINT as call_clicks
  FROM public.uag_events e
  WHERE e.agent_id = p_agent_id
  GROUP BY e.property_id;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. purchase_lead RPC (Atomic Transaction)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION purchase_lead(
  p_user_id TEXT,
  p_lead_id TEXT, -- 實際為 UAG session_id
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
    v_agent_id TEXT := p_user_id;
    v_session_id TEXT := p_lead_id;
    v_property_id TEXT;
    v_customer_phone TEXT;
BEGIN
    -- 1. 檢查是否已購買
    IF EXISTS (SELECT 1 FROM public.uag_lead_purchases WHERE agent_id = v_agent_id AND session_id = v_session_id) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Already purchased');
    END IF;

    -- 2. 鎖定並檢查餘額
    SELECT points, quota_s, quota_a INTO v_points, v_quota_s, v_quota_a 
    FROM public.agents WHERE id = p_user_id::UUID FOR UPDATE;

    IF p_grade = 'S' AND v_quota_s > 0 THEN
        v_use_quota := true;
        UPDATE public.agents SET quota_s = quota_s - 1 WHERE id = p_user_id::UUID;
    ELSIF p_grade = 'A' AND v_quota_a > 0 THEN
        v_use_quota := true;
        UPDATE public.agents SET quota_a = quota_a - 1 WHERE id = p_user_id::UUID;
    ELSIF v_points >= p_cost THEN
        UPDATE public.agents SET points = points - p_cost WHERE id = p_user_id::UUID;
    ELSE
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
    END IF;

    -- 3. 紀錄購買
    INSERT INTO public.uag_lead_purchases (agent_id, session_id, grade, cost, used_quota)
    VALUES (v_agent_id, v_session_id, p_grade, CASE WHEN v_use_quota THEN 0 ELSE p_cost END, v_use_quota);

    -- 4. 建立/更新 Leads 表
    -- 取最近一次事件的 property_id 作為主要關聯
    SELECT property_id INTO v_property_id FROM public.uag_events 
    WHERE session_id = v_session_id ORDER BY created_at DESC LIMIT 1;
    
    -- 模擬聯絡資訊 (實作中應從 session summary 或 fingerprint 關聯)
    v_customer_phone := '09' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');

    INSERT INTO public.leads (property_id, agent_id, customer_name, customer_phone, status, source)
    VALUES (v_property_id, v_agent_id, '客端訪客 ' || SUBSTR(v_session_id, 1, 4), v_customer_phone, 'purchased', 'uag')
    ON CONFLICT DO NOTHING;

    RETURN jsonb_build_object('success', true, 'used_quota', v_use_quota);
END;
$$;
