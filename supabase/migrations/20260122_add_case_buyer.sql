-- ============================================
-- DB-4: 案件 Buyer 欄位
-- ============================================
-- WHY: 案件要記錄「買方是誰」，BE-7 通知系統才知道要通知誰
--      消費者可能是已註冊用戶（user_id）或未註冊用戶（line_id）
--
-- 設計決策:
--   - buyer_user_id: 已註冊用戶，FK 到 auth.users
--   - buyer_line_id: LINE 用戶，TEXT 格式（U 開頭 33 字元）
--   - 兩者都可以為 NULL（案件建立時可能還不知道 buyer）
--   - 優先順序: user_id > line_id（BE-7 通知邏輯）
-- ============================================

-- Step 1: 新增 buyer_user_id 欄位
-- WHY: 連結已註冊的邁房子會員，用於 push 通知
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS buyer_user_id UUID REFERENCES auth.users(id);

COMMENT ON COLUMN public.trust_cases.buyer_user_id
IS 'Registered user ID for push notifications (FK to auth.users)';

-- Step 2: 新增 buyer_line_id 欄位
-- WHY: 連結 LINE 用戶，用於 LINE 推播通知
-- 格式: U 開頭 33 字元（LINE User ID）
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS buyer_line_id TEXT;

COMMENT ON COLUMN public.trust_cases.buyer_line_id
IS 'LINE User ID for LINE notifications (U-prefixed 33 chars)';

-- Step 3: 建立 buyer_user_id 索引
-- WHY: 查詢「某用戶的所有案件」（BE-6 消費者案件列表）
CREATE INDEX IF NOT EXISTS idx_trust_cases_buyer_user
ON public.trust_cases(buyer_user_id);

-- Step 4: 建立 buyer_line_id 索引
-- WHY: 查詢「某 LINE 用戶的所有案件」（BE-3 LINE 查詢交易）
CREATE INDEX IF NOT EXISTS idx_trust_cases_buyer_line
ON public.trust_cases(buyer_line_id);
