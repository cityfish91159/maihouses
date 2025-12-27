-- 檔案：20251205_community_members.sql
-- 功能：建立 community_members 表以支援社區牆角色與權限

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('resident', 'agent', 'moderator')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'disabled')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.community_members
  ADD CONSTRAINT community_members_unique UNIQUE (community_id, user_id);

CREATE INDEX IF NOT EXISTS idx_community_members_community ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_role ON public.community_members(role);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 基本 RLS：用戶只能讀取自己的成員關係（Service Role 免驗證）
DROP POLICY IF EXISTS "Users can view their memberships" ON public.community_members;
CREATE POLICY "Users can view their memberships"
  ON public.community_members FOR SELECT
  USING (auth.uid() = user_id);

-- 用戶允許退出社區
DROP POLICY IF EXISTS "Users can leave their communities" ON public.community_members;
CREATE POLICY "Users can leave their communities"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);
