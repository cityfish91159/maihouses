-- ==============================================================================
-- Auth → Agents 自動同步機制
-- 當用戶註冊時，自動在 agents 表建立對應記錄
-- ==============================================================================

-- 1. 建立同步函數
CREATE OR REPLACE FUNCTION public.handle_new_agent()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  display_name TEXT;
BEGIN
  -- 從 email 提取顯示名稱 (@ 前的部分)
  display_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    '新房仲'
  );

  -- 插入到 agents 表
  INSERT INTO public.agents (id, name, company, trust_score, encouragement_count)
  VALUES (
    NEW.id,                          -- 使用 auth.users 的 id
    display_name,
    '邁房子',                         -- 預設公司
    80,                              -- 初始信任分數
    0                                -- 初始鼓勵數
  )
  ON CONFLICT (id) DO NOTHING;       -- 防止重複

  RETURN NEW;
END;
$$;

-- 2. 建立觸發器
DROP TRIGGER IF EXISTS on_auth_user_created_agent ON auth.users;
CREATE TRIGGER on_auth_user_created_agent
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_agent();

-- 3. 補建現有用戶的 agents 記錄 (一次性遷移)
INSERT INTO public.agents (id, name, company, trust_score, encouragement_count)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1), '房仲') as name,
  '邁房子' as company,
  80 as trust_score,
  0 as encouragement_count
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.agents)
ON CONFLICT (id) DO NOTHING;

-- 4. 確保 agents 表的 RLS 政策正確
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- 所有人都可以查看經紀人資料
CREATE POLICY IF NOT EXISTS "Public agents are viewable by everyone" 
ON public.agents FOR SELECT USING (true);

-- 經紀人可以更新自己的資料
CREATE POLICY IF NOT EXISTS "Agents can update own profile" 
ON public.agents FOR UPDATE USING (auth.uid() = id);
