-- =============================================================================
-- BE-8 優化：push_subscriptions 失敗計數
-- Migration: 20260122_push_subscriptions_fail_count.sql
-- =============================================================================
--
-- WHY: 410 Gone 直接刪除太激進，可能誤刪暫時失敗的訂閱
--      改用 fail_count 累計，達門檻才刪除
--
-- =============================================================================

-- Step 1: 新增 fail_count 欄位
ALTER TABLE public.push_subscriptions
ADD COLUMN IF NOT EXISTS fail_count INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.push_subscriptions.fail_count
IS 'BE-8: 連續失敗次數，達 3 次後刪除';

-- Step 2: 新增 last_failed_at 欄位
ALTER TABLE public.push_subscriptions
ADD COLUMN IF NOT EXISTS last_failed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.push_subscriptions.last_failed_at
IS 'BE-8: 最後失敗時間';

-- Step 3: 新增 last_success_at 欄位
ALTER TABLE public.push_subscriptions
ADD COLUMN IF NOT EXISTS last_success_at TIMESTAMPTZ;

COMMENT ON COLUMN public.push_subscriptions.last_success_at
IS 'BE-8: 最後成功時間';

-- Step 4: 建立索引（清理任務用）
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fail_count
ON public.push_subscriptions (fail_count)
WHERE fail_count >= 3;

COMMENT ON INDEX idx_push_subscriptions_fail_count
IS 'BE-8: 加速查詢需刪除的失敗訂閱';

-- Step 5: RPC 函數 - 累加 fail_count
CREATE OR REPLACE FUNCTION fn_increment_push_fail_count(
  p_profile_id UUID,
  p_endpoint TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE push_subscriptions
  SET
    fail_count = fail_count + 1,
    last_failed_at = NOW()
  WHERE profile_id = p_profile_id AND endpoint = p_endpoint;
END;
$$;

GRANT EXECUTE ON FUNCTION fn_increment_push_fail_count TO service_role;

-- =============================================================================
-- 驗證指令：
-- SELECT column_name FROM information_schema.columns
-- WHERE table_name = 'push_subscriptions';
-- =============================================================================
