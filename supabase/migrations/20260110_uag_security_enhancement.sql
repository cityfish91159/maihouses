-- =============================================================================
-- UAG 安全性增強 - fn_get_line_binding 添加 agent_id 驗證
-- Migration: 20260110_uag_security_enhancement.sql
--
-- 目標: 確保房仲只能查詢自己已購買客戶的 LINE 綁定狀態
-- 依賴: 20260108_uag14_line_notification.sql
-- =============================================================================

-- ============================================================================
-- 1. 新增增強版 fn_get_line_binding_v2
-- 與舊版相比：添加 p_agent_id 參數驗證
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_line_binding_v2(
  p_session_id TEXT,
  p_agent_id TEXT
)
RETURNS TABLE(
  line_user_id TEXT,
  line_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 驗證 agent_id 是否已購買該 session
  -- 這確保房仲只能查詢自己客戶的 LINE 狀態
  IF NOT EXISTS (
    SELECT 1 FROM public.uag_lead_purchases
    WHERE session_id = p_session_id
      AND agent_id = p_agent_id
  ) THEN
    -- 未找到購買記錄，返回空結果
    RETURN;
  END IF;

  -- 驗證通過，返回 LINE 綁定資訊
  RETURN QUERY
  SELECT
    b.line_user_id,
    b.line_status
  FROM public.uag_line_bindings b
  WHERE b.session_id = p_session_id
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION public.fn_get_line_binding_v2(TEXT, TEXT)
IS '查詢指定 session 的 LINE 綁定狀態（增強版），驗證 agent_id 是否已購買該客戶';

-- ============================================================================
-- 2. 權限控管
-- ============================================================================
REVOKE EXECUTE ON FUNCTION public.fn_get_line_binding_v2(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_line_binding_v2(TEXT, TEXT) TO service_role;

-- ============================================================================
-- 3. N+1 查詢優化 - get_latest_property_per_session RPC
-- 批次查詢多個 session 的最後瀏覽物件
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_latest_property_per_session(
  p_session_ids TEXT[]
)
RETURNS TABLE(
  session_id TEXT,
  property_id TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (e.session_id)
    e.session_id,
    e.property_id
  FROM public.uag_events e
  WHERE e.session_id = ANY(p_session_ids)
  ORDER BY e.session_id, e.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_latest_property_per_session(TEXT[])
IS '批次查詢多個 session 的最後瀏覽物件，優化 N+1 查詢問題';

-- 權限控管
REVOKE EXECUTE ON FUNCTION public.get_latest_property_per_session(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_latest_property_per_session(TEXT[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_latest_property_per_session(TEXT[]) TO authenticated;

-- ============================================================================
-- 完成
-- ============================================================================
