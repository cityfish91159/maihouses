-- =====================================================
-- 刪除測試用戶資料
-- 清除 user_id 以 test 或 TEST 開頭的所有測試資料
-- =====================================================

-- 1. 刪除測試用戶的 shadow_logs
DELETE FROM shadow_logs
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';

-- 2. 刪除測試用戶的 muse_tasks
DELETE FROM muse_tasks
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';

-- 3. 刪除測試用戶的 intimate_sessions
DELETE FROM intimate_sessions
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';

-- 4. 刪除測試用戶的 sexual_preferences
DELETE FROM sexual_preferences
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';

-- 5. 刪除測試用戶的 soul_treasures (如果存在)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'soul_treasures') THEN
        DELETE FROM soul_treasures WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';
    END IF;
END $$;

-- 6. 刪除測試用戶的 muse_memory_vault (如果存在)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'muse_memory_vault') THEN
        DELETE FROM muse_memory_vault WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';
    END IF;
END $$;

-- 7. 刪除測試用戶的 godview_messages (如果存在)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'godview_messages') THEN
        DELETE FROM godview_messages WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';
    END IF;
END $$;

-- 8. 最後刪除 user_progress (主表)
DELETE FROM user_progress
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';

-- 驗證刪除結果
SELECT 'user_progress' as table_name, COUNT(*) as remaining_test_users
FROM user_progress
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%'
UNION ALL
SELECT 'shadow_logs', COUNT(*)
FROM shadow_logs
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%'
UNION ALL
SELECT 'muse_tasks', COUNT(*)
FROM muse_tasks
WHERE user_id::text LIKE 'test%' OR user_id::text LIKE 'TEST%';
