-- 檔案：20241201_property_community_link.sql
-- 功能：社區自動建立 - 簡化版
-- 說明：房仲上傳物件時，前端處理社區建立邏輯
-- 
-- 核心策略：
--   1. 地址指紋比對 (address_fingerprint) - 同棟樓自動合併
--   2. 名稱模糊比對 (name) - 支援搜尋
--   3. 影子建立 - 房仲上傳時自動建立，後台可補完

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
-- 4. 索引 - 精準比對用
-- ============================================

CREATE INDEX IF NOT EXISTS idx_properties_community_id ON properties(community_id);
CREATE INDEX IF NOT EXISTS idx_communities_name ON communities(name);
CREATE INDEX IF NOT EXISTS idx_communities_district ON communities(district);
CREATE INDEX IF NOT EXISTS idx_communities_fingerprint ON communities(address_fingerprint);

-- ============================================
-- 5. 自動更新 property_count 的 Trigger (可選)
-- ============================================
-- 每次物件新增/刪除時，更新社區的 property_count
-- 這部分可以之後再加，目前先靠查詢計算
