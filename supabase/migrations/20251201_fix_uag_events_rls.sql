-- ==============================================================================
-- 修復 uag_events RLS 問題
-- 日期：2024/12/01
-- 說明：為 uag_events 啟用 RLS 並設定適當的政策
-- ==============================================================================

-- 1. 啟用 RLS
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;

-- 2. 強制對所有人（包括 table owner）套用 RLS
ALTER TABLE public.uag_events FORCE ROW LEVEL SECURITY;

-- 3. 刪除舊政策（如果存在）
DROP POLICY IF EXISTS "Allow anon insert" ON public.uag_events;
DROP POLICY IF EXISTS "Agent can read own events" ON public.uag_events;
DROP POLICY IF EXISTS "Service role full access" ON public.uag_events;

-- 4. 建立新政策

-- 匿名用戶可以 INSERT（追蹤事件）
CREATE POLICY "anon_insert_events" 
ON public.uag_events 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- 已認證用戶可以 INSERT
CREATE POLICY "authenticated_insert_events" 
ON public.uag_events 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 經紀人只能讀取自己的事件
CREATE POLICY "agent_read_own_events" 
ON public.uag_events 
FOR SELECT 
TO authenticated 
USING (agent_id = auth.uid()::text);

-- Service role 完整存取（用於後台分析）
CREATE POLICY "service_role_full_access" 
ON public.uag_events 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- ==============================================================================
-- 同時處理 uag_events_archive（如果存在）
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'uag_events_archive') THEN
    ALTER TABLE public.uag_events_archive ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.uag_events_archive FORCE ROW LEVEL SECURITY;
    
    -- Service role 完整存取
    DROP POLICY IF EXISTS "service_role_archive_access" ON public.uag_events_archive;
    CREATE POLICY "service_role_archive_access" 
    ON public.uag_events_archive 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);
  END IF;
END $$;
