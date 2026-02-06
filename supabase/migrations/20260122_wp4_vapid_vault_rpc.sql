-- =============================================================================
-- WP-4 | 從 Supabase Vault 讀取 VAPID_PRIVATE_KEY
-- Migration: 20260122_wp4_vapid_vault_rpc.sql
-- =============================================================================
--
-- WHY: 後端發送 Web Push 需要 VAPID_PRIVATE_KEY 簽名
--      金鑰已存在 Supabase Vault，需要 RPC 讓後端讀取
--
-- 前提：用戶已在 Supabase Dashboard > Project Settings > Vault
--       手動建立 secret，名稱為 'VAPID_PRIVATE_KEY'
--
-- =============================================================================

-- ============================================================================
-- 1. RPC 函數：取得 VAPID_PRIVATE_KEY
-- ============================================================================
--
-- 只允許 service_role 呼叫（後端 API 用）
-- 普通用戶無法讀取
--
CREATE OR REPLACE FUNCTION fn_get_vapid_private_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- 只允許 service_role
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'permission denied: only service_role can access VAPID key';
  END IF;

  -- 從 Vault 讀取解密後的 secret
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'VAPID_PRIVATE_KEY'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'VAPID_PRIVATE_KEY not found in Vault';
  END IF;

  RETURN v_key;
END;
$$;

-- ============================================================================
-- 2. 授權
-- ============================================================================
-- 只授權 service_role，不授權 anon/authenticated
REVOKE ALL ON FUNCTION fn_get_vapid_private_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION fn_get_vapid_private_key() FROM anon;
REVOKE ALL ON FUNCTION fn_get_vapid_private_key() FROM authenticated;
GRANT EXECUTE ON FUNCTION fn_get_vapid_private_key() TO service_role;

-- ============================================================================
-- 完成
-- ============================================================================
--
-- 使用方式（後端）：
-- const { data: privateKey } = await supabase.rpc('fn_get_vapid_private_key');
--
-- 注意：
-- 1. 必須使用 service_role key 的 supabase client
-- 2. 公鑰不需要存 Vault，直接用 Vercel 環境變數 VITE_VAPID_PUBLIC_KEY
-- =============================================================================
