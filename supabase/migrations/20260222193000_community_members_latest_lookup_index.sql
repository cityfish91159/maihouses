-- #12b: Header 社區導航分層
-- 最佳化 /api/community/my 的「使用者最新有效社區歸屬」查詢
-- 查詢條件：user_id + status='active'，排序：joined_at DESC, created_at DESC

CREATE INDEX IF NOT EXISTS idx_community_members_user_status_joined_created
ON public.community_members (user_id, status, joined_at DESC, created_at DESC);

