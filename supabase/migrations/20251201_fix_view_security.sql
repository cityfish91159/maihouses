-- ==============================================================================
-- 修復 View SECURITY DEFINER 問題
-- 日期：2024/12/01
-- 說明：將 View 設為 SECURITY INVOKER 以遵循查詢者的 RLS 權限
-- ==============================================================================

-- 方法 1：重建 View 並明確設定 security_invoker = true
-- PostgreSQL 15+ 支援 CREATE VIEW ... WITH (security_invoker = true)

-- 先 DROP 再重建
DROP VIEW IF EXISTS public.agent_lead_stats CASCADE;

CREATE VIEW public.agent_lead_stats 
WITH (security_invoker = true)
AS
SELECT 
    agent_id,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
    COUNT(*) FILTER (WHERE status IN ('visit_scheduled', 'visited')) as active_leads,
    COUNT(*) FILTER (WHERE status = 'closed_won') as won_leads,
    COUNT(*) as total_leads,
    
    -- 平均首次回覆時間（分鐘）
    AVG(
        EXTRACT(EPOCH FROM (first_contacted_at - created_at)) / 60
    ) FILTER (WHERE first_contacted_at IS NOT NULL) as avg_response_minutes,
    
    -- 今日新 leads
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'new') as today_new,
    
    -- 待回覆（超過 10 分鐘未回）
    COUNT(*) FILTER (
        WHERE status = 'new' 
        AND first_contacted_at IS NULL 
        AND created_at < NOW() - INTERVAL '10 minutes'
    ) as overdue_leads

FROM public.leads
GROUP BY agent_id;

-- 授權給 authenticated 用戶
GRANT SELECT ON public.agent_lead_stats TO authenticated;

-- ==============================================================================
-- 驗證設定
-- ==============================================================================
-- 執行後可用以下 SQL 確認：
-- SELECT schemaname, viewname, definition 
-- FROM pg_views 
-- WHERE viewname = 'agent_lead_stats';
