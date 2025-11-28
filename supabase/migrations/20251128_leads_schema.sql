-- ==============================================================================
-- Leads & Lead Events Schema - 房仲行為流程 v1.0
-- 用於追蹤客戶諮詢、房仲回覆、看屋、斡旋等完整流程
-- ==============================================================================

-- ⚠️ 清理舊物件（如果存在）
DROP VIEW IF EXISTS public.agent_lead_stats CASCADE;
DROP TRIGGER IF EXISTS lead_events_first_contact ON public.lead_events;
DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
DROP FUNCTION IF EXISTS update_first_contacted_at() CASCADE;
DROP FUNCTION IF EXISTS update_leads_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_lead_overview(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_agent_lead_overview(UUID) CASCADE;
DROP TABLE IF EXISTS public.lead_events CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;

-- 1. Leads 表 (客戶諮詢)
CREATE TABLE public.leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 關聯
    property_id TEXT NOT NULL,                    -- 對應 properties.public_id
    agent_id TEXT,                                -- 經紀人 ID (字串，不強制外鍵)
    
    -- 客戶資訊
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    
    -- 偏好設定
    preferred_channel TEXT CHECK (preferred_channel IN ('phone', 'line', 'message')),
    preferred_time TEXT,
    budget TEXT,
    needs TEXT,
    
    -- 狀態追蹤
    status TEXT DEFAULT 'new' CHECK (status IN (
        'new',              -- 新諮詢
        'contacted',        -- 已聯繫
        'visit_scheduled',  -- 已約看屋
        'visited',          -- 已看屋
        'negotiating',      -- 議價中
        'closed_won',       -- 成交
        'closed_lost',      -- 未成交
        'inactive'          -- 不活躍
    )),
    
    -- 來源追蹤
    source TEXT,                                  -- 'sidebar', 'mobile_bar', 'booking'
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    
    -- 時間戳
    first_contacted_at TIMESTAMPTZ,               -- 經紀人首次回覆時間
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_leads_agent ON public.leads(agent_id);
CREATE INDEX idx_leads_property ON public.leads(property_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 暫時允許所有認證用戶查看 leads（後續加入 agents.user_id 後可收緊）
CREATE POLICY "Authenticated users view leads" ON public.leads
    FOR SELECT USING (auth.role() = 'authenticated');

-- 任何人都可以建立 lead（匿名詢問）
CREATE POLICY "Anyone can create leads" ON public.leads
    FOR INSERT WITH CHECK (true);

-- 認證用戶可以更新 leads
CREATE POLICY "Authenticated users update leads" ON public.leads
    FOR UPDATE USING (auth.role() = 'authenticated');

-- ==============================================================================
-- 2. Lead Events 表 (行為事件)
-- ==============================================================================
CREATE TABLE public.lead_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    
    -- 事件類型
    event_type TEXT NOT NULL CHECK (event_type IN (
        'INITIAL_CONTACT',      -- 首次諮詢
        'AGENT_RESPONSE',       -- 經紀人回覆
        'CALL_SUMMARY',         -- 通話摘要
        'VISIT_SCHEDULED',      -- 預約看屋
        'VISIT_COMPLETE',       -- 看屋完成
        'VISIT_FEEDBACK',       -- 看屋回饋
        'OFFER_SUBMITTED',      -- 出價
        'OFFER_COUNTERED',      -- 還價
        'OFFER_ACCEPTED',       -- 成交
        'PROMISE_MADE',         -- 承諾紀錄
        'PROMISE_FULFILLED',    -- 承諾完成
        'NOTE_ADDED',           -- 備註
        'STATUS_CHANGED'        -- 狀態變更
    )),
    
    -- 通路
    channel TEXT,                                 -- 'phone', 'line', 'message', 'in_person'
    
    -- 事件內容
    payload JSONB DEFAULT '{}',
    /*
      payload 範例:
      - CALL_SUMMARY: { duration: 300, keyConcerns: ['學區', '交通'], nextStep: '約看屋' }
      - VISIT_COMPLETE: { satisfaction: 8, pros: ['採光好'], cons: ['停車不便'], agentChecklist: {...} }
      - OFFER_SUBMITTED: { price: 2500, conditions: ['含家具', '12月交屋'] }
      - PROMISE_MADE: { content: '幫忙查產權狀態', dueDate: '2024-12-01' }
    */
    
    -- 執行者
    performed_by TEXT,                               -- 執行者 ID (字串)
    performed_by_role TEXT DEFAULT 'agent',          -- 'agent', 'customer', 'system'
    
    -- 時間
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_lead_events_lead ON public.lead_events(lead_id);
CREATE INDEX idx_lead_events_type ON public.lead_events(event_type);
CREATE INDEX idx_lead_events_created ON public.lead_events(created_at DESC);

-- RLS
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- 認證用戶可以查看 lead_events
CREATE POLICY "Authenticated users view lead events" ON public.lead_events
    FOR SELECT USING (auth.role() = 'authenticated');

-- 任何人可以新增事件（含匿名客戶回饋）
CREATE POLICY "Anyone can insert lead events" ON public.lead_events
    FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- 3. 經紀人統計 View
-- ==============================================================================
CREATE OR REPLACE VIEW public.agent_lead_stats AS
SELECT 
    agent_id,
    COUNT(*) FILTER (WHERE status = 'new') as new_leads,
    COUNT(*) FILTER (WHERE status = 'contacted') as contacted_leads,
    COUNT(*) FILTER (WHERE status IN ('visit_scheduled', 'visited')) as active_leads,
    COUNT(*) FILTER (WHERE status = 'closed_won') as won_leads,
    COUNT(*) as total_leads,
    
    -- 平均首次回覆時間（分鐘）
    AVG(
        EXTRACT(EPOCH FROM (first_contacted_at - created_at)) / 60
    ) FILTER (WHERE first_contacted_at IS NOT NULL) as avg_response_minutes,
    
    -- 今日新 leads
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE AND status = 'new') as today_new,
    
    -- 待回覆（超過 10 分鐘未回）
    COUNT(*) FILTER (
        WHERE status = 'new' 
        AND first_contacted_at IS NULL 
        AND created_at < NOW() - INTERVAL '10 minutes'
    ) as overdue_leads

FROM public.leads
GROUP BY agent_id;

-- ==============================================================================
-- 4. 自動更新 updated_at
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
    BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_leads_updated_at();

-- ==============================================================================
-- 5. 經紀人首次回覆時自動記錄時間
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_first_contacted_at()
RETURNS TRIGGER AS $$
BEGIN
    -- 當新增 AGENT_RESPONSE 事件時，更新 lead 的 first_contacted_at
    IF NEW.event_type = 'AGENT_RESPONSE' THEN
        UPDATE public.leads
        SET 
            first_contacted_at = COALESCE(first_contacted_at, NOW()),
            status = CASE WHEN status = 'new' THEN 'contacted' ELSE status END
        WHERE id = NEW.lead_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS lead_events_first_contact ON public.lead_events;
CREATE TRIGGER lead_events_first_contact
    AFTER INSERT ON public.lead_events
    FOR EACH ROW EXECUTE FUNCTION update_first_contacted_at();

-- ==============================================================================
-- 6. RPC 函數：獲取經紀人的 Lead 統計
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_agent_lead_overview(p_agent_id TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'today_new', COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE),
        'pending_response', COUNT(*) FILTER (WHERE status = 'new' AND first_contacted_at IS NULL),
        'overdue', COUNT(*) FILTER (
            WHERE status = 'new' 
            AND first_contacted_at IS NULL 
            AND created_at < NOW() - INTERVAL '10 minutes'
        ),
        'avg_response_minutes', ROUND(
            AVG(EXTRACT(EPOCH FROM (first_contacted_at - created_at)) / 60) 
            FILTER (WHERE first_contacted_at IS NOT NULL)
        ),
        'total_active', COUNT(*) FILTER (WHERE status NOT IN ('closed_won', 'closed_lost', 'inactive'))
    ) INTO result
    FROM public.leads
    WHERE agent_id = p_agent_id;
    
    RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_agent_lead_overview(TEXT) TO authenticated;
