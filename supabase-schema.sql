-- UAG (User Activity & Growth) Events Table
-- 用於追蹤用戶行為、廣告效果分析

CREATE TABLE IF NOT EXISTS uag_events (
  id BIGSERIAL PRIMARY KEY,
  event VARCHAR(100) NOT NULL,
  page VARCHAR(500) NOT NULL,
  target_id VARCHAR(200),
  session_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  ts TIMESTAMPTZ NOT NULL,
  meta JSONB DEFAULT '{}',
  request_id UUID UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引優化查詢效能
CREATE INDEX idx_uag_events_event ON uag_events(event);
CREATE INDEX idx_uag_events_session_id ON uag_events(session_id);
CREATE INDEX idx_uag_events_user_id ON uag_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_uag_events_ts ON uag_events(ts DESC);
CREATE INDEX idx_uag_events_created_at ON uag_events(created_at DESC);
CREATE INDEX idx_uag_events_meta ON uag_events USING GIN(meta);

-- UAG Analytics Views
-- 每日事件統計
CREATE OR REPLACE VIEW uag_daily_stats AS
SELECT 
  DATE(ts) as date,
  event,
  COUNT(*) as count,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(DISTINCT user_id) as unique_users
FROM uag_events
GROUP BY DATE(ts), event
ORDER BY date DESC, count DESC;

-- 用戶旅程分析
CREATE OR REPLACE VIEW uag_user_journey AS
SELECT 
  session_id,
  user_id,
  ARRAY_AGG(event ORDER BY ts) as events,
  ARRAY_AGG(page ORDER BY ts) as pages,
  MIN(ts) as session_start,
  MAX(ts) as session_end,
  COUNT(*) as event_count
FROM uag_events
GROUP BY session_id, user_id
ORDER BY session_start DESC;

-- Row Level Security (RLS)
ALTER TABLE uag_events ENABLE ROW LEVEL SECURITY;

-- Policy: 允許所有人插入 (前端追蹤)
CREATE POLICY "Allow insert for everyone" ON uag_events
  FOR INSERT
  WITH CHECK (true);

-- Policy: 只有認證用戶可以讀取
CREATE POLICY "Allow read for authenticated users" ON uag_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- 說明文件
COMMENT ON TABLE uag_events IS 'UAG 用戶活動與成長追蹤事件表';
COMMENT ON COLUMN uag_events.event IS '事件名稱 (例: card_view, card_member_cta)';
COMMENT ON COLUMN uag_events.page IS '頁面路徑';
COMMENT ON COLUMN uag_events.target_id IS '目標物件 ID (例: 房源 ID)';
COMMENT ON COLUMN uag_events.session_id IS '會話 ID';
COMMENT ON COLUMN uag_events.user_id IS '用戶 ID (登入後才有)';
COMMENT ON COLUMN uag_events.ts IS '事件發生時間';
COMMENT ON COLUMN uag_events.meta IS '額外元數據 (JSON)';
COMMENT ON COLUMN uag_events.request_id IS '請求唯一 ID (防重複)';
