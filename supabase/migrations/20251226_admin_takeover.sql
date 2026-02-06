-- 管理員接管功能：當管理員接管對話時，AI 暫停回應
-- Add admin_takeover column to user_progress table

ALTER TABLE user_progress
ADD COLUMN IF NOT EXISTS admin_takeover boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS admin_takeover_at timestamptz DEFAULT NULL;

-- 加入註解
COMMENT ON COLUMN user_progress.admin_takeover IS '管理員是否正在接管對話（true = AI 暫停回應）';
COMMENT ON COLUMN user_progress.admin_takeover_at IS '管理員開始接管的時間';
