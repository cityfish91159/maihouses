-- =============================================================================
-- UAG-14: LINE 通知整合 - Phase 1 資料庫 Schema
-- Migration: 20260108_uag14_line_notification.sql
--
-- 目標: 建立 LINE 通知所需的資料表與函數
-- 依賴: 20251231_001_uag_schema_setup.sql (uag_lead_purchases)
-- =============================================================================

-- ============================================================================
-- 1. uag_line_bindings 表 - LINE 綁定永久記錄
-- 設計決策: 獨立於 uag_sessions，避免清 cookie 丟失綁定
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uag_line_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  line_user_id TEXT NOT NULL,              -- LINE User ID (U 開頭 33 字元)
  line_status TEXT NOT NULL DEFAULT 'active'
    CHECK (line_status IN ('active', 'blocked')),
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 一個 LINE 帳號只能綁定一個 session
  CONSTRAINT uag_line_bindings_line_user_id_unique UNIQUE (line_user_id)
);

-- 索引: 用 session_id 查詢綁定
CREATE INDEX IF NOT EXISTS idx_uag_line_bindings_session_id
ON public.uag_line_bindings (session_id);

-- 索引: 用 line_user_id 查詢（用於 webhook 更新狀態）
CREATE INDEX IF NOT EXISTS idx_uag_line_bindings_line_user_id
ON public.uag_line_bindings (line_user_id);

COMMENT ON TABLE public.uag_line_bindings
IS 'LINE 綁定永久記錄，獨立於 session 表避免 cookie 清除導致丟失';

COMMENT ON COLUMN public.uag_line_bindings.line_user_id
IS 'LINE User ID，格式為 U 開頭 33 字元字串';

COMMENT ON COLUMN public.uag_line_bindings.line_status
IS 'LINE 狀態: active=可發送, blocked=已封鎖官方帳號（由 webhook 更新）';

-- ============================================================================
-- 2. uag_lead_purchases 表擴充 - 新增通知狀態追蹤欄位
-- ============================================================================
ALTER TABLE public.uag_lead_purchases
ADD COLUMN IF NOT EXISTS notification_status TEXT DEFAULT 'pending'
  CHECK (notification_status IN ('pending', 'sent', 'no_line', 'unreachable', 'failed'));

ALTER TABLE public.uag_lead_purchases
ADD COLUMN IF NOT EXISTS notification_retry_key UUID;

ALTER TABLE public.uag_lead_purchases
ADD COLUMN IF NOT EXISTS last_notification_at TIMESTAMPTZ;

COMMENT ON COLUMN public.uag_lead_purchases.notification_status
IS 'LINE 通知狀態: pending=待發送, sent=已送達, no_line=未綁定, unreachable=無法送達, failed=發送失敗';

COMMENT ON COLUMN public.uag_lead_purchases.notification_retry_key
IS 'LINE X-Line-Retry-Key，用於冪等重試防止重複發送';

COMMENT ON COLUMN public.uag_lead_purchases.last_notification_at
IS '最後一次通知發送/嘗試時間';

-- ============================================================================
-- 3. uag_line_audit_logs 表 - LINE 推播審計日誌
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uag_line_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID REFERENCES public.uag_lead_purchases(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  retry_key UUID NOT NULL,
  status TEXT NOT NULL                     -- accepted, no_line, unreachable, error
    CHECK (status IN ('accepted', 'no_line', 'unreachable', 'error')),
  line_response JSONB,                     -- LINE API 回應（成功時為 null）
  error_message TEXT,                      -- 錯誤訊息
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引: 按 purchase_id 查詢歷史
CREATE INDEX IF NOT EXISTS idx_uag_line_audit_logs_purchase_id
ON public.uag_line_audit_logs (purchase_id);

-- 索引: 按時間查詢
CREATE INDEX IF NOT EXISTS idx_uag_line_audit_logs_created_at
ON public.uag_line_audit_logs (created_at DESC);

-- 索引: 按狀態查詢（用於統計）
CREATE INDEX IF NOT EXISTS idx_uag_line_audit_logs_status
ON public.uag_line_audit_logs (status);

COMMENT ON TABLE public.uag_line_audit_logs
IS 'LINE 推播審計日誌，記錄所有 LINE 通知嘗試';

-- ============================================================================
-- 4. uag_line_notification_queue 表 - LINE 通知佇列（支援重試）
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.uag_line_notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,                -- 關聯 messages 表，用於防重複發送
  purchase_id UUID REFERENCES public.uag_lead_purchases(id) ON DELETE SET NULL,
  line_user_id TEXT NOT NULL,
  connect_url TEXT NOT NULL,               -- 帶 token 的聊天室連結
  agent_name TEXT NOT NULL,                -- 房仲名稱（用於 LINE 訊息）
  property_title TEXT,                     -- 物件標題（用於 LINE 訊息）
  grade TEXT                               -- UAG 等級 S/A/B/C（用於差異化訊息）
    CHECK (grade IS NULL OR grade IN ('S', 'A', 'B', 'C')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sent', 'failed', 'blocked')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,

  -- 防重複發送: 同一則訊息只能有一筆佇列記錄
  CONSTRAINT uag_line_notification_queue_message_id_unique UNIQUE (message_id)
);

-- 索引: 查詢待處理項目（用於 Cron 重試）
CREATE INDEX IF NOT EXISTS idx_uag_line_notification_queue_pending
ON public.uag_line_notification_queue (status, next_retry_at)
WHERE status = 'pending';

-- 索引: 按 purchase_id 查詢
CREATE INDEX IF NOT EXISTS idx_uag_line_notification_queue_purchase_id
ON public.uag_line_notification_queue (purchase_id);

-- 索引: 按建立時間查詢
CREATE INDEX IF NOT EXISTS idx_uag_line_notification_queue_created_at
ON public.uag_line_notification_queue (created_at DESC);

COMMENT ON TABLE public.uag_line_notification_queue
IS 'LINE 通知佇列，支援重試機制（最多 3 次）';

COMMENT ON COLUMN public.uag_line_notification_queue.message_id
IS '關聯 messages 表的 ID，UNIQUE 確保同一訊息不會重複發送';

COMMENT ON COLUMN public.uag_line_notification_queue.connect_url
IS '帶 token 的聊天室連結，確保跨裝置/LINE WebView 都能正確開啟';

-- ============================================================================
-- 5. RLS 政策 - 保護 LINE 敏感資料
-- ============================================================================

-- 5.1 uag_line_bindings: 只有 service role 可存取
ALTER TABLE public.uag_line_bindings ENABLE ROW LEVEL SECURITY;

-- 移除舊政策（如果存在）
DROP POLICY IF EXISTS "uag_line_bindings_service_role_only" ON public.uag_line_bindings;

-- 建立新政策: 只有 service role 可以操作
-- 使用 FALSE 禁止所有一般用戶存取，service_role 會繞過 RLS
CREATE POLICY "uag_line_bindings_service_role_only"
ON public.uag_line_bindings
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 5.2 uag_line_audit_logs: 只有 service role 可存取
ALTER TABLE public.uag_line_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uag_line_audit_logs_service_role_only" ON public.uag_line_audit_logs;

CREATE POLICY "uag_line_audit_logs_service_role_only"
ON public.uag_line_audit_logs
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- 5.3 uag_line_notification_queue: 只有 service role 可存取
ALTER TABLE public.uag_line_notification_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "uag_line_notification_queue_service_role_only" ON public.uag_line_notification_queue;

CREATE POLICY "uag_line_notification_queue_service_role_only"
ON public.uag_line_notification_queue
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);

-- ============================================================================
-- 6. RPC 函數 - 查詢 LINE 綁定狀態
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_line_binding(p_session_id TEXT)
RETURNS TABLE(
  line_user_id TEXT,
  line_status TEXT
)
LANGUAGE plpgsql
STABLE  -- 同一 transaction 內可快取結果
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 此函數由後端 API 使用 service_role 呼叫
  -- 前端無法直接呼叫（受 RLS 保護）
  RETURN QUERY
  SELECT
    b.line_user_id,
    b.line_status
  FROM public.uag_line_bindings b
  WHERE b.session_id = p_session_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.fn_get_line_binding(TEXT)
IS '查詢指定 session 的 LINE 綁定狀態，由後端 API 使用 service_role 呼叫';

-- ============================================================================
-- 7. RPC 函數 - 建立/更新 LINE 綁定（供未來 LINE Login 使用）
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_upsert_line_binding(
  p_session_id TEXT,
  p_line_user_id TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_binding_id UUID;
BEGIN
  -- Upsert: 如果 line_user_id 已存在則更新 session_id
  INSERT INTO public.uag_line_bindings (session_id, line_user_id, line_status)
  VALUES (p_session_id, p_line_user_id, 'active')
  ON CONFLICT (line_user_id)
  DO UPDATE SET
    session_id = EXCLUDED.session_id,
    line_status = 'active',  -- 重新綁定時恢復為 active
    bound_at = NOW()
  RETURNING id INTO v_binding_id;

  RETURN v_binding_id;
END;
$$;

COMMENT ON FUNCTION public.fn_upsert_line_binding(TEXT, TEXT)
IS '建立或更新 LINE 綁定，一個 LINE 帳號只能綁定一個 session';

-- ============================================================================
-- 8. RPC 函數 - 更新 LINE 狀態（供 Webhook 使用）
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_line_status(
  p_line_user_id TEXT,
  p_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rowcount INT;
BEGIN
  -- 驗證狀態值
  IF p_status NOT IN ('active', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active or blocked', p_status;
  END IF;

  UPDATE public.uag_line_bindings
  SET line_status = p_status
  WHERE line_user_id = p_line_user_id;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  RETURN v_rowcount > 0;
END;
$$;

COMMENT ON FUNCTION public.fn_update_line_status(TEXT, TEXT)
IS '更新 LINE 綁定狀態，用於 LINE Webhook 處理 follow/unfollow 事件';

-- ============================================================================
-- 9. RPC 函數 - 新增 LINE 審計日誌
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_log_line_notification(
  p_purchase_id UUID,
  p_session_id TEXT,
  p_retry_key UUID,
  p_status TEXT,
  p_line_response JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- 驗證狀態值
  IF p_status NOT IN ('accepted', 'no_line', 'unreachable', 'error') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: accepted, no_line, unreachable, error', p_status;
  END IF;

  INSERT INTO public.uag_line_audit_logs (
    purchase_id,
    session_id,
    retry_key,
    status,
    line_response,
    error_message
  )
  VALUES (
    p_purchase_id,
    p_session_id,
    p_retry_key,
    p_status,
    p_line_response,
    p_error_message
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.fn_log_line_notification(UUID, TEXT, UUID, TEXT, JSONB, TEXT)
IS '記錄 LINE 通知發送結果，用於審計與除錯';

-- ============================================================================
-- 10. RPC 函數 - 處理佇列中待重試的通知（供 Cron 使用）
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_pending_line_notifications(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  message_id UUID,
  purchase_id UUID,
  line_user_id TEXT,
  connect_url TEXT,
  agent_name TEXT,
  property_title TEXT,
  grade TEXT,
  retry_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.id,
    q.message_id,
    q.purchase_id,
    q.line_user_id,
    q.connect_url,
    q.agent_name,
    q.property_title,
    q.grade,
    q.retry_count
  FROM public.uag_line_notification_queue q
  WHERE q.status = 'pending'
    AND q.retry_count < q.max_retries
    AND (q.next_retry_at IS NULL OR q.next_retry_at <= NOW())
  ORDER BY q.created_at ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.fn_get_pending_line_notifications(INTEGER)
IS '取得待處理的 LINE 通知佇列項目，供 Cron Job 重試使用';

-- ============================================================================
-- 11. RPC 函數 - 更新佇列狀態
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_line_queue_status(
  p_queue_id UUID,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rowcount INT;
  v_next_retry TIMESTAMPTZ;
BEGIN
  -- 驗證狀態值
  IF p_status NOT IN ('pending', 'sent', 'failed', 'blocked') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: pending, sent, failed, blocked', p_status;
  END IF;

  -- 如果狀態為 pending 且有錯誤，計算下次重試時間（指數退避）
  IF p_status = 'pending' AND p_error IS NOT NULL THEN
    SELECT NOW() + (POWER(2, retry_count) * INTERVAL '1 minute')
    INTO v_next_retry
    FROM public.uag_line_notification_queue
    WHERE id = p_queue_id;
  END IF;

  UPDATE public.uag_line_notification_queue
  SET
    status = p_status,
    last_error = COALESCE(p_error, last_error),
    retry_count = CASE
      WHEN p_status = 'pending' AND p_error IS NOT NULL THEN retry_count + 1
      ELSE retry_count
    END,
    sent_at = CASE WHEN p_status = 'sent' THEN NOW() ELSE sent_at END,
    next_retry_at = v_next_retry
  WHERE id = p_queue_id;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;
  RETURN v_rowcount > 0;
END;
$$;

COMMENT ON FUNCTION public.fn_update_line_queue_status(UUID, TEXT, TEXT)
IS '更新 LINE 通知佇列狀態，支援指數退避重試機制';

-- ============================================================================
-- 12. 權限控管 - REVOKE EXECUTE FROM PUBLIC
-- 重要: SECURITY DEFINER 函數預設開放給 PUBLIC，必須明確撤銷
-- ============================================================================

-- 撤銷 PUBLIC 執行權限（包含 anon/authenticated）
REVOKE EXECUTE ON FUNCTION public.fn_get_line_binding(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_upsert_line_binding(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_update_line_status(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_log_line_notification(UUID, TEXT, UUID, TEXT, JSONB, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_get_pending_line_notifications(INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_update_line_queue_status(UUID, TEXT, TEXT) FROM PUBLIC;

-- 只授權 service_role 執行（後端 API 使用）
GRANT EXECUTE ON FUNCTION public.fn_get_line_binding(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_upsert_line_binding(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_update_line_status(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_log_line_notification(UUID, TEXT, UUID, TEXT, JSONB, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_get_pending_line_notifications(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_update_line_queue_status(UUID, TEXT, TEXT) TO service_role;

-- ============================================================================
-- 完成
-- ============================================================================
