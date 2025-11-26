-- Fix: Enable RLS on UAG tables to satisfy security requirements
-- This fixes "RLS Disabled in Public" error for uag_sessions and uag_events

-- 1. Enable RLS on uag_sessions
ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Enable RLS on uag_events
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;

-- 3. Re-apply policies for uag_sessions
-- Allow public insert (if needed by client-side tracking, though we use API now)
-- It's safer to allow INSERT but restrict SELECT/UPDATE
DROP POLICY IF EXISTS "Insert sessions" ON public.uag_sessions;
CREATE POLICY "Insert sessions" ON public.uag_sessions
FOR INSERT WITH CHECK (true);

-- 4. Re-apply policies for uag_events
DROP POLICY IF EXISTS "Allow anonymous tracking insert" ON public.uag_events;
CREATE POLICY "Allow anonymous tracking insert" ON public.uag_events
FOR INSERT WITH CHECK (true);
