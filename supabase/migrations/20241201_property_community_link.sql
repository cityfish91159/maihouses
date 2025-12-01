-- 檔案：20241201_property_community_link.sql
-- 功能：社區牆自動建立與比對
-- 說明：房仲上傳物件時，自動建立/關聯社區牆
-- 
-- 核心策略：
--   1. 地址指紋比對 (address_fingerprint) - 主 key，同棟樓自動合併
--   2. 社區名稱模糊比對 (name + pg_trgm) - 輔助，防打錯字
--   3. 新建社區預設 is_verified = FALSE，待後台審核

-- ============================================
-- 0. 啟用模糊比對擴展 (需要 superuser 執行一次)
-- ============================================
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- 1. communities 表
-- ============================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  address_fingerprint TEXT,  -- 去掉樓層後的標準化地址，用於精準比對
  
  -- 狀態
  is_verified BOOLEAN DEFAULT FALSE,
  completeness_score INTEGER DEFAULT 20,  -- 0-100，用於後台補完排序
  
  -- 基本資訊
  district TEXT,
  city TEXT DEFAULT '台北市',
  building_age INTEGER,
  total_units INTEGER,
  management_fee INTEGER,
  
  -- 故事性推薦欄位
  story_vibe TEXT,
  two_good TEXT[],
  one_fair TEXT,
  resident_quote TEXT,
  best_for TEXT[],
  lifestyle_tags TEXT[],
  features TEXT[],
  
  -- 媒體
  cover_image TEXT,
  gallery TEXT[],
  
  -- 統計
  score DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  property_count INTEGER DEFAULT 0,
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. RLS 政策
-- ============================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
CREATE POLICY "Anyone can view communities"
  ON communities FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update communities" ON communities;
CREATE POLICY "Authenticated users can update communities"
  ON communities FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- 3. properties 表新增社區關聯
-- ============================================

ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

-- ============================================
-- 4. 索引 - 精準比對 + 模糊比對用
-- ============================================

CREATE INDEX IF NOT EXISTS idx_properties_community_id ON properties(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_district ON communities(district);
CREATE INDEX IF NOT EXISTS idx_communities_fingerprint ON communities(address_fingerprint);

-- 模糊比對索引 (需要先執行 CREATE EXTENSION pg_trgm)
-- CREATE INDEX IF NOT EXISTS idx_communities_name_trgm ON communities USING GIN (name gin_trgm_ops);

-- ============================================
-- 5. 模糊比對函數 (用於社區名打錯字比對)
-- ============================================

-- 使用方式：
-- SELECT * FROM communities 
-- WHERE similarity(name, '惠宇上情') > 0.3
-- ORDER BY similarity(name, '惠宇上情') DESC
-- LIMIT 5;

-- ============================================
-- 6. 自動更新 property_count 的 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_community_property_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 更新舊社區的計數（如果有）
  IF TG_OP = 'UPDATE' AND OLD.community_id IS NOT NULL THEN
    UPDATE communities 
    SET property_count = (
      SELECT COUNT(*) FROM properties WHERE community_id = OLD.community_id
    )
    WHERE id = OLD.community_id;
  END IF;
  
  -- 更新新社區的計數
  IF NEW.community_id IS NOT NULL THEN
    UPDATE communities 
    SET property_count = (
      SELECT COUNT(*) FROM properties WHERE community_id = NEW.community_id
    )
    WHERE id = NEW.community_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_community_count ON properties;
CREATE TRIGGER trigger_update_community_count
  AFTER INSERT OR UPDATE OF community_id ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_community_property_count();
