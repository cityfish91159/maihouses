-- Migration: 建立房源公開統計 RPC 函數
-- Purpose: 提供瀏覽人數和安心留痕案件數給未登入消費者查詢
-- Author: Claude Code
-- Date: 2026-02-08

-- ================================================
-- fn_get_property_public_stats
-- ================================================
-- 功能：回傳特定房源的公開統計資料
-- 參數：p_property_id (TEXT) - 房源 public_id（如 MH-100001）
-- 回傳：JSONB { view_count: number, trust_cases_count: number }
-- 權限：anon, authenticated 皆可呼叫（SECURITY DEFINER 確保安全）

CREATE OR REPLACE FUNCTION public.fn_get_property_public_stats(p_property_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_view_count BIGINT;
  v_trust_cases_count BIGINT;
BEGIN
  -- 參數驗證：property_id 不可為空
  IF p_property_id IS NULL OR p_property_id = '' THEN
    RAISE EXCEPTION 'property_id cannot be null or empty';
  END IF;

  -- 瀏覽人數：uag_events 的 unique session 數
  SELECT COUNT(DISTINCT e.session_id)
  INTO v_view_count
  FROM public.uag_events e
  WHERE e.property_id = p_property_id;

  -- 也計入 archive 表（如果存在）
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'uag_events_archive'
  ) THEN
    SELECT v_view_count + COUNT(DISTINCT ea.session_id)
    INTO v_view_count
    FROM public.uag_events_archive ea
    WHERE ea.property_id = p_property_id;
  END IF;

  -- 安心留痕案件數：trust_cases 中 active + completed
  -- 只計算已啟動的案件（不含 pending、cancelled）
  SELECT COUNT(*)
  INTO v_trust_cases_count
  FROM public.trust_cases tc
  WHERE tc.property_id = p_property_id
    AND tc.status IN ('active', 'completed');

  -- 回傳 JSON 物件
  RETURN jsonb_build_object(
    'view_count', COALESCE(v_view_count, 0),
    'trust_cases_count', COALESCE(v_trust_cases_count, 0)
  );
END;
$$;

-- ================================================
-- 權限設定
-- ================================================
-- 授權：未登入消費者（anon）+ 已登入用戶（authenticated）+ service_role
-- 說明：只回傳統計數字，不洩漏用戶個資，可安全公開

GRANT EXECUTE ON FUNCTION public.fn_get_property_public_stats(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.fn_get_property_public_stats(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_property_public_stats(TEXT) TO service_role;

-- ================================================
-- 測試查詢（註解掉，僅供參考）
-- ================================================
-- SELECT public.fn_get_property_public_stats('MH-100001');
-- 預期回傳：{"view_count": 0, "trust_cases_count": 0}（初期無數據）
