-- ============================================
-- MaiHouses Property Upload Schema
-- 功能：結構化欄位 + 兩好一公道 + RLS 安全
-- 執行方式：在 Supabase Dashboard > SQL Editor 執行
-- ============================================

-- 1. 啟用 UUID 擴充 (為了 ID 生成)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. 新增/更新 Properties 表欄位 (若已存在則 ALTER)
-- 注意：這裡使用 ALTER 而非 CREATE，以兼容現有資料

-- 新增結構化評價欄位
ALTER TABLE properties ADD COLUMN IF NOT EXISTS advantage_1 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS advantage_2 TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS disadvantage TEXT;

-- 新增規格欄位
ALTER TABLE properties ADD COLUMN IF NOT EXISTS size NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS age NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS rooms NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS halls NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS bathrooms NUMERIC DEFAULT 0;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_current TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS floor_total NUMERIC;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT DEFAULT '電梯大樓';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';

-- 3. 建立圖片存儲 Bucket (若不存在)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 圖片上傳權限 (若不存在)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Authenticated users can upload property images'
  ) THEN
    CREATE POLICY "Authenticated users can upload property images" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');
  END IF;
END
$$;

-- 5. 允許公開讀取圖片
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND policyname = 'Public can view property images'
  ) THEN
    CREATE POLICY "Public can view property images" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'property-images');
  END IF;
END
$$;
