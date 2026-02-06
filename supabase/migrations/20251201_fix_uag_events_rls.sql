-- ==============================================================================
-- 修復 uag_events 和 uag_sessions RLS 問題
-- 日期：2024/12/01
-- 說明：為 UAG 相關表啟用 RLS 並設定適當的政策
-- ==============================================================================

-- ============ uag_events ============

-- 1. 啟用 RLS
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_events FORCE ROW LEVEL SECURITY;

-- 2. 刪除舊政策
DROP POLICY IF EXISTS "Allow anon insert" ON public.uag_events;
DROP POLICY IF EXISTS "Agent can read own events" ON public.uag_events;
DROP POLICY IF EXISTS "Service role full access" ON public.uag_events;
DROP POLICY IF EXISTS "anon_insert_events" ON public.uag_events;
DROP POLICY IF EXISTS "authenticated_insert_events" ON public.uag_events;
DROP POLICY IF EXISTS "agent_read_own_events" ON public.uag_events;
DROP POLICY IF EXISTS "service_role_full_access" ON public.uag_events;

-- 3. 建立新政策
CREATE POLICY "anon_insert_events" ON public.uag_events 
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "authenticated_insert_events" ON public.uag_events 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "agent_read_own_events" ON public.uag_events 
FOR SELECT TO authenticated USING (agent_id = auth.uid()::text);

CREATE POLICY "service_role_full_access" ON public.uag_events 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ uag_sessions ============

-- 1. 啟用 RLS
ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_sessions FORCE ROW LEVEL SECURITY;

-- 2. 刪除舊政策
DROP POLICY IF EXISTS "anon_insert_sessions" ON public.uag_sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON public.uag_sessions;
DROP POLICY IF EXISTS "authenticated_insert_sessions" ON public.uag_sessions;
DROP POLICY IF EXISTS "agent_read_own_sessions" ON public.uag_sessions;
DROP POLICY IF EXISTS "service_role_sessions_access" ON public.uag_sessions;

-- 3. 建立新政策
-- 匿名用戶可以 INSERT/UPDATE（建立和更新會話）
CREATE POLICY "anon_insert_sessions" ON public.uag_sessions 
FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "anon_update_sessions" ON public.uag_sessions 
FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- 已認證用戶可以 INSERT/UPDATE
CREATE POLICY "authenticated_insert_sessions" ON public.uag_sessions 
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_sessions" ON public.uag_sessions 
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- 經紀人只能讀取自己的 sessions
CREATE POLICY "agent_read_own_sessions" ON public.uag_sessions 
FOR SELECT TO authenticated USING (agent_id = auth.uid()::text);

-- Service role 完整存取
CREATE POLICY "service_role_sessions_access" ON public.uag_sessions 
FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============ uag_events_archive（如果存在）============
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uag_events_archive') THEN
    ALTER TABLE public.uag_events_archive ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.uag_events_archive FORCE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "service_role_archive_access" ON public.uag_events_archive;
    CREATE POLICY "service_role_archive_access" ON public.uag_events_archive 
    FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;
