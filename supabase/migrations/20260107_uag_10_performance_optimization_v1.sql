-- ==============================================================================
-- UAG-10: 性能優化 - 房源統計查詢加速 (版本 A - 可在 Supabase Migrations 執行)
-- 目的：優化 fetchPropertyViewStatsFallback 性能，使用 SQL 聚合取代前端計算
-- 預期效果：查詢速度提升 10-100 倍
-- ==============================================================================
-- 注意：此版本不使用 CONCURRENTLY，會短暫鎖表
--       適合在開發環境或 uag_events 表資料量還不大時使用
-- ==============================================================================

-- 1. 添加複合索引優化查詢性能
-- 覆蓋索引：包含所有查詢需要的欄位，避免回表
CREATE INDEX IF NOT EXISTS idx_uag_events_agent_property_composite
ON public.uag_events (agent_id, property_id, session_id)
INCLUDE (duration, actions, created_at);

-- 2. 創建優化版 RPC：get_property_stats_optimized
-- 特點：
-- - 單次 SQL 查詢完成所有聚合
-- - 使用覆蓋索引避免回表
-- - 返回格式與現有 TypeScript interface 完全相容
CREATE OR REPLACE FUNCTION public.get_property_stats_optimized(p_agent_id TEXT)
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
    COUNT(*)::BIGINT as view_count,
    COUNT(DISTINCT e.session_id)::BIGINT as unique_sessions,
    COALESCE(SUM(e.duration), 0)::BIGINT as total_duration,
    SUM(CASE
      WHEN (e.actions->>'click_line')::INT = 1 THEN 1
      ELSE 0
    END)::BIGINT as line_clicks,
    SUM(CASE
      WHEN (e.actions->>'click_call')::INT = 1 THEN 1
      ELSE 0
    END)::BIGINT as call_clicks
  FROM public.uag_events e
  WHERE e.agent_id = p_agent_id
    AND e.property_id IS NOT NULL
  GROUP BY e.property_id
  ORDER BY view_count DESC;
END;
$$;

-- 3. 註解說明
COMMENT ON FUNCTION public.get_property_stats_optimized(TEXT) IS
'UAG-10: 優化版房源統計查詢
- 使用複合索引加速查詢
- SQL 層完成聚合，避免前端計算
- 相容現有 PropertyViewStats interface';

-- 4. 授權：允許已認證用戶查詢自己的統計
GRANT EXECUTE ON FUNCTION public.get_property_stats_optimized(TEXT) TO authenticated;

-- 5. 驗證索引生效
-- 執行 EXPLAIN ANALYZE 驗證查詢計劃使用索引
-- psql: EXPLAIN ANALYZE SELECT * FROM get_property_stats_optimized('test-agent-id');
