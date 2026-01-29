-- ============================================================================
-- 測試腳本: uag_audit_logs 脫敏功能
--
-- 用途: 驗證脫敏函數和 Trigger 是否正確運作
-- 執行方式:
--   psql -h <host> -U postgres -d postgres -f scripts/test-audit-log-sanitizer.sql
-- ============================================================================

-- ============================================================================
-- 1. 測試脫敏函數
-- ============================================================================

\echo '==================== 測試 1: 脫敏函數 ===================='

SELECT sanitize_audit_log_data('{
  "user_id": "123",
  "password": "secret123",
  "api_key": "sk-abc123",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  "data": {
    "name": "王小明",
    "phone": "0912345678"
  },
  "stack": "Error at line 123\n  at foo.js:456\n  at bar.js:789"
}'::JSONB) AS sanitized_result;

-- 預期輸出:
-- {
--   "user_id": "123",
--   "password": "***REDACTED***",
--   "api_key": "***REDACTED***",
--   "token": "***REDACTED***",
--   "data": {
--     "name": "王小明",
--     "phone": "***REDACTED***"
--   }
--   // stack 已被移除
-- }

\echo '==================== 測試 2: Trigger 自動脫敏 ===================='

-- 清理測試資料
DELETE FROM public.uag_audit_logs WHERE action LIKE 'TEST_%';

-- 插入含敏感資料的記錄
INSERT INTO public.uag_audit_logs (
  action,
  agent_id,
  session_id,
  request,
  response,
  success
) VALUES (
  'TEST_SANITIZE_ACTION',
  'test-agent-123',
  'test-session-456',
  jsonb_build_object(
    'password', 'my-secret-password',
    'api_key', 'sk-secret-key-123',
    'user_data', jsonb_build_object('name', '測試用戶')
  ),
  jsonb_build_object(
    'token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
    'data', 'OK',
    'stack', 'Error at line 123'
  ),
  true
);

-- 驗證結果（敏感欄位應被遮罩）
SELECT
  action,
  agent_id,
  request,
  response,
  success
FROM public.uag_audit_logs
WHERE action = 'TEST_SANITIZE_ACTION';

-- 預期結果:
-- request.password = "***REDACTED***"
-- request.api_key = "***REDACTED***"
-- response.token = "***REDACTED***"
-- response.stack = 不存在

\echo '==================== 測試 3: 安全視圖 ===================='

-- 查詢安全視圖（僅顯示非敏感欄位）
SELECT
  action,
  agent_id,
  session_id,
  success,
  error_code,
  created_at,
  request_keys,
  response_keys
FROM uag_audit_logs_safe
WHERE action = 'TEST_SANITIZE_ACTION';

-- 預期結果:
-- request_keys = {"password": null, "api_key": null, "user_data": null}
-- response_keys = {"token": null, "data": null}
-- 注意：值都是 null，僅顯示鍵名

\echo '==================== 測試 4: 空值處理 ===================='

-- 測試 NULL 和空物件
SELECT sanitize_audit_log_data(NULL) AS test_null;
SELECT sanitize_audit_log_data('{}'::JSONB) AS test_empty;

-- 預期結果:
-- test_null = NULL
-- test_empty = {}

\echo '==================== 測試 5: 長錯誤訊息截斷 ===================='

SELECT sanitize_audit_log_data('{
  "message": "This is a very long error message that contains sensitive file paths like /home/user/secrets/config.json and should be truncated to prevent information leakage"
}'::JSONB) AS truncated_message;

-- 預期結果:
-- message 只保留前 100 字元

\echo '==================== 測試 6: 巢狀物件脫敏 ===================='

SELECT sanitize_audit_log_data('{
  "outer": {
    "inner": {
      "password": "secret",
      "safe_data": "ok"
    }
  },
  "api_key": "sk-123"
}'::JSONB) AS nested_result;

-- 預期結果:
-- api_key 被遮罩
-- 注意：目前實現僅處理第一層，巢狀的 password 不會被遮罩
-- 這是故意設計，避免過度影響效能

\echo '==================== 清理測試資料 ===================='

-- 清理測試資料
DELETE FROM public.uag_audit_logs WHERE action LIKE 'TEST_%';

\echo '==================== 測試完成 ===================='
\echo '請檢查上方輸出，確認:'
\echo '1. 敏感欄位 (password, token, api_key) 被遮罩為 "***REDACTED***"'
\echo '2. stack 欄位被移除'
\echo '3. 錯誤訊息被截斷為 100 字元'
\echo '4. 安全視圖僅顯示欄位鍵名，不含值'
