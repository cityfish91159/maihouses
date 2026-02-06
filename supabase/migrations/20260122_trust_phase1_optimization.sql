-- =============================================================================
-- Trust Flow Phase 1 優化 - 索引與約束強化
-- Migration: 20260122_trust_phase1_optimization.sql
-- =============================================================================
--
-- 優化項目:
--   DB-1: trust_enabled 部分索引
--   DB-2: status ENUM 化 + active 狀態一致性 CHECK
--   DB-3: token 過期清理索引
--   DB-4: LINE ID 格式 CHECK + 複合索引
--
-- =============================================================================

-- ============================================================================
-- DB-1: trust_enabled 部分索引
-- ============================================================================
-- WHY: 常用查詢 WHERE trust_enabled = true 可大幅加速
-- WHEN: 消費者瀏覽有開啟信任驗證的物件列表
CREATE INDEX IF NOT EXISTS idx_properties_trust_enabled
ON public.properties (id)
WHERE trust_enabled = true;

COMMENT ON INDEX idx_properties_trust_enabled
IS 'DB-1 優化: 快速查詢已開啟信任驗證的物件';

-- ============================================================================
-- DB-2: status ENUM 化
-- ============================================================================
-- WHY: ENUM 比 CHECK 更易維護，新增狀態只需 ALTER TYPE
-- NOTE: 先建立 ENUM，再遷移欄位

-- Step 1: 建立 ENUM 類型（如果不存在）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trust_case_status') THEN
    CREATE TYPE trust_case_status AS ENUM (
      'active',                    -- 進行中
      'dormant',                   -- 休眠（30 天無互動）
      'completed',                 -- 成交
      'closed_sold_to_other',      -- 他人成交
      'closed_property_unlisted',  -- 物件下架
      'closed_inactive',           -- 過期關閉
      'pending',                   -- 待處理（向後相容）
      'cancelled',                 -- 已取消（向後相容）
      'expired'                    -- 已過期（向後相容）
    );
  END IF;
END;
$$;

COMMENT ON TYPE trust_case_status
IS 'DB-2 優化: 案件狀態 ENUM，比 CHECK 更易維護';

-- Step 2: 新增 status_enum 欄位並複製資料
-- NOTE: PostgreSQL 無法直接 ALTER COLUMN TYPE 到 ENUM（如果有 CHECK）
--       所以採用新增欄位 → 複製資料 → 刪除舊欄位 → 重命名的策略
ALTER TABLE public.trust_cases
ADD COLUMN IF NOT EXISTS status_enum trust_case_status;

-- Step 3: 複製現有資料到 status_enum
UPDATE public.trust_cases
SET status_enum = status::trust_case_status
WHERE status_enum IS NULL;

-- Step 4: 設定預設值和 NOT NULL（需要先確保所有資料都有值）
-- NOTE: 如果表中已有資料，需要先更新再設定 NOT NULL
ALTER TABLE public.trust_cases
ALTER COLUMN status_enum SET DEFAULT 'active'::trust_case_status;

-- ============================================================================
-- DB-2: active 狀態一致性 CHECK
-- ============================================================================
-- WHY: 防止 status = 'active' 但 closed_at 有值的不一致狀態
-- LOGIC: 如果 status_enum = 'active'，則 closed_at 必須是 NULL
ALTER TABLE public.trust_cases
DROP CONSTRAINT IF EXISTS trust_cases_active_not_closed;

ALTER TABLE public.trust_cases
ADD CONSTRAINT trust_cases_active_not_closed
CHECK (
  status_enum != 'active' OR closed_at IS NULL
);

COMMENT ON CONSTRAINT trust_cases_active_not_closed ON public.trust_cases
IS 'DB-2 優化: active 狀態的案件不能有 closed_at 時間戳';

-- ============================================================================
-- DB-3: token 過期清理索引
-- ============================================================================
-- WHY: Cron Job 定期清理過期 token 時需要快速定位
-- WHEN: 每日清理任務查詢 WHERE token_expires_at < NOW() AND token_revoked_at IS NULL
CREATE INDEX IF NOT EXISTS idx_trust_cases_token_cleanup
ON public.trust_cases (token_expires_at)
WHERE token_revoked_at IS NULL;

COMMENT ON INDEX idx_trust_cases_token_cleanup
IS 'DB-3 優化: 加速 token 過期清理任務';

-- ============================================================================
-- DB-4: LINE ID 格式 CHECK
-- ============================================================================
-- WHY: LINE User ID 格式為 U 開頭 + 32 位 hex，防止髒資料
-- FORMAT: ^U[0-9a-f]{32}$ (總長度 33 字元)
ALTER TABLE public.trust_cases
DROP CONSTRAINT IF EXISTS trust_cases_buyer_line_id_format;

ALTER TABLE public.trust_cases
ADD CONSTRAINT trust_cases_buyer_line_id_format
CHECK (
  buyer_line_id IS NULL
  OR buyer_line_id ~ '^U[0-9a-f]{32}$'
);

COMMENT ON CONSTRAINT trust_cases_buyer_line_id_format ON public.trust_cases
IS 'DB-4 優化: LINE User ID 格式驗證（U + 32 hex）';

-- ============================================================================
-- DB-4: 複合索引 status + buyer_user_id
-- ============================================================================
-- WHY: 常用查詢「某用戶的進行中案件」
-- WHEN: BE-6 消費者案件列表
CREATE INDEX IF NOT EXISTS idx_trust_cases_status_buyer_user
ON public.trust_cases (status_enum, buyer_user_id)
WHERE buyer_user_id IS NOT NULL;

COMMENT ON INDEX idx_trust_cases_status_buyer_user
IS 'DB-4 優化: 加速消費者案件列表查詢';

-- ============================================================================
-- DB-4: 複合索引 status + buyer_line_id
-- ============================================================================
-- WHY: 常用查詢「某 LINE 用戶的進行中案件」
-- WHEN: BE-3 LINE Bot 查詢交易
CREATE INDEX IF NOT EXISTS idx_trust_cases_status_buyer_line
ON public.trust_cases (status_enum, buyer_line_id)
WHERE buyer_line_id IS NOT NULL;

COMMENT ON INDEX idx_trust_cases_status_buyer_line
IS 'DB-4 優化: 加速 LINE 用戶案件查詢';

-- ============================================================================
-- 驗證 SQL
-- ============================================================================
-- 1. 檢查索引
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'trust_cases';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'properties';
--
-- 2. 檢查 ENUM
-- SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE typname = 'trust_case_status';
--
-- 3. 檢查約束
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'public.trust_cases'::regclass;
-- =============================================================================
