-- ==============================================================================
-- 修復 View SECURITY DEFINER 問題
-- 日期：2024/12/01
-- 說明：將 View 設為 SECURITY INVOKER 以遵循查詢者的 RLS 權限
-- ==============================================================================

-- ============ agent_lead_stats ============
DROP VIEW IF EXISTS public.agent_lead_stats CASCADE;

CREATE VIEW public.agent_lead_stats AS
SELECT 
    agent_id,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
    COUNT(*) FILTER (WHERE status IN ('visit_scheduled', 'visited')) as active_leads,
    COUNT(*) FILTER (WHERE status = 'closed_won') as won_leads,
    COUNT(*) as total_leads,
    AVG(
        EXTRACT(EPOCH FROM (first_contacted_at - created_at)) / 60
    ) FILTER (WHERE first_contacted_at IS NOT NULL) as avg_response_minutes,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'new') as today_new,
    COUNT(*) FILTER (
        WHERE status = 'new' 
        AND first_contacted_at IS NULL 
        AND created_at < NOW() - INTERVAL '10 minutes'
    ) as overdue_leads
FROM public.leads
GROUP BY agent_id;

ALTER VIEW public.agent_lead_stats SET (security_invoker = true);
GRANT SELECT ON public.agent_lead_stats TO authenticated;

-- ============ community_reviews ============
DROP TABLE IF EXISTS public.community_reviews CASCADE;
DROP VIEW IF EXISTS public.community_reviews CASCADE;

CREATE VIEW public.community_reviews AS
SELECT 
  p.id,
  p.community_id,
  p.agent_id AS author_id,
  p.created_at,
  jsonb_build_object(
    'pros', ARRAY[p.advantage_1, p.advantage_2],
    'cons', p.disadvantage,
    'property_title', p.title
  ) AS content,
  p.source_platform,
  p.source_external_id
FROM public.properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);

ALTER VIEW public.community_reviews SET (security_invoker = true);
GRANT SELECT ON public.community_reviews TO anon, authenticated;
