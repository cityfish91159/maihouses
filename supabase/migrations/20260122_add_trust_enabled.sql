-- ============================================
-- 安心留痕：物件層級的服務開關
-- WHY: 房仲上傳物件時可選擇是否開啟安心留痕服務
--      消費者在詳情頁看到徽章才知道這物件有交易追蹤
-- ============================================
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS trust_enabled BOOLEAN NOT NULL DEFAULT false;
