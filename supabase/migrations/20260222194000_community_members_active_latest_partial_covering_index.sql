-- #12b optimization: latest active community membership lookup
-- Query pattern:
--   WHERE user_id = ? AND status = 'active'
--   ORDER BY joined_at DESC, created_at DESC
--   LIMIT 1
--
-- Upgrade from wide composite index to a smaller partial covering index.
-- 1) Keep only active rows in index (partial index)
-- 2) Cover selected column community_id for index-only scan opportunity

CREATE INDEX IF NOT EXISTS idx_community_members_active_latest_covering
ON public.community_members (user_id, joined_at DESC, created_at DESC)
INCLUDE (community_id)
WHERE status = 'active';

DROP INDEX IF EXISTS public.idx_community_members_user_status_joined_created;
