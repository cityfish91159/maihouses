-- 檔案：20251206_fix_community_reviews_view.sql
-- 說明：重建 community_reviews View，補齊 author_id / property_id / pros/cons 欄位，
--       以符合 /api/community/wall 的查詢欄位，避免 column not exists 錯誤。

DROP VIEW IF EXISTS public.community_reviews CASCADE;

CREATE VIEW public.community_reviews AS
SELECT 
  p.id,
  p.community_id,
  p.agent_id AS author_id,
  p.id AS property_id,
  p.advantage_1,
  p.advantage_2,
  p.disadvantage,
  p.source_platform,
  p.source_external_id AS source,
  p.created_at,
  jsonb_build_object(
    'pros', ARRAY[p.advantage_1, p.advantage_2],
    'cons', p.disadvantage,
    'property_title', p.title
  ) AS content
FROM public.properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);

ALTER VIEW public.community_reviews SET (security_invoker = true);
GRANT SELECT ON public.community_reviews TO anon, authenticated;
