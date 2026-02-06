-- ============================================================================
-- fn_send_message 函數驗證 SQL
-- 目的：驗證 api/uag/send-message.ts L312-320 的資料庫函數
-- ============================================================================

-- ============================================================================
-- 步驟 1：檢查函數是否存在
-- ============================================================================

SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  p.prosrc as source_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'fn_send_message';

-- ============================================================================
-- 步驟 2：查看函數完整定義
-- ============================================================================

SELECT pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'fn_send_message';

-- ============================================================================
-- 步驟 3：檢查 messages 表結構
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'messages'
ORDER BY ordinal_position;

-- ============================================================================
-- 步驟 4：檢查 messages 表的約束
-- ============================================================================

SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'messages';

-- ============================================================================
-- 步驟 5：測試函數執行（需要實際的 conversation_id）
-- ============================================================================

-- 5.1 先查詢現有對話
SELECT
  id as conversation_id,
  agent_id,
  consumer_session_id,
  status,
  created_at
FROM conversations
ORDER BY created_at DESC
LIMIT 5;

-- 5.2 如果有對話，可以測試發送訊息（請替換實際的 conversation_id）
-- 取消註解並替換 'your-conversation-id-here'

/*
DO $$
DECLARE
  v_conversation_id UUID := 'your-conversation-id-here'::UUID;
  v_message_id UUID;
BEGIN
  -- 呼叫函數發送測試訊息
  SELECT fn_send_message(
    v_conversation_id,
    '測試訊息：驗證 fn_send_message 函數',
    'agent'
  ) INTO v_message_id;

  -- 顯示結果
  RAISE NOTICE '訊息已發送，message_id: %', v_message_id;

  -- 查詢剛插入的訊息
  PERFORM id, conversation_id, sender_type, content, created_at
  FROM messages
  WHERE id = v_message_id;
END $$;
*/

-- ============================================================================
-- 步驟 6：驗證最近的訊息（檢查實際寫入）
-- ============================================================================

SELECT
  m.id,
  m.conversation_id,
  m.sender_type,
  m.sender_id,
  m.content,
  m.created_at,
  m.read_at,
  c.agent_id,
  c.consumer_session_id
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
ORDER BY m.created_at DESC
LIMIT 10;

-- ============================================================================
-- 步驟 7：統計驗證
-- ============================================================================

-- 7.1 訊息總數
SELECT COUNT(*) as total_messages FROM messages;

-- 7.2 各類型訊息統計
SELECT
  sender_type,
  COUNT(*) as count,
  MAX(created_at) as latest_message
FROM messages
GROUP BY sender_type;

-- 7.3 最近 24 小時的訊息
SELECT
  sender_type,
  COUNT(*) as count_last_24h
FROM messages
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY sender_type;

-- ============================================================================
-- 步驟 8：函數效能測試（查詢執行計畫）
-- ============================================================================

EXPLAIN ANALYZE
SELECT fn_send_message(
  (SELECT id FROM conversations LIMIT 1),
  '效能測試訊息',
  'agent'
);

-- ============================================================================
-- 步驟 9：RLS 策略檢查（messages 表）
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'messages';

-- ============================================================================
-- 驗收標準
-- ============================================================================

-- 此查詢應該回傳 't' (true) 表示函數正常
SELECT
  CASE
    WHEN EXISTS (
      -- 1. 函數存在
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'fn_send_message'
    )
    AND EXISTS (
      -- 2. messages 表存在
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'messages'
    )
    AND EXISTS (
      -- 3. conversation_id 外鍵存在
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'messages'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name LIKE '%conversation%'
    )
    THEN 't'  -- 驗證通過
    ELSE 'f'  -- 驗證失敗
  END as fn_send_message_verified;

-- ============================================================================
-- 預期結果說明
-- ============================================================================

/*
步驟 1: 應該回傳函數定義（3 個參數：conversation_id, content, sender_type）
步驟 2: 應該顯示完整的 CREATE FUNCTION 語句
步驟 3: 應該顯示 messages 表的所有欄位
步驟 4: 應該顯示外鍵約束指向 conversations 表
步驟 6: 應該顯示最近的訊息記錄
步驟 7: 應該顯示訊息統計資料
步驟 9: 應該顯示 RLS 策略（如果有）
最終驗收: 應該回傳 't'
*/
