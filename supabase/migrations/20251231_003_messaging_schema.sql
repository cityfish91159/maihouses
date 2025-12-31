-- =============================================================================
-- MSG-1: 私訊系統資料模型
-- Migration: 20251231_003_messaging_schema.sql
-- =============================================================================

-- ============================================================================
-- 1. conversations 表 - 對話
-- ============================================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,                           -- 房仲 profile_id
  consumer_session_id TEXT NOT NULL,                -- UAG session_id（購買時的匿名識別）
  consumer_profile_id UUID,                         -- 消費者 profile_id（回覆後填入）
  property_id TEXT,                                 -- 相關物件
  lead_id UUID REFERENCES uag_leads(id),            -- 關聯的 uag_leads 記錄
  status TEXT NOT NULL DEFAULT 'pending'            -- pending → active → closed
    CHECK (status IN ('pending', 'active', 'closed')),
  unread_agent INT NOT NULL DEFAULT 0,              -- 房仲未讀數
  unread_consumer INT NOT NULL DEFAULT 0,           -- 消費者未讀數
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- conversations 索引
CREATE INDEX IF NOT EXISTS idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversations_consumer_session_id ON conversations(consumer_session_id);
CREATE INDEX IF NOT EXISTS idx_conversations_consumer_profile_id ON conversations(consumer_profile_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);

-- ============================================================================
-- 2. messages 表 - 訊息
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('agent', 'consumer')),
  sender_id UUID,                                   -- profile_id
  content TEXT NOT NULL,                            -- 訊息內容（可含聯絡資料）
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ                               -- 已讀時間
);

-- messages 索引
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- 3. RLS 政策
-- ============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- conversations RLS: 房仲只能看自己的 conversation
CREATE POLICY "conversations_agent_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid()::TEXT);

-- conversations RLS: 消費者只能看自己的 conversation
CREATE POLICY "conversations_consumer_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (consumer_profile_id = auth.uid());

-- conversations RLS: 允許房仲建立對話
CREATE POLICY "conversations_agent_insert" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid()::TEXT);

-- conversations RLS: 允許更新自己的對話
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid()::TEXT OR consumer_profile_id = auth.uid());

-- messages RLS: 參與者可以查看訊息
CREATE POLICY "messages_select" ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid()::TEXT OR c.consumer_profile_id = auth.uid())
    )
  );

-- messages RLS: 參與者可以發送訊息
CREATE POLICY "messages_insert" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid()::TEXT OR c.consumer_profile_id = auth.uid())
    )
  );

-- messages RLS: 允許更新已讀時間
CREATE POLICY "messages_update_read" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid()::TEXT OR c.consumer_profile_id = auth.uid())
    )
  );

-- ============================================================================
-- 4. 觸發器：自動更新 updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at_trigger
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversations_updated_at();

-- ============================================================================
-- 5. 輔助函數：建立對話（供 purchase_lead 呼叫）
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_create_conversation(
  p_agent_id TEXT,
  p_consumer_session_id TEXT,
  p_property_id TEXT,
  p_lead_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
BEGIN
  INSERT INTO conversations (agent_id, consumer_session_id, property_id, lead_id, status)
  VALUES (p_agent_id, p_consumer_session_id, p_property_id, p_lead_id, 'pending')
  RETURNING id INTO v_conversation_id;
  
  RETURN v_conversation_id;
END;
$$;

-- ============================================================================
-- 6. 輔助函數：發送訊息
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_send_message(
  p_conversation_id UUID,
  p_sender_type TEXT,
  p_sender_id UUID,
  p_content TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_message_id UUID;
BEGIN
  -- 插入訊息
  INSERT INTO messages (conversation_id, sender_type, sender_id, content)
  VALUES (p_conversation_id, p_sender_type, p_sender_id, p_content)
  RETURNING id INTO v_message_id;
  
  -- 更新未讀計數
  IF p_sender_type = 'agent' THEN
    UPDATE conversations SET unread_consumer = unread_consumer + 1 WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations SET unread_agent = unread_agent + 1 WHERE id = p_conversation_id;
  END IF;
  
  -- 如果是消費者首次回覆，更新狀態為 active
  IF p_sender_type = 'consumer' THEN
    UPDATE conversations 
    SET status = 'active', consumer_profile_id = p_sender_id
    WHERE id = p_conversation_id AND status = 'pending';
  END IF;
  
  RETURN v_message_id;
END;
$$;

-- ============================================================================
-- 7. 輔助函數：標記已讀
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_mark_messages_read(
  p_conversation_id UUID,
  p_reader_type TEXT  -- 'agent' or 'consumer'
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INT;
BEGIN
  -- 標記對方發送的訊息為已讀
  UPDATE messages
  SET read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND sender_type != p_reader_type
    AND read_at IS NULL;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- 重置未讀計數
  IF p_reader_type = 'agent' THEN
    UPDATE conversations SET unread_agent = 0 WHERE id = p_conversation_id;
  ELSE
    UPDATE conversations SET unread_consumer = 0 WHERE id = p_conversation_id;
  END IF;
  
  RETURN v_count;
END;
$$;

-- ============================================================================
-- 完成
-- ============================================================================
