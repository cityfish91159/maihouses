-- =====================================================
-- GodView Messages 表 - 用於 GodView 推送訊息到 NightMode
-- =====================================================

-- 1. 創建 godview_messages 表
CREATE TABLE IF NOT EXISTS godview_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message_type VARCHAR(50) NOT NULL DEFAULT 'chat',
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 創建索引以優化查詢
CREATE INDEX IF NOT EXISTS idx_godview_messages_user_id
ON godview_messages(user_id);

CREATE INDEX IF NOT EXISTS idx_godview_messages_is_read
ON godview_messages(user_id, is_read)
WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_godview_messages_created_at
ON godview_messages(created_at DESC);

-- 3. 啟用 Row Level Security
ALTER TABLE godview_messages ENABLE ROW LEVEL SECURITY;

-- 4. RLS 政策 - 允許匿名用戶操作
CREATE POLICY "Allow anonymous read"
ON godview_messages FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anonymous insert"
ON godview_messages FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anonymous update"
ON godview_messages FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anonymous delete"
ON godview_messages FOR DELETE
TO anon
USING (true);

-- 5. 啟用 Realtime (讓 NightMode 能即時接收訊息)
ALTER PUBLICATION supabase_realtime ADD TABLE godview_messages;

-- 6. 添加註釋
COMMENT ON TABLE godview_messages IS 'GodView 管理員推送給用戶的訊息';
COMMENT ON COLUMN godview_messages.user_id IS '目標用戶的 session ID';
COMMENT ON COLUMN godview_messages.message_type IS '訊息類型: chat, voice, task';
COMMENT ON COLUMN godview_messages.content IS '訊息內容';
COMMENT ON COLUMN godview_messages.metadata IS '額外資料 (audioUrl, taskData 等)';
COMMENT ON COLUMN godview_messages.is_read IS '用戶是否已讀';
