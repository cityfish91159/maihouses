-- ==============================================================================
-- 修復 community_reviews View
-- 日期: 2025-12-05
-- 問題: API 需要 property_id, advantage_1, advantage_2, disadvantage 等欄位
--       但舊版 View 只有 content JSON，導致查詢失敗
-- ==============================================================================

-- 刪除舊的 View（無論是 Table 還是 View）
DROP TABLE IF EXISTS community_reviews CASCADE;
DROP VIEW IF EXISTS community_reviews CASCADE;

-- 建立新的 View，提供 API 需要的欄位
CREATE VIEW community_reviews AS
SELECT
  p.id AS id,                                                    -- 評價主鍵（等於房源 ID）
  p.community_id,                                                -- 社區 ID
  p.id AS property_id,                                           -- 關聯房源 ID
  COALESCE(NULLIF(p.source_platform, ''), 'agent') AS source,    -- 來源（agent/resident）
  NULLIF(p.advantage_1, '') AS advantage_1,                      -- 優點 1
  NULLIF(p.advantage_2, '') AS advantage_2,                      -- 優點 2
  NULLIF(p.disadvantage, '') AS disadvantage,                    -- 缺點
  p.created_at                                                   -- 建立時間
FROM properties p
WHERE p.community_id IS NOT NULL
  AND (
    p.advantage_1 IS NOT NULL
    OR p.advantage_2 IS NOT NULL
    OR p.disadvantage IS NOT NULL
  );

-- 設定 View 權限
ALTER VIEW community_reviews OWNER TO postgres;

-- 驗證
SELECT 'community_reviews View 建立完成' AS status;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'community_reviews';
