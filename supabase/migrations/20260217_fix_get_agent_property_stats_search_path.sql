-- ==============================================================================
-- Fix: get_agent_property_stats mutable search_path
--
-- 原因：Supabase Linter 警告此函數未設定 search_path，
-- 存在 search_path injection 風險。
--
-- 修復：使用 CREATE OR REPLACE 重新定義，加上
-- SECURITY DEFINER SET search_path = public。
-- 函數邏輯與回傳結構與原始定義完全一致。
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_agent_property_stats(p_agent_id TEXT)
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
SET search_path = public
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
