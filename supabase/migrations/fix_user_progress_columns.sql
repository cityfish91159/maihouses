-- =====================================================
-- 修復 user_progress 表 - 添加缺失的欄位
-- =====================================================

-- 添加 unlock_stage 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'unlock_stage') THEN
        ALTER TABLE user_progress ADD COLUMN unlock_stage INTEGER DEFAULT 0;
    END IF;
END $$;

-- 添加 last_interaction 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'last_interaction') THEN
        ALTER TABLE user_progress ADD COLUMN last_interaction TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- 添加 muse_avatar_url 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'muse_avatar_url') THEN
        ALTER TABLE user_progress ADD COLUMN muse_avatar_url TEXT;
    END IF;
END $$;

-- 添加 muse_name 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'muse_name') THEN
        ALTER TABLE user_progress ADD COLUMN muse_name VARCHAR(50) DEFAULT 'MUSE';
    END IF;
END $$;

-- 添加 updated_at 欄位（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'user_progress' AND column_name = 'updated_at') THEN
        ALTER TABLE user_progress ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- =====================================================
-- 創建 muse_tasks 表（如果不存在）
-- =====================================================

CREATE TABLE IF NOT EXISTS muse_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    instruction TEXT NOT NULL,
    location_hint TEXT,
    reward_rarity VARCHAR(20) DEFAULT 'common',
    status VARCHAR(20) DEFAULT 'pending',
    response_media_url TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_muse_tasks_user_id ON muse_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_muse_tasks_status ON muse_tasks(user_id, status);

-- 啟用 RLS
ALTER TABLE muse_tasks ENABLE ROW LEVEL SECURITY;

-- RLS 政策
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muse_tasks' AND policyname = 'Allow anonymous read muse_tasks') THEN
        CREATE POLICY "Allow anonymous read muse_tasks" ON muse_tasks FOR SELECT TO anon USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muse_tasks' AND policyname = 'Allow anonymous insert muse_tasks') THEN
        CREATE POLICY "Allow anonymous insert muse_tasks" ON muse_tasks FOR INSERT TO anon WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'muse_tasks' AND policyname = 'Allow anonymous update muse_tasks') THEN
        CREATE POLICY "Allow anonymous update muse_tasks" ON muse_tasks FOR UPDATE TO anon USING (true);
    END IF;
END $$;

-- 添加註釋
COMMENT ON TABLE muse_tasks IS 'MUSE 指派給用戶的任務';
COMMENT ON COLUMN muse_tasks.task_type IS '任務類型: selfie, voice, photo, confession';
COMMENT ON COLUMN muse_tasks.instruction IS '任務說明';
COMMENT ON COLUMN muse_tasks.reward_rarity IS '獎勵稀有度: common, rare, epic, legendary';
COMMENT ON COLUMN muse_tasks.status IS '狀態: pending, completed, expired';
