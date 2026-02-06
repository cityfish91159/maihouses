-- ============================================================================
-- 測試4 驗證 SQL - 連按 3 次不重複發
-- 目的：驗證 message_id UNIQUE 約束防止重複發送
-- ============================================================================

-- ============================================================================
-- 步驟 1：檢查 uag_line_notification_queue 表結構
-- ============================================================================

SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'uag_line_notification_queue'
ORDER BY ordinal_position;

-- ============================================================================
-- 步驟 2：驗證 message_id UNIQUE 約束存在
-- ============================================================================

SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'uag_line_notification_queue'
  AND tc.constraint_type = 'UNIQUE';

-- 預期結果：應該有 uag_line_notification_queue_message_id_unique

-- ============================================================================
-- 步驟 3：檢查 UNIQUE 約束詳細資訊
-- ============================================================================

SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.uag_line_notification_queue'::regclass
  AND contype = 'u';

-- ============================================================================
-- 步驟 4：查詢現有的 queue 記錄
-- ============================================================================

SELECT
  id,
  message_id,
  purchase_id,
  line_user_id,
  status,
  retry_count,
  created_at
FROM uag_line_notification_queue
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- 步驟 5：模擬重複插入測試（需要實際 message_id）
-- ============================================================================

-- 5.1 查詢現有訊息（取得測試用 message_id）
SELECT
  id as message_id,
  conversation_id,
  content,
  created_at
FROM messages
ORDER BY created_at DESC
LIMIT 5;

-- 5.2 測試重複插入（取消註解並替換實際值）
/*
-- 第 1 次插入（應該成功）
INSERT INTO uag_line_notification_queue (
  message_id,
  purchase_id,
  line_user_id,
  connect_url,
  agent_name,
  status
)
VALUES (
  'your-message-id-here'::UUID,
  'your-purchase-id-here'::UUID,
  'Utest123456',
  'https://example.com/connect',
  '測試房仲',
  'pending'
);

-- 第 2 次插入（應該失敗，UNIQUE 約束）
INSERT INTO uag_line_notification_queue (
  message_id,
  purchase_id,
  line_user_id,
  connect_url,
  agent_name,
  status
)
VALUES (
  'your-message-id-here'::UUID,  -- 同一個 message_id
  'your-purchase-id-here'::UUID,
  'Utest123456',
  'https://example.com/connect',
  '測試房仲',
  'pending'
);

-- 預期錯誤：ERROR: duplicate key value violates unique constraint
*/

-- ============================================================================
-- 步驟 6：檢查索引
-- ============================================================================

SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'uag_line_notification_queue';

-- ============================================================================
-- 步驟 7：統計 queue 記錄
-- ============================================================================

-- 7.1 各狀態統計
SELECT
  status,
  COUNT(*) as count
FROM uag_line_notification_queue
GROUP BY status;

-- 7.2 重試次數統計
SELECT
  retry_count,
  COUNT(*) as count
FROM uag_line_notification_queue
GROUP BY retry_count
ORDER BY retry_count;

-- 7.3 檢查是否有重複的 message_id（應該沒有）
SELECT
  message_id,
  COUNT(*) as duplicate_count
FROM uag_line_notification_queue
GROUP BY message_id
HAVING COUNT(*) > 1;

-- 預期結果：0 rows（無重複）

-- ============================================================================
-- 步驟 8：完整流程驗證 - JOIN messages
-- ============================================================================

SELECT
  q.id as queue_id,
  q.message_id,
  q.status as queue_status,
  q.retry_count,
  m.conversation_id,
  m.content as message_content,
  m.sender_type,
  m.created_at as message_created_at,
  q.created_at as queue_created_at
FROM uag_line_notification_queue q
JOIN messages m ON m.id = q.message_id
ORDER BY q.created_at DESC
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
  AND tablename = 'uag_line_notification_queue';

-- ============================================================================
-- 步驟 10：效能測試 - EXPLAIN PLAN
-- ============================================================================

EXPLAIN ANALYZE
SELECT * FROM uag_line_notification_queue
WHERE message_id = gen_random_uuid();

-- 預期：應該使用 UNIQUE INDEX SCAN

-- ============================================================================
-- 驗收標準檢查
-- ============================================================================

SELECT
  CASE
    WHEN EXISTS (
      -- 1. uag_line_notification_queue 表存在
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'uag_line_notification_queue'
    )
    AND EXISTS (
      -- 2. message_id UNIQUE 約束存在
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'uag_line_notification_queue'
        AND constraint_type = 'UNIQUE'
        AND constraint_name LIKE '%message_id%'
    )
    AND NOT EXISTS (
      -- 3. 無重複的 message_id
      SELECT 1 FROM (
        SELECT message_id, COUNT(*) as cnt
        FROM uag_line_notification_queue
        GROUP BY message_id
        HAVING COUNT(*) > 1
      ) duplicates
    )
    THEN 't'  -- 測試4 資料庫驗證通過
    ELSE 'f'  -- 驗證失敗
  END as test4_db_ready;

-- ============================================================================
-- 測試4 預期結果說明
-- ============================================================================

/*
防重複機制雙重保護：

1. 前端防護（SendMessageModal.tsx L72）
   - isSending 狀態阻擋重複點擊
   - 快速連續點擊只執行 1 次
   - 按鈕 disabled 狀態（L305）

2. 資料庫防護（L117）
   - message_id UNIQUE 約束
   - 同一訊息只能有 1 筆佇列記錄
   - INSERT 重複會拋出錯誤

測試驗證：
- ✅ 前端：SendMessageModal-debounce.test.tsx（11 tests）
- ✅ 資料庫：message_id UNIQUE 約束存在
- ✅ 整合：前端 + 資料庫雙重保護

手動測試步驟：
1. 快速連續點擊「發送」按鈕 3 次
2. 檢查 uag_line_notification_queue 表
3. 檢查手機 LINE 收到的訊息數量

預期結果：
- Queue 表只有 1 筆記錄
- 手機只收到 1 則 LINE 訊息
- 發送按鈕在發送中顯示 disabled
*/
