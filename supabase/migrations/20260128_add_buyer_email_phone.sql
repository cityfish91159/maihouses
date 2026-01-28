-- ============================================
-- DB-5: 買方電話與 Email 欄位
-- ============================================
-- WHY: BE-8 補完買方資訊 API 需要明確的電話與 email 欄位
--      現有的 buyer_contact 欄位語意不清（可能是電話或 email）
--
-- 設計決策:
--   - buyer_phone: 買方電話（TEXT，最多 20 字元）
--   - buyer_email: 買方 Email（TEXT，最多 100 字元）
--   - 保留 buyer_contact 用於向後兼容，但未來優先使用 buyer_phone
-- ============================================

-- Step 1: 新增 buyer_phone 欄位
-- WHY: 明確儲存買方電話號碼
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS buyer_phone TEXT;

COMMENT ON COLUMN public.trust_cases.buyer_phone
IS '買方電話號碼（BE-8 補完買方資訊）';

-- Step 2: 新增 buyer_email 欄位
-- WHY: 明確儲存買方電子郵件
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS buyer_email TEXT;

COMMENT ON COLUMN public.trust_cases.buyer_email
IS '買方電子郵件（BE-8 補完買方資訊）';

-- Step 3: 資料遷移 - 將 buyer_contact 視為電話號碼遷移到 buyer_phone
-- WHY: 現有案件的 buyer_contact 主要儲存電話，需要遷移到新欄位
UPDATE public.trust_cases
SET buyer_phone = buyer_contact
WHERE buyer_contact IS NOT NULL
  AND buyer_phone IS NULL;

COMMENT ON COLUMN public.trust_cases.buyer_contact
IS '買方聯絡方式（已棄用，請使用 buyer_phone 或 buyer_email）';
