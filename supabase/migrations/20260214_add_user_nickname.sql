-- 添加 user_nickname 欄位（用戶希望被 MUSE 叫的暱稱）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'user_nickname') THEN
        ALTER TABLE user_progress ADD COLUMN user_nickname VARCHAR(50);
    END IF;
END $$;

COMMENT ON COLUMN user_progress.user_nickname IS '用戶希望被 MUSE 叫的暱稱（寶貝、老婆、名字等）';
