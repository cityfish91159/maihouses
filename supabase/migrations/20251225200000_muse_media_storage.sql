-- 20251225200000_muse_media_storage.sql
-- 創建 muse-media storage bucket 用於存放照片和語音

-- 注意：Storage bucket 需要在 Supabase Dashboard 手動創建
-- 1. 前往 Supabase Dashboard > Storage
-- 2. 創建名為 "muse-media" 的 bucket
-- 3. 設置為 Public bucket（或根據需求設置 policies）

-- 以下是 RLS policies（如果 bucket 設為 private）

-- 允許所有人讀取 muse-media bucket
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'muse-media');

-- 允許所有人上傳到 muse-media bucket（MVP 開放政策）
-- CREATE POLICY "Anyone can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'muse-media');

-- 如果需要限制只能看自己的檔案，使用以下 policy:
-- CREATE POLICY "Users can view own files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'muse-media' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 添加 voice treasure 類型到 soul_treasures（如果還沒有）
-- 已經在原始 migration 中包含 'voice' 類型

-- 創建索引優化查詢
CREATE INDEX IF NOT EXISTS idx_soul_treasures_media ON soul_treasures(media_url) WHERE media_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_rival_decoder_created ON rival_decoder(created_at DESC);
