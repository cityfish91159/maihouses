-- =============================================================================
-- Trust Cases Schema - 安心流程管理資料表
-- Migration: 20260119_trust_cases_schema.sql
--
-- 目標: 建立安心交易案件管理所需的資料表與 RPC 函數
-- 依賴: users 表、transactions 表
-- =============================================================================

-- ============================================================================
-- 1. trust_cases 表 - 安心交易案件主表
-- 設計決策: 與 transactions 分離，專門管理案件列表與元資料
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trust_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 房仲資訊
  agent_id TEXT NOT NULL,                    -- 房仲 ID (關聯 users.id)

  -- 買方資訊
  buyer_session_id TEXT,                     -- UAG session_id (可選，關聯已購買客戶)
  buyer_name TEXT NOT NULL,                  -- 買方名稱 (顯示用)
  buyer_contact TEXT,                        -- 買方聯絡方式 (可選)

  -- 物件資訊
  property_id TEXT,                          -- 物件 public_id (關聯 properties)
  property_title TEXT NOT NULL,              -- 物件標題 (顯示用)

  -- 交易資訊
  transaction_id TEXT,                       -- 關聯 transactions.id (Trust Room 詳細狀態)
  current_step INTEGER NOT NULL DEFAULT 1    -- 當前步驟 (1-6)
    CHECK (current_step BETWEEN 1 AND 6),
  status TEXT NOT NULL DEFAULT 'active'      -- 案件狀態
    CHECK (status IN ('active', 'pending', 'completed', 'cancelled', 'expired')),
  offer_price BIGINT,                        -- 出價金額 (可選，步驟 3 以後)

  -- 時間戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- 約束
  CONSTRAINT trust_cases_valid_step CHECK (current_step >= 1 AND current_step <= 6)
);

-- 索引: 房仲查詢自己的案件
CREATE INDEX IF NOT EXISTS idx_trust_cases_agent_id
ON public.trust_cases (agent_id);

-- 索引: 按狀態過濾
CREATE INDEX IF NOT EXISTS idx_trust_cases_status
ON public.trust_cases (status);

-- 索引: 按更新時間排序
CREATE INDEX IF NOT EXISTS idx_trust_cases_updated_at
ON public.trust_cases (updated_at DESC);

-- 索引: 買方 session 查詢 (用於 UAG 整合)
CREATE INDEX IF NOT EXISTS idx_trust_cases_buyer_session
ON public.trust_cases (buyer_session_id)
WHERE buyer_session_id IS NOT NULL;

-- 索引: 複合索引 - 房仲 + 狀態 + 更新時間
CREATE INDEX IF NOT EXISTS idx_trust_cases_agent_status_updated
ON public.trust_cases (agent_id, status, updated_at DESC);

COMMENT ON TABLE public.trust_cases
IS '安心交易案件主表，管理房仲的所有交易案件';

COMMENT ON COLUMN public.trust_cases.agent_id
IS '房仲 ID，對應 users.id';

COMMENT ON COLUMN public.trust_cases.buyer_session_id
IS 'UAG session_id，可選，用於關聯已購買的客戶';

COMMENT ON COLUMN public.trust_cases.transaction_id
IS '關聯 transactions 表，存儲詳細的步驟狀態';

COMMENT ON COLUMN public.trust_cases.current_step
IS '當前交易步驟: 1=已電聯, 2=已帶看, 3=已出價, 4=已斡旋, 5=已成交, 6=已交屋';

COMMENT ON COLUMN public.trust_cases.status
IS '案件狀態: active=進行中, pending=待處理, completed=已完成, cancelled=已取消, expired=已過期';

-- ============================================================================
-- 2. trust_case_events 表 - 交易留痕事件日誌
-- 設計決策: 獨立表記錄所有交易事件，支援審計追蹤
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.trust_case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.trust_cases(id) ON DELETE CASCADE,

  -- 事件資訊
  step INTEGER NOT NULL                      -- 步驟編號 (1-6)
    CHECK (step BETWEEN 1 AND 6),
  step_name TEXT NOT NULL,                   -- 步驟名稱 (M1 接洽, M2 帶看, ...)
  action TEXT NOT NULL,                      -- 行動描述
  actor TEXT NOT NULL                        -- 執行者
    CHECK (actor IN ('agent', 'buyer', 'system')),

  -- 留痕資訊
  event_hash TEXT,                           -- 事件 hash (SHA-256 模擬)
  detail TEXT,                               -- 詳細說明 (可選)
  metadata JSONB DEFAULT '{}',               -- 額外元資料 (可選)

  -- 時間戳
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引: 案件 ID 查詢
CREATE INDEX IF NOT EXISTS idx_trust_case_events_case_id
ON public.trust_case_events (case_id);

-- 索引: 按時間排序
CREATE INDEX IF NOT EXISTS idx_trust_case_events_created_at
ON public.trust_case_events (created_at DESC);

-- 索引: 複合索引 - 案件 + 時間
CREATE INDEX IF NOT EXISTS idx_trust_case_events_case_created
ON public.trust_case_events (case_id, created_at DESC);

COMMENT ON TABLE public.trust_case_events
IS '交易留痕事件日誌，記錄每個案件的所有操作';

COMMENT ON COLUMN public.trust_case_events.event_hash
IS '事件 hash，使用 SHA-256 生成，用於可驗證的交易留痕';

COMMENT ON COLUMN public.trust_case_events.actor
IS '執行者: agent=房仲, buyer=買方, system=系統';

-- ============================================================================
-- 3. RLS 政策 - 保護案件資料
-- ============================================================================

-- 3.1 trust_cases: 房仲只能看自己的案件
ALTER TABLE public.trust_cases ENABLE ROW LEVEL SECURITY;

-- 移除舊政策（如果存在）
DROP POLICY IF EXISTS "trust_cases_agent_select" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_agent_insert" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_agent_update" ON public.trust_cases;
DROP POLICY IF EXISTS "trust_cases_service_role" ON public.trust_cases;

-- SELECT: 房仲只能查詢自己的案件
CREATE POLICY "trust_cases_agent_select"
ON public.trust_cases
FOR SELECT
TO authenticated
USING (agent_id = auth.uid()::TEXT);

-- INSERT: 房仲只能建立自己的案件
CREATE POLICY "trust_cases_agent_insert"
ON public.trust_cases
FOR INSERT
TO authenticated
WITH CHECK (agent_id = auth.uid()::TEXT);

-- UPDATE: 房仲只能更新自己的案件
CREATE POLICY "trust_cases_agent_update"
ON public.trust_cases
FOR UPDATE
TO authenticated
USING (agent_id = auth.uid()::TEXT)
WITH CHECK (agent_id = auth.uid()::TEXT);

-- Service Role: 完整存取權限
CREATE POLICY "trust_cases_service_role"
ON public.trust_cases
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3.2 trust_case_events: 同樣限制
ALTER TABLE public.trust_case_events ENABLE ROW LEVEL SECURITY;

-- 移除舊政策
DROP POLICY IF EXISTS "trust_case_events_select" ON public.trust_case_events;
DROP POLICY IF EXISTS "trust_case_events_insert" ON public.trust_case_events;
DROP POLICY IF EXISTS "trust_case_events_service_role" ON public.trust_case_events;

-- SELECT: 只能查詢自己案件的事件
CREATE POLICY "trust_case_events_select"
ON public.trust_case_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.trust_cases tc
    WHERE tc.id = case_id
    AND tc.agent_id = auth.uid()::TEXT
  )
);

-- INSERT: 只能為自己的案件新增事件
CREATE POLICY "trust_case_events_insert"
ON public.trust_case_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trust_cases tc
    WHERE tc.id = case_id
    AND tc.agent_id = auth.uid()::TEXT
  )
);

-- Service Role: 完整存取權限
CREATE POLICY "trust_case_events_service_role"
ON public.trust_case_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 4. RPC 函數 - 取得房仲案件列表 (含 total count)
-- [backend_safeguard] 修正：返回 JSONB 包含 cases 和 total
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_trust_cases(
  p_agent_id TEXT,
  p_status TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cases JSONB;
  v_total BIGINT;
BEGIN
  -- [backend_safeguard] 先計算總數（不含分頁限制）
  SELECT COUNT(*)
  INTO v_total
  FROM public.trust_cases tc
  WHERE tc.agent_id = p_agent_id
    AND (p_status IS NULL OR tc.status = p_status);

  -- 取得案件列表（含分頁）
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tc.id,
      'buyer_session_id', tc.buyer_session_id,
      'buyer_name', tc.buyer_name,
      'property_id', tc.property_id,
      'property_title', tc.property_title,
      'transaction_id', tc.transaction_id,
      'current_step', tc.current_step,
      'status', tc.status,
      'offer_price', tc.offer_price,
      'created_at', tc.created_at,
      'updated_at', tc.updated_at,
      'events_count', COALESCE(ev.events_count, 0),
      'latest_event_at', ev.latest_event_at
    )
    ORDER BY tc.updated_at DESC
  ), '[]'::JSONB)
  INTO v_cases
  FROM public.trust_cases tc
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) AS events_count,
      MAX(tce.created_at) AS latest_event_at
    FROM public.trust_case_events tce
    WHERE tce.case_id = tc.id
  ) ev ON true
  WHERE tc.agent_id = p_agent_id
    AND (p_status IS NULL OR tc.status = p_status)
  ORDER BY tc.updated_at DESC
  LIMIT p_limit
  OFFSET p_offset;

  -- [backend_safeguard] 返回包含 total 的結構
  RETURN jsonb_build_object(
    'cases', v_cases,
    'total', v_total,
    'limit', p_limit,
    'offset', p_offset
  );
END;
$$;

COMMENT ON FUNCTION public.fn_get_trust_cases(TEXT, TEXT, INTEGER, INTEGER)
IS '[backend_safeguard] 取得房仲的安心交易案件列表，返回 JSONB 包含 cases 和 total';

-- ============================================================================
-- 5. RPC 函數 - 取得案件詳情（含事件列表）
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_get_trust_case_detail(
  p_case_id UUID,
  p_agent_id TEXT
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
  -- 驗證案件歸屬
  SELECT jsonb_build_object(
    'id', tc.id,
    'buyer_session_id', tc.buyer_session_id,
    'buyer_name', tc.buyer_name,
    'buyer_contact', tc.buyer_contact,
    'property_id', tc.property_id,
    'property_title', tc.property_title,
    'transaction_id', tc.transaction_id,
    'current_step', tc.current_step,
    'status', tc.status,
    'offer_price', tc.offer_price,
    'created_at', tc.created_at,
    'updated_at', tc.updated_at
  )
  INTO v_case
  FROM public.trust_cases tc
  WHERE tc.id = p_case_id
    AND tc.agent_id = p_agent_id;

  IF v_case IS NULL THEN
    RETURN jsonb_build_object('error', 'Case not found or access denied');
  END IF;

  -- 取得事件列表
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', tce.id,
      'step', tce.step,
      'step_name', tce.step_name,
      'action', tce.action,
      'actor', tce.actor,
      'event_hash', tce.event_hash,
      'detail', tce.detail,
      'created_at', tce.created_at
    )
    ORDER BY tce.created_at DESC
  ), '[]'::JSONB)
  INTO v_events
  FROM public.trust_case_events tce
  WHERE tce.case_id = p_case_id;

  RETURN v_case || jsonb_build_object('events', v_events);
END;
$$;

COMMENT ON FUNCTION public.fn_get_trust_case_detail(UUID, TEXT)
IS '取得安心交易案件詳情，包含所有事件列表';

-- ============================================================================
-- 6. RPC 函數 - 建立新案件
-- ============================================================================
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
  v_event_hash TEXT;
BEGIN
  -- 1. 建立案件
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
    1,  -- 初始步驟: M1 接洽
    'active'
  )
  RETURNING id INTO v_case_id;

  -- 2. 生成事件 hash (SHA-256 模擬)
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

  RETURN jsonb_build_object(
    'success', true,
    'case_id', v_case_id,
    'event_hash', v_event_hash
  );
END;
$$;

COMMENT ON FUNCTION public.fn_create_trust_case(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT)
IS '建立新的安心交易案件，自動建立初始事件';

-- ============================================================================
-- 7. RPC 函數 - 更新案件狀態/步驟
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_trust_case_step(
  p_case_id UUID,
  p_agent_id TEXT,
  p_new_step INTEGER,
  p_action TEXT,
  p_actor TEXT DEFAULT 'agent',
  p_detail TEXT DEFAULT NULL,
  p_offer_price BIGINT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_step INTEGER;
  v_event_hash TEXT;
  v_step_names TEXT[] := ARRAY[
    'M1 接洽', 'M2 帶看', 'M3 出價', 'M4 斡旋', 'M5 成交', 'M6 交屋'
  ];
BEGIN
  -- 1. 驗證案件歸屬並取得當前步驟
  SELECT tc.current_step INTO v_current_step
  FROM public.trust_cases tc
  WHERE tc.id = p_case_id
    AND tc.agent_id = p_agent_id;

  IF v_current_step IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Case not found or access denied');
  END IF;

  -- 2. 驗證步驟變更合法性（只能前進，不能跳躍超過 1 步）
  IF p_new_step < v_current_step THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot go back to previous step');
  END IF;

  IF p_new_step > v_current_step + 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot skip steps');
  END IF;

  IF p_new_step > 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid step number');
  END IF;

  -- 3. 生成事件 hash
  v_event_hash := substring(
    encode(
      sha256(
        (p_case_id::TEXT || p_agent_id || p_action || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    1, 8
  ) || '...' || substring(
    encode(
      sha256(
        (p_case_id::TEXT || p_agent_id || p_action || NOW()::TEXT)::BYTEA
      ),
      'hex'
    ),
    57, 4
  );

  -- 4. 更新案件
  UPDATE public.trust_cases
  SET
    current_step = p_new_step,
    offer_price = COALESCE(p_offer_price, offer_price),
    status = CASE
      WHEN p_new_step = 6 THEN 'completed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_case_id
    AND agent_id = p_agent_id;

  -- 5. 記錄事件
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
    p_case_id,
    p_new_step,
    v_step_names[p_new_step],
    p_action,
    p_actor,
    v_event_hash,
    p_detail
  );

  RETURN jsonb_build_object(
    'success', true,
    'case_id', p_case_id,
    'new_step', p_new_step,
    'event_hash', v_event_hash
  );
END;
$$;

COMMENT ON FUNCTION public.fn_update_trust_case_step(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BIGINT)
IS '更新案件步驟，自動驗證步驟合法性並記錄事件';

-- ============================================================================
-- 8. Trigger - 自動更新 updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_update_trust_cases_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_trust_cases_updated_at ON public.trust_cases;

CREATE TRIGGER trg_trust_cases_updated_at
BEFORE UPDATE ON public.trust_cases
FOR EACH ROW
EXECUTE FUNCTION public.fn_update_trust_cases_updated_at();

-- ============================================================================
-- 9. 權限控管 - 授權 RPC 函數
-- ============================================================================

-- 撤銷 PUBLIC 執行權限
REVOKE EXECUTE ON FUNCTION public.fn_get_trust_cases(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_get_trust_case_detail(UUID, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_create_trust_case(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fn_update_trust_case_step(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BIGINT) FROM PUBLIC;

-- 授權 service_role 和 authenticated 執行
GRANT EXECUTE ON FUNCTION public.fn_get_trust_cases(TEXT, TEXT, INTEGER, INTEGER) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_trust_case_detail(UUID, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_create_trust_case(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_update_trust_case_step(UUID, TEXT, INTEGER, TEXT, TEXT, TEXT, BIGINT) TO service_role, authenticated;

-- ============================================================================
-- 完成
-- ============================================================================
