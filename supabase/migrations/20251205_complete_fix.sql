-- ============================================================
-- Community Wall 完整修復 SQL
-- 日期：2024/12/05
-- 執行方式：在 Supabase Dashboard SQL Editor 貼上執行
-- ============================================================

-- ============================================
-- STEP 1: 重建 community_reviews View
-- 問題：原 View 欄位與 API 期望不匹配
-- ============================================
DROP VIEW IF EXISTS public.community_reviews CASCADE;

CREATE VIEW public.community_reviews AS
SELECT 
  p.id,
  p.community_id,
  p.id AS property_id,           -- API 需要 property_id
  COALESCE(p.source_platform, 'agent') AS source,  -- API 需要 source 欄位
  p.advantage_1,                 -- 獨立欄位，非 JSONB
  p.advantage_2,                 -- 獨立欄位，非 JSONB
  p.disadvantage,                -- 獨立欄位，非 JSONB
  p.created_at
FROM public.properties p
WHERE p.community_id IS NOT NULL
  AND (p.advantage_1 IS NOT NULL OR p.advantage_2 IS NOT NULL OR p.disadvantage IS NOT NULL);

-- 設定 RLS 為 INVOKER 模式
ALTER VIEW public.community_reviews SET (security_invoker = true);

-- 授予存取權限
GRANT SELECT ON public.community_reviews TO anon, authenticated;

-- ============================================
-- STEP 2: 確保 agents 表有必要欄位
-- ============================================
DO $$
BEGIN
  -- 新增 visit_count 欄位（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agents' 
    AND column_name = 'visit_count'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN visit_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ 已新增 agents.visit_count 欄位';
  END IF;

  -- 新增 deal_count 欄位（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'agents' 
    AND column_name = 'deal_count'
  ) THEN
    ALTER TABLE public.agents ADD COLUMN deal_count INTEGER DEFAULT 0;
    RAISE NOTICE '✅ 已新增 agents.deal_count 欄位';
  END IF;
END $$;

-- ============================================
-- STEP 3: 確保 community_members 表存在
-- （用於判斷用戶是否為社區成員）
-- ============================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'resident', 'agent', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_id, user_id)
);

-- RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 允許用戶查詢自己的成員資格
DROP POLICY IF EXISTS "Users can view their own membership" ON public.community_members;
CREATE POLICY "Users can view their own membership"
  ON public.community_members FOR SELECT
  USING (auth.uid() = user_id);

-- 允許查詢社區成員數（不暴露詳細資料）
DROP POLICY IF EXISTS "Anyone can count members" ON public.community_members;
CREATE POLICY "Anyone can count members"
  ON public.community_members FOR SELECT
  USING (true);

GRANT SELECT ON public.community_members TO anon, authenticated;

-- ============================================
-- STEP 4: 清理髒資料（無效 UUID）
-- 問題：舊測試資料使用 00000000-... 格式
-- ============================================
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- 刪除 properties 表中無效的測試資料
  DELETE FROM public.properties 
  WHERE id::text LIKE '00000000-0000-0000-0000-%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '✅ 已刪除 % 筆無效 properties 資料', deleted_count;
  END IF;

  -- 刪除 community_posts 表中無效的測試資料
  DELETE FROM public.community_posts 
  WHERE id::text LIKE '00000000-0000-0000-0000-%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '✅ 已刪除 % 筆無效 community_posts 資料', deleted_count;
  END IF;

  -- 刪除 community_questions 表中無效的測試資料
  DELETE FROM public.community_questions 
  WHERE id::text LIKE '00000000-0000-0000-0000-%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '✅ 已刪除 % 筆無效 community_questions 資料', deleted_count;
  END IF;

  -- 刪除使用無效 community_id 的資料
  DELETE FROM public.community_posts 
  WHERE community_id::text LIKE '00000000-0000-0000-0000-%';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count > 0 THEN
    RAISE NOTICE '✅ 已刪除 % 筆使用無效 community_id 的 posts', deleted_count;
  END IF;
END $$;

-- ============================================
-- STEP 5: 驗證修復結果
-- ============================================
SELECT 'View 欄位檢查' AS check_type, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'community_reviews'
ORDER BY ordinal_position;

-- 測試 View 是否可正常查詢
SELECT '評價資料測試' AS check_type, COUNT(*) AS total_reviews 
FROM public.community_reviews;

-- ============================================
-- 完成訊息
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Community Wall 修復完成！';
  RAISE NOTICE '============================================';
  RAISE NOTICE '請執行 20251205_test_community_seed.sql 插入測試資料';
  RAISE NOTICE '';
END $$;
