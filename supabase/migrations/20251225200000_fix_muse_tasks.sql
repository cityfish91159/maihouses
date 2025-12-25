-- =====================================================
-- 修復 muse_tasks 表 (統一版本)
-- 解決 406 錯誤
-- =====================================================

-- 刪除舊的表（如果存在衝突）
DROP TABLE IF EXISTS muse_tasks CASCADE;

-- 重新創建 muse_tasks 表
CREATE TABLE muse_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,                        -- Session ID (MVP 模式)
  task_type TEXT NOT NULL,                      -- 'selfie', 'voice', 'confession', 'photo'
  instruction TEXT NOT NULL,                    -- 任務指示
  location_hint TEXT,                           -- 指定位置提示
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_rarity TEXT DEFAULT 'rare',            -- 完成後的寶物稀有度
  response_media_url TEXT,                      -- 用戶回應的媒體
  response_text TEXT,                           -- 用戶回應的文字
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '24 hours')
);

-- 創建索引
CREATE INDEX idx_muse_tasks_user_id ON muse_tasks(user_id);
CREATE INDEX idx_muse_tasks_status ON muse_tasks(user_id, status);

-- 啟用 RLS
ALTER TABLE muse_tasks ENABLE ROW LEVEL SECURITY;

-- RLS 政策 (允許所有操作 - MVP 模式)
CREATE POLICY "Anyone can read tasks" ON muse_tasks FOR SELECT USING (true);
CREATE POLICY "Anyone can insert tasks" ON muse_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON muse_tasks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete tasks" ON muse_tasks FOR DELETE USING (true);

-- 啟用 Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE muse_tasks;

-- 添加註釋
COMMENT ON TABLE muse_tasks IS 'MUSE 指派給用戶的任務';
COMMENT ON COLUMN muse_tasks.task_type IS '任務類型: selfie, voice, photo, confession';
COMMENT ON COLUMN muse_tasks.instruction IS '任務說明';
COMMENT ON COLUMN muse_tasks.reward_rarity IS '獎勵稀有度: common, rare, epic, legendary';
COMMENT ON COLUMN muse_tasks.status IS '狀態: pending, completed, expired';
