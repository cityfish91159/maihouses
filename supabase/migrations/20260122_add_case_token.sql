-- ============================================
-- DB-3: 案件 Token 欄位 (v2 - 安全修復版)
-- ============================================
-- WHY: 消費者要能用 Token 連結進入 Trust Room，不用登入也能看進度
--      Token 要有過期時間（90 天），確保連結不會永久有效
--
-- 設計決策:
--   - UUID v4 作為 token（122 bits 熵值，足夠安全）
--   - 90 天過期（足夠長的交易週期）
--   - UNIQUE INDEX 確保唯一性 + 查詢效率
--   - NOT NULL + DEFAULT 確保每個案件必有 token
--   - token_revoked_at 支援手動撤銷 token
--
-- 安全設計:
--   - 不使用 RLS 開放 anon 查詢（避免資料外洩）
--   - 僅透過 SECURITY DEFINER RPC 函數存取
--   - RPC 函數內驗證 token + 過期 + 撤銷狀態
-- ============================================

-- Step 1: 新增 token 欄位
-- WHY: 每個案件需要一個唯一的 token 供消費者查詢
-- 使用 gen_random_uuid() 在 DB 層自動生成，確保每個案件必有 token
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token UUID NOT NULL DEFAULT gen_random_uuid();

COMMENT ON COLUMN public.trust_cases.token
IS 'Case token for Trust Room public URL (UUID v4, 122 bits entropy)';

-- Step 2: 新增 token_expires_at 欄位
-- WHY: Token 需要過期機制，90 天足夠長的交易週期
-- 預設值 NOW() + 90 天，確保新案件自動設定過期時間
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '90 days';

COMMENT ON COLUMN public.trust_cases.token_expires_at
IS 'Token expiration time, default 90 days from creation';

-- Step 3: 新增 token_revoked_at 欄位
-- WHY: 支援手動撤銷 token（消費者要求或安全考量）
-- NULL 表示未撤銷，有值表示撤銷時間
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS token_revoked_at TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN public.trust_cases.token_revoked_at
IS 'Token revocation time, NULL means not revoked';

-- Step 4: 建立 UNIQUE INDEX
-- WHY: 確保 token 唯一，同時作為查詢索引（用 token 查案件）
CREATE UNIQUE INDEX IF NOT EXISTS idx_trust_cases_token
ON public.trust_cases (token);

-- Step 5: 移除危險的 RLS 政策（如果存在）
-- WHY: 避免 anon 用戶直接 SELECT 出所有案件
-- 安全設計: 只允許透過 SECURITY DEFINER RPC 函數查詢
DROP POLICY IF EXISTS "trust_cases_public_token_select" ON public.trust_cases;

-- Step 6: 建立 RPC 函數 - 用 token 查詢案件
-- WHY: 提供安全的 token 查詢介面，驗證 token 有效性
-- 安全設計:
--   - SECURITY DEFINER 繞過 RLS（因為 anon 沒有直接存取權）
--   - 函數內驗證 token + 過期 + 撤銷狀態
--   - 只回傳消費者需要的欄位（不含敏感資訊）
CREATE OR REPLACE FUNCTION public.fn_get_trust_case_by_token(
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case JSONB;
  v_events JSONB;
BEGIN
  -- 1. 查詢案件（驗證 token 存在、未過期、未撤銷）
  SELECT jsonb_build_object(
    'id', tc.id,
    'buyer_name', tc.buyer_name,
    'property_title', tc.property_title,
    'current_step', tc.current_step,
    'status', tc.status,
    'created_at', tc.created_at,
    'updated_at', tc.updated_at,
    'token', tc.token,
    'token_expires_at', tc.token_expires_at
  )
  INTO v_case
  FROM public.trust_cases tc
  WHERE tc.token = p_token
    AND tc.token_expires_at > NOW()
    AND tc.token_revoked_at IS NULL;

  -- 2. Token 無效、過期或已撤銷
  IF v_case IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Token invalid, expired, or revoked'
    );
  END IF;

  -- 3. 取得事件列表（消費者可見的事件）
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tce.id,
      'step', tce.step,
      'step_name', tce.step_name,
      'action', tce.action,
      'actor', tce.actor,
      'created_at', tce.created_at
    )
    ORDER BY tce.created_at DESC
  ), '[]'::JSONB)
  INTO v_events
  FROM public.trust_case_events tce
  WHERE tce.case_id = (v_case->>'id')::UUID;

  -- 4. 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'case', v_case || jsonb_build_object('events', v_events)
  );
END;
$$;

COMMENT ON FUNCTION public.fn_get_trust_case_by_token(UUID)
IS '[DB-3] Query case by token (Trust Room), validates token, expiry, and revocation';

-- Step 7: 權限控管 - 授權 RPC 函數
-- WHY: 允許 anon 執行（未登入用戶也能查詢）
-- 注意: 這是唯一讓 anon 存取案件的管道
REVOKE EXECUTE ON FUNCTION public.fn_get_trust_case_by_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_get_trust_case_by_token(UUID) TO anon, authenticated, service_role;

-- Step 8: 建立 RPC 函數 - 撤銷 token
-- WHY: 允許房仲撤銷 token（消費者要求或安全考量）
CREATE OR REPLACE FUNCTION public.fn_revoke_trust_case_token(
  p_case_id UUID,
  p_agent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- 1. 撤銷 token（只有案件所屬房仲可以撤銷）
  UPDATE public.trust_cases
  SET token_revoked_at = NOW()
  WHERE id = p_case_id
    AND agent_id = p_agent_id
    AND token_revoked_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  -- 2. 檢查是否成功
  IF v_updated_count = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Case not found, not authorized, or already revoked'
    );
  END IF;

  -- 3. 返回成功結果
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Token revoked successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.fn_revoke_trust_case_token(UUID, TEXT)
IS '[DB-3] Revoke case token (agent only), prevents future token access';

-- Step 9: 權限控管 - 授權撤銷函數
-- WHY: 只有登入用戶（房仲）可以撤銷
REVOKE EXECUTE ON FUNCTION public.fn_revoke_trust_case_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_revoke_trust_case_token(UUID, TEXT) TO authenticated, service_role;

-- Step 10: 建立 RPC 函數 - 重新生成 token
-- WHY: 允許房仲重新生成 token（舊 token 外洩時使用）
CREATE OR REPLACE FUNCTION public.fn_regenerate_trust_case_token(
  p_case_id UUID,
  p_agent_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_token UUID;
  v_new_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. 生成新 token 並重置過期時間
  v_new_token := gen_random_uuid();
  v_new_expires_at := NOW() + INTERVAL '90 days';

  -- 2. 更新案件（只有案件所屬房仲可以重新生成）
  UPDATE public.trust_cases
  SET
    token = v_new_token,
    token_expires_at = v_new_expires_at,
    token_revoked_at = NULL  -- 清除撤銷狀態
  WHERE id = p_case_id
    AND agent_id = p_agent_id;

  -- 3. 檢查是否成功
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Case not found or not authorized'
    );
  END IF;

  -- 4. 返回成功結果（含新 token）
  RETURN jsonb_build_object(
    'success', true,
    'token', v_new_token,
    'token_expires_at', v_new_expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.fn_regenerate_trust_case_token(UUID, TEXT)
IS '[DB-3] Regenerate case token (agent only), invalidates old token';

-- Step 11: 權限控管 - 授權重新生成函數
-- WHY: 只有登入用戶（房仲）可以重新生成
REVOKE EXECUTE ON FUNCTION public.fn_regenerate_trust_case_token(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_regenerate_trust_case_token(UUID, TEXT) TO authenticated, service_role;

-- Step 12: 更新 fn_create_trust_case 回傳 token
-- WHY: 建立案件時需要回傳 token 給房仲，用於發送給消費者
CREATE OR REPLACE FUNCTION public.fn_create_trust_case(
  p_agent_id TEXT,
  p_buyer_name TEXT,
  p_property_title TEXT,
  p_buyer_session_id TEXT DEFAULT NULL,
  p_buyer_contact TEXT DEFAULT NULL,
  p_property_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_token UUID;
  v_token_expires_at TIMESTAMPTZ;
  v_event_hash TEXT;
BEGIN
  -- 1. 建立案件（token 和 token_expires_at 由 DEFAULT 自動生成）
  INSERT INTO public.trust_cases (
    agent_id,
    buyer_session_id,
    buyer_name,
    buyer_contact,
    property_id,
    property_title,
    current_step,
    status
  )
  VALUES (
    p_agent_id,
    p_buyer_session_id,
    p_buyer_name,
    p_buyer_contact,
    p_property_id,
    p_property_title,
    1,  -- M1 initial step
    'active'
  )
  RETURNING id, token, token_expires_at INTO v_case_id, v_token, v_token_expires_at;

  -- 2. 生成事件 hash (SHA-256)
  v_event_hash := substring(
    encode(
      sha256(
        (v_case_id::TEXT || p_agent_id || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    1, 8
  ) || '...' || substring(
    encode(
      sha256(
        (v_case_id::TEXT || p_agent_id || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    57, 4
  );

  -- 3. 建立初始事件
  INSERT INTO public.trust_case_events (
    case_id,
    step,
    step_name,
    action,
    actor,
    event_hash,
    detail
  )
  VALUES (
    v_case_id,
    1,
    'M1 接洽',
    '案件建立',
    'agent',
    v_event_hash,
    '房仲建立安心交易案件'
  );

  -- 4. 回傳結果（含 token）
  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'token', v_token,
    'token_expires_at', v_token_expires_at,
    'event_hash', v_event_hash
  );
END;
$$;

COMMENT ON FUNCTION public.fn_create_trust_case(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
IS '[DB-3] Create new trust case, auto-generates token and returns it';

-- ============================================
-- 驗證 SQL
-- ============================================
-- 1. 檢查欄位是否存在
-- SELECT token, token_expires_at, token_revoked_at FROM trust_cases LIMIT 1;
--
-- 2. 測試 token 查詢（用真實 token 替換）
-- SELECT * FROM fn_get_trust_case_by_token('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
--
-- 3. 測試撤銷 token
-- SELECT * FROM fn_revoke_trust_case_token('case-uuid', 'agent-id');
--
-- 4. 測試重新生成 token
-- SELECT * FROM fn_regenerate_trust_case_token('case-uuid', 'agent-id');
--
-- 5. 確認 anon 無法直接 SELECT（應該返回空或錯誤）
-- SET ROLE anon;
-- SELECT * FROM trust_cases; -- 應該被 RLS 擋住
-- RESET ROLE;
