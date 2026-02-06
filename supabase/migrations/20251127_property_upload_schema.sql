-- ============================================
-- MaiHouses Property Upload Schema (修正版)
-- 功能：結構化欄位 + 兩好一公道 + RLS 安全
-- 執行方式：在 Supabase Dashboard > SQL Editor 執行
-- ============================================

-- 1. 啟用 UUID 擴充 (為了 ID 生成)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 新增/更新 Properties 表欄位 (若已存在則 ALTER)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS advantage_1 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS advantage_2 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS disadvantage TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS size NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS age NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS halls NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_current TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_total NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT '電梯大樓';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- ============================================
-- 3. Properties 表的 RLS 政策 (關鍵！)
-- ============================================

-- 確保 RLS 已啟用
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 允許任何人讀取 properties (公開瀏覽)
DROP POLICY IF EXISTS "Anyone can view properties" ON properties;
CREATE POLICY "Anyone can view properties" 
  ON properties FOR SELECT 
  USING (true);

-- 開發模式：允許任何人新增物件 (包括匿名)
-- 正式環境請改為 auth.role() = 'authenticated'
DROP POLICY IF EXISTS "Authenticated users can insert properties" ON properties;
DROP POLICY IF EXISTS "Anyone can insert properties" ON properties;
CREATE POLICY "Anyone can insert properties" 
  ON properties FOR INSERT 
  WITH CHECK (true);

-- 允許物件擁有者更新
DROP POLICY IF EXISTS "Users can update own properties" ON properties;
CREATE POLICY "Users can update own properties" 
  ON properties FOR UPDATE 
  USING (auth.uid() = agent_id OR agent_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');

-- ============================================
-- 4. Storage Bucket 設定
-- ============================================

-- 建立圖片存儲 Bucket (若不存在)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 更新 bucket 為 public (如果已存在但不是 public)
UPDATE storage.buckets SET public = true WHERE id = 'property-images';

-- ============================================
-- 5. Storage RLS 政策 (修正：允許匿名/已登入皆可上傳)
-- ============================================

-- 刪除舊政策 (避免衝突)
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;

-- 允許任何人上傳到 property-images bucket (開發階段)
CREATE POLICY "Anyone can upload property images" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'property-images');

-- 允許公開讀取圖片
CREATE POLICY "Public can view property images" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'property-images');

-- ============================================
-- 完成！現在可以上傳物件和圖片了
-- ============================================
