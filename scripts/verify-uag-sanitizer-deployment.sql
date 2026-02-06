-- ============================================================================
-- 驗證腳本: UAG Audit Logs 脫敏機制部署驗證
--
-- 用途: 確認所有脫敏機制已正確部署
-- 執行方式:
--   psql -h <host> -U postgres -d postgres -f scripts/verify-uag-sanitizer-deployment.sql
-- ============================================================================

\echo '==================== 驗證 1: 函數存在性檢查 ===================='

-- 檢查脫敏函數
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ sanitize_audit_log_data() 函數已部署'
    ELSE '❌ sanitize_audit_log_data() 函數不存在'
  END AS status
FROM pg_proc
WHERE proname = 'sanitize_audit_log_data';

-- 檢查 Trigger 函數
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ trigger_sanitize_uag_audit_logs() 函數已部署'
    ELSE '❌ trigger_sanitize_uag_audit_logs() 函數不存在'
  END AS status
FROM pg_proc
WHERE proname = 'trigger_sanitize_uag_audit_logs';

-- 檢查安全查詢函數
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ get_my_audit_logs() 函數已部署'
    ELSE '❌ get_my_audit_logs() 函數不存在'
  END AS status
FROM pg_proc
WHERE proname = 'get_my_audit_logs';

\echo '==================== 驗證 2: Trigger 存在性檢查 ===================='

-- 檢查 Trigger
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ trigger_sanitize_uag_audit_logs_before_insert Trigger 已部署'
    ELSE '❌ trigger_sanitize_uag_audit_logs_before_insert Trigger 不存在'
  END AS status
FROM pg_trigger
WHERE tgname = 'trigger_sanitize_uag_audit_logs_before_insert';

\echo '==================== 驗證 3: 視圖存在性檢查 ===================='

-- 檢查安全視圖
SELECT
  CASE
    WHEN COUNT(*) = 1 THEN '✅ uag_audit_logs_safe 視圖已部署'
    ELSE '❌ uag_audit_logs_safe 視圖不存在'
  END AS status
FROM pg_views
WHERE viewname = 'uag_audit_logs_safe';

\echo '==================== 驗證 4: 功能測試 ===================='

-- 清理舊測試資料
DELETE FROM public.uag_audit_logs WHERE action LIKE 'VERIFY_%';

-- 測試插入敏感資料
INSERT INTO public.uag_audit_logs (
  action,
  agent_id,
  session_id,
  request,
  response,
  success
) VALUES (
  'VERIFY_SANITIZER',
  'verify-agent-123',
  'verify-session-456',
  jsonb_build_object(
    'password', 'should-be-redacted',
    'api_key', 'sk-should-be-redacted',
    'safe_field', 'should-remain'
  ),
  jsonb_build_object(
    'token', 'should-be-redacted',
    'stack', 'should-be-removed',
    'data', 'should-remain'
  ),
  true
);

-- 驗證脫敏結果
\echo '檢查 request 欄位脫敏結果：'
SELECT
  CASE
    WHEN request->>'password' = '***REDACTED***' THEN '✅ password 已被遮罩'
    ELSE '❌ password 未被遮罩: ' || (request->>'password')
  END AS password_status,
  CASE
    WHEN request->>'api_key' = '***REDACTED***' THEN '✅ api_key 已被遮罩'
    ELSE '❌ api_key 未被遮罩: ' || (request->>'api_key')
  END AS api_key_status,
  CASE
    WHEN request->>'safe_field' = 'should-remain' THEN '✅ safe_field 未被影響'
    ELSE '❌ safe_field 被誤殺: ' || (request->>'safe_field')
  END AS safe_field_status
FROM public.uag_audit_logs
WHERE action = 'VERIFY_SANITIZER';

\echo '檢查 response 欄位脫敏結果：'
SELECT
  CASE
    WHEN response->>'token' = '***REDACTED***' THEN '✅ token 已被遮罩'
    ELSE '❌ token 未被遮罩: ' || (response->>'token')
  END AS token_status,
  CASE
    WHEN response ? 'stack' THEN '❌ stack 欄位未被移除'
    ELSE '✅ stack 欄位已被移除'
  END AS stack_status,
  CASE
    WHEN response->>'data' = 'should-remain' THEN '✅ data 欄位未被影響'
    ELSE '❌ data 欄位被誤殺: ' || (response->>'data')
  END AS data_status
FROM public.uag_audit_logs
WHERE action = 'VERIFY_SANITIZER';

\echo '==================== 驗證 5: 安全視圖測試 ===================='

-- 測試安全視圖
SELECT
  action,
  success,
  request_keys,
  response_keys
FROM uag_audit_logs_safe
WHERE action = 'VERIFY_SANITIZER';

-- 預期：request_keys 和 response_keys 僅顯示鍵名，不含值

\echo '==================== 驗證 6: Trigger 啟用狀態 ===================='

-- 檢查 Trigger 是否啟用
SELECT
  tgname,
  CASE tgenabled
    WHEN 'O' THEN '✅ 已啟用'
    WHEN 'D' THEN '❌ 已停用'
    ELSE '⚠️ 未知狀態'
  END AS status
FROM pg_trigger
WHERE tgname = 'trigger_sanitize_uag_audit_logs_before_insert';

\echo '==================== 驗證 7: 函數權限檢查 ===================='

-- 檢查函數是否設定為 SECURITY DEFINER
SELECT
  p.proname,
  CASE
    WHEN p.prosecdef = true THEN '✅ SECURITY DEFINER'
    ELSE '⚠️ SECURITY INVOKER'
  END AS security_mode,
  CASE
    WHEN p.provolatile = 'i' THEN '✅ IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    ELSE 'VOLATILE'
  END AS volatility
FROM pg_proc p
WHERE p.proname IN (
  'sanitize_audit_log_data',
  'trigger_sanitize_uag_audit_logs',
  'get_my_audit_logs'
);

\echo '==================== 清理測試資料 ===================='

-- 清理測試資料
DELETE FROM public.uag_audit_logs WHERE action LIKE 'VERIFY_%';

\echo '==================== 驗證完成 ===================='
\echo ''
\echo '預期結果：'
\echo '1. 所有函數、Trigger、視圖都存在'
\echo '2. password, api_key, token 被遮罩為 "***REDACTED***"'
\echo '3. stack 欄位被移除'
\echo '4. 安全欄位（safe_field, data）未被影響'
\echo '5. Trigger 狀態為已啟用'
\echo '6. sanitize_audit_log_data 為 IMMUTABLE + SECURITY DEFINER'
\echo ''
\echo '如有任何 ❌ 標記，請檢查部署是否成功執行。'
