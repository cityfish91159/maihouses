-- =============================================================================
-- MSG-1 修復：修正 3 個致命問題
-- Migration: 20251231_004_fix_messaging_critical_issues.sql
-- =============================================================================

-- ============================================================================
-- 修正 1/3: FK Reference 錯誤
-- 問題: lead_id 引用了不存在的 uag_leads 表
-- 修正: 改為 uag_lead_purchases
-- ============================================================================

-- 先移除錯誤的 FK constraint
ALTER TABLE conversations
DROP CONSTRAINT IF EXISTS conversations_lead_id_fkey;

-- 重新建立正確的 FK
ALTER TABLE conversations
ADD CONSTRAINT conversations_lead_id_fkey
FOREIGN KEY (lead_id) REFERENCES uag_lead_purchases(id) ON DELETE SET NULL;

-- ============================================================================
-- 修正 2/3: RLS Pending 狀態邏輯漏洞
-- 問題: pending 狀態時消費者無法透過 session_id 查看對話
-- 修正: 加入 session_id 比對邏輯
-- ============================================================================

-- 刪除現有的 consumer select policy
DROP POLICY IF EXISTS "conversations_consumer_select" ON conversations;

-- 重建帶有 pending session_id 支援的 policy
CREATE POLICY "conversations_consumer_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (
    -- 已註冊消費者：比對 profile_id
    consumer_profile_id = auth.uid()
    OR
    -- pending 狀態：透過 session_id 比對（從 JWT claim 或 GUC variable）
    (
      status = 'pending'
      AND (
        consumer_session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
        OR
        consumer_session_id = current_setting('app.session_id', true)
      )
    )
  );

-- ============================================================================
-- 修正 3/3: 類型混用問題
-- 問題: agent_id 定義為 TEXT 但與 auth.uid() (UUID) 混用
-- 修正: 統一為 UUID 類型
-- ============================================================================

-- Step 1: 新增臨時欄位儲存 UUID 格式的 agent_id
ALTER TABLE conversations
ADD COLUMN agent_id_uuid UUID;

-- Step 2: 轉換現有資料（如果 agent_id 是有效的 UUID 字串）
UPDATE conversations
SET agent_id_uuid = agent_id::UUID
WHERE agent_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: 刪除舊欄位
ALTER TABLE conversations
DROP COLUMN agent_id;

-- Step 4: 重新命名新欄位
ALTER TABLE conversations
RENAME COLUMN agent_id_uuid TO agent_id;

-- Step 5: 設定 NOT NULL
ALTER TABLE conversations
ALTER COLUMN agent_id SET NOT NULL;

-- Step 6: 重建索引
DROP INDEX IF EXISTS idx_conversations_agent_id;
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);

-- ============================================================================
-- 修正相關 RLS policies（使用正確的 UUID 類型）
-- ============================================================================

-- 刪除舊的 agent policies
DROP POLICY IF EXISTS "conversations_agent_select" ON conversations;
DROP POLICY IF EXISTS "conversations_agent_insert" ON conversations;
DROP POLICY IF EXISTS "conversations_update" ON conversations;

-- 重建 agent select policy（不需要 ::TEXT 轉換）
CREATE POLICY "conversations_agent_select" ON conversations
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- 重建 agent insert policy
CREATE POLICY "conversations_agent_insert" ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

-- 重建 update policy（房仲或消費者都能更新）
CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid() OR consumer_profile_id = auth.uid());

-- 修正 messages RLS policies（移除 ::TEXT 轉換）
DROP POLICY IF EXISTS "messages_select" ON messages;
DROP POLICY IF EXISTS "messages_insert" ON messages;
DROP POLICY IF EXISTS "messages_update_read" ON messages;

CREATE POLICY "messages_select" ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid() OR c.consumer_profile_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid() OR c.consumer_profile_id = auth.uid())
    )
  );

CREATE POLICY "messages_update_read" ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.agent_id = auth.uid() OR c.consumer_profile_id = auth.uid())
    )
  );

-- ============================================================================
-- 修正輔助函數（使用 UUID 類型）
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_create_conversation(
  p_agent_id UUID,                    -- 改為 UUID
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
  -- 檢查是否已存在（idempotent）
  -- 使用 IS NOT DISTINCT FROM 正確處理 NULL 比較
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE agent_id = p_agent_id
    AND consumer_session_id = p_consumer_session_id
    AND property_id IS NOT DISTINCT FROM p_property_id;

  -- 如果不存在，創建新對話
  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (agent_id, consumer_session_id, property_id, lead_id, status)
    VALUES (p_agent_id, p_consumer_session_id, p_property_id, p_lead_id, 'pending')
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

-- ============================================================================
-- 完成
-- ============================================================================
