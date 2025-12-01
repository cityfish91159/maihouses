-- 檔案：20241130_community_story_schema.sql
-- 功能：社區故事性推薦 - 支援「溫暖留客」策略
-- 說明：為社區資料表新增「氛圍故事」相關欄位

-- ============================================
-- 1. 先確保 communities 表存在
-- ============================================

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
  
  -- 社區特色標籤
  features TEXT[],
  
  -- 媒體
  cover_image TEXT,
  gallery TEXT[],
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 新增社區故事欄位
-- ============================================

ALTER TABLE communities ADD COLUMN IF NOT EXISTS story_vibe TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS two_good TEXT[];       -- 兩個優點
ALTER TABLE communities ADD COLUMN IF NOT EXISTS one_fair TEXT;         -- 一個公道話（誠實缺點）
ALTER TABLE communities ADD COLUMN IF NOT EXISTS resident_quote TEXT;   -- 住戶真實語錄
ALTER TABLE communities ADD COLUMN IF NOT EXISTS best_for TEXT[];       -- 最適合誰
ALTER TABLE communities ADD COLUMN IF NOT EXISTS lifestyle_tags TEXT[]; -- 生活風格標籤

-- 欄位說明
COMMENT ON COLUMN communities.story_vibe IS '社區氛圍故事，用畫面感描述社區生活';
COMMENT ON COLUMN communities.two_good IS '兩個優點（兩好）';
COMMENT ON COLUMN communities.one_fair IS '一個公道話（誠實的小缺點）';
COMMENT ON COLUMN communities.resident_quote IS '住戶真實語錄';
COMMENT ON COLUMN communities.best_for IS '最適合的客群描述';
COMMENT ON COLUMN communities.lifestyle_tags IS '生活風格標籤，用於 AI 匹配';

-- ============================================
-- 3. RLS 政策
-- ============================================

ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- 所有人都可以讀取社區資料
DROP POLICY IF EXISTS "Anyone can view communities" ON communities;
CREATE POLICY "Anyone can view communities"
  ON communities FOR SELECT
  USING (true);

-- 登入用戶可以建立社區
DROP POLICY IF EXISTS "Authenticated users can create communities" ON communities;
CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================
-- 4. 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_communities_district ON communities(district);
CREATE INDEX IF NOT EXISTS idx_communities_score ON communities(score DESC);
CREATE INDEX IF NOT EXISTS idx_communities_lifestyle_tags ON communities USING GIN(lifestyle_tags);

-- ============================================
-- 3. 範例資料
-- ============================================

-- 插入範例社區（測試用）
/*
INSERT INTO communities (name, district, story_vibe, two_good, one_fair, resident_quote, best_for, lifestyle_tags, features)
VALUES 
(
  '快樂花園',
  '板橋區',
  '這個社區早上都會有阿嬤在中庭打太極，下午充滿麵包香，因為樓下就是知名烘焙坊。晚上小朋友在草皮上跑來跑去，很有那種老社區的人情味。',
  ARRAY['中庭超大像公園', '管委會很罩、鄰居都認識'],
  '屋齡比較舊一點，但維護得很好',
  '住了八年，小孩都是在中庭交到的朋友',
  ARRAY['有小孩的家庭', '喜歡社區感的人', '不愛太新太冷的大樓'],
  ARRAY['family', 'community', 'quiet'],
  ARRAY['中庭花園', '近學區', '管理佳']
),
(
  '遠雄二代宅',
  '新莊區',
  '標準的飯店式管理，進出都要刷卡，管理員會幫你收包裹、叫計程車。公設有健身房、KTV、空中花園，假日不用出門就可以待一整天。',
  ARRAY['飯店式管理超方便', '公設齊全養得起'],
  '管理費稍高，但看品質值得',
  '下班回家管理員會打招呼，有種被照顧的感覺',
  ARRAY['忙碌的上班族', '重視隱私和服務', '願意付管理費換品質'],
  ARRAY['luxury', 'convenience', 'busy-professional'],
  ARRAY['飯店式管理', '健身房', '空中花園']
),
(
  '美河市',
  '新店區',
  '捷運共構宅的代表，下雨天完全不用撐傘就能到車站。社區很大、鄰居很多，有點像住在小城市裡面。樓下就是百貨，買東西超方便。',
  ARRAY['捷運共構零通勤', '生活機能滿分'],
  '人多比較熱鬧，喜歡安靜的要挑高樓層',
  '通勤時間從一小時變五分鐘，人生都變了',
  ARRAY['通勤族', '沒時間買菜的人', '喜歡熱鬧的人'],
  ARRAY['commute', 'convenience', 'urban'],
  ARRAY['捷運共構', '百貨樓下', '大型社區']
);
*/

-- ============================================
-- 4. 生活風格標籤對照表（參考用）
-- ============================================

/*
lifestyle_tags 建議使用以下標準化標籤，方便 AI 匹配：

| 標籤 Key | 中文說明 | 對應 AI 觸發類別 |
|----------|----------|------------------|
| family | 親子友善 | education |
| quiet | 安靜社區 | noise |
| pet-friendly | 寵物友善 | pet |
| commute | 通勤便利 | commute |
| luxury | 高端管理 | investment |
| newlywed | 新婚首購 | life-change |
| affordable | 平價入門 | rental |
| relaxing | 療癒空間 | stress |
| well-maintained | 維護良好 | quality |
| convenience | 生活便利 | amenity |
| community | 社區感強 | - |
| urban | 都會型 | - |
| busy-professional | 忙碌上班族 | commute, stress |
*/
