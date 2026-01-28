-- ============================================
-- Team 5: Token 升級 API - RPC 函數
-- ============================================
-- WHY: 消費者從匿名 token 進入 Trust Room 後，
--      註冊/登入帳號時，需要將案件綁定到自己的帳號
--
-- 業務邏輯:
--   1. 驗證 token 有效（未過期、未撤銷）
--   2. 檢查案件是否已綁定其他用戶（防止重複綁定）
--   3. UPDATE trust_cases SET buyer_user_id, buyer_name
--   4. 保留 buyer_temp_code 供查詢（向下兼容）
--
-- 安全設計:
--   - SECURITY DEFINER 繞過 RLS（anon 用戶可執行）
--   - 函數內驗證 token 狀態
--   - 原子性操作（單次 UPDATE）
-- ============================================

CREATE OR REPLACE FUNCTION public.fn_upgrade_trust_case(
  p_token UUID,
  p_user_id TEXT,
  p_user_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_current_buyer_user_id UUID;
  v_current_buyer_name TEXT;
  v_updated_count INTEGER;
BEGIN
  -- [Team 7 修復] 輸入驗證
  IF p_token IS NULL OR p_user_id IS NULL OR p_user_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid input: all parameters are required'
    );
  END IF;

  -- [Team 7 修復] 驗證 user_id 格式（UUID）
  BEGIN
    PERFORM p_user_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user_id format (must be UUID)'
    );
  END;

  -- [Team 7 修復] 驗證 user_name 長度
  IF LENGTH(p_user_name) < 1 OR LENGTH(p_user_name) > 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user_name length (must be 1-50 characters)'
    );
  END IF;

  -- 1. 查詢案件並驗證 token（鎖定該列以確保原子性）
  SELECT
    id,
    buyer_user_id,
    buyer_name
  INTO
    v_case_id,
    v_current_buyer_user_id,
    v_current_buyer_name
  FROM public.trust_cases
  WHERE token = p_token
    AND token_expires_at > NOW()
    AND token_revoked_at IS NULL
  FOR UPDATE;  -- 鎖定該列，防止並發衝突

  -- 2. Token 無效、過期或已撤銷
  IF v_case_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token 無效、已過期或已撤銷'
    );
  END IF;

  -- 3. 檢查案件是否已綁定其他用戶
  IF v_current_buyer_user_id IS NOT NULL THEN
    -- 如果已綁定的是同一個用戶，視為重複操作，返回成功
    IF v_current_buyer_user_id::TEXT = p_user_id THEN
      RETURN jsonb_build_object(
        'success', true,
        'case_id', v_case_id,
        'message', '案件已綁定至此用戶（重複操作）'
      );
    ELSE
      -- 已綁定其他用戶，拒絕操作
      RETURN jsonb_build_object(
        'success', false,
        'error', '此案件已綁定其他用戶，無法重複綁定'
      );
    END IF;
  END IF;

  -- 4. 升級案件：綁定用戶 ID 和名稱
  UPDATE public.trust_cases
  SET
    buyer_user_id = p_user_id::UUID,
    buyer_name = p_user_name,
    updated_at = NOW()
  WHERE id = v_case_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- 5. 確認更新成功
  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '案件更新失敗（並發衝突）'
    );
  END IF;

  -- 6. 建立事件記錄
  INSERT INTO public.trust_case_events (
    case_id,
    step,
    step_name,
    action,
    actor,
    detail
  )
  VALUES (
    v_case_id,
    (SELECT current_step FROM public.trust_cases WHERE id = v_case_id),
    (
      CASE (SELECT current_step FROM public.trust_cases WHERE id = v_case_id)
        WHEN 1 THEN 'M1 接洽'
        WHEN 2 THEN 'M2 帶看'
        WHEN 3 THEN 'M3 出價'
        WHEN 4 THEN 'M4 斡旋'
        WHEN 5 THEN 'M5 成交'
        WHEN 6 THEN 'M6 交屋'
        ELSE '未知階段'
      END
    ),
    '消費者綁定帳號',
    'buyer',
    jsonb_build_object(
      'user_id', p_user_id,
      'user_name', p_user_name,
      'previous_buyer_name', v_current_buyer_name
    )::TEXT
  );

  -- 7. 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id
  );

-- [Team 7 修復] EXCEPTION 處理
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'fn_upgrade_trust_case error: % (case_id: %, user_id: %)',
      SQLERRM, v_case_id, p_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error occurred'
    );
END;
$$;

-- 註解說明
COMMENT ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT)
IS '[Team 5] Upgrade case from anonymous token to registered user, prevents duplicate binding';

-- [Team 7 修復] 權限設定 - 僅允許 authenticated 和 service_role 執行（移除 anon）
-- 原因：匿名用戶在升級前必須先完成註冊/登入，因此不需要 anon 權限
REVOKE EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ============================================
-- 驗證 SQL
-- ============================================
-- 1. 測試成功升級（用真實 token 替換）
-- SELECT * FROM fn_upgrade_trust_case(
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
--   'user-uuid',
--   '陳小明'
-- );
--
-- 2. 測試重複綁定（應返回成功，不重複更新）
-- SELECT * FROM fn_upgrade_trust_case(
--   'same-token',
--   'same-user-id',
--   '陳小明'
-- );
--
-- 3. 測試已綁定其他用戶（應返回錯誤）
-- SELECT * FROM fn_upgrade_trust_case(
--   'token-bound-to-other-user',
--   'different-user-id',
--   '王大明'
-- );
--
-- 4. 測試 token 無效（應返回錯誤）
-- SELECT * FROM fn_upgrade_trust_case(
--   'invalid-token',
--   'user-id',
--   '陳小明'
-- );
--
-- 5. 確認案件已更新
-- SELECT id, buyer_user_id, buyer_name, token
-- FROM trust_cases
-- WHERE token = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
--
-- 6. 確認事件記錄已建立
-- SELECT * FROM trust_case_events
-- WHERE case_id = (
--   SELECT id FROM trust_cases
--   WHERE token = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
-- )
-- ORDER BY created_at DESC
-- LIMIT 1;
