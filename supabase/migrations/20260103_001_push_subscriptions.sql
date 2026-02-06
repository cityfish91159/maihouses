-- =============================================================================
-- NOTIFY-2: Web Push 訂閱資料模型
-- Migration: 20260103_001_push_subscriptions.sql
-- =============================================================================

-- ============================================================================
-- 1. push_subscriptions 表 - 推播訂閱
-- ============================================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,                    -- Push Service endpoint URL
  p256dh TEXT NOT NULL,                      -- Public key for encryption
  auth TEXT NOT NULL,                        -- Auth secret
  user_agent TEXT,                           -- 訂閱時的瀏覽器資訊
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 確保每個用戶每個 endpoint 只有一筆訂閱
  CONSTRAINT unique_profile_endpoint UNIQUE (profile_id, endpoint)
);

-- push_subscriptions 索引
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_profile_id ON push_subscriptions(profile_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_created_at ON push_subscriptions(created_at DESC);

-- ============================================================================
-- 2. RLS 政策
-- ============================================================================
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的訂閱
CREATE POLICY "push_subscriptions_select" ON push_subscriptions
  FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

-- 用戶只能建立自己的訂閱
CREATE POLICY "push_subscriptions_insert" ON push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

-- 用戶只能更新自己的訂閱
CREATE POLICY "push_subscriptions_update" ON push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- 用戶只能刪除自己的訂閱
CREATE POLICY "push_subscriptions_delete" ON push_subscriptions
  FOR DELETE
  TO authenticated
  USING (profile_id = auth.uid());

-- ============================================================================
-- 3. 觸發器：自動更新 updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_push_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at_trigger
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_push_subscriptions_updated_at();

-- ============================================================================
-- 4. 輔助函數：儲存/更新推播訂閱 (Upsert)
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_upsert_push_subscription(
  p_profile_id UUID,
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription_id UUID;
BEGIN
  IF auth.role() <> 'service_role' AND p_profile_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO push_subscriptions (profile_id, endpoint, p256dh, auth, user_agent)
  VALUES (p_profile_id, p_endpoint, p_p256dh, p_auth, p_user_agent)
  ON CONFLICT (profile_id, endpoint)
  DO UPDATE SET
    p256dh = EXCLUDED.p256dh,
    auth = EXCLUDED.auth,
    user_agent = EXCLUDED.user_agent,
    updated_at = NOW()
  RETURNING id INTO v_subscription_id;

  RETURN v_subscription_id;
END;
$$;

-- ============================================================================
-- 5. 輔助函數：刪除推播訂閱
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_delete_push_subscription(
  p_profile_id UUID,
  p_endpoint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rowcount INT;
BEGIN
  IF auth.role() <> 'service_role' AND p_profile_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  DELETE FROM push_subscriptions
  WHERE profile_id = p_profile_id AND endpoint = p_endpoint;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  RETURN v_rowcount > 0;
END;
$$;

-- ============================================================================
-- 6. 輔助函數：取得用戶的所有推播訂閱（供 Edge Function 發送推播用）
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_get_push_subscriptions(
  p_profile_id UUID
)
RETURNS TABLE (
  endpoint TEXT,
  p256dh TEXT,
  auth TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' AND p_profile_id <> auth.uid() THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  RETURN QUERY
  SELECT ps.endpoint, ps.p256dh, ps.auth
  FROM push_subscriptions ps
  WHERE ps.profile_id = p_profile_id;
END;
$$;

-- ============================================================================
-- 完成
-- ============================================================================
