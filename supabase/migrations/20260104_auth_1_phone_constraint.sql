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
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_format_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_phone_format_check 
    CHECK (phone ~ '^09[0-9]{8}$');

-- 強制非空 (Phone Required)
ALTER TABLE public.profiles ALTER COLUMN phone SET NOT NULL;

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
    role = EXCLUDED.role, -- 確保角色也能更新
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

-- 6. 安全性檢查：確保 RLS 對 phone 欄位有效
-- 雖然 profiles 通常已經有 RLS，但我們明確宣告策略以防萬一
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 允許用戶讀取自己的 phone
DROP POLICY IF EXISTS "Users can view own profile phone" ON public.profiles;
CREATE POLICY "Users can view own profile phone" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 允許用戶更新自己的 phone (如果業務邏輯允許)
DROP POLICY IF EXISTS "Users can update own profile phone" ON public.profiles;
CREATE POLICY "Users can update own profile phone" ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);
