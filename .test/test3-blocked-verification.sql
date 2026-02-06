-- ============================================================================
-- 測試3 驗證 SQL - 封鎖 OA 測試
-- 目的：驗證 blocked 狀態的資料庫處理
-- ============================================================================

-- ============================================================================
-- 步驟 1：檢查 uag_line_bindings 表結構
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'uag_line_bindings'
ORDER BY ordinal_position;

-- ============================================================================
-- 步驟 2：檢查 line_status 欄位的可能值
-- ============================================================================

SELECT
  DISTINCT line_status,
  COUNT(*) as count
FROM uag_line_bindings
GROUP BY line_status;

-- ============================================================================
-- 步驟 3：查詢現有的 LINE 綁定記錄
-- ============================================================================

SELECT
  id,
  consumer_session_id,
  line_user_id,
  line_status,
  created_at,
  updated_at
FROM uag_line_bindings
ORDER BY updated_at DESC
LIMIT 10;

-- ============================================================================
-- 步驟 4：檢查 fn_get_line_binding 函數
-- ============================================================================

SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'fn_get_line_binding';

-- ============================================================================
-- 步驟 5：測試 fn_get_line_binding（需要實際 session_id）
-- ============================================================================

-- 5.1 先查詢現有的 session
SELECT
  consumer_session_id,
  line_status
FROM uag_line_bindings
LIMIT 5;

-- 5.2 測試函數（替換為實際的 session_id）
/*
SELECT * FROM fn_get_line_binding('your-session-id-here');
*/

-- ============================================================================
-- 步驟 6：模擬 blocked 狀態更新
-- ============================================================================

-- 6.1 查詢測試用的綁定記錄（可選）
/*
SELECT id, consumer_session_id, line_status
FROM uag_line_bindings
WHERE line_status = 'active'
LIMIT 1;
*/

-- 6.2 模擬更新為 blocked（請謹慎使用，僅測試環境）
/*
UPDATE uag_line_bindings
SET
  line_status = 'blocked',
  updated_at = NOW()
WHERE consumer_session_id = 'your-test-session-id'
RETURNING id, consumer_session_id, line_status, updated_at;
*/

-- 6.3 還原為 active（測試完成後）
/*
UPDATE uag_line_bindings
SET
  line_status = 'active',
  updated_at = NOW()
WHERE consumer_session_id = 'your-test-session-id'
RETURNING id, consumer_session_id, line_status, updated_at;
*/

-- ============================================================================
-- 步驟 7：驗證 notification_status 更新
-- ============================================================================

-- 7.1 查詢最近更新為 'unreachable' 的購買記錄
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
WHERE notification_status = 'unreachable'
ORDER BY updated_at DESC
LIMIT 5;

-- 7.2 統計各種 notification_status
SELECT
  notification_status,
  COUNT(*) as count
FROM uag_lead_purchases
GROUP BY notification_status;

-- ============================================================================
-- 步驟 8：完整流程驗證（blocked → unreachable）
-- ============================================================================

-- 8.1 JOIN 查詢：綁定狀態 + 通知狀態
SELECT
  lb.consumer_session_id,
  lb.line_user_id,
  lb.line_status as binding_status,
  p.id as purchase_id,
  p.notification_status,
  p.last_notification_at
FROM uag_line_bindings lb
LEFT JOIN uag_lead_purchases p ON p.session_id = lb.consumer_session_id
WHERE lb.line_status = 'blocked'
ORDER BY p.updated_at DESC
LIMIT 10;

-- ============================================================================
-- 步驟 9：RLS 策略檢查
-- ============================================================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'uag_line_bindings';

-- ============================================================================
-- 步驟 10：索引檢查（效能優化）
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'uag_line_bindings';

-- ============================================================================
-- 驗收標準檢查
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      -- 1. uag_line_bindings 表存在
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'uag_line_bindings'
    )
    AND EXISTS (
      -- 2. line_status 欄位存在
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'uag_line_bindings'
        AND column_name = 'line_status'
    )
    AND EXISTS (
      -- 3. fn_get_line_binding 函數存在
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'fn_get_line_binding'
    )
    THEN 't'  -- 測試3 資料庫準備就緒
    ELSE 'f'  -- 缺少必要結構
  END as test3_db_ready;

-- ============================================================================
-- 測試3 預期結果說明
-- ============================================================================

/*
手動測試步驟：
1. 在 LINE 中封鎖官方帳號
2. Webhook 接收 unfollow 事件（目前只有 console.log）
3. 手動執行步驟 6.2 更新 line_status 為 'blocked'
4. 透過前端發送訊息
5. 驗證：
   - API 回傳 lineStatus: "unreachable"
   - notification_status 更新為 "unreachable"
   - Toast 顯示「LINE 無法送達」

程式化驗證範圍：
- ✅ blocked 判斷邏輯（send-message-blocked.test.ts）
- ✅ Response 格式
- ✅ Toast 訊息對應
- ⚠️ Webhook 更新資料庫（目前未實作，需手動更新）

注意：
- 目前 Webhook (api/line/webhook.ts L122-124) 只記錄 unfollow
- 尚未實作自動更新 line_status 為 'blocked'
- 測試時需手動執行步驟 6.2 的 UPDATE 語句
*/
