-- =============================================================================
-- ⚠️ ROLLBACK PLAN for 20251231_004_fix_messaging_critical_issues.sql
-- =============================================================================
--
-- ⚠️ 警告：此檔案提供回滾方案，請人工確認後執行
--
-- 執行前必須確認：
-- 1. 備份資料庫：pg_dump 或 Supabase Dashboard 備份
-- 2. 檢查是否有資料：SELECT COUNT(*) FROM conversations;
-- 3. 手動執行，不要自動套用
--
-- =============================================================================

-- Step 1: 還原 agent_id 為 TEXT 類型
ALTER TABLE conversations
ADD COLUMN agent_id_text TEXT;

-- Step 2: 轉換現有資料
UPDATE conversations
SET agent_id_text = agent_id::TEXT;

-- Step 3: 刪除 UUID 欄位
ALTER TABLE conversations
DROP COLUMN agent_id;

-- Step 4: 重新命名
ALTER TABLE conversations
RENAME COLUMN agent_id_text TO agent_id;

-- Step 5: 設定 NOT NULL
ALTER TABLE conversations
ALTER COLUMN agent_id SET NOT NULL;

-- Step 6: 重建索引
DROP INDEX IF EXISTS idx_conversations_agent_id;
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);

-- Step 7: 還原 RLS policies（使用 ::TEXT 轉換）
DROP POLICY IF EXISTS "conversations_agent_select" ON conversations;
CREATE POLICY "conversations_agent_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "conversations_agent_insert" ON conversations;
CREATE POLICY "conversations_agent_insert" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid()::TEXT);

DROP POLICY IF EXISTS "conversations_update" ON conversations;
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid()::TEXT OR consumer_profile_id = auth.uid());

-- Step 8: 還原 messages RLS
DROP POLICY IF EXISTS "messages_select" ON messages;
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

DROP POLICY IF EXISTS "messages_insert" ON messages;
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

DROP POLICY IF EXISTS "messages_update_read" ON messages;
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

-- Step 9: 還原 FK constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_lead_id_fkey;

ALTER TABLE conversations
ADD CONSTRAINT conversations_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES uag_leads(id);

-- Step 10: 還原 consumer select policy（移除 session_id 邏輯）
DROP POLICY IF EXISTS "conversations_consumer_select" ON conversations;
CREATE POLICY "conversations_consumer_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (consumer_profile_id = auth.uid());

-- Step 11: 還原 fn_create_conversation
CREATE OR REPLACE FUNCTION fn_create_conversation(
  p_agent_id TEXT,                    -- 還原為 TEXT
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
