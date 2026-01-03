-- =============================================================================
-- AUTH-1: 註冊流程 phone 必填
-- 功能：
-- 1. profiles 表新增 phone 欄位
-- 2. 設定台灣手機號碼格式檢查 (^09[0-9]{8}$)
-- 3. 建立或更新 handle_new_user 觸發器，將 auth.meta.phone 同步至 profiles
-- =============================================================================

-- 1. 修改 profiles 表
DO $$
BEGIN
    -- 如果 phone 欄位不存在則新增
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    END IF;
END $$;

-- 2. 加入格式檢查 (先移除舊的以防萬一)
-- ✅ 允許 NULL（Google OAuth 用戶），但若有值則必須符合格式
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check
    CHECK (phone IS NULL OR phone ~ '^09[0-9]{8}$');

-- 強制非空 (Phone Required)
-- [CORRECTION]: 暫時移除 NOT NULL，因為 Google OAuth 註冊時不會有手機號碼，
-- 若強制 NOT NULL 會導致 handle_new_user 觸發器失敗，進而導致 OAuth 註冊失敗。
-- 我們改為在 "前端 Email 註冊" 強制必填，後端僅強制 "若有值則格式必須正確"。
ALTER TABLE public.profiles ALTER COLUMN phone DROP NOT NULL;

-- 3. 確保 handle_new_user 函數能夠同步 phone
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
    -- ✅ 不更新 role：避免覆蓋管理員手動設定的權限 (AUTH-1 問題 2 & 6.1 修復)
    -- role 應由業務邏輯控制，不應被觸發器覆蓋
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重建觸發器 (確保觸發器存在)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. 補建索引 (加速查詢)
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- 驗證註釋
COMMENT ON COLUMN public.profiles.phone IS 'User mobile phone number (format: 09xxxxxxxx)';

-- 6. 安全性檢查：確保 RLS 對 profiles 表有效
-- ⚠️ 注意：RLS Policy 無法細粒度到欄位級別，以下 Policy 控制整個 row 的訪問權限
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 允許用戶讀取自己的 profile（包含所有欄位：email, phone, role 等）
-- 清理舊命名（如果存在）
DROP POLICY IF EXISTS "Users can view own profile phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 允許用戶更新自己的 profile（包含所有欄位：email, phone, role 等）
-- 清理舊命名（如果存在）
DROP POLICY IF EXISTS "Users can update own profile phone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);
