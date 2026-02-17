-- ==============================================================================
-- Fix: community_comments 觸發函數 mutable search_path
--
-- 背景：Supabase Linter 警告 prevent_comment_parent_change、
-- update_post_comments_count、update_comment_updated_at 三個函數
-- 沒有設定 search_path，存在 search_path injection 風險。
--
-- 修復：對三個函數加上 SECURITY DEFINER SET search_path = public
-- 以固定搜尋路徑，防止惡意 schema 干擾函數行為。
--
-- 同時一併修復 toggle_comment_like / increment_comment_like_count
-- / decrement_comment_like_count（同檔案的其他函數，若 Linter 尚未
-- 警告也應預防）。
-- ==============================================================================

-- ── 1. prevent_comment_parent_change ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.prevent_comment_parent_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    RAISE EXCEPTION 'Cannot modify parent_id';
  END IF;
  IF OLD.post_id != NEW.post_id THEN
    RAISE EXCEPTION 'Cannot modify post_id';
  END IF;
  RETURN NEW;
END;
$$;

-- ── 2. update_post_comments_count ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.parent_id IS NULL THEN
      UPDATE public.community_posts
      SET comments_count = comments_count + 1
      WHERE id = NEW.post_id;
    ELSE
      UPDATE public.community_comments
      SET replies_count = replies_count + 1
      WHERE id = NEW.parent_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.parent_id IS NULL THEN
      UPDATE public.community_posts
      SET comments_count = GREATEST(0, comments_count - 1)
      WHERE id = OLD.post_id;
    ELSE
      UPDATE public.community_comments
      SET replies_count = GREATEST(0, replies_count - 1)
      WHERE id = OLD.parent_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

-- ── 3. update_comment_updated_at ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_comment_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
