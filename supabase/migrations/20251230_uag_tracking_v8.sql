-- ==============================================================================
-- UAG v8.0 Ultimate Optimization Schema
-- Implements: Normalized Events, Session Summary, Materialized Views, Archiving
-- ==============================================================================

-- ══════════════════════════════════════════════════════════════════════════════
-- 1. UAG Sessions (會話摘要表 - 熱數據)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.uag_sessions CASCADE;
CREATE TABLE public.uag_sessions (
    session_id TEXT PRIMARY KEY,
    agent_id TEXT,
    total_duration INTEGER DEFAULT 0,        -- 總停留秒數
    property_count INTEGER DEFAULT 0,        -- 瀏覽物件數
    grade CHAR(1) DEFAULT 'F',               -- 客戶等級 S/A/B/C/F
    last_active TIMESTAMPTZ DEFAULT NOW(),
    summary JSONB DEFAULT '{}'::jsonb,       -- 聚合統計 (district_counts, strong_signals)
    fingerprint TEXT,                        -- 指紋 (跨設備識別)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_grade_time ON public.uag_sessions (grade, last_active DESC);
CREATE INDEX idx_session_fingerprint ON public.uag_sessions (fingerprint);
CREATE INDEX idx_session_agent ON public.uag_sessions (agent_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 2. UAG Events (事件明細表 - 熱數據)
-- ══════════════════════════════════════════════════════════════════════════════
DROP TABLE IF EXISTS public.uag_events CASCADE;
CREATE TABLE public.uag_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.uag_sessions(session_id) ON DELETE CASCADE,
    agent_id TEXT,
    property_id TEXT,                        -- 物件 ID
    district TEXT,                           -- 行政區
    duration INTEGER DEFAULT 0,              -- 該次停留秒數
    actions JSONB DEFAULT '{}'::jsonb,       -- 行為記錄
    focus TEXT[],                            -- 關注區塊 (可選)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_session_time ON public.uag_events (session_id, created_at DESC);
CREATE INDEX idx_property_agent ON public.uag_events (property_id, agent_id);
CREATE INDEX idx_events_created_at ON public.uag_events (created_at);

-- ══════════════════════════════════════════════════════════════════════════════
-- 3. UAG Events Archive (冷數據歸檔)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.uag_events_archive (
    LIKE public.uag_events INCLUDING ALL
);

-- ══════════════════════════════════════════════════════════════════════════════
-- 4. Materialized View: 快速排行榜
-- ══════════════════════════════════════════════════════════════════════════════
DROP MATERIALIZED VIEW IF EXISTS public.uag_lead_rankings;
CREATE MATERIALIZED VIEW public.uag_lead_rankings AS
SELECT
  session_id,
  agent_id,
  grade,
  last_active,
  CASE
    WHEN last_active > NOW() - INTERVAL '3 hours' THEN 'HOT'
    WHEN last_active > NOW() - INTERVAL '24 hours' THEN 'WARM'
    ELSE 'COLD'
  END as temperature,
  ROW_NUMBER() OVER (
    PARTITION BY agent_id
    ORDER BY
      CASE grade WHEN 'S' THEN 1 WHEN 'A' THEN 2 WHEN 'B' THEN 3 WHEN 'C' THEN 4 ELSE 5 END,
      last_active DESC
  ) as rank
FROM public.uag_sessions
WHERE grade IN ('S', 'A', 'B')
WITH DATA;

CREATE INDEX idx_lead_ranking ON public.uag_lead_rankings(agent_id, grade, rank);
-- UNIQUE INDEX for CONCURRENTLY refresh support
CREATE UNIQUE INDEX idx_lead_ranking_unique ON public.uag_lead_rankings(session_id);

-- ══════════════════════════════════════════════════════════════════════════════
-- 5. 分級計算函數
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION calculate_lead_grade(
  p_duration INTEGER,
  p_actions JSONB,
  p_revisits INTEGER,
  p_district_count INTEGER,
  p_competitor_duration INTEGER DEFAULT 0
) RETURNS CHAR(1) AS $$
BEGIN
  -- S: 強意願 + 長停留
  IF (p_actions->>'click_line' = '1' OR p_actions->>'click_call' = '1') THEN
     IF p_duration >= 120 OR p_competitor_duration >= 300 THEN
        RETURN 'S';
     END IF;
  END IF;

  -- A: 深度瀏覽
  IF p_duration >= 90 AND (p_actions->>'scroll_depth')::INT >= 80 THEN
    RETURN 'A';
  END IF;
  IF p_competitor_duration >= 180 AND p_duration >= 10 THEN
    RETURN 'A';
  END IF;

  -- B: 中度興趣 (含區域加分)
  IF p_duration >= 60 OR (p_revisits >= 2 AND p_duration >= 30) THEN
    IF p_district_count >= 3 THEN RETURN 'A'; END IF;
    RETURN 'B';
  END IF;

  -- C: 輕度興趣 (含區域加分)
  IF p_duration >= 20 THEN
    IF p_district_count >= 3 THEN RETURN 'B'; END IF;
    RETURN 'C';
  END IF;

  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ══════════════════════════════════════════════════════════════════════════════
-- 6. 歸檔函數 (定期執行)
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION archive_old_history()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE v_count INTEGER;
BEGIN
    WITH archived AS (
      INSERT INTO public.uag_events_archive
      SELECT * FROM public.uag_events WHERE created_at < NOW() - INTERVAL '3 hours'
      RETURNING id
    ),
    deleted AS (
      DELETE FROM public.uag_events WHERE id IN (SELECT id FROM archived)
      RETURNING id
    )
    SELECT COUNT(*) INTO v_count FROM deleted;
    RETURN v_count;
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 7. 核心 RPC: 追蹤事件並即時計算等級
-- ══════════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION track_uag_event_v8(
  p_session_id TEXT,
  p_agent_id TEXT,
  p_fingerprint TEXT,
  p_event_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session public.uag_sessions%ROWTYPE;
    v_new_summary JSONB;
    v_new_total_duration INTEGER;
    v_new_grade CHAR(1);
    v_district TEXT;
    v_pid TEXT;
    v_duration INTEGER;
    v_actions JSONB;
    v_district_count INTEGER;
    v_revisits INTEGER;
    v_competitor_duration INTEGER;
BEGIN
    -- 解析事件資料
    v_pid := p_event_data->>'property_id';
    v_district := p_event_data->>'district';
    v_duration := (p_event_data->>'duration')::INTEGER;
    v_actions := p_event_data->'actions';

    -- 1. Upsert Session
    INSERT INTO public.uag_sessions (session_id, agent_id, fingerprint, last_active)
    VALUES (p_session_id, p_agent_id, p_fingerprint, NOW())
    ON CONFLICT (session_id) DO UPDATE SET
        last_active = NOW(),
        agent_id = COALESCE(EXCLUDED.agent_id, public.uag_sessions.agent_id),
        fingerprint = COALESCE(EXCLUDED.fingerprint, public.uag_sessions.fingerprint)
    RETURNING * INTO v_session;

    -- 2. Insert Event
    INSERT INTO public.uag_events (session_id, agent_id, property_id, district, duration, actions, focus)
    VALUES (p_session_id, p_agent_id, v_pid, v_district, v_duration, v_actions,
            ARRAY(SELECT jsonb_array_elements_text(p_event_data->'focus')));

    -- 3. 更新 Summary
    v_new_summary := COALESCE(v_session.summary, '{}'::jsonb);
    IF v_district IS NOT NULL THEN
        v_new_summary := jsonb_set(
            v_new_summary,
            ARRAY['district_counts', v_district],
            to_jsonb(COALESCE((v_new_summary->'district_counts'->>v_district)::INT, 0) + 1)
        );
    END IF;

    -- 4. 聚合計算
    SELECT SUM(duration), COUNT(DISTINCT property_id), COUNT(*) FILTER (WHERE property_id = v_pid)
    INTO v_new_total_duration, v_district_count, v_revisits
    FROM public.uag_events WHERE session_id = p_session_id;

    SELECT SUM(duration) INTO v_competitor_duration
    FROM public.uag_events
    WHERE session_id = p_session_id AND district = v_district AND property_id != v_pid;

    -- 5. 計算等級
    v_new_grade := calculate_lead_grade(
        (SELECT SUM(duration) FROM public.uag_events WHERE session_id = p_session_id AND property_id = v_pid)::INT,
        v_actions,
        v_revisits,
        (SELECT COUNT(DISTINCT property_id) FROM public.uag_events WHERE session_id = p_session_id AND district = v_district)::INT,
        COALESCE(v_competitor_duration, 0)
    );

    -- 6. 更新 Session (等級只升不降)
    UPDATE public.uag_sessions
    SET
        total_duration = v_new_total_duration,
        property_count = (SELECT COUNT(DISTINCT property_id) FROM public.uag_events WHERE session_id = p_session_id),
        summary = v_new_summary
    WHERE session_id = p_session_id;

    UPDATE public.uag_sessions
    SET grade = v_new_grade
    WHERE session_id = p_session_id
      AND (CASE grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END)
        < (CASE v_new_grade WHEN 'S' THEN 5 WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 ELSE 1 END);

    RETURN jsonb_build_object('success', true, 'grade', v_new_grade);
END;
$$;

-- ══════════════════════════════════════════════════════════════════════════════
-- 8. RLS 政策 (Row Level Security)
-- ══════════════════════════════════════════════════════════════════════════════
-- NOTE: agent_id 格式必須與 auth.uid()::text 一致
-- 如果 agent_id 使用自定義格式（如 "agent_123"），需修改 USING 條件
-- 例如: USING (agent_id = (SELECT custom_agent_id FROM profiles WHERE id = auth.uid()))

ALTER TABLE public.uag_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uag_events ENABLE ROW LEVEL SECURITY;

-- 允許匿名寫入 (追蹤用)
CREATE POLICY "Allow anon insert" ON public.uag_sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert" ON public.uag_events FOR INSERT TO anon WITH CHECK (true);

-- 業務只能看自己的客戶 (假設 agent_id = auth.uid()::text)
CREATE POLICY "Agent can read own sessions" ON public.uag_sessions
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid()::text);

CREATE POLICY "Agent can read own events" ON public.uag_events
  FOR SELECT TO authenticated
  USING (agent_id = auth.uid()::text);
