-- Optimization: Create uag_leads table and indices
-- This table stores the calculated grade for each user-property interaction

CREATE TABLE IF NOT EXISTS public.uag_leads (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    pid TEXT NOT NULL,
    grade CHAR(1),        -- 'S' / 'A' / 'B' / 'C' / 'F'
    score INTEGER,        -- Points
    last_visit_ts TIMESTAMPTZ,
    total_duration INTEGER,
    visit_count INTEGER,
    district TEXT,
    favorite_grade TEXT,  -- F0~F4
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uag_leads_unique_interaction UNIQUE (session_id, agent_id, pid)
);

CREATE INDEX IF NOT EXISTS idx_leads_agent_grade ON public.uag_leads (agent_id, grade, updated_at);
CREATE INDEX IF NOT EXISTS idx_leads_session ON public.uag_leads (session_id);

-- Ensure uag_event_logs has the right indices for aggregation
CREATE INDEX IF NOT EXISTS idx_uag_logs_session_pid ON public.uag_event_logs (session_id, pid);
CREATE INDEX IF NOT EXISTS idx_uag_logs_ts ON public.uag_event_logs (created_at);

-- Archive table for cold storage (as requested in Plan B)
CREATE TABLE IF NOT EXISTS public.uag_event_logs_archive (
    LIKE public.uag_event_logs INCLUDING ALL
);

-- Function to archive old logs (to be called by a cron job or manually)
CREATE OR REPLACE FUNCTION archive_old_uag_logs()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Move logs older than 30 days to archive
  INSERT INTO public.uag_event_logs_archive
  SELECT * FROM public.uag_event_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  -- Delete from main table
  DELETE FROM public.uag_event_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;
