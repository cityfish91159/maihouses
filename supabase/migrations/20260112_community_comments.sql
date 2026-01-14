-- ============================================
-- community_comments 表（貼文留言）
-- ============================================
-- 檔案：20260112_community_comments.sql
-- 功能：完整留言系統（支援巢狀回覆）
-- 相關工單：FEED-01 Phase 1

CREATE TABLE IF NOT EXISTS community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- 巢狀回覆支援
  parent_id UUID REFERENCES community_comments(id) ON DELETE CASCADE,

  -- 內容
  content TEXT NOT NULL CHECK (length(content) >= 1 AND length(content) <= 2000),

  -- 互動數據
  likes_count INTEGER DEFAULT 0 CHECK (likes_count >= 0),
  liked_by UUID[] DEFAULT '{}',
  replies_count INTEGER DEFAULT 0 CHECK (replies_count >= 0),

  -- 時間戳記
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_community_comments_post
  ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_parent
  ON community_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_created
  ON community_comments(post_id, created_at DESC);
-- 🔧 FIX: 新增 author_id 索引以優化 RLS 檢查效能
CREATE INDEX IF NOT EXISTS idx_community_comments_author
  ON community_comments(author_id);

-- ============================================
-- RLS 政策
-- ============================================

ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- 所有人可讀留言
DROP POLICY IF EXISTS "Comments visible to all" ON community_comments;
CREATE POLICY "Comments visible to all"
  ON community_comments FOR SELECT
  USING (true);

-- 登入用戶可建立留言
DROP POLICY IF EXISTS "Authenticated can create comments" ON community_comments;
CREATE POLICY "Authenticated can create comments"
  ON community_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

-- 作者可編輯自己的留言
DROP POLICY IF EXISTS "Author can update own comments" ON community_comments;
CREATE POLICY "Author can update own comments"
  ON community_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- ============================================
-- 禁止修改 parent_id 和 post_id 的 Trigger（效能優於 RLS subquery）
-- ============================================

CREATE OR REPLACE FUNCTION prevent_comment_parent_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    RAISE EXCEPTION 'Cannot modify parent_id';
  END IF;
  IF OLD.post_id != NEW.post_id THEN
    RAISE EXCEPTION 'Cannot modify post_id';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_prevent_comment_parent_change ON community_comments;
CREATE TRIGGER trigger_prevent_comment_parent_change
  BEFORE UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_comment_parent_change();

-- 作者可刪除自己的留言
DROP POLICY IF EXISTS "Author can delete own comments" ON community_comments;
CREATE POLICY "Author can delete own comments"
  ON community_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid());

-- ============================================
-- 更新 comments_count 的 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 只有頂層留言才計入 post 的 comments_count
    IF NEW.parent_id IS NULL THEN
      UPDATE community_posts
      SET comments_count = comments_count + 1
      WHERE id = NEW.post_id;
    ELSE
      -- 回覆計入父留言的 replies_count
      UPDATE community_comments
      SET replies_count = replies_count + 1
      WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NULL THEN
      UPDATE community_posts
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.post_id;
    ELSE
      UPDATE community_comments
      SET replies_count = GREATEST(0, replies_count - 1)
      WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON community_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- ============================================
-- updated_at 自動更新 Trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_comment_updated_at ON community_comments;
CREATE TRIGGER trigger_update_comment_updated_at
  BEFORE UPDATE ON community_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();

-- ============================================
-- 留言按讚函數
-- ============================================

CREATE OR REPLACE FUNCTION toggle_comment_like(comment_id UUID)
RETURNS JSON AS $$
DECLARE
  current_liked_by UUID[];
  new_liked_by UUID[];
  is_liked BOOLEAN;
BEGIN
  -- 🔧 FIX: Critical - 權限驗證
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- 🔧 FIX: Critical - NULL 檢查 + High - 併發控制 (FOR UPDATE)
  SELECT liked_by INTO current_liked_by
  FROM community_comments
  WHERE id = comment_id
  FOR UPDATE;

  -- 🔧 FIX: 使用 NOT FOUND 提升可讀性
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comment not found: %', comment_id;
  END IF;

  is_liked := auth.uid() = ANY(current_liked_by);

  IF is_liked THEN
    new_liked_by := array_remove(current_liked_by, auth.uid());
  ELSE
    new_liked_by := array_append(current_liked_by, auth.uid());
  END IF;

  UPDATE community_comments
  SET liked_by = new_liked_by,
      likes_count = cardinality(new_liked_by)
  WHERE id = comment_id;

  RETURN json_build_object(
    'liked', NOT is_liked,
    'likes_count', cardinality(new_liked_by)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 🔧 FIX: SECURITY DEFINER 權限限制
REVOKE ALL ON FUNCTION toggle_comment_like(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION toggle_comment_like(UUID) TO authenticated;
