-- ============================================================================
-- 測試1 驗證 SQL - 站內訊息 100% 成功
-- 執行順序：發送訊息後立即執行
-- ============================================================================

-- ============================================================================
-- 前置檢查：確認測試環境
-- ============================================================================

-- 1. 檢查是否有測試用的 LINE 綁定
SELECT
  id,
  consumer_session_id,
  line_user_id,
  line_status,
  created_at
FROM uag_line_bindings
WHERE line_status = 'active'
ORDER BY created_at DESC
LIMIT 5;

-- 2. 檢查 messages 表是否可寫入
SELECT COUNT(*) as total_messages FROM messages;

-- 3. 檢查最近的購買記錄
SELECT
  id,
  agent_id,
  session_id,
  grade,
  purchased_at
FROM uag_lead_purchases
ORDER BY purchased_at DESC
LIMIT 5;

-- ============================================================================
-- 核心驗證 1：站內訊息是否成功寫入
-- ============================================================================

-- 查詢最近 5 分鐘內的訊息（使用你發送的訊息內容關鍵字）
SELECT
  m.id,
  m.conversation_id,
  m.sender_type,
  m.sender_id,
  m.content,
  m.created_at,
  m.read_at,
  c.agent_id,
  c.consumer_session_id,
  c.status as conversation_status
FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE m.created_at > NOW() - INTERVAL '5 minutes'
ORDER BY m.created_at DESC
LIMIT 10;

-- 驗證特定內容的訊息（替換為你實際發送的內容）
SELECT
  id,
  conversation_id,
  sender_type,
  content,
  created_at
FROM messages
WHERE content LIKE '%測試1%'  -- 改為你實際的訊息內容
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 核心驗證 2：LINE 通知狀態（應該失敗或跳過）
-- ============================================================================

-- 檢查最近更新的 purchase 記錄
SELECT
  id,
  agent_id,
  session_id,
  notification_status,
  notification_retry_key,
  last_notification_at,
  purchased_at,
  updated_at
FROM uag_lead_purchases
WHERE updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY updated_at DESC
LIMIT 5;

-- 預期結果：notification_status 應該是 'error', 'pending', 或 'skipped'
-- 不應該是 'sent'

-- ============================================================================
-- 核心驗證 3：LINE 通知佇列（如果有）
-- ============================================================================

-- 檢查最近的通知佇列記錄
SELECT
  id,
  message_id,
  purchase_id,
  line_user_id,
  connect_url,
  agent_name,
  status,
  last_error,
  retry_count,
  created_at,
  updated_at
FROM uag_line_notification_queue
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- 預期結果：如果有記錄，status 應該是 'pending' 或 'failed'
-- last_error 應該包含錯誤訊息

-- ============================================================================
-- 核心驗證 4：審計日誌（如果有）
-- ============================================================================

-- 檢查最近的 LINE 審計日誌
SELECT
  id,
  purchase_id,
  status,
  line_response,
  error_message,
  created_at
FROM uag_line_audit_logs
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 核心驗證 5：對話記錄
-- ============================================================================

-- 檢查最近建立的對話
SELECT
  id,
  agent_id,
  consumer_session_id,
  consumer_profile_id,
  property_id,
  lead_id,
  status,
  unread_agent,
  unread_consumer,
  created_at,
  updated_at
FROM conversations
WHERE created_at > NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- 完整流程驗證：JOIN 查詢
-- ============================================================================

-- 完整的 purchase -> conversation -> message 流程
SELECT
  p.id as purchase_id,
  p.agent_id,
  p.session_id,
  p.notification_status,
  c.id as conversation_id,
  c.status as conversation_status,
  m.id as message_id,
  m.content as message_content,
  m.sender_type,
  m.created_at as message_sent_at
FROM uag_lead_purchases p
LEFT JOIN conversations c ON c.lead_id = p.id
LEFT JOIN messages m ON m.conversation_id = c.id
WHERE p.purchased_at > NOW() - INTERVAL '10 minutes'
ORDER BY p.purchased_at DESC, m.created_at DESC
LIMIT 10;

-- ============================================================================
-- 測試1 驗收標準檢查
-- ============================================================================

-- 此查詢應該回傳 't' (true) 表示測試通過
SELECT
  CASE
    WHEN EXISTS (
      -- 1. 站內訊息存在
      SELECT 1 FROM messages
      WHERE created_at > NOW() - INTERVAL '5 minutes'
    )
    AND EXISTS (
      -- 2. LINE 通知狀態不是 'sent'
      SELECT 1 FROM uag_lead_purchases
      WHERE updated_at > NOW() - INTERVAL '5 minutes'
        AND notification_status != 'sent'
    )
    THEN 't'  -- 測試通過
    ELSE 'f'  -- 測試失敗
  END as test1_passed;

-- ============================================================================
-- 清理測試資料（可選，測試完成後執行）
-- ============================================================================

-- 注意：只在確認測試完成後執行，刪除測試資料
-- DELETE FROM messages WHERE content LIKE '%測試1%';
-- DELETE FROM uag_line_notification_queue WHERE created_at < NOW() - INTERVAL '1 hour';
