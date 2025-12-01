-- 檔案：20241201_community_wall.sql
-- 功能：社區牆完整 Schema（貼文 + 問答）
-- 說明：支援公開牆/私密牆/準住戶問答

-- ============================================
-- 1. community_posts 表（社區熱帖）
-- ============================================

CREATE TABLE IF NOT EXISTS community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 內容
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  
  -- 可見性：public=公開牆, private=私密牆
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private')),
  
  -- 貼文類型標籤
  post_type TEXT DEFAULT 'general' CHECK (post_type IN ('general', 'announcement', 'group_buy', 'parking', 'property')),
  
  -- 是否置頂
  is_pinned BOOLEAN DEFAULT FALSE,
  
  -- 互動數據
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',  -- 按讚的用戶 ID 陣列
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. community_questions 表（準住戶問答）
-- ============================================

CREATE TABLE IF NOT EXISTS community_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 問題內容
  question TEXT NOT NULL,
  
  -- 是否匿名
  is_anonymous BOOLEAN DEFAULT TRUE,
  
  -- 狀態
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  
  -- 互動數據
  answers_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. community_answers 表（問答回覆）
-- ============================================

CREATE TABLE IF NOT EXISTS community_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES community_questions(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 回答內容
  answer TEXT NOT NULL,
  
  -- 回答者類型
  author_type TEXT DEFAULT 'resident' CHECK (author_type IN ('resident', 'agent', 'system')),
  
  -- 是否為最佳回答
  is_best BOOLEAN DEFAULT FALSE,
  
  -- 按讚數
  likes_count INTEGER DEFAULT 0,
  
  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. 索引
-- ============================================

-- Posts 索引
CREATE INDEX IF NOT EXISTS idx_community_posts_community 
  ON community_posts(community_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_visibility 
  ON community_posts(community_id, visibility);
CREATE INDEX IF NOT EXISTS idx_community_posts_created 
  ON community_posts(created_at DESC);

-- Questions 索引
CREATE INDEX IF NOT EXISTS idx_community_questions_community 
  ON community_questions(community_id);
CREATE INDEX IF NOT EXISTS idx_community_questions_status 
  ON community_questions(community_id, status);

-- Answers 索引
CREATE INDEX IF NOT EXISTS idx_community_answers_question 
  ON community_answers(question_id);

-- ============================================
-- 5. RLS 政策
-- ============================================

-- Posts RLS
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- 公開貼文任何人可讀
DROP POLICY IF EXISTS "Public posts visible to all" ON community_posts;
CREATE POLICY "Public posts visible to all"
  ON community_posts FOR SELECT
  USING (visibility = 'public');

-- 私密貼文：登入用戶可讀
-- ⚠️ TECH DEBT: MVP 權宜之計
-- 目前任何登入用戶都能看私密牆，正式版需加入 user_communities 關聯表
-- 檢查用戶是否為該社區住戶 (WHERE auth.uid() IN (SELECT user_id FROM user_communities WHERE community_id = ...))
DROP POLICY IF EXISTS "Private posts visible to authenticated" ON community_posts;
CREATE POLICY "Private posts visible to authenticated"
  ON community_posts FOR SELECT
  TO authenticated
  USING (visibility = 'private');

-- 登入用戶可發文
DROP POLICY IF EXISTS "Authenticated can create posts" ON community_posts;
CREATE POLICY "Authenticated can create posts"
  ON community_posts FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Questions RLS
ALTER TABLE community_questions ENABLE ROW LEVEL SECURITY;

-- 問題全部公開可讀（增加 SEO）
DROP POLICY IF EXISTS "Questions visible to all" ON community_questions;
CREATE POLICY "Questions visible to all"
  ON community_questions FOR SELECT
  USING (true);

-- 登入用戶可發問
DROP POLICY IF EXISTS "Authenticated can create questions" ON community_questions;
CREATE POLICY "Authenticated can create questions"
  ON community_questions FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- Answers RLS
ALTER TABLE community_answers ENABLE ROW LEVEL SECURITY;

-- 回答全部公開可讀
DROP POLICY IF EXISTS "Answers visible to all" ON community_answers;
CREATE POLICY "Answers visible to all"
  ON community_answers FOR SELECT
  USING (true);

-- 登入用戶可回答
DROP POLICY IF EXISTS "Authenticated can create answers" ON community_answers;
CREATE POLICY "Authenticated can create answers"
  ON community_answers FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- ============================================
-- 6. 更新 answers_count 的 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_answers_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_questions 
    SET answers_count = answers_count + 1,
        status = CASE WHEN status = 'open' THEN 'answered' ELSE status END
    WHERE id = NEW.question_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_questions 
    SET answers_count = answers_count - 1
    WHERE id = OLD.question_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_answers_count ON community_answers;
CREATE TRIGGER trigger_update_answers_count
  AFTER INSERT OR DELETE ON community_answers
  FOR EACH ROW
  EXECUTE FUNCTION update_answers_count();

-- ============================================
-- 7. 更新 comments_count 的 Trigger（未來用）
-- ============================================

-- 預留給 post_comments 表使用

-- ============================================
-- 8. community_reviews View（對接 properties 表）
-- ============================================
-- 說明：評價資料存在 properties 表的 advantage_1, advantage_2, disadvantage 欄位
-- 建立 View 讓 API 可以統一查詢

-- 先刪除（無論是 Table 還是 View）
DROP TABLE IF EXISTS community_reviews CASCADE;
DROP VIEW IF EXISTS community_reviews CASCADE;

CREATE VIEW community_reviews AS
SELECT 
  p.id,
  p.community_id,
  p.agent_id AS author_id,
  p.created_at,
  -- 組合成評價內容
  jsonb_build_object(
    'pros', ARRAY[p.advantage_1, p.advantage_2],
    'cons', p.disadvantage,
    'property_title', p.title
  ) AS content,
  p.source_platform,
  p.source_external_id
FROM properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);

-- ============================================
-- 9. toggle_like 函數（按讚/取消讚）
-- ============================================

CREATE OR REPLACE FUNCTION toggle_like(post_id UUID)
RETURNS JSON AS $$
DECLARE
  current_liked_by UUID[];
  new_liked_by UUID[];
  is_liked BOOLEAN;
BEGIN
  -- 取得目前按讚清單
  SELECT liked_by INTO current_liked_by FROM community_posts WHERE id = post_id;
  
  -- 判斷是否已按過讚
  is_liked := auth.uid() = ANY(current_liked_by);
  
  IF is_liked THEN
    -- 取消讚
    new_liked_by := array_remove(current_liked_by, auth.uid());
  ELSE
    -- 按讚
    new_liked_by := array_append(current_liked_by, auth.uid());
  END IF;
  
  -- 更新
  UPDATE community_posts 
  SET liked_by = new_liked_by,
      likes_count = cardinality(new_liked_by)
  WHERE id = post_id;
  
  RETURN json_build_object(
    'liked', NOT is_liked,
    'likes_count', cardinality(new_liked_by)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
