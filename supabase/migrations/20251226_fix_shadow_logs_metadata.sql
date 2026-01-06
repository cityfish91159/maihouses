-- 20251226_fix_shadow_logs_metadata.sql
-- 修復 shadow_logs 表，讓焚燒功能可以正常運作

-- 1. 加入 metadata 欄位（如果不存在）
ALTER TABLE shadow_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 2. 移除 mode 約束（允許任何值）
ALTER TABLE shadow_logs DROP CONSTRAINT IF EXISTS shadow_logs_mode_check;

-- 3. 移除 user_id 外鍵約束（允許匿名 session ID）
ALTER TABLE shadow_logs DROP CONSTRAINT IF EXISTS shadow_logs_user_id_fkey;

-- 4. 修改 user_id 欄位類型為 TEXT（更靈活）
-- 注意：如果已有資料，需要先處理
ALTER TABLE shadow_logs ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- 5. 重設 RLS 政策（允許公開讀寫）
DROP POLICY IF EXISTS "Users can insert own logs" ON shadow_logs;
DROP POLICY IF EXISTS "Admins View All Logs" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Read for All" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Insert for All" ON shadow_logs;
DROP POLICY IF EXISTS "Enable Delete for All" ON shadow_logs;
DROP POLICY IF EXISTS "Public Insert Logs" ON shadow_logs;

CREATE POLICY "Allow All Read" ON shadow_logs FOR SELECT USING (true);
CREATE POLICY "Allow All Insert" ON shadow_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow All Delete" ON shadow_logs FOR DELETE USING (true);
CREATE POLICY "Allow All Update" ON shadow_logs FOR UPDATE USING (true);

-- 6. 確保 RLS 啟用
ALTER TABLE shadow_logs ENABLE ROW LEVEL SECURITY;

-- 7. 加入索引提升查詢效能
CREATE INDEX IF NOT EXISTS idx_shadow_logs_user_id ON shadow_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_shadow_logs_created_at ON shadow_logs(created_at DESC);
