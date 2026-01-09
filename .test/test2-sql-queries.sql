-- ============================================================================
-- 測試2：有綁定 LINE 測試 - SQL 驗證腳本
-- ============================================================================

-- ============================================================================
-- 前置檢查：確認有 active 的 LINE 綁定
-- ============================================================================
SELECT
  consumer_session_id,
  line_user_id,
  line_status,
  created_at,
  updated_at
FROM uag_line_bindings
WHERE line_status = 'active'
ORDER BY created_at DESC
LIMIT 10;

-- 預期：至少有 1 筆 active 綁定


-- ============================================================================
-- 測試後驗證 1：檢查最新的站內訊息（含物件ID）
-- ============================================================================
SELECT
  m.id AS message_id,
  m.conversation_id,
  m.sender_type,
  m.content,
  m.created_at,
  c.property_id,  -- ✅ 修4：應該有值
  c.consumer_session_id,
  c.agent_id
FROM messages m
LEFT JOIN conversations c ON m.conversation_id = c.id
WHERE m.created_at > NOW() - INTERVAL '10 minutes'
  AND m.content LIKE '%測試2%'
ORDER BY m.created_at DESC
LIMIT 5;

-- 預期結果：
-- ✅ 有 1 筆記錄
-- ✅ property_id 有值（修4 驗證）
-- ✅ content = '測試2 - 有綁定 LINE 推播測試'


-- ============================================================================
-- 測試後驗證 2：檢查 LINE 發送成功狀態
-- ============================================================================
SELECT
  lp.id,
  lp.agent_id,
  lp.consumer_session_id,
  lp.notification_status,  -- ✅ 應該是 'sent'
  lp.notification_retry_key,
  lp.last_notification_at,
  lb.line_user_id,
  lb.line_status
FROM uag_lead_purchases lp
LEFT JOIN uag_line_bindings lb ON lp.consumer_session_id = lb.consumer_session_id
WHERE lp.updated_at > NOW() - INTERVAL '10 minutes'
ORDER BY lp.updated_at DESC
LIMIT 5;

-- 預期結果：
-- ✅ notification_status = 'sent' （成功發送）
-- ✅ notification_retry_key 有值（UUID）
-- ✅ last_notification_at 有時間戳
-- ✅ line_status = 'active'


-- ============================================================================
-- 測試後驗證 3：檢查 LINE 通知佇列（sent 狀態）
-- ============================================================================
SELECT
  q.id,
  q.message_id,
  q.purchase_id,
  q.line_user_id,
  q.connect_url,  -- 包含 Connect Token
  q.agent_name,
  q.property_title,
  q.grade,
  q.status,  -- ✅ 應該是 'sent'
  q.sent_at,
  q.last_error,
  q.retry_count,
  q.created_at
FROM uag_line_notification_queue q
WHERE q.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY q.created_at DESC
LIMIT 5;

-- 預期結果：
-- ✅ status = 'sent'
-- ✅ sent_at 有值
-- ✅ last_error = NULL 或空


-- ============================================================================
-- 測試後驗證 4：檢查 LINE 審計日誌（成功記錄）
-- ============================================================================
SELECT
  al.id,
  al.purchase_id,
  al.session_id,
  al.retry_key,
  al.status,  -- ✅ 應該是 'sent'
  al.line_response,
  al.created_at
FROM uag_line_audit_logs al
WHERE al.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY al.created_at DESC
LIMIT 5;

-- 預期結果：
-- ✅ status = 'sent'
-- ✅ line_response 為 NULL 或 {}（LINE API 成功不回傳詳細）


-- ============================================================================
-- 完整關聯查詢：所有相關表的綜合檢視
-- ============================================================================
SELECT
  '=== Conversation ===' AS section,
  c.id AS conversation_id,
  c.property_id,  -- ✅ 修4：應該有值
  c.consumer_session_id,
  c.agent_id,
  c.created_at AS conv_created,

  '=== Message ===' AS msg_section,
  m.id AS message_id,
  m.content,
  m.created_at AS msg_created,

  '=== Purchase ===' AS purchase_section,
  lp.id AS purchase_id,
  lp.notification_status,  -- ✅ 'sent'
  lp.last_notification_at,

  '=== LINE Binding ===' AS binding_section,
  lb.line_user_id,
  lb.line_status,  -- ✅ 'active'

  '=== Queue ===' AS queue_section,
  q.id AS queue_id,
  q.status AS queue_status,  -- ✅ 'sent'
  q.sent_at,

  '=== Audit ===' AS audit_section,
  al.id AS audit_id,
  al.status AS audit_status  -- ✅ 'sent'

FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN uag_lead_purchases lp ON c.lead_id = lp.id
LEFT JOIN uag_line_bindings lb ON c.consumer_session_id = lb.consumer_session_id
LEFT JOIN uag_line_notification_queue q ON m.id = q.message_id
LEFT JOIN uag_line_audit_logs al ON lp.id = al.purchase_id
WHERE c.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY c.created_at DESC
LIMIT 3;

-- 預期：所有狀態都是成功（sent / active）


-- ============================================================================
-- 驗證 Connect Token 內容（需手動解碼）
-- ============================================================================
-- 步驟：
-- 1. 從 LINE 訊息或 queue 表取得 connect_url
-- 2. 提取 token 參數
-- 3. 在瀏覽器 Console 執行：
--    const token = "你的_token";
--    JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));

SELECT
  q.connect_url,
  -- 從 URL 提取 token（SQL 示意，需手動處理）
  SUBSTRING(q.connect_url FROM 'token=([^&]+)') AS token_value
FROM uag_line_notification_queue q
WHERE q.created_at > NOW() - INTERVAL '10 minutes'
ORDER BY q.created_at DESC
LIMIT 1;

-- 解碼後應該包含：
-- {
--   "conversationId": "uuid",
--   "sessionId": "session-xxx",
--   "propertyId": "prop-xxx",  ✅ 修4：這個欄位存在
--   "exp": 1736496000000
-- }


-- ============================================================================
-- 統計最近 10 分鐘的發送狀況
-- ============================================================================
SELECT
  notification_status,
  COUNT(*) AS count
FROM uag_lead_purchases
WHERE last_notification_at > NOW() - INTERVAL '10 minutes'
GROUP BY notification_status
ORDER BY count DESC;

-- 預期：'sent' 的數量應該增加


-- ============================================================================
-- 測試用：找一個可用的測試 session
-- ============================================================================
SELECT
  lb.consumer_session_id,
  lb.line_user_id,
  lb.line_status,
  COUNT(lp.id) AS purchase_count,
  MAX(lp.created_at) AS last_purchase_at
FROM uag_line_bindings lb
LEFT JOIN uag_lead_purchases lp ON lb.consumer_session_id = lp.consumer_session_id
WHERE lb.line_status = 'active'
GROUP BY lb.consumer_session_id, lb.line_user_id, lb.line_status
ORDER BY purchase_count ASC, last_purchase_at DESC
LIMIT 5;

-- 找購買次數少的 session 進行測試
