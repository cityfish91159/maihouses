-- ============================================================
-- Agent Contact Fields
-- 說明：為 agents 表新增聯絡方式欄位（電話、LINE ID）
-- ============================================================

-- 新增電話欄位（台灣手機格式）
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- 新增 LINE ID 欄位
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS line_id TEXT;

-- 電話格式檢查（允許 NULL，但若有值必須是台灣手機號碼格式）
ALTER TABLE public.agents
  ADD CONSTRAINT agents_phone_format
  CHECK (phone IS NULL OR phone ~ '^09[0-9]{8}$');

-- 欄位註解
COMMENT ON COLUMN public.agents.phone IS '房仲電話（台灣手機格式 09xxxxxxxx）';
COMMENT ON COLUMN public.agents.line_id IS '房仲 LINE ID';
