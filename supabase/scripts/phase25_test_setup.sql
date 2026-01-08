-- ==============================================================================
-- Phase 2.5: 測試環境準備
-- 執行位置: Supabase SQL Editor (使用 service_role 權限)
-- ==============================================================================

-- ============================================================================
-- Step 1: 查詢現有的測試 session
-- ============================================================================
-- 找出最近的 session（用於綁定測試）
SELECT
  session_id,
  grade,
  last_active,
  created_at
FROM uag_sessions
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================================
-- Step 2: 建立測試 session（如果沒有現成的）
-- ============================================================================
-- 插入一個測試用的 session
INSERT INTO uag_sessions (session_id, grade, last_active)
VALUES ('test-session-cityfish', 'A', NOW())
ON CONFLICT (session_id) DO UPDATE SET last_active = NOW();

-- ============================================================================
-- Step 3: 插入 LINE 綁定記錄
-- ============================================================================
-- 注意: line_user_id 應該是 LINE 官方的 User ID (U 開頭 33 字元)
-- 這裡使用 "cityfish" 作為測試值，實際使用時請替換為真實的 LINE User ID

INSERT INTO uag_line_bindings (session_id, line_user_id, line_status)
VALUES ('test-session-cityfish', 'cityfish', 'active')
ON CONFLICT (line_user_id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  line_status = 'active',
  bound_at = NOW();

-- ============================================================================
-- Step 4: 驗證綁定是否成功
-- ============================================================================
-- 4.1 直接查詢表（需 service_role）
SELECT * FROM uag_line_bindings WHERE session_id = 'test-session-cityfish';

-- 4.2 使用 RPC 函數驗證（這是 API 會呼叫的方式）
SELECT * FROM fn_get_line_binding('test-session-cityfish');

-- ============================================================================
-- Step 5: 建立測試購買記錄（用於完整測試 API）
-- ============================================================================
-- 查詢現有的 lead purchases
SELECT id, session_id, grade, notification_status, created_at
FROM uag_lead_purchases
ORDER BY created_at DESC
LIMIT 5;

-- 如果需要插入測試購買記錄，請執行：
-- INSERT INTO uag_lead_purchases (session_id, grade, agent_id, ...)
-- VALUES ('test-session-cityfish', 'A', 'your-agent-id', ...);

-- ============================================================================
-- Step 6: 清理測試資料（測試完成後執行）
-- ============================================================================
-- DELETE FROM uag_line_bindings WHERE session_id = 'test-session-cityfish';
-- DELETE FROM uag_sessions WHERE session_id = 'test-session-cityfish';

-- ==============================================================================
-- 驗收檢查清單
-- ==============================================================================
-- [ ] Step 1: 確認 session 表有資料
-- [ ] Step 2: 測試 session 建立成功
-- [ ] Step 3: LINE 綁定插入成功
-- [ ] Step 4.1: 直接查詢回傳正確 line_user_id
-- [ ] Step 4.2: RPC 函數回傳正確結果
-- [ ] Phase 3 測試: API 可以正確查詢並發送 LINE
