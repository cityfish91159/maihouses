-- ============================================================
-- Agent Stats Columns
-- 說明：為 agents 表新增帶看/成交統計欄位，供社區評價顯示
-- ============================================================

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS deal_count INTEGER NOT NULL DEFAULT 0;

-- 既有資料補上預設值（保險起見）
UPDATE public.agents
SET visit_count = COALESCE(visit_count, 0);

UPDATE public.agents
SET deal_count = COALESCE(deal_count, 0);

COMMENT ON COLUMN public.agents.visit_count IS '累計帶看次數';
COMMENT ON COLUMN public.agents.deal_count IS '累計成交戶數';
