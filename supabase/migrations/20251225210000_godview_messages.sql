-- 20251225210000_godview_messages.sql
-- GodView 推送訊息系統：管理員可以發送訊息給特定用戶

-- 1. GodView 訊息表
CREATE TABLE IF NOT EXISTS godview_messages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL, -- 目標用戶（不用 FK 因為是 MVP 模式）
  message_type text NOT NULL DEFAULT 'chat' CHECK (message_type IN ('chat', 'task', 'voice', 'photo')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}', -- 額外資料如語音 URL、任務詳情等
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 2. 開啟 RLS
ALTER TABLE godview_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS 政策

-- 所有人可以讀取發給自己的訊息（用 user_id 匹配）
CREATE POLICY "Users can view own messages" ON godview_messages
  FOR SELECT USING (true); -- MVP: 開放讀取

-- 所有人可以插入（MVP 階段不驗證身份）
CREATE POLICY "Anyone can insert messages" ON godview_messages
  FOR INSERT WITH CHECK (true);

-- 用戶可以更新自己的訊息（標記已讀）
CREATE POLICY "Anyone can update messages" ON godview_messages
  FOR UPDATE USING (true);

-- 4. 索引優化
CREATE INDEX IF NOT EXISTS idx_godview_messages_user_id ON godview_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_godview_messages_created_at ON godview_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_godview_messages_unread ON godview_messages(user_id, is_read) WHERE is_read = false;

-- 5. 開啟 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE godview_messages;
