-- 20251225220000_intimate_sessions.sql
-- 追蹤親密互動時段（含自慰紀錄）

CREATE TABLE IF NOT EXISTS intimate_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  session_type text NOT NULL DEFAULT 'desire_help' CHECK (session_type IN ('desire_help', 'intimate', 'intimate_photo')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  metadata jsonb DEFAULT '{}', -- 可存儲額外資訊如 time_of_day, day_of_week 等
  created_at timestamptz DEFAULT now()
);

-- 開啟 RLS
ALTER TABLE intimate_sessions ENABLE ROW LEVEL SECURITY;

-- RLS 政策 - MVP 階段開放
CREATE POLICY "Anyone can insert sessions" ON intimate_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view sessions" ON intimate_sessions
  FOR SELECT USING (true);

CREATE POLICY "Anyone can update sessions" ON intimate_sessions
  FOR UPDATE USING (true);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_intimate_sessions_user_id ON intimate_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_intimate_sessions_started ON intimate_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_intimate_sessions_type ON intimate_sessions(session_type);

-- 統計視圖：每個用戶的親密互動統計
CREATE OR REPLACE VIEW intimate_stats AS
SELECT
  user_id,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE session_type = 'desire_help') as desire_help_count,
  AVG(duration_seconds) FILTER (WHERE duration_seconds IS NOT NULL) as avg_duration,
  MAX(started_at) as last_session,
  MIN(started_at) as first_session
FROM intimate_sessions
GROUP BY user_id;
