-- Migration: 啟用 MH-100001 Demo 物件的安心留痕功能
-- Date: 2026-01-26
-- Purpose: FE-2 完成後，需在生產環境顯示安心留痕徽章
-- Impact: 僅影響 MH-100001 Demo 物件

-- 將 MH-100001 的 trust_enabled 設為 true
UPDATE properties
SET trust_enabled = true
WHERE public_id = 'MH-100001';

-- 驗證更新結果
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM properties
  WHERE public_id = 'MH-100001' AND trust_enabled = true;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'MH-100001 trust_enabled 更新失敗';
  END IF;

  RAISE NOTICE 'MH-100001 trust_enabled 已成功設為 true';
END $$;
