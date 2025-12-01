-- 檔案：20241201_property_community_link.sql
-- 功能：物件表新增社區關聯欄位 + 社區自動建立支援
-- 說明：房仲上傳物件時自動建立社區牆

-- ============================================
-- 1. properties 表新增社區關聯欄位
-- ============================================

-- 新增社區名稱欄位 (純文字，供搜尋用)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_name TEXT;

-- 新增社區 ID 關聯 (外鍵，指向 communities 表)
ALTER TABLE properties ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);

-- 欄位說明
COMMENT ON COLUMN properties.community_name IS '社區名稱（純文字，供搜尋和顯示用）';
COMMENT ON COLUMN properties.community_id IS '關聯的社區 ID（如果有建立社區牆）';

-- 索引
CREATE INDEX IF NOT EXISTS idx_properties_community_name ON properties(community_name);
CREATE INDEX IF NOT EXISTS idx_properties_community_id ON properties(community_id);


-- ============================================
-- 2. 確保 communities 表存在基本欄位
-- ============================================

-- 如果表不存在，建立基本結構
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  
  -- 基本資訊
  address TEXT,
  district TEXT,
  city TEXT DEFAULT '台北市',
  building_age INTEGER,
  total_units INTEGER,
  management_fee INTEGER,
  
  -- 評價統計
  score DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  -- 故事性推薦欄位
  story_vibe TEXT,
  two_good TEXT[],
  one_fair TEXT,
  resident_quote TEXT,
  best_for TEXT[],
  lifestyle_tags TEXT[],
  
  -- 社區特色標籤
  features TEXT[],
  
  -- 媒體
  cover_image TEXT,
  gallery TEXT[],
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- 所有人都可以讀取社區資料
CREATE POLICY IF NOT EXISTS "Anyone can view communities"
  ON communities FOR SELECT
  USING (true);

-- 登入用戶可以建立社區
CREATE POLICY IF NOT EXISTS "Authenticated users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ============================================
-- 3. 更新時間戳記 Trigger
-- ============================================

-- 確保有 updated_at 自動更新函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 套用到 communities 表
DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON communities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- 4. 統計函數：計算社區物件數量
-- ============================================

CREATE OR REPLACE FUNCTION get_community_property_count(community_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM properties
    WHERE community_id = community_uuid
  );
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- 5. 範例：惠宇上晴 社區資料
-- ============================================
/*
INSERT INTO communities (name, address, district, city, two_good, one_fair, features)
VALUES (
  '惠宇上晴',
  '台中市西屯區市政北七路',
  '西屯區',
  '台中市',
  ARRAY['公設維護好，管委會效率高', '社區安靜，鄰居素質佳'],
  '面向主幹道的低樓層車流聲較明顯',
  ARRAY['電梯大樓', '學區型', '寵物友善']
)
ON CONFLICT (name) DO NOTHING;
*/
