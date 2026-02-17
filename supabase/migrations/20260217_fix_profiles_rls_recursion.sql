-- ============================================================================
-- FIX: profiles 表 schema 不完整 + RLS Policy 無限遞迴
-- ============================================================================
-- 根本原因：
--   1. profiles 表只有 (id, role, phone) 三個欄位
--   2. handle_new_user() trigger 嘗試寫入 (id, email, phone, role)
--      → email 欄位不存在 → INSERT 失敗
--   3. ON CONFLICT 裡更新 updated_at → 欄位也不存在 → 失敗
--   4. RLS Policy 有 42P17 無限遞迴（影響 anon 查詢，雖然 trigger 用 SECURITY DEFINER）
-- 錯誤：AuthApiError: Database error saving new user
-- ============================================================================

-- ============================
-- 步驟 1：補齊 profiles 缺少的欄位
-- ============================

-- 新增 email 欄位
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 新增 updated_at 欄位
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 新增 created_at 欄位（若不存在）
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================
-- 步驟 2：修復 RLS Policy 無限遞迴
-- ============================

-- 清除所有現有 profiles RLS Policies（含可能在 Dashboard 手動建立的遞迴 policy）
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.policyname);
    RAISE NOTICE 'Dropped policy: %', pol.policyname;
  END LOOP;
END $$;

-- 確保 RLS 啟用
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 重建安全的 RLS Policies（只用 auth.uid() = id，不引用其他表，不引用 profiles 自身）
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================
-- 步驟 3：重建 handle_new_user() 函數
-- ============================
-- SECURITY DEFINER + SET search_path = public 確保繞過 RLS 並正確解析表名

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================
-- 步驟 4：確保 trigger 存在
-- ============================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================
-- 步驟 5：補建 index
-- ============================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
