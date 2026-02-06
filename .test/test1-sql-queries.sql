-- ============================================================================
-- 測試1：站內訊息 100% 成功 - SQL 驗證腳本
-- ============================================================================

-- 執行說明：
-- 1. 在發送訊息後，立即執行以下 SQL
-- 2. 記錄查詢結果
-- 3. 確認站內訊息成功寫入

-- ============================================================================
-- 查詢 1：檢查最新的站內訊息（最重要）
-- ============================================================================
SELECT
  m.id AS message_id,
  m.conversation_id,
  m.sender_type,
  m.sender_id,
  m.content,
  m.created_at,
  c.property_id,
  c.consumer_session_id,
  c.agent_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY m.created_at DESC
LIMIT 10;

-- 預期結果：
-- ✅ 應該有 1 筆新記錄
-- ✅ sender_type = 'agent'
-- ✅ content 包含測試訊息內容
-- ✅ conversation_id 有值（不是 NULL）


-- ============================================================================
-- 查詢 2：檢查 Lead 購買記錄的通知狀態
-- ============================================================================
SELECT
  lp.id AS purchase_id,
  lp.agent_id,
  lp.consumer_session_id,
  lp.notification_status,
  lp.notification_retry_key,
  lp.last_notification_at,
  lp.updated_at,
  lb.line_user_id,
  lb.line_status
FROM uag_lead_purchases lp
LEFT JOIN uag_line_bindings lb ON lp.consumer_session_id = lb.consumer_session_id
WHERE lp.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY lp.updated_at DESC
LIMIT 5;

-- 預期結果（測試1 - LINE 停用場景）：
-- ✅ notification_status = 'skipped' 或 'error' 或 'pending'
-- ✅ **不應該是** 'sent' （因為 LINE 未配置）
-- ✅ last_notification_at 有更新


-- ============================================================================
-- 查詢 3：檢查 LINE 通知佇列
-- ============================================================================
SELECT
  q.id,
  q.message_id,
  q.purchase_id,
  q.line_user_id,
  q.status,
  q.last_error,
  q.retry_count,
  q.created_at,
  q.sent_at
FROM uag_line_notification_queue q
WHERE q.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY q.created_at DESC
LIMIT 5;

-- 預期結果（測試1 - LINE 停用場景）：
-- 可能結果 A：沒有記錄（因為 LINE 未配置，直接跳過）
-- 可能結果 B：有記錄但 status = 'pending' 或 'failed'，last_error 有錯誤訊息


-- ============================================================================
-- 查詢 4：檢查 LINE 審計日誌
-- ============================================================================
SELECT
  al.id,
  al.purchase_id,
  al.session_id,
  al.retry_key,
  al.status,
  al.line_response,
  al.created_at
FROM uag_line_audit_logs al
WHERE al.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY al.created_at DESC
LIMIT 5;

-- 預期結果（測試1 - LINE 停用場景）：
-- 可能沒有記錄（跳過 LINE 發送）
-- 或有記錄但 status = 'failed'


-- ============================================================================
-- 查詢 5：完整關聯查詢（綜合驗證）
-- ============================================================================
SELECT
  '=== Conversation ===' AS section,
  c.id AS conversation_id,
  c.agent_id,
  c.consumer_session_id,
  c.property_id,
  c.created_at AS conv_created_at,
  '=== Message ===' AS msg_section,
  m.id AS message_id,
  m.content,
  m.created_at AS msg_created_at,
  '=== Purchase ===' AS purchase_section,
  lp.notification_status,
  lp.last_notification_at,
  '=== LINE Binding ===' AS binding_section,
  lb.line_user_id,
  lb.line_status
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN uag_lead_purchases lp ON c.lead_id = lp.id
LEFT JOIN uag_line_bindings lb ON c.consumer_session_id = lb.consumer_session_id
WHERE c.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY c.created_at DESC
LIMIT 3;

-- 預期結果：
-- ✅ conversation 有建立
-- ✅ message 有建立
-- ✅ notification_status 不是 'sent'（因為 LINE 未配置）


-- ============================================================================
-- 查詢 6：統計最近 10 分鐘的發送狀況
-- ============================================================================
SELECT
  notification_status,
  COUNT(*) AS count
FROM uag_lead_purchases
WHERE last_notification_at > NOW() - INTERVAL '10 minutes'
GROUP BY notification_status
ORDER BY count DESC;

-- 預期結果：
-- 應該看到 'skipped' 或 'error' 的數量增加


-- ============================================================================
-- 清理測試資料（可選，測試完成後執行）
-- ============================================================================
/*
-- 警告：這會刪除最近 10 分鐘的測試資料
-- 只在確認測試完成後才執行

-- 刪除測試訊息
DELETE FROM messages
WHERE created_at > NOW() - INTERVAL '10 minutes'
  AND content LIKE '%測試1%';

-- 重置通知佇列
DELETE FROM uag_line_notification_queue
WHERE created_at > NOW() - INTERVAL '10 minutes';

-- 重置審計日誌
DELETE FROM uag_line_audit_logs
WHERE created_at > NOW() - INTERVAL '10 minutes';

-- 注意：不要刪除 conversations 和 uag_lead_purchases，這些是真實業務資料
*/
