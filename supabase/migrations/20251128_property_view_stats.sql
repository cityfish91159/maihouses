-- ==============================================================================
-- 房源瀏覽統計 RPC 函數
-- 用於 UAG Dashboard 顯示房仲的房源被瀏覽情況
-- ==============================================================================

-- 獲取某房仲所有房源的瀏覽統計
CREATE OR REPLACE FUNCTION public.get_agent_property_stats(p_agent_id UUID)
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
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT e.session_id)::BIGINT as unique_sessions,
    COALESCE(SUM(e.duration), 0)::BIGINT as total_duration,
    COUNT(CASE WHEN (e.actions->>'click_line')::INT = 1 THEN 1 END)::BIGINT as line_clicks,
    COUNT(CASE WHEN (e.actions->>'click_call')::INT = 1 THEN 1 END)::BIGINT as call_clicks
  FROM public.uag_events e
  INNER JOIN public.properties p ON e.property_id = p.public_id
  WHERE p.agent_id = p_agent_id
  GROUP BY e.property_id
  ORDER BY view_count DESC;
END;
$$;

-- 獲取單一房源的詳細瀏覽記錄
CREATE OR REPLACE FUNCTION public.get_property_view_details(p_property_id TEXT)
RETURNS TABLE (
  session_id TEXT,
  duration INTEGER,
  scroll_depth INTEGER,
  actions JSONB,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.session_id,
    e.duration,
    (e.actions->>'scroll_depth')::INTEGER as scroll_depth,
    e.actions,
    e.created_at
  FROM public.uag_events e
  WHERE e.property_id = p_property_id
  ORDER BY e.created_at DESC
  LIMIT 100;
END;
$$;

-- 授權：任何已登入用戶都可以查詢自己房源的統計
GRANT EXECUTE ON FUNCTION public.get_agent_property_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_property_view_details(TEXT) TO authenticated;
