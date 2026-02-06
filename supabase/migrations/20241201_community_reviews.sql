-- 檔案：20241201_community_reviews.sql
-- 功能：社區評價池（兩好一公道原始資料）
-- 說明：每筆物件上傳的評價都存這裡，AI 再歸納成社區摘要

-- ============================================
-- 1. community_reviews 表
-- ============================================

CREATE TABLE IF NOT EXISTS community_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  -- 來源
  source TEXT DEFAULT 'agent',  -- 'agent' | 'resident' | 'system'
  
  -- 兩好一公道原始內容
  advantage_1 TEXT,
  advantage_2 TEXT,
  disadvantage TEXT,
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_reviews_community_id 
  ON community_reviews(community_id);
CREATE INDEX IF NOT EXISTS idx_community_reviews_property_id 
  ON community_reviews(property_id);

-- ============================================
-- 3. RLS 政策
-- ============================================

ALTER TABLE community_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view community reviews" ON community_reviews;
CREATE POLICY "Anyone can view community reviews"
  ON community_reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON community_reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON community_reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 4. 補充：communities 加 ai_metadata（如果還沒加）
-- ============================================

ALTER TABLE communities ADD COLUMN IF NOT EXISTS ai_metadata JSONB DEFAULT '{}'::jsonb;
