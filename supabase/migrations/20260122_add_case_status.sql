-- ============================================
-- DB-2: 案件生命週期狀態欄位
-- ============================================
-- WHY: 100 個案件只有 1 個成交，其他 99 個要能自動處理
--      案件需要休眠、關閉機制，不能永遠「進行中」
--
-- 狀態說明:
--   active                  = 進行中（預設）
--   dormant                 = 休眠（30 天無互動）
--   completed               = 成交（M5 完成）
--   closed_sold_to_other    = 他人成交（同物件其他案件 M5）
--   closed_property_unlisted = 物件下架（房仲下架物件）
--   closed_inactive         = 過期關閉（休眠超過 60 天）
--   pending                 = 待處理（保留）
--   cancelled               = 已取消（保留）
--   expired                 = 已過期（保留，向後相容）
-- ============================================

-- Step 1: 移除舊的 CHECK 約束
-- WHY: PostgreSQL 不支援 ALTER CONSTRAINT，必須先 DROP 再 ADD
ALTER TABLE public.trust_cases
DROP CONSTRAINT IF EXISTS trust_cases_status_check;

-- Step 2: 新增擴展的 CHECK 約束（6 種新狀態 + 3 種舊狀態）
-- WHY: 保留舊狀態確保向後相容，新增 dormant 和 closed_* 系列
ALTER TABLE public.trust_cases
ADD CONSTRAINT trust_cases_status_check
CHECK (status IN (
  'active',                    -- 進行中
  'dormant',                   -- 休眠（30 天無互動）
  'completed',                 -- 成交
  'closed_sold_to_other',      -- 他人成交
  'closed_property_unlisted',  -- 物件下架
  'closed_inactive',           -- 過期關閉
  'pending',                   -- 待處理（向後相容）
  'cancelled',                 -- 已取消（向後相容）
  'expired'                    -- 已過期（向後相容）
));

-- Step 3: 新增休眠時間欄位
-- WHY: 記錄案件何時進入休眠，用於計算 60 天過期
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS dormant_at TIMESTAMPTZ;

COMMENT ON COLUMN public.trust_cases.dormant_at
IS '案件進入休眠狀態的時間，用於計算過期（休眠後 60 天自動關閉）';

-- Step 4: 新增關閉時間欄位
-- WHY: 記錄案件關閉時間，用於審計追蹤
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.trust_cases.closed_at
IS '案件關閉時間，用於審計追蹤';

-- Step 5: 新增關閉原因欄位
-- WHY: 記錄關閉原因，用於 Trust Room 顯示對應訊息
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS closed_reason TEXT;

COMMENT ON COLUMN public.trust_cases.closed_reason
IS '案件關閉原因，用於 Trust Room 顯示對應 Banner';

-- Step 6: 更新 status 欄位 COMMENT
COMMENT ON COLUMN public.trust_cases.status
IS '案件狀態: active=進行中, dormant=休眠, completed=成交, closed_sold_to_other=他人成交, closed_property_unlisted=物件下架, closed_inactive=過期關閉';

-- Step 7: 新增索引 - 休眠案件查詢（每日 Cron Job 使用）
-- WHY: LC-4 每日檢查休眠超過 60 天的案件
CREATE INDEX IF NOT EXISTS idx_trust_cases_dormant_at
ON public.trust_cases (dormant_at)
WHERE status = 'dormant' AND dormant_at IS NOT NULL;

-- Step 8: 新增索引 - 待休眠案件查詢（每日 Cron Job 使用）
-- WHY: LC-3 每日檢查 30 天無互動的案件
CREATE INDEX IF NOT EXISTS idx_trust_cases_active_updated
ON public.trust_cases (updated_at)
WHERE status = 'active';

-- Step 9: 新增狀態-時間戳一致性約束
-- WHY: 確保 dormant 有 dormant_at、closed_* 有 closed_at，防止資料不一致
-- LOGIC: PostgreSQL CHECK 使用 OR 邏輯
--        (status != 'dormant' OR dormant_at IS NOT NULL)
--        → 如果 status 不是 dormant → 條件為 TRUE（通過）
--        → 如果 status 是 dormant → 必須 dormant_at 不為空才通過
ALTER TABLE public.trust_cases
ADD CONSTRAINT trust_cases_status_timestamp_consistency
CHECK (
  -- Rule 1: dormant 狀態必須有 dormant_at
  (status != 'dormant' OR dormant_at IS NOT NULL)
  AND
  -- Rule 2: closed_* 系列狀態必須有 closed_at
  (status NOT IN ('closed_sold_to_other', 'closed_property_unlisted', 'closed_inactive')
   OR closed_at IS NOT NULL)
);

COMMENT ON CONSTRAINT trust_cases_status_timestamp_consistency ON public.trust_cases
IS '強制狀態與時間戳一致性：dormant 必須有 dormant_at，closed_* 必須有 closed_at';

-- ============================================
-- 驗證 SQL
-- ============================================
-- SELECT status, dormant_at, closed_at, closed_reason FROM trust_cases LIMIT 1;
-- 有欄位就是成功
