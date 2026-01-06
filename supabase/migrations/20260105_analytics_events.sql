-- Analytics Events Table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);

-- Enable RLS (optional, depends on your security policy)
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow insert from service role
CREATE POLICY "Allow insert analytics events" ON public.analytics_events
  FOR INSERT TO authenticated, anon
  WITH CHECK (true);
