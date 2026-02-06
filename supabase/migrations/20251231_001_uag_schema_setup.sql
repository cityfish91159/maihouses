-- ==============================================================================
-- UAG Schema Setup: Tables, Indexes, Audit Trail
-- 執行順序: 1/2 (先於 RPC 函數)
-- ==============================================================================

-- 1. Credit System: agents 表擴充
ALTER TABLE public.agents
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS quota_s INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_a INTEGER DEFAULT 0;

COMMENT ON COLUMN public.agents.points IS '房仲點數餘額';
COMMENT ON COLUMN public.agents.quota_s IS 'S 級客戶配額';
COMMENT ON COLUMN public.agents.quota_a IS 'A 級客戶配額';

-- 2. 購買紀錄表
CREATE TABLE IF NOT EXISTS public.uag_lead_purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    grade CHAR(1) NOT NULL,
    cost INTEGER NOT NULL,
    used_quota BOOLEAN DEFAULT false,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (agent_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_purchase_agent ON public.uag_lead_purchases(agent_id);
CREATE INDEX IF NOT EXISTS idx_purchase_session ON public.uag_lead_purchases(session_id);

-- 3. 審計日誌表 (追蹤所有 RPC 呼叫)
CREATE TABLE IF NOT EXISTS public.uag_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,              -- 'purchase_lead', 'get_stats'
    agent_id TEXT NOT NULL,
    session_id TEXT,
    request JSONB,                     -- 請求參數
    response JSONB,                    -- 回應結果
    success BOOLEAN NOT NULL,
    error_code TEXT,                   -- 'INSUFFICIENT_BALANCE', 'ALREADY_PURCHASED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_agent ON public.uag_audit_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.uag_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_success ON public.uag_audit_logs(success);

-- 4. Leads 表 UPSERT 索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_upsert_target
ON public.leads(property_id, customer_phone);
