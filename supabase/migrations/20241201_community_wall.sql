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

-- 私密貼文：登入用戶可讀（實際權限由前端控制，這裡先開放給登入用戶）
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
