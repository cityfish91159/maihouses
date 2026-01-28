-- ============================================
-- Team 7: RPC 函數安全強化 - fn_upgrade_trust_case
-- ============================================
-- WHY: 審核發現原始 RPC 函數缺乏：
--   1. 輸入驗證（可能傳入 NULL 或無效值）
--   2. EXCEPTION 處理（錯誤時無法記錄日誌）
--   3. 過度寬鬆的權限（anon 不應有權限）
--
-- 修復內容：
--   1. 加入完整輸入驗證（NULL 檢查、UUID 格式、長度限制）
--   2. 加入 EXCEPTION 處理（記錄到日誌並返回友善錯誤）
--   3. 移除 anon 權限（僅允許 authenticated 和 service_role）
--
-- Skills Applied:
--   - [Draconian RLS Audit] Default-Deny 安全姿態
--   - [Backend Safeguard] 完整輸入驗證
--   - [NASA TypeScript Safety] 錯誤處理完整性
--   - [Team 7] RPC 函數安全強化
-- ============================================

-- 刪除現有函數（如果存在）
DROP FUNCTION IF EXISTS public.fn_upgrade_trust_case(UUID, TEXT, TEXT);

-- 重新建立帶安全強化的函數
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
  -- [Team 7 修復] 1. 輸入驗證 - NULL 檢查
  IF p_token IS NULL OR p_user_id IS NULL OR p_user_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid input: all parameters are required'
    );
  END IF;

  -- [Team 7 修復] 2. 輸入驗證 - user_id 必須是有效的 UUID
  BEGIN
    PERFORM p_user_id::UUID;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user_id format (must be UUID)'
    );
  END;

  -- [Team 7 修復] 3. 輸入驗證 - user_name 長度限制
  IF LENGTH(p_user_name) < 1 OR LENGTH(p_user_name) > 50 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid user_name length (must be 1-50 characters)'
    );
  END IF;

  -- 4. 查詢案件並驗證 token（鎖定該列以確保原子性）
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

  -- 5. Token 無效、過期或已撤銷
  IF v_case_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token 無效、已過期或已撤銷'
    );
  END IF;

  -- 6. 檢查案件是否已綁定其他用戶
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

  -- 7. 升級案件：綁定用戶 ID 和名稱
  UPDATE public.trust_cases
  SET
    buyer_user_id = p_user_id::UUID,
    buyer_name = p_user_name,
    updated_at = NOW()
  WHERE id = v_case_id;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- 8. 確認更新成功
  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '案件更新失敗（並發衝突）'
    );
  END IF;

  -- 9. 建立事件記錄
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

  -- 10. 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id
  );

-- [Team 7 修復] 11. EXCEPTION 處理
EXCEPTION
  WHEN OTHERS THEN
    -- 記錄錯誤到 PostgreSQL 日誌
    RAISE LOG 'fn_upgrade_trust_case error: % (case_id: %, user_id: %)',
      SQLERRM, v_case_id, p_user_id;

    -- 返回友善的錯誤訊息（不洩露實現細節）
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Database error occurred'
    );
END;
$$;

-- 註解說明
COMMENT ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT)
IS '[Team 7] Upgrade case from anonymous token to registered user, with input validation and exception handling';

-- [Team 7 修復] 權限設定 - 僅允許 authenticated 和 service_role
-- 原因：匿名用戶必須先註冊/登入才能升級案件，因此不需要 anon 權限
-- 這符合 Draconian RLS Audit 的 Default-Deny 原則
REVOKE EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_upgrade_trust_case(UUID, TEXT, TEXT) TO authenticated, service_role;

-- ============================================
-- 驗證 SQL（測試用）
-- ============================================

-- 1. 測試輸入驗證 - NULL 參數
-- SELECT * FROM fn_upgrade_trust_case(NULL, NULL, NULL);
-- 預期: {"success": false, "error": "Invalid input: all parameters are required"}

-- 2. 測試輸入驗證 - 無效 UUID
-- SELECT * FROM fn_upgrade_trust_case(
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID,
--   'not-a-uuid',
--   '測試用戶'
-- );
-- 預期: {"success": false, "error": "Invalid user_id format (must be UUID)"}

-- 3. 測試輸入驗證 - 名稱過長
-- SELECT * FROM fn_upgrade_trust_case(
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::UUID,
--   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
--   '這是一個超級長的名字超過五十個字符這是一個超級長的名字超過五十個字符'
-- );
-- 預期: {"success": false, "error": "Invalid user_name length (must be 1-50 characters)"}

-- 4. 測試成功升級（用真實 token 替換）
-- SELECT * FROM fn_upgrade_trust_case(
--   'valid-token-uuid'::UUID,
--   'user-uuid',
--   '陳小明'
-- );
-- 預期: {"success": true, "case_id": "..."}
