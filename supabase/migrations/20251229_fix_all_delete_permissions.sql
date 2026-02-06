-- =====================================================
-- 修復所有 Muse 相關表的 DELETE 權限
-- 問題：多個表只有 SELECT/INSERT/UPDATE 政策，缺少 DELETE
-- 導致 GodView 的刪除用戶功能失效（RLS 直接拒絕刪除操作）
-- =====================================================

-- 1. intimate_sessions (親密互動時段)
DROP POLICY IF EXISTS "Allow anonymous delete intimate_sessions" ON intimate_sessions;
CREATE POLICY "Allow anonymous delete intimate_sessions"
  ON intimate_sessions FOR DELETE TO anon USING (true);

-- 2. sexual_preferences (性癖偏好)
DROP POLICY IF EXISTS "Allow anonymous delete sexual_preferences" ON sexual_preferences;
CREATE POLICY "Allow anonymous delete sexual_preferences"
  ON sexual_preferences FOR DELETE TO anon USING (true);

-- 3. muse_tasks (AI 任務)
DROP POLICY IF EXISTS "Allow anonymous delete muse_tasks" ON muse_tasks;
CREATE POLICY "Allow anonymous delete muse_tasks"
  ON muse_tasks FOR DELETE TO anon USING (true);

-- 4. godview_messages (管理員訊息) - 如果表存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'godview_messages') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete godview_messages" ON godview_messages';
        EXECUTE 'CREATE POLICY "Allow anonymous delete godview_messages" ON godview_messages FOR DELETE TO anon USING (true)';
    END IF;
END $$;

-- 5. soul_treasures (靈魂寶物) - 如果表存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'soul_treasures') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete soul_treasures" ON soul_treasures';
        EXECUTE 'CREATE POLICY "Allow anonymous delete soul_treasures" ON soul_treasures FOR DELETE TO anon USING (true)';
    END IF;
END $$;

-- 6. muse_memory_vault (記憶庫) - 如果表存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'muse_memory_vault') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete muse_memory_vault" ON muse_memory_vault';
        EXECUTE 'CREATE POLICY "Allow anonymous delete muse_memory_vault" ON muse_memory_vault FOR DELETE TO anon USING (true)';
    END IF;
END $$;

-- 7. user_progress (用戶進度) - 如果表存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_progress') THEN
        EXECUTE 'DROP POLICY IF EXISTS "Allow anonymous delete user_progress" ON user_progress';
        EXECUTE 'CREATE POLICY "Allow anonymous delete user_progress" ON user_progress FOR DELETE TO anon USING (true)';
    END IF;
END $$;

-- 驗證：確認所有政策都已創建
COMMENT ON POLICY "Allow anonymous delete intimate_sessions" ON intimate_sessions
  IS '允許 GodView 刪除用戶的親密互動時段記錄';

COMMENT ON POLICY "Allow anonymous delete sexual_preferences" ON sexual_preferences
  IS '允許 GodView 刪除用戶的性癖偏好記錄';

COMMENT ON POLICY "Allow anonymous delete muse_tasks" ON muse_tasks
  IS '允許 GodView 刪除用戶的 AI 任務記錄';
