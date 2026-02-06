-- ==============================================================================
-- UAG-10: 性能優化 - 房源統計查詢加速 (版本 B - 正式環境專用)
-- 目的：優化 fetchPropertyViewStatsFallback 性能，使用 SQL 聚合取代前端計算
-- 預期效果：查詢速度提升 10-100 倍
-- ==============================================================================
-- ⚠️ 重要：此檔案必須在 psql 或 Supabase SQL Editor 中手動執行
--         不能透過 Supabase migrations 系統執行（因為 CONCURRENTLY 需要在 transaction 外執行）
-- ==============================================================================

-- 執行方式 1: Supabase SQL Editor
-- 1. 開啟 Supabase Dashboard > SQL Editor
-- 2. 複製整個檔案內容並貼上
-- 3. 點擊 "Run" 按鈕

-- 執行方式 2: psql 命令列
-- psql "postgresql://[YOUR_CONNECTION_STRING]" -f 20260107_uag_10_performance_optimization_v2_manual.sql

-- ==============================================================================

-- 1. 先創建 RPC 函數（可以在 transaction 中執行）
BEGIN;

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

COMMENT ON FUNCTION public.get_property_stats_optimized(TEXT) IS
'UAG-10: 優化版房源統計查詢
- 使用複合索引加速查詢
- SQL 層完成聚合，避免前端計算
- 相容現有 PropertyViewStats interface';

GRANT EXECUTE ON FUNCTION public.get_property_stats_optimized(TEXT) TO authenticated;

COMMIT;

-- 2. 建立索引（必須在 transaction 外執行）
-- CONCURRENTLY 的優點：不鎖表，正式環境安全
-- CONCURRENTLY 的缺點：必須在 transaction 外執行
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_uag_events_agent_property_composite
ON public.uag_events (agent_id, property_id, session_id)
INCLUDE (duration, actions, created_at);

-- 3. 驗證索引建立成功
-- 檢查索引是否存在
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'uag_events'
  AND indexname = 'idx_uag_events_agent_property_composite';

-- 4. 驗證查詢效能
-- 執行 EXPLAIN ANALYZE 查看執行計劃
EXPLAIN ANALYZE
SELECT * FROM get_property_stats_optimized('test-agent-id');
