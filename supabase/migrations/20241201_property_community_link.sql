-- 檔案：20241201_property_community_link.sql
-- 功能：社區自動建立 - 地址模糊比對策略
-- 說明：房仲上傳物件時，用地址自動歸戶社區

-- ============================================
-- 1. communities 表（如果不存在就建立）
-- ============================================

CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- 社區名稱
  address TEXT,                          -- 標準化地址（去除樓層）
  address_fingerprint TEXT UNIQUE,       -- 地址指紋（用於唯一比對）
  google_place_id TEXT UNIQUE,           -- Google Place ID（防重複）
  
  -- 狀態
  is_verified BOOLEAN DEFAULT FALSE,     -- 是否已人工審核
  created_from_property_id UUID,         -- 從哪個物件觸發建立
  
  -- 基本資訊（初始可空，AI 異步補完）
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

CREATE INDEX IF NOT EXISTS idx_properties_community_id ON properties(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_address_fingerprint ON communities(address_fingerprint);
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);

-- ============================================
-- 4. 地址標準化函數
-- ============================================

-- 將地址轉為「指紋」：去除樓層、之、-等雜訊
CREATE OR REPLACE FUNCTION normalize_address_fingerprint(addr TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      regexp_replace(
        COALESCE(addr, ''),
        '[之\-－—]', '', 'g'  -- 移除「之」和各種破折號
      ),
      '\d+樓.*$', '', 'g'     -- 移除樓層資訊
    ),
    '\s+', '', 'g'            -- 移除空格
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 5. 自動尋找或建立社區（核心邏輯）
-- ============================================

CREATE OR REPLACE FUNCTION find_or_create_community(
  p_name TEXT,
  p_address TEXT,
  p_property_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_fingerprint TEXT;
  v_community_id UUID;
  v_district TEXT;
  v_city TEXT;
BEGIN
  -- 計算地址指紋
  v_fingerprint := normalize_address_fingerprint(p_address);
  
  -- 1. 先用地址指紋找
  SELECT id INTO v_community_id
  FROM communities
  WHERE address_fingerprint = v_fingerprint
  LIMIT 1;
  
  IF v_community_id IS NOT NULL THEN
    RETURN v_community_id;
  END IF;
  
  -- 2. 用名稱模糊找（相同區域）
  v_district := substring(p_address from '([^市縣]+[區鄉鎮市])');
  
  SELECT id INTO v_community_id
  FROM communities
  WHERE name = p_name AND district = v_district
  LIMIT 1;
  
  IF v_community_id IS NOT NULL THEN
    RETURN v_community_id;
  END IF;
  
  -- 3. 都找不到，建立新社區（影子模式）
  v_city := COALESCE(substring(p_address from '^(.*?[市縣])'), '台北市');
  
  INSERT INTO communities (
    name, 
    address, 
    address_fingerprint,
    district,
    city,
    is_verified,
    created_from_property_id
  ) VALUES (
    COALESCE(NULLIF(p_name, ''), '未命名社區'),
    p_address,
    v_fingerprint,
    v_district,
    v_city,
    FALSE,
    p_property_id
  )
  RETURNING id INTO v_community_id;
  
  RETURN v_community_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. 更新社區物件計數 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_community_property_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 新增物件時 +1
  IF TG_OP = 'INSERT' AND NEW.community_id IS NOT NULL THEN
    UPDATE communities 
    SET property_count = property_count + 1
    WHERE id = NEW.community_id;
  END IF;
  
  -- 刪除物件時 -1
  IF TG_OP = 'DELETE' AND OLD.community_id IS NOT NULL THEN
    UPDATE communities 
    SET property_count = GREATEST(property_count - 1, 0)
    WHERE id = OLD.community_id;
  END IF;
  
  -- 更換社區時
  IF TG_OP = 'UPDATE' AND OLD.community_id IS DISTINCT FROM NEW.community_id THEN
    IF OLD.community_id IS NOT NULL THEN
      UPDATE communities 
      SET property_count = GREATEST(property_count - 1, 0)
      WHERE id = OLD.community_id;
    END IF;
    IF NEW.community_id IS NOT NULL THEN
      UPDATE communities 
      SET property_count = property_count + 1
      WHERE id = NEW.community_id;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_community_count ON properties;
CREATE TRIGGER trg_update_community_count
  AFTER INSERT OR UPDATE OR DELETE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_community_property_count();


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
