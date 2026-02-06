-- ============================================
-- Team Charlie - P0-3: 新增 RPC 函數取得用戶姓名
-- ============================================
-- WHY: api/trust/upgrade-case.ts 需要查詢用戶真實姓名
--      但 Supabase JS SDK 無法直接查詢 auth.users
--      需要透過 SECURITY DEFINER RPC 函數查詢
--
-- 功能:
--   1. 查詢 auth.users.raw_user_meta_data 取得姓名
--   2. 優先順序: display_name > full_name > email
--   3. 返回 JSONB 格式: { "name": "張三" } 或 { "error": "User not found" }
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_get_user_display_name(
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = auth, public
AS $$
DECLARE
  v_user_metadata JSONB;
  v_email TEXT;
  v_display_name TEXT;
BEGIN
  -- 輸入驗證
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid input: user_id is required'
    );
  END IF;

  -- 查詢 auth.users 表
  SELECT
    raw_user_meta_data,
    email
  INTO
    v_user_metadata,
    v_email
  FROM auth.users
  WHERE id = p_user_id;

  -- 用戶不存在
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found'
    );
  END IF;

  -- 從 metadata 取得姓名（優先順序: display_name > full_name > email）
  v_display_name := COALESCE(
    v_user_metadata->>'display_name',
    v_user_metadata->>'full_name',
    v_email,
    '未知用戶'
  );

  -- 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'name', v_display_name
  );

EXCEPTION
  WHEN OTHERS THEN
    -- 錯誤處理（日誌脫敏）
    RAISE LOG 'fn_get_user_display_name error: % (SQLSTATE: %)',
      SQLERRM, SQLSTATE;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error occurred'
    );
END;
$$;

-- 註解說明
COMMENT ON FUNCTION public.fn_get_user_display_name(UUID)
IS '[Team Charlie - P0-3] 安全取得用戶顯示姓名，用於 trust/upgrade-case API';

-- 權限設定
REVOKE EXECUTE ON FUNCTION public.fn_get_user_display_name(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_get_user_display_name(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_get_user_display_name(UUID) TO authenticated, service_role;

-- ============================================
-- 測試範例（手動執行）
-- ============================================
-- SELECT * FROM fn_get_user_display_name('00000000-0000-0000-0000-000000000000');
-- 預期: { "success": false, "error": "User not found" }
--
-- SELECT * FROM fn_get_user_display_name(NULL);
-- 預期: { "success": false, "error": "Invalid input: user_id is required" }
